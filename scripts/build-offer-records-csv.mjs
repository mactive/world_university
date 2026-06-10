import fs from "node:fs";
import path from "node:path";

const input =
  process.argv[2] ||
  "/Users/bytedance/Project/CreativeCloud/ic_cp_data_analyse/meiben/offer_rank_pages_1_51.json";
const output = process.argv[3] || "data/offer-records.csv";
const unmatchedOutput = process.argv[4] || "data/offer-records-unmatched.json";

const root = process.cwd();
const payload = JSON.parse(fs.readFileSync(path.resolve(input), "utf8"));
const records = payload.records ?? payload.data ?? [];
const meta = payload.meta ?? {};
const params = meta.params ?? {};
const year = Number(params.year ?? 2026);
const catalog = JSON.parse(fs.readFileSync(path.join(root, "src/data/catalog.generated.json"), "utf8"));

const universities = [
  ...catalog,
  {
    id: "university-of-oxford",
    nameEn: "University of Oxford",
    nameZh: "牛津大学",
    abbreviation: "Oxford",
  },
  {
    id: "university-of-cambridge",
    nameEn: "University of Cambridge",
    nameZh: "剑桥大学",
    abbreviation: "Cambridge",
  },
  {
    id: "imperial-college-london",
    nameEn: "Imperial College London",
    nameZh: "帝国理工学院",
    abbreviation: "Imperial",
  },
  {
    id: "university-college-london",
    nameEn: "University College London",
    nameZh: "伦敦大学学院",
    abbreviation: "UCL",
  },
];

const manualAliases = new Map(
  Object.entries({
    "cambridge university": "university-of-cambridge",
    "the university of cambridge": "university-of-cambridge",
    "the university of oxford": "university-of-oxford",
    "the london school of economics and political science": "london-school-of-economics-and-political-science",
    "london school of economics and political science": "london-school-of-economics-and-political-science",
    "university of california los angeles": "university-of-california-los-angeles",
    "university of california berkeley": "university-of-california-berkeley",
    "university of california san diego": "university-of-california-san-diego",
    "university of california davis": "university-of-california-davis",
    "university of california irvine": "university-of-california-irvine",
    "university of california santa barbara": "university-of-california-santa-barbara",
    "university of california santa cruz": "university-of-california-santa-cruz",
    "university of washington seattle": "university-of-washington",
    "university of illinois at urbana champaign": "university-of-illinois-urbana-champaign",
    "case western reverse university": "case-western-reserve-university",
    "case western reserve university": "case-western-reserve-university",
    "college of william and mary": "william-and-mary",
    "washington university st louis": "washington-university-in-st-louis",
    "washington university in st louis": "washington-university-in-st-louis",
    "stony brook university suny": "stony-brook-university",
    "university at buffalo suny": "university-at-buffalo",
    "suny binghamton": "binghamton-university",
    "nanyang technological university singapore ntu": "nanyang-technological-university",
    "national university of singapore nus": "national-university-of-singapore",
    "north carolina state university": "north-carolina-state-university-at-raleigh",
    "pennsylvania state university university park": "pennsylvania-state-university",
    "columbia university in the city of new york": "columbia-university",
    "georgia institute of technology": "georgia-institute-of-technology-main-campus",
    "university of maryland": "university-of-maryland-college-park",
    "purdue university west lafayette": "purdue-university",
    "rutgers state university of new jersey newark": "rutgers-university-newark",
    "rutgers the state university of new jersey newark": "rutgers-university-newark",
    "university of illinois at chicago": "university-of-illinois-chicago",
  }).map(([key, value]) => [normalize(key), value]),
);

const lookup = new Map();
const ids = new Set(universities.map((university) => university.id));
for (const university of universities) {
  for (const key of [
    university.id,
    university.slug,
    university.nameEn,
    university.nameZh,
  ]) {
    if (key) lookup.set(normalize(key), university.id);
  }
}

const byUniversity = new Map();
const unmatched = [];

for (const record of records) {
  const universityId = matchUniversity(record);
  if (!universityId) {
    unmatched.push({
      rank: record.rank,
      title: record.title,
      titleEn: record.titleEn,
      allStu: record.allStu,
      sourceId: record.id,
    });
    continue;
  }
  const offerCount = Number(record.allStu);
  if (!Number.isInteger(offerCount) || offerCount < 0) {
    unmatched.push({
      rank: record.rank,
      title: record.title,
      titleEn: record.titleEn,
      allStu: record.allStu,
      sourceId: record.id,
      reason: "invalid allStu",
    });
    continue;
  }
  const current =
    byUniversity.get(universityId) ??
    {
      year,
      university_id: universityId,
      university_name: record.titleEn,
      offer_count: 0,
      degree_level: "undergraduate",
      source_name: "翠鹿升学榜",
      source_kind: "api",
      source_snapshot: path.basename(input),
      source_url: meta.source ?? "",
      sourceRecords: [],
      mainland_school_id: "",
      applicant_count: "",
      enrolled_count: "",
    };
  current.offer_count += offerCount;
  current.sourceRecords.push({
    rank: record.rank ?? "",
    sourceSchoolId: record.id ?? "",
    title: record.title ?? "",
    titleEn: record.titleEn ?? "",
    allStu: record.allStu ?? "",
    cnStu: record.cnStu ?? "",
    outStu: record.outStu ?? "",
  });
  byUniversity.set(universityId, current);
}

const rows = [...byUniversity.values()].map((row) => {
  const sourceRecords = row.sourceRecords.sort((a, b) => Number(a.rank) - Number(b.rank));
  return {
    year,
    university_id: row.university_id,
    university_name: row.university_name,
    offer_count: row.offer_count,
    degree_level: "undergraduate",
    source_name: "翠鹿升学榜",
    source_kind: "api",
    source_snapshot: path.basename(input),
    source_url: meta.source ?? "",
    filters_json: JSON.stringify({
      degree: "本科",
      eduLevel: params.eduLevel ?? "",
      ranking: "中国学生榜",
      areaRankId: params.areaRankId ?? "",
      sortBy: params.sortBy ?? "",
      kw: params.kw ?? "",
      sourceRecords,
    }),
    notes:
      sourceRecords.length === 1
        ? `allStu=${sourceRecords[0].allStu}; cnStu=${sourceRecords[0].cnStu}; outStu=${sourceRecords[0].outStu}`
        : `${sourceRecords.length} 条翠鹿记录汇总；allStu 合计=${row.offer_count}`,
    mainland_school_id: "",
    applicant_count: "",
    enrolled_count: "",
  };
});

rows.sort((a, b) => b.offer_count - a.offer_count || a.university_id.localeCompare(b.university_id));

fs.mkdirSync(path.dirname(path.resolve(output)), { recursive: true });
fs.writeFileSync(path.resolve(output), toCsv(rows));
fs.writeFileSync(
  path.resolve(unmatchedOutput),
  JSON.stringify(
    {
      input,
      totalRecords: records.length,
      matched: rows.length,
      unmatched: unmatched.length,
      unmatchedRecords: unmatched,
    },
    null,
    2,
  ),
);

console.log(
  JSON.stringify(
    {
      input,
      output,
      unmatchedOutput,
      totalRecords: records.length,
      matched: rows.length,
      unmatched: unmatched.length,
    },
    null,
    2,
  ),
);

function matchUniversity(record) {
  const candidates = record.titleEn ? [record.titleEn] : [record.title];
  for (const value of candidates) {
    const key = normalize(value);
    const alias = manualAliases.get(key);
    if (alias && ids.has(alias)) return alias;
    const exact = lookup.get(key);
    if (exact) return exact;
  }
  return undefined;
}

function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[’']/g, "")
    .replace(/\bthe\b/g, " ")
    .replace(/[,，]/g, " ")
    .replace(/[–—-]+/g, " ")
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toCsv(rows) {
  const headers = [
    "year",
    "university_id",
    "university_name",
    "offer_count",
    "degree_level",
    "source_name",
    "source_kind",
    "source_snapshot",
    "source_url",
    "filters_json",
    "notes",
    "mainland_school_id",
    "applicant_count",
    "enrolled_count",
  ];
  return [headers.join(","), ...rows.map((row) => headers.map((header) => csvValue(row[header])).join(","))].join(
    "\n",
  ) + "\n";
}

function csvValue(value) {
  if (value === null || value === undefined) return "";
  const text = String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}
