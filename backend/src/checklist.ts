import fs from 'fs';
import path from 'path';
import { campaignsRoot, writeChecklist } from './knowledge.js';

export type ReqStatus = 'missing' | 'partial' | 'claimed' | 'verified';

export type FourChecklist = {
  slug: string;
  updated_at: string;
  items: {
    id: string;
    title: string;
    title_zh: string;
    status: ReqStatus;
    evidence: string;
    notes: string;
  }[];
  overall: 'not_started' | 'in_progress' | 'blocked' | 'complete_unverified' | 'complete_verified';
  blockers: string[];
};

const DEFAULT_ITEMS = [
  {
    id: 'exact_radius',
    title: 'Exact radius',
    title_zh: '精确半径',
    status: 'missing' as ReqStatus,
    evidence: '',
    notes: '需要显式整系数 P(t) 与有理隔离区间上唯一实根 α',
  },
  {
    id: 'configuration',
    title: 'Explicit configuration C*',
    title_zh: '具体构型',
    status: 'missing' as ReqStatus,
    evidence: '',
    notes: '有限代数数据唯一确定圆心',
  },
  {
    id: 'covering',
    title: 'Continuum covering proof',
    title_zh: '覆盖性',
    status: 'missing' as ReqStatus,
    evidence: '',
    notes: '∀x∈D；有限点抽样不算完成',
  },
  {
    id: 'optimality',
    title: 'Global optimality',
    title_zh: '全局最优性',
    status: 'missing' as ReqStatus,
    evidence: '',
    notes: '∀C R_D(C)≥α；不得未证对称假设',
  },
];

function overallOf(items: FourChecklist['items'], blockers: string[]): FourChecklist['overall'] {
  if (blockers.length) return 'blocked';
  const st = items.map((i) => i.status);
  if (st.every((s) => s === 'verified')) return 'complete_verified';
  if (st.every((s) => s === 'claimed' || s === 'verified')) return 'complete_unverified';
  if (st.every((s) => s === 'missing')) return 'not_started';
  return 'in_progress';
}

export function defaultChecklist(slug: string): FourChecklist {
  const items = DEFAULT_ITEMS.map((i) => ({ ...i }));
  return {
    slug,
    updated_at: new Date().toISOString(),
    items,
    overall: 'not_started',
    blockers: [],
  };
}

export function loadChecklist(slug: string): FourChecklist {
  const p = path.join(campaignsRoot, slug, 'checklist.json');
  if (!fs.existsSync(p)) return defaultChecklist(slug);
  try {
    const data = JSON.parse(fs.readFileSync(p, 'utf8')) as FourChecklist;
    if (!data.items?.length) return defaultChecklist(slug);
    return data;
  } catch {
    return defaultChecklist(slug);
  }
}

export function saveChecklist(slug: string, patch: Partial<FourChecklist> & { items?: FourChecklist['items'] }): FourChecklist {
  const cur = loadChecklist(slug);
  const items = patch.items || cur.items;
  const blockers = patch.blockers ?? cur.blockers;
  const next: FourChecklist = {
    slug,
    updated_at: new Date().toISOString(),
    items,
    blockers,
    overall: overallOf(items, blockers),
  };
  writeChecklist(slug, next);
  return next;
}

/** Heuristic bump from synthesis four_requirements strings */
export function mergeSynthesisHints(
  slug: string,
  four?: Record<string, string> | null
): FourChecklist {
  const cur = loadChecklist(slug);
  if (!four) return cur;
  const map: Record<string, string> = {
    '1_精确半径': 'exact_radius',
    '2_具体构型': 'configuration',
    '3_覆盖性': 'covering',
    '4_全局最优': 'optimality',
  };
  const items = cur.items.map((it) => ({ ...it }));
  for (const [k, v] of Object.entries(four)) {
    const id = map[k];
    if (!id) continue;
    const item = items.find((i) => i.id === id);
    if (!item) continue;
    if (/缺失/.test(v)) {
      if (item.status === 'missing') item.notes = v;
    } else if (/部分|待审|核验/.test(v)) {
      if (item.status === 'missing') item.status = 'partial';
      item.notes = v;
    }
  }
  return saveChecklist(slug, { items, blockers: cur.blockers });
}
