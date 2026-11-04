// ===== Copy a side with the camera =====
// Live camera when the page may use it; otherwise the phone's own camera through a photo.
// Pictures are read right here on the device and never leave it.
const CAM_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M8.5 5.5 9.8 3.8c.3-.4.7-.6 1.2-.6h2c.5 0 .9.2 1.2.6l1.3 1.7H19a2.5 2.5 0 0 1 2.5 2.5v9A2.5 2.5 0 0 1 19 19.5H5A2.5 2.5 0 0 1 2.5 17V8A2.5 2.5 0 0 1 5 5.5z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/><circle cx="12" cy="12.4" r="3.7" fill="none" stroke="currentColor" stroke-width="1.9"/></svg>';
const camRefs = {};
let liveBlocked = false;
const cam = { el: null, mode: null, stream: null, video: null, photo: null, canvas: null, ctx: null, raf: 0, last: 0, hist: [], reads: null, pan: { x: 0, y: 0 }, zoom: 1, place: null, guide: null, dpr: 1, pointers: new Map(), dirty: false };
const work = document.createElement('canvas');
const workCtx = work.getContext('2d', { willReadFrequently: true });

function camText(k) {
  if (!is3()) {
    return [`Photo of side ${k + 1}`, k === 0 ? 'Fit the side inside the square, with the top you picked at the top.' : 'Same top as before. Fit the side inside the square.'];
  }
  const name = faceName3(k);
  if (k <= 3) return [`Photo of the ${name} side`, `${cap(name)} in the middle square, white at the top.`];
  if (k === 4) return ['Photo of the white side', 'White in the middle square, green at the bottom.'];
  return ['Photo of the yellow side', 'Yellow in the middle square, green at the top.'];
}

function openCamera() {
  closeCamera();
  const k = app.side, N = is3() ? 3 : 2;
  const [title, hint] = camText(k);
  const el = document.createElement('div');
  el.className = 'cam';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-labelledby', 'cam-title');
  const center = is3() ? HEX[CENTER3[STEPS3[k]]] : '';
  const strip = is3() && k === 4 ? ' strip-bottom' : is3() && k === 5 ? ' strip-top' : '';
  el.innerHTML = `
    <div class="cam-head"><h2 id="cam-title">${title}</h2><p>${hint}</p></div>
    <div class="cam-view" id="cam-view">
      <video id="cam-video" playsinline muted autoplay hidden></video>
      <canvas id="cam-canvas" hidden></canvas>
      <div class="cam-guide n${N}${strip}" id="cam-guide" aria-hidden="true">${Array.from({ length: N * N }, (_, c) =>
        `<span class="g-cell${is3() && c === 4 ? ' g-center' : ''}" ${is3() && c === 4 ? `style="--expect:${center}"` : ''}><i></i></span>`).join('')}</div>
      <div class="cam-msg" id="cam-msg"><p>Starting the camera…</p></div>
    </div>
    <p class="cam-tip" id="cam-tip" aria-live="polite">Bright room, no flash. Hold the phone a hand away.</p>
    <div class="cam-actions">
      <button class="btn" id="cam-cancel" type="button">Cancel</button>
      <button class="btn primary wide" id="cam-use" type="button" disabled>Use these colors</button>
    </div>`;
  document.body.appendChild(el);
  document.body.classList.add('cam-open');
  cam.el = el;
  cam.mode = null;
  cam.hist = [];
  cam.reads = null;
  cam.canvas = el.querySelector('#cam-canvas');
  cam.ctx = cam.canvas.getContext('2d');
  cam.video = el.querySelector('#cam-video');
  el.querySelector('#cam-cancel').addEventListener('click', closeCamera);
  el.querySelector('#cam-use').addEventListener('click', useReadings);
  // Photos come in through real file inputs laid over the photo buttons. A tap lands on the
  // input itself, which phones honor even where a script-triggered click is ignored.
  el.addEventListener('change', (e) => {
    if (!e.target.classList.contains('pick-input')) return;
    const f = e.target.files && e.target.files[0];
    e.target.value = '';
    clearTimeout(cam.pickTimer);
    if (f) loadPhoto(f);
  });
  el.addEventListener('click', (e) => {
    if (!e.target.classList || !e.target.classList.contains('pick-input')) return;
    clearTimeout(cam.pickTimer);
    let left = false;
    const away = () => { left = true; };
    window.addEventListener('blur', away, { once: true });
    document.addEventListener('visibilitychange', away, { once: true });
    cam.pickTimer = setTimeout(() => {
      window.removeEventListener('blur', away);
      document.removeEventListener('visibilitychange', away);
      if (!left && cam.el && cam.mode !== 'photo') {
        setTip('Nothing opened? This app may block photos here. Open the page in your phone’s browser, or tap Cancel and tap the colors in.');
      }
    }, 2500);
  });
  const view = el.querySelector('#cam-view');
  view.addEventListener('pointerdown', onPointerDown);
  view.addEventListener('pointermove', onPointerMove);
  ['pointerup', 'pointercancel', 'pointerleave'].forEach((t) => view.addEventListener(t, onPointerUp));
  el.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeCamera(); });
  layoutCam();
  el.querySelector('#cam-cancel').focus();
  if (!liveBlocked && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) startLive();
  else askForPhoto('This page can’t use the live camera here, so take a photo instead.');
}

function closeCamera() {
  clearTimeout(cam.pickTimer);
  cancelAnimationFrame(cam.raf);
  cam.raf = 0;
  if (cam.stream) cam.stream.getTracks().forEach((t) => t.stop());
  cam.stream = null;
  cam.photo = null;
  cam.pointers.clear();
  if (cam.el) cam.el.remove();
  cam.el = null;
  document.body.classList.remove('cam-open');
}

function setMsg(html) {
  const m = cam.el && cam.el.querySelector('#cam-msg');
  if (!m) return;
  m.hidden = !html;
  m.innerHTML = html || '';
  cam.el.querySelector('#cam-guide').style.visibility = html ? 'hidden' : '';
}
function setTip(text) { const t = cam.el && cam.el.querySelector('#cam-tip'); if (t) t.textContent = text; }

function layoutCam() {
  if (!cam.el) return;
  const view = cam.el.querySelector('#cam-view');
  const r = view.getBoundingClientRect();
  const size = Math.round(Math.min(r.width, r.height) * 0.74);
  cam.guide = { x: (r.width - size) / 2, y: (r.height - size) / 2, size, vw: r.width, vh: r.height };
  const g = cam.el.querySelector('#cam-guide');
  Object.assign(g.style, { left: cam.guide.x + 'px', top: cam.guide.y + 'px', width: size + 'px', height: size + 'px' });
  cam.dpr = Math.min(2, window.devicePixelRatio || 1);
  cam.canvas.width = Math.round(r.width * cam.dpr);
  cam.canvas.height = Math.round(r.height * cam.dpr);
  if (cam.mode === 'photo') drawPhoto();
}

async function startLive() {
  const el = cam.el; // the sheet this request belongs to; a cancelled sheet's camera must not leak
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 1280 } } });
    if (cam.el !== el) { stream.getTracks().forEach((t) => t.stop()); return; }
    cam.stream = stream;
    cam.video.srcObject = stream;
    cam.video.hidden = false;
    await cam.video.play();
    cam.mode = 'live';
    setMsg('');
    tick();
  } catch (e) {
    if (cam.el !== el) return;
    if (cam.stream) cam.stream.getTracks().forEach((t) => t.stop());
    cam.stream = null;
    const denied = e && e.name === 'NotAllowedError';
    liveBlocked = denied; // a busy or missing camera is worth another try on the next side
    cam.video.hidden = true;
    askForPhoto(denied ? 'The live camera isn’t allowed here, so take a photo instead.' : 'The live camera didn’t start, so take a photo instead.');
  }
}

function pickHTML(label, cls, capture) {
  const name = label.replace(/<[^>]*>/g, '');
  return `<label class="pick ${cls}">${label}<input class="pick-input" type="file" accept="image/*"${capture ? ' capture="environment"' : ''} aria-label="${name}"></label>`;
}

function askForPhoto(why) {
  cam.mode = 'ask';
  setMsg(`<p>${why}</p><p class="cam-small">Get close, so the side fills most of the photo.</p>` +
    `<div class="picks">${pickHTML(CAM_ICON + 'Take a photo', 'btn primary', true)}${pickHTML('Choose a photo', 'btn', false)}</div>`);
  setTip('Bright room, no flash. Hold the phone straight at the side.');
}

async function decodePhoto(file) {
  try { return await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch (e) { /* try plain */ }
  try { return await createImageBitmap(file); } catch (e) { /* try an image element */ }
  const url = await new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
  const img = new Image();
  img.src = url;
  await img.decode();
  return img;
}

async function loadPhoto(file) {
  setMsg('<p>Reading the photo…</p>');
  let src;
  try { src = await decodePhoto(file); } catch (e) { askForPhoto('That photo didn’t open. Try taking it again.'); return; }
  if (!cam.el) return;
  const iw = src.width || src.naturalWidth, ih = src.height || src.naturalHeight;
  const k = Math.min(1, 1600 / Math.max(iw, ih));
  const c = document.createElement('canvas');
  c.width = Math.round(iw * k);
  c.height = Math.round(ih * k);
  c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
  if (src.close) src.close();
  cam.photo = c;
  cam.mode = 'photo';
  cam.hist = [];
  cam.canvas.hidden = false;
  setMsg('');
  // Start with the cube where it most likely is.
  const small = document.createElement('canvas');
  const sk = Math.min(1, 600 / Math.max(c.width, c.height));
  small.width = Math.round(c.width * sk);
  small.height = Math.round(c.height * sk);
  const sctx = small.getContext('2d', { willReadFrequently: true });
  sctx.drawImage(c, 0, 0, small.width, small.height);
  const box = findFace(sctx.getImageData(0, 0, small.width, small.height).data, small.width, small.height);
  fitBox({ x: box.x / sk, y: box.y / sk, size: box.size / sk });
  setTip('Drag and pinch the photo so the side fits the square.');
  addRetake();
  drawPhoto();
  readNow();
}

function addRetake() {
  if (cam.el.querySelector('.cam-retake')) return;
  const b = document.createElement('label');
  b.className = 'cam-retake pick';
  b.innerHTML = `${CAM_ICON}<span>Retake</span><input class="pick-input" type="file" accept="image/*" capture="environment" aria-label="Retake the photo">`;
  cam.el.querySelector('#cam-view').appendChild(b);
}

function baseScale() { return Math.max(cam.canvas.width / cam.photo.width, cam.canvas.height / cam.photo.height); }
function fitBox(box) {
  const g = cam.guide, d = cam.dpr, base = baseScale();
  const s = Math.min(base * 6, Math.max(base * 0.4, (g.size * d) / box.size));
  cam.zoom = s / base;
  const dw = cam.photo.width * s, dh = cam.photo.height * s;
  const ox = (g.x + g.size / 2) * d - (box.x + box.size / 2) * s;
  const oy = (g.y + g.size / 2) * d - (box.y + box.size / 2) * s;
  cam.pan = { x: (ox - (cam.canvas.width - dw) / 2) / d, y: (oy - (cam.canvas.height - dh) / 2) / d };
}
function drawPhoto() {
  if (!cam.photo) return;
  const cw = cam.canvas.width, ch = cam.canvas.height, s = baseScale() * cam.zoom;
  const dw = cam.photo.width * s, dh = cam.photo.height * s;
  const ox = (cw - dw) / 2 + cam.pan.x * cam.dpr, oy = (ch - dh) / 2 + cam.pan.y * cam.dpr;
  cam.ctx.fillStyle = '#000';
  cam.ctx.fillRect(0, 0, cw, ch);
  cam.ctx.drawImage(cam.photo, ox, oy, dw, dh);
  cam.place = { s, ox, oy };
}

function onPointerDown(e) {
  if (cam.mode !== 'photo' || (e.target.closest && e.target.closest('.pick'))) return;
  e.currentTarget.setPointerCapture(e.pointerId);
  cam.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
}
function onPointerMove(e) {
  if (cam.mode !== 'photo' || !cam.pointers.has(e.pointerId)) return;
  const prev = cam.pointers.get(e.pointerId), cur = { x: e.clientX, y: e.clientY };
  if (cam.pointers.size === 1) {
    cam.pan.x += cur.x - prev.x;
    cam.pan.y += cur.y - prev.y;
  } else {
    const other = [...cam.pointers.entries()].find(([id]) => id !== e.pointerId)[1];
    const d0 = Math.hypot(prev.x - other.x, prev.y - other.y), d1 = Math.hypot(cur.x - other.x, cur.y - other.y);
    if (d0 > 10) {
      const z = Math.min(6, Math.max(0.4, cam.zoom * (d1 / d0)));
      const f = z / cam.zoom;
      cam.pan.x *= f; cam.pan.y *= f;
      cam.zoom = z;
    }
  }
  cam.pointers.set(e.pointerId, cur);
  if (!cam.dirty) {
    cam.dirty = true;
    requestAnimationFrame(() => { cam.dirty = false; drawPhoto(); readNow(); });
  }
}
function onPointerUp(e) { cam.pointers.delete(e.pointerId); }

// Where the guide square sits in the picture's own pixels.
function guideInSource() {
  const g = cam.guide;
  if (cam.mode === 'live') {
    const iw = cam.video.videoWidth, ih = cam.video.videoHeight;
    if (!iw || !ih) return null;
    const s = Math.max(g.vw / iw, g.vh / ih);
    const ox = (g.vw - iw * s) / 2, oy = (g.vh - ih * s) / 2;
    return { src: cam.video, x: (g.x - ox) / s, y: (g.y - oy) / s, size: g.size / s };
  }
  if (cam.mode === 'photo' && cam.place) {
    const d = cam.dpr, p = cam.place;
    return { src: cam.photo, x: (g.x * d - p.ox) / p.s, y: (g.y * d - p.oy) / p.s, size: (g.size * d) / p.s };
  }
  return null;
}

function tick() {
  if (!cam.el || cam.mode !== 'live') return;
  cam.raf = requestAnimationFrame(tick);
  const now = performance.now();
  if (now - cam.last < 180) return;
  cam.last = now;
  readNow();
}

function readNow() {
  const r = guideInSource();
  if (!r) return;
  const W = 240, N = is3() ? 3 : 2;
  work.width = work.height = W;
  workCtx.fillStyle = '#000';
  workCtx.fillRect(0, 0, W, W);
  try { workCtx.drawImage(r.src, r.x, r.y, r.size, r.size, 0, 0, W, W); } catch (e) { return; }
  const px = workCtx.getImageData(0, 0, W, W).data;
  const reads = readFace(px, W, W, { x: 0, y: 0, size: W }, N, camRefs);
  // Live view: steady out flicker by voting over the last few looks.
  cam.hist.push(reads);
  if (cam.hist.length > (cam.mode === 'live' ? 4 : 1)) cam.hist.shift();
  cam.reads = reads.map((r0, c) => {
    const votes = {};
    cam.hist.forEach((h) => { const col = h[c].color; votes[col] = (votes[col] || 0) + 1; });
    const [best, n] = Object.entries(votes).sort((a, b) => b[1] - a[1])[0];
    const color = best === 'null' ? null : best;
    return { ...r0, color, sure: r0.sure && n === cam.hist.length && color === r0.color };
  });
  showReads();
}

function showReads() {
  const reads = cam.reads, k = app.side;
  cam.el.querySelectorAll('#cam-guide .g-cell').forEach((cell, c) => {
    const r = reads[c], dot = cell.firstElementChild;
    dot.style.background = r.color ? HEX[r.color] : 'transparent';
    cell.classList.toggle('unsure', !!r.color && !r.sure);
    cell.classList.toggle('empty', !r.color);
  });
  const missing = reads.some((r) => !r.color);
  const expect = is3() ? CENTER3[STEPS3[k]] : null;
  const offCenter = is3() && reads[4].color && reads[4].color !== expect;
  const shiny = reads.some((r) => r.why === 'shiny');
  const unsure = reads.some((r, c) => !r.sure && !(is3() && c === 4));
  cam.el.querySelector('#cam-use').disabled = missing;
  if (missing) setTip(cam.mode === 'photo' ? 'Drag and pinch the photo so the side fills the square.' : 'Move closer so the side fills the square.');
  else if (offCenter) setTip(`Put the ${faceName3(k)} middle in the middle square.`);
  else if (shiny) setTip('A square looks shiny. Tilt the cube a little, away from the light.');
  else if (unsure) setTip(cam.mode === 'live' ? 'Hold still for a moment.' : 'I’m not sure about the dotted squares. You can fix them after.');
  else setTip('Looks good! Tap “Use these colors”.');
}

function useReadings() {
  if (!cam.reads) return;
  const k = app.side, row = entryNow()[k];
  const doubts = [];
  cam.reads.forEach((r, c) => {
    if (is3() && c === 4) return;
    if (r.color) row[c] = r.color;
    if (!r.sure) doubts.push({ k, c });
  });
  // The middle square's real color is known on a 3x3: remember how this light shows it.
  if (is3()) {
    const mid = cam.reads[4], expect = CENTER3[STEPS3[k]];
    if (mid && mid.color === expect && mid.hue !== undefined && mid.sat >= 0.4) camRefs[expect] = mid.hue;
  }
  app.unsure = app.unsure.filter((u) => u.k !== k).concat(doubts);
  app.flags = app.flags.filter((f) => f.k !== k);
  closeCamera();
  save();
  refreshSide();
  const first = panelEl.querySelector('#next') || panelEl.querySelector('#check');
  if (first) first.focus();
}

window.addEventListener('resize', () => { if (cam.el) { layoutCam(); if (cam.mode === 'photo') readNow(); } });
document.addEventListener('visibilitychange', () => { if (document.hidden && cam.mode === 'live') closeCamera(); });

