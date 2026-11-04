const assert = require('assert');
const C = require('./load.js');
const { POS, FACE_CELLS, MOVES, applyMove, analyze, solve, isSolved, SIDE_ORDERS, COLORS, refFace } = C;
const rnd = (n) => Math.floor(Math.random() * n);
const show = (s) => ['F', 'R', 'B', 'L', 'U', 'D'].map((f) => f + ':' + FACE_CELLS[f].map((i) => s[i]).join('')).join(' ');

// The cube from the original photos: known answer.
const maxEntry = [['W', 'G', 'Y', 'O'], ['W', 'B', 'Y', 'G'], ['W', 'B', 'R', 'B'], ['O', 'R', 'Y', 'G']];
const a = analyze(maxEntry);
assert(a.ok && a.order === 'left', 'photo cube should read cleanly');
assert.strictEqual(show(a.state), 'F:WGYO R:WBYG B:WBRB L:ORYG U:WRGO D:OBRY');
assert.strictEqual(solve(a.state).join(' '), "U' R' F R U2 R2 U F' U");

// Whole-cube rotations, so random tests cover every way of holding the cube.
const rotAll = { x: ([x, y, z]) => [x, z, -y], y: ([x, y, z]) => [-z, y, x], z: ([x, y, z]) => [y, -x, z] };
const idxOf = (p, ax) => POS.findIndex((q) => q.every((v, i) => v === p[i])) * 3 + ax;
function rotateCube(st, r) {
  const out = new Array(24);
  for (let i = 0; i < 24; i++) {
    const p = POS[Math.floor(i / 3)], ax = i % 3, n = [0, 0, 0]; n[ax] = p[ax];
    const np = rotAll[r](p), nn = rotAll[r](n);
    out[idxOf(np, nn.findIndex((v) => v !== 0))] = st[i];
  }
  return out.join('');
}
const solved = Array.from({ length: 24 }, (_, i) => refFace(i % 3, POS[Math.floor(i / 3)][i % 3])).join('');
const entryFrom = (st, order) => SIDE_ORDERS[order].map((f) => FACE_CELLS[f].map((i) => st[i]));

let maxLen = 0;
for (let t = 0; t < 200; t++) {
  let st = solved;
  for (let i = 0; i < 25; i++) st = applyMove(st, MOVES[rnd(9)]);
  for (let i = 0; i < 6; i++) st = rotateCube(st, 'xyz'[rnd(3)]);
  const r = analyze(entryFrom(st, 'left'));
  assert(r.ok && r.state === st, 'four sides should give back the whole cube');
  assert(analyze(entryFrom(st, 'right')).ok, 'turning right instead of left should still work');
  const sol = solve(st);
  let x = st; for (const m of sol) x = applyMove(x, m);
  assert(isSolved(x), 'solution should solve the cube');
  maxLen = Math.max(maxLen, sol.length);
  // One wrong square is always caught, and the true square is always among the suggestions.
  const e = entryFrom(st, 'left'); const k = rnd(4), c = rnd(4);
  const orig = e[k][c]; e[k][c] = COLORS.filter((x) => x !== orig)[rnd(5)];
  const bad = analyze(e);
  assert(!bad.ok, 'one wrong square must be detected');
  assert(bad.fixes.some((f) => f.k === k && f.c === c), 'the wrong square must be suggested');
}
assert(maxLen <= 11, 'solutions should be optimal (at most 11 turns)');
console.log('core2: ok (200 random cubes, longest solution ' + maxLen + ')');
