const BASE = '/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

export type Problem = {
  id: string;
  slug: string;
  title: string;
  title_zh: string;
  field: string;
  subfield?: string;
  difficulty: number;
  status: string;
  millennium: number;
  summary: string;
  summary_zh: string;
  formal_statement?: string;
  known_partial?: string;
  key_obstacles?: string;
  references?: { title: string; year: number }[];
  tags?: string[];
  priority: number;
  campaigns?: Campaign[];
  literature?: Literature[];
  artifacts?: Artifact[];
};

export type Role = {
  id: string;
  name: string;
  name_zh: string;
  icon: string;
  color: string;
  description: string;
  description_zh: string;
  system_prompt?: string;
  capabilities?: string[];
};

export type Campaign = {
  id: string;
  problem_id: string;
  title: string;
  status: string;
  strategy?: string;
  progress: number;
  notes?: string;
  problem_title?: string;
  problem_title_zh?: string;
  problem_slug?: string;
  field?: string;
  milestones?: Milestone[];
  sessions?: Session[];
  artifacts?: Artifact[];
};

export type Milestone = {
  id: string;
  campaign_id: string;
  title: string;
  description?: string;
  status: string;
  order_index: number;
};

export type Session = {
  id: string;
  campaign_id: string;
  role_id: string;
  title?: string;
  status: string;
  role_name?: string;
  role_name_zh?: string;
  role_color?: string;
  role_icon?: string;
  system_prompt?: string;
  messages?: Message[];
};

export type Message = {
  id: string;
  session_id: string;
  role_id?: string;
  sender: string;
  content: string;
  message_type: string;
  created_at: string;
};

export type Artifact = {
  id: string;
  problem_id?: string;
  campaign_id?: string;
  kind: string;
  title: string;
  content: string;
  formal_lang?: string;
  status: string;
  created_at?: string;
};

export type Literature = {
  id: string;
  problem_id?: string;
  title: string;
  authors?: string;
  year?: number;
  venue?: string;
  url?: string;
  abstract?: string;
  notes?: string;
  relevance: number;
  problem_title_zh?: string;
  problem_slug?: string;
};

export type Stats = {
  problems: number;
  open: number;
  resolvedish: number;
  campaigns: number;
  activeCampaigns: number;
  roles: number;
  artifacts: number;
  literature: number;
  byField: { field: string; count: number }[];
  byStatus: { status: string; count: number }[];
};

export const api = {
  health: () => request<{ ok: boolean; name: string }>('/health'),
  stats: () => request<Stats>('/stats'),
  problems: (params?: Record<string, string>) => {
    const q = new URLSearchParams(params || {}).toString();
    return request<Problem[]>(`/problems${q ? `?${q}` : ''}`);
  },
  fields: () => request<string[]>('/problems/fields'),
  problem: (id: string) => request<Problem>(`/problems/${id}`),
  createProblem: (body: Partial<Problem>) =>
    request<{ id: string; slug: string }>('/problems', { method: 'POST', body: JSON.stringify(body) }),
  updateProblem: (id: string, body: Partial<Problem>) =>
    request(`/problems/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  roles: () => request<Role[]>('/roles'),
  campaigns: (params?: Record<string, string>) => {
    const q = new URLSearchParams(params || {}).toString();
    return request<Campaign[]>(`/campaigns${q ? `?${q}` : ''}`);
  },
  campaign: (id: string) => request<Campaign>(`/campaigns/${id}`),
  createCampaign: (body: Record<string, unknown>) =>
    request<{ id: string }>('/campaigns', { method: 'POST', body: JSON.stringify(body) }),
  updateCampaign: (id: string, body: Record<string, unknown>) =>
    request(`/campaigns/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  updateMilestone: (id: string, body: Record<string, unknown>) =>
    request(`/milestones/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  session: (id: string) => request<Session>(`/sessions/${id}`),
  createSession: (body: { campaign_id: string; role_id: string; title?: string }) =>
    request<{ id: string }>('/sessions', { method: 'POST', body: JSON.stringify(body) }),
  postMessage: (sessionId: string, body: { content: string; sender?: string; message_type?: string }) =>
    request<{ id: string }>(`/sessions/${sessionId}/messages`, { method: 'POST', body: JSON.stringify(body) }),
  runRole: (sessionId: string, focus?: string) =>
    request<{ id: string; content: string; role: string }>(`/sessions/${sessionId}/run-role`, {
      method: 'POST',
      body: JSON.stringify({ focus }),
    }),
  artifacts: (params?: Record<string, string>) => {
    const q = new URLSearchParams(params || {}).toString();
    return request<Artifact[]>(`/artifacts${q ? `?${q}` : ''}`);
  },
  createArtifact: (body: Partial<Artifact>) =>
    request<{ id: string }>('/artifacts', { method: 'POST', body: JSON.stringify(body) }),
  literature: (params?: Record<string, string>) => {
    const q = new URLSearchParams(params || {}).toString();
    return request<Literature[]>(`/literature${q ? `?${q}` : ''}`);
  },
  activity: (limit = 40) => request<any[]>(`/activity?limit=${limit}`),
  board: () =>
    request<{
      roles: Role[];
      activeCampaigns: Campaign[];
      recentMessages: any[];
      openProblems: Problem[];
    }>('/board'),
  arenaManifest: () => request<any>('/arena/manifest'),
  arenaKickoff: (slug?: string) =>
    request<{ kickoff: string; system: string; slug: string; title_zh?: string; how_to: string }>(
      `/arena/kickoff${slug ? `?slug=${encodeURIComponent(slug)}` : ''}`
    ),
  promptsMeta: () =>
    request<{ files: string[]; roles: string[] }>('/prompts'),
  buildPrompt: (body: { slug: string; role: string; focus?: string; extra_context?: string }) =>
    request<{
      role: string;
      slug: string;
      system: string;
      user: string;
      combined: string;
      problem_title_zh?: string;
    }>('/prompts/build', { method: 'POST', body: JSON.stringify(body) }),
  promptPack: (slug: string) => request<any>(`/prompts/pack/${encodeURIComponent(slug)}`),
  results: (params?: Record<string, string>) => {
    const q = new URLSearchParams(params || {}).toString();
    return request<any[]>(`/results${q ? `?${q}` : ''}`);
  },
  createResult: (body: Record<string, unknown>) =>
    request<{ id: string }>('/results', { method: 'POST', body: JSON.stringify(body) }),
  createResultsBatch: (body: Record<string, unknown>) =>
    request<{ ids: string[]; count: number }>('/results/batch', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  synthesize: (body: Record<string, unknown>) =>
    request<{
      synthesis_id?: string;
      artifact_id?: string;
      markdown: string;
      input_count: number;
      claim_count: number;
      conflicts: any[];
      next_actions: string[];
      four_requirements?: Record<string, string>;
    }>('/synthesis', { method: 'POST', body: JSON.stringify(body) }),
  syntheses: (params?: Record<string, string>) => {
    const q = new URLSearchParams(params || {}).toString();
    return request<any[]>(`/syntheses${q ? `?${q}` : ''}`);
  },
  llmStatus: () => request<{ configured: boolean; model: string; forceTemplate: boolean; keyPresent: boolean }>('/llm/status'),
  runPipeline: (body: {
    slug: string;
    campaign_id?: string;
    focus?: string;
    roles?: string[];
    use_llm?: boolean;
    write_knowledge?: boolean;
  }) => request<any>('/pipeline/run', { method: 'POST', body: JSON.stringify(body) }),
  checklist: (slug: string) => request<any>(`/checklist/${encodeURIComponent(slug)}`),
  saveChecklist: (slug: string, body: any) =>
    request<any>(`/checklist/${encodeURIComponent(slug)}`, { method: 'PUT', body: JSON.stringify(body) }),
  resetChecklist: (slug: string) =>
    request<any>(`/checklist/${encodeURIComponent(slug)}/reset`, { method: 'POST', body: '{}' }),
  coveringBound: (body: Record<string, unknown>) =>
    request<any>('/tools/covering-bound', { method: 'POST', body: JSON.stringify(body) }),
  knowledgeCampaign: (slug: string) =>
    request<{ slug: string; files: string[]; root: string }>(`/knowledge/campaigns/${encodeURIComponent(slug)}`),
};
