---
slug: unit-disk-100-circle-covering
title: Optimal Covering of the Unit Disk by 100 Equal Circles
title_zh: 单位圆盘的 100 圆最优覆盖问题
field: Discrete Geometry
subfield: Circle Covering / Geometric Optimization
status: open
difficulty: 9
millennium: 0
priority: 96
tags: [circle-covering, disk-covering, discrete-geometry, exact-optimization, computer-assisted-proof, MRS-challenge, n-100]
source_image: assets/unit-disk-100-circle-covering.png
---

# 单位圆盘的 100 圆最优覆盖问题 / Optimal Covering of the Unit Disk by 100 Equal Circles

> **MRS 旗舰挑战题** — 完整四要件判定标准（精确半径 · 具体构型 · 覆盖性 · 全局最优性）

## 原题图像

- `assets/unit-disk-100-circle-covering.png`
- `../challenges/unit-disk-100-circle-covering.png`

## 问题陈述

设

$$
D = \{ x \in \mathbb{R}^2 : \|x\|_2 \le 1 \},
\qquad
R_D(C) = \max_{x \in D} \min_{1 \le i \le 100} \|x - c_i\|_2,
$$

其中 $C = (c_1,\ldots,c_{100}) \in (\mathbb{R}^2)^{100}$，并定义

$$
r_D(100) = \inf_{C \in (\mathbb{R}^2)^{100}} R_D(C).
$$

**确定 $r_D(100)$**，并完成以下要求：

### 1. 精确半径

实际列出非零整系数多项式 $P(t)$ 的全部系数及具体有理数 $0 \le a < b$，证明 $P$ 在 $(a,b)$ 内恰有一个实根 $\alpha$。

### 2. 具体构型

给出一组确定的圆心坐标 $C_*$，采用根式、多项式与有理隔离区间，或其他实际列出的、具有唯一性证明的有限代数数据精确指定。

### 3. 覆盖性

证明

$$
\forall x \in D,\ \exists i \in \{1,\ldots,100\},\ \|x - c_i^*\|_2 \le \alpha.
$$

### 4. 全局最优性

证明

$$
\forall C \in (\mathbb{R}^2)^{100},\ R_D(C) \ge \alpha,
$$

从而 $R_D(C_*) = r_D(100) = \alpha$。**不得未经证明限制构型的对称性或组合结构。**

## 完成标准（硬性）

- 允许任何严格方法，但**仅证明存在性、代数性，或仅给出尚未求出的枚举极限、求解算法、数值候选，均不视为完成**。
- 若使用计算机辅助证明，须交付实际结果及足以严格核验结论的代码、输入和证明材料。
- **数值近似或只检查有限个点都被覆盖，不能代替整个圆盘被覆盖的证明**；必须严格证明单位圆盘所有点都被覆盖。

## 形式陈述（简写）

```
D = {x ∈ R² : ||x||₂ ≤ 1}
R_D(C) = max_{x∈D} min_{1≤i≤100} ||x − c_i||₂
r_D(100) = inf_C R_D(C)

Goal: exhibit α (unique real root of explicit P on (a,b)),
      exhibit C* (finitely specified algebraic data),
      prove covering: R_D(C*) ≤ α,
      prove optimality: ∀C, R_D(C) ≥ α,
      without unproven symmetry restrictions.
```

## 已知部分结果

圆覆盖 / 等圆覆盖问题历史悠久（Kershner, Tóth 等）。对许多较小的 $n$，圆被 $n$ 个等圆覆盖的最优或最佳已知构型有数值表（Heppes, Nurmela–Östergård, Schürmann–Vallentin, packomania 等）。多数候选最优解是数值发现的高度对称刚性构型；**带精确代数半径且不假设对称的全局最优性证明**仅在很小的 $n$ 与特殊情形已知。对 $n=100$，存在高质量数值上界，但满足上述四要件的严格完整定理形式结果，文献中尚未确立为已完成。

## 关键障碍

1. **精确代数半径**：最优半径的极小多项式往往来自刚性几何约束（等边、角度、活跃 Voronoi/接触图），次数可能很高。
2. **连续统覆盖证明**：不能只采样有限点；需要区域剖分、最坏点分析或可认证区间方法。
3. **无对称假设的全局最优**：必须排除所有竞争接触图 / 拓扑型，或使用控制任意构型的凸/SDP/分层下界。
4. **机助证明的可核验性**：代码、输入、证明链须可完整审查、无间隙。

## MRS 攻克建议流水线

1. **Explorer**：整理 $n\le N$ 已知精确结果与 $n=100$ 数值纪录；列出候选对称型与接触图。
2. **Historian**：Kershner–Tóth 线、现代计算覆盖文献、失败的“只靠对称”论证。
3. **Prover**：对固定接触图写代数系统 → 隔离 $\alpha$；覆盖分区引理。
4. **Critic**：打击对称性假设、有限点覆盖、数值 gap。
5. **Formalizer**：关键覆盖/距离不等式的 Lean 骨架；区间算术证书格式。
6. **Synthesizer**：是否 pivot 到对偶下界 / SDP 层级，而非单一构型枚举。

## 参考文献

- Kershner, The number of circles covering a set (1939)
- Tóth, Lagerungen in der Ebene auf der Kugel und im Raum (1953)
- Nurmela–Östergård, Covering a circle with equal circles (~1999)
- Heppes; Schürmann–Vallentin, covering and packing literature (2000s)
- Packomania / circle covering numerical tables (ongoing)

## 附件

- 原题截图：`assets/unit-disk-100-circle-covering.png`
