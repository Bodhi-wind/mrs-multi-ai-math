---
slug: collatz
title: Collatz Conjecture
title_zh: 考拉兹猜想
field: Number Theory
subfield: Dynamical Systems / Elementary NT
status: open
difficulty: 8
millennium: 0
priority: 70
tags: [elementary, dynamics, open-easy-to-state]
---

# 考拉兹猜想 / Collatz Conjecture

## 摘要
对任意正整数 n，按偶则 n/2、奇则 3n+1 迭代，最终都会到达 1。

Iterating n → n/2 (even) or 3n+1 (odd) eventually reaches 1 for every positive integer n.

## 形式陈述
```
∀n∈ℤ>0, ∃k≥0: T^k(n)=1 where T(n)=n/2 or 3n+1.
```

## 已知部分结果
Verified to ~2^68. Tao (2019): almost all orbits attain almost bounded values (logarithmic density).

## 关键障碍
No known dynamical invariant forcing descent; probabilistic heuristics hard to rigorize for all n.

## 参考文献
- Lagarias, The 3x+1 problem and its generalizations (1985)
- Tao, Almost all Collatz orbits… (2019)
