// ===== 3x3 cube core =====
// Facelets in Kociemba order: U, R, F, D, L, B; each face read row by row as seen from outside
// (U with the back at the top, D with the front at the top, side faces with U at the top).
const FACES3 = ['U', 'R', 'F', 'D', 'L', 'B'];
const CENTER3 = { U: 'W', R: 'R', F: 'G', D: 'Y', L: 'O', B: 'B' };
function cell3(face, r, c) {
  switch (face) {
    case 'U': return { pos: [c - 1, 1, r - 1], n: [0, 1, 0] };
    case 'R': return { pos: [1, 1 - r, 1 - c], n: [1, 0, 0] };
    case 'F': return { pos: [c - 1, 1 - r, 1], n: [0, 0, 1] };
    case 'D': return { pos: [c - 1, -1, 1 - r], n: [0, -1, 0] };
    case 'L': return { pos: [-1, 1 - r, c - 1], n: [-1, 0, 0] };
    default: return { pos: [1 - c, 1 - r, -1], n: [0, 0, -1] };
  }
}
const F3 = [];
FACES3.forEach((face) => { for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) F3.push(cell3(face, r, c)); });
const key3 = (p, n) => p.join(',') + '|' + n.join(',');
const IDX3 = new Map(F3.map((s, i) => [key3(s.pos, s.n), i]));
const axisOf = (n) => n.findIndex((v) => v !== 0);

const ROT3 = {
  R: ([x, y, z]) => [x, z, -y],
  L: ([x, y, z]) => [x, -z, y],
  U: ([x, y, z]) => [-z, y, x],
  D: ([x, y, z]) => [z, y, -x],
  F: ([x, y, z]) => [y, -x, z],
  B: ([x, y, z]) => [-y, x, z],
};
const LAYER3 = { R: [0, 1], L: [0, -1], U: [1, 1], D: [1, -1], F: [2, 1], B: [2, -1] };
function perm3(m) {
  const [ax, sign] = LAYER3[m];
  const perm = Array.from({ length: 54 }, (_, i) => i);
  F3.forEach((s, i) => {
    if (s.pos[ax] !== sign) return;
    perm[IDX3.get(key3(ROT3[m](s.pos), ROT3[m](s.n)))] = i;
  });
  return perm;
}
const PERMS3 = {};
for (const m of FACES3) {
  const p1 = perm3(m), p2 = p1.map((j) => p1[j]), p3 = p1.map((j) => p2[j]);
  PERMS3[m] = p1; PERMS3[m + '2'] = p2; PERMS3[m + "'"] = p3;
}
function applyMove3(s, m) {
  const p = PERMS3[m];
  let o = '';
  for (let j = 0; j < 54; j++) o += s[p[j]];
  return o;
}
const SOLVED3 = FACES3.map((f) => CENTER3[f].repeat(9)).join('');

// Pieces: corners (stickers clockwise from the up/down sticker) and edges (main sticker first).
const PIECES3 = (() => {
  const groups = new Map();
  F3.forEach((s, i) => {
    const k = s.pos.join(',');
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(i);
  });
  const corners = [], edges = [];
  for (const [k, idxs] of groups) {
    const pos = k.split(',').map(Number);
    const byAx = {};
    idxs.forEach((i) => { byAx[axisOf(F3[i].n)] = i; });
    const nz = pos.filter((v) => v !== 0).length;
    if (nz === 3) {
      const second = dot(cross([0, pos[1], 0], [pos[0], 0, 0]), pos) < 0 ? 0 : 2;
      corners.push([byAx[1], byAx[second], byAx[second === 0 ? 2 : 0]]);
    } else if (nz === 2) {
      edges.push(byAx[1] !== undefined ? [byAx[1], byAx[0] !== undefined ? byAx[0] : byAx[2]] : [byAx[2], byAx[0]]);
    }
  }
  return { corners, edges };
})();
const REF_C = PIECES3.corners.map((ix) => ix.map((i) => SOLVED3[i]).join(''));
const REF_E = PIECES3.edges.map((ix) => ix.map((i) => SOLVED3[i]).join(''));

function permParity(perm) {
  const seen = new Array(perm.length).fill(false);
  let p = 0;
  for (let i = 0; i < perm.length; i++) {
    if (seen[i]) continue;
    let j = i, len = 0;
    while (!seen[j]) { seen[j] = true; j = perm[j]; len++; }
    p += len - 1;
  }
  return p % 2;
}

// Is this a real, solvable 3x3 state? Returns the stickers involved when it isn't.
function validate3(s) {
  for (let f = 0; f < 6; f++) if (s[f * 9 + 4] !== CENTER3[FACES3[f]]) return { ok: false, type: 'centers' };
  const cPerm = [], ePerm = [], seenC = {}, seenE = {};
  let twist = 0, flip = 0;
  for (let k = 0; k < 8; k++) {
    const ix = PIECES3.corners[k];
    const cols = ix.map((i) => s[i]).join('');
    let found = -1;
    for (let p = 0; p < 8 && found < 0; p++) {
      const r = REF_C[p];
      for (let t = 0; t < 3; t++) if (r.slice(t) + r.slice(0, t) === cols) { found = p; break; }
    }
    if (found < 0) return { ok: false, type: 'piece', idxs: ix };
    if (seenC[found] !== undefined) return { ok: false, type: 'duplicate', idxs: [...PIECES3.corners[seenC[found]], ...ix] };
    seenC[found] = k;
    cPerm.push(found);
    twist += [...cols].findIndex((c) => c === 'W' || c === 'Y');
  }
  for (let k = 0; k < 12; k++) {
    const ix = PIECES3.edges[k];
    const a = s[ix[0]], b = s[ix[1]];
    let found = -1, fl = 0;
    for (let p = 0; p < 12; p++) {
      if (REF_E[p] === a + b) { found = p; fl = 0; break; }
      if (REF_E[p] === b + a) { found = p; fl = 1; break; }
    }
    if (found < 0) return { ok: false, type: 'piece', idxs: ix };
    if (seenE[found] !== undefined) return { ok: false, type: 'duplicate', idxs: [...PIECES3.edges[seenE[found]], ...ix] };
    seenE[found] = k;
    ePerm.push(found);
    flip += fl;
  }
  if (twist % 3 !== 0) return { ok: false, type: 'twist' };
  if (flip % 2 !== 0) return { ok: false, type: 'flip' };
  if (permParity(cPerm) !== permParity(ePerm)) return { ok: false, type: 'parity' };
  return { ok: true };
}

// The kid copies faces in this order, guided by the center colors.
const STEPS3 = ['F', 'R', 'B', 'L', 'U', 'D'];
const ROT_GRID = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8],
  [6, 3, 0, 7, 4, 1, 8, 5, 2],
  [8, 7, 6, 5, 4, 3, 2, 1, 0],
  [2, 5, 8, 1, 4, 7, 0, 3, 6],
];
// entry[k] = 9 colors of face STEPS3[k], as the kid saw it. rots[k] = quarter turns to apply.
function build3(entry, rots) {
  const s = new Array(54);
  STEPS3.forEach((face, k) => {
    const f = FACES3.indexOf(face);
    const rot = ROT_GRID[rots ? rots[k] : 0];
    for (let i = 0; i < 9; i++) s[f * 9 + i] = entry[k][rot[i]];
  });
  return s.join('');
}
// Sticker index -> { k: step, c: cell } as the kid entered it.
const CELL3_OF = {};
STEPS3.forEach((face, k) => { const f = FACES3.indexOf(face); for (let c = 0; c < 9; c++) CELL3_OF[f * 9 + c] = { k, c }; });

function analyze3(entry) {
  const s = build3(entry);
  const v = validate3(s);
  if (v.ok) return { ok: true, state: s, turned: [] };
  // A face copied while held the wrong way round? Try every combination of quarter turns of the
  // copied faces. Hits are counted by cube, not by combination (turning a solid face changes
  // nothing), and the cube reached with the fewest turned faces wins unless two cubes tie
  // (a nearly solved cube also reads as another valid cube with all four sides turned 180).
  const hits = new Map();
  for (let code = 1; code < 4096; code++) {
    const rots = [0, 1, 2, 3, 4, 5].map((k) => (code >> (2 * k)) & 3);
    const t = build3(entry, rots);
    if (!validate3(t).ok) continue;
    const n = rots.filter(Boolean).length, h = hits.get(t);
    if (!h || n < h.n) hits.set(t, { rots, n });
  }
  const best = [...hits.entries()].sort((a, b) => a[1].n - b[1].n);
  if (best.length === 1 || (best.length > 1 && best[0][1].n < best[1][1].n)) {
    const [state, { rots }] = best[0];
    return { ok: true, state, turned: rots.map((r, k) => (r ? k : -1)).filter((k) => k >= 0) };
  }
  // A single square copied wrong?
  const fixes = [];
  for (let k = 0; k < 6; k++) {
    for (let c = 0; c < 9; c++) {
      if (c === 4) continue;
      for (const col of ['W', 'Y', 'R', 'O', 'B', 'G']) {
        if (col === entry[k][c]) continue;
        const e2 = entry.map((r) => r.slice());
        e2[k][c] = col;
        if (validate3(build3(e2)).ok) fixes.push({ k, c, from: entry[k][c], to: col });
      }
    }
  }
  const error = { ...v };
  if (error.idxs) error.where = error.idxs.map((i) => CELL3_OF[i]);
  return { ok: false, error, fixes };
}

// cubejs wants face letters, not colors.
const COLOR_TO_FACE = { W: 'U', R: 'R', G: 'F', Y: 'D', O: 'L', B: 'B' };
const toFaceletString = (s) => [...s].map((c) => COLOR_TO_FACE[c]).join('');
const isSolved3 = (s) => FACES3.every((_, f) => s.slice(f * 9, f * 9 + 9).split('').every((c) => c === s[f * 9 + 4]));


