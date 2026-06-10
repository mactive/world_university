import { ArrowRight, Globe2, LocateFixed, Map, Search, Settings2, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { RegionCode, University } from "../types";
import { canonicalUniversityId, type UniversityAliasMap } from "../data/universityAliases";
import { REGION_LABELS } from "../types";
import { UniversityDetail } from "./UniversityDetail";
import { UniversityMap } from "./UniversityMap";

interface Props {
  universities: University[];
  aliases: UniversityAliasMap;
  loading: boolean;
}

const regions = Object.entries(REGION_LABELS) as [RegionCode, string][];

export function PublicSite({ universities, aliases, loading }: Props) {
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState<RegionCode | "ALL">("ALL");
  const [selected, setSelected] = useState<University>();
  const [listOpen, setListOpen] = useState(true);
  const [notFoundId, setNotFoundId] = useState<string>();

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return universities
      .filter((university) => region === "ALL" || university.countryCode === region)
      .filter(
        (university) =>
          !keyword ||
          university.nameZh.includes(keyword) ||
          university.nameEn.toLowerCase().includes(keyword) ||
          university.abbreviation.toLowerCase().includes(keyword) ||
          university.city.toLowerCase().includes(keyword) ||
          university.tags.some((tag) => tag.includes(keyword)) ||
          university.strengths.some((item) => item.toLowerCase().includes(keyword)),
      )
      .sort((a, b) => (a.qsRank ?? 999) - (b.qsRank ?? 999));
  }, [universities, query, region]);

  useEffect(() => {
    const syncFromUrl = () => {
      const id = universityIdFromPath(window.location.pathname);
      if (!id) {
        setSelected(undefined);
        setNotFoundId(undefined);
        return;
      }
      const canonicalId = canonicalUniversityId(id, aliases);
      const university = universities.find((item) => item.id === canonicalId);
      setSelected(university);
      setNotFoundId(university ? undefined : id);
      if (university) {
        setRegion("ALL");
        setQuery("");
        if (id !== canonicalId) {
          window.history.replaceState(null, "", `/univ/${encodeURIComponent(canonicalId)}`);
        }
      }
    };

    syncFromUrl();
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, [aliases, universities]);

  function selectUniversity(university: University, replace = false) {
    setSelected(university);
    setNotFoundId(undefined);
    const url = `/univ/${encodeURIComponent(university.id)}`;
    if (window.location.pathname !== url) {
      const method = replace ? "replaceState" : "pushState";
      window.history[method](null, "", url);
    }
  }

  function closeUniversity() {
    setSelected(undefined);
    setNotFoundId(undefined);
    if (window.location.pathname.startsWith("/univ/")) {
      window.history.pushState(null, "", "/");
    }
  }

  return (
    <main className="site-shell">
      <UniversityMap
        universities={filtered}
        selected={selected}
        onSelect={(university) => selectUniversity(university)}
      />
      <div className="map-wash" />

      <header className="topbar">
        <a className="brand" href="/">
          <span className="brand-mark">
            <Globe2 size={21} />
          </span>
          <span>
            <strong>UniScope</strong>
            <small>世界大学留学地图</small>
          </span>
        </a>
        <div className="topbar-meta">
          <span>2026 · Top 500</span>
          <a href="/admin">
            <Settings2 size={16} />
            管理后台
          </a>
        </div>
      </header>

      <section className={`explorer-panel ${listOpen ? "" : "collapsed"}`}>
        <button
          className="panel-toggle"
          onClick={() => setListOpen((value) => !value)}
          aria-label={listOpen ? "收起学校列表" : "展开学校列表"}
        >
          <SlidersHorizontal size={18} />
        </button>
        <div className="explorer-inner">
          <div className="explorer-intro">
            <div className="eyebrow">面向中国学生的申请情报</div>
            <h1>从地图出发，找到适合你的大学。</h1>
            <p>聚合学校位置、学费、住宿、优势专业与历年录取信息。</p>
          </div>

          <label className="search-box">
            <Search size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索学校、城市或专业"
            />
          </label>

          <div className="region-tabs">
            <button className={region === "ALL" ? "active" : ""} onClick={() => setRegion("ALL")}>
              全部
            </button>
            {regions.map(([code, label]) => (
              <button
                key={code}
                className={region === code ? "active" : ""}
                onClick={() => setRegion(code)}
              >
                {label.replace("中国", "")}
              </button>
            ))}
          </div>

          <div className="result-summary">
            <span>{loading ? "正在载入学校数据…" : `${filtered.length} 所学校`}</span>
            <span>
              <LocateFixed size={14} /> 点击地图圆点查看
            </span>
          </div>

          <div className="school-list">
            {filtered.map((university) => (
              <button
                className={`school-card ${selected?.id === university.id ? "selected" : ""}`}
                key={university.id}
                onClick={() => selectUniversity(university)}
              >
                <span className="school-rank">
                  <small>{university.rankingSystem === "U.S. News" ? "USN" : "QS"}</small>
                  <strong>{university.qsRank ?? "—"}</strong>
                </span>
                <span className="school-card-copy">
                  <strong>{university.nameZh}</strong>
                  <small>
                    {university.abbreviation} · {university.city}
                  </small>
                  <span>
                    {[...university.tags, ...university.strengths].slice(0, 3).join(" · ")}
                  </span>
                </span>
                <ArrowRight size={17} />
              </button>
            ))}
            {!loading && !filtered.length && (
              <div className="no-results">
                <Map size={24} />
                <strong>没有匹配的学校</strong>
                <span>试试更短的关键词或切换地区。</span>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="map-stat">
        <strong>{universities.length}</strong>
        <span>首批重点学校</span>
        <small>数据将持续扩展至 Top 500</small>
      </div>

      {notFoundId && !loading && (
        <div className="route-toast">
          没找到学校 ID：<strong>{notFoundId}</strong>
        </div>
      )}

      {selected && <UniversityDetail university={selected} onClose={closeUniversity} />}
    </main>
  );
}

function universityIdFromPath(pathname: string) {
  const match = pathname.match(/^\/univ\/([^/]+)\/?$/);
  return match ? decodeURIComponent(match[1]) : undefined;
}
