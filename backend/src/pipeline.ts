import { v4 as uuid } from 'uuid';
import { db } from './db.js';
import { buildRolePrompt } from './prompts.js';
import { chatCompletion, getLlmConfig } from './llm.js';
import { synthesizeResults, type ResultInput } from './synthesis.js';
import {
  appendRunLog,
  writeResultMarkdown,
  writeSynthesisMarkdown,
} from './knowledge.js';
import { mergeSynthesisHints } from './checklist.js';

const PIPELINE_ROLES = ['explorer', 'historian', 'prover', 'critic', 'synthesizer'] as const;

export type PipelineOptions = {
  slug: string;
  campaign_id?: string;
  focus?: string;
  roles?: string[];
  use_llm?: boolean;
  write_knowledge?: boolean;
  /** Injected template generator from index (offline). */
  templateFn: (roleName: string, campaign: any, focus?: string) => string;
};

function roleIdFromKey(key: string): string {
  return `role-${key.toLowerCase()}`;
}

function roleNameCapitalized(key: string): string {
  const k = key.toLowerCase();
  return k.charAt(0).toUpperCase() + k.slice(1);
}

export async function runPipeline(opts: PipelineOptions) {
  const problem = db
    .prepare(`SELECT * FROM problems WHERE slug = ? OR id = ?`)
    .get(opts.slug, opts.slug) as any;
  if (!problem) throw new Error(`Problem not found: ${opts.slug}`);

  let campaignId = opts.campaign_id;
  if (!campaignId) {
    const existing = db
      .prepare(
        `SELECT id FROM campaigns WHERE problem_id = ? AND status = 'active' ORDER BY updated_at DESC LIMIT 1`
      )
      .get(problem.id) as { id: string } | undefined;
    if (existing) campaignId = existing.id;
    else {
      campaignId = uuid();
      db.prepare(
        `INSERT INTO campaigns (id, problem_id, title, status, strategy, progress, notes)
         VALUES (?,?,?,'active',?,5,?)`
      ).run(
        campaignId,
        problem.id,
        `${problem.title_zh} · 流水线战役`,
        opts.focus || 'MRS 自动流水线',
        'created by pipeline'
      );
    }
  }

  const campaign = db
    .prepare(
      `SELECT c.*, p.title as problem_title, p.title_zh as problem_title_zh,
              p.summary, p.summary_zh, p.known_partial, p.key_obstacles, p.formal_statement, p.field, p.slug
       FROM campaigns c JOIN problems p ON p.id = c.problem_id WHERE c.id = ?`
    )
    .get(campaignId) as any;

  const roles = (opts.roles?.length ? opts.roles : [...PIPELINE_ROLES]).map((r) =>
    r.toLowerCase().replace(/^role-/, '')
  );
  const llmCfg = getLlmConfig();
  const useLlm = opts.use_llm !== false && llmCfg.configured;
  const writeKn = opts.write_knowledge !== false;

  const steps: any[] = [];
  const resultInputs: ResultInput[] = [];
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');

  for (const roleKey of roles) {
    const roleRow = db.prepare(`SELECT * FROM roles WHERE id = ?`).get(roleIdFromKey(roleKey)) as any;
    if (!roleRow) {
      steps.push({ role: roleKey, ok: false, error: 'role not in DB' });
      continue;
    }

    const sessionId = uuid();
    db.prepare(
      `INSERT INTO sessions (id, campaign_id, role_id, title, status) VALUES (?,?,?,?,'running')`
    ).run(sessionId, campaignId, roleRow.id, `Pipeline · ${roleRow.name_zh}`);

    let content = '';
    let engine: 'llm' | 'template' = 'template';
    let model: string | undefined;

    try {
      if (useLlm) {
        const built = buildRolePrompt({
          slug: problem.slug,
          role: roleKey,
          focus: opts.focus,
        });
        const out = await chatCompletion({
          system: built.system,
          user: built.combined.slice(0, 12000),
        });
        content = out.content;
        engine = 'llm';
        model = out.model;
      } else {
        content = opts.templateFn(roleNameCapitalized(roleKey), campaign, opts.focus);
        engine = 'template';
      }
    } catch (e: any) {
      content = opts.templateFn(roleNameCapitalized(roleKey), campaign, opts.focus);
      content += `\n\n> [MRS] LLM 调用失败，已回退模板：${e.message}\n`;
      engine = 'template';
    }

    const msgId = uuid();
    db.prepare(
      `INSERT INTO messages (id, session_id, role_id, sender, content, message_type) VALUES (?,?,?,?,?,?)`
    ).run(msgId, sessionId, roleRow.id, roleRow.name, content, 'analysis');

    const resultId = uuid();
    db.prepare(
      `INSERT INTO results (id, problem_id, campaign_id, source, role, title, content, claims_json, score)
       VALUES (?,?,?,?,?,?,?,?,?)`
    ).run(
      resultId,
      problem.id,
      campaignId,
      engine === 'llm' ? `llm:${model || 'chat'}` : 'template',
      roleKey,
      `Pipeline ${roleRow.name_zh}`,
      content,
      '[]',
      null
    );

    let knRel: string | undefined;
    if (writeKn) {
      knRel = writeResultMarkdown(problem.slug, {
        role: roleKey,
        source: engine,
        title: `Pipeline ${roleRow.name_zh}`,
        content,
        stamp: `${stamp}_${roleKey}`,
      }).rel;
    }

    resultInputs.push({
      id: resultId,
      source: engine,
      role: roleKey,
      title: roleRow.name_zh,
      content,
    });

    steps.push({
      role: roleKey,
      role_zh: roleRow.name_zh,
      session_id: sessionId,
      message_id: msgId,
      result_id: resultId,
      engine,
      model,
      knowledge_path: knRel,
      content_len: content.length,
    });
  }

  const report = synthesizeResults({
    problem_slug: problem.slug,
    problem_title: problem.title_zh,
    focus: opts.focus || 'pipeline auto-synthesis',
    results: resultInputs,
  });

  const synthesisId = uuid();
  db.prepare(
    `INSERT INTO syntheses (id, problem_id, campaign_id, title, focus, result_ids_json, report_md, meta_json)
     VALUES (?,?,?,?,?,?,?,?)`
  ).run(
    synthesisId,
    problem.id,
    campaignId,
    `流水线综合 · ${problem.title_zh}`,
    opts.focus || null,
    JSON.stringify(resultInputs.map((r) => r.id)),
    report.markdown,
    JSON.stringify({
      claim_count: report.claim_count,
      conflicts: report.conflicts,
      next_actions: report.next_actions,
      four_requirements: report.four_requirements,
      pipeline: true,
    })
  );

  const artifactId = uuid();
  db.prepare(
    `INSERT INTO artifacts (id, problem_id, campaign_id, kind, title, content, status)
     VALUES (?,?,?,?,?,?,?)`
  ).run(
    artifactId,
    problem.id,
    campaignId,
    'synthesis_report',
    `流水线综合 · ${problem.title_zh}`,
    report.markdown,
    'draft'
  );

  let synthesisPath: string | undefined;
  if (writeKn) {
    synthesisPath = writeSynthesisMarkdown(problem.slug, report.markdown, {
      synthesis_id: synthesisId,
      four_requirements: report.four_requirements,
    }).rel;
    appendRunLog(
      problem.slug,
      `\n## ${new Date().toISOString()}\n- campaign: ${campaignId}\n- roles: ${roles.join(', ')}\n- engine: ${useLlm ? 'llm+fallback' : 'template'}\n- synthesis: ${synthesisPath}\n`
    );
  }

  if (problem.slug.includes('unit-disk') || problem.slug.includes('100')) {
    mergeSynthesisHints(problem.slug, report.four_requirements);
  }

  // bump progress modestly
  const prog = Math.min(40, Number(campaign.progress || 0) + roles.length * 3);
  db.prepare(`UPDATE campaigns SET progress = ?, updated_at = datetime('now') WHERE id = ?`).run(
    prog,
    campaignId
  );

  return {
    problem_slug: problem.slug,
    campaign_id: campaignId,
    llm: { used: useLlm, config: { model: llmCfg.model, configured: llmCfg.configured } },
    steps,
    synthesis_id: synthesisId,
    artifact_id: artifactId,
    knowledge_synthesis: synthesisPath,
    report,
  };
}
