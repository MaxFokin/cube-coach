// ===== Start =====
let restartArmed = false, restartTimer = null;
function disarm() { restartArmed = false; clearTimeout(restartTimer); restartBtn.textContent = t('startOver'); restartBtn.classList.remove('armed'); }
restartBtn.addEventListener('click', () => {
  if (!restartArmed) {
    restartArmed = true;
    restartBtn.textContent = t('startOverArmed');
    restartBtn.classList.add('armed');
    restartTimer = setTimeout(disarm, 2600);
    return;
  }
  disarm();
  resetAll();
  go('welcome');
});

themeBtn.addEventListener('click', () => { setTheme(isDark() ? 'light' : 'dark'); paintTheme(); });
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', paintTheme);

let resizeTimer = null;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    const base = computeS();
    if (cam.el) return;
    if ((model.N === 2 ? base : Math.round(base * 2 / 3)) !== S) { stopLoops(); buildCube(); render(false); }
  }, 200);
});

let savedLang = null;
try { savedLang = localStorage.getItem(LANG_KEY); } catch (e) { /* storage unavailable */ }
applyLang(Object.keys(LANGS).includes(savedLang) ? savedLang : phoneLang());
disarm();
restore();
useModel(app.cube);
if (app.cube === 3 && app.screen !== 'welcome') preloadSolver().catch(() => {});
render(false);
