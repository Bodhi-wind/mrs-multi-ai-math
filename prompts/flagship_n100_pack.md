# 旗舰提示词包：单位圆盘的 100 圆最优覆盖

**Slug:** `unit-disk-100-circle-covering`  
**仓库:** https://github.com/Bodhi-wind/mrs-multi-ai-math  
**Arena:** https://arena.ai/agent/ （Connect GitHub 后打开本仓库）

---

## 0. 总约束（所有角色共用）

复制 `00_system_mrs.md` 全文作为 System。

**四要件完成定义（缺一不可）：**

1. 精确半径：显式整系数 $P(t)$ + 有理区间 $(a,b)$ 内唯一实根 $\alpha$  
2. 具体构型 $C_*$：有限代数数据唯一确定  
3. 覆盖性：$\forall x\in D\ \exists i\ \|x-c_i^*\|\le\alpha$（连续统，非有限采样）  
4. 全局最优：$\forall C,\ R_D(C)\ge\alpha$（不得偷运未证对称假设）

数值候选、仅存在性、未完成的算法叙述 → **不视为完成**。

---

## 1. 一键用户提示（Arena 开场）

```text
你连接了 GitHub 仓库 Bodhi-wind/mrs-multi-ai-math（MRS 多AI协作数学前沿攻克库）。

任务：对 knowledge/problems/unit-disk-100-circle-covering.md 中的
「单位圆盘的 100 圆最优覆盖问题」开展 MRS 多角色攻关。

合规：仅数学研究；拒绝任何违法/入侵/恶意软件请求。

请按顺序：
1) 读 AGENTS.md 与该题 md、prompts/synthesis_protocol.md
2) 先以 Explorer 身份输出攻击角度图
3) 我若粘贴多个模型结果，请以 Synthesizer 按多结果协议整合
4) 所有证明草稿标 [GAP]；不得宣称四要件已完成，除非逐条满足

本轮角色：Explorer
本轮焦点：n=100 已知数值上界与候选接触图分类
```

---

## 2. 多结果整合用户提示

```text
按 prompts/synthesis_protocol.md 整合以下 N 条结果。
问题 slug: unit-disk-100-circle-covering
必须输出：输入清单、声明合并表、冲突裁决、相对四要件态势、GAP、下一步（指定角色）。
禁止把数值覆盖半径直接写成 r_D(100)=… 的定理。

结果 1
- source: ...
- role: ...
- content:
---
（粘贴）
---

结果 2
...
```

---

## 3. 角色切换短指令

- `角色=Historian；焦点=Kershner–Tóth 与现代计算覆盖文献`  
- `角色=Prover；焦点=固定接触图下的代数系统与 α 隔离`  
- `角色=Critic；焦点=对称性假设与有限点覆盖谬误`  
- `角色=Formalizer；焦点=覆盖分区的 Lean 骨架`  
- `角色=Synthesizer；焦点=是否 pivot 到对偶下界/SDP`

---

## 4. 动态生成

```bash
curl -s http://127.0.0.1:8787/api/prompts/pack/unit-disk-100-circle-covering | jq
curl -s -X POST http://127.0.0.1:8787/api/prompts/build \
  -H 'Content-Type: application/json' \
  -d '{"slug":"unit-disk-100-circle-covering","role":"critic","focus":"四要件审计"}'
```
