/**
 * Honest numerical upper-bound tools for equal-circle covering of the unit disk.
 * NEVER promotes results to theorems. Labels are explicit: numerical_upper_bound only.
 */

export type CoveringEval = {
  kind: 'numerical_upper_bound';
  disclaimer: string;
  n: number;
  mode: string;
  radius: number;
  centers: { x: number; y: number }[];
  sample_max_min_dist: number;
  grid: number;
  notes: string[];
};

const DISCLAIMER =
  'NUMERICAL UPPER BOUND ONLY. Finite sampling / constructive layout does NOT prove ' +
  'continuum covering, does NOT give exact algebraic r_D(n), and does NOT prove global optimality. ' +
  'Must not be recorded as a completed four-requirement solution.';

function dist2(ax: number, ay: number, bx: number, by: number) {
  const dx = ax - bx;
  const dy = ay - by;
  return Math.sqrt(dx * dx + dy * dy);
}

/** Evaluate max over grid samples in unit disk of min distance to centers (approx R_D). */
export function approxCoverageRadius(
  centers: { x: number; y: number }[],
  grid = 81
): number {
  let worst = 0;
  const step = 2 / (grid - 1);
  for (let i = 0; i < grid; i++) {
    for (let j = 0; j < grid; j++) {
      const x = -1 + i * step;
      const y = -1 + j * step;
      if (x * x + y * y > 1 + 1e-12) continue;
      let best = Infinity;
      for (const c of centers) {
        const d = dist2(x, y, c.x, c.y);
        if (d < best) best = d;
      }
      if (best > worst) worst = best;
    }
  }
  // also check boundary angles
  for (let k = 0; k < 360; k++) {
    const th = (k * Math.PI) / 180;
    const x = Math.cos(th);
    const y = Math.sin(th);
    let best = Infinity;
    for (const c of centers) {
      const d = dist2(x, y, c.x, c.y);
      if (d < best) best = d;
    }
    if (best > worst) worst = best;
  }
  return worst;
}

/** Polar rings layout: 1 + sum ring counts ≈ n */
export function ringLayout(n: number): { x: number; y: number }[] {
  if (n <= 0) return [];
  if (n === 1) return [{ x: 0, y: 0 }];
  const centers: { x: number; y: number }[] = [{ x: 0, y: 0 }];
  let remaining = n - 1;
  let ring = 1;
  while (remaining > 0) {
    const capacity = Math.min(remaining, 6 * ring);
    const r = ring / (ring + 1); // stay inside unit disk
    for (let i = 0; i < capacity; i++) {
      const th = (2 * Math.PI * i) / capacity + (ring % 2 === 0 ? 0 : Math.PI / capacity);
      centers.push({ x: r * Math.cos(th), y: r * Math.sin(th) });
    }
    remaining -= capacity;
    ring++;
  }
  return centers.slice(0, n);
}

/** Square lattice points clipped/scaled into unit disk, take n closest to origin. */
export function latticeLayout(n: number, spacing = 0.22): { x: number; y: number }[] {
  const pts: { x: number; y: number; r: number }[] = [];
  const lim = 1.2;
  for (let ix = -20; ix <= 20; ix++) {
    for (let iy = -20; iy <= 20; iy++) {
      const x = ix * spacing;
      const y = iy * spacing;
      const r = Math.sqrt(x * x + y * y);
      if (r <= lim) pts.push({ x, y, r });
    }
  }
  pts.sort((a, b) => a.r - b.r);
  const chosen = pts.slice(0, n).map((p) => ({ x: p.x, y: p.y }));
  // scale to keep all centers inside disk with margin
  let maxR = 0;
  for (const c of chosen) maxR = Math.max(maxR, Math.sqrt(c.x * c.x + c.y * c.y));
  const scale = maxR > 0.85 ? 0.85 / maxR : 1;
  return chosen.map((c) => ({ x: c.x * scale, y: c.y * scale }));
}

export function evaluateCovering(opts: {
  n?: number;
  mode?: 'rings' | 'lattice' | 'custom';
  centers?: { x: number; y: number }[];
  grid?: number;
  spacing?: number;
}): CoveringEval {
  const n = opts.n ?? opts.centers?.length ?? 100;
  const mode = opts.mode || (opts.centers ? 'custom' : 'rings');
  const grid = Math.min(Math.max(opts.grid ?? 81, 21), 201);
  let centers =
    opts.centers ||
    (mode === 'lattice' ? latticeLayout(n, opts.spacing ?? 0.2) : ringLayout(n));
  if (centers.length > n) centers = centers.slice(0, n);
  if (centers.length < n && mode !== 'custom') {
    // pad with ring layout leftovers
    const extra = ringLayout(n);
    centers = centers.concat(extra).slice(0, n);
  }

  const sample = approxCoverageRadius(centers, grid);
  // slight safety bump so we report a conservative numerical upper bound on the sample metric
  const radius = sample * 1.001;

  return {
    kind: 'numerical_upper_bound',
    disclaimer: DISCLAIMER,
    n: centers.length,
    mode,
    radius,
    centers,
    sample_max_min_dist: sample,
    grid,
    notes: [
      `Sampled ~grid ${grid}² interior + 360 boundary angles.`,
      `Reported radius is constructive sample-based estimate for this layout only.`,
      `NOT a proof of ∀x∈D covering; NOT r_D(${centers.length}) exact value; NOT global optimum.`,
      `For MRS four-requirement completion this counts at most as exploratory L1 evidence.`,
    ],
  };
}
