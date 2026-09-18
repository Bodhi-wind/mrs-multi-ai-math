import express from 'express';
import cors from 'cors';
import { v4 as uuid } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db, initSchema } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

initSchema();

// Auto-seed if empty
const count = (db.prepare('SELECT COUNT(*) as c FROM problems').get() as { c: number }).c;
if (count === 0) {
  console.log('Database empty — run seed...');
  await import('./seed.js');
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

function logActivity(entityType: string, entityId: string, action: string, detail?: string) {
  db.prepare(
    `INSERT INTO activity_log (id, entity_type, entity_id, action, detail) VALUES (?, ?, ?, ?, ?)`
  ).run(uuid(), entityType, entityId, action, detail ?? null);
}

function parseRow<T extends Record<string, unknown>>(row: T, jsonFields: string[]): T {
  const out = { ...row };
  for (const f of jsonFields) {
    const key = f.endsWith('_json') ? f.replace(/_json$/, '') + (f === 'references_json' ? 's' : '') : f;
    // normalize: references_json -> references, tags_json -> tags, etc.
    let target = f.replace(/_json$/, '');
    if (target === 'references') target = 'references';
    if (target === 'capabilities') target = 'capabilities';
    if (target === 'metadata') target = 'metadata';
    if (target === 'tags') target = 'tags';
    try {
      (out as Record<string, unknown>)[target] = JSON.parse(String(row[f] ?? (f.includes('tags') || f.includes('capabilities') || f.includes('references') ? '[]' : '{}')));
    } catch {
      (out as Record<string, unknown>)[target] = f.includes('tags') || f.includes('capabilities') || f.includes('references') ? [] : {};
    }
  }
  return out;
}

// ─── Meta ───────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    name: 'MRS Math Frontier Lab',
    version: '1.0.0',
    meaning: 'Multi-Role System',
    time: new Date().toISOString(),
  });
});

app.get('/api/stats', (_req, res) => {
  const problems = db.prepare('SELECT COUNT(*) as c FROM problems').get() as { c: number };
  const open = db.prepare(`SELECT COUNT(*) as c FROM problems WHERE status IN ('open','contested','partial','active-frontier')`).get() as { c: number };
  const resolved = db.prepare(`SELECT COUNT(*) as c FROM problems WHERE status IN ('resolved','partial')`).get() as { c: number };
  const campaigns = db.prepare('SELECT COUNT(*) as c FROM campaigns').get() as { c: number };
  const activeCampaigns = db.prepare(`SELECT COUNT(*) as c FROM campaigns WHERE status='active'`).get() as { c: number };
  const roles = db.prepare('SELECT COUNT(*) as c FROM roles').get() as { c: number };
  const artifacts = db.prepare('SELECT COUNT(*) as c FROM artifacts').get() as { c: number };
  const literature = db.prepare('SELECT COUNT(*) as c FROM literature').get() as { c: number };
  const byField = db.prepare(`SELECT field, COUNT(*) as count FROM problems GROUP BY field ORDER BY count DESC`).all();
  const byStatus = db.prepare(`SELECT status, COUNT(*) as count FROM problems GROUP BY status ORDER BY count DESC`).all();
  res.json({
    problems: problems.c,
    open: open.c,
    resolvedish: resolved.c,
    campaigns: campaigns.c,
    activeCampaigns: activeCampaigns.c,
    roles: roles.c,
    artifacts: artifacts.c,
    literature: literature.c,
    byField,
    byStatus,
  });
});

// ─── Problems ───────────────────────────────────────────
app.get('/api/problems', (req, res) => {
  const { field, status, q, millennium, tag, sort = 'priority' } = req.query;
  let sql = `SELECT * FROM problems WHERE 1=1`;
  const params: unknown[] = [];

  if (field) {
    sql += ` AND field = ?`;
    params.push(field);
  }
  if (status) {
    sql += ` AND status = ?`;
    params.push(status);
  }
  if (millennium === '1') {
    sql += ` AND millennium = 1`;
  }
  if (q) {
    sql += ` AND (title LIKE ? OR title_zh LIKE ? OR summary LIKE ? OR summary_zh LIKE ? OR tags_json LIKE ?)`;
    const like = `%${q}%`;
    params.push(like, like, like, like, like);
  }
  if (tag) {
    sql += ` AND tags_json LIKE ?`;
    params.push(`%${tag}%`);
  }

  const sortMap: Record<string, string> = {
    priority: 'priority DESC, title ASC',
    difficulty: 'difficulty DESC, title ASC',
    title: 'title ASC',
    updated: 'updated_at DESC',
    field: 'field ASC, priority DESC',
  };
  sql += ` ORDER BY ${sortMap[String(sort)] ?? sortMap.priority}`;

  const rows = db.prepare(sql).all(...params) as Record<string, unknown>[];
  res.json(
    rows.map((r) => {
      const p = parseRow(r, ['references_json', 'tags_json']);
      return p;
    })
  );
});

app.get('/api/problems/fields', (_req, res) => {
  const rows = db.prepare(`SELECT DISTINCT field FROM problems ORDER BY field`).all();
  res.json(rows.map((r: any) => r.field));
});

app.get('/api/problems/:idOrSlug', (req, res) => {
  const key = req.params.idOrSlug;
  const row = db
    .prepare(`SELECT * FROM problems WHERE id = ? OR slug = ?`)
    .get(key, key) as Record<string, unknown> | undefined;
  if (!row) return res.status(404).json({ error: 'Problem not found' });

  const problem = parseRow(row, ['references_json', 'tags_json']);
  const campaigns = db
    .prepare(`SELECT * FROM campaigns WHERE problem_id = ? ORDER BY updated_at DESC`)
    .all(row.id);
  const literature = db
    .prepare(`SELECT * FROM literature WHERE problem_id = ? ORDER BY relevance DESC, year DESC`)
    .all(row.id);
  const artifacts = db
    .prepare(`SELECT * FROM artifacts WHERE problem_id = ? ORDER BY updated_at DESC`)
    .all(row.id);

  res.json({ ...problem, campaigns, literature, artifacts });
});

app.post('/api/problems', (req, res) => {
  const b = req.body;
  if (!b.title || !b.title_zh || !b.field || !b.summary) {
    return res.status(400).json({ error: 'title, title_zh, field, summary required' });
  }
  const id = uuid();
  const slug =
    b.slug ||
    String(b.title)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

  try {
    db.prepare(`
      INSERT INTO problems (
        id, slug, title, title_zh, field, subfield, difficulty, status, millennium,
        summary, summary_zh, formal_statement, known_partial, key_obstacles,
        references_json, tags_json, priority
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).run(
      id,
      slug,
      b.title,
      b.title_zh,
      b.field,
      b.subfield ?? null,
      b.difficulty ?? 5,
      b.status ?? 'open',
      b.millennium ? 1 : 0,
      b.summary,
      b.summary_zh ?? b.summary,
      b.formal_statement ?? null,
      b.known_partial ?? null,
      b.key_obstacles ?? null,
      JSON.stringify(b.references ?? []),
      JSON.stringify(b.tags ?? []),
      b.priority ?? 50
    );
    logActivity('problem', id, 'created', b.title);
    res.status(201).json({ id, slug });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.patch('/api/problems/:id', (req, res) => {
  const existing = db.prepare(`SELECT * FROM problems WHERE id = ? OR slug = ?`).get(req.params.id, req.params.id) as any;
  if (!existing) return res.status(404).json({ error: 'Not found' });

  const b = req.body;
  const fields = [
    'title', 'title_zh', 'field', 'subfield', 'difficulty', 'status', 'millennium',
    'summary', 'summary_zh', 'formal_statement', 'known_partial', 'key_obstacles', 'priority',
  ] as const;

  const sets: string[] = [];
  const vals: unknown[] = [];
  for (const f of fields) {
    if (b[f] !== undefined) {
      sets.push(`${f} = ?`);
      vals.push(f === 'millennium' ? (b[f] ? 1 : 0) : b[f]);
    }
  }
  if (b.references !== undefined) {
    sets.push('references_json = ?');
    vals.push(JSON.stringify(b.references));
  }
  if (b.tags !== undefined) {
    sets.push('tags_json = ?');
    vals.push(JSON.stringify(b.tags));
  }
  if (!sets.length) return res.status(400).json({ error: 'No fields' });

  sets.push(`updated_at = datetime('now')`);
  vals.push(existing.id);
  db.prepare(`UPDATE problems SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
  logActivity('problem', existing.id, 'updated', JSON.stringify(Object.keys(b)));
  res.json({ ok: true });
});

// ─── Roles ──────────────────────────────────────────────
app.get('/api/roles', (_req, res) => {
  const rows = db.prepare(`SELECT * FROM roles ORDER BY name`).all() as Record<string, unknown>[];
  res.json(rows.map((r) => parseRow(r, ['capabilities_json'])));
});

app.get('/api/roles/:id', (req, res) => {
  const row = db.prepare(`SELECT * FROM roles WHERE id = ?`).get(req.params.id) as Record<string, unknown> | undefined;
  if (!row) return res.status(404).json({ error: 'Role not found' });
  res.json(parseRow(row, ['capabilities_json']));
});

// ─── Campaigns ──────────────────────────────────────────
app.get('/api/campaigns', (req, res) => {
  const { status, problem_id } = req.query;
  let sql = `
    SELECT c.*, p.title as problem_title, p.title_zh as problem_title_zh, p.slug as problem_slug, p.field
    FROM campaigns c JOIN problems p ON p.id = c.problem_id WHERE 1=1
  `;
  const params: unknown[] = [];
  if (status) {
    sql += ` AND c.status = ?`;
    params.push(status);
  }
  if (problem_id) {
    sql += ` AND c.problem_id = ?`;
    params.push(problem_id);
  }
  sql += ` ORDER BY c.updated_at DESC`;
  res.json(db.prepare(sql).all(...params));
});

app.get('/api/campaigns/:id', (req, res) => {
  const c = db
    .prepare(
      `SELECT c.*, p.title as problem_title, p.title_zh as problem_title_zh, p.slug as problem_slug, p.field
       FROM campaigns c JOIN problems p ON p.id = c.problem_id WHERE c.id = ?`
    )
    .get(req.params.id) as any;
  if (!c) return res.status(404).json({ error: 'Campaign not found' });

  const milestones = db
    .prepare(`SELECT * FROM milestones WHERE campaign_id = ? ORDER BY order_index`)
    .all(c.id);
  const sessions = db
    .prepare(
      `SELECT s.*, r.name as role_name, r.name_zh as role_name_zh, r.color as role_color, r.icon as role_icon
       FROM sessions s JOIN roles r ON r.id = s.role_id
       WHERE s.campaign_id = ? ORDER BY s.created_at DESC`
    )
    .all(c.id);
  const artifacts = db
    .prepare(`SELECT * FROM artifacts WHERE campaign_id = ? ORDER BY updated_at DESC`)
    .all(c.id);

  res.json({ ...c, milestones, sessions, artifacts });
});

app.post('/api/campaigns', (req, res) => {
  const { problem_id, title, strategy, notes, milestones } = req.body;
  if (!problem_id || !title) return res.status(400).json({ error: 'problem_id and title required' });

  const problem = db.prepare(`SELECT id FROM problems WHERE id = ? OR slug = ?`).get(problem_id, problem_id) as any;
  if (!problem) return res.status(404).json({ error: 'Problem not found' });

  const id = uuid();
  db.prepare(
    `INSERT INTO campaigns (id, problem_id, title, status, strategy, progress, notes) VALUES (?,?,?,'active',?,0,?)`
  ).run(id, problem.id, title, strategy ?? null, notes ?? null);

  if (Array.isArray(milestones)) {
    const ins = db.prepare(
      `INSERT INTO milestones (id, campaign_id, title, description, status, order_index) VALUES (?,?,?,?,?,?)`
    );
    milestones.forEach((m: any, i: number) => {
      ins.run(uuid(), id, m.title || m, m.description ?? null, 'pending', i + 1);
    });
  } else {
    // Default MRS pipeline milestones
    const defaults = [
      'Explorer：问题全景与攻击角度',
      'Historian：文献与失败路径',
      'Prover：核心引理构造',
      'Critic：对抗审查',
      'Formalizer：形式化草稿',
      'Synthesizer：综合与下一阶段',
    ];
    const ins = db.prepare(
      `INSERT INTO milestones (id, campaign_id, title, status, order_index) VALUES (?,?,?,?,?)`
    );
    defaults.forEach((t, i) => ins.run(uuid(), id, t, i === 0 ? 'active' : 'pending', i + 1));
  }

  logActivity('campaign', id, 'created', title);
  res.status(201).json({ id });
});

app.patch('/api/campaigns/:id', (req, res) => {
  const b = req.body;
  const sets: string[] = [];
  const vals: unknown[] = [];
  for (const f of ['title', 'status', 'strategy', 'progress', 'notes'] as const) {
    if (b[f] !== undefined) {
      sets.push(`${f} = ?`);
      vals.push(b[f]);
    }
  }
  if (!sets.length) return res.status(400).json({ error: 'No fields' });
  sets.push(`updated_at = datetime('now')`);
  vals.push(req.params.id);
  const info = db.prepare(`UPDATE campaigns SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
  if (!info.changes) return res.status(404).json({ error: 'Not found' });
  logActivity('campaign', req.params.id, 'updated', JSON.stringify(Object.keys(b)));
  res.json({ ok: true });
});

app.patch('/api/milestones/:id', (req, res) => {
  const { status, title, description } = req.body;
  const sets: string[] = [];
  const vals: unknown[] = [];
  if (title !== undefined) {
    sets.push('title = ?');
    vals.push(title);
  }
  if (description !== undefined) {
    sets.push('description = ?');
    vals.push(description);
  }
  if (status !== undefined) {
    sets.push('status = ?');
    vals.push(status);
    if (status === 'completed') {
      sets.push(`completed_at = datetime('now')`);
    }
  }
  if (!sets.length) return res.status(400).json({ error: 'No fields' });
  vals.push(req.params.id);
  db.prepare(`UPDATE milestones SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
  res.json({ ok: true });
});

// ─── Sessions & Messages (multi-AI collab) ──────────────
app.get('/api/sessions/:id', (req, res) => {
  const s = db
    .prepare(
      `SELECT s.*, r.name as role_name, r.name_zh as role_name_zh, r.color as role_color,
              r.icon as role_icon, r.system_prompt, r.description_zh as role_description
       FROM sessions s JOIN roles r ON r.id = s.role_id WHERE s.id = ?`
    )
    .get(req.params.id) as any;
  if (!s) return res.status(404).json({ error: 'Session not found' });
  const messages = db
    .prepare(`SELECT * FROM messages WHERE session_id = ? ORDER BY created_at ASC`)
    .all(s.id);
  res.json({ ...s, messages });
});

app.post('/api/sessions', (req, res) => {
  const { campaign_id, role_id, title } = req.body;
  if (!campaign_id || !role_id) return res.status(400).json({ error: 'campaign_id and role_id required' });

  const role = db.prepare(`SELECT * FROM roles WHERE id = ?`).get(role_id) as any;
  if (!role) return res.status(404).json({ error: 'Role not found' });

  const id = uuid();
  db.prepare(
    `INSERT INTO sessions (id, campaign_id, role_id, title, status) VALUES (?,?,?,?,'running')`
  ).run(id, campaign_id, role_id, title ?? `${role.name_zh} 会话`);

  // Auto brief message
  const campaign = db
    .prepare(
      `SELECT c.*, p.title as problem_title, p.title_zh as problem_title_zh, p.summary_zh, p.formal_statement, p.key_obstacles
       FROM campaigns c JOIN problems p ON p.id = c.problem_id WHERE c.id = ?`
    )
    .get(campaign_id) as any;

  if (campaign) {
    const brief = `## 任务简报 / Mission Brief

**战役**: ${campaign.title}
**问题**: ${campaign.problem_title_zh} (${campaign.problem_title})
**角色**: ${role.name_zh} (${role.name})

### 问题摘要
${campaign.summary_zh}

### 形式陈述
\`\`\`
${campaign.formal_statement ?? '（待补充）'}
\`\`\`

### 关键障碍
${campaign.key_obstacles ?? '（待补充）'}

### 战役策略
${campaign.strategy ?? '（开放探索）'}

---
请以 **${role.name_zh}** 身份开始工作。
系统提示要点：
${role.description_zh}
`;
    db.prepare(
      `INSERT INTO messages (id, session_id, role_id, sender, content, message_type) VALUES (?,?,?,?,?,?)`
    ).run(uuid(), id, null, 'System', brief, 'brief');
  }

  logActivity('session', id, 'created', `${role.name_zh}: ${title ?? ''}`);
  res.status(201).json({ id });
});

app.post('/api/sessions/:id/messages', (req, res) => {
  const { content, sender, message_type, role_id } = req.body;
  if (!content) return res.status(400).json({ error: 'content required' });

  const session = db.prepare(`SELECT * FROM sessions WHERE id = ?`).get(req.params.id) as any;
  if (!session) return res.status(404).json({ error: 'Session not found' });

  const id = uuid();
  db.prepare(
    `INSERT INTO messages (id, session_id, role_id, sender, content, message_type) VALUES (?,?,?,?,?,?)`
  ).run(
    id,
    session.id,
    role_id ?? session.role_id,
    sender ?? 'User',
    content,
    message_type ?? 'note'
  );

  db.prepare(`UPDATE sessions SET updated_at = datetime('now') WHERE id = ?`).run(session.id);
  db.prepare(`UPDATE campaigns SET updated_at = datetime('now') WHERE id = ?`).run(session.campaign_id);

  res.status(201).json({ id });
});

/** Simulate a role response (template-based offline multi-AI stub) */
app.post('/api/sessions/:id/run-role', (req, res) => {
  const session = db
    .prepare(
      `SELECT s.*, r.name as role_name, r.name_zh as role_name_zh, r.system_prompt, r.id as rid
       FROM sessions s JOIN roles r ON r.id = s.role_id WHERE s.id = ?`
    )
    .get(req.params.id) as any;
  if (!session) return res.status(404).json({ error: 'Session not found' });

  const campaign = db
    .prepare(
      `SELECT c.*, p.title as problem_title, p.title_zh as problem_title_zh,
              p.summary, p.summary_zh, p.known_partial, p.key_obstacles, p.formal_statement, p.field
       FROM campaigns c JOIN problems p ON p.id = c.problem_id WHERE c.id = ?`
    )
    .get(session.campaign_id) as any;

  const focus = req.body?.focus as string | undefined;
  const content = generateRoleOutput(session.role_name, campaign, focus);

  const id = uuid();
  db.prepare(
    `INSERT INTO messages (id, session_id, role_id, sender, content, message_type) VALUES (?,?,?,?,?,?)`
  ).run(id, session.id, session.rid, session.role_name, content, 'analysis');

  db.prepare(`UPDATE sessions SET updated_at = datetime('now') WHERE id = ?`).run(session.id);
  db.prepare(`UPDATE campaigns SET updated_at = datetime('now') WHERE id = ?`).run(session.campaign_id);
  logActivity('session', session.id, 'role_run', session.role_name);

  res.status(201).json({ id, content, role: session.role_name });
});

function generateRoleOutput(roleName: string, campaign: any, focus?: string): string {
  const p = campaign?.problem_title_zh ?? '目标问题';
  const eng = campaign?.problem_title ?? 'target problem';
  const field = campaign?.field ?? 'Mathematics';
  const obstacles = campaign?.key_obstacles ?? '关键障碍尚待梳理';
  const partial = campaign?.known_partial ?? '部分结果尚待梳理';
  const formal = campaign?.formal_statement ?? '（形式陈述待补充）';
  const focusLine = focus ? `\n**本轮焦点**: ${focus}\n` : '';

  const templates: Record<string, string> = {
    Explorer: `## Explorer 勘察报告 — ${p}
${focusLine}
### 问题定位
- **领域**: ${field}
- **陈述**: \`${formal}\`

### 已知地形
${partial}

### 障碍地形
${obstacles}

### 攻击角度（本轮提案）
1. **分解归约**：将主命题拆为可独立验证的子引理 DAG，优先打最薄弱的中间节点。
2. **特殊化取胜**：在低维 / 有限域 / 模型范畴中证明类比命题，回输技术。
3. **跨域移植**：检索 ${field} 相邻领域的结构性定理，寻找可迁移的证明骨架。
4. **计算探测**：用符号/数值实验寻找反例候选或模式，再反推猜想加强版。
5. **形式化倒逼**：先写 Lean 陈述，用类型错误暴露定义歧义。

### 建议下一角色
- **Historian** 补齐失败路径，避免重复；
- **Prover** 认领角度 1 的第一个子引理。

### 置信度
勘察级假设，未经 Critic 压力测试。`,

    Prover: `## Prover 证明草稿 — ${p}
${focusLine}
### 目标
推进：\`${formal}\`

### 引理分解
**Lemma A (setup).** 建立主要对象的良定义性与基本函子性质。  
**Lemma B (core estimate / exact sequence).** 核心估计或正合列。  
**Lemma C (gluing).** 将局部结论粘合为全局陈述。

### Lemma A — 草稿
*假设.* （明确写下所有假设）  
*证明.*  
1. 由定义直接验证函子性 / 线性性。  
2. 引用标准结果处理边界情形。  
3. [GAP] 非平凡步骤：需要 ${field} 中的比较定理。  

### 依赖图
\`\`\`
Main Goal
 ├── Lemma C
 │    ├── Lemma B
 │    └── Lemma A
 └── external: known partial results
\`\`\`

### 已知可引用
${partial}

### 状态
草稿级。标有 [GAP] 的步骤需 Critic 审查或 Historian 补文献。`,

    Critic: `## Critic 对抗审查 — ${p}
${focusLine}
### 审查范围
当前战役论证链与关键障碍陈述。

### 发现的问题
1. **隐含假设**: 论述可能默认对象处于光滑 / 有限生成 / 特征 0 等情形，需显式化。
2. **循环风险**: 若核心引理引用了与主定理强度相当的结论，则归约无效。
3. **量词顺序**: 检查 ∀∃ 与 ∃∀ 是否被滑换；分析估计中 ε-δ 依赖是否均匀。
4. **反例搜索方向**: 在退化情形、低秩、有限域、或大维极限下测试中间断言。

### 障碍再解读
${obstacles}

### 裁决
| 片段 | 裁决 | 说明 |
|------|------|------|
| 设定/定义 | needs work | 边界情形未覆盖 |
| 核心步骤 | needs work | 存在 [GAP] |
| 全局粘合 | inconclusive | 依赖上游 |

### 最小修复建议
- 为每个 [GAP] 写一条可独立检验的子断言；
- 增加「反例尝试日志」工件；
- 禁止在未关闭 GAP 时提升战役 progress > 当前+10%。`,

    Formalizer: `## Formalizer 形式化路线 — ${p}
${focusLine}
### 目标陈述（Lean 4 风格）
\`\`\`lean
/-- MRS auto-sketch: ${eng} -/
theorem main_statement : True := by
  sorry -- replace with real statement from:
  -- ${formal}
\`\`\`

### 形式化路线图
1. **定义层**: 编码问题中的基本对象（优先 mathlib4 已有定义）
2. **接口层**: 将 known partial 中可引用定理做成 \`theorem\`/\`lemma\` 声明
3. **核心层**: 对 Prover 的 Lemma A/B/C 各建文件
4. **粘合层**: 主定理只做 \`exact\`/\`apply\` 组装
5. **清债**: 按 sorry 依赖深度排序关闭

### mathlib 依赖猜测
- 依据领域 **${field}** 检索: topology / number_theory / algebraic_geometry / analysis 命名空间
- 先 \`#check\` / \`#find\` 再写新定义，避免重复造轮子

### Sorry 债务看板
| 编号 | 内容 | 优先级 |
|------|------|--------|
| S1 | 主定理陈述 | P0 |
| S2 | Lemma A | P1 |
| S3 | 解析估计或代数正合 | P1 |

### 下一步
导出 artifact \`lean_sketch\`，交给 Prover 对齐非形式证明。`,

    Synthesizer: `## Synthesizer 综合简报 — ${p}
${focusLine}
### 态势评估
战役围绕 **${p}**（${eng}）运行。领域：${field}。

### 多角色融合
| 角色 | 贡献 | 状态 |
|------|------|------|
| Explorer | 攻击角度地图 | 需持续更新 |
| Historian | 文献与失败路径 | 应先于深证明 |
| Prover | 引理 DAG | 草稿 |
| Critic | 压力测试 | 阻断未修 GAP 的冒进 |
| Formalizer | Lean 路线 | 与证明同步 |

### 当前 blocker
${obstacles}

### 决策
1. **本周主线**: 关闭 Prover Lemma A 的 [GAP]，或降级为条件结果。  
2. **并行线**: Formalizer 只形式化已无 GAP 片段。  
3. **停损**: 若 Critic 连续两次判定 structural flaw，触发策略 pivot。

### 进度建议
维持诚实 progress；仅在里程碑 completed 时上调。

### 下一行动（可执行）
- [ ] 创建 Historian 会话：失败路径 1 页
- [ ] 创建 Critic 会话：审查最新 proof_draft
- [ ] 更新里程碑状态
- [ ] 将 Lean 草稿收入 artifacts`,

    Historian: `## Historian 文献与史鉴 — ${p}
${focusLine}
### 问题谱系
**${p}**（${eng}）属于 **${field}** 主线中的核心开放/前沿节点。

### 必读核心
整理自战役已知部分：
${partial}

### 失败/受阻路径（警示）
1. **直接硬攻主定理** — 历史上多次因缺少中间结构而停住。  
2. **忽略障碍**: ${obstacles}  
3. **重复发明**: 在发起新角度前必须核对近 20 年 survey。

### 跨领域链接
- 寻找 ${field} 与相邻分支（代数/分析/逻辑/复杂性）的字典式对应。
- 函数域 / 有限模型类比若存在，单列一条「已证类比」卡片。

### 阅读优先级
1. 原初论文 / 官方问题描述  
2. 近 5 年 survey  
3. 与当前攻击角度直接相关的技术论文  
4. 失败尝试的 retrospective

### 输出
更新 literature 表；为每条文献写 3 句 notes（贡献 / 局限 / 对战役含义）。`,
  };

  return (
    templates[roleName] ??
    `## ${roleName} 输出\n\n针对 **${p}** 的工作笔记。\n${focusLine}\n${partial}\n\n障碍:\n${obstacles}`
  );
}

// ─── Artifacts ──────────────────────────────────────────
app.get('/api/artifacts', (req, res) => {
  const { problem_id, campaign_id, kind } = req.query;
  let sql = `SELECT * FROM artifacts WHERE 1=1`;
  const params: unknown[] = [];
  if (problem_id) {
    sql += ` AND problem_id = ?`;
    params.push(problem_id);
  }
  if (campaign_id) {
    sql += ` AND campaign_id = ?`;
    params.push(campaign_id);
  }
  if (kind) {
    sql += ` AND kind = ?`;
    params.push(kind);
  }
  sql += ` ORDER BY updated_at DESC`;
  res.json(db.prepare(sql).all(...params));
});

app.post('/api/artifacts', (req, res) => {
  const b = req.body;
  if (!b.title || !b.content || !b.kind) {
    return res.status(400).json({ error: 'title, content, kind required' });
  }
  const id = uuid();
  db.prepare(`
    INSERT INTO artifacts (id, problem_id, campaign_id, session_id, kind, title, content, formal_lang, status)
    VALUES (?,?,?,?,?,?,?,?,?)
  `).run(
    id,
    b.problem_id ?? null,
    b.campaign_id ?? null,
    b.session_id ?? null,
    b.kind,
    b.title,
    b.content,
    b.formal_lang ?? null,
    b.status ?? 'draft'
  );
  logActivity('artifact', id, 'created', b.title);
  res.status(201).json({ id });
});

app.patch('/api/artifacts/:id', (req, res) => {
  const b = req.body;
  const sets: string[] = [];
  const vals: unknown[] = [];
  for (const f of ['title', 'content', 'kind', 'formal_lang', 'status'] as const) {
    if (b[f] !== undefined) {
      sets.push(`${f} = ?`);
      vals.push(b[f]);
    }
  }
  if (!sets.length) return res.status(400).json({ error: 'No fields' });
  sets.push(`updated_at = datetime('now')`);
  vals.push(req.params.id);
  db.prepare(`UPDATE artifacts SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
  res.json({ ok: true });
});

// ─── Literature ─────────────────────────────────────────
app.get('/api/literature', (req, res) => {
  const { problem_id } = req.query;
  let sql = `SELECT l.*, p.title_zh as problem_title_zh, p.slug as problem_slug
             FROM literature l LEFT JOIN problems p ON p.id = l.problem_id WHERE 1=1`;
  const params: unknown[] = [];
  if (problem_id) {
    sql += ` AND l.problem_id = ?`;
    params.push(problem_id);
  }
  sql += ` ORDER BY l.relevance DESC, l.year DESC`;
  res.json(db.prepare(sql).all(...params));
});

app.post('/api/literature', (req, res) => {
  const b = req.body;
  if (!b.title) return res.status(400).json({ error: 'title required' });
  const id = uuid();
  db.prepare(`
    INSERT INTO literature (id, problem_id, title, authors, year, venue, url, doi, abstract, notes, relevance)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    id,
    b.problem_id ?? null,
    b.title,
    b.authors ?? null,
    b.year ?? null,
    b.venue ?? null,
    b.url ?? null,
    b.doi ?? null,
    b.abstract ?? null,
    b.notes ?? null,
    b.relevance ?? 3
  );
  res.status(201).json({ id });
});

// ─── Activity ───────────────────────────────────────────
app.get('/api/activity', (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const rows = db
    .prepare(`SELECT * FROM activity_log ORDER BY created_at DESC LIMIT ?`)
    .all(limit);
  res.json(rows);
});

// ─── Collaboration board snapshot ───────────────────────
app.get('/api/board', (_req, res) => {
  const roles = db.prepare(`SELECT id, name, name_zh, icon, color, description_zh FROM roles`).all();
  const activeCampaigns = db
    .prepare(
      `SELECT c.*, p.title_zh as problem_title_zh, p.slug as problem_slug
       FROM campaigns c JOIN problems p ON p.id = c.problem_id
       WHERE c.status = 'active' ORDER BY c.updated_at DESC LIMIT 10`
    )
    .all();
  const recentMessages = db
    .prepare(
      `SELECT m.*, s.title as session_title, r.name_zh as role_name_zh, r.color as role_color
       FROM messages m
       JOIN sessions s ON s.id = m.session_id
       LEFT JOIN roles r ON r.id = m.role_id
       ORDER BY m.created_at DESC LIMIT 15`
    )
    .all();
  const openProblems = db
    .prepare(
      `SELECT id, slug, title, title_zh, field, status, priority, difficulty, millennium
       FROM problems WHERE status IN ('open','contested','active-frontier','partial')
       ORDER BY priority DESC LIMIT 12`
    )
    .all();

  res.json({ roles, activeCampaigns, recentMessages, openProblems });
});

const PORT = Number(process.env.PORT) || 8787;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 MRS Math Lab API  http://0.0.0.0:${PORT}`);
  console.log(`   Multi-Role System · Math Frontier Attack Library\n`);
});
