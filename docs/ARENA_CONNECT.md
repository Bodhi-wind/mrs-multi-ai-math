# 接入 Arena.ai Agent Mode

入口：**https://arena.ai/agent/**

## 合规

本仓库**可以**接入 Arena Agent，用途限定为：

- 合法数学研究与开放问题攻关  
- 多模型结果对照与整合  
- 研究提示词生成  

若用户目标涉及违法犯罪、未授权入侵、恶意软件、欺诈、越狱等，**不应接入/应拒绝**（见 `AGENTS.md`、API 403 门禁）。

## 连接步骤

1. 打开 https://arena.ai/agent/  
2. 点击 **Connect GitHub** 并授权  
3. 选择仓库 **`Bodhi-wind/mrs-multi-ai-math`**（或你的 fork）  
4. 粘贴 Kickoff 提示词（见下或前端「提示词工坊」）  

## Kickoff 获取

```bash
curl -s http://127.0.0.1:8787/api/arena/kickoff \
  | jq -r .kickoff
```

或打开本地工作台 `/prompts` 一键复制。

静态文件：`prompts/flagship_n100_pack.md`、`AGENTS.md`、`.arena/agent.json`。

## 多结果闭环

```text
Arena Agent（多角色/多模型产出）
        │
        ▼
POST /api/results/batch   ← 登记
        │
        ▼
POST /api/synthesis       ← 整合报告 + 工件
        │
        ▼
战役里程碑 / 下一角色提示词
```

## Agent 应优先阅读

1. `AGENTS.md`  
2. `prompts/synthesis_protocol.md`  
3. `knowledge/problems/<slug>.md`  
4. `agents/roles.yaml`  
