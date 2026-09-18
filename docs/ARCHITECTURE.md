# MRS 架构说明

## 总览

```
┌─────────────────────────────────────────────────────────┐
│  Frontend (React + Vite)  ·  数学前沿攻克工作台            │
│  看板 / 问题库 / 战役 / 角色 / 工件 / 文献 / 日志          │
└───────────────────────────┬─────────────────────────────┘
                            │  /api proxy
┌───────────────────────────▼─────────────────────────────┐
│  Backend (Express + TS)                                  │
│  REST · 角色模板引擎 · 活动日志                           │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│  SQLite (data/mrs.db)                                    │
│  problems · roles · campaigns · sessions · messages      │
│  artifacts · literature · milestones · activity_log      │
└─────────────────────────────────────────────────────────┘
        │
        ▼
  knowledge/problems/*.md   ← 可 git 版本管理的镜像
  agents/roles.yaml         ← 角色治理与流水线
```

## 数据模型（核心）

- **Problem**：前沿问题原子；状态 ∈ open | partial | contested | active-frontier | resolved
- **Campaign**：针对单问题的攻克项目
- **Session**：某角色在战役中的一次工作线程
- **Message**：简报 / 分析 / 证明草稿 / 人类注释
- **Artifact**：可沉淀产物（lean_sketch, strategy_doc, proof_draft…）
- **Milestone**：战役检查点（默认 MRS 六步）

## 多角色协作循环

```
Explorer ──► Historian ──► Prover ──► Critic
                │                        │
                └────────► Formalizer ◄──┘
                              │
                         Synthesizer ──► (下一轮 / pivot)
```

## 扩展点

1. **外部 LLM**：将 `POST /sessions/:id/run-role` 中的 `generateRoleOutput` 替换为真实模型调用，注入 `roles.system_prompt`
2. **Lean LSP**：Formalizer 工件可对接本地 `lake` / mathlib 检查
3. **导入导出**：problems / artifacts 已有 MD 镜像，可加 JSONL bulk import
4. **权限与多用户**：当前为单机研究工作台；可加 auth 中间件
