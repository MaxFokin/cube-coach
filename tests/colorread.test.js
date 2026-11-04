// Color reading: a synthetic 3x3 side always runs; the four real photos run when present
// in tests/fixtures/photos (they are personal photos, kept out of git by default).
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const C = require('./load.js');
let sharp = null;
try { sharp = require('sharp'); } catch (e) { console.log('colorread: sharp not installed (npm install), skipping'); }

(async () => {
  if (!sharp) return;
  const hex = { W: '#F2F2EE', Y: '#F5D31B', R: '#C8102E', O: '#FF6A13', B: '#0046AD', G: '#009B48' };
  const face = ['W', 'R', 'G', 'B', 'G', 'Y', 'O', 'W', 'R'];
  let rects = '';
  face.forEach((c, i) => { const r = Math.floor(i / 3), col = i % 3; rects += `<rect x="${130 + col * 150}" y="${230 + r * 150}" width="132" height="132" rx="18" fill="${hex[c]}"/>`; });
  const svg = `<svg width="720" height="960" xmlns="http://www.w3.org/2000/svg"><rect width="720" height="960" fill="#c9b79c"/><rect x="118" y="218" width="474" height="474" rx="28" fill="#111"/>${rects}</svg>`;
  const { data, info } = await sharp(Buffer.from(svg)).jpeg({ quality: 85 }).toBuffer().then((b) => sharp(b).ensureAlpha().raw().toBuffer({ resolveWithObject: true }));
  const box = C.findFace(data, info.width, info.height);
  const got = C.readFace(data, info.width, info.height, box, 3, {}).map((r) => r.color).join('');
  assert.strictEqual(got, face.join(''), 'synthetic 3x3 side should read exactly');

  const dir = path.join(__dirname, 'fixtures', 'photos');
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.jpg')).sort() : [];
  const truth = { 1: 'WGYO', 2: 'WBYG', 3: 'WBRB', 4: 'ORYG' };
  let right = 0, total = 0;
  for (const f of files) {
    const n = (f.match(/^side(\d)/) || [])[1];
    if (!truth[n]) continue;
    const img = await sharp(path.join(dir, f)).resize({ width: 600 }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const b = C.findFace(img.data, img.info.width, img.info.height);
    const got2 = C.readFace(img.data, img.info.width, img.info.height, b, 2, {}).map((r) => r.color).join('');
    total += 4; right += [...got2].filter((c, i) => c === truth[n][i]).length;
  }
  if (total) {
    assert(right >= total - 1, `real photos: ${right}/${total} squares read right (expected at least ${total - 1})`);
    console.log(`colorread: ok (synthetic side exact, real photos ${right}/${total})`);
  } else console.log('colorread: ok (synthetic side exact; no real photos found)');
})();
