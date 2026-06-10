import { seedUniversities } from "../src/data/universities";
import {
  buildUniversityAliasMap,
  canonicalUniversityId,
  universityIdCandidates,
  type UniversityAliasMap,
} from "../src/data/universityAliases";
import type { OfferSourceKind, University, UniversityAlias, UniversityOfferRecord } from "../src/types";

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
  tags_json: string;
  status: University["status"];
  updated_at: string;
};

type OfferRecordRow = {
  id: string;
  year: number;
  university_id: string;
  university_name_zh?: string;
  university_name_en?: string;
  mainland_school_id: string | null;
  mainland_school_name_zh?: string | null;
  offer_count: number;
  applicant_count: number | null;
  enrolled_count: number | null;
  degree_level: UniversityOfferRecord["degreeLevel"];
  source_name: string;
  source_url: string | null;
  source_snapshot: string | null;
  source_kind: OfferSourceKind;
  filters_json: string;
  notes: string;
  created_at: string;
  updated_at: string;
};

type UniversityAliasRow = {
  alias: string;
  university_id: string;
  university_name_zh?: string;
  university_name_en?: string;
  notes: string;
  created_at: string;
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
    tags: parseJson(row.tags_json, []),
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
    JSON.stringify(university.tags ?? []),
    university.status,
    university.updatedAt,
  ];
}

function rowToOfferRecord(row: OfferRecordRow, aliases: UniversityAliasMap = {}): UniversityOfferRecord {
  return {
    id: row.id,
    year: row.year,
    universityId: canonicalUniversityId(row.university_id, aliases),
    universityNameZh: row.university_name_zh,
    universityNameEn: row.university_name_en,
    mainlandSchoolId: row.mainland_school_id ?? undefined,
    mainlandSchoolNameZh: row.mainland_school_name_zh ?? undefined,
    offerCount: row.offer_count,
    applicantCount: row.applicant_count ?? undefined,
    enrolledCount: row.enrolled_count ?? undefined,
    degreeLevel: row.degree_level,
    sourceName: row.source_name,
    sourceUrl: row.source_url ?? undefined,
    sourceSnapshot: row.source_snapshot ?? undefined,
    sourceKind: row.source_kind,
    filters: parseJson(row.filters_json, {}),
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToUniversityAlias(row: UniversityAliasRow): UniversityAlias {
  return {
    alias: row.alias,
    universityId: row.university_id,
    universityNameZh: row.university_name_zh,
    universityNameEn: row.university_name_en,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function offerRecordParams(offerRecord: UniversityOfferRecord) {
  return [
    offerRecord.id,
    offerRecord.year,
    offerRecord.universityId,
    offerRecord.mainlandSchoolId ?? null,
    offerRecord.offerCount,
    offerRecord.applicantCount ?? null,
    offerRecord.enrolledCount ?? null,
    offerRecord.degreeLevel,
    offerRecord.sourceName,
    offerRecord.sourceUrl ?? null,
    offerRecord.sourceSnapshot ?? null,
    offerRecord.sourceKind,
    JSON.stringify(offerRecord.filters ?? {}),
    offerRecord.notes,
    offerRecord.createdAt,
    offerRecord.updatedAt,
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
    tags: university.tags ?? [],
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

function validateOfferRecord(value: unknown, aliases: UniversityAliasMap = {}): UniversityOfferRecord {
  const offerRecord = value as Partial<UniversityOfferRecord>;
  const year = Number(offerRecord.year);
  const offerCount = Number(offerRecord.offerCount);
  const universityId =
    typeof offerRecord.universityId === "string"
      ? canonicalUniversityId(offerRecord.universityId.trim(), aliases)
      : "";
  const degreeLevel = offerRecord.degreeLevel ?? "undergraduate";
  const sourceKind = offerRecord.sourceKind ?? "screenshot";
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    throw new Error("年份格式不正确");
  }
  if (!universityId) {
    throw new Error("必须选择世界大学");
  }
  if (!Number.isInteger(offerCount) || offerCount < 0) {
    throw new Error("Offer 数必须是非负整数");
  }
  if (!["undergraduate", "graduate", "foundation", "other"].includes(degreeLevel)) {
    throw new Error("申请阶段不受支持");
  }
  if (!["screenshot", "official", "api", "manual"].includes(sourceKind)) {
    throw new Error("来源类型不受支持");
  }
  if (!offerRecord.sourceName?.trim()) {
    throw new Error("必须填写数据来源");
  }
  const applicantCount =
    offerRecord.applicantCount === undefined || offerRecord.applicantCount === null
      ? undefined
      : Number(offerRecord.applicantCount);
  const enrolledCount =
    offerRecord.enrolledCount === undefined || offerRecord.enrolledCount === null
      ? undefined
      : Number(offerRecord.enrolledCount);
  if (applicantCount !== undefined && (!Number.isInteger(applicantCount) || applicantCount < 0)) {
    throw new Error("申请人数必须是非负整数");
  }
  if (enrolledCount !== undefined && (!Number.isInteger(enrolledCount) || enrolledCount < 0)) {
    throw new Error("入读人数必须是非负整数");
  }
  const now = new Date().toISOString();
  return {
    id: offerRecord.id?.trim() || crypto.randomUUID(),
    year,
    universityId,
    mainlandSchoolId: offerRecord.mainlandSchoolId?.trim() || undefined,
    offerCount,
    applicantCount,
    enrolledCount,
    degreeLevel,
    sourceName: offerRecord.sourceName.trim(),
    sourceUrl: offerRecord.sourceUrl?.trim() || undefined,
    sourceSnapshot: offerRecord.sourceSnapshot?.trim() || undefined,
    sourceKind,
    filters: offerRecord.filters ?? {},
    notes: offerRecord.notes?.trim() || "",
    createdAt: offerRecord.createdAt || now,
    updatedAt: now,
  };
}

function normalizeAlias(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function validateUniversityAlias(value: unknown): UniversityAlias {
  const input = value as Partial<UniversityAlias>;
  const alias = typeof input.alias === "string" ? normalizeAlias(input.alias) : "";
  const universityId =
    typeof input.universityId === "string" ? normalizeAlias(input.universityId) : "";
  if (!alias) throw new Error("短链不能为空");
  if (!universityId) throw new Error("必须选择目标大学");
  if (alias === universityId) throw new Error("短链不能和大学 ID 完全相同");
  const now = new Date().toISOString();
  return {
    alias,
    universityId,
    notes: input.notes?.trim() || "",
    createdAt: input.createdAt || now,
    updatedAt: now,
  };
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

async function listUniversityAliases(env: Env) {
  if (!env.DB) return { aliases: [] as UniversityAlias[] };
  try {
    const result = await env.DB.prepare(
      `SELECT
        a.*,
        u.name_zh AS university_name_zh,
        u.name_en AS university_name_en
      FROM university_aliases a
      LEFT JOIN universities u ON u.id = a.university_id
      ORDER BY a.alias`,
    ).all<UniversityAliasRow>();
    return { aliases: result.results.map(rowToUniversityAlias) };
  } catch {
    return { aliases: [] as UniversityAlias[] };
  }
}

async function listUniversities(env: Env) {
  if (!env.DB) return { universities: seedUniversities, source: "seed" };
  try {
    const { aliases } = await listUniversityAliases(env);
    const aliasMap = buildUniversityAliasMap(aliases);
    const result = await env.DB.prepare(
      "SELECT * FROM universities ORDER BY qs_rank IS NULL, qs_rank, name_en",
    ).all<UniversityRow>();
    if (!result.results.length) return { universities: seedUniversities, source: "seed" };
    const merged = new Map(seedUniversities.map((university) => [university.id, university]));
    for (const row of result.results) {
      const canonicalId = canonicalUniversityId(row.id, aliasMap);
      if (row.status === "draft") merged.delete(canonicalId);
      else {
        const databaseUniversity = rowToUniversity(row);
        const base = merged.get(canonicalId);
        const normalizedDatabaseUniversity = {
          ...databaseUniversity,
          id: canonicalId,
          slug: canonicalId,
        };
        merged.set(
          canonicalId,
          base && !normalizedDatabaseUniversity.rankingSystem
            ? {
                ...base,
                ...normalizedDatabaseUniversity,
                qsRank: base.qsRank,
                rankYear: base.rankYear,
                rankingSystem: base.rankingSystem,
                enrollment: normalizedDatabaseUniversity.enrollment ?? base.enrollment,
                tags: mergeTags(base.tags, normalizedDatabaseUniversity.tags),
              }
            : normalizedDatabaseUniversity,
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
      requirements_json, admission_history_json, sources_json, tags_json, status, updated_at
    ) VALUES (${Array.from({ length: 26 }, () => "?").join(",")})
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
      sources_json=excluded.sources_json, tags_json=excluded.tags_json, status=excluded.status,
      updated_at=excluded.updated_at`,
  )
    .bind(...universityParams(university))
    .run();
  return json({ university });
}

async function backfillMissingUniversities(env: Env) {
  if (!env.DB) return json({ error: "D1 数据库尚未绑定" }, { status: 503 });
  const { aliases } = await listUniversityAliases(env);
  const aliasMap = buildUniversityAliasMap(aliases);
  const existing = await env.DB.prepare("SELECT id FROM universities").all<{ id: string }>();
  const existingCanonicalIds = new Set(
    existing.results.map((row) => canonicalUniversityId(row.id, aliasMap)),
  );
  let inserted = 0;
  let skipped = 0;

  for (const university of seedUniversities) {
    const canonicalId = canonicalUniversityId(university.id, aliasMap);
    if (existingCanonicalIds.has(canonicalId)) {
      skipped += 1;
      continue;
    }
    const record = { ...university, id: canonicalId, slug: canonicalId };
    await env.DB.prepare(
      `INSERT INTO universities (
        id, slug, name_en, name_zh, abbreviation, country, country_code, city,
        latitude, longitude, qs_rank, rank_year, ranking_system, enrollment, website, admissions_url,
        tuition_json, mainland_china_intake_json, strengths_json, housing_json,
        requirements_json, admission_history_json, sources_json, tags_json, status, updated_at
      ) VALUES (${Array.from({ length: 26 }, () => "?").join(",")})`,
    )
      .bind(...universityParams(record))
      .run();
    existingCanonicalIds.add(canonicalId);
    inserted += 1;
  }

  return json({ inserted, skipped, total: seedUniversities.length });
}

async function listOfferRecords(env: Env, url: URL) {
  if (!env.DB) return { offerRecords: [] };
  const { aliases } = await listUniversityAliases(env);
  const aliasMap = buildUniversityAliasMap(aliases);
  const universityId = url.searchParams.get("universityId");
  const year = url.searchParams.get("year");
  const clauses: string[] = [];
  const params: (string | number)[] = [];

  if (universityId) {
    const ids = universityIdCandidates(universityId, aliasMap);
    clauses.push(`o.university_id IN (${ids.map(() => "?").join(",")})`);
    params.push(...ids);
  }
  if (year) {
    clauses.push("o.year = ?");
    params.push(Number(year));
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const result = await env.DB.prepare(
    `SELECT
      o.*,
      u.name_zh AS university_name_zh,
      u.name_en AS university_name_en,
      m.name_zh AS mainland_school_name_zh
    FROM university_offer_records o
    LEFT JOIN universities u ON u.id = o.university_id
    LEFT JOIN mainland_schools m ON m.id = o.mainland_school_id
    ${where}
    ORDER BY o.year DESC, o.offer_count DESC, u.name_en`,
  )
    .bind(...params)
    .all<OfferRecordRow>();
  return { offerRecords: result.results.map((row) => rowToOfferRecord(row, aliasMap)) };
}

async function saveOfferRecord(env: Env, request: Request) {
  if (!env.DB) return json({ error: "D1 数据库尚未绑定，请先完成 Cloudflare 配置" }, { status: 503 });
  const { aliases } = await listUniversityAliases(env);
  const aliasMap = buildUniversityAliasMap(aliases);
  const offerRecord = validateOfferRecord(await request.json(), aliasMap);
  await env.DB.prepare(
    `INSERT INTO university_offer_records (
      id, year, university_id, mainland_school_id, offer_count, applicant_count, enrolled_count,
      degree_level, source_name, source_url, source_snapshot, source_kind, filters_json,
      notes, created_at, updated_at
    ) VALUES (${Array.from({ length: 16 }, () => "?").join(",")})
    ON CONFLICT(id) DO UPDATE SET
      year=excluded.year,
      university_id=excluded.university_id,
      mainland_school_id=excluded.mainland_school_id,
      offer_count=excluded.offer_count,
      applicant_count=excluded.applicant_count,
      enrolled_count=excluded.enrolled_count,
      degree_level=excluded.degree_level,
      source_name=excluded.source_name,
      source_url=excluded.source_url,
      source_snapshot=excluded.source_snapshot,
      source_kind=excluded.source_kind,
      filters_json=excluded.filters_json,
      notes=excluded.notes,
      updated_at=excluded.updated_at`,
  )
    .bind(...offerRecordParams(offerRecord))
    .run();
  return json({ offerRecord });
}

async function saveUniversityAlias(env: Env, request: Request) {
  if (!env.DB) return json({ error: "D1 数据库尚未绑定，请先完成 Cloudflare 配置" }, { status: 503 });
  const alias = validateUniversityAlias(await request.json());
  const target = await env.DB.prepare("SELECT id FROM universities WHERE id = ?")
    .bind(alias.universityId)
    .first<{ id: string }>();
  if (!target) {
    return json({ error: `目标大学不存在：${alias.universityId}` }, { status: 400 });
  }
  await env.DB.prepare(
    `INSERT INTO university_aliases (alias, university_id, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(alias) DO UPDATE SET
      university_id=excluded.university_id,
      notes=excluded.notes,
      updated_at=excluded.updated_at`,
  )
    .bind(alias.alias, alias.universityId, alias.notes, alias.createdAt, alias.updatedAt)
    .run();
  return json({ alias });
}

async function handleApi(request: Request, env: Env) {
  const url = new URL(request.url);
  if (url.pathname === "/api/universities" && request.method === "GET") {
    return json(await listUniversities(env), {
      headers: { "Cache-Control": "public, max-age=60, s-maxage=300" },
    });
  }

  if (url.pathname === "/api/university-aliases" && request.method === "GET") {
    return json(await listUniversityAliases(env), {
      headers: { "Cache-Control": "public, max-age=60, s-maxage=300" },
    });
  }

  if (url.pathname === "/api/offer-records" && request.method === "GET") {
    try {
      return json(await listOfferRecords(env, url), {
        headers: { "Cache-Control": "public, max-age=60, s-maxage=300" },
      });
    } catch {
      return json({ offerRecords: [] });
    }
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

  if (url.pathname === "/api/admin/universities/backfill-missing" && request.method === "POST") {
    try {
      return await backfillMissingUniversities(env);
    } catch (error) {
      return json(
        { error: error instanceof Error ? error.message : "补齐失败" },
        { status: 400 },
      );
    }
  }

  if (url.pathname === "/api/admin/offer-records" && request.method === "POST") {
    try {
      return await saveOfferRecord(env, request);
    } catch (error) {
      return json(
        { error: error instanceof Error ? error.message : "保存失败" },
        { status: 400 },
      );
    }
  }

  if (url.pathname === "/api/admin/university-aliases" && request.method === "POST") {
    try {
      return await saveUniversityAlias(env, request);
    } catch (error) {
      return json(
        { error: error instanceof Error ? error.message : "保存失败" },
        { status: 400 },
      );
    }
  }

  if (url.pathname.startsWith("/api/admin/university-aliases/") && request.method === "DELETE") {
    if (!env.DB) return json({ error: "D1 数据库尚未绑定" }, { status: 503 });
    const alias = normalizeAlias(decodeURIComponent(url.pathname.split("/").pop() || ""));
    await env.DB.prepare("DELETE FROM university_aliases WHERE alias = ?").bind(alias).run();
    return json({ ok: true });
  }

  if (url.pathname.startsWith("/api/admin/offer-records/") && request.method === "DELETE") {
    if (!env.DB) return json({ error: "D1 数据库尚未绑定" }, { status: 503 });
    const id = decodeURIComponent(url.pathname.split("/").pop() || "");
    await env.DB.prepare("DELETE FROM university_offer_records WHERE id = ?").bind(id).run();
    return json({ ok: true });
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

function mergeTags(primary: string[] = [], secondary: string[] = []) {
  return [...new Set([...primary, ...secondary])];
}
