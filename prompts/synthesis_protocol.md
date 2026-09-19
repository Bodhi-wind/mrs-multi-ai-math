# 多结果输入与整合协议（Multi-Result Synthesis Protocol）

## 目标

将 **N 条**来自不同模型、角色或人类的研究结果，整合为：

1. 一致结论与分歧表  
2. 可合并的引理/构型/数值声明  
3. 冲突与 `[GAP]` 清单  
4. 经排序的下一步行动  
5. 可选：更新后的战役策略段落  

## 输入格式（Result Bundle）

每条结果建议包含：

```yaml
id: optional
source: gpt-x | claude-x | gemini-x | human | arena-agent | other
role: explorer | historian | prover | critic | formalizer | synthesizer | unknown
problem_slug: unit-disk-100-circle-covering
title: 短标题
content: |
  （Markdown 正文）
claims:      # 可选，结构化声明
  - type: upper_bound | lower_bound | construction | lemma | counterexample | other
    statement: "..."
    status: conjectured | numerically_supported | claimed_proved | rejected
score: 1-5    # 可选，自评质量
```

批量 JSON 示例见仓库 `prompts/templates/result_bundle.schema.json`。

## 整合算法（Synthesizer 必须执行）

1. **登记**：列出全部结果 ID/来源/角色/一句话摘要  
2. **抽取声明**：上界、下界、构型、引理、反例、文献  
3. **对齐符号**：统一 $r_D(100)$、$C_*$、$\alpha$、$P(t)$ 等记号  
4. **冲突检测**：矛盾声明配对 + 裁决建议（保留/丢弃/待验证）  
5. **证据分级**：  
   - L0 启发式 · L1 数值 · L2 有草稿证明 · L3 可机助核验 · L4 已同行评议  
6. **合并**：只提升证据级不降低；有 `[GAP]` 的不得标「已完成四要件」  
7. **输出模板**（固定章节）：

```markdown
## 输入清单
## 符号对齐
## 声明合并表
## 冲突与裁决
## 综合态势（相对四要件/目标）
## 仍开放的 GAP
## 下一步行动（可执行、指定角色）
## 建议写入工件的段落
```

## 对旗舰题（100 圆覆盖）的额外硬规则

- 有限点抽样覆盖 **≠** 连续统覆盖证明  
- 未证明的对称性假设 **不得** 用于「全局最优性」完成判定  
- 数值半径候选必须降级为 `numerically_supported`，除非附带完整四要件  
- 整合报告必须显式对照四要件：精确半径 / 构型 / 覆盖 / 全局最优  

## API

- `POST /api/results` — 写入结果  
- `POST /api/results/batch` — 批量  
- `POST /api/synthesis` — 执行整合（可 `dry_run` 只返回报告）  
- `GET /api/results?problem_slug=...` — 列表  
