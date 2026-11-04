const assert = require('assert');
const C = require('./load.js');
const { FACES3, PERMS3, applyMove3, SOLVED3, validate3, analyze3, STEPS3, ROT_GRID, toFaceletString, isSolved3 } = C;
const rnd = (n) => Math.floor(Math.random() * n);
const MOVES = Object.keys(PERMS3);
let Cube = null;
try { Cube = require('cubejs'); } catch (e) { console.log('core3: cubejs not installed (npm install), skipping solver checks'); }

const scramble = () => { let s = SOLVED3; for (let i = 0; i < 30; i++) s = applyMove3(s, MOVES[rnd(18)]); return s; };
const entryOf = (s) => STEPS3.map((face) => { const f = FACES3.indexOf(face); return [...s.slice(f * 9, f * 9 + 9)]; });

if (Cube) {
  // The page's turn conventions must match cubejs exactly (same facelet order, same directions).
  for (let t = 0; t < 100; t++) {
    const seq = Array.from({ length: 25 }, () => MOVES[rnd(18)]);
    let s = SOLVED3; for (const m of seq) s = applyMove3(s, m);
    const c = new Cube(); c.move(seq.join(' '));
    assert.strictEqual(toFaceletString(s), c.asString(), 'turn conventions differ from cubejs');
  }
  Cube.initSolver();
  for (let t = 0; t < 15; t++) {
    const s = scramble();
    const moves = Cube.fromString(toFaceletString(s)).solve().trim().split(/\s+/);
    let x = s; for (const m of moves) x = applyMove3(x, m);
    assert(isSolved3(x), 'cubejs solution should solve the cube under the page\'s own turns');
    assert(moves.length <= 22);
  }
}
let turnedFixed = 0;
for (let t = 0; t < 150; t++) {
  const s = scramble();
  assert(validate3(s).ok, 'real states must validate');
  const e = entryOf(s);
  const a = analyze3(e);
  assert(a.ok && a.state === s, 'clean entry should read back exactly');
  // One side copied while held a quarter turn off gets fixed automatically.
  const k = rnd(6), e2 = e.map((r) => r.slice());
  e2[k] = ROT_GRID[1 + rnd(3)].map((i) => e[k][i]);
  const b = analyze3(e2);
  if (b.ok && b.state === s) turnedFixed++;
  // One wrong square is always caught and pinpointed.
  const e3 = e.map((r) => r.slice());
  let c = rnd(9); if (c === 4) c = 0;
  const orig = e3[k][c]; e3[k][c] = ['W', 'Y', 'R', 'O', 'B', 'G'].filter((x) => x !== orig)[rnd(5)];
  const d = analyze3(e3);
  assert(!d.ok && d.fixes.some((f) => f.k === k && f.c === c), 'the wrong square must be suggested');
}
assert(turnedFixed >= 147, 'turned sides fixed: ' + turnedFixed + '/150 (a few can be genuinely ambiguous)');
console.log('core3: ok (turned sides fixed ' + turnedFixed + '/150)');

// A solid face (say, a finished white side) must not stop the turned-side fix. Rotating a solid
// face gives the same state again, and that used to count as a second, "ambiguous" hit.
{
  const s = applyMove3(SOLVED3, 'D2');
  const e = entryOf(s);
  e[0] = ROT_GRID[1].map((i) => e[0][i]);
  const a = analyze3(e);
  assert(a.ok && a.state === s && a.turned.join() === '0', 'a turned side next to a solid face must be fixed');
}
console.log('core3: ok (turned side next to a solid face fixed)');
