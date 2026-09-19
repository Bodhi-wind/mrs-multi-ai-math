import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const knowledgeRoot = path.join(__dirname, '../../knowledge');
export const campaignsRoot = path.join(knowledgeRoot, 'campaigns');

function safeSlug(slug: string): string {
  return String(slug || 'unknown')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'unknown';
}

export function ensureCampaignDir(slug: string): string {
  const dir = path.join(campaignsRoot, safeSlug(slug));
  fs.mkdirSync(dir, { recursive: true });
  fs.mkdirSync(path.join(dir, 'results'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'runs'), { recursive: true });
  return dir;
}

export function writeCampaignFile(
  slug: string,
  relativeName: string,
  content: string
): { path: string; rel: string } {
  const dir = ensureCampaignDir(slug);
  const rel = relativeName.replace(/^\/+/, '');
  if (rel.includes('..')) throw new Error('invalid path');
  const full = path.join(dir, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, 'utf8');
  return {
    path: full,
    rel: path.posix.join('knowledge/campaigns', safeSlug(slug), rel.replace(/\\/g, '/')),
  };
}

export function appendRunLog(slug: string, lines: string): string {
  const dir = ensureCampaignDir(slug);
  const logPath = path.join(dir, 'RUNLOG.md');
  const header = fs.existsSync(logPath) ? '' : `# Run log · ${slug}\n\n`;
  fs.appendFileSync(logPath, header + lines + '\n', 'utf8');
  return path.posix.join('knowledge/campaigns', safeSlug(slug), 'RUNLOG.md');
}

export function writeResultMarkdown(
  slug: string,
  opts: { role: string; source?: string; title?: string; content: string; stamp?: string }
): { path: string; rel: string } {
  const stamp = opts.stamp || new Date().toISOString().replace(/[:.]/g, '-');
  const role = (opts.role || 'unknown').toLowerCase();
  const name = `results/${stamp}_${role}.md`;
  const body = `---
slug: ${slug}
role: ${role}
source: ${opts.source || 'mrs'}
title: ${opts.title || role}
created_at: ${new Date().toISOString()}
---

# ${opts.title || role}

${opts.content}
`;
  return writeCampaignFile(slug, name, body);
}

export function writeSynthesisMarkdown(slug: string, markdown: string, meta?: unknown): { path: string; rel: string } {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const body = `---
slug: ${slug}
kind: synthesis_report
created_at: ${new Date().toISOString()}
meta: ${JSON.stringify(meta || {})}
---

${markdown}
`;
  return writeCampaignFile(slug, `runs/${stamp}_synthesis.md`, body);
}

export function writeChecklist(slug: string, data: unknown): { path: string; rel: string } {
  const body = JSON.stringify(data, null, 2);
  return writeCampaignFile(slug, 'checklist.json', body);
}

export function listCampaignFiles(slug: string): string[] {
  const dir = path.join(campaignsRoot, safeSlug(slug));
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  const walk = (d: string, prefix = '') => {
    for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
      const rel = prefix ? `${prefix}/${ent.name}` : ent.name;
      if (ent.isDirectory()) walk(path.join(d, ent.name), rel);
      else out.push(rel);
    }
  };
  walk(dir);
  return out.sort();
}
