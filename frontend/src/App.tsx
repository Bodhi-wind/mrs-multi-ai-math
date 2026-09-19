import { useEffect, useState } from 'react';
import { Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import { api, type Problem, type Campaign, type Role, type Stats, type Session, type Artifact, type Literature } from './api';
import { Markdown } from './markdown';
import {
  Sidebar, PageHeader, StatusBadge, DiffBar, Modal, ROLE_ICONS,
  Plus, ArrowLeft, Play, Sparkles,
} from './components';

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main">{children}</main>
    </div>
  );
}

/* ───────────────── Dashboard ───────────────── */
function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [board, setBoard] = useState<Awaited<ReturnType<typeof api.board>> | null>(null);

  useEffect(() => {
    api.stats().then(setStats).catch(console.error);
    api.board().then(setBoard).catch(console.error);
  }, []);

  if (!stats || !board) return <div className="loading">加载 MRS 系统…</div>;

  return (
    <Shell>
      <PageHeader
        title="MRS 总览看板"
        subtitle="Multi-Role System · 可接入 Arena.ai Agent · 多结果整合 · 提示词工坊 — 仅限合法数学研究"
        actions={
          <>
            <a className="btn btn-secondary" href="https://arena.ai/agent/" target="_blank" rel="noreferrer">
              Arena Agent
            </a>
            <Link className="btn btn-secondary" to="/prompts">
              提示词工坊
            </Link>
            <Link className="btn btn-primary" to="/problems">
              <LibraryIcon /> 进入问题库
            </Link>
          </>
        }
      />

      <div className="grid-stats">
        <div className="stat-card">
          <div className="label">前沿问题</div>
          <div className="value">{stats.problems}</div>
          <div className="hint">{stats.open} 仍在攻克</div>
        </div>
        <div className="stat-card">
          <div className="label">活跃战役</div>
          <div className="value">{stats.activeCampaigns}</div>
          <div className="hint">共 {stats.campaigns} 场</div>
        </div>
        <div className="stat-card">
          <div className="label">协作角色</div>
          <div className="value">{stats.roles}</div>
          <div className="hint">MRS 六角色</div>
        </div>
        <div className="stat-card">
          <div className="label">证明工件</div>
          <div className="value">{stats.artifacts}</div>
          <div className="hint">{stats.literature} 篇文献</div>
        </div>
      </div>

      <div className="two-col">
        <div>
          <div className="card" style={{ marginBottom: 18 }}>
            <div className="card-header">
              <h3>高优先级开放问题</h3>
              <Link to="/problems" className="btn btn-ghost btn-sm">全部</Link>
            </div>
            <div className="card-body" style={{ paddingTop: 4 }}>
              {board.openProblems.slice(0, 8).map((p) => (
                <Link key={p.id} to={`/problems/${p.slug}`} className="list-row" style={{ color: 'inherit', textDecoration: 'none' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{p.title_zh}</div>
                    <div style={{ color: 'var(--text-dim)', fontSize: 12, marginTop: 2 }}>
                      {p.field} · {p.title}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {!!p.millennium && <span className="badge badge-millennium">千禧</span>}
                    <StatusBadge status={p.status} />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3>活跃攻克战役</h3>
              <Link to="/campaigns" className="btn btn-ghost btn-sm">管理</Link>
            </div>
            <div className="card-body">
              {board.activeCampaigns.length === 0 && <div className="empty">暂无活跃战役</div>}
              {board.activeCampaigns.map((c) => (
                <Link key={c.id} to={`/campaigns/${c.id}`} className="kb-link">
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{c.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                    {c.problem_title_zh}
                  </div>
                  <div className="progress-bar">
                    <div style={{ width: `${c.progress || 0}%` }} />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>{c.progress || 0}%</div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="card" style={{ marginBottom: 18 }}>
            <div className="card-header">
              <h3>MRS 六角色</h3>
              <Link to="/roles" className="btn btn-ghost btn-sm">详情</Link>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {board.roles.map((r) => {
                const Icon = ROLE_ICONS[r.icon] || Sparkles;
                return (
                  <div key={r.id} className="role-card" style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <div className="role-dot" style={{ color: r.color, background: r.color }} />
                    <Icon size={16} style={{ color: r.color }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{r.name_zh} · {r.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{r.description_zh}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h3>领域分布</h3></div>
            <div className="card-body">
              {stats.byField.map((f) => (
                <div key={f.field} className="list-row">
                  <span>{f.field}</span>
                  <span className="mono" style={{ color: 'var(--accent)' }}>{f.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}

function LibraryIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

/* ───────────────── Problems ───────────────── */
function ProblemsPage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [fields, setFields] = useState<string[]>([]);
  const [q, setQ] = useState('');
  const [field, setField] = useState('');
  const [status, setStatus] = useState('');
  const [millennium, setMillennium] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const navigate = useNavigate();

  const load = () => {
    const params: Record<string, string> = {};
    if (q) params.q = q;
    if (field) params.field = field;
    if (status) params.status = status;
    if (millennium) params.millennium = '1';
    api.problems(params).then(setProblems).catch(console.error);
  };

  useEffect(() => {
    api.fields().then(setFields).catch(console.error);
  }, []);

  useEffect(() => {
    const t = setTimeout(load, 150);
    return () => clearTimeout(t);
  }, [q, field, status, millennium]);

  return (
    <Shell>
      <PageHeader
        title="前沿问题库"
        subtitle="全覆盖可扩展库：千禧年问题、当代研究前沿、AI4Math 与经典未解猜想。追踪状态、障碍与部分结果。"
        actions={
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={14} /> 录入问题
          </button>
        }
      />

      <div className="filters">
        <input className="input" placeholder="搜索标题 / 摘要 / 标签…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="select" value={field} onChange={(e) => setField(e.target.value)}>
          <option value="">全部领域</option>
          {fields.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
        <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">全部状态</option>
          <option value="open">开放</option>
          <option value="partial">部分进展</option>
          <option value="active-frontier">活跃前沿</option>
          <option value="contested">有争议</option>
          <option value="resolved">已解决</option>
        </select>
        <button
          className={clsx('btn', millennium ? 'btn-primary' : 'btn-secondary')}
          onClick={() => setMillennium((v) => !v)}
        >
          千禧年问题
        </button>
      </div>

      <div style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-dim)' }}>
        共 {problems.length} 个问题
      </div>

      <div className="problem-grid">
        {problems.map((p) => (
          <button key={p.id} className="problem-card" onClick={() => navigate(`/problems/${p.slug}`)}>
            <div className="meta">
              <span className="badge badge-field">{p.field}</span>
              <StatusBadge status={p.status} />
              {!!p.millennium && <span className="badge badge-millennium">千禧</span>}
            </div>
            <h3>{p.title_zh}</h3>
            <div className="en-title">{p.title}</div>
            <p className="summary">{p.summary_zh || p.summary}</p>
            <div className="footer">
              <DiffBar n={p.difficulty} />
              <span>优先级 {p.priority}</span>
            </div>
          </button>
        ))}
      </div>

      <CreateProblemModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={(slug) => {
          setShowCreate(false);
          load();
          navigate(`/problems/${slug}`);
        }}
      />
    </Shell>
  );
}

function clsx(...xs: (string | false | undefined)[]) {
  return xs.filter(Boolean).join(' ');
}

function CreateProblemModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (slug: string) => void;
}) {
  const [form, setForm] = useState({
    title: '',
    title_zh: '',
    field: 'Number Theory',
    subfield: '',
    summary: '',
    summary_zh: '',
    formal_statement: '',
    difficulty: 7,
    priority: 60,
    status: 'open',
    tags: '',
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async () => {
    setBusy(true);
    setErr('');
    try {
      const res = await api.createProblem({
        ...form,
        difficulty: Number(form.difficulty),
        priority: Number(form.priority),
        tags: form.tags.split(/[,，]/).map((t) => t.trim()).filter(Boolean),
      } as any);
      onCreated(res.slug);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const set = (k: string, v: string | number) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Modal
      open={open}
      title="录入前沿问题"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>取消</button>
          <button className="btn btn-primary" disabled={busy} onClick={submit}>
            {busy ? '提交中…' : '创建'}
          </button>
        </>
      }
    >
      {err && <div style={{ color: 'var(--danger)', fontSize: 13 }}>{err}</div>}
      <div>
        <label className="form-label">中文标题 *</label>
        <input className="input" value={form.title_zh} onChange={(e) => set('title_zh', e.target.value)} />
      </div>
      <div>
        <label className="form-label">英文标题 *</label>
        <input className="input" value={form.title} onChange={(e) => set('title', e.target.value)} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <label className="form-label">领域 *</label>
          <input className="input" value={form.field} onChange={(e) => set('field', e.target.value)} />
        </div>
        <div>
          <label className="form-label">子领域</label>
          <input className="input" value={form.subfield} onChange={(e) => set('subfield', e.target.value)} />
        </div>
      </div>
      <div>
        <label className="form-label">中文摘要 *</label>
        <textarea className="textarea" value={form.summary_zh} onChange={(e) => set('summary_zh', e.target.value)} />
      </div>
      <div>
        <label className="form-label">英文摘要 *</label>
        <textarea className="textarea" value={form.summary} onChange={(e) => set('summary', e.target.value)} />
      </div>
      <div>
        <label className="form-label">形式陈述</label>
        <textarea className="textarea" value={form.formal_statement} onChange={(e) => set('formal_statement', e.target.value)} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <div>
          <label className="form-label">难度 1–10</label>
          <input className="input" type="number" min={1} max={10} value={form.difficulty} onChange={(e) => set('difficulty', e.target.value)} />
        </div>
        <div>
          <label className="form-label">优先级</label>
          <input className="input" type="number" value={form.priority} onChange={(e) => set('priority', e.target.value)} />
        </div>
        <div>
          <label className="form-label">状态</label>
          <select className="select" value={form.status} onChange={(e) => set('status', e.target.value)}>
            <option value="open">open</option>
            <option value="partial">partial</option>
            <option value="active-frontier">active-frontier</option>
            <option value="contested">contested</option>
            <option value="resolved">resolved</option>
          </select>
        </div>
      </div>
      <div>
        <label className="form-label">标签（逗号分隔）</label>
        <input className="input" value={form.tags} onChange={(e) => set('tags', e.target.value)} />
      </div>
    </Modal>
  );
}

/* ───────────────── Problem Detail ───────────────── */
function ProblemDetailPage() {
  const { slug } = useParams();
  const [p, setP] = useState<Problem | null>(null);
  const [tab, setTab] = useState('overview');
  const [showCampaign, setShowCampaign] = useState(false);
  const [campTitle, setCampTitle] = useState('');
  const [campStrategy, setCampStrategy] = useState('');
  const navigate = useNavigate();

  const load = () => {
    if (slug) api.problem(slug).then(setP).catch(console.error);
  };
  useEffect(load, [slug]);

  if (!p) return <Shell><div className="loading">加载问题…</div></Shell>;

  const startCampaign = async () => {
    const title = campTitle || `${p.title_zh} 攻克战役`;
    const res = await api.createCampaign({
      problem_id: p.id,
      title,
      strategy: campStrategy || undefined,
    });
    setShowCampaign(false);
    navigate(`/campaigns/${res.id}`);
  };

  return (
    <Shell>
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: 12 }} onClick={() => navigate('/problems')}>
        <ArrowLeft size={14} /> 返回问题库
      </button>

      <PageHeader
        title={p.title_zh}
        subtitle={p.title}
        actions={
          <button className="btn btn-primary" onClick={() => {
            setCampTitle(`${p.title_zh} · MRS 战役`);
            setShowCampaign(true);
          }}>
            <Sparkles size={14} /> 发起攻克战役
          </button>
        }
      />

      <div className="meta" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        <span className="badge badge-field">{p.field}{p.subfield ? ` · ${p.subfield}` : ''}</span>
        <StatusBadge status={p.status} />
        {!!p.millennium && <span className="badge badge-millennium">Clay Millennium</span>}
        <DiffBar n={p.difficulty} />
        {(p.tags || []).map((t) => (
          <span key={t} className="tag">{t}</span>
        ))}
      </div>

      <div className="tabs">
        {[
          ['overview', '概览'],
          ['technical', '技术细节'],
          ['campaigns', `战役 (${p.campaigns?.length || 0})`],
          ['literature', `文献 (${p.literature?.length || 0})`],
          ['artifacts', `工件 (${p.artifacts?.length || 0})`],
        ].map(([k, label]) => (
          <button key={k} className={clsx('tab', tab === k && 'active')} onClick={() => setTab(k)}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="two-col">
          <div className="card">
            <div className="card-header"><h3>摘要</h3></div>
            <div className="card-body markdown-body">
              <p>{p.summary_zh}</p>
              <hr />
              <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>{p.summary}</p>
            </div>
          </div>
          <div className="card">
            <div className="card-header"><h3>形式陈述</h3></div>
            <div className="card-body">
              <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}><code>{p.formal_statement || '（待补充）'}</code></pre>
            </div>
          </div>
        </div>
      )}

      {tab === 'technical' && (
        <div className="two-col">
          <div className="card">
            <div className="card-header"><h3>已知部分结果</h3></div>
            <div className="card-body"><p style={{ fontSize: 14, lineHeight: 1.7 }}>{p.known_partial || '—'}</p></div>
          </div>
          <div className="card">
            <div className="card-header"><h3>关键障碍</h3></div>
            <div className="card-body"><p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--warn)' }}>{p.key_obstacles || '—'}</p></div>
          </div>
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <div className="card-header"><h3>核心参考文献</h3></div>
            <div className="card-body">
              {(p.references || []).length === 0 && <div className="empty">暂无</div>}
              {(p.references || []).map((r, i) => (
                <div key={i} className="list-row">
                  <span>{r.title}</span>
                  <span className="mono" style={{ color: 'var(--text-dim)' }}>{r.year}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'campaigns' && (
        <div className="card">
          <div className="card-body">
            {(p.campaigns || []).length === 0 && (
              <div className="empty">
                <h3>尚无战役</h3>
                <p>发起一场 MRS 多角色攻克战役，开始系统推进。</p>
                <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => setShowCampaign(true)}>
                  发起战役
                </button>
              </div>
            )}
            {(p.campaigns || []).map((c) => (
              <Link key={c.id} to={`/campaigns/${c.id}`} className="kb-link">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{c.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{c.strategy}</div>
                  </div>
                  <StatusBadge status={c.status} />
                </div>
                <div className="progress-bar" style={{ marginTop: 10 }}>
                  <div style={{ width: `${c.progress || 0}%` }} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {tab === 'literature' && (
        <div className="card">
          <div className="card-body">
            {(p.literature || []).map((l) => (
              <div key={l.id} className="list-row" style={{ alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{l.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {l.authors} · {l.year} · {l.venue}
                  </div>
                  {l.notes && <div style={{ fontSize: 12, marginTop: 4 }}>{l.notes}</div>}
                </div>
                {l.url && (
                  <a href={l.url} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
                    打开
                  </a>
                )}
              </div>
            ))}
            {(p.literature || []).length === 0 && <div className="empty">暂无文献条目</div>}
          </div>
        </div>
      )}

      {tab === 'artifacts' && (
        <div className="card">
          <div className="card-body">
            {(p.artifacts || []).map((a) => (
              <details key={a.id} style={{ marginBottom: 12, border: '1px solid var(--border)', borderRadius: 10, padding: 12 }}>
                <summary style={{ cursor: 'pointer', fontWeight: 600 }}>
                  <span className="tag" style={{ marginRight: 8 }}>{a.kind}</span>
                  {a.title}
                  <span style={{ marginLeft: 8 }}><StatusBadge status={a.status} /></span>
                </summary>
                <div style={{ marginTop: 12 }}>
                  <Markdown content={a.content} />
                </div>
              </details>
            ))}
            {(p.artifacts || []).length === 0 && <div className="empty">暂无工件</div>}
          </div>
        </div>
      )}

      <Modal
        open={showCampaign}
        title="发起 MRS 攻克战役"
        onClose={() => setShowCampaign(false)}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowCampaign(false)}>取消</button>
            <button className="btn btn-primary" onClick={startCampaign}>创建战役</button>
          </>
        }
      >
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          将自动创建 MRS 标准里程碑：Explorer → Historian → Prover → Critic → Formalizer → Synthesizer
        </p>
        <div>
          <label className="form-label">战役名称</label>
          <input className="input" value={campTitle} onChange={(e) => setCampTitle(e.target.value)} />
        </div>
        <div>
          <label className="form-label">策略说明</label>
          <textarea
            className="textarea"
            placeholder="例如：优先走谱解释路线，并行形式化显式公式工具箱…"
            value={campStrategy}
            onChange={(e) => setCampStrategy(e.target.value)}
          />
        </div>
      </Modal>
    </Shell>
  );
}

/* ───────────────── Campaigns ───────────────── */
function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  useEffect(() => {
    api.campaigns().then(setCampaigns).catch(console.error);
  }, []);

  return (
    <Shell>
      <PageHeader
        title="攻克战役"
        subtitle="每场战役绑定一个前沿问题，按 MRS 多角色流水线推进，并追踪里程碑与进度。"
      />
      <div className="problem-grid">
        {campaigns.map((c) => (
          <Link key={c.id} to={`/campaigns/${c.id}`} className="problem-card" style={{ textDecoration: 'none' }}>
            <div className="meta">
              <StatusBadge status={c.status} />
              <span className="badge badge-field">{c.field}</span>
            </div>
            <h3>{c.title}</h3>
            <div className="en-title">{c.problem_title_zh}</div>
            <p className="summary">{c.strategy || c.notes || '暂无策略说明'}</p>
            <div className="footer">
              <div className="progress-bar" style={{ flex: 1, marginRight: 12 }}>
                <div style={{ width: `${c.progress || 0}%` }} />
              </div>
              <span>{c.progress || 0}%</span>
            </div>
          </Link>
        ))}
      </div>
      {campaigns.length === 0 && (
        <div className="empty card">
          <h3>还没有战役</h3>
          <p>从问题库选择一个前沿问题并「发起攻克战役」。</p>
          <Link to="/problems" className="btn btn-primary" style={{ marginTop: 12, display: 'inline-flex' }}>
            去问题库
          </Link>
        </div>
      )}
    </Shell>
  );
}

function CampaignDetailPage() {
  const { id } = useParams();
  const [c, setC] = useState<Campaign | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [focus, setFocus] = useState('');
  const [note, setNote] = useState('');
  const [running, setRunning] = useState(false);
  const [progressEdit, setProgressEdit] = useState<number | null>(null);
  const navigate = useNavigate();

  const load = async () => {
    if (!id) return;
    const data = await api.campaign(id);
    setC(data);
    setProgressEdit(data.progress || 0);
  };

  useEffect(() => {
    load().catch(console.error);
    api.roles().then(setRoles).catch(console.error);
  }, [id]);

  const openSession = async (sid: string) => {
    const s = await api.session(sid);
    setActiveSession(s);
  };

  const startRoleSession = async (roleId: string) => {
    if (!c) return;
    const role = roles.find((r) => r.id === roleId);
    const res = await api.createSession({
      campaign_id: c.id,
      role_id: roleId,
      title: `${role?.name_zh || '角色'} · ${c.problem_title_zh}`,
    });
    await load();
    await openSession(res.id);
  };

  const runRole = async () => {
    if (!activeSession) return;
    setRunning(true);
    try {
      await api.runRole(activeSession.id, focus || undefined);
      await openSession(activeSession.id);
      await load();
    } finally {
      setRunning(false);
    }
  };

  const sendNote = async () => {
    if (!activeSession || !note.trim()) return;
    await api.postMessage(activeSession.id, { content: note, sender: 'User', message_type: 'note' });
    setNote('');
    await openSession(activeSession.id);
  };

  const toggleMilestone = async (m: { id: string; status: string }) => {
    const next = m.status === 'completed' ? 'pending' : m.status === 'active' ? 'completed' : 'active';
    await api.updateMilestone(m.id, { status: next });
    await load();
  };

  const saveProgress = async () => {
    if (!c || progressEdit === null) return;
    await api.updateCampaign(c.id, { progress: progressEdit });
    await load();
  };

  if (!c) return <Shell><div className="loading">加载战役…</div></Shell>;

  return (
    <Shell>
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: 12 }} onClick={() => navigate('/campaigns')}>
        <ArrowLeft size={14} /> 返回战役列表
      </button>

      <PageHeader
        title={c.title}
        subtitle={`${c.problem_title_zh} · ${c.problem_title}`}
        actions={
          <Link className="btn btn-secondary" to={`/problems/${c.problem_slug}`}>
            查看问题
          </Link>
        }
      />

      <div className="grid-stats" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
        <div className="stat-card">
          <div className="label">状态</div>
          <div style={{ marginTop: 8 }}><StatusBadge status={c.status} /></div>
        </div>
        <div className="stat-card">
          <div className="label">进度</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
            <input
              className="input"
              style={{ maxWidth: 80 }}
              type="number"
              min={0}
              max={100}
              value={progressEdit ?? 0}
              onChange={(e) => setProgressEdit(Number(e.target.value))}
            />
            <button className="btn btn-secondary btn-sm" onClick={saveProgress}>保存</button>
          </div>
          <div className="progress-bar" style={{ marginTop: 10 }}>
            <div style={{ width: `${c.progress || 0}%` }} />
          </div>
        </div>
        <div className="stat-card">
          <div className="label">会话 / 里程碑</div>
          <div className="value" style={{ fontSize: 22 }}>
            {c.sessions?.length || 0} / {c.milestones?.length || 0}
          </div>
        </div>
      </div>

      {c.strategy && (
        <div className="card" style={{ marginBottom: 18 }}>
          <div className="card-header"><h3>战役策略</h3></div>
          <div className="card-body" style={{ fontSize: 14, color: 'var(--text-muted)' }}>{c.strategy}</div>
        </div>
      )}

      <div className="two-col">
        <div>
          <div className="card" style={{ marginBottom: 18 }}>
            <div className="card-header">
              <h3>启动角色会话</h3>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
                {roles.map((r) => {
                  const Icon = ROLE_ICONS[r.icon] || Sparkles;
                  return (
                    <button
                      key={r.id}
                      className="btn btn-secondary"
                      style={{ justifyContent: 'flex-start', borderColor: r.color + '55' }}
                      onClick={() => startRoleSession(r.id)}
                    >
                      <Icon size={14} style={{ color: r.color }} />
                      {r.name_zh}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 18 }}>
            <div className="card-header"><h3>会话列表</h3></div>
            <div className="card-body" style={{ paddingTop: 4 }}>
              {(c.sessions || []).map((s) => (
                <button
                  key={s.id}
                  className="list-row"
                  style={{ width: '100%', textAlign: 'left', background: activeSession?.id === s.id ? 'var(--bg-hover)' : undefined, borderRadius: 8, padding: '10px 8px' }}
                  onClick={() => openSession(s.id)}
                >
                  <div>
                    <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="role-dot" style={{ background: s.role_color, width: 8, height: 8 }} />
                      {s.title || s.role_name_zh}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>{s.role_name_zh}</div>
                  </div>
                  <StatusBadge status={s.status} />
                </button>
              ))}
              {(c.sessions || []).length === 0 && <div className="empty">选择上方角色开始协作</div>}
            </div>
          </div>

          {activeSession && (
            <div className="card">
              <div className="card-header">
                <h3>
                  <span style={{ color: activeSession.role_color }}>{activeSession.role_name_zh}</span>
                  {' '}会话
                </h3>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    className="input"
                    style={{ maxWidth: 200 }}
                    placeholder="本轮焦点（可选）"
                    value={focus}
                    onChange={(e) => setFocus(e.target.value)}
                  />
                  <button className="btn btn-primary" disabled={running} onClick={runRole}>
                    <Play size={14} /> {running ? '生成中…' : '运行角色'}
                  </button>
                </div>
              </div>
              <div className="card-body">
                <div className="message-list">
                  {(activeSession.messages || []).map((m) => (
                    <div key={m.id} className="message">
                      <div className="message-head">
                        <span>
                          <strong>{m.sender}</strong>
                          <span className="tag" style={{ marginLeft: 8 }}>{m.message_type}</span>
                        </span>
                        <span style={{ color: 'var(--text-dim)' }}>{m.created_at?.replace('T', ' ').slice(0, 19)}</span>
                      </div>
                      <div className="message-body">
                        <Markdown content={m.content} />
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                  <textarea
                    className="textarea"
                    style={{ minHeight: 60 }}
                    placeholder="添加人类注释 / 指导…"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                  <button className="btn btn-secondary" onClick={sendNote}>发送</button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="card" style={{ marginBottom: 18 }}>
            <div className="card-header"><h3>里程碑</h3></div>
            <div className="card-body">
              <div className="milestone-list">
                {(c.milestones || []).map((m) => (
                  <button
                    key={m.id}
                    className={clsx('milestone', m.status)}
                    onClick={() => toggleMilestone(m)}
                    title="点击切换状态"
                  >
                    <div className="ms-check">{m.status === 'completed' ? '✓' : m.order_index}</div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 600 }}>{m.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>{m.status}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h3>战役工件</h3></div>
            <div className="card-body">
              {(c.artifacts || []).map((a) => (
                <details key={a.id} style={{ marginBottom: 10 }}>
                  <summary style={{ cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                    <span className="tag">{a.kind}</span> {a.title}
                  </summary>
                  <div style={{ marginTop: 8 }}>
                    <Markdown content={a.content} />
                  </div>
                </details>
              ))}
              {(c.artifacts || []).length === 0 && <div className="empty">暂无工件</div>}
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}

/* ───────────────── Roles ───────────────── */
function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [selected, setSelected] = useState<Role | null>(null);

  useEffect(() => {
    api.roles().then((r) => {
      setRoles(r);
      setSelected(r[0] || null);
    });
  }, []);

  return (
    <Shell>
      <PageHeader
        title="多角色系统 (MRS)"
        subtitle="Multi-Role System：六类专业化 AI 角色协同推进数学前沿问题——勘察、证明、批判、形式化、综合与史鉴。"
      />
      <div className="three-col" style={{ marginBottom: 20 }}>
        {roles.map((r) => {
          const Icon = ROLE_ICONS[r.icon] || Sparkles;
          return (
            <button
              key={r.id}
              className="role-card"
              style={{
                cursor: 'pointer',
                borderColor: selected?.id === r.id ? r.color : undefined,
                boxShadow: selected?.id === r.id ? `0 0 0 1px ${r.color}55` : undefined,
                textAlign: 'left',
              }}
              onClick={() => setSelected(r)}
            >
              <div className="role-top">
                <div className="role-dot" style={{ background: r.color, color: r.color }} />
                <Icon size={18} style={{ color: r.color }} />
                <h4>{r.name_zh}</h4>
                <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-dim)' }}>{r.name}</span>
              </div>
              <p>{r.description_zh}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {(r.capabilities || []).map((c) => (
                  <span key={c} className="tag">{c}</span>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="card">
          <div className="card-header">
            <h3 style={{ color: selected.color }}>
              {selected.name_zh} · System Prompt
            </h3>
          </div>
          <div className="card-body">
            <p style={{ marginBottom: 14, color: 'var(--text-muted)' }}>{selected.description}</p>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13, lineHeight: 1.6, margin: 0 }}>
              <code>{selected.system_prompt}</code>
            </pre>
          </div>
        </div>
      )}
    </Shell>
  );
}

/* ───────────────── Artifacts / Literature / Activity ───────────────── */
function ArtifactsPage() {
  const [items, setItems] = useState<Artifact[]>([]);
  useEffect(() => {
    api.artifacts().then(setItems).catch(console.error);
  }, []);

  return (
    <Shell>
      <PageHeader title="证明工件库" subtitle="策略文档、Lean 草稿、引理笔记与综合报告的统一存放处。" />
      {items.map((a) => (
        <details key={a.id} className="card" style={{ marginBottom: 12, padding: 0 }}>
          <summary className="card-header" style={{ cursor: 'pointer', listStyle: 'none' }}>
            <h3>
              <span className="tag" style={{ marginRight: 8 }}>{a.kind}</span>
              {a.title}
            </h3>
            <StatusBadge status={a.status} />
          </summary>
          <div className="card-body">
            <Markdown content={a.content} />
          </div>
        </details>
      ))}
      {items.length === 0 && <div className="empty card">暂无工件</div>}
    </Shell>
  );
}

function LiteraturePage() {
  const [items, setItems] = useState<Literature[]>([]);
  useEffect(() => {
    api.literature().then(setItems).catch(console.error);
  }, []);

  return (
    <Shell>
      <PageHeader title="文献库" subtitle="与前沿问题绑定的核心文献、笔记与相关度标注。" />
      <div className="card">
        <div className="card-body">
          {items.map((l) => (
            <div key={l.id} className="list-row" style={{ alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontWeight: 600 }}>{l.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  {l.authors} · {l.year} · {l.venue || '—'}
                  {l.problem_title_zh && <> · 关联：{l.problem_title_zh}</>}
                </div>
                {l.notes && <div style={{ fontSize: 13, marginTop: 6 }}>{l.notes}</div>}
                <div style={{ marginTop: 6 }}>
                  {'★'.repeat(l.relevance)}
                  <span style={{ color: 'var(--text-dim)' }}>{'★'.repeat(Math.max(0, 5 - l.relevance))}</span>
                </div>
              </div>
              {l.url && (
                <a className="btn btn-secondary btn-sm" href={l.url} target="_blank" rel="noreferrer">
                  链接
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </Shell>
  );
}

function ActivityPage() {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    api.activity(80).then(setItems).catch(console.error);
  }, []);

  return (
    <Shell>
      <PageHeader title="活动日志" subtitle="系统内问题、战役、会话与工件的变更轨迹。" />
      <div className="card">
        <div className="card-body">
          {items.map((a) => (
            <div key={a.id} className="list-row">
              <div>
                <span className="tag">{a.entity_type}</span>{' '}
                <strong style={{ marginLeft: 6 }}>{a.action}</strong>
                <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>{a.detail}</span>
              </div>
              <span className="mono" style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                {a.created_at?.replace('T', ' ').slice(0, 19)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Shell>
  );
}

/* ───────────────── Prompts Workshop ───────────────── */
function PromptsPage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [slug, setSlug] = useState('unit-disk-100-circle-covering');
  const [role, setRole] = useState('explorer');
  const [focus, setFocus] = useState('');
  const [built, setBuilt] = useState<{ system: string; user: string; combined: string } | null>(null);
  const [kickoff, setKickoff] = useState('');
  const [howTo, setHowTo] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [copied, setCopied] = useState('');

  useEffect(() => {
    api.problems().then((ps) => {
      setProblems(ps);
      if (ps.length && !ps.find((p) => p.slug === slug)) setSlug(ps[0].slug);
    }).catch(console.error);
    api.arenaKickoff('unit-disk-100-circle-covering').then((k) => {
      setKickoff(k.kickoff);
      setHowTo(k.how_to);
    }).catch(console.error);
  }, []);

  const build = async () => {
    setBusy(true);
    setErr('');
    try {
      const res = await api.buildPrompt({ slug, role, focus: focus || undefined });
      setBuilt(res);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(''), 1500);
    } catch {
      setErr('剪贴板不可用，请手动全选复制');
    }
  };

  const roles = [
    ['explorer', 'Explorer 探索者'],
    ['historian', 'Historian 史鉴者'],
    ['prover', 'Prover 证明者'],
    ['critic', 'Critic 批判者'],
    ['formalizer', 'Formalizer 形式化者'],
    ['synthesizer', 'Synthesizer 综合者'],
  ];

  return (
    <Shell>
      <PageHeader
        title="提示词工坊"
        subtitle="为 Arena.ai Agent / 外部 LLM 生成 MRS 角色提示词。合规：仅数学研究；违法违规请求将被拒绝。"
        actions={
          <a className="btn btn-secondary" href="https://arena.ai/agent/" target="_blank" rel="noreferrer">
            打开 Arena Agent
          </a>
        }
      />

      <div className="card" style={{ marginBottom: 18 }}>
        <div className="card-header"><h3>接入 Arena.ai Agent Mode</h3></div>
        <div className="card-body" style={{ fontSize: 14, lineHeight: 1.7 }}>
          <ol style={{ paddingLeft: 20 }}>
            <li>打开 <a href="https://arena.ai/agent/" target="_blank" rel="noreferrer">arena.ai/agent</a> → <strong>Connect GitHub</strong></li>
            <li>选择仓库 <code>Bodhi-wind/mrs-multi-ai-math</code></li>
            <li>粘贴下方 Kickoff 或本页生成的角色提示词</li>
            <li>多模型输出带回本站「多结果整合」合并</li>
          </ol>
          {howTo && <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, marginTop: 12, opacity: 0.85 }}>{howTo}</pre>}
          {kickoff && (
            <div style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <strong>Arena Kickoff（旗舰题默认）</strong>
                <button className="btn btn-primary btn-sm" onClick={() => copy(kickoff, 'kickoff')}>
                  {copied === 'kickoff' ? '已复制' : '复制 Kickoff'}
                </button>
              </div>
              <textarea className="textarea" style={{ minHeight: 160 }} readOnly value={kickoff} />
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <div className="card-header"><h3>按问题 × 角色生成</h3></div>
        <div className="card-body">
          <div className="filters" style={{ marginBottom: 12 }}>
            <select className="select" value={slug} onChange={(e) => setSlug(e.target.value)} style={{ maxWidth: 360 }}>
              {problems.map((p) => (
                <option key={p.slug} value={p.slug}>{p.title_zh}</option>
              ))}
            </select>
            <select className="select" value={role} onChange={(e) => setRole(e.target.value)}>
              {roles.map(([id, label]) => (
                <option key={id} value={id}>{label}</option>
              ))}
            </select>
            <input
              className="input"
              style={{ maxWidth: 320 }}
              placeholder="本轮焦点（可选）"
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
            />
            <button className="btn btn-primary" disabled={busy} onClick={build}>
              {busy ? '生成中…' : '生成提示词'}
            </button>
          </div>
          {err && <div style={{ color: 'var(--danger)', marginBottom: 10 }}>{err}</div>}
          {built && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => copy(built.combined, 'combined')}>
                  {copied === 'combined' ? '已复制' : '复制完整提示词'}
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => copy(built.system, 'system')}>
                  {copied === 'system' ? '已复制' : '复制 System'}
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => copy(built.user, 'user')}>
                  {copied === 'user' ? '已复制' : '复制 User 开场'}
                </button>
              </div>
              <textarea className="textarea" style={{ minHeight: 360, fontFamily: 'var(--font-mono)', fontSize: 12 }} readOnly value={built.combined} />
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h3>合规声明</h3></div>
        <div className="card-body" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          本工坊与 Arena 接入<strong>仅用于合法数学研究</strong>。若请求涉及网络攻击、恶意软件、未授权入侵、欺诈、越狱等，API 将返回 403。
          数学语境下的「攻击」仅指对开放问题的证明策略。详见仓库 <code>AGENTS.md</code>。
        </div>
      </div>
    </Shell>
  );
}

/* ───────────────── Multi-result Synthesis ───────────────── */
type DraftResult = { source: string; role: string; title: string; content: string; score: string };

function SynthesisPage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [slug, setSlug] = useState('unit-disk-100-circle-covering');
  const [focus, setFocus] = useState('四要件对照与冲突裁决');
  const [items, setItems] = useState<DraftResult[]>([
    { source: 'model-A', role: 'explorer', title: '结果 1', content: '', score: '' },
    { source: 'model-B', role: 'prover', title: '结果 2', content: '', score: '' },
  ]);
  const [report, setReport] = useState('');
  const [meta, setMeta] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [saved, setSaved] = useState('');

  useEffect(() => {
    api.problems().then((ps) => setProblems(ps)).catch(console.error);
  }, []);

  const update = (i: number, patch: Partial<DraftResult>) => {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  };

  const add = () =>
    setItems((prev) => [
      ...prev,
      { source: `model-${String.fromCharCode(65 + prev.length)}`, role: 'unknown', title: `结果 ${prev.length + 1}`, content: '', score: '' },
    ]);

  const remove = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i));

  const run = async (persist: boolean) => {
    setBusy(true);
    setErr('');
    setSaved('');
    try {
      const results = items
        .filter((it) => it.content.trim())
        .map((it) => ({
          source: it.source,
          role: it.role,
          title: it.title,
          content: it.content,
          score: it.score ? Number(it.score) : undefined,
        }));
      if (results.length < 1) throw new Error('请至少粘贴 1 条结果内容');

      if (persist) {
        await api.createResultsBatch({ problem_slug: slug, results });
      }

      const out = await api.synthesize({
        problem_slug: slug,
        focus,
        results,
        dry_run: !persist,
        save_artifact: persist,
      });
      setReport(out.markdown);
      setMeta(out);
      if (persist && out.synthesis_id) setSaved(`已保存 synthesis=${out.synthesis_id}${out.artifact_id ? ` artifact=${out.artifact_id}` : ''}`);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell>
      <PageHeader
        title="多结果整合"
        subtitle="输入多模型 / 多角色 / 多会话产出，按 MRS 协议抽取声明、检测冲突、对照成功标准，并生成综合报告与下一步。"
      />

      <div className="filters">
        <select className="select" style={{ maxWidth: 360 }} value={slug} onChange={(e) => setSlug(e.target.value)}>
          {problems.map((p) => (
            <option key={p.slug} value={p.slug}>{p.title_zh}</option>
          ))}
        </select>
        <input className="input" style={{ maxWidth: 360 }} value={focus} onChange={(e) => setFocus(e.target.value)} placeholder="整合焦点" />
        <button className="btn btn-secondary" onClick={add}><Plus size={14} /> 添加结果槽</button>
        <button className="btn btn-secondary" disabled={busy} onClick={() => run(false)}>预览整合</button>
        <button className="btn btn-primary" disabled={busy} onClick={() => run(true)}>
          {busy ? '处理中…' : '登记并整合'}
        </button>
      </div>
      {err && <div style={{ color: 'var(--danger)', marginBottom: 12 }}>{err}</div>}
      {saved && <div style={{ color: 'var(--accent-3)', marginBottom: 12, fontSize: 13 }}>{saved}</div>}

      <div className="two-col">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {items.map((it, i) => (
            <div key={i} className="card">
              <div className="card-header">
                <h3>{it.title || `结果 ${i + 1}`}</h3>
                <button className="btn btn-ghost btn-sm" onClick={() => remove(i)}>删除</button>
              </div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  <input className="input" placeholder="source" value={it.source} onChange={(e) => update(i, { source: e.target.value })} />
                  <select className="select" value={it.role} onChange={(e) => update(i, { role: e.target.value })}>
                    {['explorer', 'historian', 'prover', 'critic', 'formalizer', 'synthesizer', 'unknown'].map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  <input className="input" placeholder="score 1-5" value={it.score} onChange={(e) => update(i, { score: e.target.value })} />
                </div>
                <input className="input" placeholder="标题" value={it.title} onChange={(e) => update(i, { title: e.target.value })} />
                <textarea
                  className="textarea"
                  style={{ minHeight: 120 }}
                  placeholder="粘贴该模型/角色的完整 Markdown 输出…"
                  value={it.content}
                  onChange={(e) => update(i, { content: e.target.value })}
                />
              </div>
            </div>
          ))}
        </div>

        <div>
          {meta?.four_requirements && (
            <div className="card" style={{ marginBottom: 12 }}>
              <div className="card-header"><h3>四要件快检</h3></div>
              <div className="card-body">
                {Object.entries(meta.four_requirements).map(([k, v]) => (
                  <div key={k} className="list-row">
                    <span>{k}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: '55%', textAlign: 'right' }}>{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {meta?.next_actions && (
            <div className="card" style={{ marginBottom: 12 }}>
              <div className="card-header"><h3>下一步</h3></div>
              <div className="card-body">
                <ul style={{ paddingLeft: 18, fontSize: 13 }}>
                  {meta.next_actions.map((a: string, i: number) => (
                    <li key={i} style={{ marginBottom: 6 }}>{a}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          <div className="card">
            <div className="card-header">
              <h3>综合报告</h3>
              {report && (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => navigator.clipboard.writeText(report)}
                >
                  复制
                </button>
              )}
            </div>
            <div className="card-body">
              {report ? <Markdown content={report} /> : <div className="empty">粘贴多条结果后点击「预览整合」</div>}
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}

/* ───────────────── Pipeline ───────────────── */
function PipelinePage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [slug, setSlug] = useState('unit-disk-100-circle-covering');
  const [focus, setFocus] = useState('MRS P0 流水线：勘察→史鉴→证明→批判→综合');
  const [llm, setLlm] = useState<{ configured: boolean; model: string } | null>(null);
  const [useLlm, setUseLlm] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [out, setOut] = useState<any>(null);

  useEffect(() => {
    api.problems().then(setProblems).catch(console.error);
    api.llmStatus().then((s) => setLlm(s)).catch(console.error);
  }, []);

  const run = async () => {
    setBusy(true);
    setErr('');
    setOut(null);
    try {
      const res = await api.runPipeline({
        slug,
        focus,
        use_llm: useLlm,
        write_knowledge: true,
      });
      setOut(res);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell>
      <PageHeader
        title="一键流水线"
        subtitle="按 MRS 顺序自动跑多角色 → 登记 results → 综合报告 → 回写 knowledge/campaigns/。无 Key 时用研究模板，有 Key 时走 OpenAI 兼容 API。"
        actions={
          <button className="btn btn-primary" disabled={busy} onClick={run}>
            <Play size={14} /> {busy ? '流水线运行中…' : '启动流水线'}
          </button>
        }
      />

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <select className="select" style={{ maxWidth: 360 }} value={slug} onChange={(e) => setSlug(e.target.value)}>
            {problems.map((p) => (
              <option key={p.slug} value={p.slug}>{p.title_zh}</option>
            ))}
          </select>
          <input className="input" style={{ maxWidth: 420 }} value={focus} onChange={(e) => setFocus(e.target.value)} />
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}>
            <input type="checkbox" checked={useLlm} onChange={(e) => setUseLlm(e.target.checked)} />
            尝试 LLM（{llm?.configured ? `已配置 ${llm.model}` : '未配置 Key → 自动模板'}）
          </label>
        </div>
      </div>

      {err && <div style={{ color: 'var(--danger)', marginBottom: 12 }}>{err}</div>}

      {out && (
        <div className="two-col">
          <div className="card">
            <div className="card-header"><h3>步骤</h3></div>
            <div className="card-body">
              <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 8 }}>
                campaign={out.campaign_id} · synthesis={out.synthesis_id}
                {out.knowledge_synthesis && <> · kn={out.knowledge_synthesis}</>}
              </div>
              {(out.steps || []).map((s: any, i: number) => (
                <div key={i} className="list-row">
                  <div>
                    <strong>{s.role_zh || s.role}</strong>
                    <span className="tag" style={{ marginLeft: 8 }}>{s.engine}</span>
                    {s.knowledge_path && (
                      <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{s.knowledge_path}</div>
                    )}
                  </div>
                  <span className="mono">{s.content_len}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <div className="card-header"><h3>综合报告</h3></div>
            <div className="card-body">
              {out.report?.four_requirements && (
                <div style={{ marginBottom: 12 }}>
                  {Object.entries(out.report.four_requirements).map(([k, v]) => (
                    <div key={k} className="list-row">
                      <span>{k}</span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{String(v)}</span>
                    </div>
                  ))}
                </div>
              )}
              <Markdown content={out.report?.markdown || ''} />
            </div>
          </div>
        </div>
      )}

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-header"><h3>配置 LLM（可选）</h3></div>
        <div className="card-body" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          复制 <code>backend/.env.example</code> 为 <code>backend/.env</code>，填写：
          <pre style={{ marginTop: 8 }}>{`MRS_LLM_API_KEY=sk-...
MRS_LLM_BASE_URL=https://api.openai.com/v1
MRS_LLM_MODEL=gpt-4o-mini`}</pre>
          重启 API 后生效。密钥勿提交 Git。
        </div>
      </div>
    </Shell>
  );
}

/* ───────────────── N=100 lab ───────────────── */
function N100Page() {
  const slug = 'unit-disk-100-circle-covering';
  const [checklist, setChecklist] = useState<any>(null);
  const [bound, setBound] = useState<any>(null);
  const [mode, setMode] = useState<'rings' | 'lattice'>('rings');
  const [n, setN] = useState(100);
  const [files, setFiles] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const load = () => {
    api.checklist(slug).then(setChecklist).catch(console.error);
    api.knowledgeCampaign(slug).then((k) => setFiles(k.files)).catch(() => setFiles([]));
  };
  useEffect(load, []);

  const saveItem = async (idx: number, patch: any) => {
    if (!checklist) return;
    const items = checklist.items.map((it: any, i: number) => (i === idx ? { ...it, ...patch } : it));
    const next = await api.saveChecklist(slug, { items, blockers: checklist.blockers });
    setChecklist(next);
  };

  const runBound = async () => {
    setBusy(true);
    setErr('');
    try {
      const r = await api.coveringBound({ n, mode, grid: 81 });
      setBound(r);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell>
      <PageHeader
        title="100 圆专项实验室"
        subtitle="四要件清单 + 诚实数值上界工具。数值结果永远是 L1 上界线索，不能勾选「已验证完成」。"
        actions={
          <>
            <Link className="btn btn-secondary" to="/pipeline">跑流水线</Link>
            <Link className="btn btn-secondary" to={`/problems/${slug}`}>题面</Link>
          </>
        }
      />

      {err && <div style={{ color: 'var(--danger)' }}>{err}</div>}

      <div className="two-col">
        <div className="card">
          <div className="card-header">
            <h3>四要件清单 · overall={checklist?.overall || '—'}</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => api.resetChecklist(slug).then(setChecklist)}>重置</button>
          </div>
          <div className="card-body">
            {(checklist?.items || []).map((it: any, idx: number) => (
              <div key={it.id} style={{ borderBottom: '1px solid var(--border)', padding: '12px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                  <strong>{it.title_zh}</strong>
                  <select
                    className="select"
                    style={{ maxWidth: 140 }}
                    value={it.status}
                    onChange={(e) => saveItem(idx, { status: e.target.value })}
                  >
                    <option value="missing">missing</option>
                    <option value="partial">partial</option>
                    <option value="claimed">claimed</option>
                    <option value="verified">verified</option>
                  </select>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 6 }}>{it.notes}</div>
                <input
                  className="input"
                  placeholder="证据链接 / 文件路径"
                  value={it.evidence || ''}
                  onChange={(e) => saveItem(idx, { evidence: e.target.value })}
                />
              </div>
            ))}
            {checklist?.blockers?.length > 0 && (
              <div style={{ marginTop: 12, color: 'var(--warn)', fontSize: 13 }}>
                Blockers: {checklist.blockers.join('；')}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="card" style={{ marginBottom: 14 }}>
            <div className="card-header"><h3>数值上界工具（非定理）</h3></div>
            <div className="card-body">
              <div className="filters">
                <input className="input" style={{ maxWidth: 100 }} type="number" value={n} onChange={(e) => setN(Number(e.target.value))} />
                <select className="select" value={mode} onChange={(e) => setMode(e.target.value as any)}>
                  <option value="rings">rings</option>
                  <option value="lattice">lattice</option>
                </select>
                <button className="btn btn-primary" disabled={busy} onClick={runBound}>
                  {busy ? '计算中…' : '计算上界'}
                </button>
              </div>
              {bound && (
                <div style={{ fontSize: 13 }}>
                  <p style={{ color: 'var(--danger)', marginBottom: 8 }}>{bound.disclaimer}</p>
                  <div className="list-row"><span>mode</span><span className="mono">{bound.mode}</span></div>
                  <div className="list-row"><span>n</span><span className="mono">{bound.n}</span></div>
                  <div className="list-row"><span>sample max-min</span><span className="mono">{bound.sample_max_min_dist?.toFixed?.(6) ?? bound.sample_max_min_dist}</span></div>
                  <div className="list-row"><span>reported radius</span><span className="mono">{bound.radius?.toFixed?.(6) ?? bound.radius}</span></div>
                  <div className="list-row"><span>centers</span><span className="mono">{bound.centers?.length}</span></div>
                  <ul style={{ marginTop: 10, paddingLeft: 18, color: 'var(--text-muted)' }}>
                    {(bound.notes || []).map((t: string, i: number) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3>knowledge/campaigns/{slug}</h3>
              <button className="btn btn-ghost btn-sm" onClick={load}>刷新</button>
            </div>
            <div className="card-body">
              {files.length === 0 && <div className="empty">尚无回写文件；跑流水线或整合后出现</div>}
              {files.map((f) => (
                <div key={f} className="list-row"><span className="mono" style={{ fontSize: 12 }}>{f}</span></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}

/* ───────────────── App ───────────────── */
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/problems" element={<ProblemsPage />} />
      <Route path="/problems/:slug" element={<ProblemDetailPage />} />
      <Route path="/campaigns" element={<CampaignsPage />} />
      <Route path="/campaigns/:id" element={<CampaignDetailPage />} />
      <Route path="/roles" element={<RolesPage />} />
      <Route path="/prompts" element={<PromptsPage />} />
      <Route path="/synthesis" element={<SynthesisPage />} />
      <Route path="/pipeline" element={<PipelinePage />} />
      <Route path="/n100" element={<N100Page />} />
      <Route path="/artifacts" element={<ArtifactsPage />} />
      <Route path="/literature" element={<LiteraturePage />} />
      <Route path="/activity" element={<ActivityPage />} />
    </Routes>
  );
}
