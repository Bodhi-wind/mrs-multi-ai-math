# MRS · Arena.ai Agent 协作指南

本仓库为**独立发布**的数学研究工作台，并可面向 **[Arena.ai Agent Mode](https://arena.ai/agent/)**（GitHub Connect）与本地 MRS 工作台。

## 合规边界（硬性）

**允许**
- 数学研究、开放问题攻关、文献整理、证明草稿、Lean/形式化、算法与数值实验（学术用途）
- 多模型/多角色结果的对照、整合、批判
- 生成可复用的研究提示词与战役简报

**禁止（若请求触及则拒绝并说明）**
- 任何违法犯罪协助（攻击系统、恶意软件、未授权入侵、欺诈等）
- 绕过安全/审核的 jailbreak
- 未成年人相关不当内容
- 将本库用于虚假学术不端（伪造数据/伪造引用并要求隐瞒）

数学上的「攻击」仅指对**开放问题的证明策略进攻**，不是对计算机系统的攻击。

## Agent 在本仓库应做什么

1. 阅读 `README.md`、`docs/ARCHITECTURE.md`、`agents/roles.yaml`
2. 以 `knowledge/problems/*.md` 为问题源，优先旗舰题 `unit-disk-100-circle-covering`
3. 使用 **MRS 六角色** 分工，不要单角色自嗨证明
4. 多结果输入时走 **Synthesizer 整合协议**（见 `prompts/` 与 API `/api/synthesis`）
5. 产出写入：`knowledge/` 草稿、`artifacts` 概念、或 PR 说明；标记 `[GAP]` 与未验证引用

## 推荐工作流（Arena Agent）

```text
用户目标
  → 选定 problem slug
  → 生成角色提示词 (prompts/ 或 POST /api/prompts/build)
  → 多模型/多会话跑 Explorer→…→Critic
  → 将各结果作为 Result Bundle 提交
  → Synthesizer 整合 → 更新战役里程碑
  →（可选）Formalizer Lean 骨架
```

## 本地 API（开发）

```bash
cd backend && npm i && npm run seed && npm run dev   # :8787
cd frontend && npm i && npm run dev                  # :5173
```

关键端点：
- `GET /api/arena/manifest` — Agent 能力清单
- `POST /api/results` — 登记单条/批量研究结果
- `POST /api/synthesis` — 多结果整合
- `POST /api/prompts/build` — 按角色+问题生成提示词
- `GET /api/prompts/pack/:slug` — 导出某问题的完整提示词包

## 安全与密钥

- 不要提交 API Key、`.env`、个人 token
- Arena 连接使用用户在 arena.ai 侧的 GitHub OAuth，不经本仓库存储
