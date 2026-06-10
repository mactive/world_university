import {
  ArrowUpRight,
  BookOpen,
  Building2,
  CalendarDays,
  CircleDollarSign,
  ExternalLink,
  GraduationCap,
  MapPin,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import type { University, UniversityOfferRecord } from "../types";
import { REGION_LABELS } from "../types";

interface Props {
  university: University;
  onClose: () => void;
}

export function UniversityDetail({ university, onClose }: Props) {
  const [offerRecords, setOfferRecords] = useState<UniversityOfferRecord[]>([]);
  const historyRows = useMemo(() => {
    const byYear = new Map<
      number,
      {
        year: number;
        acceptanceRate?: number;
        offerCount: number;
        sources: Set<string>;
      }
    >();

    for (const item of university.admissionHistory) {
      byYear.set(item.year, {
        year: item.year,
        acceptanceRate: item.acceptanceRate,
        offerCount: 0,
        sources: new Set(item.source ? [item.source] : []),
      });
    }

    for (const record of offerRecords) {
      const current =
        byYear.get(record.year) ??
        {
          year: record.year,
          offerCount: 0,
          sources: new Set<string>(),
        };
      current.offerCount += record.offerCount;
      current.sources.add(record.sourceName);
      byYear.set(record.year, current);
    }

    return [...byYear.values()].sort((a, b) => b.year - a.year);
  }, [offerRecords, university.admissionHistory]);

  useEffect(() => {
    let cancelled = false;
    setOfferRecords([]);
    api
      .offerRecords(university.id)
      .then(({ offerRecords: records }) => {
        if (!cancelled) setOfferRecords(records);
      })
      .catch(() => {
        if (!cancelled) setOfferRecords([]);
      });
    return () => {
      cancelled = true;
    };
  }, [university.id]);

  return (
    <aside className="detail-panel">
      <div className="detail-hero">
        <button className="icon-button detail-close" onClick={onClose} aria-label="关闭详情">
          <X size={19} />
        </button>
        <div className="eyebrow">
          {REGION_LABELS[university.countryCode]} · {university.city}
        </div>
        <h2>{university.nameZh}</h2>
        <p>{university.nameEn}</p>
        <div className="detail-badges">
          {university.qsRank && (
            <span className="rank-badge">
              {university.rankingSystem ?? "QS"} {university.rankYear} #{university.qsRank}
            </span>
          )}
          <span>{university.abbreviation}</span>
        </div>
      </div>

      <div className="detail-scroll">
        <section className="metric-grid">
          <Metric
            icon={<CircleDollarSign size={18} />}
            label="参考学费"
            value={
              university.tuition
                ? `${formatMoney(university.tuition.amount)} ${university.tuition.currency}/年`
                : "待补充"
            }
            note={university.tuition ? `${university.tuition.year} 年口径` : undefined}
          />
          <Metric
            icon={<Building2 size={18} />}
            label="城市住宿"
            value={
              university.housing
                ? `${formatMoney(university.housing.min)}–${formatMoney(university.housing.max)} ${university.housing.currency}/月`
                : "待补充"
            }
            note={university.housing ? `${university.housing.year} 年估算` : undefined}
          />
        </section>

        {university.enrollment && (
          <div className="enrollment-note">
            <Users size={15} />
            美国教育部口径本科在校规模约 {university.enrollment.toLocaleString()} 人
          </div>
        )}

        <section className="detail-section">
          <div className="section-heading">
            <GraduationCap size={19} />
            <h3>优势专业</h3>
          </div>
          {university.tags.length > 0 && (
            <div className="tag-list highlight-tags">
              {university.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          )}
          <div className="tag-list">
            {university.strengths.map((strength) => (
              <span key={strength}>{strength}</span>
            ))}
          </div>
        </section>

        <section className="detail-section">
          <div className="section-heading">
            <BookOpen size={19} />
            <h3>申请要求</h3>
          </div>
          <p className="lead-copy">{university.requirements.summary}</p>
          <InfoRow label="标化">{university.requirements.standardized}</InfoRow>
          <InfoRow label="AP">{university.requirements.ap}</InfoRow>
          <InfoRow label="竞赛">{university.requirements.competitions}</InfoRow>
          <InfoRow label="语言">{university.requirements.language}</InfoRow>
          <div className="source-note">
            <CalendarDays size={14} />
            {university.requirements.year} 年信息，请提交前复核官网
          </div>
        </section>

        <section className="detail-section">
          <div className="section-heading">
            <Users size={19} />
            <h3>中国大陆招生</h3>
          </div>
          <p className="lead-copy">
            {university.mainlandChinaIntake?.count
              ? `${university.mainlandChinaIntake.year} 年约 ${university.mainlandChinaIntake.count} 人`
              : university.mainlandChinaIntake?.note || "暂无可靠公开数据"}
          </p>
          <p className="data-caution">不使用“国际生总数”替代中国大陆招生人数。</p>
        </section>

        <section className="detail-section">
          <div className="section-heading">
            <MapPin size={19} />
            <h3>近年录取情况</h3>
          </div>
          {historyRows.length ? (
            <div className="history-list">
              {historyRows.map((year) => (
                <div key={year.year}>
                  <strong>{year.year}</strong>
                  <span>{historySummary(year)}</span>
                  {year.sources.size > 0 && <small>来源：{[...year.sources].join("、")}</small>}
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-copy">学校未提供可统一比较的公开数据，待按年度报告补充。</p>
          )}
        </section>

        <div className="detail-actions">
          <a href={university.admissionsUrl} target="_blank" rel="noreferrer">
            招生官网 <ArrowUpRight size={16} />
          </a>
          <a className="secondary-link" href={university.website} target="_blank" rel="noreferrer">
            学校官网 <ExternalLink size={15} />
          </a>
        </div>
      </div>
    </aside>
  );
}

function Metric({
  icon,
  label,
  value,
  note,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="metric-card">
      <div className="metric-label">
        {icon}
        {label}
      </div>
      <strong>{value}</strong>
      {note && <small>{note}</small>}
    </div>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="info-row">
      <strong>{label}</strong>
      <p>{children}</p>
    </div>
  );
}

function historySummary(year: { acceptanceRate?: number; offerCount: number }) {
  const parts = [];
  if (year.acceptanceRate !== undefined) parts.push(`整体录取率 ${year.acceptanceRate}%`);
  if (year.offerCount > 0) parts.push(`大陆学生 offer ${year.offerCount.toLocaleString()} 枚`);
  return parts.length ? parts.join(" · ") : "数据待补充";
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 0 }).format(value);
}
