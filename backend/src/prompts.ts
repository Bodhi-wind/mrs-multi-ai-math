import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const promptsRoot = path.join(__dirname, '../../prompts');

const ROLE_FILES: Record<string, string> = {
  explorer: '01_explorer.md',
  historian: '02_historian.md',
  prover: '03_prover.md',
  critic: '04_critic.md',
  formalizer: '05_formalizer.md',
  synthesizer: '06_synthesizer.md',
};

export function readPromptFile(name: string): string {
  const p = path.join(promptsRoot, name);
  if (!fs.existsSync(p)) return '';
  return fs.readFileSync(p, 'utf8');
}

export function listPromptFiles(): string[] {
  if (!fs.existsSync(promptsRoot)) return [];
  const out: string[] = [];
  const walk = (dir: string, prefix = '') => {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      if (ent.name.startsWith('.')) continue;
      const rel = prefix ? `${prefix}/${ent.name}` : ent.name;
      if (ent.isDirectory()) walk(path.join(dir, ent.name), rel);
      else out.push(rel);
    }
  };
  walk(promptsRoot);
  return out.sort();
}

type ProblemRow = {
  slug: string;
  title: string;
  title_zh: string;
  field: string;
  subfield?: string | null;
  status: string;
  difficulty: number;
  summary: string;
  summary_zh: string;
  formal_statement?: string | null;
  known_partial?: string | null;
  key_obstacles?: string | null;
};

export function getProblemBySlug(slug: string): ProblemRow | undefined {
  return db.prepare(`SELECT * FROM problems WHERE slug = ? OR id = ?`).get(slug, slug) as
    | ProblemRow
    | undefined;
}

function fill(template: string, vars: Record<string, string>): string {
  let out = template;
  for (const [k, v] of Object.entries(vars)) {
    out = out.split(`{{${k}}}`).join(v ?? '');
  }
  // clear any leftover unknown placeholders lightly
  out = out.replace(/\{\{[A-Z0-9_]+\}\}/g, '');
  return out;
}

export function buildRolePrompt(opts: {
  slug: string;
  role: string;
  focus?: string;
  extra_context?: string;
  locale?: 'zh' | 'en' | 'both';
}): {
  role: string;
  slug: string;
  system: string;
  user: string;
  combined: string;
  problem_title_zh?: string;
} {
  const roleKey = opts.role.toLowerCase().replace(/^role-/, '');
  const file = ROLE_FILES[roleKey];
  if (!file) {
    throw new Error(`Unknown role: ${opts.role}. Use: ${Object.keys(ROLE_FILES).join(', ')}`);
  }

  const problem = getProblemBySlug(opts.slug);
  if (!problem) throw new Error(`Problem not found: ${opts.slug}`);

  const system = readPromptFile('00_system_mrs.md');
  const tmpl = readPromptFile(file);
  const focusSection = opts.focus
    ? `\n## 本轮焦点\n${opts.focus}\n`
    : '';
  const extra = opts.extra_context ? `\n## 附加上下文\n${opts.extra_context}\n` : '';

  const vars: Record<string, string> = {
    SYSTEM_MRS: system,
    TITLE: problem.title,
    TITLE_ZH: problem.title_zh,
    SLUG: problem.slug,
    FIELD: problem.field,
    SUBFIELD: problem.subfield ? ` · ${problem.subfield}` : '',
    STATUS: problem.status,
    DIFFICULTY: String(problem.difficulty),
    SUMMARY: problem.summary,
    SUMMARY_ZH: problem.summary_zh,
    FORMAL_STATEMENT: problem.formal_statement || '（待补充）',
    KNOWN_PARTIAL: problem.known_partial || '（待补充）',
    KEY_OBSTACLES: problem.key_obstacles || '（待补充）',
    FOCUS_SECTION: focusSection + extra,
  };

  const combined = fill(tmpl, vars).trim();

  // Split: first horizontal rule or identity section — provide system + compact user kickoff
  const user = [
    `请严格以 MRS 角色 **${roleKey}** 工作。`,
    `问题：${problem.title_zh}（${problem.title}）`,
    `slug: \`${problem.slug}\``,
    opts.focus ? `本轮焦点：${opts.focus}` : '',
    opts.extra_context ? `附加上下文：\n${opts.extra_context}` : '',
    '',
    '请按提示词中的「输出结构」作答。数学「攻击」仅指证明策略。',
  ]
    .filter(Boolean)
    .join('\n');

  return {
    role: roleKey,
    slug: problem.slug,
    system,
    user,
    combined,
    problem_title_zh: problem.title_zh,
  };
}

export function buildPromptPack(slug: string): {
  slug: string;
  title_zh?: string;
  system: string;
  roles: Record<string, string>;
  synthesis_protocol: string;
  arena_kickoff: string;
} {
  const problem = getProblemBySlug(slug);
  if (!problem) throw new Error(`Problem not found: ${slug}`);

  const system = readPromptFile('00_system_mrs.md');
  const roles: Record<string, string> = {};
  for (const r of Object.keys(ROLE_FILES)) {
    roles[r] = buildRolePrompt({ slug, role: r }).combined;
  }

  const arena_kickoff = `你连接了 GitHub 仓库中的 MRS 数学前沿攻克库。

任务：对问题 \`${problem.slug}\`（${problem.title_zh}）开展多角色攻关。
合规：仅数学研究；拒绝违法、入侵、恶意软件等请求。
「攻击问题」= 证明策略，不是攻击系统。

请先阅读 AGENTS.md 与 knowledge/problems/${problem.slug}.md。
本轮角色：Explorer
请输出 Landscape / Known Results / Attack Angles / Next Experiments。`;

  return {
    slug: problem.slug,
    title_zh: problem.title_zh,
    system,
    roles,
    synthesis_protocol: readPromptFile('synthesis_protocol.md'),
    arena_kickoff,
  };
}
