# 贡献指南 · MRS Multi-AI Math

感谢关注 **MRS（Multi-Role System）多AI协作数学前沿攻克库**。

## 仓库定位

独立研究工作台 + 可被 [Arena.ai Agent Mode](https://arena.ai/agent/) 连接的 GitHub 知识库。

- 合法数学 / 学术研究  
- 多角色提示词与多结果整合  
- **禁止**用于违法、入侵、恶意软件、欺诈、越狱等  

## 本地开发

```bash
git clone https://github.com/Bodhi-wind/mrs-multi-ai-math.git
cd mrs-multi-ai-math
npm run setup          # 安装前后端依赖并 seed
npm run api            # 终端 1 · http://0.0.0.0:8787
npm run web            # 终端 2 · http://0.0.0.0:5173
```

或：`npm start`（seed + 双进程）。

可选 LLM：

```bash
cp backend/.env.example backend/.env
# 填写 MRS_LLM_API_KEY 等，勿提交 .env
```

## 目录约定

| 路径 | 含义 |
|------|------|
| `backend/` | Express API + SQLite |
| `frontend/` | React 工作台 |
| `knowledge/problems/` | 问题题面（可 git） |
| `knowledge/campaigns/` | 战役回写（可 git，供 Agent 续跑） |
| `prompts/` | 角色与整合提示词 |
| `agents/roles.yaml` | 角色注册表 |
| `AGENTS.md` | Arena Agent 必读 |

## 提交建议

1. 一个 PR 只做一类事（题库 / API / UI / 文档）  
2. 旗舰题相关改动：保持「四要件」纪律，数值结果必须标注 `numerical_upper_bound`  
3. 不提交 `node_modules/`、`data/*.db`、真实 API Key  
4. 新增问题：优先写 `knowledge/problems/<slug>.md`，并加入 `backend/src/seed.ts`  

## 测试清单（PR 前）

```bash
npm run seed
curl -s http://127.0.0.1:8787/api/health
curl -s -X POST http://127.0.0.1:8787/api/pipeline/run \
  -H 'Content-Type: application/json' \
  -d '{"slug":"unit-disk-100-circle-covering","roles":["explorer","synthesizer"],"use_llm":false}'
```

前端：打开 `/` `/pipeline` `/n100` `/prompts` `/synthesis` 无白屏。

## 行为准则

- 数学争论就事论事；标注 `[GAP]` 与未核验引用  
- 不鼓励学术不端（伪造数据/文献并隐瞒）  
- 安全相关请求一律拒绝  

## License

MIT（见 `LICENSE`）
