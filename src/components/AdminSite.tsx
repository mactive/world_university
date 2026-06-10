import {
  ArrowLeft,
  BarChart3,
  Check,
  Database,
  Edit3,
  KeyRound,
  Loader2,
  LogOut,
  Plus,
  Save,
  Search,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import type { RegionCode, University, UniversityAlias, UniversityOfferRecord } from "../types";
import { REGION_LABELS } from "../types";

interface Props {
  universities: University[];
  aliases: UniversityAlias[];
  source: string;
  onRefresh: () => Promise<void>;
}

export function AdminSite({ universities, aliases, source, onRefresh }: Props) {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<University>();
  const [offerRecords, setOfferRecords] = useState<UniversityOfferRecord[]>([]);
  const [editingOffer, setEditingOffer] = useState<UniversityOfferRecord>();
  const [aliasRecords, setAliasRecords] = useState<UniversityAlias[]>(aliases);
  const [aliasValue, setAliasValue] = useState("");
  const [aliasUniversityId, setAliasUniversityId] = useState(universities[0]?.id ?? "");
  const [aliasNotes, setAliasNotes] = useState("");
  const [working, setWorking] = useState(false);

  useEffect(() => {
    api
      .session()
      .then(({ authenticated: value }) => setAuthenticated(value))
      .catch(() => setAuthenticated(false));
  }, []);

  useEffect(() => {
    if (authenticated) {
      void loadOfferRecords();
      void loadAliases();
    }
  }, [authenticated]);

  useEffect(() => {
    setAliasRecords(aliases);
  }, [aliases]);

  useEffect(() => {
    if (!aliasUniversityId && universities[0]) setAliasUniversityId(universities[0].id);
  }, [aliasUniversityId, universities]);

  const visible = useMemo(() => {
    const keyword = query.toLowerCase().trim();
    return universities.filter(
      (university) =>
        !keyword ||
        university.nameZh.includes(keyword) ||
        university.nameEn.toLowerCase().includes(keyword) ||
        university.city.toLowerCase().includes(keyword),
    );
  }, [query, universities]);

  async function login(event: React.FormEvent) {
    event.preventDefault();
    setWorking(true);
    setError("");
    try {
      await api.login(password);
      setAuthenticated(true);
      setPassword("");
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "登录失败");
    } finally {
      setWorking(false);
    }
  }

  async function bootstrap() {
    setWorking(true);
    setError("");
    try {
      const result = await api.backfillMissingUniversities();
      await onRefresh();
      window.alert(`已补齐 ${result.inserted} 条，跳过已有 ${result.skipped} 条。`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "补齐失败");
    } finally {
      setWorking(false);
    }
  }

  async function loadOfferRecords() {
    try {
      const result = await api.offerRecords();
      setOfferRecords(result.offerRecords);
    } catch {
      setOfferRecords([]);
    }
  }

  async function loadAliases() {
    try {
      const result = await api.universityAliases();
      setAliasRecords(result.aliases);
    } catch {
      setAliasRecords([]);
    }
  }

  async function remove(university: University) {
    if (!window.confirm(`确认删除“${university.nameZh}”？`)) return;
    setWorking(true);
    setError("");
    try {
      await api.deleteUniversity(university.id);
      await onRefresh();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "删除失败");
    } finally {
      setWorking(false);
    }
  }

  async function removeOffer(offerRecord: UniversityOfferRecord) {
    if (
      !window.confirm(
        `确认删除 ${offerRecord.year} 年 ${offerRecord.universityNameZh ?? offerRecord.universityId} 的 offer 记录？`,
      )
    ) {
      return;
    }
    setWorking(true);
    setError("");
    try {
      await api.deleteOfferRecord(offerRecord.id);
      await loadOfferRecords();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "删除失败");
    } finally {
      setWorking(false);
    }
  }

  async function saveAlias(event: React.FormEvent) {
    event.preventDefault();
    setWorking(true);
    setError("");
    try {
      await api.saveUniversityAlias({
        alias: aliasValue,
        universityId: aliasUniversityId,
        notes: aliasNotes,
      });
      setAliasValue("");
      setAliasNotes("");
      await loadAliases();
      await onRefresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "保存短链失败");
    } finally {
      setWorking(false);
    }
  }

  async function removeAlias(alias: UniversityAlias) {
    if (!window.confirm(`确认删除短链“${alias.alias}”？`)) return;
    setWorking(true);
    setError("");
    try {
      await api.deleteUniversityAlias(alias.alias);
      await loadAliases();
      await onRefresh();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "删除短链失败");
    } finally {
      setWorking(false);
    }
  }

  if (authenticated === null) {
    return (
      <div className="admin-loading">
        <Loader2 className="spin" />
        正在验证后台会话
      </div>
    );
  }

  if (!authenticated) {
    return (
      <main className="login-page">
        <a href="/" className="back-link">
          <ArrowLeft size={16} /> 返回公开地图
        </a>
        <form className="login-card" onSubmit={login}>
          <div className="login-icon">
            <KeyRound />
          </div>
          <div>
            <div className="eyebrow">UniScope Console</div>
            <h1>管理后台</h1>
            <p>维护学校资料、费用、申请要求和年度录取数据。</p>
          </div>
          <label>
            管理密码
            <input
              autoFocus
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="请输入密码"
            />
          </label>
          {error && <div className="form-error">{error}</div>}
          <button className="primary-button" disabled={working}>
            {working ? <Loader2 className="spin" size={17} /> : <KeyRound size={17} />}
            登录
          </button>
          <small>本地默认密码：ChangeMe2026!。生产部署必须通过 Worker Secret 修改。</small>
        </form>
      </main>
    );
  }

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <a href="/" className="back-link">
            <ArrowLeft size={16} /> 公开地图
          </a>
          <h1>大学资料库</h1>
          <p>所有时效性字段都应填写数据年份与一手来源。</p>
        </div>
        <div className="admin-actions">
          <button className="secondary-button" onClick={bootstrap} disabled={working}>
            <UploadCloud size={17} />
            补齐缺失到 D1
          </button>
          <button className="primary-button" onClick={() => setEditing(newUniversity())}>
            <Plus size={17} />
            新增学校
          </button>
          <button
            className="secondary-button"
            onClick={() => setEditingOffer(newOfferRecord(universities[0]))}
            disabled={!universities.length}
          >
            <BarChart3 size={17} />
            新增 Offer
          </button>
          <button
            className="icon-button"
            title="退出登录"
            onClick={async () => {
              await api.logout();
              setAuthenticated(false);
            }}
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <section className="admin-stats">
        <div>
          <Database size={20} />
          <span>当前数据源</span>
          <strong>{source.includes("d1") ? "D1 + 内置目录" : "内置目录"}</strong>
        </div>
        <div>
          <Check size={20} />
          <span>已发布</span>
          <strong>{universities.filter((item) => item.status === "published").length}</strong>
        </div>
        <div>
          <Edit3 size={20} />
          <span>覆盖区域</span>
          <strong>{new Set(universities.map((item) => item.countryCode)).size} / 6</strong>
        </div>
        <div>
          <BarChart3 size={20} />
          <span>Offer 补充</span>
          <strong>{offerRecords.length}</strong>
        </div>
        <div>
          <Database size={20} />
          <span>短链 Alias</span>
          <strong>{aliasRecords.length}</strong>
        </div>
      </section>

      {!source.includes("d1") && (
        <div className="admin-notice">
          目前展示的是内置样例数据。创建 D1、执行迁移后，点击“初始化到 D1”即可开始持久化编辑。
        </div>
      )}
      {error && <div className="form-error admin-error">{error}</div>}

      <section className="admin-table-card">
        <div className="admin-toolbar">
          <label className="search-box">
            <Search size={17} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索学校或城市"
            />
          </label>
          <span>{visible.length} 条记录</span>
        </div>
        <div className="admin-table-wrap">
          <table>
            <thead>
              <tr>
                <th>学校</th>
                <th>地区</th>
                <th>排名</th>
                <th>学费</th>
                <th>更新日期</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {visible.map((university) => (
                <tr key={university.id}>
                  <td>
                    <strong>{university.nameZh}</strong>
                    <small>{university.nameEn}</small>
                  </td>
                  <td>
                    {REGION_LABELS[university.countryCode]}
                    <small>{university.city}</small>
                  </td>
                  <td>
                    {university.rankingSystem === "U.S. News" ? "USN" : "QS"} #
                    {university.qsRank ?? "—"}
                  </td>
                  <td>
                    {university.tuition
                      ? `${university.tuition.amount.toLocaleString()} ${university.tuition.currency}`
                      : "—"}
                  </td>
                  <td>{university.updatedAt.slice(0, 10)}</td>
                  <td>
                    <div className="row-actions">
                      <button onClick={() => setEditing(university)} title="编辑">
                        <Edit3 size={16} />
                      </button>
                      <button onClick={() => remove(university)} title="删除">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-table-card offer-table-card">
        <div className="admin-toolbar">
          <div>
            <strong>大陆 Offer 补充库</strong>
            <small>按年份 + 世界大学 ID + offer 数保存，来源可指向截图或公开页面。</small>
          </div>
          <button
            className="secondary-button"
            onClick={() => setEditingOffer(newOfferRecord(universities[0]))}
            disabled={!universities.length}
          >
            <Plus size={16} />
            新增记录
          </button>
        </div>
        <div className="admin-table-wrap">
          <table>
            <thead>
              <tr>
                <th>年份</th>
                <th>世界大学</th>
                <th>Offer 数</th>
                <th>来源</th>
                <th>截图/备注</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {offerRecords.map((offerRecord) => (
                <tr key={offerRecord.id}>
                  <td>{offerRecord.year}</td>
                  <td>
                    <strong>{offerRecord.universityNameZh ?? offerRecord.universityId}</strong>
                    <small>{offerRecord.universityNameEn ?? offerRecord.universityId}</small>
                  </td>
                  <td>
                    <strong>{offerRecord.offerCount.toLocaleString()}</strong>
                    <small>{offerRecord.degreeLevel === "undergraduate" ? "本科" : offerRecord.degreeLevel}</small>
                  </td>
                  <td>
                    {offerRecord.sourceName}
                    <small>{sourceKindLabel(offerRecord.sourceKind)}</small>
                  </td>
                  <td>
                    {offerRecord.sourceSnapshot || offerRecord.notes || "—"}
                    {offerRecord.mainlandSchoolNameZh && <small>{offerRecord.mainlandSchoolNameZh}</small>}
                  </td>
                  <td>
                    <div className="row-actions">
                      <button onClick={() => setEditingOffer(offerRecord)} title="编辑">
                        <Edit3 size={16} />
                      </button>
                      <button onClick={() => removeOffer(offerRecord)} title="删除">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!offerRecords.length && (
                <tr>
                  <td colSpan={6}>
                    <small>还没有 offer 补充数据。可以先录入“翠鹿升学榜”截图里的总榜 offer 数。</small>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-table-card offer-table-card">
        <div className="admin-toolbar">
          <div>
            <strong>短链 Alias 管理</strong>
            <small>例如 ucl {"->"} university-college-london；保存后公开页会自动跳转成长 ID。</small>
          </div>
        </div>
        <form className="alias-form" onSubmit={saveAlias}>
          <input
            value={aliasValue}
            onChange={(event) => setAliasValue(event.target.value)}
            placeholder="短链，例如 ucl"
            required
          />
          <select
            value={aliasUniversityId}
            onChange={(event) => setAliasUniversityId(event.target.value)}
            required
          >
            {universities.map((university) => (
              <option key={university.id} value={university.id}>
                {university.nameZh} / {university.id}
              </option>
            ))}
          </select>
          <input
            value={aliasNotes}
            onChange={(event) => setAliasNotes(event.target.value)}
            placeholder="备注，可选"
          />
          <button className="secondary-button" disabled={working || !universities.length}>
            <Plus size={16} />
            保存短链
          </button>
        </form>
        <div className="admin-table-wrap">
          <table>
            <thead>
              <tr>
                <th>短链</th>
                <th>目标大学</th>
                <th>备注</th>
                <th>更新日期</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {aliasRecords.map((alias) => (
                <tr key={alias.alias}>
                  <td>
                    <strong>{alias.alias}</strong>
                    <small>/univ/{alias.alias}</small>
                  </td>
                  <td>
                    <strong>{alias.universityNameZh ?? alias.universityId}</strong>
                    <small>{alias.universityId}</small>
                  </td>
                  <td>{alias.notes || "—"}</td>
                  <td>{alias.updatedAt.slice(0, 10)}</td>
                  <td>
                    <div className="row-actions">
                      <button
                        type="button"
                        onClick={() => {
                          setAliasValue(alias.alias);
                          setAliasUniversityId(alias.universityId);
                          setAliasNotes(alias.notes);
                        }}
                        title="编辑"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button type="button" onClick={() => removeAlias(alias)} title="删除">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!aliasRecords.length && (
                <tr>
                  <td colSpan={5}>
                    <small>还没有短链配置。</small>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {editing && (
        <UniversityEditor
          initial={editing}
          onClose={() => setEditing(undefined)}
          onSaved={async () => {
            setEditing(undefined);
            await onRefresh();
          }}
        />
      )}

      {editingOffer && (
        <OfferRecordEditor
          initial={editingOffer}
          universities={universities}
          onClose={() => setEditingOffer(undefined)}
          onSaved={async () => {
            setEditingOffer(undefined);
            await loadOfferRecords();
          }}
        />
      )}
    </main>
  );
}

function UniversityEditor({
  initial,
  onClose,
  onSaved,
}: {
  initial: University;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [form, setForm] = useState(initial);
  const [strengths, setStrengths] = useState(initial.strengths.join("、"));
  const [tags, setTags] = useState(initial.tags.join("、"));
  const [history, setHistory] = useState(JSON.stringify(initial.admissionHistory, null, 2));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function update<K extends keyof University>(key: K, value: University[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const admissionHistory = JSON.parse(history) as University["admissionHistory"];
      await api.saveUniversity({
        ...form,
        strengths: strengths
          .split(/[、,|]/)
          .map((item) => item.trim())
          .filter(Boolean),
        tags: tags
          .split(/[、,|]/)
          .map((item) => item.trim())
          .filter(Boolean),
        admissionHistory,
      });
      await onSaved();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="editor-backdrop">
      <form className="editor-panel" onSubmit={save}>
        <header>
          <div>
            <div className="eyebrow">University record</div>
            <h2>{form.id ? "编辑学校资料" : "新增学校"}</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose}>
            <X size={19} />
          </button>
        </header>
        <div className="editor-body">
          <FormSection title="基本信息">
            <Field label="中文名">
              <input value={form.nameZh} onChange={(e) => update("nameZh", e.target.value)} required />
            </Field>
            <Field label="英文名">
              <input value={form.nameEn} onChange={(e) => update("nameEn", e.target.value)} required />
            </Field>
            <Field label="缩写">
              <input value={form.abbreviation} onChange={(e) => update("abbreviation", e.target.value)} />
            </Field>
            <Field label="地区">
              <select
                value={form.countryCode}
                onChange={(e) => update("countryCode", e.target.value as RegionCode)}
              >
                {(Object.entries(REGION_LABELS) as [RegionCode, string][]).map(([code, label]) => (
                  <option key={code} value={code}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="国家/地区英文">
              <input value={form.country} onChange={(e) => update("country", e.target.value)} required />
            </Field>
            <Field label="城市">
              <input value={form.city} onChange={(e) => update("city", e.target.value)} required />
            </Field>
            <Field label="纬度">
              <input
                type="number"
                step="any"
                value={form.latitude}
                onChange={(e) => update("latitude", Number(e.target.value))}
                required
              />
            </Field>
            <Field label="经度">
              <input
                type="number"
                step="any"
                value={form.longitude}
                onChange={(e) => update("longitude", Number(e.target.value))}
                required
              />
            </Field>
            <Field label="QS 排名">
              <input
                type="number"
                value={form.qsRank ?? ""}
                onChange={(e) => update("qsRank", e.target.value ? Number(e.target.value) : undefined)}
              />
            </Field>
            <Field label="排名年份">
              <input
                type="number"
                value={form.rankYear ?? ""}
                onChange={(e) => update("rankYear", e.target.value ? Number(e.target.value) : undefined)}
              />
            </Field>
          </FormSection>

          <FormSection title="费用与专业">
            <Field label="学费金额">
              <input
                type="number"
                value={form.tuition?.amount ?? ""}
                onChange={(e) =>
                  update("tuition", {
                    amount: Number(e.target.value),
                    currency: form.tuition?.currency ?? "USD",
                    period: "year",
                    year: form.tuition?.year ?? 2026,
                  })
                }
              />
            </Field>
            <Field label="学费币种">
              <input
                value={form.tuition?.currency ?? ""}
                onChange={(e) =>
                  update("tuition", {
                    amount: form.tuition?.amount ?? 0,
                    currency: e.target.value.toUpperCase(),
                    period: "year",
                    year: form.tuition?.year ?? 2026,
                  })
                }
              />
            </Field>
            <Field label="学费年份">
              <input
                type="number"
                value={form.tuition?.year ?? ""}
                onChange={(e) =>
                  update("tuition", {
                    amount: form.tuition?.amount ?? 0,
                    currency: form.tuition?.currency ?? "USD",
                    period: "year",
                    year: Number(e.target.value),
                  })
                }
              />
            </Field>
            <Field label="优势专业" wide>
              <input value={strengths} onChange={(e) => setStrengths(e.target.value)} placeholder="用顿号分隔" />
            </Field>
            <Field label="标签" wide>
              <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="例如：文理学院、STEM强校" />
            </Field>
            <Field label="月住宿费下限">
              <input
                type="number"
                value={form.housing?.min ?? ""}
                onChange={(e) =>
                  update("housing", {
                    min: Number(e.target.value),
                    max: form.housing?.max ?? 0,
                    currency: form.housing?.currency ?? "USD",
                    period: "month",
                    year: form.housing?.year ?? 2026,
                  })
                }
              />
            </Field>
            <Field label="月住宿费上限">
              <input
                type="number"
                value={form.housing?.max ?? ""}
                onChange={(e) =>
                  update("housing", {
                    min: form.housing?.min ?? 0,
                    max: Number(e.target.value),
                    currency: form.housing?.currency ?? "USD",
                    period: "month",
                    year: form.housing?.year ?? 2026,
                  })
                }
              />
            </Field>
          </FormSection>

          <FormSection title="申请与录取">
            <Field label="申请概述" wide>
              <textarea
                value={form.requirements.summary}
                onChange={(e) =>
                  update("requirements", { ...form.requirements, summary: e.target.value })
                }
              />
            </Field>
            <Field label="标化要求" wide>
              <textarea
                value={form.requirements.standardized}
                onChange={(e) =>
                  update("requirements", { ...form.requirements, standardized: e.target.value })
                }
              />
            </Field>
            <Field label="AP 要求" wide>
              <textarea
                value={form.requirements.ap}
                onChange={(e) => update("requirements", { ...form.requirements, ap: e.target.value })}
              />
            </Field>
            <Field label="竞赛说明" wide>
              <textarea
                value={form.requirements.competitions}
                onChange={(e) =>
                  update("requirements", { ...form.requirements, competitions: e.target.value })
                }
              />
            </Field>
            <Field label="语言要求" wide>
              <textarea
                value={form.requirements.language}
                onChange={(e) =>
                  update("requirements", { ...form.requirements, language: e.target.value })
                }
              />
            </Field>
            <Field label="录取历史 JSON" wide>
              <textarea className="code-input" value={history} onChange={(e) => setHistory(e.target.value)} />
            </Field>
            <Field label="大陆招生说明" wide>
              <textarea
                value={form.mainlandChinaIntake?.note ?? ""}
                onChange={(e) =>
                  update("mainlandChinaIntake", {
                    ...form.mainlandChinaIntake,
                    year: form.mainlandChinaIntake?.year ?? 2026,
                    note: e.target.value,
                  })
                }
              />
            </Field>
          </FormSection>

          <FormSection title="链接与发布">
            <Field label="学校官网" wide>
              <input value={form.website} onChange={(e) => update("website", e.target.value)} />
            </Field>
            <Field label="招生官网" wide>
              <input value={form.admissionsUrl} onChange={(e) => update("admissionsUrl", e.target.value)} />
            </Field>
            <Field label="发布状态">
              <select
                value={form.status}
                onChange={(e) => update("status", e.target.value as University["status"])}
              >
                <option value="published">已发布</option>
                <option value="draft">草稿</option>
              </select>
            </Field>
          </FormSection>
          {error && <div className="form-error">{error}</div>}
        </div>
        <footer>
          <button type="button" className="secondary-button" onClick={onClose}>
            取消
          </button>
          <button className="primary-button" disabled={saving}>
            {saving ? <Loader2 className="spin" size={17} /> : <Save size={17} />}
            保存学校
          </button>
        </footer>
      </form>
    </div>
  );
}

function OfferRecordEditor({
  initial,
  universities,
  onClose,
  onSaved,
}: {
  initial: UniversityOfferRecord;
  universities: University[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [form, setForm] = useState(initial);
  const [filters, setFilters] = useState(JSON.stringify(initial.filters, null, 2));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function update<K extends keyof UniversityOfferRecord>(key: K, value: UniversityOfferRecord[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const parsedFilters = JSON.parse(filters) as Record<string, string>;
      await api.saveOfferRecord({ ...form, filters: parsedFilters });
      await onSaved();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="editor-backdrop">
      <form className="editor-panel" onSubmit={save}>
        <header>
          <div>
            <div className="eyebrow">Offer evidence</div>
            <h2>编辑 Offer 补充记录</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose}>
            <X size={19} />
          </button>
        </header>
        <div className="editor-body">
          <FormSection title="核心字段">
            <Field label="申请年份">
              <input
                type="number"
                value={form.year}
                onChange={(e) => update("year", Number(e.target.value))}
                required
              />
            </Field>
            <Field label="世界大学">
              <select
                value={form.universityId}
                onChange={(e) => update("universityId", e.target.value)}
                required
              >
                {universities.map((university) => (
                  <option key={university.id} value={university.id}>
                    {university.nameZh} / {university.nameEn}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Offer 数">
              <input
                type="number"
                min={0}
                value={form.offerCount}
                onChange={(e) => update("offerCount", Number(e.target.value))}
                required
              />
            </Field>
            <Field label="申请阶段">
              <select
                value={form.degreeLevel}
                onChange={(e) =>
                  update("degreeLevel", e.target.value as UniversityOfferRecord["degreeLevel"])
                }
              >
                <option value="undergraduate">本科</option>
                <option value="graduate">研究生</option>
                <option value="foundation">预科</option>
                <option value="other">其他</option>
              </select>
            </Field>
          </FormSection>

          <FormSection title="来源与口径">
            <Field label="来源名称">
              <input
                value={form.sourceName}
                onChange={(e) => update("sourceName", e.target.value)}
                placeholder="例如：翠鹿升学榜"
                required
              />
            </Field>
            <Field label="来源类型">
              <select
                value={form.sourceKind}
                onChange={(e) =>
                  update("sourceKind", e.target.value as UniversityOfferRecord["sourceKind"])
                }
              >
                <option value="screenshot">截图</option>
                <option value="official">学校公开</option>
                <option value="api">接口</option>
                <option value="manual">手动整理</option>
              </select>
            </Field>
            <Field label="来源链接" wide>
              <input value={form.sourceUrl ?? ""} onChange={(e) => update("sourceUrl", e.target.value)} />
            </Field>
            <Field label="截图/文件名" wide>
              <input
                value={form.sourceSnapshot ?? ""}
                onChange={(e) => update("sourceSnapshot", e.target.value)}
                placeholder="例如：CleanShot 2026-06-10 at 09.29.41@2x.png"
              />
            </Field>
            <Field label="筛选条件 JSON" wide>
              <textarea className="code-input" value={filters} onChange={(e) => setFilters(e.target.value)} />
            </Field>
            <Field label="备注" wide>
              <textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} />
            </Field>
          </FormSection>
          {error && <div className="form-error">{error}</div>}
        </div>
        <footer>
          <button type="button" className="secondary-button" onClick={onClose}>
            取消
          </button>
          <button className="primary-button" disabled={saving}>
            {saving ? <Loader2 className="spin" size={17} /> : <Save size={17} />}
            保存 Offer
          </button>
        </footer>
      </form>
    </div>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="form-section">
      <h3>{title}</h3>
      <div className="form-grid">{children}</div>
    </section>
  );
}

function Field({
  label,
  wide,
  children,
}: {
  label: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={wide ? "wide" : ""}>
      {label}
      {children}
    </label>
  );
}

function sourceKindLabel(kind: UniversityOfferRecord["sourceKind"]) {
  return {
    screenshot: "截图",
    official: "学校公开",
    api: "接口",
    manual: "手动整理",
  }[kind];
}

function newUniversity(): University {
  const id = crypto.randomUUID();
  return {
    id,
    slug: id,
    nameEn: "",
    nameZh: "",
    abbreviation: "",
    country: "United States",
    countryCode: "US",
    city: "",
    latitude: 0,
    longitude: 0,
    rankYear: 2026,
    website: "",
    admissionsUrl: "",
    strengths: [],
    requirements: {
      summary: "",
      standardized: "",
      ap: "",
      competitions: "",
      language: "",
      year: 2026,
    },
    admissionHistory: [],
    sources: [],
    tags: [],
    status: "draft",
    updatedAt: new Date().toISOString(),
  };
}

function newOfferRecord(university?: University): UniversityOfferRecord {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    year: 2026,
    universityId: university?.id ?? "",
    offerCount: 0,
    degreeLevel: "undergraduate",
    sourceName: "翠鹿升学榜",
    sourceKind: "screenshot",
    filters: {
      degree: "本科",
      ranking: "中国学生榜",
    },
    notes: "",
    createdAt: now,
    updatedAt: now,
  };
}
