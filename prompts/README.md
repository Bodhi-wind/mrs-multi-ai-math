# MRS 提示词包（Prompt Packs）

本目录存放**可直接粘贴到 Arena.ai Agent / 其他 LLM** 的数学研究提示词。

## 文件

| 文件 | 用途 |
|------|------|
| `00_system_mrs.md` | 总系统约束（合规 + MRS 协议） |
| `01_explorer.md` … `06_synthesizer.md` | 六角色系统提示词模板 |
| `synthesis_protocol.md` | 多结果输入与整合协议 |
| `flagship_n100_pack.md` | 单位圆盘 100 圆覆盖 · 完整提示词包 |
| `templates/` | 带占位符的可渲染模板 |

## 动态生成

运行后端后：

```bash
curl -s -X POST http://127.0.0.1:8787/api/prompts/build \
  -H 'Content-Type: application/json' \
  -d '{"slug":"unit-disk-100-circle-covering","role":"prover","focus":"覆盖性分区引理"}'
```

或打开前端 **「提示词工坊」** 页面一键复制。

## 多结果整合

1. 多个模型/会话各自产出 Markdown 结果  
2. `POST /api/results` 批量登记（source、role、content、score 可选）  
3. `POST /api/synthesis` 生成综合报告 + 下一行动  
4. 将综合报告作为 Synthesizer 工件保存  

详见 `synthesis_protocol.md`。
