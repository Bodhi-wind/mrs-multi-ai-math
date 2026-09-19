import { v4 as uuid } from 'uuid';
import { db, initSchema } from './db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

initSchema();

// Clear existing seed data for idempotent re-seed (order respects FKs)
db.exec(`PRAGMA foreign_keys = OFF;`);
db.exec(`
  DELETE FROM activity_log;
  DELETE FROM messages;
  DELETE FROM milestones;
  DELETE FROM sessions;
  DELETE FROM artifacts;
  DELETE FROM literature;
  DELETE FROM campaigns;
  DELETE FROM roles;
  DELETE FROM problems;
`);
db.exec(`PRAGMA foreign_keys = ON;`);

const roles = [
  {
    id: 'role-explorer',
    name: 'Explorer',
    name_zh: '探索者',
    icon: 'compass',
    color: '#3B82F6',
    description: 'Scouts the problem landscape, maps known results, and proposes attack angles.',
    description_zh: '勘察问题全景，梳理已知结果，提出可能的进攻角度。',
    system_prompt: `You are the Explorer role in MRS (Multi-Role System) for mathematical research.
Your duties:
1. Survey the problem: history, equivalent formulations, known special cases.
2. Map the landscape of related theorems and techniques.
3. Propose 3–7 distinct attack angles ranked by promise.
4. Identify low-hanging fruit and partial results worth chasing first.
5. Never claim a full proof; your job is reconnaissance and hypothesis generation.
Output structured markdown with sections: Landscape, Known Results, Attack Angles, Next Experiments.`,
    capabilities: ['literature_survey', 'hypothesis_generation', 'problem_decomposition'],
  },
  {
    id: 'role-prover',
    name: 'Prover',
    name_zh: '证明者',
    icon: 'shield',
    color: '#10B981',
    description: 'Constructs rigorous proofs, lemmas, and reduction chains.',
    description_zh: '构造严格证明、引理链条与归约路径。',
    system_prompt: `You are the Prover role in MRS.
Your duties:
1. Attempt constructive proofs of target statements or lemmas.
2. Break hard goals into a dependency DAG of sub-lemmas.
3. Write proofs in clear mathematical English, ready for formalization.
4. Flag every non-trivial step that needs citation or deeper justification.
5. Prefer elementary arguments when possible; escalate sophistication only as needed.
Always state assumptions explicitly. Mark incomplete steps as [GAP].`,
    capabilities: ['proof_construction', 'lemma_generation', 'reduction'],
  },
  {
    id: 'role-critic',
    name: 'Critic',
    name_zh: '批判者',
    icon: 'search',
    color: '#EF4444',
    description: 'Adversarially reviews arguments, finds gaps, counterexamples, and hidden assumptions.',
    description_zh: '对抗性审查论证，寻找漏洞、反例与隐含假设。',
    system_prompt: `You are the Critic role in MRS — an adversarial reviewer.
Your duties:
1. Stress-test every claim: find gaps, circularity, unjustified leaps.
2. Search for counterexamples to intermediate lemmas.
3. Expose hidden assumptions and scope limitations.
4. Rate proof quality: sound / needs work / fatally flawed.
5. Propose minimal repairs when flaws are local.
Be ruthless but constructive. Never rubber-stamp.`,
    capabilities: ['gap_detection', 'counterexample_search', 'assumption_audit'],
  },
  {
    id: 'role-formalizer',
    name: 'Formalizer',
    name_zh: '形式化者',
    icon: 'code',
    color: '#8B5CF6',
    description: 'Translates informal math into Lean 4 / Coq / Isabelle, manages formal debt.',
    description_zh: '将非形式数学翻译为 Lean 4 / Coq / Isabelle，管理形式化债务。',
    system_prompt: `You are the Formalizer role in MRS.
Your duties:
1. Translate informal statements and proofs into Lean 4 (preferred) or Coq/Isabelle.
2. Identify libraries (mathlib4 etc.) that already cover prerequisites.
3. Design formalization roadmaps: which definitions first, which lemmas next.
4. Track sorry/admit debt and prioritize closing it.
5. Suggest tactic strategies and automation opportunities.
Output Lean 4 code blocks when possible. Note mathlib dependencies.`,
    capabilities: ['lean4', 'coq', 'formal_roadmap', 'sorry_tracking'],
  },
  {
    id: 'role-synthesizer',
    name: 'Synthesizer',
    name_zh: '综合者',
    icon: 'git-merge',
    color: '#F59E0B',
    description: 'Merges multi-role outputs into coherent strategy, progress reports, and next actions.',
    description_zh: '融合多角色输出为统一策略、进度报告与下一步行动。',
    system_prompt: `You are the Synthesizer role in MRS — the orchestration brain.
Your duties:
1. Integrate Explorer/Prover/Critic/Formalizer outputs into one coherent picture.
2. Maintain a living attack plan with priorities and blockers.
3. Produce progress reports and milestone updates.
4. Decide which role should act next and with what brief.
5. Detect when the team is stuck and force a strategy pivot.
Be decisive. Prefer actionable next steps over vague summaries.`,
    capabilities: ['orchestration', 'progress_reporting', 'strategy_pivot'],
  },
  {
    id: 'role-historian',
    name: 'Historian',
    name_zh: '史鉴者',
    icon: 'book-open',
    color: '#06B6D4',
    description: 'Tracks literature, prior art, and historical failed attempts to avoid rediscovery.',
    description_zh: '追踪文献、先前工作与历史失败尝试，避免重复劳动。',
    system_prompt: `You are the Historian role in MRS.
Your duties:
1. Curate the essential literature for the target problem.
2. Summarize landmark papers and why they matter.
3. Catalog famous failed approaches and why they failed.
4. Spot connections to results in adjacent fields.
5. Maintain citation graphs and reading priorities.
Never invent citations. Mark uncertain attributions clearly.`,
    capabilities: ['literature_curation', 'failed_attempts', 'cross_field_links'],
  },
];

const insertRole = db.prepare(`
  INSERT INTO roles (id, name, name_zh, icon, color, description, description_zh, system_prompt, capabilities_json)
  VALUES (@id, @name, @name_zh, @icon, @color, @description, @description_zh, @system_prompt, @capabilities_json)
`);

for (const r of roles) {
  insertRole.run({
    ...r,
    capabilities_json: JSON.stringify(r.capabilities),
  });
}

const problems = [
  {
    slug: 'riemann-hypothesis',
    title: 'Riemann Hypothesis',
    title_zh: '黎曼假设',
    field: 'Number Theory',
    subfield: 'Analytic Number Theory',
    difficulty: 10,
    status: 'open',
    millennium: 1,
    summary:
      'All non-trivial zeros of the Riemann zeta function have real part 1/2. Equivalent to sharp error terms in the prime number theorem.',
    summary_zh:
      '黎曼ζ函数的所有非平凡零点的实部均为 1/2。等价于素数定理误差项的最优估计。',
    formal_statement:
      '∀s ∈ ℂ, ζ(s)=0 ∧ 0<Re(s)<1  ⇒  Re(s)=1/2.',
    known_partial:
      'Hardy: infinitely many zeros on the critical line. Levinson/Conrey: >40% of zeros on the line. Zero-free regions near Re(s)=1. RH verified computationally to enormous height.',
    key_obstacles:
      'Lack of a spectral/geometric interpretation that forces the critical line; difficulty controlling off-line zeros; limitations of classical analytic methods.',
    references: [
      { title: 'Riemann, Über die Anzahl der Primzahlen…', year: 1859 },
      { title: 'Titchmarsh, The Theory of the Riemann Zeta-function', year: 1986 },
      { title: 'Edwards, Riemann\'s Zeta Function', year: 1974 },
    ],
    tags: ['millennium', 'zeta', 'primes', 'clay'],
    priority: 100,
  },
  {
    slug: 'p-vs-np',
    title: 'P versus NP',
    title_zh: 'P 对 NP 问题',
    field: 'Theoretical Computer Science',
    subfield: 'Computational Complexity',
    difficulty: 10,
    status: 'open',
    millennium: 1,
    summary:
      'Is every language decidable in nondeterministic polynomial time also decidable in deterministic polynomial time?',
    summary_zh:
      '是否每个可在非确定性多项式时间内判定的语言，也都能在确定性多项式时间内判定？',
    formal_statement: 'Does P = NP?',
    known_partial:
      'Relativization barriers (Baker-Gill-Solovay), natural proofs barrier (Razborov-Rudich), algebrization (Aaronson-Wigderson). P≠NP believed; no collapse of PH known to contradict.',
    key_obstacles:
      'Diagonalization and circuit lower-bound techniques are blocked by known barriers; need fundamentally new proof methods.',
    references: [
      { title: 'Cook, The complexity of theorem-proving procedures', year: 1971 },
      { title: 'Aaronson, P≟NP survey', year: 2016 },
    ],
    tags: ['millennium', 'complexity', 'clay'],
    priority: 100,
  },
  {
    slug: 'navier-stokes',
    title: 'Navier–Stokes Existence and Smoothness',
    title_zh: '纳维-斯托克斯方程的存在性与光滑性',
    field: 'Analysis',
    subfield: 'PDE / Fluid Dynamics',
    difficulty: 10,
    status: 'open',
    millennium: 1,
    summary:
      'Do smooth, globally defined solutions exist for the 3D incompressible Navier–Stokes equations with smooth initial data?',
    summary_zh:
      '三维不可压缩纳维-斯托克斯方程在光滑初值下是否存在整体光滑解？',
    formal_statement:
      'For smooth divergence-free u₀ on ℝ³ or 𝕋³, does a smooth solution u exist for all t>0?',
    known_partial:
      'Global weak solutions (Leray). Smooth for small data / 2D. Blow-up criteria (Beale-Kato-Majda). Recent convex-integration non-uniqueness for weak solutions (Buckmaster-Vicol et al.).',
    key_obstacles:
      'Possible singularity formation via vortex stretching; supercritical nature of the equations; gap between weak and strong solutions.',
    references: [
      { title: 'Fefferman, Clay official description', year: 2000 },
      { title: 'Tao, finite-time blowup for averaged NSE', year: 2016 },
    ],
    tags: ['millennium', 'pde', 'fluids', 'clay'],
    priority: 95,
  },
  {
    slug: 'birch-swinnerton-dyer',
    title: 'Birch and Swinnerton-Dyer Conjecture',
    title_zh: 'BSD 猜想',
    field: 'Number Theory',
    subfield: 'Arithmetic Geometry',
    difficulty: 10,
    status: 'open',
    millennium: 1,
    summary:
      'The rank of an elliptic curve over ℚ equals the order of vanishing of its L-function at s=1; the leading coefficient encodes arithmetic invariants including Ш.',
    summary_zh:
      '椭圆曲线在 ℚ 上的秩等于其 L 函数在 s=1 处的零点阶；首项系数编码包括 Ш 在内的算术不变量。',
    formal_statement:
      'rank(E/ℚ) = ord_{s=1} L(E,s), and the BSD formula for L^{(r)}(E,1)/r!.',
    known_partial:
      'Proven for ranks 0 and 1 in many cases (Gross-Zagier, Kolyvagin, Bhargava-Skinner-Zhang partial results). Finetness of Ш still open in general.',
    key_obstacles:
      'Controlling Sha; higher-rank cases; p-adic and Iwasawa-theoretic approaches incomplete in full generality.',
    references: [
      { title: 'Birch & Swinnerton-Dyer, Notes on elliptic curves II', year: 1965 },
      { title: 'Wiles et al., modularity theorem', year: 1995 },
    ],
    tags: ['millennium', 'elliptic-curves', 'L-functions', 'clay'],
    priority: 95,
  },
  {
    slug: 'yang-mills-mass-gap',
    title: 'Yang–Mills Existence and Mass Gap',
    title_zh: '杨-米尔斯存在性与质量间隙',
    field: 'Mathematical Physics',
    subfield: 'Quantum Field Theory',
    difficulty: 10,
    status: 'open',
    millennium: 1,
    summary:
      'Construct a non-trivial quantum Yang–Mills theory on ℝ⁴ with a mass gap Δ>0.',
    summary_zh: '在 ℝ⁴ 上构造具有质量间隙 Δ>0 的非平凡量子杨-米尔斯理论。',
    formal_statement:
      'Existence of a QFT satisfying Wightman/OS axioms for compact simple gauge group G, with spectrum gap above vacuum.',
    known_partial:
      'Lattice gauge theory evidence; constructive QFT success in lower dimensions; partial results on confinement.',
    key_obstacles:
      'Making the continuum limit rigorous in 4D; controlling non-perturbative effects; relating lattice and continuum formulations.',
    references: [
      { title: 'Clay official problem description (Jaffe-Witten)', year: 2000 },
    ],
    tags: ['millennium', 'qft', 'gauge-theory', 'clay'],
    priority: 90,
  },
  {
    slug: 'hodge-conjecture',
    title: 'Hodge Conjecture',
    title_zh: '霍奇猜想',
    field: 'Algebraic Geometry',
    subfield: 'Hodge Theory',
    difficulty: 10,
    status: 'open',
    millennium: 1,
    summary:
      'On a non-singular complex projective variety, every Hodge class is a rational linear combination of classes of algebraic cycles.',
    summary_zh:
      '非奇异复射影簇上，每个霍奇类都是代数闭链类的有理线性组合。',
    formal_statement:
      'Hdg^k(X) = H^{2k}(X,ℚ) ∩ H^{k,k}(X) is generated by algebraic cycle classes.',
    known_partial:
      'Known for k=1 (Lefschetz (1,1)). Many special varieties. Absolute Hodge and motivic approaches.',
    key_obstacles:
      'Lack of general methods to produce algebraic cycles; transcendental nature of Hodge filtration.',
    references: [
      { title: 'Hodge, The topological invariants of algebraic varieties', year: 1950 },
      { title: 'Voisin, Hodge theory and complex algebraic geometry', year: 2002 },
    ],
    tags: ['millennium', 'cycles', 'hodge', 'clay'],
    priority: 90,
  },
  {
    slug: 'poincare-perelman',
    title: 'Poincaré Conjecture (Resolved)',
    title_zh: '庞加莱猜想（已解决）',
    field: 'Topology',
    subfield: 'Geometric Topology',
    difficulty: 10,
    status: 'resolved',
    millennium: 1,
    summary:
      'Every simply connected closed 3-manifold is homeomorphic to the 3-sphere. Proved by Perelman via Ricci flow with surgery.',
    summary_zh:
      '每个单连通闭三维流形都同胚于三维球面。佩雷尔曼通过带手术的 Ricci 流证明。',
    formal_statement:
      'If M³ is closed, simply connected, then M ≅ S³.',
    known_partial:
      'Full proof by Perelman (2002–2003); verified by multiple groups. Implies full geometrization.',
    key_obstacles:
      'Resolved. Remaining work: expositions, formalization, higher-dimensional analogues already known by other methods.',
    references: [
      { title: 'Perelman, The entropy formula for the Ricci flow…', year: 2002 },
      { title: 'Morgan-Tian, Ricci flow and the Poincaré conjecture', year: 2007 },
    ],
    tags: ['millennium', 'resolved', 'ricci-flow', 'clay'],
    priority: 40,
  },
  {
    slug: 'abc-conjecture',
    title: 'abc Conjecture',
    title_zh: 'abc 猜想',
    field: 'Number Theory',
    subfield: 'Diophantine Analysis',
    difficulty: 9,
    status: 'contested',
    millennium: 0,
    summary:
      'For coprime a+b=c, rad(abc)^{1+ε} bounds |c|. Claimed proof by Mochizuki via Inter-universal Teichmüller theory remains disputed.',
    summary_zh:
      '对互素 a+b=c，rad(abc)^{1+ε} 控制 |c|。望月新一通过 IUT 理论的证明仍有争议。',
    formal_statement:
      '∀ε>0 ∃Kε: coprime a+b=c ⇒ c < Kε · rad(abc)^{1+ε}.',
    known_partial:
      'Many consequences conditional on abc. Mochizuki IUT claimed proof (2012); Scholze-Stix objections; community not fully convinced.',
    key_obstacles:
      'IUT comprehension barrier; need independent verification or alternative proof; effective constants.',
    references: [
      { title: 'Massey, abc conjecture intro', year: 1990 },
      { title: 'Mochizuki, IUTT I–IV', year: 2012 },
    ],
    tags: ['diophantine', 'iut', 'contested'],
    priority: 85,
  },
  {
    slug: 'twin-prime',
    title: 'Twin Prime Conjecture',
    title_zh: '孪生素数猜想',
    field: 'Number Theory',
    subfield: 'Analytic Number Theory',
    difficulty: 9,
    status: 'open',
    millennium: 0,
    summary:
      'There are infinitely many primes p such that p+2 is also prime.',
    summary_zh: '存在无穷多对素数 (p, p+2)。',
    formal_statement: '|{p prime : p+2 prime}| = ∞.',
    known_partial:
      'Zhang (2013): liminf (p_{n+1}-p_n) ≤ 70 million. Maynard/Tao: bound reduced to 246 (unconditionally), 6 or 12 under Elliott-Halberstam.',
    key_obstacles:
      'Parity problem in sieve theory; reaching gap 2 requires new ideas beyond GPY/Maynard method.',
    references: [
      { title: 'Zhang, Bounded gaps between primes', year: 2013 },
      { title: 'Maynard, Small gaps between primes', year: 2015 },
    ],
    tags: ['primes', 'sieve', 'bounded-gaps'],
    priority: 88,
  },
  {
    slug: 'collatz',
    title: 'Collatz Conjecture',
    title_zh: '考拉兹猜想',
    field: 'Number Theory',
    subfield: 'Dynamical Systems / Elementary NT',
    difficulty: 8,
    status: 'open',
    millennium: 0,
    summary:
      'Iterating n → n/2 (even) or 3n+1 (odd) eventually reaches 1 for every positive integer n.',
    summary_zh:
      '对任意正整数 n，按偶则 n/2、奇则 3n+1 迭代，最终都会到达 1。',
    formal_statement:
      '∀n∈ℤ>0, ∃k≥0: T^k(n)=1 where T(n)=n/2 or 3n+1.',
    known_partial:
      'Verified to ~2^68. Tao (2019): almost all orbits attain almost bounded values (logarithmic density).',
    key_obstacles:
      'No known dynamical invariant forcing descent; probabilistic heuristics hard to rigorize for all n.',
    references: [
      { title: 'Lagarias, The 3x+1 problem and its generalizations', year: 1985 },
      { title: 'Tao, Almost all Collatz orbits…', year: 2019 },
    ],
    tags: ['elementary', 'dynamics', 'open-easy-to-state'],
    priority: 70,
  },
  {
    slug: 'geometric-langlands',
    title: 'Geometric Langlands Program',
    title_zh: '几何朗兰兹纲领',
    field: 'Representation Theory',
    subfield: 'Geometric Langlands',
    difficulty: 9,
    status: 'partial',
    millennium: 0,
    summary:
      'Categorical correspondence between Langlands dual group local systems on a curve and D-modules/eigensheaves on Bun_G. Major advances including 2024 announced proofs of unramified categorical GL.',
    summary_zh:
      '曲线上朗兰兹对偶群局部系统与 Bun_G 上 D-模/特征层之间的范畴对应。2024 年有未分歧范畴几何朗兰兹的重大宣布。',
    formal_statement:
      'Equivalence relating IndCoh_N(LocSys_{Ĝ}) and D-mod(Bun_G) (formulations vary; Gaitsgory et al.).',
    known_partial:
      'Function-field Langlands partial; geometric GL for GL_n (Frenkel-Gaitsgory-Vilonen); 2024 five-author claimed proof of unramified categorical conjecture.',
    key_obstacles:
      'Ramified / wild cases; number-field Langlands still largely open; bridging geometric and arithmetic forms.',
    references: [
      { title: 'Frenkel, Lectures on the Langlands program…', year: 2005 },
      { title: 'Gaitsgory et al., unramified categorical GL', year: 2024 },
    ],
    tags: ['langlands', 'stacks', 'frontier-2020s'],
    priority: 92,
  },
  {
    slug: 'ai4math-formal',
    title: 'AI-Complete Formal Mathematics',
    title_zh: 'AI 完备形式化数学',
    field: 'Mathematical Logic',
    subfield: 'Automated Reasoning / AI4Math',
    difficulty: 8,
    status: 'active-frontier',
    millennium: 0,
    summary:
      'Build AI systems that can autonomously formalize, prove, and discover research-level mathematics at human-expert scale.',
    summary_zh:
      '构建能在人类专家尺度上自主形式化、证明并发现研究级数学的 AI 系统。',
    formal_statement:
      'Open research program: autoformalization + theorem proving + conjecture generation closed loop.',
    known_partial:
      'AlphaProof/AlphaGeometry, Lean agent systems, miniF2F/PutnamBench progress; still far from research-level open problems.',
    key_obstacles:
      'Long-horizon proof search; autoformalization fidelity; lack of research-level benchmarks; integration of informal insight with formal checkers.',
    references: [
      { title: 'DeepMind, AI achieves silver-medal standard…', year: 2024 },
      { title: 'mathlib4 community', year: 2024 },
    ],
    tags: ['ai4math', 'lean', 'autoformalization', 'frontier'],
    priority: 93,
  },
  {
    slug: 'kakeya-set',
    title: 'Kakeya Set Conjecture (Resolved in 3D+)',
    title_zh: '挂谷集猜想（三维及以上已解决）',
    field: 'Analysis',
    subfield: 'Geometric Measure Theory / Harmonic Analysis',
    difficulty: 9,
    status: 'partial',
    millennium: 0,
    summary:
      'A Kakeya set in ℝ^n (containing a unit line segment in every direction) must have Hausdorff dimension n. Settled in all dimensions by Hong Wang & Joshua Zahl (2025) after the 3D breakthrough.',
    summary_zh:
      'ℝ^n 中的挂谷集（含每个方向的单位线段）豪斯多夫维数必为 n。王虹与 Joshua Zahl 在三维突破后推进至全维数结果（2025）。',
    formal_statement:
      'Any Besicovitch/Kakeya set in ℝ^n has Hausdorff dimension n.',
    known_partial:
      'Fully resolved in all dimensions (Wang-Zahl line of work, 2025). Connections to restriction conjectures remain fertile.',
    key_obstacles:
      'Main conjecture resolved; related restriction/Bourgain problems still open in full strength.',
    references: [
      { title: 'Wang-Zahl, Kakeya in R^3', year: 2025 },
      { title: 'Bourgain, Katz, Tao earlier bounds', year: 2003 },
    ],
    tags: ['harmonic-analysis', 'recently-resolved', 'kakeya'],
    priority: 75,
  },
  {
    slug: 'goldbach',
    title: 'Goldbach Conjecture',
    title_zh: '哥德巴赫猜想',
    field: 'Number Theory',
    subfield: 'Additive Number Theory',
    difficulty: 9,
    status: 'open',
    millennium: 0,
    summary:
      'Every even integer ≥ 4 is the sum of two primes. Weak (ternary) Goldbach proved by Helfgott.',
    summary_zh:
      '每个 ≥4 的偶数都是两个素数之和。弱哥德巴赫（三素数）已被 Helfgott 证明。',
    formal_statement: '∀n≥2, 2n = p+q for some primes p,q.',
    known_partial:
      'Vinogradov ternary; Helfgott weak Goldbach; Chen Jingrun: even = p + P2; verified to enormous bounds.',
    key_obstacles:
      'Circle method major/minor arc estimates insufficient for binary case at full strength; parity-type issues.',
    references: [
      { title: 'Helfgott, The ternary Goldbach conjecture is true', year: 2013 },
      { title: 'Chen, On the representation of a larger even integer…', year: 1973 },
    ],
    tags: ['additive-nt', 'circle-method'],
    priority: 80,
  },
  {
    slug: 'hsd-conjecture',
    title: 'Hodge Standard Conjecture',
    title_zh: '霍奇标准猜想',
    field: 'Algebraic Geometry',
    subfield: 'Motives',
    difficulty: 9,
    status: 'open',
    millennium: 0,
    summary:
      'Positivity of the intersection pairing on primitive algebraic cycles — a key missing piece for the theory of motives.',
    summary_zh:
      '原始代数闭链上相交配对的正定性质——动机理论的关键缺失环节。',
    formal_statement:
      'The Hodge standard conjecture on positivity of intersection forms on primitive algebraic cohomology.',
    known_partial:
      'Known in special cases (surfaces, abelian varieties in some settings). Related to Grothendieck standard conjectures.',
    key_obstacles:
      'Need new positivity methods in algebraic cycles; links to Hodge conjecture itself.',
    references: [
      { title: 'Grothendieck, Standard conjectures on algebraic cycles', year: 1969 },
    ],
    tags: ['motives', 'cycles', 'standard-conjectures'],
    priority: 78,
  },
  {
    slug: 'smooth-4d-poincare',
    title: 'Smooth 4-dimensional Poincaré',
    title_zh: '光滑四维庞加莱猜想',
    field: 'Topology',
    subfield: '4-Manifold Topology',
    difficulty: 9,
    status: 'open',
    millennium: 0,
    summary:
      'Is every homotopy 4-sphere diffeomorphic to S⁴? (Topological version settled by Freedman.)',
    summary_zh:
      '每个同伦四维球面是否都微分同胚于 S⁴？（拓扑版本已被 Freedman 解决。）',
    formal_statement:
      'Does Θ_4 = 0? I.e., is every homotopy 4-sphere standard smooth?',
    known_partial:
      'Freedman: topological category yes. Exotic ℝ⁴ exist. Many candidate homotopy spheres; none proven exotic yet.',
    key_obstacles:
      'Lack of smooth classification tools in dimension 4; gauge theory gives obstructions but not complete invariants for HS⁴.',
    references: [
      { title: 'Freedman, The topology of four-dimensional manifolds', year: 1982 },
      { title: 'Donaldson, gauge-theoretic invariants', year: 1983 },
    ],
    tags: ['4-manifolds', 'exotic-spheres', 'smooth-structures'],
    priority: 82,
  },
  {
    slug: 'unique-games',
    title: 'Unique Games Conjecture',
    title_zh: '唯一游戏猜想',
    field: 'Theoretical Computer Science',
    subfield: 'Hardness of Approximation',
    difficulty: 8,
    status: 'open',
    millennium: 0,
    summary:
      'Certain constraint satisfaction problems are NP-hard to approximate better than specific thresholds; implies tight hardness for many optimization problems.',
    summary_zh:
      '某些约束满足问题的近似比阈值是 NP-难的；由此可导出大量优化问题的紧硬度结果。',
    formal_statement:
      'For every ε,δ>0, sufficiently large q, distinguishing unique-label-cover value >1-ε vs <δ is NP-hard.',
    known_partial:
      'Subexponential algorithms (Arora-Barak-Steurer); evidence both for and against; 2-to-2 games theorem (Khot-Minzer-Safra line).',
    key_obstacles:
      'Settling UGC one way or the other; understanding intermediate complexity regimes.',
    references: [
      { title: 'Khot, On the power of unique 2-prover 1-round games', year: 2002 },
    ],
    tags: ['complexity', 'approximation', 'ugc'],
    priority: 76,
  },
  {
    slug: 'quantum-complexity-bqp',
    title: 'BQP vs Classical Complexity',
    title_zh: 'BQP 与经典复杂度关系',
    field: 'Theoretical Computer Science',
    subfield: 'Quantum Complexity',
    difficulty: 8,
    status: 'active-frontier',
    millennium: 0,
    summary:
      'Clarify the relationship of BQP to P, NP, PH, and classical fine-grained classes; prove unconditional separations where possible.',
    summary_zh:
      '厘清 BQP 与 P、NP、PH 及经典细粒度类的关系；在可能处给出无条件分离。',
    formal_statement:
      'Open: is BQP ⊆ PH? oracle separations exist; unconditional still open in most forms.',
    known_partial:
      'Oracle separations (relative to random oracles, forrelated etc.). Quantum supremacy sampling arguments. No unconditional BQP ⊈ PH.',
    key_obstacles:
      'Same barriers as classical complexity; need non-relativizing, non-algebrizing techniques adapted to quantum.',
    references: [
      { title: 'Bernstein-Vazirani, Quantum complexity theory', year: 1997 },
      { title: 'Raz-Tal, BQP ⊈ PH relative to an oracle', year: 2019 },
    ],
    tags: ['quantum', 'complexity', 'frontier'],
    priority: 77,
  },
  {
    slug: 'syzygy-conjecture',
    title: 'Green’s Conjecture on Syzygies',
    title_zh: 'Green 合冲猜想',
    field: 'Algebraic Geometry',
    subfield: 'Syzygies / Curves',
    difficulty: 7,
    status: 'partial',
    millennium: 0,
    summary:
      'Predicts the shape of the minimal free resolution of the canonical ring of a curve in terms of its Clifford index.',
    summary_zh:
      '用曲线的 Clifford 指标预言其典范环极小自由分解的形状。',
    formal_statement:
      'For a curve of genus g, Betti numbers β_{i,i+1} vanish in the range predicted by Cliff(C).',
    known_partial:
      'Proved for generic curves (Voisin); many special cases; open in full for all smooth curves.',
    key_obstacles:
      'Special curves with unexpected syzygies; characteristic-p phenomena.',
    references: [
      { title: 'Green, Koszul cohomology and the geometry of projective varieties', year: 1984 },
      { title: 'Voisin, Green\'s canonical syzygy conjecture for generic curves', year: 2005 },
    ],
    tags: ['syzygies', 'curves', 'commutative-algebra'],
    priority: 65,
  },
  {
    slug: 'continuum-hypothesis-descriptive',
    title: 'Determinacy & Continuum Structure',
    title_zh: '决定性与连续统结构',
    field: 'Set Theory',
    subfield: 'Descriptive Set Theory',
    difficulty: 8,
    status: 'active-frontier',
    millennium: 0,
    summary:
      'From large cardinals and determinacy, map the structure of definable sets of reals and viable paths beyond CH independence.',
    summary_zh:
      '从大基数与决定性出发，刻画可定义实数集结构，并探索超越 CH 独立性的可行路径。',
    formal_statement:
      'Research program: inner model theory + AD^+ + forcing axioms as a coherent picture of V.',
    known_partial:
      'CH independent (Gödel-Cohen). Woodin\'s Ω-logic / Ultimate-L program. PD from large cardinals.',
    key_obstacles:
      'Ultimate-L vs forcing-axiom multiverse philosophical split; technical depth of inner model theory.',
    references: [
      { title: 'Woodin, Suitable extender models', year: 2010 },
      { title: 'Koellner, Large cardinals and determinacy', year: 2014 },
    ],
    tags: ['set-theory', 'determinacy', 'continuum'],
    priority: 72,
  },
  {
    slug: 'unit-disk-100-circle-covering',
    title: 'Optimal Covering of the Unit Disk by 100 Equal Circles',
    title_zh: '单位圆盘的 100 圆最优覆盖问题',
    field: 'Discrete Geometry',
    subfield: 'Circle Covering / Geometric Optimization',
    difficulty: 9,
    status: 'open',
    millennium: 0,
    summary:
      'Determine the minimal radius r_D(100) such that the closed unit disk D can be covered by 100 equal closed disks. A complete solution requires: (1) exact algebraic radius via an explicit integer polynomial P with a unique real root alpha in a rational interval (a,b); (2) an explicitly specified optimal center configuration C* by finite algebraic data with uniqueness; (3) a rigorous continuum covering proof that every point of D is within alpha of some center; (4) a global optimality proof R_D(C)>=alpha for all configurations, without unproven symmetry restrictions. Numerical candidates or finite-point checks do not count as complete.',
    summary_zh:
      '确定最小半径 r_D(100)，使单位闭圆盘 D 可被 100 个等半径闭圆盘覆盖。完整解答须满足四要件：精确半径（显式整系数多项式 P 与有理隔离区间上的唯一实根 alpha）；具体构型 C*（有限代数数据唯一确定）；覆盖性（严格证明 D 上每一点都被覆盖）；全局最优性（任意 100 心构型 R_D(C)>=alpha，不得未经证明限制对称性）。仅存在性、数值候选或有限点检查均不视为完成。',
    formal_statement:
      'D={x in R^2: ||x||_2<=1}, R_D(C)=max_{x in D} min_i ||x-c_i||_2, r_D(100)=inf_C R_D(C). Determine alpha=r_D(100) exactly, exhibit C*, prove covering and unrestricted global optimality.',
    known_partial:
      'Classical circle covering (Kershner, Toth). Best-known equal-circle coverings of a circle tabulated for many n (Heppes, Nurmela-Ostergard, Schurmann-Vallentin, packomania). Exact algebraic global optima known only for small n. For n=100, strong numerical upper bounds exist; a four-requirement exact theorem is open in the strong form stated here.',
    key_obstacles:
      'High-degree algebraic radius from rigid contact graphs; continuum covering certificates (not finite samples); global optimality without symmetry assumptions (all combinatorial types or dominating dual/SDP bounds); fully inspectable computer-assisted proof chains.',
    references: [
      { title: 'Kershner, The number of circles covering a set', year: 1939 },
      { title: 'Toth, Lagerungen in der Ebene auf der Kugel und im Raum', year: 1953 },
      { title: 'Nurmela-Ostergard, Covering a circle with equal circles', year: 1999 },
      { title: 'Schurmann-Vallentin, covering and packing literature', year: 2003 },
      { title: 'Packomania circle covering numerical tables', year: 2020 },
    ],
    tags: ['circle-covering', 'disk-covering', 'discrete-geometry', 'exact-optimization', 'computer-assisted-proof', 'MRS-challenge', 'n-100'],
    priority: 96,
  },
];


const insertProblem = db.prepare(`
  INSERT INTO problems (
    id, slug, title, title_zh, field, subfield, difficulty, status, millennium,
    summary, summary_zh, formal_statement, known_partial, key_obstacles,
    references_json, tags_json, priority
  ) VALUES (
    @id, @slug, @title, @title_zh, @field, @subfield, @difficulty, @status, @millennium,
    @summary, @summary_zh, @formal_statement, @known_partial, @key_obstacles,
    @references_json, @tags_json, @priority
  )
`);

const problemIds: Record<string, string> = {};

for (const p of problems) {
  const id = uuid();
  problemIds[p.slug] = id;
  insertProblem.run({
    id,
    slug: p.slug,
    title: p.title,
    title_zh: p.title_zh,
    field: p.field,
    subfield: p.subfield,
    difficulty: p.difficulty,
    status: p.status,
    millennium: p.millennium,
    summary: p.summary,
    summary_zh: p.summary_zh,
    formal_statement: p.formal_statement,
    known_partial: p.known_partial,
    key_obstacles: p.key_obstacles,
    references_json: JSON.stringify(p.references),
    tags_json: JSON.stringify(p.tags),
    priority: p.priority,
  });
}

// Sample campaign on Riemann Hypothesis
const rhId = problemIds['riemann-hypothesis'];
const campaignId = uuid();
db.prepare(`
  INSERT INTO campaigns (id, problem_id, title, status, strategy, progress, notes)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`).run(
  campaignId,
  rhId,
  'RH 零点谱解释进攻线',
  'active',
  '探索 Hilbert–Pólya 思路与随机矩阵/量子混沌联系，同时推进显式公式与零点统计的形式化。',
  18,
  '示范战役：展示 MRS 多角色如何围绕单一前沿问题协作。'
);

const milestones = [
  { title: '文献与等价形式图谱', status: 'completed', order: 1 },
  { title: '攻击角度排序与筛选', status: 'completed', order: 2 },
  { title: '显式公式关键引理整理', status: 'active', order: 3 },
  { title: '零点密度估计形式化草稿', status: 'pending', order: 4 },
  { title: '批判审查与反例压力测试', status: 'pending', order: 5 },
  { title: '综合报告与下一阶段路线', status: 'pending', order: 6 },
];

const insertMs = db.prepare(`
  INSERT INTO milestones (id, campaign_id, title, description, status, order_index, completed_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);
for (const m of milestones) {
  insertMs.run(
    uuid(),
    campaignId,
    m.title,
    null,
    m.status,
    m.order,
    m.status === 'completed' ? new Date().toISOString() : null
  );
}

const sessionExplorer = uuid();
const sessionProver = uuid();
db.prepare(`
  INSERT INTO sessions (id, campaign_id, role_id, title, status) VALUES (?, ?, ?, ?, ?)
`).run(sessionExplorer, campaignId, 'role-explorer', 'RH 全景勘察', 'completed');
db.prepare(`
  INSERT INTO sessions (id, campaign_id, role_id, title, status) VALUES (?, ?, ?, ?, ?)
`).run(sessionProver, campaignId, 'role-prover', '显式公式引理草稿', 'running');

const insertMsg = db.prepare(`
  INSERT INTO messages (id, session_id, role_id, sender, content, message_type)
  VALUES (?, ?, ?, ?, ?, ?)
`);

insertMsg.run(
  uuid(),
  sessionExplorer,
  'role-explorer',
  'Explorer',
  `## Landscape
Riemann Hypothesis reconnaissance sample for MRS demo.

### Attack Angles
1. Hilbert–Pólya spectral
2. Random matrix heuristics
3. Explicit formula positivity

### Next Experiments
- Formalize Weil criterion sketch
- Critic stress-test angle #1`,
  'analysis'
);

insertMsg.run(
  uuid(),
  sessionProver,
  'role-prover',
  'Prover',
  `## Target Lemma (draft)
Classical zero-free region shape. [GAP] constants.

### Status
Demo proof_draft for MRS pipeline.`,
  'proof_draft'
);

// Campaign for 100-circle flagship
const n100Id = problemIds['unit-disk-100-circle-covering'];
if (n100Id) {
  const c100 = uuid();
  db.prepare(`
    INSERT INTO campaigns (id, problem_id, title, status, strategy, progress, notes)
    VALUES (?, ?, ?, 'active', ?, 5, ?)
  `).run(
    c100,
    n100Id,
    '100 圆覆盖 · 四要件攻坚',
    '数值纪录与接触图 → 代数半径 → 连续统覆盖证书 → 无对称全局下界；禁止偷运对称假设。',
    '旗舰挑战战役'
  );
  const defs = [
    'Explorer：数值纪录与接触图分类',
    'Historian：覆盖文献与失败路径',
    'Prover：固定组合型代数系统',
    'Critic：有限点覆盖与对称假设审计',
    'Formalizer：覆盖分区 Lean 骨架',
    'Synthesizer：四要件态势与 pivot',
  ];
  defs.forEach((t, i) => {
    insertMs.run(uuid(), c100, t, null, i === 0 ? 'active' : 'pending', i + 1, null);
  });
}

db.prepare(`
  INSERT INTO artifacts (id, problem_id, campaign_id, kind, title, content, status)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`).run(
  uuid(),
  rhId,
  campaignId,
  'strategy_doc',
  'RH 战役策略 v0.1',
  '# RH Attack Strategy v0.1\n\nDemo artifact.',
  'active'
);

const litInsert = db.prepare(`
  INSERT INTO literature (id, problem_id, title, authors, year, venue, url, abstract, notes, relevance)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
litInsert.run(uuid(), rhId, 'The Theory of the Riemann Zeta-function', 'Titchmarsh', 1986, 'OUP', null, null, '基线参考', 5);
if (n100Id) {
  litInsert.run(uuid(), n100Id, 'The number of circles covering a set', 'Kershner', 1939, null, null, null, '经典覆盖', 5);
}

const logInsert = db.prepare(`
  INSERT INTO activity_log (id, entity_type, entity_id, action, detail) VALUES (?, ?, ?, ?, ?)
`);
logInsert.run(uuid(), 'system', 'mrs', 'seed', 'Seed problems, roles, RH + n100 campaigns');

// Export knowledge markdown mirrors
const knowledgeDir = path.join(__dirname, '../../knowledge/problems');
fs.mkdirSync(knowledgeDir, { recursive: true });

for (const p of problems) {
  const outPath = path.join(knowledgeDir, `${p.slug}.md`);
  if (fs.existsSync(outPath)) {
    const existing = fs.readFileSync(outPath, 'utf8');
    if (existing.includes('MRS 旗舰挑战题') || existing.includes('source_image:')) {
      continue;
    }
  }
  const md = `---
slug: ${p.slug}
title: ${p.title}
title_zh: ${p.title_zh}
field: ${p.field}
subfield: ${p.subfield}
status: ${p.status}
difficulty: ${p.difficulty}
millennium: ${p.millennium}
priority: ${p.priority}
tags: [${p.tags.join(', ')}]
---

# ${p.title_zh} / ${p.title}

## 摘要
${p.summary_zh}

${p.summary}

## 形式陈述
\`\`\`
${p.formal_statement}
\`\`\`

## 已知部分结果
${p.known_partial}

## 关键障碍
${p.key_obstacles}

## 参考文献
${p.references.map((r: { title: string; year: number }) => `- ${r.title} (${r.year})`).join('\n')}
`;
  fs.writeFileSync(outPath, md);
}

console.log(`✅ Seeded ${problems.length} problems, ${roles.length} roles`);
console.log(`   DB: ${path.join(dataDir, 'mrs.db')}`);
console.log(`   Knowledge mirrors: ${knowledgeDir}`);
