import { seedUniversities } from "../src/data/universities";
import type { University } from "../src/types";

interface Env {
  DB?: D1Database;
  ADMIN_PASSWORD?: string;
  ADMIN_SESSION_SECRET?: string;
}

type UniversityRow = {
  id: string;
  slug: string;
  name_en: string;
  name_zh: string;
  abbreviation: string;
  country: string;
  country_code: University["countryCode"];
  city: string;
  latitude: number;
  longitude: number;
  qs_rank: number | null;
  rank_year: number | null;
  ranking_system: University["rankingSystem"] | null;
  enrollment: number | null;
  website: string;
  admissions_url: string;
  tuition_json: string | null;
  mainland_china_intake_json: string | null;
  strengths_json: string;
  housing_json: string | null;
  requirements_json: string;
  admission_history_json: string;
  sources_json: string;
  status: University["status"];
  updated_at: string;
};

const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

function json(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { ...jsonHeaders, ...init.headers },
  });
}

function parseJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function rowToUniversity(row: UniversityRow): University {
  return {
    id: row.id,
    slug: row.slug,
    nameEn: row.name_en,
    nameZh: row.name_zh,
    abbreviation: row.abbreviation,
    country: row.country,
    countryCode: row.country_code,
    city: row.city,
    latitude: row.latitude,
    longitude: row.longitude,
    qsRank: row.qs_rank ?? undefined,
    rankYear: row.rank_year ?? undefined,
    rankingSystem: row.ranking_system ?? undefined,
    enrollment: row.enrollment ?? undefined,
    website: row.website,
    admissionsUrl: row.admissions_url,
    tuition: parseJson(row.tuition_json, undefined),
    mainlandChinaIntake: parseJson(row.mainland_china_intake_json, undefined),
    strengths: parseJson(row.strengths_json, []),
    housing: parseJson(row.housing_json, undefined),
    requirements: parseJson(row.requirements_json, {
      summary: "",
      standardized: "",
      ap: "",
      competitions: "",
      language: "",
      year: new Date().getFullYear(),
    }),
    admissionHistory: parseJson(row.admission_history_json, []),
    sources: parseJson(row.sources_json, []),
    status: row.status,
    updatedAt: row.updated_at,
  };
}

function universityParams(university: University) {
  return [
    university.id,
    university.slug,
    university.nameEn,
    university.nameZh,
    university.abbreviation,
    university.country,
    university.countryCode,
    university.city,
    university.latitude,
    university.longitude,
    university.qsRank ?? null,
    university.rankYear ?? null,
    university.rankingSystem ?? null,
    university.enrollment ?? null,
    university.website,
    university.admissionsUrl,
    university.tuition ? JSON.stringify(university.tuition) : null,
    university.mainlandChinaIntake ? JSON.stringify(university.mainlandChinaIntake) : null,
    JSON.stringify(university.strengths ?? []),
    university.housing ? JSON.stringify(university.housing) : null,
    JSON.stringify(university.requirements),
    JSON.stringify(university.admissionHistory ?? []),
    JSON.stringify(university.sources ?? []),
    university.status,
    university.updatedAt,
  ];
}

function validateUniversity(value: unknown): University {
  const university = value as Partial<University>;
  const required = [
    university.id,
    university.slug,
    university.nameEn,
    university.nameZh,
    university.country,
    university.countryCode,
    university.city,
  ];
  if (required.some((field) => typeof field !== "string" || !field.trim())) {
    throw new Error("学校 ID、名称、国家、地区和城市不能为空");
  }
  if (!Number.isFinite(university.latitude) || !Number.isFinite(university.longitude)) {
    throw new Error("经纬度格式不正确");
  }
  if (!["US", "CA", "UK", "AU", "SG", "HK"].includes(university.countryCode!)) {
    throw new Error("地区代码不受支持");
  }
  return {
    ...university,
    abbreviation: university.abbreviation ?? "",
    website: university.website ?? "",
    admissionsUrl: university.admissionsUrl ?? "",
    strengths: university.strengths ?? [],
    requirements: university.requirements ?? {
      summary: "",
      standardized: "",
      ap: "",
      competitions: "",
      language: "",
      year: new Date().getFullYear(),
    },
    admissionHistory: university.admissionHistory ?? [],
    sources: university.sources ?? [],
    status: university.status === "draft" ? "draft" : "published",
    updatedAt: new Date().toISOString(),
  } as University;
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function textToBase64Url(value: string) {
  return bytesToBase64Url(new TextEncoder().encode(value));
}

async function sign(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return bytesToBase64Url(new Uint8Array(signature));
}

async function createSession(secret: string) {
  const payload = textToBase64Url(
    JSON.stringify({ role: "admin", exp: Date.now() + 7 * 24 * 60 * 60 * 1000 }),
  );
  return `${payload}.${await sign(payload, secret)}`;
}

function getCookie(request: Request, name: string) {
  const cookie = request.headers.get("Cookie") ?? "";
  const match = cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  return match?.slice(name.length + 1);
}

async function isAuthenticated(request: Request, env: Env) {
  const token = getCookie(request, "wu_session");
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  const secret = env.ADMIN_SESSION_SECRET || "local-development-session-secret";
  if ((await sign(payload, secret)) !== signature) return false;
  try {
    const decoded = JSON.parse(
      new TextDecoder().decode(
        Uint8Array.from(
          atob(payload.replaceAll("-", "+").replaceAll("_", "/")),
          (char) => char.charCodeAt(0),
        ),
      ),
    ) as { exp: number; role: string };
    return decoded.role === "admin" && decoded.exp > Date.now();
  } catch {
    return false;
  }
}

async function listUniversities(env: Env) {
  if (!env.DB) return { universities: seedUniversities, source: "seed" };
  try {
    const result = await env.DB.prepare(
      "SELECT * FROM universities ORDER BY qs_rank IS NULL, qs_rank, name_en",
    ).all<UniversityRow>();
    if (!result.results.length) return { universities: seedUniversities, source: "seed" };
    const merged = new Map(seedUniversities.map((university) => [university.id, university]));
    for (const row of result.results) {
      if (row.status === "draft") merged.delete(row.id);
      else {
        const databaseUniversity = rowToUniversity(row);
        const base = merged.get(row.id);
        merged.set(
          row.id,
          base && !databaseUniversity.rankingSystem
            ? {
                ...base,
                ...databaseUniversity,
                qsRank: base.qsRank,
                rankYear: base.rankYear,
                rankingSystem: base.rankingSystem,
                enrollment: databaseUniversity.enrollment ?? base.enrollment,
              }
            : databaseUniversity,
        );
      }
    }
    return {
      universities: [...merged.values()].sort(
        (a, b) => (a.qsRank ?? 9999) - (b.qsRank ?? 9999),
      ),
      source: "d1+seed",
    };
  } catch {
    return { universities: seedUniversities, source: "seed" };
  }
}

async function saveUniversity(env: Env, request: Request) {
  if (!env.DB) return json({ error: "D1 数据库尚未绑定，请先完成 Cloudflare 配置" }, { status: 503 });
  const university = validateUniversity(await request.json());
  await env.DB.prepare(
    `INSERT INTO universities (
      id, slug, name_en, name_zh, abbreviation, country, country_code, city,
      latitude, longitude, qs_rank, rank_year, ranking_system, enrollment, website, admissions_url,
      tuition_json, mainland_china_intake_json, strengths_json, housing_json,
      requirements_json, admission_history_json, sources_json, status, updated_at
    ) VALUES (${Array.from({ length: 25 }, () => "?").join(",")})
    ON CONFLICT(id) DO UPDATE SET
      slug=excluded.slug, name_en=excluded.name_en, name_zh=excluded.name_zh,
      abbreviation=excluded.abbreviation, country=excluded.country,
      country_code=excluded.country_code, city=excluded.city,
      latitude=excluded.latitude, longitude=excluded.longitude,
      qs_rank=excluded.qs_rank, rank_year=excluded.rank_year,
      ranking_system=excluded.ranking_system, enrollment=excluded.enrollment,
      website=excluded.website, admissions_url=excluded.admissions_url,
      tuition_json=excluded.tuition_json,
      mainland_china_intake_json=excluded.mainland_china_intake_json,
      strengths_json=excluded.strengths_json, housing_json=excluded.housing_json,
      requirements_json=excluded.requirements_json,
      admission_history_json=excluded.admission_history_json,
      sources_json=excluded.sources_json, status=excluded.status,
      updated_at=excluded.updated_at`,
  )
    .bind(...universityParams(university))
    .run();
  return json({ university });
}

async function handleApi(request: Request, env: Env) {
  const url = new URL(request.url);
  if (url.pathname === "/api/universities" && request.method === "GET") {
    return json(await listUniversities(env), {
      headers: { "Cache-Control": "public, max-age=60, s-maxage=300" },
    });
  }

  if (url.pathname === "/api/admin/login" && request.method === "POST") {
    const { password } = (await request.json()) as { password?: string };
    const expected = env.ADMIN_PASSWORD || "ChangeMe2026!";
    if (!password || password !== expected) {
      return json({ error: "密码不正确" }, { status: 401 });
    }
    const session = await createSession(
      env.ADMIN_SESSION_SECRET || "local-development-session-secret",
    );
    const secure = url.protocol === "https:" ? "; Secure" : "";
    return json(
      { ok: true },
      {
        headers: {
          "Set-Cookie": `wu_session=${session}; Path=/; HttpOnly; SameSite=Strict; Max-Age=604800${secure}`,
        },
      },
    );
  }

  if (url.pathname === "/api/admin/logout" && request.method === "POST") {
    return json(
      { ok: true },
      {
        headers: {
          "Set-Cookie": "wu_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0",
        },
      },
    );
  }

  if (url.pathname === "/api/admin/session" && request.method === "GET") {
    return json({ authenticated: await isAuthenticated(request, env) });
  }

  if (url.pathname.startsWith("/api/admin/") && !(await isAuthenticated(request, env))) {
    return json({ error: "请先登录管理后台" }, { status: 401 });
  }

  if (url.pathname === "/api/admin/universities" && request.method === "POST") {
    try {
      return await saveUniversity(env, request);
    } catch (error) {
      return json(
        { error: error instanceof Error ? error.message : "保存失败" },
        { status: 400 },
      );
    }
  }

  if (url.pathname.startsWith("/api/admin/universities/") && request.method === "DELETE") {
    if (!env.DB) return json({ error: "D1 数据库尚未绑定" }, { status: 503 });
    const id = decodeURIComponent(url.pathname.split("/").pop() || "");
    await env.DB.prepare("DELETE FROM universities WHERE id = ?").bind(id).run();
    return json({ ok: true });
  }

  return json({ error: "Not found" }, { status: 404 });
}

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) return handleApi(request, env);
    return new Response("Not found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
