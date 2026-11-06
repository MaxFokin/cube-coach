// The flat view of a turn: which side the child looks at, which layer moves and which way, checked
// against the cube models: on that side only the layer moves, and it really slides off that way.
const assert = require('assert');
const { flatTurn, faceCells, layerCells, FACE_CELLS, FACES3, PERMS, PERMS3, applyMove, SOLVED3, analyze } = require('./load.js');
const MAX = [['W', 'G', 'Y', 'O'], ['W', 'B', 'Y', 'G'], ['W', 'B', 'R', 'B'], ['O', 'R', 'Y', 'G']];
const ST2 = analyze(MAX).state;

// The table, for both cubes: the front for every turn but the back layer's, which shows the top.
for (const N of [2, 3]) {
  const want = {
    R: ['F', 'col', N - 1, 'up'], "R'": ['F', 'col', N - 1, 'down'], L: ['F', 'col', 0, 'down'], "L'": ['F', 'col', 0, 'up'],
    U: ['F', 'row', 0, 'left'], "U'": ['F', 'row', 0, 'right'], D: ['F', 'row', N - 1, 'right'], "D'": ['F', 'row', N - 1, 'left'],
    F: ['F', 'face', 0, 'cw'], "F'": ['F', 'face', 0, 'ccw'], B: ['U', 'row', 0, 'left'], "B'": ['U', 'row', 0, 'right'],
  };
  for (const [m, [face, kind, index, dir]] of Object.entries(want)) {
    assert.deepStrictEqual(flatTurn(m, N), { face, kind, index, dir, twice: false }, `${m} on the ${N}x${N}`);
  }
  for (const f of 'RLUDFB') assert.deepStrictEqual(flatTurn(f + '2', N), { ...flatTurn(f, N), twice: true }, `${f}2 is ${f} twice`);
}

// The stickers of a side, row by row as the child sees it, and the cells along the moving layer.
assert.deepStrictEqual(faceCells(ST2, 2, 'F'), ['W', 'G', 'Y', 'O']);
assert.deepStrictEqual(faceCells(ST2, 2, 'U'), ['W', 'R', 'G', 'O']);
assert.deepStrictEqual(faceCells(SOLVED3, 3, 'F'), Array(9).fill('G'));
assert.deepStrictEqual(faceCells(SOLVED3, 3, 'U'), Array(9).fill('W'));
const idx9 = Array.from({ length: 9 }, (_, i) => i);
assert.deepStrictEqual(layerCells(idx9, 3, flatTurn('R', 3)), [2, 5, 8]);
assert.deepStrictEqual(layerCells(idx9, 3, flatTurn("L'", 3)), [0, 3, 6]);
assert.deepStrictEqual(layerCells(idx9, 3, flatTurn('U', 3)), [0, 1, 2]);
assert.deepStrictEqual(layerCells(idx9, 3, flatTurn('D2', 3)), [6, 7, 8]);
assert.deepStrictEqual(layerCells([0, 1, 2, 3], 2, flatTurn('R', 2)), [1, 3]);

// Against the models. A move's permutation p gives new[j] = old[p[j]], so sticker i lands at p.indexOf(i).
const faceIdx = (N, face) => (N === 2 ? FACE_CELLS[face] : idx9.map((i) => FACES3.indexOf(face) * 9 + i));
let checked = 0;
for (const N of [2, 3]) {
  for (const [m, p] of Object.entries(N === 2 ? PERMS : PERMS3)) {
    const turn = flatTurn(m, N), cells = faceIdx(N, turn.face), onFace = (i) => cells.includes(i), landsAt = (i) => p.indexOf(i);
    if (turn.kind === 'face') {
      assert(cells.every((i) => onFace(landsAt(i))), `${m}: the side turns in place`);
      const corner = turn.twice ? N * N - 1 : turn.dir === 'cw' ? N - 1 : N * (N - 1);
      assert.strictEqual(landsAt(cells[0]), cells[corner], `${m}: the top-left sticker goes ${turn.dir}`);
    } else {
      const layer = layerCells(cells, N, turn), far = ['up', 'left'].includes(turn.dir) ? 0 : N - 1, near = N - 1 - far;
      assert(cells.filter((i) => !layer.includes(i)).every((i) => landsAt(i) === i), `${m}: only the layer moves on the shown side`);
      assert(!onFace(landsAt(layer[far])), `${m}: the layer slides off the shown side, ${turn.dir}`);
      assert(!onFace(p[layer[near]]), `${m}: new stickers come in at the other end`);
    }
    checked++;
  }
}
// The front after a front turn is the front before, turned a quarter the way a clock goes.
const rotCW = (cells, N) => cells.map((_, i) => cells[(N - 1 - (i % N)) * N + Math.floor(i / N)]);
assert.deepStrictEqual(faceCells(applyMove(ST2, 'F'), 2, 'F'), rotCW(faceCells(ST2, 2, 'F'), 2));
assert.deepStrictEqual(faceCells(applyMove(ST2, "F'"), 2, 'F'), rotCW(rotCW(rotCW(faceCells(ST2, 2, 'F'), 2), 2), 2));
console.log(`flat: ok (${checked} moves checked against the models)`);
