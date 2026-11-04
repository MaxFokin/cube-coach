// ===== 2x2 cube core: model, deduction from 4 sides, validation, optimal solver =====
// Coordinates: x right, y up, z toward the viewer. Sticker index = cornerIndex * 3 + axis.
const POS = [];
for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) POS.push([x, y, z]);
const posIndex = (p) => POS.findIndex((q) => q[0] === p[0] && q[1] === p[1] && q[2] === p[2]);
const sIdx = (p, ax) => posIndex(p) * 3 + ax;

const ROT = {
  R: ([x, y, z]) => [x, z, -y],
  U: ([x, y, z]) => [-z, y, x],
  F: ([x, y, z]) => [y, -x, z],
};
const LAYER_AX = { R: 0, U: 1, F: 2 };

function basePerm(m) {
  const perm = Array.from({ length: 24 }, (_, i) => i);
  for (let i = 0; i < 24; i++) {
    const p = POS[Math.floor(i / 3)];
    const ax = i % 3;
    if (p[LAYER_AX[m]] !== 1) continue;
    const n = [0, 0, 0];
    n[ax] = p[ax];
    const np = ROT[m](p);
    const nn = ROT[m](n);
    const nax = nn.findIndex((v) => v !== 0);
    perm[sIdx(np, nax)] = i;
  }
  return perm;
}
const compose = (p, q) => q.map((j) => p[j]);
const PERMS = {};
for (const m of ['R', 'U', 'F']) {
  const p1 = basePerm(m);
  const p2 = compose(p1, p1);
  const p3 = compose(p2, p1);
  PERMS[m] = p1;
  PERMS[m + '2'] = p2;
  PERMS[m + "'"] = p3;
}
const MOVES = Object.keys(PERMS);
function applyMove(s, m) {
  const p = PERMS[m];
  let o = '';
  for (let j = 0; j < 24; j++) o += s[p[j]];
  return o;
}
const invMove = (m) => (m.length === 1 ? m + "'" : m[1] === "'" ? m[0] : m);

// Face cells in reading order TL, TR, BL, BR, as seen from outside.
// Side faces are seen with the top up; U is seen from above with F at the bottom;
// D is seen with the top tipped away, so F is at the top.
const FACE_CELLS = {
  F: [[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([x, y]) => sIdx([x, y, 1], 2)),
  R: [[1, 1], [-1, 1], [1, -1], [-1, -1]].map(([z, y]) => sIdx([1, y, z], 0)),
  B: [[1, 1], [-1, 1], [1, -1], [-1, -1]].map(([x, y]) => sIdx([x, y, -1], 2)),
  L: [[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([z, y]) => sIdx([-1, y, z], 0)),
  U: [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z]) => sIdx([x, 1, z], 1)),
  D: [[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([x, z]) => sIdx([x, -1, z], 1)),
};

const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
// For each corner: its sticker axes in clockwise order (seen from outside), starting with the up/down sticker.
const CW = POS.map((p) => {
  const second = dot(cross([0, p[1], 0], [p[0], 0, 0]), p) < 0 ? 0 : 2;
  return [1, second, second === 0 ? 2 : 0];
});

// Standard color scheme: white opposite yellow, green opposite blue, red opposite orange.
const COLORS = ['W', 'Y', 'R', 'O', 'B', 'G'];
const OPP = { W: 'Y', Y: 'W', G: 'B', B: 'G', R: 'O', O: 'R' };
const refFace = (ax, sign) =>
  ax === 1 ? (sign > 0 ? 'W' : 'Y') : ax === 2 ? (sign > 0 ? 'G' : 'B') : sign > 0 ? 'R' : 'O';
const REF_PIECES = POS.map((p, pi) => CW[pi].map((ax) => refFace(ax, p[ax])).join(''));

// Which faces the kid's sides 1-4 are: turning the cube left (as instructed) or right (common slip).
const SIDE_ORDERS = { left: ['F', 'R', 'B', 'L'], right: ['F', 'L', 'B', 'R'] };

// Sticker index -> { k: side number 0-3, c: cell 0-3 } for the instructed (left) order.
const CELL_OF = {};
SIDE_ORDERS.left.forEach((face, k) => FACE_CELLS[face].forEach((si, c) => { CELL_OF[si] = { k, c }; }));

// Deduce the whole cube from the 4 side faces. entry[k][c] = color letter.
function deduce(entry, order) {
  const s = new Array(24).fill(null);
  SIDE_ORDERS[order].forEach((face, k) => FACE_CELLS[face].forEach((si, c) => { s[si] = entry[k][c]; }));
  const pieces = [];
  let twist = 0;
  for (let pi = 0; pi < 8; pi++) {
    const axes = CW[pi];
    const k1 = s[pi * 3 + axes[1]];
    const k2 = s[pi * 3 + axes[2]];
    let found = null;
    for (const r of REF_PIECES) {
      for (let k = 0; k < 3; k++) {
        const rot = r.slice(k) + r.slice(0, k);
        if (rot[1] === k1 && rot[2] === k2) found = rot;
      }
    }
    if (!found) {
      return { ok: false, type: 'corner', cells: [pi * 3 + axes[1], pi * 3 + axes[2]], colors: [k1, k2] };
    }
    s[pi * 3 + axes[0]] = found[0];
    pieces.push({ pi, rot: found });
    twist += [...found].findIndex((c) => c === 'W' || c === 'Y');
  }
  const seen = {};
  for (const { pi, rot } of pieces) {
    const key = [...rot].sort().join('');
    if (seen[key] !== undefined) {
      const a = seen[key];
      return {
        ok: false, type: 'duplicate', colors: [...rot],
        cells: [a * 3 + CW[a][1], a * 3 + CW[a][2], pi * 3 + CW[pi][1], pi * 3 + CW[pi][2]],
      };
    }
    seen[key] = pi;
  }
  if (twist % 3 !== 0) return { ok: false, type: 'twist' };
  return { ok: true, state: s.join('') };
}

// Full check: instructed order first, then the "turned right by mistake" order,
// then look for a single square that, changed, makes everything fit.
function analyze(entry) {
  const a = deduce(entry, 'left');
  if (a.ok) return { ok: true, state: a.state, order: 'left' };
  const b = deduce(entry, 'right');
  if (b.ok) return { ok: true, state: b.state, order: 'right' };
  const fixes = [];
  for (let k = 0; k < 4; k++) {
    for (let c = 0; c < 4; c++) {
      for (const col of COLORS) {
        if (col === entry[k][c]) continue;
        const e2 = entry.map((r) => r.slice());
        e2[k][c] = col;
        if (deduce(e2, 'left').ok || deduce(e2, 'right').ok) fixes.push({ k, c, from: entry[k][c], to: col });
      }
    }
  }
  const error = { ...a };
  if (error.cells) error.where = error.cells.map((si) => CELL_OF[si]);
  return { ok: false, error, fixes };
}

// Solved state that keeps the back-bottom-left corner where it is (R, U, F never move it).
function goalFor(state) {
  const cL = state[0], cD = state[1], cB = state[2];
  let g = '';
  for (let i = 0; i < 24; i++) {
    const sign = POS[Math.floor(i / 3)][i % 3];
    const ax = i % 3;
    const base = ax === 0 ? cL : ax === 1 ? cD : cB;
    g += sign < 0 ? base : OPP[base];
  }
  return g;
}

// Optimal solution (fewest turns) with a two-sided breadth-first search.
function solve(start) {
  const goal = goalFor(start);
  if (start === goal) return [];
  const fwd = new Map([[start, null]]);
  const bwd = new Map([[goal, null]]);
  let ff = [start];
  let bf = [goal];
  const build = (t) => {
    const path = [];
    let s = t;
    while (fwd.get(s)) { const [p, m] = fwd.get(s); path.push(m); s = p; }
    path.reverse();
    s = t;
    while (bwd.get(s)) { const [p, m] = bwd.get(s); path.push(invMove(m)); s = p; }
    return path;
  };
  for (let depth = 0; depth < 16; depth++) {
    if (ff.length <= bf.length) {
      const nf = [];
      for (const s of ff) for (const m of MOVES) {
        const t = applyMove(s, m);
        if (!fwd.has(t)) { fwd.set(t, [s, m]); nf.push(t); if (bwd.has(t)) return build(t); }
      }
      ff = nf;
    } else {
      const nf = [];
      for (const s of bf) for (const m of MOVES) {
        const t = applyMove(s, m);
        if (!bwd.has(t)) { bwd.set(t, [s, m]); nf.push(t); if (fwd.has(t)) return build(t); }
      }
      bf = nf;
    }
  }
  return null;
}

const isSolved = (s) =>
  Object.values(FACE_CELLS).every((cells) => cells.every((i) => s[i] === s[cells[0]]));


