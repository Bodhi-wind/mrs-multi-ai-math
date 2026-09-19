# MRS · 多AI协作数学前沿攻克库

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Version](https://img.shields.io/badge/version-1.2.0-brightgreen.svg)](./CHANGELOG.md)
[![Arena Agent](https://img.shields.io/badge/Arena.ai-Agent%20Mode-7c3aed.svg)](https://arena.ai/agent/)

**MRS = Multi-Role System（多角色系统）**  
**独立仓库：** https://github.com/Bodhi-wind/mrs-multi-ai-math  

面向数学研究前沿的**可独立运行**工作台：问题库 · 六角色协作 · 一键流水线 · 多结果整合 · 提示词工坊 · Knowledge 回写 · 可接 [Arena.ai Agent](https://arena.ai/agent/)。

> **合规：** 仅合法数学/学术研究。违法、入侵、恶意软件、欺诈、越狱等 **拒绝接入**。详见 [`AGENTS.md`](./AGENTS.md)。

---

## 60 秒上手

```bash
git clone https://github.com/Bodhi-wind/mrs-multi-ai-math.git
cd mrs-multi-ai-math
npm run setup
npm run api    # 终端 1 · http://localhost:8787
npm run web    # 终端 2 · http://localhost:5173
```

或一条命令：`npm start`。

| 页面 | 路径 |
|------|------|
| 总览 | `/` |
| 问题库 | `/problems` |
| 一键流水线 | `/pipeline` |
| 100 圆专项 | `/n100` |
| 提示词工坊 | `/prompts` |
| 多结果整合 | `/synthesis` |

---

## 系统能力

| 模块 | 说明 |
|------|------|
| **问题库** | 21+ 前沿题（含千禧年）；Markdown 镜像 `knowledge/problems/` |
| **MRS 六角色** | Explorer · Historian · Prover · Critic · Formalizer · Synthesizer |
| **一键流水线** | 多角色串联 → 综合 → 回写 `knowledge/campaigns/` |
| **多结果整合** | 多模型产出登记、冲突检测、四要件快检 |
| **提示词工坊** | 按问题×角色生成，可粘贴到 Arena / 外部 LLM |
| **可选 LLM** | OpenAI 兼容 API；无 Key 则离线研究模板 |
| **N100 实验室** | 四要件清单 + **诚实**数值上界（永不自动升格为定理） |
| **Arena** | `AGENTS.md` · `.arena/agent.json` · `/api/arena/*` |

---

## 旗舰挑战

**单位圆盘的 100 圆最优覆盖**（`unit-disk-100-circle-covering`）

四要件（缺一不可）：精确代数半径 · 具体构型 \(C_*\) · 连续统覆盖证明 · 无对称假设的全局最优。

- 题面：[`knowledge/problems/unit-disk-100-circle-covering.md`](./knowledge/problems/unit-disk-100-circle-covering.md)  
- 提示词包：[`prompts/flagship_n100_pack.md`](./prompts/flagship_n100_pack.md)  
- 战役回写：`knowledge/campaigns/unit-disk-100-circle-covering/`

---

## 接入 Arena.ai Agent

1. 打开 https://arena.ai/agent/ → **Connect GitHub**  
2. 选择 `Bodhi-wind/mrs-multi-ai-math`  
3. 粘贴 Kickoff（工坊页或 `GET /api/arena/kickoff`）  
4. 多路输出拿回本地 **多结果整合** 或再跑 **流水线**  

说明：[`docs/ARENA_CONNECT.md`](./docs/ARENA_CONNECT.md)

---

## 可选：真实 LLM

```bash
cp backend/.env.example backend/.env
# MRS_LLM_API_KEY=...
# MRS_LLM_BASE_URL=https://api.openai.com/v1
# MRS_LLM_MODEL=gpt-4o-mini
```

重启 API。**勿提交 `.env`。**

---

## API 摘要

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 健康检查 + 特性列表 |
| GET | `/api/arena/manifest` | Agent 清单 |
| GET | `/api/arena/kickoff` | 开场提示词 |
| POST | `/api/prompts/build` | 生成角色提示词 |
| POST | `/api/pipeline/run` | 一键流水线 |
| POST | `/api/results/batch` | 多结果登记 |
| POST | `/api/synthesis` | 多结果整合 |
| GET/PUT | `/api/checklist/:slug` | 四要件清单 |
| POST | `/api/tools/covering-bound` | 数值上界（非定理） |
| GET | `/api/knowledge/campaigns/:slug` | 回写文件列表 |

冒烟：`npm run smoke`（需 API 已启动）。

---

## 目录结构

```text
mrs-multi-ai-math/
├── AGENTS.md · CONTRIBUTING.md · CHANGELOG.md · LICENSE
├── .arena/agent.json
├── agents/roles.yaml
├── backend/          # Express + better-sqlite3
├── frontend/         # React + Vite
├── knowledge/
│   ├── problems/     # 题面
│   ├── challenges/   # 旗舰原题图
│   └── campaigns/    # 流水线回写
├── prompts/          # 提示词模板
├── docs/
└── scripts/start.sh · smoke.sh
```

---

## 设计原则

1. 可扩展问题/角色/战役数据模型  
2. Prover ↔ Critic 对抗，禁止自嗨证明  
3. 诚实进度与 `[GAP]` 标记  
4. 数值 ≠ 定理（覆盖工具强制免责声明）  
5. 产物可 git，供 Arena 续跑  

---

## 文档

- [使用指南](./docs/USAGE_ZH.md)  
- [架构](./docs/ARCHITECTURE.md)  
- [Arena 接入](./docs/ARENA_CONNECT.md)  
- [贡献](./CONTRIBUTING.md)  
- [变更日志](./CHANGELOG.md)  

## License

MIT © MRS Math Lab contributors
