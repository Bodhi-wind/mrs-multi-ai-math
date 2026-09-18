# MRS · 多AI协作数学前沿攻克库

**MRS = Multi-Role System（多角色系统）**

一套面向数学研究前沿的混合系统：可扩展问题库 + 多 AI 角色协作攻关 + 证明工件 / 文献 / 进度追踪，带 Web 工作台与本地 API。

## 系统组成

| 层级 | 内容 |
|------|------|
| **问题库** | 千禧年问题、经典未解猜想、当代前沿（几何朗兰兹、AI4Math、挂谷等），可检索 / 筛选 / 录入 |
| **MRS 六角色** | Explorer 探索者 · Prover 证明者 · Critic 批判者 · Formalizer 形式化者 · Synthesizer 综合者 · Historian 史鉴者 |
| **攻克战役** | 绑定问题的协作项目，含里程碑、角色会话、进度条 |
| **工件与文献** | Lean 草稿、策略文档、证明笔记、文献条目 |
| **知识镜像** | `knowledge/problems/*.md` 与数据库同步的可版本管理文稿 |

## 快速启动

```bash
# 1. 后端（API + SQLite）
cd backend
npm install
npm run seed    # 写入示范问题与 RH 战役
npm run dev     # http://0.0.0.0:8787

# 2. 前端（另开终端）
cd frontend
npm install
npm run dev     # http://0.0.0.0:5173  （/api 已代理到后端）
```

## 默认工作流

1. 在 **前沿问题库** 浏览或录入问题  
2. 打开问题详情 → **发起攻克战役**（自动生成 MRS 六步里程碑）  
3. 在战役页依次启动角色会话，点击 **运行角色** 生成结构化输出  
4. 用 Critic 审查、Formalizer 产出 Lean 草稿，Synthesizer 汇总下一步  
5. 工件与文献沉淀到对应库，活动日志可审计

## 目录结构

```
mrs-math-lab/
├── backend/           # Express + better-sqlite3 API
│   └── src/
│       ├── index.ts   # REST API
│       ├── db.ts      # Schema
│       └── seed.ts    # 种子数据（20+ 前沿问题）
├── frontend/          # React + Vite + TS 工作台
├── knowledge/         # Markdown 问题镜像
│   └── problems/
├── agents/            # 角色定义（YAML）
├── data/              # SQLite DB（运行后生成）
└── docs/
```

## API 摘要

- `GET /api/problems` · `GET /api/problems/:slug`
- `GET /api/roles` · `GET /api/campaigns` · `POST /api/campaigns`
- `POST /api/sessions` · `POST /api/sessions/:id/run-role`
- `GET /api/artifacts` · `GET /api/literature` · `GET /api/board` · `GET /api/stats`

## 旗舰挑战题

**单位圆盘的 100 圆最优覆盖问题**（`unit-disk-100-circle-covering`）

- 确定 $r_D(100)$，并满足四要件：精确代数半径 · 具体构型 $C_*$ · 连续统覆盖证明 · 无对称假设的全局最优性
- 原题图：`knowledge/challenges/unit-disk-100-circle-covering.png`
- 详述：`knowledge/problems/unit-disk-100-circle-covering.md`

## 设计原则

1. **可扩展**：问题 / 角色 / 战役皆为数据，不写死领域  
2. **对抗协作**：Prover 与 Critic 成对出现，避免自嗨证明  
3. **形式化对齐**：Formalizer 把非形式草稿推到 Lean 债务看板  
4. **诚实进度**：里程碑与 Critic 裁决约束 progress 通胀  
5. **离线可跑**：角色输出内置研究模板引擎；可再对接外部 LLM API

## License

MIT
