// Loads the app's source modules into Node for testing. The modules are plain top-level
// declarations (no exports), exactly as they're inlined into index.html, so they're run
// inside a function body and the names tests need are returned.
const fs = require('fs');
const path = require('path');
const src = (n) => fs.readFileSync(path.join(__dirname, '..', 'src', n), 'utf8');
const code = src('core2.js') + src('core3.js') + src('colorread.js') + `
return { POS, FACE_CELLS, MOVES, applyMove, analyze, deduce, solve, goalFor, isSolved, COLORS, SIDE_ORDERS, refFace,
  FACES3, CENTER3, PERMS3, applyMove3, SOLVED3, validate3, analyze3, build3, STEPS3, ROT_GRID, toFaceletString, isSolved3,
  hsvOf, readFace, findFace };`;
module.exports = new Function(code)();
