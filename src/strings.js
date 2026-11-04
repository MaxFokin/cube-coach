// ===== Words, in every language =====
// STRINGS[key] = { en, he, pl }. A value is a string with {name} placeholders, a plural set
// ({ one, two, few, many, other }; other is required), or a per-color set (W Y R O B G). Sets may
// nest either way. t(key, vars) picks the current language, falls back to English, fills {color}
// and {Color} with the color's name, and every other {name} from vars. No DOM in this file.
const LANGS = { en: { name: 'English', dir: 'ltr' }, he: { name: 'עברית', dir: 'rtl' }, pl: { name: 'Polski', dir: 'ltr' } };
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
  "R": {
    en: ['Right side up', 'Turn the right side up, away from you.'],
    he: ['הצד הימני למעלה', 'סובב את הצד הימני למעלה, ממך והלאה.'],    pl: ['Prawa strona w górę', 'Obróć prawą stronę w górę, od siebie.'],
  },
  "R'": {
    en: ['Right side down', 'Turn the right side down, toward you.'],
    he: ['הצד הימני למטה', 'סובב את הצד הימני למטה, אליך.'],    pl: ['Prawa strona w dół', 'Obróć prawą stronę w dół, do siebie.'],
  },
  "R2": {
    en: ['Right side, two turns', 'Turn the right side two turns. Either way works.'],
    he: ['הצד הימני, שני סיבובים', 'סובב את הצד הימני שני סיבובים. כל כיוון עובד.'],    pl: ['Prawa strona, dwa obroty', 'Obróć prawą stronę dwa razy. Obojętnie w którą stronę.'],
  },
  "L": {
    en: ['Left side down', 'Turn the left side down, toward you.'],
    he: ['הצד השמאלי למטה', 'סובב את הצד השמאלי למטה, אליך.'],    pl: ['Lewa strona w dół', 'Obróć lewą stronę w dół, do siebie.'],
  },
  "L'": {
    en: ['Left side up', 'Turn the left side up, away from you.'],
    he: ['הצד השמאלי למעלה', 'סובב את הצד השמאלי למעלה, ממך והלאה.'],    pl: ['Lewa strona w górę', 'Obróć lewą stronę w górę, od siebie.'],
  },
  "L2": {
    en: ['Left side, two turns', 'Turn the left side two turns. Either way works.'],
    he: ['הצד השמאלי, שני סיבובים', 'סובב את הצד השמאלי שני סיבובים. כל כיוון עובד.'],    pl: ['Lewa strona, dwa obroty', 'Obróć lewą stronę dwa razy. Obojętnie w którą stronę.'],
  },
  "U": {
    en: ['Top to the left', 'Turn the top layer to the left.'],
    he: ['החלק העליון שמאלה', 'סובב את השכבה העליונה שמאלה.'],    pl: ['Góra w lewo', 'Obróć górną warstwę w lewo.'],
  },
  "U'": {
    en: ['Top to the right', 'Turn the top layer to the right.'],
    he: ['החלק העליון ימינה', 'סובב את השכבה העליונה ימינה.'],    pl: ['Góra w prawo', 'Obróć górną warstwę w prawo.'],
  },
  "U2": {
    en: ['Top, two turns', 'Turn the top layer two turns. Either way works.'],
    he: ['החלק העליון, שני סיבובים', 'סובב את השכבה העליונה שני סיבובים. כל כיוון עובד.'],    pl: ['Góra, dwa obroty', 'Obróć górną warstwę dwa razy. Obojętnie w którą stronę.'],
  },
  "D": {
    en: ['Bottom to the right', 'Turn the bottom layer to the right.'],
    he: ['החלק התחתון ימינה', 'סובב את השכבה התחתונה ימינה.'],    pl: ['Dół w prawo', 'Obróć dolną warstwę w prawo.'],
  },
  "D'": {
    en: ['Bottom to the left', 'Turn the bottom layer to the left.'],
    he: ['החלק התחתון שמאלה', 'סובב את השכבה התחתונה שמאלה.'],    pl: ['Dół w lewo', 'Obróć dolną warstwę w lewo.'],
  },
  "D2": {
    en: ['Bottom, two turns', 'Turn the bottom layer two turns. Either way works.'],
    he: ['החלק התחתון, שני סיבובים', 'סובב את השכבה התחתונה שני סיבובים. כל כיוון עובד.'],    pl: ['Dół, dwa obroty', 'Obróć dolną warstwę dwa razy. Obojętnie w którą stronę.'],
  },
  "F": {
    en: ['Front like a clock', 'Turn the front the way a clock’s hands go.'],
    he: ['הצד הקדמי כמו שעון', 'סובב את הצד הקדמי בכיוון מחוגי השעון.'],    pl: ['Przód jak zegar', 'Obróć przód tak, jak idą wskazówki zegara.'],
  },
  "F'": {
    en: ['Front the other way', 'Turn the front against a clock’s hands.'],
    he: ['הצד הקדמי הפוך משעון', 'סובב את הצד הקדמי נגד כיוון מחוגי השעון.'],    pl: ['Przód w drugą stronę', 'Obróć przód przeciwnie do wskazówek zegara.'],
  },
  "F2": {
    en: ['Front, two turns', 'Turn the front two turns. Either way works.'],
    he: ['הצד הקדמי, שני סיבובים', 'סובב את הצד הקדמי שני סיבובים. כל כיוון עובד.'],    pl: ['Przód, dwa obroty', 'Obróć przód dwa razy. Obojętnie w którą stronę.'],
  },
  "B": {
    en: ['Back layer, top goes left', 'Turn the back layer so its top row goes to the left.'],
    he: ['השכבה האחורית, למעלה שמאלה', 'סובב את השכבה האחורית כך שהשורה העליונה שלה זזה שמאלה.'],    pl: ['Tylna warstwa, góra idzie w lewo', 'Obróć tylną warstwę tak, aby jej górny rząd poszedł w lewo.'],
  },
  "B'": {
    en: ['Back layer, top goes right', 'Turn the back layer so its top row goes to the right.'],
    he: ['השכבה האחורית, למעלה ימינה', 'סובב את השכבה האחורית כך שהשורה העליונה שלה זזה ימינה.'],    pl: ['Tylna warstwa, góra idzie w prawo', 'Obróć tylną warstwę tak, aby jej górny rząd poszedł w prawo.'],
  },
  "B2": {
    en: ['Back layer, two turns', 'Turn the back layer two turns. Either way works.'],
    he: ['השכבה האחורית, שני סיבובים', 'סובב את השכבה האחורית שני סיבובים. כל כיוון עובד.'],    pl: ['Tylna warstwa, dwa obroty', 'Obróć tylną warstwę dwa razy. Obojętnie w którą stronę.'],
  },
};
const moveText = (m) => MOVE_TEXT[m][lang] || MOVE_TEXT[m].en;

const STRINGS = {
  // Colors and squares
  colorName: {
    en: { W: 'white', Y: 'yellow', R: 'red', O: 'orange', B: 'blue', G: 'green' },
    he: { W: 'לבן', Y: 'צהוב', R: 'אדום', O: 'כתום', B: 'כחול', G: 'ירוק' },    pl: { W: 'biały', Y: 'żółty', R: 'czerwony', O: 'pomarańczowy', B: 'niebieski', G: 'zielony' },
  },
  colors: {
    en: 'Colors',
    he: 'צבעים',    pl: 'Kolory',
  },
  sqTopLeft: {
    en: 'Top left',
    he: 'שמאל למעלה',    pl: 'Lewe górne',
  },
  sqTopMiddle: {
    en: 'Top middle',
    he: 'אמצע למעלה',    pl: 'Środkowe górne',
  },
  sqTopRight: {
    en: 'Top right',
    he: 'ימין למעלה',    pl: 'Prawe górne',
  },
  sqMiddleLeft: {
    en: 'Middle left',
    he: 'שמאל באמצע',    pl: 'Lewe środkowe',
  },
  sqMiddle: {
    en: 'Middle',
    he: 'אמצע',    pl: 'Środkowe',
  },
  sqMiddleRight: {
    en: 'Middle right',
    he: 'ימין באמצע',    pl: 'Prawe środkowe',
  },
  sqBottomLeft: {
    en: 'Bottom left',
    he: 'שמאל למטה',    pl: 'Lewe dolne',
  },
  sqBottomMiddle: {
    en: 'Bottom middle',
    he: 'אמצע למטה',    pl: 'Środkowe dolne',
  },
  sqBottomRight: {
    en: 'Bottom right',
    he: 'ימין למטה',    pl: 'Prawe dolne',
  },
  squareLabel: {
    en: '{square} square: {state}',
    he: 'ריבוע {square}: {state}',    pl: 'Pole {square}: {state}',
  },
  notSet: {
    en: 'not set',
    he: 'לא נבחר',    pl: 'nie wybrano',
  },
  middleSquare: {
    en: 'Middle square: {color}',
    he: 'הריבוע האמצעי: {color}',    pl: 'Środkowe pole: {color}',
  },
  sideLabel2: {
    en: 'Side {n}',
    he: 'צד {n}',    pl: 'Strona {n}',
  },
  sideLabel3: {
    en: '{Color} side',
    he: { W: 'הצד הלבן', Y: 'הצד הצהוב', R: 'הצד האדום', O: 'הצד הכתום', B: 'הצד הכחול', G: 'הצד הירוק' },    pl: { W: 'Biała strona', Y: 'Żółta strona', R: 'Czerwona strona', O: 'Pomarańczowa strona', B: 'Niebieska strona', G: 'Zielona strona' },
  },
  and: {
    en: ' and ',
    he: ' ו',    pl: ' i ',
  },
  // Header
  startOver: {
    en: 'Start over',
    he: 'להתחיל מחדש',    pl: 'Od nowa',
  },
  startOverArmed: {
    en: 'Tap again to start over',
    he: 'עוד לחיצה כדי להתחיל מחדש',    pl: 'Dotknij znów: od nowa',
  },
  // Welcome
  welcomeTitle: {
    en: 'Let’s solve your cube',
    he: 'בוא נפתור את הקובייה שלך',    pl: 'Ułóżmy twoją kostkę',
  },
  welcomeLead: {
    en: 'Copy your cube’s colors and I’ll show you every turn. Which cube do you have?',
    he: 'העתק את צבעי הקובייה שלך ואני אראה לך כל סיבוב. איזו קובייה יש לך?',    pl: 'Skopiuj kolory swojej kostki, a pokażę ci każdy ruch. Którą kostkę masz?',
  },
  tile2: {
    en: 'Copy 4 sides',
    he: 'העתק 4 צדדים',    pl: 'Skopiuj 4 strony',
  },
  tile3: {
    en: 'Copy all 6 sides',
    he: 'העתק את כל 6 הצדדים',    pl: 'Skopiuj wszystkie 6 stron',
  },
  language: {
    en: 'Language',
    he: 'שפה',    pl: 'Język',
  },
  // Copying a side
  sideOf: {
    en: 'Side {n} of {total}',
    he: 'צד {n} מתוך {total}',    pl: 'Strona {n} z {total}',
  },
  fixLine: {
    en: 'Fix any square that’s wrong.',
    he: 'תקן כל ריבוע שלא נכון.',    pl: 'Popraw każde złe pole.',
  },
  side2FixTitle: {
    en: 'Check side {n}',
    he: 'בדוק את צד {n}',    pl: 'Sprawdź stronę {n}',
  },
  side2FixLead: {
    en: 'Turn your cube until this side faces you, like the picture.',
    he: 'סובב את הקובייה עד שהצד הזה מול הפנים שלך, כמו בתמונה.',    pl: 'Obracaj kostkę, aż ta strona będzie przed tobą, jak na obrazku.',
  },
  side2Review0Title: {
    en: 'Back to side 1',
    he: 'חזרה לצד 1',    pl: 'Wróć do strony 1',
  },
  side2Review0Lead: {
    en: 'Turn your cube until side 1 faces you, like the picture.',
    he: 'סובב את הקובייה עד שצד 1 מול הפנים שלך, כמו בתמונה.',    pl: 'Obracaj kostkę, aż strona 1 będzie przed tobą, jak na obrazku.',
  },
  side2First0Title: {
    en: 'Pick a side to start',
    he: 'בחר צד להתחיל ממנו',    pl: 'Wybierz stronę na początek',
  },
  side2First0Lead: {
    en: 'Hold any side facing you. Keep the same side on top from now on.',
    he: 'החזק צד כלשהו מול הפנים שלך. מעכשיו שמור על אותו צד למעלה.',    pl: 'Trzymaj dowolną stronę przed sobą. Ta sama strona zostaje na górze.',
  },
  side2NextTitle: {
    en: 'Turn the cube to the left',
    he: 'סובב את הקובייה שמאלה',    pl: 'Obróć kostkę w lewo',
  },
  side2NextLead: {
    en: 'Keep the same side on top. Copy the side that’s facing you now.',
    he: 'שמור על אותו צד למעלה. העתק את הצד שמול הפנים שלך עכשיו.',    pl: 'Ta sama strona zostaje na górze. Skopiuj stronę, która jest teraz przed tobą.',
  },
  side3FixTitle: {
    en: 'Check the {color} side',
    he: { W: 'בדוק את הצד הלבן', Y: 'בדוק את הצד הצהוב', R: 'בדוק את הצד האדום', O: 'בדוק את הצד הכתום', B: 'בדוק את הצד הכחול', G: 'בדוק את הצד הירוק' },    pl: { W: 'Sprawdź białą stronę', Y: 'Sprawdź żółtą stronę', R: 'Sprawdź czerwoną stronę', O: 'Sprawdź pomarańczową stronę', B: 'Sprawdź niebieską stronę', G: 'Sprawdź zieloną stronę' },
  },
  side3FixLead: {
    en: 'Turn your cube so the {color} middle faces you, like the picture.',
    he: { W: 'סובב את הקובייה כך שהאמצע הלבן מול הפנים שלך, כמו בתמונה.', Y: 'סובב את הקובייה כך שהאמצע הצהוב מול הפנים שלך, כמו בתמונה.', R: 'סובב את הקובייה כך שהאמצע האדום מול הפנים שלך, כמו בתמונה.', O: 'סובב את הקובייה כך שהאמצע הכתום מול הפנים שלך, כמו בתמונה.', B: 'סובב את הקובייה כך שהאמצע הכחול מול הפנים שלך, כמו בתמונה.', G: 'סובב את הקובייה כך שהאמצע הירוק מול הפנים שלך, כמו בתמונה.' },    pl: { W: 'Obróć kostkę tak, aby biały środek był przed tobą, jak na obrazku.', Y: 'Obróć kostkę tak, aby żółty środek był przed tobą, jak na obrazku.', R: 'Obróć kostkę tak, aby czerwony środek był przed tobą, jak na obrazku.', O: 'Obróć kostkę tak, aby pomarańczowy środek był przed tobą, jak na obrazku.', B: 'Obróć kostkę tak, aby niebieski środek był przed tobą, jak na obrazku.', G: 'Obróć kostkę tak, aby zielony środek był przed tobą, jak na obrazku.' },
  },
  side3Review0Title: {
    en: 'Back to green',
    he: 'חזרה לירוק',    pl: 'Wróć do zielonej',
  },
  side3First0Title: {
    en: 'Green faces you',
    he: 'ירוק מול הפנים',    pl: 'Zielona przed tobą',
  },
  side3Lead0: {
    en: 'Hold your cube with the green middle facing you and white on top.',
    he: 'החזק את הקובייה כשהאמצע הירוק מול הפנים שלך והלבן למעלה.',    pl: 'Trzymaj kostkę tak, aby zielony środek był przed tobą, a biały na górze.',
  },
  side3NextTitle: {
    en: 'Turn it to the left',
    he: 'סובב אותה שמאלה',    pl: 'Obróć ją w lewo',
  },
  side3NextLead: {
    en: 'Now the {color} middle faces you. Keep white on top.',
    he: { W: 'עכשיו האמצע הלבן מול הפנים שלך. שמור על לבן למעלה.', Y: 'עכשיו האמצע הצהוב מול הפנים שלך. שמור על לבן למעלה.', R: 'עכשיו האמצע האדום מול הפנים שלך. שמור על לבן למעלה.', O: 'עכשיו האמצע הכתום מול הפנים שלך. שמור על לבן למעלה.', B: 'עכשיו האמצע הכחול מול הפנים שלך. שמור על לבן למעלה.', G: 'עכשיו האמצע הירוק מול הפנים שלך. שמור על לבן למעלה.' },    pl: { W: 'Teraz biały środek jest przed tobą. Biały zostaje na górze.', Y: 'Teraz żółty środek jest przed tobą. Biały zostaje na górze.', R: 'Teraz czerwony środek jest przed tobą. Biały zostaje na górze.', O: 'Teraz pomarańczowy środek jest przed tobą. Biały zostaje na górze.', B: 'Teraz niebieski środek jest przed tobą. Biały zostaje na górze.', G: 'Teraz zielony środek jest przed tobą. Biały zostaje na górze.' },
  },
  side3TopTitle: {
    en: 'Tip it toward you',
    he: 'הטה אותה אליך',    pl: 'Przechyl ją do siebie',
  },
  side3TopLead: {
    en: 'From green, tip the top toward you. Green goes down by the green bar.',
    he: 'מהירוק, הטה את החלק העליון אליך. הירוק יורד למטה, ליד הפס הירוק.',    pl: 'Od zielonej przechyl górę do siebie. Zielona idzie na dół, przy zielonym pasku.',
  },
  side3BottomTitle: {
    en: 'Flip it over',
    he: 'הפוך אותה',    pl: 'Odwróć ją',
  },
  side3BottomLead: {
    en: 'Flip it so yellow faces you and green is at the top, by the green bar.',
    he: 'הפוך אותה כך שהצהוב מול הפנים שלך והירוק למעלה, ליד הפס הירוק.',    pl: 'Odwróć ją tak, aby żółta była przed tobą, a zielona na górze, przy zielonym pasku.',
  },
  photo: {
    en: 'Photo',
    he: 'תמונה',    pl: 'Zdjęcie',
  },
  photoAria: {
    en: 'Copy this side from a photo',
    he: 'העתק את הצד הזה מתמונה',    pl: 'Skopiuj tę stronę ze zdjęcia',
  },
  unsureNote: {
    en: 'I wasn’t sure about the dotted squares. Check them on your cube.',
    he: 'לא הייתי בטוח לגבי הריבועים המקווקווים. בדוק אותם על הקובייה שלך.',    pl: 'Nie mam pewności co do pól z kropkowaną ramką. Sprawdź je na swojej kostce.',
  },
  tooMany: {
    en: { other: 'A cube has only {n} {color} squares, and you have <b>{have}</b>. Look closely at red and orange too.' },
    he: { other: { W: 'בקובייה יש רק {n} ריבועים לבנים, ולך יש <b>{have}</b>. הסתכל טוב גם על אדום וכתום.', Y: 'בקובייה יש רק {n} ריבועים צהובים, ולך יש <b>{have}</b>. הסתכל טוב גם על אדום וכתום.', R: 'בקובייה יש רק {n} ריבועים אדומים, ולך יש <b>{have}</b>. הסתכל טוב גם על אדום וכתום.', O: 'בקובייה יש רק {n} ריבועים כתומים, ולך יש <b>{have}</b>. הסתכל טוב גם על אדום וכתום.', B: 'בקובייה יש רק {n} ריבועים כחולים, ולך יש <b>{have}</b>. הסתכל טוב גם על אדום וכתום.', G: 'בקובייה יש רק {n} ריבועים ירוקים, ולך יש <b>{have}</b>. הסתכל טוב גם על אדום וכתום.' } },    pl: { few: { W: 'Kostka ma tylko {n} białe pola, a ty masz <b>{have}</b>. Przyjrzyj się też czerwonemu i pomarańczowemu.', Y: 'Kostka ma tylko {n} żółte pola, a ty masz <b>{have}</b>. Przyjrzyj się też czerwonemu i pomarańczowemu.', R: 'Kostka ma tylko {n} czerwone pola, a ty masz <b>{have}</b>. Przyjrzyj się też czerwonemu i pomarańczowemu.', O: 'Kostka ma tylko {n} pomarańczowe pola, a ty masz <b>{have}</b>. Przyjrzyj się też czerwonemu i pomarańczowemu.', B: 'Kostka ma tylko {n} niebieskie pola, a ty masz <b>{have}</b>. Przyjrzyj się też czerwonemu i pomarańczowemu.', G: 'Kostka ma tylko {n} zielone pola, a ty masz <b>{have}</b>. Przyjrzyj się też czerwonemu i pomarańczowemu.' }, many: { W: 'Kostka ma tylko {n} białych pól, a ty masz <b>{have}</b>. Przyjrzyj się też czerwonemu i pomarańczowemu.', Y: 'Kostka ma tylko {n} żółtych pól, a ty masz <b>{have}</b>. Przyjrzyj się też czerwonemu i pomarańczowemu.', R: 'Kostka ma tylko {n} czerwonych pól, a ty masz <b>{have}</b>. Przyjrzyj się też czerwonemu i pomarańczowemu.', O: 'Kostka ma tylko {n} pomarańczowych pól, a ty masz <b>{have}</b>. Przyjrzyj się też czerwonemu i pomarańczowemu.', B: 'Kostka ma tylko {n} niebieskich pól, a ty masz <b>{have}</b>. Przyjrzyj się też czerwonemu i pomarańczowemu.', G: 'Kostka ma tylko {n} zielonych pól, a ty masz <b>{have}</b>. Przyjrzyj się też czerwonemu i pomarańczowemu.' }, other: { W: 'Kostka ma tylko {n} białych pól, a ty masz <b>{have}</b>. Przyjrzyj się też czerwonemu i pomarańczowemu.', Y: 'Kostka ma tylko {n} żółtych pól, a ty masz <b>{have}</b>. Przyjrzyj się też czerwonemu i pomarańczowemu.', R: 'Kostka ma tylko {n} czerwonych pól, a ty masz <b>{have}</b>. Przyjrzyj się też czerwonemu i pomarańczowemu.', O: 'Kostka ma tylko {n} pomarańczowych pól, a ty masz <b>{have}</b>. Przyjrzyj się też czerwonemu i pomarańczowemu.', B: 'Kostka ma tylko {n} niebieskich pól, a ty masz <b>{have}</b>. Przyjrzyj się też czerwonemu i pomarańczowemu.', G: 'Kostka ma tylko {n} zielonych pól, a ty masz <b>{have}</b>. Przyjrzyj się też czerwonemu i pomarańczowemu.' } },
  },
  checkAgain: {
    en: 'Check again',
    he: 'בדוק שוב',    pl: 'Sprawdź jeszcze raz',
  },
  back: {
    en: 'Back',
    he: 'חזרה',    pl: 'Wstecz',
  },
  nextSide: {
    en: 'Next side',
    he: 'הצד הבא',    pl: 'Następna strona',
  },
  checkMyCube: {
    en: 'Check my cube',
    he: 'בדוק את הקובייה שלי',    pl: 'Sprawdź moją kostkę',
  },
  replay: {
    en: 'Show the turn again',
    he: 'הראה את הסיבוב שוב',    pl: 'Pokaż obrót jeszcze raz',
  },
  turnedNote: {
    en: 'You copied the {sides} side turned around. I fixed it.',
    he: 'צד {sides} הועתק מסובב. תיקנתי את זה.',    pl: 'Strona w kolorze {sides} była skopiowana obrócona. To już poprawione.',
  },
  // Top and bottom check
  checkTopTitle: {
    en: 'Is this your top?',
    he: 'זה החלק העליון שלך?',    pl: 'Czy to twoja góra?',
  },
  checkBottomTitle: {
    en: 'And is this your bottom?',
    he: 'וזה החלק התחתון שלך?',    pl: 'A to twój spód?',
  },
  turnedRightNote: {
    en: 'You turned your cube to the right. That works too, I sorted it out.',
    he: 'סובבת את הקובייה ימינה. גם זה עובד, סידרתי את זה.',    pl: 'Kostka została obrócona w prawo. To też działa, wszystko się zgadza.',
  },
  checkTopLead: {
    en: 'Turn back to side 1. Then look down at the top of your cube.',
    he: 'חזור לצד 1. אחר כך הסתכל מלמעלה על הקובייה שלך.',    pl: 'Wróć do strony 1. Potem spójrz z góry na swoją kostkę.',
  },
  checkBottomLead: {
    en: 'Tip the top away from you, so the bottom faces you.',
    he: 'הטה את החלק העליון ממך והלאה, כך שהתחתית מול הפנים שלך.',    pl: 'Przechyl górę od siebie, aby spód był przed tobą.',
  },
  edgeTag: {
    en: 'Side 1 is on this edge',
    he: 'צד 1 נמצא בקצה הזה',    pl: 'Strona 1 jest przy tej krawędzi',
  },
  no: {
    en: 'No',
    he: 'לא',    pl: 'Nie',
  },
  yes: {
    en: 'Yes',
    he: 'כן',    pl: 'Tak',
  },
  // Something is wrong
  mismatchTitle: {
    en: 'Then a side got mixed up',
    he: 'אז צד אחד התבלבל',    pl: 'Czyli jakaś strona się pomieszała',
  },
  mismatchLead: {
    en: 'Let’s go through the sides again. Keep the same top as you turn, and look closely at red and orange.',
    he: 'בוא נעבור על הצדדים שוב. שמור על אותו צד למעלה בזמן הסיבוב, והסתכל טוב על אדום וכתום.',    pl: 'Przejdźmy strony jeszcze raz. Trzymaj tę samą górę, gdy obracasz, i przyjrzyj się czerwonemu i pomarańczowemu.',
  },
  checkSides: {
    en: 'Check the sides',
    he: 'בדוק את הצדדים',    pl: 'Sprawdź strony',
  },
  oopsOneTitle: {
    en: 'Check this square',
    he: 'בדוק את הריבוע הזה',    pl: 'Sprawdź to pole',
  },
  oopsOneLead2: {
    en: 'On side {n}, this square doesn’t fit with the others.',
    he: 'בצד {n}, הריבוע הזה לא מסתדר עם האחרים.',    pl: 'Na stronie {n} to pole nie pasuje do reszty.',
  },
  oopsOneLead3: {
    en: 'On the {color} side, this square doesn’t fit with the others.',
    he: { W: 'בהצד הלבן, הריבוע הזה לא מסתדר עם האחרים.', Y: 'בהצד הצהוב, הריבוע הזה לא מסתדר עם האחרים.', R: 'בהצד האדום, הריבוע הזה לא מסתדר עם האחרים.', O: 'בהצד הכתום, הריבוע הזה לא מסתדר עם האחרים.', B: 'בהצד הכחול, הריבוע הזה לא מסתדר עם האחרים.', G: 'בהצד הירוק, הריבוע הזה לא מסתדר עם האחרים.' },    pl: { W: 'Na białej stronie to pole nie pasuje do reszty.', Y: 'Na żółtej stronie to pole nie pasuje do reszty.', R: 'Na czerwonej stronie to pole nie pasuje do reszty.', O: 'Na pomarańczowej stronie to pole nie pasuje do reszty.', B: 'Na niebieskiej stronie to pole nie pasuje do reszty.', G: 'Na zielonej stronie to pole nie pasuje do reszty.' },
  },
  iThink: {
    en: 'I think it’s {color}.',
    he: { W: 'נראה לי שהוא לבן.', Y: 'נראה לי שהוא צהוב.', R: 'נראה לי שהוא אדום.', O: 'נראה לי שהוא כתום.', B: 'נראה לי שהוא כחול.', G: 'נראה לי שהוא ירוק.' },    pl: { W: 'Myślę, że jest białe.', Y: 'Myślę, że jest żółte.', R: 'Myślę, że jest czerwone.', O: 'Myślę, że jest pomarańczowe.', B: 'Myślę, że jest niebieskie.', G: 'Myślę, że jest zielone.' },
  },
  letMeLook: {
    en: 'Let me look',
    he: 'תן לי להסתכל',    pl: 'Niech spojrzę',
  },
  makeIt: {
    en: 'Make it {color}',
    he: { W: 'הפוך אותו ללבן', Y: 'הפוך אותו לצהוב', R: 'הפוך אותו לאדום', O: 'הפוך אותו לכתום', B: 'הפוך אותו לכחול', G: 'הפוך אותו לירוק' },    pl: { W: 'Zrób je białe', Y: 'Zrób je żółte', R: 'Zrób je czerwone', O: 'Zrób je pomarańczowe', B: 'Zrób je niebieskie', G: 'Zrób je zielone' },
  },
  checkSide2: {
    en: 'Check side {n}',
    he: 'בדוק את צד {n}',    pl: 'Sprawdź stronę {n}',
  },
  checkSide3: {
    en: 'Check the {color} side',
    he: { W: 'בדוק את הצד הלבן', Y: 'בדוק את הצד הצהוב', R: 'בדוק את הצד האדום', O: 'בדוק את הצד הכתום', B: 'בדוק את הצד הכחול', G: 'בדוק את הצד הירוק' },    pl: { W: 'Sprawdź białą stronę', Y: 'Sprawdź żółtą stronę', R: 'Sprawdź czerwoną stronę', O: 'Sprawdź pomarańczową stronę', B: 'Sprawdź niebieską stronę', G: 'Sprawdź zieloną stronę' },
  },
  oopsSomeTitle: {
    en: 'One of these is wrong',
    he: 'אחד מאלה לא נכון',    pl: 'Jedno z nich jest złe',
  },
  oopsSomeLead: {
    en: 'One of the marked squares doesn’t match your cube. Let’s go through the sides and look closely at them.',
    he: 'אחד מהריבועים המסומנים לא מתאים לקובייה שלך. בוא נעבור על הצדדים ונסתכל עליהם טוב.',    pl: 'Jedno z zaznaczonych pól nie zgadza się z twoją kostką. Przejdźmy strony i przyjrzyjmy się im.',
  },
  checkMarked: {
    en: 'Check the marked squares',
    he: 'בדוק את הריבועים המסומנים',    pl: 'Sprawdź zaznaczone pola',
  },
  oopsManyTitle: {
    en: 'Some colors got mixed up',
    he: 'כמה צבעים התבלבלו',    pl: 'Jakieś kolory się pomieszały',
  },
  oopsManyLead3: {
    en: 'Let’s go through the sides again. Check that each middle color faces you as shown, and look closely at red and orange.',
    he: 'בוא נעבור על הצדדים שוב. בדוק שכל צבע אמצעי מול הפנים שלך כמו שמוצג, והסתכל טוב על אדום וכתום.',    pl: 'Przejdźmy strony jeszcze raz. Sprawdź, czy każdy środkowy kolor jest przed tobą tak, jak pokazano, i przyjrzyj się czerwonemu i pomarańczowemu.',
  },
  // Working out the moves
  solvingTitle: {
    en: 'Working out the moves',
    he: 'מחשב את המהלכים',    pl: 'Obliczam ruchy',
  },
  solvingLead: {
    en: 'This takes a few seconds the first time.',
    he: 'בפעם הראשונה זה לוקח כמה שניות.',    pl: 'Za pierwszym razem trwa to kilka sekund.',
  },
  solverErrorTitle: {
    en: 'The 3×3 helper didn’t load',
    he: 'העוזר של 3×3 לא נטען',    pl: 'Pomocnik 3×3 się nie wczytał',
  },
  solverErrorLead: {
    en: 'It needs the internet the first time. Check the connection, then try again.',
    he: 'בפעם הראשונה הוא צריך אינטרנט. בדוק את החיבור ונסה שוב.',    pl: 'Za pierwszym razem potrzebuje internetu. Sprawdź połączenie i spróbuj jeszcze raz.',
  },
  tryAgain: {
    en: 'Try again',
    he: 'נסה שוב',    pl: 'Spróbuj jeszcze raz',
  },
  // Hold, moves, done
  alreadySolvedTitle: {
    en: 'It’s already solved!',
    he: 'היא כבר פתורה!',    pl: 'Jest już ułożona!',
  },
  alreadySolvedLead: {
    en: 'Mix it up, then copy it again to practice.',
    he: 'ערבב אותה, ואז העתק אותה שוב כדי להתאמן.',    pl: 'Pomieszaj ją i skopiuj jeszcze raz, żeby poćwiczyć.',
  },
  copyAgain: {
    en: 'Copy my cube again',
    he: 'העתק את הקובייה שלי שוב',    pl: 'Skopiuj kostkę jeszcze raz',
  },
  holdTitle: {
    en: 'Hold your cube like this',
    he: 'החזק את הקובייה ככה',    pl: 'Trzymaj kostkę tak',
  },
  holdLead2: {
    en: 'Side 1 faces you, with the same top as before. Keep holding it this way and only turn the part I show you.',
    he: 'צד 1 מול הפנים שלך, עם אותו צד למעלה כמו קודם. המשך להחזיק אותה ככה וסובב רק את החלק שאני מראה לך.',    pl: 'Strona 1 jest przed tobą, z tą samą górą co wcześniej. Trzymaj ją tak i obracaj tylko tę część, którą pokazuję.',
  },
  holdLead3: {
    en: 'Green faces you and white is on top. Keep holding it this way and only turn the part I show you.',
    he: 'הירוק מול הפנים שלך והלבן למעלה. המשך להחזיק אותה ככה וסובב רק את החלק שאני מראה לך.',    pl: 'Zielona jest przed tobą, a biała na górze. Trzymaj ją tak i obracaj tylko tę część, którą pokazuję.',
  },
  ready: {
    en: 'I’m ready',
    he: 'אני מוכן',    pl: 'Gotowe',
  },
  moveOf: {
    en: 'Move {n} of {total}',
    he: 'מהלך {n} מתוך {total}',    pl: 'Ruch {n} z {total}',
  },
  cubeCode: {
    en: 'Cube code {m}',
    he: 'קוד קובייה {m}',    pl: 'Kod kostki {m}',
  },
  previous: {
    en: 'Previous',
    he: 'הקודם',    pl: 'Poprzedni',
  },
  didIt: {
    en: 'I did it',
    he: 'עשיתי',    pl: 'Zrobione',
  },
  lost: {
    en: 'My cube looks different',
    he: 'הקובייה שלי נראית אחרת',    pl: 'Moja kostka wygląda inaczej',
  },
  helpMatch2: {
    en: 'If you turned the whole cube, turn it back so it matches the picture.',
    he: 'אם סובבת את כל הקובייה, סובב אותה בחזרה כך שתתאים לתמונה.',    pl: 'Jeśli cała kostka się obróciła, obróć ją z powrotem, aby pasowała do obrazka.',
  },
  helpMatch3: {
    en: 'Keep green facing you and white on top, so your cube matches the picture.',
    he: 'שמור על הירוק מול הפנים שלך והלבן למעלה, כך שהקובייה שלך תתאים לתמונה.',    pl: 'Trzymaj zieloną przed sobą, a białą na górze, aby kostka pasowała do obrazka.',
  },
  helpRecopy: {
    en: 'If a turn went wrong, copy your cube again and I’ll find new moves.',
    he: 'אם סיבוב השתבש, העתק את הקובייה שלך שוב ואני אמצא מהלכים חדשים.',    pl: 'Jeśli ruch poszedł źle, skopiuj kostkę jeszcze raz, a znajdę nowe ruchy.',
  },
  doneTitle: {
    en: 'Solved!',
    he: 'נפתר!',    pl: 'Ułożona!',
  },
  doneLead: {
    en: { one: 'That took {n} turn. Mix it up and copy it again to go another round.', other: 'That took {n} turns. Mix it up and copy it again to go another round.' },
    he: { one: 'זה לקח {n} סיבוב. ערבב אותה והעתק אותה שוב לסיבוב נוסף.', other: 'זה לקח {n} סיבובים. ערבב אותה והעתק אותה שוב לסיבוב נוסף.' },    pl: { one: 'To zajęło {n} ruch. Pomieszaj ją i skopiuj jeszcze raz na kolejną rundę.', few: 'To zajęło {n} ruchy. Pomieszaj ją i skopiuj jeszcze raz na kolejną rundę.', many: 'To zajęło {n} ruchów. Pomieszaj ją i skopiuj jeszcze raz na kolejną rundę.', other: 'To zajęło {n} ruchu. Pomieszaj ją i skopiuj jeszcze raz na kolejną rundę.' },
  },
  solveAnother: {
    en: 'Solve another',
    he: 'פתור עוד אחת',    pl: 'Ułóż następną',
  },
  // Camera sheet
  camTitle2: {
    en: 'Photo of side {n}',
    he: 'תמונה של צד {n}',    pl: 'Zdjęcie strony {n}',
  },
  camHint2First: {
    en: 'Fit the side inside the square, with the top you picked at the top.',
    he: 'התאם את הצד לתוך הריבוע, כשהצד העליון שבחרת למעלה.',    pl: 'Zmieść stronę w kwadracie, z wybraną górą u góry.',
  },
  camHint2Next: {
    en: 'Same top as before. Fit the side inside the square.',
    he: 'אותו צד למעלה כמו קודם. התאם את הצד לתוך הריבוע.',    pl: 'Ta sama góra co wcześniej. Zmieść stronę w kwadracie.',
  },
  camTitle3: {
    en: 'Photo of the {color} side',
    he: { W: 'תמונה של הצד הלבן', Y: 'תמונה של הצד הצהוב', R: 'תמונה של הצד האדום', O: 'תמונה של הצד הכתום', B: 'תמונה של הצד הכחול', G: 'תמונה של הצד הירוק' },    pl: { W: 'Zdjęcie białej strony', Y: 'Zdjęcie żółtej strony', R: 'Zdjęcie czerwonej strony', O: 'Zdjęcie pomarańczowej strony', B: 'Zdjęcie niebieskiej strony', G: 'Zdjęcie zielonej strony' },
  },
  camHint3Side: {
    en: '{Color} in the middle square, white at the top.',
    he: '{color} בריבוע האמצעי, לבן למעלה.',    pl: '{Color} w środkowym polu, biały u góry.',
  },
  camHint3Top: {
    en: 'White in the middle square, green at the bottom.',
    he: 'לבן בריבוע האמצעי, ירוק למטה.',    pl: 'Biały w środkowym polu, zielony na dole.',
  },
  camHint3Bottom: {
    en: 'Yellow in the middle square, green at the top.',
    he: 'צהוב בריבוע האמצעי, ירוק למעלה.',    pl: 'Żółty w środkowym polu, zielony u góry.',
  },
  camStarting: {
    en: 'Starting the camera…',
    he: 'מפעיל את המצלמה…',    pl: 'Uruchamiam aparat…',
  },
  camTipDefault: {
    en: 'Bright room, no flash. Hold the phone a hand away.',
    he: 'חדר מואר, בלי פלאש. החזק את הטלפון במרחק של כף יד.',    pl: 'Jasny pokój, bez lampy błyskowej. Trzymaj telefon na odległość dłoni.',
  },
  cancel: {
    en: 'Cancel',
    he: 'ביטול',    pl: 'Anuluj',
  },
  useColors: {
    en: 'Use these colors',
    he: 'השתמש בצבעים האלה',    pl: 'Użyj tych kolorów',
  },
  camNothingOpened: {
    en: 'Nothing opened? This app may block photos here. Open the page in your phone’s browser, or tap Cancel and tap the colors in.',
    he: 'שום דבר לא נפתח? יכול להיות שהאפליקציה הזאת חוסמת תמונות כאן. פתח את הדף בדפדפן של הטלפון, או לחץ על ביטול והקש את הצבעים.',    pl: 'Nic się nie otworzyło? Ta aplikacja może tu blokować zdjęcia. Otwórz stronę w przeglądarce telefonu albo dotknij Anuluj i wybierz kolory ręcznie.',
  },
  camBlocked: {
    en: 'This page can’t use the live camera here, so take a photo instead.',
    he: 'הדף הזה לא יכול להשתמש במצלמה החיה כאן, אז צלם תמונה במקום.',    pl: 'Ta strona nie może tu użyć aparatu na żywo, więc zrób zdjęcie.',
  },
  camNotAllowed: {
    en: 'The live camera isn’t allowed here, so take a photo instead.',
    he: 'המצלמה החיה לא מורשית כאן, אז צלם תמונה במקום.',    pl: 'Aparat na żywo nie jest tu dozwolony, więc zrób zdjęcie.',
  },
  camFailed: {
    en: 'The live camera didn’t start, so take a photo instead.',
    he: 'המצלמה החיה לא הופעלה, אז צלם תמונה במקום.',    pl: 'Aparat na żywo się nie uruchomił, więc zrób zdjęcie.',
  },
  camGetClose: {
    en: 'Get close, so the side fills most of the photo.',
    he: 'התקרב, כך שהצד ימלא את רוב התמונה.',    pl: 'Podejdź blisko, aby strona wypełniła większość zdjęcia.',
  },
  takePhoto: {
    en: 'Take a photo',
    he: 'צלם תמונה',    pl: 'Zrób zdjęcie',
  },
  choosePhoto: {
    en: 'Choose a photo',
    he: 'בחר תמונה',    pl: 'Wybierz zdjęcie',
  },
  camTipPhoto: {
    en: 'Bright room, no flash. Hold the phone straight at the side.',
    he: 'חדר מואר, בלי פלאש. החזק את הטלפון ישר מול הצד.',    pl: 'Jasny pokój, bez lampy błyskowej. Trzymaj telefon prosto przed stroną.',
  },
  camReading: {
    en: 'Reading the photo…',
    he: 'קורא את התמונה…',    pl: 'Odczytuję zdjęcie…',
  },
  camBadPhoto: {
    en: 'That photo didn’t open. Try taking it again.',
    he: 'התמונה הזאת לא נפתחה. נסה לצלם שוב.',    pl: 'To zdjęcie się nie otworzyło. Spróbuj zrobić je jeszcze raz.',
  },
  camTipFit: {
    en: 'Drag and pinch the photo so the side fits the square.',
    he: 'גרור וצבוט את התמונה כך שהצד יתאים לריבוע.',    pl: 'Przesuwaj i powiększaj zdjęcie, aby strona pasowała do kwadratu.',
  },
  retake: {
    en: 'Retake',
    he: 'צלם שוב',    pl: 'Jeszcze raz',
  },
  retakeAria: {
    en: 'Retake the photo',
    he: 'צלם את התמונה שוב',    pl: 'Zrób zdjęcie jeszcze raz',
  },
  camTipFillPhoto: {
    en: 'Drag and pinch the photo so the side fills the square.',
    he: 'גרור וצבוט את התמונה כך שהצד ימלא את הריבוע.',    pl: 'Przesuwaj i powiększaj zdjęcie, aby strona wypełniła kwadrat.',
  },
  camTipCloser: {
    en: 'Move closer so the side fills the square.',
    he: 'התקרב כדי שהצד ימלא את הריבוע.',    pl: 'Podejdź bliżej, aby strona wypełniła kwadrat.',
  },
  camTipCenter: {
    en: 'Put the {color} middle in the middle square.',
    he: { W: 'שים את האמצע הלבן בריבוע האמצעי.', Y: 'שים את האמצע הצהוב בריבוע האמצעי.', R: 'שים את האמצע האדום בריבוע האמצעי.', O: 'שים את האמצע הכתום בריבוע האמצעי.', B: 'שים את האמצע הכחול בריבוע האמצעי.', G: 'שים את האמצע הירוק בריבוע האמצעי.' },    pl: { W: 'Ustaw biały środek w środkowym polu.', Y: 'Ustaw żółty środek w środkowym polu.', R: 'Ustaw czerwony środek w środkowym polu.', O: 'Ustaw pomarańczowy środek w środkowym polu.', B: 'Ustaw niebieski środek w środkowym polu.', G: 'Ustaw zielony środek w środkowym polu.' },
  },
  camTipShiny: {
    en: 'A square looks shiny. Tilt the cube a little, away from the light.',
    he: 'ריבוע אחד נראה מבריק. הטה את הקובייה קצת, הרחק מהאור.',    pl: 'Jedno pole wygląda na błyszczące. Przechyl trochę kostkę, z dala od światła.',
  },
  camTipStill: {
    en: 'Hold still for a moment.',
    he: 'החזק רגע בלי לזוז.',    pl: 'Potrzymaj chwilę nieruchomo.',
  },
  camTipUnsure: {
    en: 'I’m not sure about the dotted squares. You can fix them after.',
    he: 'אני לא בטוח לגבי הריבועים המקווקווים. אפשר לתקן אותם אחר כך.',    pl: 'Nie mam pewności co do pól z kropkowaną ramką. Możesz je potem poprawić.',
  },
  camTipGood: {
    en: 'Looks good! Tap “Use these colors”.',
    he: 'נראה טוב! לחץ על "השתמש בצבעים האלה".',    pl: 'Wygląda dobrze! Dotknij „Użyj tych kolorów”.',
  },
};
