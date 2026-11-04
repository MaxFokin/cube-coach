// ===== Reading sticker colors from camera pixels =====
// px: RGBA bytes (canvas ImageData layout), w x h. All work stays on the device.
function hsvOf(r, g, b) {
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d > 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return [h, max === 0 ? 0 : d / max, max / 255];
}
const hueDist = (a, b) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };

function bandOf(h, bounds) {
  // bounds: { RO, OY } can move with what the camera saw on known middles
  const ro = bounds.RO, oy = bounds.OY;
  if (h >= 345 || h < ro) return 'R';
  if (h < oy) return 'O';
  if (h < 72) return 'Y';
  if (h < 175) return 'G';
  if (h < 265) return 'B';
  return h >= 300 ? 'R' : 'B';
}

// Read one square. Black plastic is ignored. Shiny spots wash colors out, so the square's
// color is judged from its most vivid quarter of pixels, which glare rarely covers.
function readPatch(px, w, x0, y0, x1, y1) {
  const all = [];
  const step = Math.max(1, Math.floor((x1 - x0) / 28));
  for (let y = y0; y < y1; y += step) {
    for (let x = x0; x < x1; x += step) {
      const i = (y * w + x) * 4;
      all.push(hsvOf(px[i], px[i + 1], px[i + 2]));
    }
  }
  const total = all.length;
  let top = 0;
  for (const p of all) if (p[2] > top) top = p[2];
  const floor = Math.max(0.16, top * 0.4);
  const pts = all.filter((p) => p[2] >= floor);
  pts.sort((a, b) => b[1] - a[1]);
  const vivid = pts.slice(0, Math.max(1, Math.ceil(pts.length * 0.25)));
  let sx = 0, sy = 0, sw = 0;
  for (const [h, s] of vivid) {
    const a = h * Math.PI / 180;
    sx += Math.cos(a) * s; sy += Math.sin(a) * s; sw += s;
  }
  let hue = Math.atan2(sy, sx) * 180 / Math.PI;
  if (hue < 0) hue += 360;
  const clipped = pts.filter((p) => p[2] >= 0.985 && p[1] < 0.06).length;
  return {
    total, seen: pts.length, hue, clipped: pts.length ? clipped / pts.length : 0,
    vividSat: vivid.length ? sw / vivid.length : 0,
    agree: sw > 0 ? Math.hypot(sx, sy) / sw : 0,
    medianSat: pts.length ? pts[Math.floor(pts.length / 2)][1] : 0,
  };
}

// refs: { R: hue, O: hue, ... } seen on known middle squares, used to move the red/orange
// and orange/yellow borders to what this camera and light actually show.
function boundsFrom(refs) {
  const b = { RO: 11, OY: 38 };
  if (refs && refs.R !== undefined && refs.O !== undefined) {
    const r = refs.R > 180 ? refs.R - 360 : refs.R;
    const mid = (r + refs.O) / 2;
    if (refs.O - r > 6) b.RO = Math.min(24, Math.max(2, mid));
  }
  if (refs && refs.O !== undefined && refs.Y !== undefined && refs.Y - refs.O > 8) {
    b.OY = Math.min(48, Math.max(26, (refs.O + refs.Y) / 2));
  }
  return b;
}

function classifyPatch(p, bounds) {
  if (p.seen < p.total * 0.3) return { color: null, sure: false, why: 'dark' };
  if (p.vividSat >= 0.4 && p.agree >= 0.8) {
    const color = bandOf(p.hue, bounds);
    const near = [bounds.RO, bounds.OY, 72, 175, 265, 345].some((e) => hueDist(p.hue, e) < 4);
    return { color, sure: !near && p.vividSat >= 0.48 && p.agree >= 0.9, hue: p.hue, sat: p.vividSat, agree: p.agree };
  }
  // Pale: a white square, or a colored one washed out by a shiny spot. Camera light casts
  // tint white along the warm-cool axis, so a pale green or pink tint means a washed-out color.
  const odd = p.vividSat >= 0.09 && p.agree >= 0.45 && ((p.hue >= 80 && p.hue < 170) || p.hue >= 250 || p.hue < 12);
  if (odd) return { color: p.hue >= 80 && p.hue < 170 ? 'G' : 'R', sure: false, hue: p.hue, sat: p.vividSat, agree: p.agree, why: 'shiny' };
  const doubtful = (p.vividSat >= 0.3 && p.agree >= 0.8) || p.clipped > 0.5;
  return { color: 'W', sure: !doubtful, hue: p.hue, sat: p.vividSat, agree: p.agree, why: doubtful ? 'shiny' : undefined };
}

// Read an N x N face inside the box (x, y, size) of the pixel buffer.
function readFace(px, w, h, box, N, refs) {
  const bounds = boundsFrom(refs);
  const out = [];
  const cell = box.size / N;
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const cx = box.x + (c + 0.5) * cell, cy = box.y + (r + 0.5) * cell, half = cell * 0.32;
      const x0 = Math.max(0, Math.round(cx - half)), x1 = Math.min(w, Math.round(cx + half));
      const y0 = Math.max(0, Math.round(cy - half)), y1 = Math.min(h, Math.round(cy + half));
      out.push(classifyPatch(readPatch(px, w, x0, y0, x1, y1), bounds));
    }
  }
  return out;
}

// Best guess where the cube is in a still photo: the biggest squarish patch of black plastic
// that doesn't touch the photo's edge, preferring the one nearest the middle.
function findFace(px, w, h) {
  const fallback = () => { const size = Math.min(w, h) * 0.8; return { x: (w - size) / 2, y: (h - size) / 2, size, guessed: true }; };
  const step = Math.max(1, Math.round(Math.min(w, h) / 160));
  const gw = Math.floor(w / step), gh = Math.floor(h / step);
  const lum = new Uint8Array(gw * gh);
  for (let gy = 0; gy < gh; gy++) {
    for (let gx = 0; gx < gw; gx++) {
      const i = ((gy * step) * w + gx * step) * 4;
      lum[gy * gw + gx] = Math.max(px[i], px[i + 1], px[i + 2]);
    }
  }
  const sorted = Array.from(lum).sort((a, b) => a - b);
  const cut = Math.min(80, Math.max(30, sorted[Math.floor(sorted.length / 2)] * 0.42));
  const dark = new Uint8Array(gw * gh);
  for (let k = 0; k < lum.length; k++) if (lum[k] < cut) dark[k] = 1;
  const seen = new Uint8Array(gw * gh);
  const queue = new Int32Array(gw * gh);
  let best = null;
  for (let start = 0; start < gw * gh; start++) {
    if (!dark[start] || seen[start]) continue;
    let head = 0, tail = 0, area = 0, x0 = gw, x1 = 0, y0 = gh, y1 = 0;
    queue[tail++] = start; seen[start] = 1;
    while (head < tail) {
      const k = queue[head++], x = k % gw, y = (k - x) / gw;
      area++;
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      const nb = [k - 1, k + 1, k - gw, k + gw];
      for (let j = 0; j < 4; j++) {
        const n = nb[j];
        if (n < 0 || n >= gw * gh) continue;
        if ((j === 0 && x === 0) || (j === 1 && x === gw - 1)) continue;
        if (dark[n] && !seen[n]) { seen[n] = 1; queue[tail++] = n; }
      }
    }
    const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
    if (bw < gw * 0.12 || bh < gh * 0.08) continue;
    const ratio = bw / bh;
    if (ratio < 0.7 || ratio > 1.45) continue;
    const touches = x0 === 0 || y0 === 0 || x1 === gw - 1 || y1 === gh - 1;
    const fill = area / (bw * bh);
    if (fill > 0.85) continue; // a solid dark blob is not a sticker grid
    const cx = (x0 + x1) / 2 / gw - 0.5, cy = (y0 + y1) / 2 / gh - 0.5;
    const score = Math.sqrt(bw * bh) / Math.min(gw, gh) - Math.hypot(cx, cy) * 0.8 - (touches ? 0.5 : 0);
    if (!best || score > best.score) best = { score, x0, x1, y0, y1 };
  }
  if (!best) return fallback();
  const x = best.x0 * step, y = best.y0 * step;
  const bw = (best.x1 - best.x0 + 1) * step, bh = (best.y1 - best.y0 + 1) * step;
  const size = Math.max(bw, bh);
  return { x: x + bw / 2 - size / 2, y: y + bh / 2 - size / 2, size };
}



