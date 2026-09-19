# Changelog

## 1.2.0 — 2026-09-18

### Added
- Optional OpenAI-compatible LLM (`backend/.env.example`, `src/llm.ts`)
- One-click multi-role pipeline (`POST /api/pipeline/run`, UI `/pipeline`)
- Knowledge writeback under `knowledge/campaigns/<slug>/`
- Four-requirement checklist API + N100 lab UI (`/n100`)
- Honest covering numerical upper-bound tool (`POST /api/tools/covering-bound`)
- Arena Agent pack: `AGENTS.md`, `.arena/agent.json`, prompt factory, multi-result synthesis
- Flagship problem: unit disk 100-circle optimal covering

### Fixed
- Seed FK delete order; prompt raw route typing; track `.arena/agent.json`

## 1.0.0 — 2026-09-17

- Initial hybrid lab: problem library, six MRS roles, campaigns, React workbench, SQLite API
