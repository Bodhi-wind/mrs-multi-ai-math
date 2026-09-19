/**
 * Multi-result intake & synthesis engine (offline, deterministic scaffolding).
 * Designed so Arena Agent / external LLMs can replace the narrative layer later
 * while keeping structured merge rules.
 */

export type ResultClaim = {
  type?: string;
  statement: string;
  status?: string;
};

export type ResultInput = {
  id?: string;
  source?: string;
  role?: string;
  title?: string;
  content: string;
  claims?: ResultClaim[];
  score?: number;
};

export type SynthesisReport = {
  markdown: string;
  input_count: number;
  claim_count: number;
  conflicts: { a: string; b: string; reason: string }[];
  next_actions: string[];
  evidence_floor: string;
  four_requirements?: Record<string, string>;
};

const CLAIM_PATTERNS: { type: string; re: RegExp }[] = [
  { type: 'upper_bound', re: /(上界|upper\s*bound|r_D\([^)]*\)\s*≤|R_D\([^)]*\)\s*≤|≤\s*0\.\d+)/i },
  { type: 'lower_bound', re: /(下界|lower\s*bound|r_D\([^)]*\)\s*≥|R_D\([^)]*\)\s*≥|≥\s*0\.\d+)/i },
  { type: 'construction', re: /(构型|construction|C_\*|圆心|centers?\s*=)/i },
  { type: 'lemma', re: /(Lemma|引理|Theorem|定理)/i },
  { type: 'gap', re: /\[GAP\]|待证|未完成|sorry/i },
  { type: 'covering', re: /(覆盖性|covering|∀x\s*∈\s*D|all\s+points.*cover)/i },
  { type: 'optimality', re: /(全局最优|optimality|without\s+symmetry|对称)/i },
  { type: 'counterexample', re: /(反例|counterexample|fatally\s+flawed)/i },
];

function extractClaims(r: ResultInput): ResultClaim[] {
  if (r.claims?.length) return r.claims;
  const lines = r.content.split(/\n/).map((l) => l.trim()).filter(Boolean);
  const found: ResultClaim[] = [];
  for (const line of lines) {
    if (line.length < 12 || line.length > 280) continue;
    for (const { type, re } of CLAIM_PATTERNS) {
      if (re.test(line)) {
        found.push({
          type,
          statement: line.replace(/^#+\s*/, '').replace(/^[-*]\s*/, ''),
          status: /\[GAP\]|sorry|未/.test(line) ? 'open_gap' : 'extracted',
        });
        break;
      }
    }
    if (found.length >= 12) break;
  }
  return found;
}

function snippet(s: string, n = 160): string {
  const t = s.replace(/\s+/g, ' ').trim();
  return t.length <= n ? t : t.slice(0, n) + '…';
}

function detectConflicts(claims: { src: string; claim: ResultClaim }[]): {
  a: string;
  b: string;
  reason: string;
}[] {
  const conflicts: { a: string; b: string; reason: string }[] = [];
  const ups = claims.filter((c) => c.claim.type === 'upper_bound');
  const lows = claims.filter((c) => c.claim.type === 'lower_bound');
  // naive: if one says completed global opt and another says gap on optimality
  const optDone = claims.filter(
    (c) =>
      c.claim.type === 'optimality' &&
      /完成|proved|定理|QED|从而\s*r_D/i.test(c.claim.statement) &&
      !/\[GAP\]/.test(c.claim.statement)
  );
  const optGap = claims.filter(
    (c) =>
      c.claim.type === 'gap' ||
      (c.claim.type === 'optimality' && /\[GAP\]|未证|needs work|对称/.test(c.claim.statement))
  );
  for (const d of optDone) {
    for (const g of optGap) {
      if (d.src !== g.src) {
        conflicts.push({
          a: snippet(d.claim.statement),
          b: snippet(g.claim.statement),
          reason: '最优性完成声明 vs GAP/对称性质疑',
        });
      }
    }
  }
  // covering finite-sample fallacy flag
  for (const c of claims) {
    if (/有限点|sample\s+points|numerical\s+check.*cover/i.test(c.claim.statement)) {
      conflicts.push({
        a: snippet(c.claim.statement),
        b: '连续统覆盖要件',
        reason: '有限点检查不能替代 ∀x∈D 覆盖证明',
      });
    }
  }
  if (ups.length && lows.length) {
    conflicts.push({
      a: snippet(ups[0].claim.statement),
      b: snippet(lows[0].claim.statement),
      reason: '同时存在上/下界声明——请核验数值是否交叉或仅启发式',
    });
  }
  return conflicts.slice(0, 12);
}

function fourRequirementsAudit(
  slug: string | undefined,
  claims: { claim: ResultClaim }[],
  contents: string[]
): Record<string, string> | undefined {
  if (slug && !slug.includes('100') && !slug.includes('covering') && !slug.includes('unit-disk')) {
    return undefined;
  }
  const blob = contents.join('\n').toLowerCase();
  const hasPoly =
    /多项式|polynomial\s*p\s*\(|p\(t\)|整系数/i.test(blob) && /根|root|α|alpha/i.test(blob);
  const hasConfig = /c_\*|构型|centers|圆心坐标/i.test(blob);
  const hasCover =
    /∀x\s*∈\s*d|forall.*d|连续统|covering proof|覆盖性/i.test(blob) &&
    !/仅.*有限点|only sample/i.test(blob);
  const hasOpt =
    /全局最优|forall.*r_d|∀c.*r_d/i.test(blob) && !/未证对称|assume symmetry/i.test(blob);

  const gapHeavy = claims.filter((c) => c.claim.type === 'gap' || c.claim.status === 'open_gap').length;

  const grade = (ok: boolean, caution: string) =>
    ok && gapHeavy < 3 ? '部分材料存在，仍需严格核验' : caution;

  return {
    '1_精确半径': grade(hasPoly, hasPoly ? '提及多项式/根，但未达可核验完成态' : '缺失或不足'),
    '2_具体构型': grade(hasConfig, hasConfig ? '提及构型，完整性待审' : '缺失或不足'),
    '3_覆盖性': grade(hasCover, hasCover ? '有覆盖论述，需排除有限点谬误' : '缺失或不足'),
    '4_全局最优': grade(hasOpt, hasOpt ? '有最优性论述，需排除未证对称' : '缺失或不足'),
  };
}

export function synthesizeResults(opts: {
  problem_slug?: string;
  problem_title?: string;
  focus?: string;
  results: ResultInput[];
}): SynthesisReport {
  const results = opts.results.filter((r) => r.content?.trim());
  if (!results.length) {
    throw new Error('No results to synthesize');
  }

  const taggedClaims: { src: string; claim: ResultClaim }[] = [];
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const src = r.title || r.source || r.role || `result-${i + 1}`;
    for (const c of extractClaims(r)) taggedClaims.push({ src, claim: c });
  }

  const conflicts = detectConflicts(taggedClaims);
  const four = fourRequirementsAudit(
    opts.problem_slug,
    taggedClaims,
    results.map((r) => r.content)
  );

  const roles = new Set(results.map((r) => (r.role || 'unknown').toLowerCase()));
  const next_actions: string[] = [];
  if (!roles.has('critic')) next_actions.push('启动 Critic：对合并后的核心声明做对抗审查');
  if (!roles.has('historian')) next_actions.push('启动 Historian：核验所有文献题录，剔除虚构引用');
  if (taggedClaims.some((c) => c.claim.type === 'gap'))
    next_actions.push('启动 Prover：只关闭证据级最高的一条 [GAP]');
  if (four && Object.values(four).some((v) => v.includes('缺失')))
    next_actions.push('对照四要件清单，禁止将数值候选升格为定理');
  if (!next_actions.length)
    next_actions.push('Synthesizer：更新战役里程碑并导出工件；Formalizer 形式化无 GAP 片段');

  const evidence_floor = taggedClaims.some((c) => /claimed_proved|proved/i.test(c.claim.status || ''))
    ? 'L2–L3 声明存在，但机助/同行评议未自动确认 → 默认按 L2 草稿处理'
    : '默认 L0–L1（启发式/抽取）；除非提供可核验证明链';

  const lines: string[] = [];
  lines.push(`# 多结果整合报告`);
  lines.push('');
  lines.push(`- **问题**: ${opts.problem_title || opts.problem_slug || '（未指定）'}`);
  lines.push(`- **输入条数**: ${results.length}`);
  lines.push(`- **抽取声明数**: ${taggedClaims.length}`);
  lines.push(`- **证据地板**: ${evidence_floor}`);
  if (opts.focus) lines.push(`- **整合焦点**: ${opts.focus}`);
  lines.push('');
  lines.push(`## 输入清单`);
  results.forEach((r, i) => {
    lines.push(
      `${i + 1}. **${r.title || `结果 ${i + 1}`}** · source=\`${r.source || '?'}\` · role=\`${r.role || '?'}\`${r.score ? ` · score=${r.score}` : ''}`
    );
    lines.push(`   - 摘要: ${snippet(r.content, 140)}`);
  });
  lines.push('');
  lines.push(`## 符号对齐`);
  lines.push(`统一使用问题陈述中的记号（如 $r_D(100)$、$R_D(C)$、$C_*$、$\\alpha$、$P(t)$、$D$）。`);
  lines.push(`若某结果使用「覆盖半径 / 最小半径 / R」等别名，整合时已视为同一目标量，除非显式区分上下界。`);
  lines.push('');
  lines.push(`## 声明合并表`);
  lines.push(`| # | 来源 | 类型 | 状态 | 声明 |`);
  lines.push(`|---|------|------|------|------|`);
  taggedClaims.slice(0, 40).forEach((c, i) => {
    lines.push(
      `| ${i + 1} | ${c.src.replace(/\|/g, '/')} | ${c.claim.type || 'other'} | ${c.claim.status || ''} | ${snippet(c.claim.statement, 100).replace(/\|/g, '/')} |`
    );
  });
  if (!taggedClaims.length) lines.push(`| — | — | — | — | （未能自动抽取，请人工标注 claims） |`);
  lines.push('');
  lines.push(`## 冲突与裁决`);
  if (!conflicts.length) {
    lines.push(`未检测到自动规则冲突；**不代表**无逻辑矛盾——Critic 仍需人工级审查。`);
  } else {
    conflicts.forEach((c, i) => {
      lines.push(`${i + 1}. **${c.reason}**`);
      lines.push(`   - A: ${c.a}`);
      lines.push(`   - B: ${c.b}`);
      lines.push(`   - 裁决建议: 降级为待验证；禁止写入「已完成」。`);
    });
  }
  lines.push('');
  if (four) {
    lines.push(`## 综合态势（相对四要件）`);
    for (const [k, v] of Object.entries(four)) {
      lines.push(`- **${k}**: ${v}`);
    }
    lines.push('');
  } else {
    lines.push(`## 综合态势`);
    lines.push(`已融合 ${results.length} 路输入；角色覆盖: ${[...roles].join(', ') || 'unknown'}。`);
    lines.push(`请对照问题成功标准评估，勿夸大进度。`);
    lines.push('');
  }
  lines.push(`## 仍开放的 GAP`);
  const gaps = taggedClaims.filter((c) => c.claim.type === 'gap' || c.claim.status === 'open_gap');
  if (gaps.length) gaps.slice(0, 15).forEach((g, i) => lines.push(`${i + 1}. (${g.src}) ${snippet(g.claim.statement, 180)}`));
  else lines.push(`- 自动抽取未找到 [GAP] 标记；若正文隐含跳跃，请 Critic 补标。`);
  lines.push('');
  lines.push(`## 下一步行动（可执行）`);
  next_actions.forEach((a, i) => lines.push(`${i + 1}. ${a}`));
  lines.push('');
  lines.push(`## 建议写入工件的段落`);
  lines.push(`将「声明合并表」与「冲突与裁决」存为 artifact kind=\`synthesis_report\`；`);
  lines.push(`仅将无冲突且无 [GAP] 的引理交给 Formalizer。`);
  lines.push('');
  lines.push(`## 置信度`);
  lines.push(`自动整合器给出的是**结构化草稿**，不是同行评议证明。证据地板: ${evidence_floor}。`);
  lines.push('');
  lines.push(`## 合规`);
  lines.push(`本次整合仅用于数学研究。若原始请求含违法/入侵/恶意软件等内容，应拒绝并停止。`);

  return {
    markdown: lines.join('\n'),
    input_count: results.length,
    claim_count: taggedClaims.length,
    conflicts,
    next_actions,
    evidence_floor,
    four_requirements: four,
  };
}
