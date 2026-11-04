// ===== Words, in every language =====
// STRINGS[key] = { en, he, pl }. A value is a string with {name} placeholders, a plural set
// ({ one, two, few, many, other }; other is required), or a per-color set (W Y R O B G). Sets may
// nest either way. t(key, vars) picks the current language, falls back to English, fills {color}
// and {Color} with the color's name, and every other {name} from vars. No DOM in this file.
const LANGS = { en: { name: 'English', dir: 'ltr' } };
let lang = 'en';
const useLang = (code) => { lang = code; };
const PLURALS = {};
function pluralOf(n) {
  if (n === undefined) return 'other';
  try { return (PLURALS[lang] || (PLURALS[lang] = new Intl.PluralRules(lang))).select(n); } catch (e) { return 'other'; }
}
function t(key, vars = {}) {
  const entry = STRINGS[key];
  if (!entry) return key;
  let v = entry[lang] !== undefined ? entry[lang] : entry.en;
  while (v && typeof v === 'object') {
    if (vars.color in v) v = v[vars.color];
    else { const c = pluralOf(vars.n); v = v[c] !== undefined ? v[c] : v.other; }
  }
  if (typeof v !== 'string') return key;
  return v.replace(/\{(\w+)\}/g, (m, k) => {
    if (k === 'color' || k === 'Color') {
      if (!vars.color) return m;
      const name = t('colorName', { color: vars.color });
      return k === 'Color' ? name.charAt(0).toUpperCase() + name.slice(1) : name;
    }
    return k in vars ? String(vars[k]) : m;
  });
}
const MOVE_TEXT = {
  "R":  { en: ['Right side up', 'Turn the right side up, away from you.'] },
  "R'": { en: ['Right side down', 'Turn the right side down, toward you.'] },
  "R2": { en: ['Right side, two turns', 'Turn the right side two turns. Either way works.'] },
  "L":  { en: ['Left side down', 'Turn the left side down, toward you.'] },
  "L'": { en: ['Left side up', 'Turn the left side up, away from you.'] },
  "L2": { en: ['Left side, two turns', 'Turn the left side two turns. Either way works.'] },
  "U":  { en: ['Top to the left', 'Turn the top layer to the left.'] },
  "U'": { en: ['Top to the right', 'Turn the top layer to the right.'] },
  "U2": { en: ['Top, two turns', 'Turn the top layer two turns. Either way works.'] },
  "D":  { en: ['Bottom to the right', 'Turn the bottom layer to the right.'] },
  "D'": { en: ['Bottom to the left', 'Turn the bottom layer to the left.'] },
  "D2": { en: ['Bottom, two turns', 'Turn the bottom layer two turns. Either way works.'] },
  "F":  { en: ['Front like a clock', 'Turn the front the way a clock’s hands go.'] },
  "F'": { en: ['Front the other way', 'Turn the front against a clock’s hands.'] },
  "F2": { en: ['Front, two turns', 'Turn the front two turns. Either way works.'] },
  "B":  { en: ['Back layer, top goes left', 'Turn the back layer so its top row goes to the left.'] },
  "B'": { en: ['Back layer, top goes right', 'Turn the back layer so its top row goes to the right.'] },
  "B2": { en: ['Back layer, two turns', 'Turn the back layer two turns. Either way works.'] },
};
const moveText = (m) => MOVE_TEXT[m][lang] || MOVE_TEXT[m].en;

const STRINGS = {
  colorName: { en: { W: 'white', Y: 'yellow', R: 'red', O: 'orange', B: 'blue', G: 'green' } },
};
