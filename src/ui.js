// ===== Look and words =====
const HEX = { W: '#F6F6F1', Y: '#FFD43B', R: '#D7263D', O: '#FF8A1E', B: '#1F6FEB', G: '#1FAD5C' };
const colorName = (c) => t('colorName', { color: c });
const PALETTE = ['W', 'Y', 'R', 'O', 'B', 'G'];
const cap = (s) => s[0].toUpperCase() + s.slice(1);
const reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
const SOLVED2 = Array.from({ length: 24 }, (_, i) => refFace(i % 3, POS[Math.floor(i / 3)][i % 3])).join('');
const SOLVER_URLS = [
  'https://cdn.jsdelivr.net/npm/cubejs@1.3.2/lib/cube.js',
  'https://cdn.jsdelivr.net/npm/cubejs@1.3.2/lib/solve.js',
];

const $ = (sel) => document.querySelector(sel);
const appEl = $('#app'), sceneEl = $('#scene'), spinnerEl = $('#spinner'), cubeEl = $('#cube'), flatEl = $('#flat'), panelEl = $('#panel'), restartBtn = $('#restart');

const empty2 = () => [0, 1, 2, 3].map(() => [null, null, null, null]);
const empty3 = () => STEPS3.map((face) => Array.from({ length: 9 }, (_, i) => (i === 4 ? CENTER3[face] : null)));
const app = {
  screen: 'welcome', cube: 2, side: 0, mode: 'first', entry: empty2(), entry3: empty3(), selected: 'W',
  analysis: null, solution: [], move: 0, flags: [], unsure: [], helpOpen: false, note: '',
};
const is3 = () => app.cube === 3;
const entryNow = () => (is3() ? app.entry3 : app.entry);
const sideCount = () => (is3() ? 6 : 4);
const faceColor3 = (k) => CENTER3[STEPS3[k]];

// ===== Cube models for the 3D stage =====
const POS3 = [];
for (const x of [-1, 0, 1]) for (const y of [-1, 0, 1]) for (const z of [-1, 0, 1]) if (x || y || z) POS3.push([x, y, z]);
const POS3_AT = new Map(POS3.map((p, i) => [p.join(','), i]));
const SLOT3 = F3.map((s) => [POS3_AT.get(s.pos.join(',')), axisOf(s.n)]);
const MODEL = {
  2: { N: 2, positions: POS, size: 24, slot: (i) => [Math.floor(i / 3), i % 3], apply: applyMove, moves: MOVES, solved: SOLVED2, layer: { R: [0, 1], U: [1, 1], F: [2, 1] } },
  3: { N: 3, positions: POS3, size: 54, slot: (i) => SLOT3[i], apply: applyMove3, moves: Object.keys(PERMS3), solved: SOLVED3, layer: LAYER3 },
};
let model = MODEL[2];

let S = 60, unit = 30, H = 60, cubies = [], shown = [];
const FACE_TF = { px: 'rotateY(90deg)', nx: 'rotateY(-90deg)', py: 'rotateX(90deg)', ny: 'rotateX(-90deg)', pz: 'rotateY(0deg)', nz: 'rotateY(180deg)' };
const computeS = () => Math.round(Math.max(44, Math.min(window.innerWidth * 0.15, window.innerHeight * 0.07, 74)));
const cubieTf = (ci) => { const p = model.positions[ci]; return `translate3d(${p[0] * unit}px, ${-p[1] * unit}px, ${p[2] * unit}px)`; };
const make = (cls) => { const el = document.createElement('div'); el.className = cls; return el; };

function buildCube() {
  const base = computeS();
  S = model.N === 2 ? base : Math.round(base * 2 / 3);
  unit = model.N === 2 ? S / 2 : S;
  H = (model.N * S) / 2;
  cubeEl.textContent = '';
  cubies = model.positions.map((p, ci) => {
    const el = make('cubie');
    el.style.width = el.style.height = S + 'px';
    el.style.left = el.style.top = (-S / 2) + 'px';
    el.style.transform = cubieTf(ci);
    const stk = {};
    for (const key of Object.keys(FACE_TF)) {
      const f = make('face');
      f.style.width = f.style.height = S + 'px';
      f.style.transform = `${FACE_TF[key]} translateZ(${S / 2}px)`;
      const s = make('stk');
      f.appendChild(s);
      el.appendChild(f);
      stk[key] = s;
    }
    el._stk = [
      p[0] > 0 ? stk.px : p[0] < 0 ? stk.nx : null,
      p[1] > 0 ? stk.py : p[1] < 0 ? stk.ny : null,
      p[2] > 0 ? stk.pz : p[2] < 0 ? stk.nz : null,
    ];
    for (const s of Object.values(stk)) if (!el._stk.includes(s)) s.style.display = 'none';
    cubeEl.appendChild(el);
    return el;
  });
  paint(shown.length === model.size ? shown : new Array(model.size).fill(null));
}
function useModel(n) {
  if (model.N === n && cubies.length) return;
  model = MODEL[n];
  shown = [];
  buildCube();
}

function paint(display) {
  shown = Array.from(display);
  for (let i = 0; i < shown.length; i++) {
    const [ci, ax] = model.slot(i);
    const st = cubies[ci] && cubies[ci]._stk[ax];
    if (st) st.style.background = shown[i] ? HEX[shown[i]] : '';
  }
}

const VIEW = { input: [-16, 24], top: [-62, -22], bottom: [60, -22], solve: [-27, -37] };
let orient = { vx: -27, vy: -37, ax: 0, ay: 0 };
const cubeTf = (o) => `rotateX(${o.vx}deg) rotateY(${o.vy}deg) rotateX(${o.ax}deg) rotateY(${o.ay}deg)`;
const view = (name, ay = 0, ax = 0) => ({ vx: VIEW[name][0], vy: VIEW[name][1], ax, ay });
let orientTimer = null;
function setOrient(o, animate = true) {
  clearTimeout(orientTimer);
  if (animate && !reduced) {
    const d = ((((o.ay - orient.ay) % 360) + 540) % 360) - 180;
    const fromAy = o.ay - d;
    if (fromAy !== orient.ay) {
      cubeEl.style.transition = 'none';
      cubeEl.style.transform = cubeTf({ ...orient, ay: fromAy });
      void cubeEl.offsetWidth;
      cubeEl.style.transition = '';
    }
    orient = { ...o };
    cubeEl.style.transform = cubeTf(orient);
  } else {
    cubeEl.style.transition = 'none';
    orient = { ...o };
    cubeEl.style.transform = cubeTf(orient);
    void cubeEl.offsetWidth;
    cubeEl.style.transition = '';
  }
}
// Two moves in a row, e.g. turn back to the front and then tip the cube.
function setOrientThen(first, second, still) {
  if (reduced) { setOrient(second, false); return; }
  setOrient(first, true);
  orientTimer = setTimeout(() => { if (still()) setOrient(second, true); }, 1250);
}

const TURN = { R: [[1, 0, 0], 90], L: [[1, 0, 0], -90], U: [[0, 1, 0], -90], D: [[0, 1, 0], 90], F: [[0, 0, 1], 90], B: [[0, 0, 1], -90] };
const EASE = 'cubic-bezier(.45, .05, .3, 1)';
let live = [];
function turn(move, ms) {
  const [axis, base] = TURN[move[0]];
  const amount = move.length === 1 ? 1 : move[1] === '2' ? 2 : -1;
  const [lax, sign] = model.layer[move[0]];
  const anims = [];
  cubies.forEach((el, ci) => {
    if (model.positions[ci][lax] !== sign) return;
    const b = cubieTf(ci);
    anims.push(el.animate([
      { transform: `rotate3d(${axis}, 0deg) ${b}` },
      { transform: `rotate3d(${axis}, ${base * amount}deg) ${b}` },
    ], { duration: ms, easing: EASE, fill: 'forwards' }));
  });
  live.push(...anims);
  return anims;
}
function clearTurns() { live.forEach((a) => a.cancel()); live = []; }

let loopId = 0;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function stopLoops() {
  loopId++;
  clearTurns();
  sceneEl.classList.remove('fade');
  flatEl.classList.remove('fade');
}
async function playTurn(move, ms, alive) {
  const anims = turn(move, ms);
  try { await Promise.all(anims.map((a) => a.finished)); } catch (e) { return false; }
  return alive();
}

// ===== The flat view: on the hold and turn screens, one side of the cube flat (flat.js says which) =====
const flatCell = (c, style = '') => `<i class="flat-cell" style="--c:${HEX[c]}${style}"></i>`;
// For a down or right slide the strip is laid out after-then-before and starts shifted, so the side shows as it is.
const reversed = (turn) => turn.dir === 'down' || turn.dir === 'right';
function flatGrid(state, move, face = 'F') {
  const N = model.N, turn = move && flatTurn(move, N), cells = faceCells(state, N, turn ? turn.face : face);
  const slides = !!turn && turn.kind !== 'face';
  const layer = slides ? layerCells(cells.map((_, i) => i), N, turn) : [];
  let inner = '';
  for (let i = 0; i < N * N; i++) if (!layer.includes(i)) inner += flatCell(cells[i], `; grid-area: ${Math.floor(i / N) + 1} / ${(i % N) + 1}`);
  if (slides) {
    // The strip: the layer as it is, then after each quarter turn, in the order it slides past the window.
    const states = [state];
    for (let k = 0; k < (turn.twice ? 2 : 1); k++) states.push(model.apply(states[k], turn.twice ? move[0] : move));
    const strip = (reversed(turn) ? states.reverse() : states).flatMap((s) => layerCells(faceCells(s, N, turn.face), N, turn)).map((c) => flatCell(c)).join('');
    inner += `<div class="flat-win ${turn.kind === 'col' ? 'v' : 'h'}" style="${turn.kind === 'col' ? 'grid-column' : 'grid-row'}: ${turn.index + 1}"><div class="flat-strip">${strip}</div></div>`;
  }
  return `<div class="flat-grid n${N}">${inner}</div>`;
}
// How far the strip travels: the layer's length and one gap, per quarter turn.
function stripTravel(turn) {
  const strip = flatEl.querySelector('.flat-strip');
  if (!strip) return [null, 0];
  const win = strip.parentElement, gap = parseFloat(getComputedStyle(strip).gap) || 0;
  return [strip, ((turn.kind === 'col' ? win.offsetHeight : win.offsetWidth) + gap) * (turn.twice ? 2 : 1)];
}
const shifted = (turn, px) => `translate${turn.kind === 'col' ? 'Y' : 'X'}(${px}px)`;
// The side as it is with the arrow on the moving layer, and a small picture of the side after the turn.
function drawFlat(before, move, after) {
  if (!move) { flatEl.innerHTML = `<div class="flat-side">${flatGrid(before)}</div>`; return; }
  const turn = flatTurn(move, model.N);
  flatEl.innerHTML = `<div class="flat-side">${flatGrid(before, move)}<div class="flat-arrow">${arrowSVG(move, model.N, false)}</div>` +
    `${turn.face === 'U' ? `<span class="flat-tag">${t('topTag')}</span>` : ''}</div>` +
    `<figure class="flat-after"><figcaption>${t('after')}</figcaption>${flatGrid(after, null, turn.face)}</figure>`;
  const [strip, travel] = stripTravel(turn);
  if (strip && reversed(turn)) strip.style.transform = shifted(turn, -travel);
}
function slideFlat(move, ms) {
  const turn = flatTurn(move, model.N), timing = { duration: ms, easing: EASE, fill: 'forwards' };
  let anim;
  if (turn.kind === 'face') {
    const deg = (turn.twice ? 180 : 90) * (turn.dir === 'cw' ? 1 : -1);
    anim = flatEl.querySelector('.flat-grid').animate([{ transform: 'rotate(0deg)' }, { transform: `rotate(${deg}deg)` }], timing);
  } else {
    const [strip, travel] = stripTravel(turn), back = reversed(turn);
    anim = strip.animate([{ transform: shifted(turn, back ? -travel : 0) }, { transform: shifted(turn, back ? 0 : -travel) }], timing);
  }
  live.push(anim);
  return anim.finished.then(() => true, () => false);
}
async function moveLoop(before, move) {
  const id = ++loopId;
  const alive = () => id === loopId;
  const after = model.apply(before, move);
  const ms = move[1] === '2' ? 2300 : 1500;
  drawFlat(before, move, after);
  if (reduced) return;
  while (alive()) {
    await sleep(1200); if (!alive()) return;
    if (!(await slideFlat(move, ms)) || !alive()) return;
    flatEl.querySelector('.flat-arrow').classList.add('hide');
    await sleep(1600); if (!alive()) return;
    flatEl.classList.add('fade');
    await sleep(260); if (!alive()) return;
    clearTurns();
    drawFlat(before, move, after);
    flatEl.classList.remove('fade');
    await sleep(320);
  }
}
function randomTurns(n) {
  const seq = [];
  while (seq.length < n) {
    const m = model.moves[Math.floor(Math.random() * model.moves.length)];
    if (seq.length && seq[seq.length - 1][0] === m[0]) continue;
    seq.push(m);
  }
  return seq;
}
async function demoLoop() {
  const id = ++loopId;
  const alive = () => id === loopId;
  let st = model.solved;
  paint(st);
  if (reduced) return;
  await sleep(900);
  const run = async (moves) => {
    for (const m of moves) {
      if (!(await playTurn(m, 480, alive))) return false;
      st = model.apply(st, m); paint(st); clearTurns();
      await sleep(120); if (!alive()) return false;
    }
    return true;
  };
  while (alive()) {
    const seq = randomTurns(5);
    if (!(await run(seq))) return;
    await sleep(900); if (!alive()) return;
    if (!(await run(seq.slice().reverse().map(invMove)))) return;
    await sleep(1800); if (!alive()) return;
  }
}

// ===== Turn arrows: on the flat side (the front, or the top for back turns) and in the move icon =====
function arrowParts(move, N) {
  const f = move[0];
  const kind = move.length === 1 ? 1 : move[1] === '2' ? 2 : -1;
  const fwd = kind !== -1;
  const lo = N === 2 ? 50 : 34, hi = 200 - lo;
  const head = (x, y, dx, dy) => {
    const L = 44, W = 29, bx = x - dx * L, by = y - dy * L, nx = -dy, ny = dx;
    return [[x, y], [bx + nx * W, by + ny * W], [bx - nx * W, by - ny * W]].map((p) => p.map((v) => v.toFixed(1)).join(',')).join(' ');
  };
  const vert = (x, up) => (up
    ? { shaft: `M${x} 178 L${x} 64`, tip: head(x, 18, 0, -1) }
    : { shaft: `M${x} 22 L${x} 136`, tip: head(x, 182, 0, 1) });
  const horiz = (y, left) => (left
    ? { shaft: `M178 ${y} L64 ${y}`, tip: head(18, y, -1, 0) }
    : { shaft: `M22 ${y} L136 ${y}`, tip: head(182, y, 1, 0) });
  const arc = (cw, r) => {
    const rad = (a) => a * Math.PI / 180;
    const P = (a) => [100 + r * Math.cos(rad(a)), 100 + r * Math.sin(rad(a))];
    const a0 = cw ? 200 : -20, a1 = cw ? 470 : -290, aEnd = cw ? a1 - 32 : a1 + 32;
    const [x0, y0] = P(a0), [x1, y1] = P(aEnd), [xt, yt] = P(a1);
    const dx = cw ? -Math.sin(rad(a1)) : Math.sin(rad(a1));
    const dy = cw ? Math.cos(rad(a1)) : -Math.cos(rad(a1));
    return { shaft: `M${x0.toFixed(1)} ${y0.toFixed(1)} A${r} ${r} 0 1 ${cw ? 1 : 0} ${x1.toFixed(1)} ${y1.toFixed(1)}`, tip: head(xt, yt, dx, dy) };
  };
  let a, plane = 'front';
  if (f === 'R') a = vert(hi, fwd);
  else if (f === 'L') a = vert(lo, !fwd);
  else if (f === 'U') a = horiz(lo, fwd);
  else if (f === 'D') a = horiz(hi, !fwd);
  else if (f === 'B') { a = horiz(lo, fwd); plane = 'top'; }
  else a = arc(fwd, N === 2 ? 58 : 62);
  return { ...a, plane, twice: kind === 2 };
}
function arrowSVG(move, N, withFace) {
  const a = arrowParts(move, N);
  let face = '';
  if (withFace) {
    face = '<rect x="4" y="4" width="192" height="192" rx="30" fill="#0D0E12"/>';
    const gap = N === 2 ? 12 : 9, cell = (192 - gap * (N + 1)) / N;
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const x = 4 + gap + c * (cell + gap), y = 4 + gap + r * (cell + gap);
        face += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${cell.toFixed(1)}" height="${cell.toFixed(1)}" rx="${N === 2 ? 14 : 10}" class="mini-stk${a.plane === 'top' && r === 0 ? ' back' : ''}"/>`;
      }
    }
  }
  return `<svg viewBox="0 0 200 200" aria-hidden="true" focusable="false">${face}` +
    `<path d="${a.shaft}" class="a-out"/><polygon points="${a.tip}" class="a-out-h"/>` +
    `<path d="${a.shaft}" class="a-mid"/><polygon points="${a.tip}" class="a-mid-h"/>` +
    `<path d="${a.shaft}" class="a-core"/><polygon points="${a.tip}" class="a-core-h"/>` +
    (a.twice ? '<circle cx="100" cy="100" r="26" class="a-badge"/><text x="100" y="110" text-anchor="middle" class="a-badge-t">2×</text>' : '') +
    '</svg>';
}

// ===== The 3x3 solver loads only when someone picks a 3x3 =====
let solverLoad = null, solverInit = null;
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error('Could not load ' + src));
    document.head.appendChild(s);
  });
}
function preloadSolver() {
  if (!solverLoad) {
    solverLoad = (async () => { for (const src of SOLVER_URLS) await loadScript(src); })();
    solverLoad.catch(() => { solverLoad = null; });
  }
  return solverLoad;
}
// One init shared by overlapping solving screens (a resize mid-download renders the screen twice).
function ensureSolver() {
  if (!solverInit) {
    solverInit = (async () => { await preloadSolver(); await sleep(60); window.Cube.initSolver(); })();
    solverInit.catch(() => { solverInit = null; });
  }
  return solverInit;
}

// ===== Saving progress on this device =====
const KEY = 'cube-coach-v2';
function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify({
      screen: app.screen, cube: app.cube, side: app.side, mode: app.mode, entry: app.entry, entry3: app.entry3,
      move: app.move, flags: app.flags, unsure: app.unsure, note: app.note,
      state: app.analysis && app.analysis.ok ? app.analysis.state : null, solution: app.solution,
    }));
  } catch (e) { /* storage unavailable */ }
}
function restore() {
  let d = null;
  try { d = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { d = null; }
  if (!d) return;
  const okColor = (c) => c === null || PALETTE.includes(c);
  const okRows = (rows, n, len) => Array.isArray(rows) && rows.length === n && rows.every((r) => Array.isArray(r) && r.length === len && r.every(okColor));
  if (!okRows(d.entry, 4, 4) || !okRows(d.entry3, 6, 9)) return;
  if (!d.entry3.every((r, k) => r[4] === CENTER3[STEPS3[k]])) return;
  app.cube = d.cube === 3 ? 3 : 2;
  app.entry = d.entry;
  app.entry3 = d.entry3;
  app.side = Math.min(sideCount() - 1, Math.max(0, d.side | 0));
  app.mode = ['first', 'review', 'fix'].includes(d.mode) ? d.mode : 'first';
  app.flags = Array.isArray(d.flags) ? d.flags.filter((f) => f && Number.isInteger(f.k) && Number.isInteger(f.c)) : [];
  app.note = typeof d.note === 'string' ? d.note : '';
  app.unsure = Array.isArray(d.unsure) ? d.unsure.filter((f) => f && Number.isInteger(f.k) && Number.isInteger(f.c)) : [];
  const m = MODEL[app.cube];
  const sol = Array.isArray(d.solution) ? d.solution.filter((x) => typeof x === 'string' && x in MOVE_TEXT) : null;
  const solves = (st, moves) => {
    if (typeof st !== 'string' || st.length !== m.size || !moves) return false;
    let x = st;
    for (const mv of moves) { if (!(mv in (is3() ? PERMS3 : PERMS))) return false; x = m.apply(x, mv); }
    return is3() ? isSolved3(x) : isSolved(x);
  };
  if (['hold', 'move', 'done'].includes(d.screen) && solves(d.state, sol)) {
    app.analysis = { ok: true, state: d.state, order: 'left', turned: [] };
    app.solution = sol;
    app.move = Math.min(Math.max(0, d.move | 0), Math.max(0, sol.length - 1));
    app.screen = d.screen === 'move' && !sol.length ? 'hold' : d.screen;
    return;
  }
  const full = entryNow().every((r) => r.every((c) => c));
  if (['checkTop', 'checkBottom', 'mismatch', 'oops', 'solving', 'solverError', 'hold', 'move', 'done'].includes(d.screen) && full) {
    if (is3()) {
      const r = analyze3(app.entry3);
      app.analysis = r;
      app.screen = r.ok ? 'solving' : 'oops';
    } else {
      const r = analyze(app.entry);
      app.analysis = r;
      if (r.ok) { app.solution = solve(r.state) || []; app.screen = ['mismatch', 'checkBottom'].includes(d.screen) ? d.screen : 'checkTop'; }
      else app.screen = 'oops';
    }
    return;
  }
  if (d.screen === 'side' || full) app.screen = 'side';
}

// ===== Language =====
// Kept under its own key, apart from the progress record, so Start over and restore() never touch it.
const LANG_KEY = 'cube-coach-lang';
// applyLang switches the words without saving, so an untouched app keeps following the phone;
// setLang (the switch) saves the choice.
function applyLang(code) {
  useLang(code);
  document.documentElement.lang = code;
  document.documentElement.dir = LANGS[code].dir;
}
function setLang(code) {
  applyLang(code);
  try { localStorage.setItem(LANG_KEY, code); } catch (e) { /* storage unavailable */ }
}
// The phone's language when it is one of ours, else English.
const phoneLang = () => (navigator.languages || [navigator.language]).map((l) => String(l).slice(0, 2).toLowerCase()).find((l) => Object.keys(LANGS).includes(l)) || 'en';
// The switch: one segmented control in the header's tools group, beside the theme toggle, built
// once from LANGS. CSS shows it on the welcome screen only. Each segment is the language's flag
// over its code; the full name is the label.
let langsEl = null;
function refreshLangs() {
  if (!langsEl) {
    langsEl = make('langs');
    langsEl.setAttribute('role', 'group');
    langsEl.innerHTML = Object.keys(LANGS).map((code) =>
      `<button class="lang" type="button" data-lang="${code}" lang="${code}" aria-label="${LANGS[code].name}"><i>${LANGS[code].flag}</i>${LANGS[code].code}</button>`).join('');
    langsEl.querySelectorAll('.lang').forEach((b) => b.addEventListener('click', () => { setLang(b.dataset.lang); disarm(); render(false); }));
    $('.tools').insertBefore(langsEl, themeBtn);
  }
  langsEl.setAttribute('aria-label', t('language'));
  langsEl.querySelectorAll('.lang').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
}

// ===== Theme =====
// Light or dark on request; without a saved choice the app follows the phone. The same key is read
// by a one-line script in the head, so a saved choice is applied before the first paint.
const THEME_KEY = 'cube-coach-theme';
const themeBtn = $('#theme');
function isDark() {
  const mode = document.documentElement.dataset.theme;
  return mode === 'dark' || (mode !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches);
}
function setTheme(mode) {
  document.documentElement.dataset.theme = mode;
  try { localStorage.setItem(THEME_KEY, mode); } catch (e) { /* storage unavailable */ }
}
// The icon shows the way out (a sun in the dark), the label says where it leads.
function paintTheme() {
  themeBtn.classList.toggle('dark', isDark());
  themeBtn.setAttribute('aria-label', t(isDark() ? 'lightMode' : 'darkMode'));
}

// Everything outside the panel that has words in the current language: the switch and the theme
// toggle. The credits line stays English.
function refreshChrome() {
  refreshLangs();
  paintTheme();
}

// ===== Screens =====
const progress = (n, i, label, extra = '') => {
  const track = n <= 12
    ? `<div class="chips" aria-hidden="true">${Array.from({ length: n }, (_, j) => `<span class="chip ${j < i ? 'done' : j === i ? 'now' : ''}"></span>`).join('')}</div>`
    : `<div class="bar" aria-hidden="true"><i style="width:${Math.round((i / n) * 100)}%"></i></div>`;
  return `<div class="progress">${track}<span>${label}</span>${extra}</div>`;
};
const miniGrid = (colors, flagged = [], cls = 'mini') => {
  const n3 = colors.length === 9;
  return `<div class="face-grid ${cls}${n3 ? ' n3' : ''}" aria-hidden="true">${colors.map((c, i) =>
    `<span class="cell${n3 && i === 4 ? ' center' : ''}${flagged.includes(i) ? ' flag' : ''}" ${c ? `style="--c:${HEX[c]}"` : ''}></span>`).join('')}</div>`;
};
const btn = (id, label, cls = '') => `<button class="btn ${cls}" id="${id}" type="button">${label}</button>`;
const on = (id, fn) => { const el = document.getElementById(id); if (el) el.addEventListener('click', fn); };
const sideLabel = (k) => (is3() ? t('sideLabel3', { color: faceColor3(k) }) : t('sideLabel2', { n: k + 1 }));

function sideDisplay() {
  if (is3()) {
    const d = new Array(54).fill(null);
    STEPS3.forEach((face, k) => { const f = FACES3.indexOf(face); app.entry3[k].forEach((c, i) => { d[f * 9 + i] = c; }); });
    return d;
  }
  const d = new Array(24).fill(null);
  SIDE_ORDERS.left.forEach((face, k) => FACE_CELLS[face].forEach((si, c) => { d[si] = app.entry[k][c]; }));
  return d;
}
function stateAt(i) {
  let s = app.analysis.state;
  for (let j = 0; j < i; j++) s = model.apply(s, app.solution[j]);
  return s;
}
function go(screen) {
  closeCamera();
  app.screen = screen;
  app.helpOpen = false;
  save();
  render(true);
  window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
}
function resetAll() {
  Object.assign(app, { side: 0, mode: 'first', entry: empty2(), entry3: empty3(), analysis: null, solution: [], move: 0, flags: [], unsure: [], note: '' });
}
// A hidden helper for testing (main.js wires the press-and-hold on the brand): the sides fill with a
// random real cube, scrambled from solved with the cube's own turns, and the check begins.
function fillRandom() {
  const st = randomTurns(25).reduce((s, m) => model.apply(s, m), model.solved);
  if (is3()) app.entry3 = STEPS3.map((f) => faceCells(st, 3, f));
  else app.entry = SIDE_ORDERS.left.map((f) => faceCells(st, 2, f));
  app.unsure = [];
  finishSides();
}
function finishSides() {
  app.flags = [];
  if (is3()) {
    const r = analyze3(app.entry3);
    app.analysis = r;
    if (!r.ok) { go('oops'); return; }
    app.note = r.turned.length
      ? t('turnedNote', { n: r.turned.length, sides: r.turned.map((k) => t('sideListName', { color: faceColor3(k) })).join(t('and')) }) : '';
    go('solving');
    return;
  }
  const r = analyze(app.entry);
  app.analysis = r;
  if (r.ok) { app.solution = solve(r.state) || []; app.move = 0; go('checkTop'); }
  else go('oops');
}

function render(animate) {
  stopLoops();
  clearTimeout(orientTimer);
  spinnerEl.classList.remove('spinning');
  useModel(app.cube);
  appEl.dataset.screen = app.screen;
  refreshChrome();
  const big = ['welcome', 'checkTop', 'checkBottom', 'hold', 'move', 'done', 'solving', 'solverError'].includes(app.screen);
  if (big) appEl.dataset.big = ''; else delete appEl.dataset.big;
  ({
    welcome: screenWelcome, side: screenSide, checkTop: () => screenCheck('top', animate),
    checkBottom: () => screenCheck('bottom', animate), oops: screenOops, mismatch: screenMismatch,
    solving: screenSolving, solverError: screenSolverError, hold: screenHold, move: screenMove, done: screenDone,
  }[app.screen] || screenWelcome)(animate);
}

function screenWelcome() {
  setOrient(view('solve'), false);
  demoLoop();
  const ico = (n, cols) => `<span class="ico n${n}" aria-hidden="true">${cols.map((c) => `<i style="background:${HEX[c]}"></i>`).join('')}</span>`;
  panelEl.innerHTML = `
    <h1>${t('welcomeTitle')}</h1>
    <p class="lead">${t('welcomeLead')}</p>
    <div class="choose">
      <button class="tile" id="pick2" type="button">${ico(2, ['G', 'Y', 'R', 'B'])}<strong>2×2</strong><small>${t('tile2')}</small></button>
      <button class="tile" id="pick3" type="button">${ico(3, ['W', 'R', 'G', 'B', 'G', 'Y', 'O', 'W', 'R'])}<strong>3×3</strong><small>${t('tile3')}</small></button>
    </div>`;
  on('pick2', () => { app.cube = 2; resetAll(); go('side'); });
  on('pick3', () => { app.cube = 3; resetAll(); preloadSolver().catch(() => {}); go('side'); });
}

function sideOrient(k) {
  if (is3() && k === 4) return view('input', 0, -90);
  if (is3() && k === 5) return view('input', 0, 90);
  return view('input', -90 * k);
}
function turnToSide(k, fromK, animate) {
  if (!animate) { setOrient(sideOrient(k), false); return; }
  if (is3() && k === 4 && fromK === 3) {
    setOrientThen(view('input', 0), sideOrient(4), () => app.screen === 'side' && app.side === 4);
  } else {
    setOrient(sideOrient(k), true);
  }
}
let lastSide = 0;

function sideText(k, mode) {
  const fix = ' ' + t('fixLine');
  if (!is3()) {
    if (mode === 'fix') return [t('side2FixTitle', { n: k + 1 }), t('side2FixLead') + fix];
    if (k === 0) {
      return mode === 'review'
        ? [t('side2Review0Title'), t('side2Review0Lead') + fix]
        : [t('side2First0Title'), t('side2First0Lead')];
    }
    return [t('side2NextTitle'), t('side2NextLead') + (mode === 'review' ? fix : '')];
  }
  const color = faceColor3(k);
  const extra = mode === 'review' ? fix : '';
  if (mode === 'fix') return [t('side3FixTitle', { color }), t('side3FixLead', { color }) + fix];
  if (k === 0) return [mode === 'review' ? t('side3Review0Title') : t('side3First0Title'), t('side3Lead0') + extra];
  if (k <= 3) return [t('side3NextTitle'), t('side3NextLead', { color }) + extra];
  if (k === 4) return [t('side3TopTitle'), t('side3TopLead') + extra];
  return [t('side3BottomTitle'), t('side3BottomLead') + extra];
}

function screenSide(animate) {
  const k = app.side, mode = app.mode, n3 = is3(), total = sideCount();
  const [title, lead] = sideText(k, mode);
  const last = k === total - 1;
  const actions = mode === 'fix'
    ? btn('check', t('checkAgain'), 'primary')
    : (k > 0 ? btn('back', t('back')) : '') + btn('next', last ? t('checkMyCube') : t('nextSide'), 'primary' + (k > 0 ? ' wide' : ''));
  const cells = n3 ? 9 : 4;
  const strip = n3 && k === 4 ? ' strip-bottom' : n3 && k === 5 ? ' strip-top' : '';
  panelEl.innerHTML = `
    ${progress(total, k, t('sideOf', { n: k + 1, total }))}
    <h1>${title}</h1>
    <p class="lead">${lead}</p>
    <div class="preview"><div class="grid-row">
      <div class="face-grid${n3 ? ' n3' : ''}${strip}" role="group" aria-label="${sideLabel(k)}">
        ${Array.from({ length: cells }, (_, c) => (n3 && c === 4
          ? `<span class="cell center" style="--c:${HEX[CENTER3[STEPS3[k]]]}" aria-label="${t('middleSquare', { color: faceColor3(k) })}"></span>`
          : `<button class="cell" type="button" data-c="${c}"></button>`)).join('')}
      </div>
      <button class="cam-btn" id="camera" type="button" aria-label="${t('photoAria')}">${CAM_ICON}<span>${t('photo')}</span></button>
    </div></div>
    <p class="unsure-note" id="unsure-note" hidden>${t('unsureNote')}</p>
    <div class="palette" role="group" aria-label="${t('colors')}">
      ${PALETTE.map((col) => `<button class="sw" type="button" data-col="${col}" aria-pressed="false"><span class="dot" style="--c:${HEX[col]}"></span>${cap(colorName(col))}</button>`).join('')}
    </div>
    <p class="warn" id="warn" hidden></p>
    <div class="actions">${actions}</div>
    ${k > 0 && mode !== 'fix' ? `<button class="textlink" id="replay" type="button">${t('replay')}</button>` : ''}`;

  panelEl.querySelectorAll('button.cell').forEach((cell) => cell.addEventListener('click', () => {
    const c = Number(cell.dataset.c);
    entryNow()[app.side][c] = app.selected;
    app.flags = app.flags.filter((f) => !(f.k === app.side && f.c === c));
    app.unsure = app.unsure.filter((f) => !(f.k === app.side && f.c === c));
    refreshSide(c);
    save();
  }));
  panelEl.querySelectorAll('.sw').forEach((sw) => sw.addEventListener('click', () => {
    app.selected = sw.dataset.col;
    refreshSide();
  }));
  on('next', () => { if (last) finishSides(); else { app.side++; go('side'); } });
  on('back', () => { app.side--; go('side'); });
  on('check', finishSides);
  on('camera', openCamera);
  on('replay', () => {
    setOrient(sideOrient(k - 1), false);
    setTimeout(() => turnToSide(k, k - 1, true), 40);
  });
  refreshSide();
  turnToSide(k, lastSide, animate);
  lastSide = k;
}

function refreshSide(popped) {
  const k = app.side, row = entryNow()[k], limit = is3() ? 9 : 4;
  const names = is3()
    ? ['sqTopLeft', 'sqTopMiddle', 'sqTopRight', 'sqMiddleLeft', 'sqMiddle', 'sqMiddleRight', 'sqBottomLeft', 'sqBottomMiddle', 'sqBottomRight']
    : ['sqTopLeft', 'sqTopRight', 'sqBottomLeft', 'sqBottomRight'];
  panelEl.querySelectorAll('button.cell').forEach((cell) => {
    const c = Number(cell.dataset.c), col = row[c];
    if (col) cell.style.setProperty('--c', HEX[col]); else cell.style.removeProperty('--c');
    cell.textContent = col ? '' : '?';
    cell.setAttribute('aria-label', t('squareLabel', { square: t(names[c]), state: col ? colorName(col) : t('notSet') }));
    cell.classList.toggle('flag', app.flags.some((f) => f.k === k && f.c === c));
    cell.classList.toggle('unsure', !!col && app.unsure.some((f) => f.k === k && f.c === c));
    if (c === popped) { cell.classList.remove('pop'); void cell.offsetWidth; cell.classList.add('pop'); }
  });
  const counts = {};
  entryNow().flat().forEach((c) => { if (c) counts[c] = (counts[c] || 0) + 1; });
  let over = null;
  panelEl.querySelectorAll('.sw').forEach((sw) => {
    const col = sw.dataset.col, n = counts[col] || 0;
    sw.setAttribute('aria-pressed', String(col === app.selected));
    let badge = sw.querySelector('.over');
    if (n > limit) {
      if (!badge) { badge = document.createElement('span'); badge.className = 'over'; sw.appendChild(badge); }
      badge.textContent = n;
      over = over || [col, n];
    } else if (badge) badge.remove();
  });
  const warn = document.getElementById('warn');
  if (warn) {
    warn.hidden = !over;
    if (over) warn.innerHTML = t('tooMany', { n: limit, have: over[1], color: over[0] });
  }
  const note = document.getElementById('unsure-note');
  if (note) note.hidden = !app.unsure.some((f) => f.k === k);
  const next = document.getElementById('next') || document.getElementById('check');
  if (next) next.disabled = row.some((c) => !c);
  paint(sideDisplay());
}

function screenCheck(which, animate) {
  const st = app.analysis.state;
  paint(st);
  const isTop = which === 'top';
  const cells = FACE_CELLS[isTop ? 'U' : 'D'].map((i) => st[i]);
  if (isTop) {
    if (animate && app.analysis.order === 'left') setOrientThen(view('input', 0), view('top'), () => app.screen === 'checkTop');
    else { setOrient(view('input', 0), false); setOrient(view('top'), animate); }
  } else {
    setOrient(view('bottom'), animate);
  }
  const tag = `<span class="edge-tag ${isTop ? 'below' : 'above'}">${t('edgeTag')}</span>`;
  const turnedRight = isTop && app.analysis.order === 'right'
    ? `<p class="note">${t('turnedRightNote')}</p>` : '';
  panelEl.innerHTML = `
    <h1>${isTop ? t('checkTopTitle') : t('checkBottomTitle')}</h1>
    ${turnedRight}
    <p class="lead">${isTop ? t('checkTopLead') : t('checkBottomLead')}</p>
    <div class="preview">${isTop ? '' : tag}${miniGrid(cells, [], 'check')}${isTop ? tag : ''}</div>
    <div class="actions">${btn('no', t('no'))}${btn('yes', t('yes'), 'primary')}</div>`;
  on('no', () => go('mismatch'));
  on('yes', () => go(isTop ? 'checkBottom' : 'hold'));
}

function reviewSides(flags) { app.mode = 'review'; app.side = 0; app.flags = flags || []; go('side'); }
function fixSide(k, flags) { app.mode = 'fix'; app.side = k; app.flags = flags; go('side'); }

function screenMismatch(animate) {
  paint(app.analysis && app.analysis.ok ? app.analysis.state : sideDisplay());
  setOrient(view('input', 0), animate);
  panelEl.innerHTML = `
    <h1>${t('mismatchTitle')}</h1>
    <p class="lead">${t('mismatchLead')}</p>
    <div class="actions">${btn('review', t('checkSides'), 'primary')}</div>`;
  on('review', () => reviewSides([]));
}

function screenOops(animate) {
  const r = app.analysis;
  paint(sideDisplay());
  const entry = entryNow();
  const squares = [];
  for (const f of r.fixes) if (!squares.some((s) => s.k === f.k && s.c === f.c)) squares.push({ k: f.k, c: f.c });
  const figure = (k, cs) => `<figure>${miniGrid(entry[k], cs)}<figcaption>${sideLabel(k)}</figcaption></figure>`;
  if (squares.length === 1) {
    const sq = squares[0];
    const colors = [...new Set(r.fixes.map((f) => f.to))];
    const to = colors.length === 1 ? colors[0] : null;
    turnToSide(sq.k, -1, animate);
    const lead = is3() ? t('oopsOneLead3', { color: faceColor3(sq.k) }) : t('oopsOneLead2', { n: sq.k + 1 });
    panelEl.innerHTML = `
      <h1>${t('oopsOneTitle')}</h1>
      <p class="lead">${lead}${to ? ' ' + t('iThink', { color: to }) : ''}</p>
      <div class="minis">${figure(sq.k, [sq.c])}</div>
      <div class="actions">${to ? btn('look', t('letMeLook')) + btn('fix', t('makeIt', { color: to }), 'primary') : btn('look', is3() ? t('checkSide3', { color: faceColor3(sq.k) }) : t('checkSide2', { n: sq.k + 1 }), 'primary')}</div>`;
    on('fix', () => { entry[sq.k][sq.c] = to; save(); finishSides(); });
    on('look', () => fixSide(sq.k, [sq]));
  } else if (squares.length >= 2 && squares.length <= 4) {
    const sides = [...new Set(squares.map((s) => s.k))].sort((a, b) => a - b);
    turnToSide(sides[0], -1, animate);
    panelEl.innerHTML = `
      <h1>${t('oopsSomeTitle')}</h1>
      <p class="lead">${t('oopsSomeLead')}</p>
      <div class="minis">${sides.map((k) => figure(k, squares.filter((s) => s.k === k).map((s) => s.c))).join('')}</div>
      <div class="actions">${btn('review', t('checkMarked'), 'primary')}</div>`;
    on('review', () => reviewSides(squares));
  } else {
    turnToSide(0, -1, animate);
    panelEl.innerHTML = `
      <h1>${t('oopsManyTitle')}</h1>
      <p class="lead">${is3() ? t('oopsManyLead3') : t('mismatchLead')}</p>
      <div class="actions">${btn('review', t('checkSides'), 'primary')}</div>`;
    on('review', () => reviewSides(r.error && r.error.where ? r.error.where : []));
  }
}

let solveRun = 0;
function screenSolving(animate) {
  const st = app.analysis.state;
  paint(st);
  setOrient(view('solve'), animate);
  panelEl.innerHTML = `
    <div class="thinking" aria-hidden="true"><i style="background:${HEX.G}"></i><i style="background:${HEX.Y}"></i><i style="background:${HEX.R}"></i><i style="background:${HEX.B}"></i></div>
    <h1>${t('solvingTitle')}</h1>
    <p class="lead">${t('solvingLead')}</p>`;
  const run = ++solveRun;
  setTimeout(async () => {
    try {
      await ensureSolver();
      if (run !== solveRun || app.screen !== 'solving') return;
      const raw = isSolved3(st) ? '' : String(window.Cube.fromString(toFaceletString(st)).solve() || '');
      const moves = raw.trim() ? raw.trim().split(/\s+/) : [];
      let x = st;
      for (const m of moves) x = applyMove3(x, m);
      if (!isSolved3(x)) throw new Error('The moves did not check out');
      app.solution = moves;
      app.move = 0;
      go('hold');
    } catch (e) {
      if (run === solveRun && app.screen === 'solving') go('solverError');
    }
  }, 120);
}

function screenSolverError(animate) {
  paint(app.analysis.state);
  setOrient(view('solve'), animate);
  panelEl.innerHTML = `
    <h1>${t('solverErrorTitle')}</h1>
    <p class="lead">${t('solverErrorLead')}</p>
    <div class="actions">${btn('retry', t('tryAgain'), 'primary')}</div>`;
  on('retry', () => go('solving'));
}

function screenHold() {
  drawFlat(app.analysis.state);
  const note = app.note ? `<p class="note">${app.note}</p>` : '';
  if (!app.solution.length) {
    panelEl.innerHTML = `
      <h1>${t('alreadySolvedTitle')}</h1>
      <p class="lead">${t('alreadySolvedLead')}</p>
      <div class="actions">${btn('again', t('copyAgain'), 'primary')}</div>`;
    on('again', () => { resetAll(); go('side'); });
    return;
  }
  panelEl.innerHTML = `
    <h1>${t('holdTitle')}</h1>
    ${note}
    <p class="lead">${is3() ? t('holdLead3') : t('holdLead2')}</p>
    <div class="actions">${btn('ready', t('ready'), 'primary')}</div>`;
  on('ready', () => { app.move = 0; go('move'); });
}

function screenMove() {
  const i = app.move, sol = app.solution, m = sol[i];
  const [title, sub] = moveText(m);
  moveLoop(stateAt(i), m);
  panelEl.innerHTML = `
    ${progress(sol.length, i, t('moveOf', { n: i + 1, total: sol.length }), `<span class="key" aria-label="${t('cubeCode', { m })}">${m.replace("'", '′')}</span>`)}
    <div class="move-head"><span class="move-icon">${arrowSVG(m, model.N, true)}</span><h1>${title}</h1></div>
    <p class="lead">${sub}</p>
    <div class="actions">${btn('back', t('previous'))}${btn('did', t('didIt'), 'primary wide')}</div>
    <button class="textlink" id="lost" type="button" aria-expanded="${app.helpOpen}">${t('lost')}</button>
    ${app.helpOpen ? `<div class="help">
      <p>${is3() ? t('helpMatch3') : t('helpMatch2')}</p>
      <p>${t('helpRecopy')}</p>
      ${btn('recopy', t('copyAgain'))}</div>` : ''}`;
  on('back', () => { if (i === 0) go('hold'); else { app.move--; go('move'); } });
  on('did', () => { if (i + 1 >= sol.length) go('done'); else { app.move++; go('move'); } });
  on('lost', () => { app.helpOpen = !app.helpOpen; render(false); });
  on('recopy', () => { resetAll(); go('side'); });
}

function screenDone(animate) {
  paint(stateAt(app.solution.length));
  setOrient(view('solve'), animate);
  if (!reduced) spinnerEl.classList.add('spinning');
  if (animate) confetti();
  const n = app.solution.length;
  panelEl.innerHTML = `
    <h1>${t('doneTitle')}</h1>
    <p class="lead">${t('doneLead', { n })}</p>
    <div class="actions">${btn('another', t('solveAnother'), 'primary')}</div>`;
  on('another', () => { resetAll(); go('side'); });
}

function confetti() {
  if (reduced) return;
  const layer = document.createElement('div');
  layer.className = 'confetti';
  const cols = Object.values(HEX);
  for (let i = 0; i < 90; i++) {
    const p = document.createElement('i');
    p.style.left = Math.random() * 100 + 'vw';
    p.style.setProperty('--c', cols[i % cols.length]);
    p.style.setProperty('--x', (Math.random() * 40 - 20).toFixed(1) + 'vw');
    p.style.setProperty('--r', Math.round(Math.random() * 720 - 360) + 'deg');
    p.style.setProperty('--t', (2.2 + Math.random() * 1.6).toFixed(2) + 's');
    p.style.setProperty('--d', (Math.random() * 0.5).toFixed(2) + 's');
    layer.appendChild(p);
  }
  document.body.appendChild(layer);
  setTimeout(() => layer.remove(), 4600);
}


