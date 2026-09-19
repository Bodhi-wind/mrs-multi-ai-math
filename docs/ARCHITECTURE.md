# MRS 架构（v1.2）

## 总览

```text
┌────────────────────────────┐     Connect GitHub
│  Arena.ai Agent Mode       │◄──────────────────── 用户
└─────────────┬──────────────┘
              │ 读仓库 / 写 PR 思路
┌─────────────▼──────────────┐
│  Git repo (knowledge,      │
│  prompts, AGENTS.md)       │
└─────────────┬──────────────┘
              │ 本地开发也可
┌─────────────▼──────────────┐
│  Frontend :5173            │
│  看板/题库/流水线/N100/    │
│  提示词/整合               │
└─────────────┬──────────────┘
              │ /api proxy
┌─────────────▼──────────────┐
│  Backend :8787             │
│  roles · pipeline · llm?   │
│  synthesis · checklist ·   │
│  covering tool             │
└─────────────┬──────────────┘
       ┌──────┴──────┐
       ▼             ▼
  SQLite data/   knowledge/campaigns/
  (本地运行时)    (可提交 git)
```

## 流水线数据流

```text
slug + focus
  → 各角色 session/message
  → results 表
  → synthesizeResults()
  → syntheses + artifacts
  → knowledge/campaigns/<slug>/results|runs
  → checklist 启发式更新（覆盖类题）
```

## LLM 策略

1. 读 `backend/.env`（可选）  
2. 有 Key 且未 `FORCE_TEMPLATE` → Chat Completions  
3. 否则 / 失败 → `generateRoleOutput` 研究模板  
4. 合规门禁对 focus/content 先过滤  

## 四要件与数值工具

- Checklist 状态机：missing → partial → claimed → verified  
- Covering bound **只**产出 `numerical_upper_bound`，UI/API 均带免责声明  
- 禁止流水线自动写入 `verified`  

## 扩展点

- 替换 `llm.ts` 为其它供应商  
- `pipeline.ts` 调整默认角色序  
- `synthesis.ts` 增强声明抽取  
- 新问题：md + seed 条目  
