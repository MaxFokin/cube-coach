// ===== The flat view of a turn: the side the child looks at, the layer that moves and which way =====
// Every turn is shown on the front, except the back layer's, which is shown on the top (its back
// row). Cells are listed row by row as the child sees the side. No DOM in this file.
const FLAT_TURNS = { R: ['col', -1, 'up'], L: ['col', 0, 'down'], U: ['row', 0, 'left'], D: ['row', -1, 'right'], F: ['face', 0, 'cw'], B: ['row', 0, 'left', 'U'] };
const FLIP = { up: 'down', down: 'up', left: 'right', right: 'left', cw: 'ccw', ccw: 'cw' };
function flatTurn(move, N) {
  const [kind, at, way, face = 'F'] = FLAT_TURNS[move[0]];
  return { face, kind, index: at < 0 ? N - 1 : at, dir: move[1] === "'" ? FLIP[way] : way, twice: move[1] === '2' };
}
// The N*N stickers of a side, from a 2x2 state (24 stickers) or a 3x3 state (54 facelets).
function faceCells(state, N, face) {
  if (N === 2) return FACE_CELLS[face].map((i) => state[i]);
  const start = FACES3.indexOf(face) * 9;
  return state.slice(start, start + 9).split('');
}
// The cells of the moving layer, top to bottom or left to right.
const layerCells = (cells, N, turn) => Array.from({ length: N }, (_, k) => (turn.kind === 'col' ? cells[k * N + turn.index] : cells[turn.index * N + k]));
