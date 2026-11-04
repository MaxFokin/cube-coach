// Generates the fixtures the browser tests need: a random 3x3 scramble (as the kid would copy it),
// a synthetic 3x3 side photo, and a fake live-camera clip from real photo 1 when it exists.
//   node tests/e2e/fixtures.js
const fs = require('fs');
const path = require('path');
const C = require('../load.js');
const out = path.join(__dirname, '..', 'fixtures', 'generated');
fs.mkdirSync(out, { recursive: true });
const rnd = (n) => Math.floor(Math.random() * n);
const MOVES = Object.keys(C.PERMS3);
let s = C.SOLVED3;
for (let i = 0; i < 25; i++) s = C.applyMove3(s, MOVES[rnd(18)]);
const entry = C.STEPS3.map((face) => { const f = C.FACES3.indexOf(face); return [...s.slice(f * 9, f * 9 + 9)]; });
fs.writeFileSync(path.join(out, 'scramble3.json'), JSON.stringify({ state: s, entry }));
(async () => {
  let sharp = null;
  try { sharp = require('sharp'); } catch (e) { console.log('sharp not installed: skipping image fixtures'); return; }
  const hex = { W: '#F2F2EE', Y: '#F5D31B', R: '#C8102E', O: '#FF6A13', B: '#0046AD', G: '#009B48' };
  const face = ['W', 'R', 'G', 'B', 'G', 'Y', 'O', 'W', 'R'];
  let rects = '';
  face.forEach((c, i) => { const r = Math.floor(i / 3), col = i % 3; rects += `<rect x="${130 + col * 150}" y="${230 + r * 150}" width="132" height="132" rx="18" fill="${hex[c]}"/>`; });
  const svg = `<svg width="720" height="960" xmlns="http://www.w3.org/2000/svg"><rect width="720" height="960" fill="#c9b79c"/><rect x="118" y="218" width="474" height="474" rx="28" fill="#111"/>${rects}<ellipse cx="300" cy="330" rx="60" ry="30" fill="white" opacity=".55"/></svg>`;
  await sharp(Buffer.from(svg)).jpeg({ quality: 85 }).toFile(path.join(out, 'face3.jpg'));
  const photo1 = path.join(__dirname, '..', 'fixtures', 'photos', 'side1.jpg');
  if (fs.existsSync(photo1)) {
    const frame = await sharp(photo1).extract({ left: 210, top: 599, width: 1067, height: 1067 }).resize(640, 640).jpeg({ quality: 90 }).toBuffer();
    fs.writeFileSync(path.join(out, 'fake-camera.mjpeg'), Buffer.concat(Array(30).fill(frame)));
  }
  console.log('fixtures written to', out);
})();
