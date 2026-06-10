import { createReadStream } from "node:fs";
import { access, mkdir, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { parse } from "csv-parse";

const wikidataApi = "https://www.wikidata.org/w/api.php";
const scorecardZipUrl =
  "https://ed-public-download.scorecard.network/downloads/Most-Recent-Cohorts-Institution_03232026.zip";
const scorecardZipPath = "/tmp/Most-Recent-Cohorts-Institution_03232026.zip";
const scorecardCsvPath =
  "/tmp/world-university-scorecard/Most-Recent-Cohorts-Institution.csv";
const execFileAsync = promisify(execFile);

const usRanked = [
  [1, "Princeton University"],
  [2, "Massachusetts Institute of Technology"],
  [3, "Harvard University"],
  [4, "Stanford University"],
  [4, "Yale University"],
  [6, "University of Chicago"],
  [7, "Duke University"],
  [7, "Johns Hopkins University"],
  [7, "Northwestern University"],
  [7, "University of Pennsylvania"],
  [11, "California Institute of Technology"],
  [12, "Cornell University"],
  [13, "Brown University"],
  [13, "Dartmouth College"],
  [15, "Columbia University"],
  [15, "University of California, Berkeley"],
  [17, "Rice University"],
  [17, "University of California, Los Angeles"],
  [17, "Vanderbilt University"],
  [20, "Carnegie Mellon University"],
  [20, "University of Michigan-Ann Arbor"],
  [20, "University of Notre Dame"],
  [20, "Washington University in St Louis"],
  [24, "Georgetown University"],
  [24, "Emory University"],
  [26, "University of Virginia-Main Campus"],
  [26, "University of North Carolina at Chapel Hill"],
  [28, "University of Southern California"],
  [29, "University of California, San Diego"],
  [30, "University of Florida"],
  [30, "The University of Texas at Austin"],
  [32, "New York University"],
  [32, "University of California, Davis"],
  [32, "Georgia Institute of Technology-Main Campus"],
  [32, "University of California, Irvine"],
  [36, "University of Illinois Urbana-Champaign"],
  [36, "Boston College"],
  [36, "Tufts University"],
  [36, "University of Wisconsin-Madison"],
  [40, "University of California, Santa Barbara"],
  [41, "Ohio State University-Main Campus"],
  [42, "Boston University"],
  [42, "Rutgers University-New Brunswick"],
  [42, "University of Maryland-College Park"],
  [42, "University of Washington-Seattle Campus"],
  [42, "Purdue University-Main Campus"],
  [46, "University of Rochester"],
  [46, "Lehigh University"],
  [46, "Northeastern University"],
  [46, "University of Georgia"],
  [51, "Texas A & M University-College Station"],
  [51, "Virginia Polytechnic Institute and State University"],
  [51, "Wake Forest University"],
  [51, "William & Mary"],
  [51, "Florida State University"],
  [51, "Case Western Reserve University"],
  [57, "University of California, Merced"],
  [57, "Villanova University"],
  [59, "Santa Clara University"],
  [59, "Pennsylvania State University-Main Campus"],
  [59, "George Washington University"],
  [59, "Stony Brook University"],
  [59, "University of Minnesota-Twin Cities"],
  [64, "Michigan State University"],
  [64, "North Carolina State University at Raleigh"],
  [64, "Rensselaer Polytechnic Institute"],
  [64, "University of Massachusetts-Amherst"],
  [64, "University of Miami"],
  [69, "Brandeis University"],
  [69, "Tulane University of Louisiana"],
  [69, "University of Pittsburgh-Pittsburgh Campus"],
  [69, "University of Connecticut"],
  [73, "Binghamton University"],
  [73, "Indiana University-Bloomington"],
  [75, "Syracuse University"],
  [75, "Clemson University"],
  [75, "University at Buffalo"],
  [75, "University of California, Riverside"],
  [75, "Rutgers University-Newark"],
  [80, "Stevens Institute of Technology"],
  [80, "Colorado School of Mines"],
  [80, "New Jersey Institute of Technology"],
  [80, "Drexel University"],
  [84, "Pepperdine University"],
  [84, "University of Illinois Chicago"],
  [84, "Worcester Polytechnic Institute"],
  [84, "Yeshiva University"],
  [88, "Baylor University"],
  [88, "American University"],
  [88, "Howard University"],
  [88, "Southern Methodist University"],
  [88, "University of South Florida"],
  [88, "Marquette University"],
  [88, "University of Delaware"],
  [88, "University of California, Santa Cruz"],
  [88, "Rochester Institute of Technology"],
  [97, "Fordham University"],
  [97, "Rutgers University-Camden"],
  [97, "University of Colorado Boulder"],
  [97, "Texas Christian University"],
  [102, "Temple University"],
  [102, "University of Iowa"],
];

const usLiberalArtsRanked = [
  [1, "Williams College"],
  [2, "Amherst College"],
  [3, "Swarthmore College"],
  [4, "Pomona College"],
  [5, "Wellesley College"],
  [6, "Bowdoin College"],
  [7, "Carleton College"],
  [8, "Claremont McKenna College"],
  [9, "Middlebury College"],
  [10, "Haverford College"],
  [11, "Davidson College"],
  [12, "Wesleyan University"],
  [13, "Grinnell College"],
  [14, "Hamilton College"],
  [15, "Vassar College"],
  [16, "Colby College"],
  [17, "Barnard College"],
  [18, "Smith College"],
  [19, "Washington and Lee University"],
  [20, "Harvey Mudd College"],
  [21, "Colgate University"],
  [22, "Bates College"],
  [23, "Colorado College"],
  [24, "Macalester College"],
  [25, "Oberlin College"],
  [26, "Scripps College"],
  [27, "Bryn Mawr College"],
  [28, "Kenyon College"],
  [29, "Mount Holyoke College"],
  [30, "College of the Holy Cross"],
  [31, "Bucknell University"],
  [32, "Lafayette College"],
  [33, "Franklin and Marshall College"],
  [34, "Occidental College"],
  [35, "Reed College"],
  [36, "Pitzer College"],
];

const regionalUniversities = [
  // Australia Group of Eight
  ["AU", "Australian National University", "Canberra"],
  ["AU", "The University of Melbourne", "Melbourne"],
  ["AU", "The University of Sydney", "Sydney"],
  ["AU", "UNSW Sydney", "Sydney"],
  ["AU", "The University of Queensland", "Brisbane"],
  ["AU", "Monash University", "Melbourne"],
  ["AU", "The University of Western Australia", "Perth"],
  ["AU", "The University of Adelaide", "Adelaide"],
  // Singapore's six autonomous universities
  ["SG", "National University of Singapore", "Singapore"],
  ["SG", "Nanyang Technological University", "Singapore"],
  ["SG", "Singapore Management University", "Singapore"],
  ["SG", "Singapore University of Technology and Design", "Singapore"],
  ["SG", "Singapore Institute of Technology", "Singapore"],
  ["SG", "Singapore University of Social Sciences", "Singapore"],
  // Hong Kong's eight publicly funded universities
  ["HK", "The University of Hong Kong", "Hong Kong"],
  ["HK", "The Chinese University of Hong Kong", "Hong Kong"],
  ["HK", "The Hong Kong University of Science and Technology", "Hong Kong"],
  ["HK", "City University of Hong Kong", "Hong Kong"],
  ["HK", "The Hong Kong Polytechnic University", "Hong Kong"],
  ["HK", "Hong Kong Baptist University", "Hong Kong"],
  ["HK", "Lingnan University", "Hong Kong"],
  ["HK", "The Education University of Hong Kong", "Hong Kong"],
  // Canada: 20 leading universities shown in the world map scope
  ["CA", "McGill University", "Montreal"],
  ["CA", "University of Toronto", "Toronto"],
  ["CA", "University of British Columbia", "Vancouver"],
  ["CA", "University of Alberta", "Edmonton"],
  ["CA", "University of Waterloo", "Waterloo"],
  ["CA", "Western University", "London"],
  ["CA", "Université de Montréal", "Montreal"],
  ["CA", "McMaster University", "Hamilton"],
  ["CA", "University of Ottawa", "Ottawa"],
  ["CA", "Queen's University", "Kingston"],
  ["CA", "University of Calgary", "Calgary"],
  ["CA", "Dalhousie University", "Halifax"],
  ["CA", "Simon Fraser University", "Burnaby"],
  ["CA", "University of Victoria", "Victoria"],
  ["CA", "Université Laval", "Quebec City"],
  ["CA", "University of Saskatchewan", "Saskatoon"],
  ["CA", "York University", "Toronto"],
  ["CA", "Concordia University", "Montreal"],
  ["CA", "University of Guelph", "Guelph"],
  ["CA", "University of Windsor", "Windsor"],
  // Canada Maple League: primarily undergraduate liberal education institutions
  ["CA", "Acadia University", "Wolfville", ["文理学院"]],
  ["CA", "Bishop's University", "Sherbrooke", ["文理学院"]],
  ["CA", "Mount Allison University", "Sackville", ["文理学院"]],
  ["CA", "St. Francis Xavier University", "Antigonish", ["文理学院"]],
  // Australia: dedicated liberal arts / liberal arts college model
  ["AU", "Campion College", "Sydney", ["文理学院"]],
  ["AU", "Christian Heritage College", "Brisbane", ["文理学院"]],
];

const wikidataSearchOverrides = new Map([
  ["University of Virginia-Main Campus", "University of Virginia"],
  ["Georgia Institute of Technology-Main Campus", "Georgia Institute of Technology"],
  ["Ohio State University-Main Campus", "Ohio State University"],
  ["University of Washington-Seattle Campus", "University of Washington"],
  ["Purdue University-Main Campus", "Purdue University"],
  ["Texas A & M University-College Station", "Texas A&M University"],
  ["Virginia Polytechnic Institute and State University", "Virginia Tech"],
  ["Pennsylvania State University-Main Campus", "Pennsylvania State University"],
  ["University of Massachusetts-Amherst", "University of Massachusetts Amherst"],
  ["Tulane University of Louisiana", "Tulane University"],
  ["University of Pittsburgh-Pittsburgh Campus", "University of Pittsburgh"],
  ["UNSW Sydney", "University of New South Wales"],
  ["Western University", "University of Western Ontario"],
  ["St. Francis Xavier University", "St. Francis Xavier University"],
  ["Christian Heritage College", "Christian Heritage College Brisbane"],
]);
let wikidataByTitle = new Map();
let scorecardByName = new Map();

const countryNames = {
  AU: "Australia",
  SG: "Singapore",
  HK: "Hong Kong SAR",
  CA: "Canada",
};
const manualCoordinates = new Map([
  ["University of Notre Dame", [41.7056, -86.2353]],
  ["The University of Melbourne", [-37.7963, 144.9614]],
  ["The University of Sydney", [-33.8886, 151.1873]],
  ["The University of Queensland", [-27.4975, 153.0137]],
  ["The University of Western Australia", [-31.9805, 115.8176]],
  ["The University of Adelaide", [-34.9205, 138.6062]],
  ["The University of Hong Kong", [22.283, 114.1371]],
  ["The Chinese University of Hong Kong", [22.4196, 114.2068]],
  ["The Hong Kong University of Science and Technology", [22.3364, 114.2654]],
  ["The Hong Kong Polytechnic University", [22.304, 114.1795]],
  ["The Education University of Hong Kong", [22.4673, 114.1949]],
  ["Queen's University", [44.2253, -76.4951]],
  ["Acadia University", [45.0919, -64.3653]],
  ["Bishop's University", [45.3666, -71.8486]],
  ["Mount Allison University", [45.8988, -64.3732]],
  ["St. Francis Xavier University", [45.6187, -61.9944]],
  ["Campion College", [-33.8075, 150.9986]],
  ["Christian Heritage College", [-27.5315, 153.0936]],
]);
const regionalChineseNames = new Map([
  ["Australian National University", "澳大利亚国立大学"],
  ["The University of Melbourne", "墨尔本大学"],
  ["The University of Sydney", "悉尼大学"],
  ["University of New South Wales", "新南威尔士大学"],
  ["The University of Queensland", "昆士兰大学"],
  ["Monash University", "莫纳什大学"],
  ["The University of Western Australia", "西澳大学"],
  ["The University of Adelaide", "阿德莱德大学"],
  ["National University of Singapore", "新加坡国立大学"],
  ["Nanyang Technological University", "南洋理工大学"],
  ["Singapore Management University", "新加坡管理大学"],
  ["Singapore University of Technology and Design", "新加坡科技设计大学"],
  ["Singapore Institute of Technology", "新加坡理工大学"],
  ["Singapore University of Social Sciences", "新加坡社科大学"],
  ["The University of Hong Kong", "香港大学"],
  ["The Chinese University of Hong Kong", "香港中文大学"],
  ["The Hong Kong University of Science and Technology", "香港科技大学"],
  ["City University of Hong Kong", "香港城市大学"],
  ["The Hong Kong Polytechnic University", "香港理工大学"],
  ["Hong Kong Baptist University", "香港浸会大学"],
  ["Lingnan University", "岭南大学"],
  ["The Education University of Hong Kong", "香港教育大学"],
  ["McGill University", "麦吉尔大学"],
  ["University of Toronto", "多伦多大学"],
  ["University of British Columbia", "英属哥伦比亚大学"],
  ["University of Alberta", "阿尔伯塔大学"],
  ["University of Waterloo", "滑铁卢大学"],
  ["University of Western Ontario", "西安大略大学"],
  ["Université de Montréal", "蒙特利尔大学"],
  ["McMaster University", "麦克马斯特大学"],
  ["University of Ottawa", "渥太华大学"],
  ["Queen's University", "女王大学"],
  ["University of Calgary", "卡尔加里大学"],
  ["Dalhousie University", "达尔豪斯大学"],
  ["Simon Fraser University", "西蒙菲莎大学"],
  ["University of Victoria", "维多利亚大学"],
  ["Laval University", "拉瓦尔大学"],
  ["University of Saskatchewan", "萨斯喀彻温大学"],
  ["York University", "约克大学"],
  ["Concordia University", "康考迪亚大学"],
  ["University of Guelph", "圭尔夫大学"],
  ["University of Windsor", "温莎大学"],
  ["Acadia University", "阿卡迪亚大学"],
  ["Bishop's University", "毕索大学"],
  ["Mount Allison University", "蒙特爱立森大学"],
  ["St. Francis Xavier University", "圣弗朗西斯泽维尔大学"],
  ["Campion College", "坎皮恩学院"],
  ["Christian Heritage College", "基督教遗产学院"],
]);
const usChineseNames = new Map([
  ["Williams College", "威廉姆斯学院"],
  ["Amherst College", "阿默斯特学院"],
  ["Swarthmore College", "斯沃斯莫尔学院"],
  ["Pomona College", "波莫纳学院"],
  ["Wellesley College", "韦尔斯利学院"],
  ["Bowdoin College", "鲍登学院"],
  ["Carleton College", "卡尔顿学院"],
  ["Claremont McKenna College", "克莱蒙特麦肯纳学院"],
  ["Middlebury College", "明德学院"],
  ["Haverford College", "哈弗福德学院"],
  ["Davidson College", "戴维森学院"],
  ["Wesleyan University", "卫斯理大学"],
  ["Grinnell College", "格林内尔学院"],
  ["Hamilton College", "汉密尔顿学院"],
  ["Vassar College", "瓦萨学院"],
  ["Colby College", "科尔比学院"],
  ["Barnard College", "巴纳德学院"],
  ["Smith College", "史密斯学院"],
  ["Washington and Lee University", "华盛顿与李大学"],
  ["Harvey Mudd College", "哈维穆德学院"],
  ["Colgate University", "科尔盖特大学"],
  ["Bates College", "贝茨学院"],
  ["Colorado College", "科罗拉多学院"],
  ["Macalester College", "麦卡莱斯特学院"],
  ["Oberlin College", "欧柏林学院"],
  ["Scripps College", "斯克里普斯学院"],
  ["Bryn Mawr College", "布林莫尔学院"],
  ["Kenyon College", "凯尼恩学院"],
  ["Mount Holyoke College", "曼荷莲学院"],
  ["College of the Holy Cross", "圣十字学院"],
  ["Bucknell University", "巴克内尔大学"],
  ["Lafayette College", "拉法叶学院"],
  ["Franklin and Marshall College", "富兰克林与马歇尔学院"],
  ["Occidental College", "西方学院"],
  ["Reed College", "里德学院"],
  ["Pitzer College", "匹泽学院"],
  ["Emory University", "埃默里大学"],
  ["University of North Carolina at Chapel Hill", "北卡罗来纳大学教堂山分校"],
  ["University of California, San Diego", "加州大学圣地亚哥分校"],
  ["University of California, Davis", "加州大学戴维斯分校"],
  ["University of California, Irvine", "加州大学欧文分校"],
  ["University of California, Santa Barbara", "加州大学圣塔芭芭拉分校"],
  ["University of Michigan-Ann Arbor", "密歇根大学安娜堡分校"],
  ["Washington University in St Louis", "圣路易斯华盛顿大学"],
  ["The University of Texas at Austin", "德克萨斯大学奥斯汀分校"],
  ["Georgia Institute of Technology-Main Campus", "佐治亚理工学院"],
  ["University of Wisconsin-Madison", "威斯康星大学麦迪逊分校"],
  ["Rutgers University-New Brunswick", "罗格斯大学新布朗斯维克分校"],
  ["University of Maryland-College Park", "马里兰大学帕克分校"],
  ["William & Mary", "威廉与玛丽学院"],
  ["University of Minnesota-Twin Cities", "明尼苏达大学双城分校"],
  ["North Carolina State University at Raleigh", "北卡罗来纳州立大学"],
  ["Indiana University-Bloomington", "印第安纳大学伯明顿分校"],
  ["Rutgers University-Newark", "罗格斯大学纽瓦克分校"],
  ["Rutgers University-Camden", "罗格斯大学卡姆登分校"],
  ["Lehigh University", "里海大学"],
  ["University of Georgia", "佐治亚大学"],
  ["Texas A&M University", "德州农工大学"],
  ["Virginia Tech", "弗吉尼亚理工大学"],
  ["Case Western Reserve University", "凯斯西储大学"],
  ["University of California, Merced", "加州大学默塞德分校"],
  ["Santa Clara University", "圣克拉拉大学"],
  ["Brandeis University", "布兰迪斯大学"],
  ["Colorado School of Mines", "科罗拉多矿业学院"],
  ["New Jersey Institute of Technology", "新泽西理工学院"],
  ["University of Illinois Chicago", "伊利诺伊大学芝加哥分校"],
  ["Baylor University", "贝勒大学"],
  ["Southern Methodist University", "南卫理公会大学"],
  ["University of California, Santa Cruz", "加州大学圣克鲁兹分校"],
  ["Fordham University", "福特汉姆大学"],
  ["University of Iowa", "爱荷华大学"],
]);
const manualWebsites = new Map([
  ["The University of Melbourne", "https://www.unimelb.edu.au/"],
  ["The University of Sydney", "https://www.sydney.edu.au/"],
  ["The University of Queensland", "https://www.uq.edu.au/"],
  ["The University of Western Australia", "https://www.uwa.edu.au/"],
  ["The University of Adelaide", "https://www.adelaide.edu.au/"],
  ["The University of Hong Kong", "https://www.hku.hk/"],
  ["The Chinese University of Hong Kong", "https://www.cuhk.edu.hk/"],
  ["The Hong Kong University of Science and Technology", "https://hkust.edu.hk/"],
  ["The Hong Kong Polytechnic University", "https://www.polyu.edu.hk/"],
  ["The Education University of Hong Kong", "https://www.eduhk.hk/"],
  ["Queen's University", "https://www.queensu.ca/"],
  ["Acadia University", "https://www.acadiau.ca/"],
  ["Bishop's University", "https://www.ubishops.ca/"],
  ["Mount Allison University", "https://mta.ca/"],
  ["St. Francis Xavier University", "https://www.stfx.ca/"],
  ["Campion College", "https://www.campion.edu.au/"],
  ["Christian Heritage College", "https://chc.edu.au/"],
]);
const manualUsMetrics = new Map([
  [
    "Columbia University",
    { tuition: 71845, admissionRate: 0.0399, enrollment: 8973 },
  ],
  [
    "University of Notre Dame",
    { tuition: 65025, admissionRate: 0.1127, enrollment: 8818 },
  ],
]);

async function fetchJson(url, attempts = 6) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const response = await fetch(url, {
      headers: { "User-Agent": "UniScope-data-refresh/1.0 (educational project)" },
    });
    if (response.ok) return response.json();
    if (attempt === attempts) {
      throw new Error(`${response.status} ${response.statusText}: ${url}`);
    }
    const retryAfter = Number(response.headers.get("retry-after") ?? 0) * 1000;
    await sleep(Math.max(retryAfter, attempt * attempt * 1200));
  }
}

async function prefetchWikidata(names) {
  const titles = [...new Set(names.map((name) => wikidataSearchOverrides.get(name) ?? name))];
  for (let index = 0; index < titles.length; index += 40) {
    const batch = titles.slice(index, index + 40);
    const entityUrl = new URL(wikidataApi);
    entityUrl.search = new URLSearchParams({
      action: "wbgetentities",
      sites: "enwiki",
      titles: batch.join("|"),
      props: "claims|labels|sitelinks",
      languages: "zh-hans|zh|en",
      sitefilter: "enwiki",
      format: "json",
      origin: "*",
    });
    const entityData = await fetchJson(entityUrl);
    for (const entity of Object.values(entityData.entities ?? {})) {
      const title = entity.sitelinks?.enwiki?.title;
      if (title) wikidataByTitle.set(normalize(title), entity);
    }
    console.log(`[Wikidata] loaded ${Math.min(index + 40, titles.length)}/${titles.length}`);
    await sleep(1000);
  }
}

async function prefetchScorecard() {
  try {
    await access(scorecardCsvPath);
  } catch {
    try {
      await access(scorecardZipPath);
    } catch {
      console.log("[Scorecard] downloading the March 23, 2026 institution file");
      const response = await fetch(scorecardZipUrl);
      if (!response.ok) throw new Error(`Unable to download College Scorecard: ${response.status}`);
      await writeFile(scorecardZipPath, Buffer.from(await response.arrayBuffer()));
    }
    await mkdir("/tmp/world-university-scorecard", { recursive: true });
    await execFileAsync("unzip", [
      "-o",
      scorecardZipPath,
      "Most-Recent-Cohorts-Institution.csv",
      "-d",
      "/tmp/world-university-scorecard",
    ]);
  }

  const parser = createReadStream(scorecardCsvPath).pipe(
    parse({ columns: true, bom: true, relax_quotes: true, relax_column_count: true }),
  );
  for await (const row of parser) {
    scorecardByName.set(normalize(row.INSTNM), row);
  }
  console.log(`[Scorecard] loaded ${scorecardByName.size} institutions`);
}

function wikidataRecord(name) {
  const searchName = wikidataSearchOverrides.get(name) ?? name;
  const entity = wikidataByTitle.get(normalize(searchName));
  if (!entity) return {};
  const coordinate = entity?.claims?.P625?.[0]?.mainsnak?.datavalue?.value;
  const website = entity?.claims?.P856?.[0]?.mainsnak?.datavalue?.value;
  const englishLabel = entity?.labels?.en?.value;
  return {
    wikidataId: entity.id,
    nameZh: entity?.labels?.["zh-hans"]?.value ?? entity?.labels?.zh?.value,
    canonicalName: englishLabel,
    latitude: coordinate?.latitude,
    longitude: coordinate?.longitude,
    website,
  };
}

function scorecardRecord(name) {
  const normalizedName = normalize(name);
  const exact =
    scorecardByName.get(normalizedName) ??
    [...scorecardByName.entries()]
      .filter(
        ([candidate]) =>
          candidate.includes(normalizedName) || normalizedName.includes(candidate),
      )
      .sort((a, b) => Math.abs(a[0].length - normalizedName.length) - Math.abs(b[0].length - normalizedName.length))[0]?.[1];
  if (!exact) throw new Error(`College Scorecard did not find ${name}`);
  return exact;
}

async function buildUsRecord([rank, name], index, options = {}) {
  const scorecard = scorecardRecord(name);
  const wikidata = wikidataRecord(name);
  const canonicalName = cleanUsName(wikidata.canonicalName ?? scorecard.INSTNM ?? name);
  const manualMetrics = manualUsMetrics.get(canonicalName);
  const admissionRate = parseNumber(scorecard.ADM_RATE) ?? manualMetrics?.admissionRate;
  const admissionHistory = admissionRate
    ? [
        {
          year: 2024,
          acceptanceRate: Math.round(admissionRate * 10000) / 100,
          source: "https://collegescorecard.ed.gov/data/",
        },
      ]
    : [];

  console.log(`[${options.logPrefix ?? "US"} ${index + 1}/${options.total ?? usRanked.length}] ${canonicalName}`);
  const manualCoordinate = manualCoordinates.get(canonicalName);
  return {
    id: slugify(canonicalName),
    nameEn: canonicalName,
    nameZh:
      usChineseNames.get(canonicalName) ??
      (toSimplifiedLabel(wikidata.nameZh) || canonicalName),
    abbreviation: abbreviationFor(canonicalName),
    country: "United States",
    countryCode: "US",
    city: `${scorecard.CITY}, ${scorecard.STABBR}`,
    latitude: parseNumber(scorecard.LATITUDE) ?? manualCoordinate?.[0],
    longitude: parseNumber(scorecard.LONGITUDE) ?? manualCoordinate?.[1],
    rank,
    rankYear: 2026,
    rankingSystem: "U.S. News",
    tags: options.tags ?? [],
    website: normalizeWebsite(scorecard.INSTURL ?? wikidata.website),
    tuition: (parseNumber(scorecard.TUITIONFEE_OUT) ?? manualMetrics?.tuition)
      ? {
          amount: parseNumber(scorecard.TUITIONFEE_OUT) ?? manualMetrics.tuition,
          currency: "USD",
          period: "year",
          year: 2024,
          source: "https://collegescorecard.ed.gov/data/",
        }
      : undefined,
    admissionHistory,
    enrollment: parseNumber(scorecard.UGDS) ?? manualMetrics?.enrollment,
    wikidataId: wikidata.wikidataId,
    sources: [
      ...(options.tags?.includes("文理学院")
        ? []
        : [
            {
              label: "2026 U.S. News 排名地图",
              url: "local-pdf:2026年美国大学排名及地图（无logo可编辑）.pdf",
              year: 2026,
            },
          ]),
      ...(options.source
        ? [
            {
              label: options.source.label,
              url: options.source.url,
              year: options.source.year,
            },
          ]
        : []),
      {
        label: "U.S. Department of Education College Scorecard",
        url: "https://collegescorecard.ed.gov/data/",
        year: 2024,
      },
      ...(wikidata.wikidataId
        ? [
            {
              label: "Wikidata",
              url: `https://www.wikidata.org/wiki/${wikidata.wikidataId}`,
              year: 2026,
            },
          ]
        : []),
    ],
  };
}

async function buildRegionalRecord([countryCode, name, city, tags = []], index) {
  const wikidata = wikidataRecord(name);
  const canonicalName = wikidata.canonicalName ?? name;
  const manualCoordinate =
    manualCoordinates.get(canonicalName) ?? manualCoordinates.get(name);
  console.log(`[Regional ${index + 1}/${regionalUniversities.length}] ${canonicalName}`);
  return {
    id: slugify(canonicalName),
    nameEn: canonicalName,
    nameZh:
      regionalChineseNames.get(canonicalName) ??
      regionalChineseNames.get(name) ??
      toSimplifiedLabel(wikidata.nameZh) ??
      canonicalName,
    abbreviation: abbreviationFor(canonicalName),
    country: countryNames[countryCode],
    countryCode,
    city,
    latitude: wikidata.latitude ?? manualCoordinate?.[0],
    longitude: wikidata.longitude ?? manualCoordinate?.[1],
    rankingSystem: "QS",
    rankYear: 2026,
    tags,
    website: normalizeWebsite(
      wikidata.website ??
        manualWebsites.get(canonicalName) ??
        manualWebsites.get(name),
    ),
    wikidataId: wikidata.wikidataId,
    sources: [
      ...(wikidata.wikidataId
        ? [
            {
              label: "Wikidata",
              url: `https://www.wikidata.org/wiki/${wikidata.wikidataId}`,
              year: 2026,
            },
          ]
        : []),
      ...(tags.includes("文理学院")
        ? [
            {
              label: "文理学院公开资料",
              url: normalizeWebsite(
                manualWebsites.get(canonicalName) ??
                  manualWebsites.get(name) ??
                  wikidata.website,
              ),
              year: 2026,
            },
          ]
        : []),
    ],
  };
}

async function mapWithConcurrency(items, limit, mapper) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await mapper(items[index], index);
      await sleep(90);
    }
  }
  await Promise.all(Array.from({ length: limit }, worker));
  return results;
}

function cleanUsName(name) {
  return name
    .replace("University of Michigan–Ann Arbor", "University of Michigan-Ann Arbor")
    .replace("Washington University in St. Louis", "Washington University in St Louis");
}

function normalize(value = "") {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function normalizeWebsite(value = "") {
  if (!value) return "";
  return value.startsWith("http") ? value : `https://${value.replace(/^\/+/, "")}`;
}

function parseNumber(value) {
  if (value == null || value === "" || value === "NULL" || value === "PrivacySuppressed") {
    return undefined;
  }
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function slugify(value) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function abbreviationFor(name) {
  const known = {
    "Massachusetts Institute of Technology": "MIT",
    "California Institute of Technology": "Caltech",
    "University of California, Berkeley": "UC Berkeley",
    "University of California, Los Angeles": "UCLA",
    "University of California, San Diego": "UCSD",
    "University of California, Davis": "UC Davis",
    "University of California, Irvine": "UC Irvine",
    "University of California, Santa Barbara": "UCSB",
    "University of California, Merced": "UC Merced",
    "University of California, Riverside": "UC Riverside",
    "University of California, Santa Cruz": "UCSC",
    "Georgia Institute of Technology": "Georgia Tech",
    "University of Illinois Urbana-Champaign": "UIUC",
    "University of Illinois Chicago": "UIC",
    "University of Massachusetts Amherst": "UMass Amherst",
    "Pennsylvania State University": "Penn State",
    "Australian National University": "ANU",
    "The University of Melbourne": "UniMelb",
    "The University of Sydney": "USYD",
    "University of New South Wales": "UNSW",
    "The University of Queensland": "UQ",
    "The University of Western Australia": "UWA",
    "The University of Adelaide": "Adelaide",
    "National University of Singapore": "NUS",
    "Nanyang Technological University": "NTU",
    "Singapore Management University": "SMU",
    "Singapore University of Technology and Design": "SUTD",
    "Singapore Institute of Technology": "SIT",
    "Singapore University of Social Sciences": "SUSS",
    "The University of Hong Kong": "HKU",
    "The Chinese University of Hong Kong": "CUHK",
    "The Hong Kong University of Science and Technology": "HKUST",
    "City University of Hong Kong": "CityUHK",
    "The Hong Kong Polytechnic University": "PolyU",
    "Hong Kong Baptist University": "HKBU",
    "The Education University of Hong Kong": "EdUHK",
    "University of British Columbia": "UBC",
  };
  if (known[name]) return known[name];
  const words = name
    .replace(/^The /, "")
    .split(/\s+/)
    .filter((word) => !["of", "the", "at", "and", "in"].includes(word.toLowerCase()));
  const initials = words.map((word) => word[0]).join("");
  return initials.length >= 2 && initials.length <= 6 ? initials.toUpperCase() : name;
}

function toSimplifiedLabel(value = "") {
  return value
    .replaceAll("大學", "大学")
    .replaceAll("學院", "学院")
    .replaceAll("學校", "学校")
    .replaceAll("國", "国")
    .replaceAll("華", "华")
    .replaceAll("羅", "罗")
    .replaceAll("爾", "尔")
    .replaceAll("倫", "伦")
    .replaceAll("亞", "亚")
    .replaceAll("術", "术")
    .replaceAll("濟", "济")
    .replaceAll("維", "维")
    .replaceAll("蘭", "兰")
    .replaceAll("賓", "宾")
    .replaceAll("馬", "马")
    .replaceAll("聖", "圣")
    .replaceAll("葉", "叶")
    .replaceAll("約", "约")
    .replaceAll("達", "达")
    .replaceAll("頓", "顿")
    .replaceAll("喬", "乔")
    .replaceAll("麥", "麦")
    .replaceAll("蒙特婁", "蒙特利尔");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

await prefetchWikidata([
  ...usRanked.map(([, name]) => name),
  ...usLiberalArtsRanked.map(([, name]) => name),
  ...regionalUniversities.map(([, name]) => name),
]);
await prefetchScorecard();
const us = await mapWithConcurrency(usRanked, 4, buildUsRecord);
const usLiberalArts = await mapWithConcurrency(usLiberalArtsRanked, 4, (item, index) =>
  buildUsRecord(item, index, {
    logPrefix: "US-LAC",
    total: usLiberalArtsRanked.length,
    tags: ["文理学院"],
    source: {
      label: "2026 U.S. News National Liberal Arts Colleges",
      url: "https://www.usnews.com/best-colleges/rankings/national-liberal-arts-colleges",
      year: 2026,
    },
  }),
);
const regional = await mapWithConcurrency(regionalUniversities, 4, buildRegionalRecord);
const records = [...us, ...usLiberalArts, ...regional];
const missingCoordinates = records.filter(
  (record) => !Number.isFinite(record.latitude) || !Number.isFinite(record.longitude),
);
if (missingCoordinates.length) {
  throw new Error(
    `Missing coordinates: ${missingCoordinates.map((record) => record.nameEn).join(", ")}`,
  );
}

await mkdir("src/data", { recursive: true });
await writeFile(
  "src/data/catalog.generated.json",
  `${JSON.stringify(records, null, 2)}\n`,
  "utf8",
);
console.log(`Wrote ${records.length} universities to src/data/catalog.generated.json`);
