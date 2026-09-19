/**
 * Optional OpenAI-compatible chat client.
 * No key → callers should fall back to offline templates.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Minimal .env loader (no dotenv dependency)
(function loadEnv() {
  try {
    const dir = path.dirname(fileURLToPath(import.meta.url));
    const envPath = path.join(dir, '../.env');
    if (!fs.existsSync(envPath)) return;
    for (const line of fs.readFileSync(envPath, 'utf8').split(/\n/)) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const i = t.indexOf('=');
      if (i <= 0) continue;
      const k = t.slice(0, i).trim();
      let v = t.slice(i + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      if (process.env[k] === undefined) process.env[k] = v;
    }
  } catch {
    /* ignore */
  }
})();

export type LlmConfig = {
  configured: boolean;
  baseUrl: string;
  model: string;
  forceTemplate: boolean;
  keyPresent: boolean;
};

export function getLlmConfig(): LlmConfig {
  const key = (process.env.MRS_LLM_API_KEY || process.env.OPENAI_API_KEY || '').trim();
  const forceTemplate = String(process.env.MRS_LLM_FORCE_TEMPLATE || '').toLowerCase() === 'true';
  return {
    configured: Boolean(key) && !forceTemplate,
    baseUrl: (process.env.MRS_LLM_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, ''),
    model: process.env.MRS_LLM_MODEL || 'gpt-4o-mini',
    forceTemplate,
    keyPresent: Boolean(key),
  };
}

export async function chatCompletion(opts: {
  system: string;
  user: string;
  temperature?: number;
  max_tokens?: number;
}): Promise<{ content: string; model: string; source: 'llm' | 'error' }> {
  const cfg = getLlmConfig();
  if (!cfg.configured) {
    throw new Error('LLM not configured');
  }
  const key = (process.env.MRS_LLM_API_KEY || process.env.OPENAI_API_KEY || '').trim();
  const timeout = Number(process.env.MRS_LLM_TIMEOUT_MS || 120000);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: cfg.model,
        temperature: opts.temperature ?? 0.4,
        max_tokens: opts.max_tokens ?? 4096,
        messages: [
          { role: 'system', content: opts.system },
          { role: 'user', content: opts.user },
        ],
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`LLM HTTP ${res.status}: ${t.slice(0, 400)}`);
    }
    const data = (await res.json()) as any;
    const content = data?.choices?.[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      throw new Error('LLM returned empty content');
    }
    return { content, model: data.model || cfg.model, source: 'llm' };
  } finally {
    clearTimeout(timer);
  }
}
