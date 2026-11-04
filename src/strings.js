// ===== Words, in every language =====
// STRINGS[key] = { en, he, pl }. A value is a string with {name} placeholders, a plural set
// ({ one, two, few, many, other }; other is required), or a per-color set (W Y R O B G). Sets may
// nest either way. t(key, vars) picks the current language, falls back to English, fills {color}
// and {Color} with the color's name, and every other {name} from vars. No DOM in this file.
const LANGS = { en: { name: 'English', dir: 'ltr' }, he: { name: 'עברית', dir: 'rtl' } };
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
    he: ['הצד הימני למעלה', 'סובב את הצד הימני למעלה, ממך והלאה.'],
  },
  "R'": {
    en: ['Right side down', 'Turn the right side down, toward you.'],
    he: ['הצד הימני למטה', 'סובב את הצד הימני למטה, אליך.'],
  },
  "R2": {
    en: ['Right side, two turns', 'Turn the right side two turns. Either way works.'],
    he: ['הצד הימני, שני סיבובים', 'סובב את הצד הימני שני סיבובים. כל כיוון עובד.'],
  },
  "L": {
    en: ['Left side down', 'Turn the left side down, toward you.'],
    he: ['הצד השמאלי למטה', 'סובב את הצד השמאלי למטה, אליך.'],
  },
  "L'": {
    en: ['Left side up', 'Turn the left side up, away from you.'],
    he: ['הצד השמאלי למעלה', 'סובב את הצד השמאלי למעלה, ממך והלאה.'],
  },
  "L2": {
    en: ['Left side, two turns', 'Turn the left side two turns. Either way works.'],
    he: ['הצד השמאלי, שני סיבובים', 'סובב את הצד השמאלי שני סיבובים. כל כיוון עובד.'],
  },
  "U": {
    en: ['Top to the left', 'Turn the top layer to the left.'],
    he: ['החלק העליון שמאלה', 'סובב את השכבה העליונה שמאלה.'],
  },
  "U'": {
    en: ['Top to the right', 'Turn the top layer to the right.'],
    he: ['החלק העליון ימינה', 'סובב את השכבה העליונה ימינה.'],
  },
  "U2": {
    en: ['Top, two turns', 'Turn the top layer two turns. Either way works.'],
    he: ['החלק העליון, שני סיבובים', 'סובב את השכבה העליונה שני סיבובים. כל כיוון עובד.'],
  },
  "D": {
    en: ['Bottom to the right', 'Turn the bottom layer to the right.'],
    he: ['החלק התחתון ימינה', 'סובב את השכבה התחתונה ימינה.'],
  },
  "D'": {
    en: ['Bottom to the left', 'Turn the bottom layer to the left.'],
    he: ['החלק התחתון שמאלה', 'סובב את השכבה התחתונה שמאלה.'],
  },
  "D2": {
    en: ['Bottom, two turns', 'Turn the bottom layer two turns. Either way works.'],
    he: ['החלק התחתון, שני סיבובים', 'סובב את השכבה התחתונה שני סיבובים. כל כיוון עובד.'],
  },
  "F": {
    en: ['Front like a clock', 'Turn the front the way a clock’s hands go.'],
    he: ['הצד הקדמי כמו שעון', 'סובב את הצד הקדמי בכיוון מחוגי השעון.'],
  },
  "F'": {
    en: ['Front the other way', 'Turn the front against a clock’s hands.'],
    he: ['הצד הקדמי הפוך משעון', 'סובב את הצד הקדמי נגד כיוון מחוגי השעון.'],
  },
  "F2": {
    en: ['Front, two turns', 'Turn the front two turns. Either way works.'],
    he: ['הצד הקדמי, שני סיבובים', 'סובב את הצד הקדמי שני סיבובים. כל כיוון עובד.'],
  },
  "B": {
    en: ['Back layer, top goes left', 'Turn the back layer so its top row goes to the left.'],
    he: ['השכבה האחורית, למעלה שמאלה', 'סובב את השכבה האחורית כך שהשורה העליונה שלה זזה שמאלה.'],
  },
  "B'": {
    en: ['Back layer, top goes right', 'Turn the back layer so its top row goes to the right.'],
    he: ['השכבה האחורית, למעלה ימינה', 'סובב את השכבה האחורית כך שהשורה העליונה שלה זזה ימינה.'],
  },
  "B2": {
    en: ['Back layer, two turns', 'Turn the back layer two turns. Either way works.'],
    he: ['השכבה האחורית, שני סיבובים', 'סובב את השכבה האחורית שני סיבובים. כל כיוון עובד.'],
  },
};
const moveText = (m) => MOVE_TEXT[m][lang] || MOVE_TEXT[m].en;

const STRINGS = {
  // Colors and squares
  colorName: {
    en: { W: 'white', Y: 'yellow', R: 'red', O: 'orange', B: 'blue', G: 'green' },
    he: { W: 'לבן', Y: 'צהוב', R: 'אדום', O: 'כתום', B: 'כחול', G: 'ירוק' },
  },
  colors: {
    en: 'Colors',
    he: 'צבעים',
  },
  sqTopLeft: {
    en: 'Top left',
    he: 'שמאל למעלה',
  },
  sqTopMiddle: {
    en: 'Top middle',
    he: 'אמצע למעלה',
  },
  sqTopRight: {
    en: 'Top right',
    he: 'ימין למעלה',
  },
  sqMiddleLeft: {
    en: 'Middle left',
    he: 'שמאל באמצע',
  },
  sqMiddle: {
    en: 'Middle',
    he: 'אמצע',
  },
  sqMiddleRight: {
    en: 'Middle right',
    he: 'ימין באמצע',
  },
  sqBottomLeft: {
    en: 'Bottom left',
    he: 'שמאל למטה',
  },
  sqBottomMiddle: {
    en: 'Bottom middle',
    he: 'אמצע למטה',
  },
  sqBottomRight: {
    en: 'Bottom right',
    he: 'ימין למטה',
  },
  squareLabel: {
    en: '{square} square: {state}',
    he: 'ריבוע {square}: {state}',
  },
  notSet: {
    en: 'not set',
    he: 'לא נבחר',
  },
  middleSquare: {
    en: 'Middle square: {color}',
    he: 'הריבוע האמצעי: {color}',
  },
  sideLabel2: {
    en: 'Side {n}',
    he: 'צד {n}',
  },
  sideLabel3: {
    en: '{Color} side',
    he: { W: 'הצד הלבן', Y: 'הצד הצהוב', R: 'הצד האדום', O: 'הצד הכתום', B: 'הצד הכחול', G: 'הצד הירוק' },
  },
  and: {
    en: ' and ',
    he: ' ו',
  },
  // Header
  startOver: {
    en: 'Start over',
    he: 'להתחיל מחדש',
  },
  startOverArmed: {
    en: 'Tap again to start over',
    he: 'עוד לחיצה כדי להתחיל מחדש',
  },
  // Welcome
  welcomeTitle: {
    en: 'Let’s solve your cube',
    he: 'בוא נפתור את הקובייה שלך',
  },
  welcomeLead: {
    en: 'Copy your cube’s colors and I’ll show you every turn. Which cube do you have?',
    he: 'העתק את צבעי הקובייה שלך ואני אראה לך כל סיבוב. איזו קובייה יש לך?',
  },
  tile2: {
    en: 'Copy 4 sides',
    he: 'העתק 4 צדדים',
  },
  tile3: {
    en: 'Copy all 6 sides',
    he: 'העתק את כל 6 הצדדים',
  },
  // Copying a side
  sideOf: {
    en: 'Side {n} of {total}',
    he: 'צד {n} מתוך {total}',
  },
  fixLine: {
    en: 'Fix any square that’s wrong.',
    he: 'תקן כל ריבוע שלא נכון.',
  },
  side2FixTitle: {
    en: 'Check side {n}',
    he: 'בדוק את צד {n}',
  },
  side2FixLead: {
    en: 'Turn your cube until this side faces you, like the picture.',
    he: 'סובב את הקובייה עד שהצד הזה מול הפנים שלך, כמו בתמונה.',
  },
  side2Review0Title: {
    en: 'Back to side 1',
    he: 'חזרה לצד 1',
  },
  side2Review0Lead: {
    en: 'Turn your cube until side 1 faces you, like the picture.',
    he: 'סובב את הקובייה עד שצד 1 מול הפנים שלך, כמו בתמונה.',
  },
  side2First0Title: {
    en: 'Pick a side to start',
    he: 'בחר צד להתחיל ממנו',
  },
  side2First0Lead: {
    en: 'Hold any side facing you. Keep the same side on top from now on.',
    he: 'החזק צד כלשהו מול הפנים שלך. מעכשיו שמור על אותו צד למעלה.',
  },
  side2NextTitle: {
    en: 'Turn the cube to the left',
    he: 'סובב את הקובייה שמאלה',
  },
  side2NextLead: {
    en: 'Keep the same side on top. Copy the side that’s facing you now.',
    he: 'שמור על אותו צד למעלה. העתק את הצד שמול הפנים שלך עכשיו.',
  },
  side3FixTitle: {
    en: 'Check the {color} side',
    he: { W: 'בדוק את הצד הלבן', Y: 'בדוק את הצד הצהוב', R: 'בדוק את הצד האדום', O: 'בדוק את הצד הכתום', B: 'בדוק את הצד הכחול', G: 'בדוק את הצד הירוק' },
  },
  side3FixLead: {
    en: 'Turn your cube so the {color} middle faces you, like the picture.',
    he: { W: 'סובב את הקובייה כך שהאמצע הלבן מול הפנים שלך, כמו בתמונה.', Y: 'סובב את הקובייה כך שהאמצע הצהוב מול הפנים שלך, כמו בתמונה.', R: 'סובב את הקובייה כך שהאמצע האדום מול הפנים שלך, כמו בתמונה.', O: 'סובב את הקובייה כך שהאמצע הכתום מול הפנים שלך, כמו בתמונה.', B: 'סובב את הקובייה כך שהאמצע הכחול מול הפנים שלך, כמו בתמונה.', G: 'סובב את הקובייה כך שהאמצע הירוק מול הפנים שלך, כמו בתמונה.' },
  },
  side3Review0Title: {
    en: 'Back to green',
    he: 'חזרה לירוק',
  },
  side3First0Title: {
    en: 'Green faces you',
    he: 'ירוק מול הפנים',
  },
  side3Lead0: {
    en: 'Hold your cube with the green middle facing you and white on top.',
    he: 'החזק את הקובייה כשהאמצע הירוק מול הפנים שלך והלבן למעלה.',
  },
  side3NextTitle: {
    en: 'Turn it to the left',
    he: 'סובב אותה שמאלה',
  },
  side3NextLead: {
    en: 'Now the {color} middle faces you. Keep white on top.',
    he: { W: 'עכשיו האמצע הלבן מול הפנים שלך. שמור על לבן למעלה.', Y: 'עכשיו האמצע הצהוב מול הפנים שלך. שמור על לבן למעלה.', R: 'עכשיו האמצע האדום מול הפנים שלך. שמור על לבן למעלה.', O: 'עכשיו האמצע הכתום מול הפנים שלך. שמור על לבן למעלה.', B: 'עכשיו האמצע הכחול מול הפנים שלך. שמור על לבן למעלה.', G: 'עכשיו האמצע הירוק מול הפנים שלך. שמור על לבן למעלה.' },
  },
  side3TopTitle: {
    en: 'Tip it toward you',
    he: 'הטה אותה אליך',
  },
  side3TopLead: {
    en: 'From green, tip the top toward you. Green goes down by the green bar.',
    he: 'מהירוק, הטה את החלק העליון אליך. הירוק יורד למטה, ליד הפס הירוק.',
  },
  side3BottomTitle: {
    en: 'Flip it over',
    he: 'הפוך אותה',
  },
  side3BottomLead: {
    en: 'Flip it so yellow faces you and green is at the top, by the green bar.',
    he: 'הפוך אותה כך שהצהוב מול הפנים שלך והירוק למעלה, ליד הפס הירוק.',
  },
  photo: {
    en: 'Photo',
    he: 'תמונה',
  },
  photoAria: {
    en: 'Copy this side from a photo',
    he: 'העתק את הצד הזה מתמונה',
  },
  unsureNote: {
    en: 'I wasn’t sure about the dotted squares. Check them on your cube.',
    he: 'לא הייתי בטוח לגבי הריבועים המקווקווים. בדוק אותם על הקובייה שלך.',
  },
  tooMany: {
    en: { other: 'A cube has only {n} {color} squares, and you have <b>{have}</b>. Look closely at red and orange too.' },
    he: { other: { W: 'בקובייה יש רק {n} ריבועים לבנים, ולך יש <b>{have}</b>. הסתכל טוב גם על אדום וכתום.', Y: 'בקובייה יש רק {n} ריבועים צהובים, ולך יש <b>{have}</b>. הסתכל טוב גם על אדום וכתום.', R: 'בקובייה יש רק {n} ריבועים אדומים, ולך יש <b>{have}</b>. הסתכל טוב גם על אדום וכתום.', O: 'בקובייה יש רק {n} ריבועים כתומים, ולך יש <b>{have}</b>. הסתכל טוב גם על אדום וכתום.', B: 'בקובייה יש רק {n} ריבועים כחולים, ולך יש <b>{have}</b>. הסתכל טוב גם על אדום וכתום.', G: 'בקובייה יש רק {n} ריבועים ירוקים, ולך יש <b>{have}</b>. הסתכל טוב גם על אדום וכתום.' } },
  },
  checkAgain: {
    en: 'Check again',
    he: 'בדוק שוב',
  },
  back: {
    en: 'Back',
    he: 'חזרה',
  },
  nextSide: {
    en: 'Next side',
    he: 'הצד הבא',
  },
  checkMyCube: {
    en: 'Check my cube',
    he: 'בדוק את הקובייה שלי',
  },
  replay: {
    en: 'Show the turn again',
    he: 'הראה את הסיבוב שוב',
  },
  turnedNote: {
    en: 'You copied the {sides} side turned around. I fixed it.',
    he: 'צד {sides} הועתק מסובב. תיקנתי את זה.',
  },
  // Top and bottom check
  checkTopTitle: {
    en: 'Is this your top?',
    he: 'זה החלק העליון שלך?',
  },
  checkBottomTitle: {
    en: 'And is this your bottom?',
    he: 'וזה החלק התחתון שלך?',
  },
  turnedRightNote: {
    en: 'You turned your cube to the right. That works too, I sorted it out.',
    he: 'סובבת את הקובייה ימינה. גם זה עובד, סידרתי את זה.',
  },
  checkTopLead: {
    en: 'Turn back to side 1. Then look down at the top of your cube.',
    he: 'חזור לצד 1. אחר כך הסתכל מלמעלה על הקובייה שלך.',
  },
  checkBottomLead: {
    en: 'Tip the top away from you, so the bottom faces you.',
    he: 'הטה את החלק העליון ממך והלאה, כך שהתחתית מול הפנים שלך.',
  },
  edgeTag: {
    en: 'Side 1 is on this edge',
    he: 'צד 1 נמצא בקצה הזה',
  },
  no: {
    en: 'No',
    he: 'לא',
  },
  yes: {
    en: 'Yes',
    he: 'כן',
  },
  // Something is wrong
  mismatchTitle: {
    en: 'Then a side got mixed up',
    he: 'אז צד אחד התבלבל',
  },
  mismatchLead: {
    en: 'Let’s go through the sides again. Keep the same top as you turn, and look closely at red and orange.',
    he: 'בוא נעבור על הצדדים שוב. שמור על אותו צד למעלה בזמן הסיבוב, והסתכל טוב על אדום וכתום.',
  },
  checkSides: {
    en: 'Check the sides',
    he: 'בדוק את הצדדים',
  },
  oopsOneTitle: {
    en: 'Check this square',
    he: 'בדוק את הריבוע הזה',
  },
  oopsOneLead2: {
    en: 'On side {n}, this square doesn’t fit with the others.',
    he: 'בצד {n}, הריבוע הזה לא מסתדר עם האחרים.',
  },
  oopsOneLead3: {
    en: 'On the {color} side, this square doesn’t fit with the others.',
    he: { W: 'בהצד הלבן, הריבוע הזה לא מסתדר עם האחרים.', Y: 'בהצד הצהוב, הריבוע הזה לא מסתדר עם האחרים.', R: 'בהצד האדום, הריבוע הזה לא מסתדר עם האחרים.', O: 'בהצד הכתום, הריבוע הזה לא מסתדר עם האחרים.', B: 'בהצד הכחול, הריבוע הזה לא מסתדר עם האחרים.', G: 'בהצד הירוק, הריבוע הזה לא מסתדר עם האחרים.' },
  },
  iThink: {
    en: 'I think it’s {color}.',
    he: { W: 'נראה לי שהוא לבן.', Y: 'נראה לי שהוא צהוב.', R: 'נראה לי שהוא אדום.', O: 'נראה לי שהוא כתום.', B: 'נראה לי שהוא כחול.', G: 'נראה לי שהוא ירוק.' },
  },
  letMeLook: {
    en: 'Let me look',
    he: 'תן לי להסתכל',
  },
  makeIt: {
    en: 'Make it {color}',
    he: { W: 'הפוך אותו ללבן', Y: 'הפוך אותו לצהוב', R: 'הפוך אותו לאדום', O: 'הפוך אותו לכתום', B: 'הפוך אותו לכחול', G: 'הפוך אותו לירוק' },
  },
  checkSide2: {
    en: 'Check side {n}',
    he: 'בדוק את צד {n}',
  },
  checkSide3: {
    en: 'Check the {color} side',
    he: { W: 'בדוק את הצד הלבן', Y: 'בדוק את הצד הצהוב', R: 'בדוק את הצד האדום', O: 'בדוק את הצד הכתום', B: 'בדוק את הצד הכחול', G: 'בדוק את הצד הירוק' },
  },
  oopsSomeTitle: {
    en: 'One of these is wrong',
    he: 'אחד מאלה לא נכון',
  },
  oopsSomeLead: {
    en: 'One of the marked squares doesn’t match your cube. Let’s go through the sides and look closely at them.',
    he: 'אחד מהריבועים המסומנים לא מתאים לקובייה שלך. בוא נעבור על הצדדים ונסתכל עליהם טוב.',
  },
  checkMarked: {
    en: 'Check the marked squares',
    he: 'בדוק את הריבועים המסומנים',
  },
  oopsManyTitle: {
    en: 'Some colors got mixed up',
    he: 'כמה צבעים התבלבלו',
  },
  oopsManyLead3: {
    en: 'Let’s go through the sides again. Check that each middle color faces you as shown, and look closely at red and orange.',
    he: 'בוא נעבור על הצדדים שוב. בדוק שכל צבע אמצעי מול הפנים שלך כמו שמוצג, והסתכל טוב על אדום וכתום.',
  },
  // Working out the moves
  solvingTitle: {
    en: 'Working out the moves',
    he: 'מחשב את המהלכים',
  },
  solvingLead: {
    en: 'This takes a few seconds the first time.',
    he: 'בפעם הראשונה זה לוקח כמה שניות.',
  },
  solverErrorTitle: {
    en: 'The 3×3 helper didn’t load',
    he: 'העוזר של 3×3 לא נטען',
  },
  solverErrorLead: {
    en: 'It needs the internet the first time. Check the connection, then try again.',
    he: 'בפעם הראשונה הוא צריך אינטרנט. בדוק את החיבור ונסה שוב.',
  },
  tryAgain: {
    en: 'Try again',
    he: 'נסה שוב',
  },
  // Hold, moves, done
  alreadySolvedTitle: {
    en: 'It’s already solved!',
    he: 'היא כבר פתורה!',
  },
  alreadySolvedLead: {
    en: 'Mix it up, then copy it again to practice.',
    he: 'ערבב אותה, ואז העתק אותה שוב כדי להתאמן.',
  },
  copyAgain: {
    en: 'Copy my cube again',
    he: 'העתק את הקובייה שלי שוב',
  },
  holdTitle: {
    en: 'Hold your cube like this',
    he: 'החזק את הקובייה ככה',
  },
  holdLead2: {
    en: 'Side 1 faces you, with the same top as before. Keep holding it this way and only turn the part I show you.',
    he: 'צד 1 מול הפנים שלך, עם אותו צד למעלה כמו קודם. המשך להחזיק אותה ככה וסובב רק את החלק שאני מראה לך.',
  },
  holdLead3: {
    en: 'Green faces you and white is on top. Keep holding it this way and only turn the part I show you.',
    he: 'הירוק מול הפנים שלך והלבן למעלה. המשך להחזיק אותה ככה וסובב רק את החלק שאני מראה לך.',
  },
  ready: {
    en: 'I’m ready',
    he: 'אני מוכן',
  },
  moveOf: {
    en: 'Move {n} of {total}',
    he: 'מהלך {n} מתוך {total}',
  },
  cubeCode: {
    en: 'Cube code {m}',
    he: 'קוד קובייה {m}',
  },
  previous: {
    en: 'Previous',
    he: 'הקודם',
  },
  didIt: {
    en: 'I did it',
    he: 'עשיתי',
  },
  lost: {
    en: 'My cube looks different',
    he: 'הקובייה שלי נראית אחרת',
  },
  helpMatch2: {
    en: 'If you turned the whole cube, turn it back so it matches the picture.',
    he: 'אם סובבת את כל הקובייה, סובב אותה בחזרה כך שתתאים לתמונה.',
  },
  helpMatch3: {
    en: 'Keep green facing you and white on top, so your cube matches the picture.',
    he: 'שמור על הירוק מול הפנים שלך והלבן למעלה, כך שהקובייה שלך תתאים לתמונה.',
  },
  helpRecopy: {
    en: 'If a turn went wrong, copy your cube again and I’ll find new moves.',
    he: 'אם סיבוב השתבש, העתק את הקובייה שלך שוב ואני אמצא מהלכים חדשים.',
  },
  doneTitle: {
    en: 'Solved!',
    he: 'נפתר!',
  },
  doneLead: {
    en: { one: 'That took {n} turn. Mix it up and copy it again to go another round.', other: 'That took {n} turns. Mix it up and copy it again to go another round.' },
    he: { one: 'זה לקח {n} סיבוב. ערבב אותה והעתק אותה שוב לסיבוב נוסף.', other: 'זה לקח {n} סיבובים. ערבב אותה והעתק אותה שוב לסיבוב נוסף.' },
  },
  solveAnother: {
    en: 'Solve another',
    he: 'פתור עוד אחת',
  },
  // Camera sheet
  camTitle2: {
    en: 'Photo of side {n}',
    he: 'תמונה של צד {n}',
  },
  camHint2First: {
    en: 'Fit the side inside the square, with the top you picked at the top.',
    he: 'התאם את הצד לתוך הריבוע, כשהצד העליון שבחרת למעלה.',
  },
  camHint2Next: {
    en: 'Same top as before. Fit the side inside the square.',
    he: 'אותו צד למעלה כמו קודם. התאם את הצד לתוך הריבוע.',
  },
  camTitle3: {
    en: 'Photo of the {color} side',
    he: { W: 'תמונה של הצד הלבן', Y: 'תמונה של הצד הצהוב', R: 'תמונה של הצד האדום', O: 'תמונה של הצד הכתום', B: 'תמונה של הצד הכחול', G: 'תמונה של הצד הירוק' },
  },
  camHint3Side: {
    en: '{Color} in the middle square, white at the top.',
    he: '{color} בריבוע האמצעי, לבן למעלה.',
  },
  camHint3Top: {
    en: 'White in the middle square, green at the bottom.',
    he: 'לבן בריבוע האמצעי, ירוק למטה.',
  },
  camHint3Bottom: {
    en: 'Yellow in the middle square, green at the top.',
    he: 'צהוב בריבוע האמצעי, ירוק למעלה.',
  },
  camStarting: {
    en: 'Starting the camera…',
    he: 'מפעיל את המצלמה…',
  },
  camTipDefault: {
    en: 'Bright room, no flash. Hold the phone a hand away.',
    he: 'חדר מואר, בלי פלאש. החזק את הטלפון במרחק של כף יד.',
  },
  cancel: {
    en: 'Cancel',
    he: 'ביטול',
  },
  useColors: {
    en: 'Use these colors',
    he: 'השתמש בצבעים האלה',
  },
  camNothingOpened: {
    en: 'Nothing opened? This app may block photos here. Open the page in your phone’s browser, or tap Cancel and tap the colors in.',
    he: 'שום דבר לא נפתח? יכול להיות שהאפליקציה הזאת חוסמת תמונות כאן. פתח את הדף בדפדפן של הטלפון, או לחץ על ביטול והקש את הצבעים.',
  },
  camBlocked: {
    en: 'This page can’t use the live camera here, so take a photo instead.',
    he: 'הדף הזה לא יכול להשתמש במצלמה החיה כאן, אז צלם תמונה במקום.',
  },
  camNotAllowed: {
    en: 'The live camera isn’t allowed here, so take a photo instead.',
    he: 'המצלמה החיה לא מורשית כאן, אז צלם תמונה במקום.',
  },
  camFailed: {
    en: 'The live camera didn’t start, so take a photo instead.',
    he: 'המצלמה החיה לא הופעלה, אז צלם תמונה במקום.',
  },
  camGetClose: {
    en: 'Get close, so the side fills most of the photo.',
    he: 'התקרב, כך שהצד ימלא את רוב התמונה.',
  },
  takePhoto: {
    en: 'Take a photo',
    he: 'צלם תמונה',
  },
  choosePhoto: {
    en: 'Choose a photo',
    he: 'בחר תמונה',
  },
  camTipPhoto: {
    en: 'Bright room, no flash. Hold the phone straight at the side.',
    he: 'חדר מואר, בלי פלאש. החזק את הטלפון ישר מול הצד.',
  },
  camReading: {
    en: 'Reading the photo…',
    he: 'קורא את התמונה…',
  },
  camBadPhoto: {
    en: 'That photo didn’t open. Try taking it again.',
    he: 'התמונה הזאת לא נפתחה. נסה לצלם שוב.',
  },
  camTipFit: {
    en: 'Drag and pinch the photo so the side fits the square.',
    he: 'גרור וצבוט את התמונה כך שהצד יתאים לריבוע.',
  },
  retake: {
    en: 'Retake',
    he: 'צלם שוב',
  },
  retakeAria: {
    en: 'Retake the photo',
    he: 'צלם את התמונה שוב',
  },
  camTipFillPhoto: {
    en: 'Drag and pinch the photo so the side fills the square.',
    he: 'גרור וצבוט את התמונה כך שהצד ימלא את הריבוע.',
  },
  camTipCloser: {
    en: 'Move closer so the side fills the square.',
    he: 'התקרב כדי שהצד ימלא את הריבוע.',
  },
  camTipCenter: {
    en: 'Put the {color} middle in the middle square.',
    he: { W: 'שים את האמצע הלבן בריבוע האמצעי.', Y: 'שים את האמצע הצהוב בריבוע האמצעי.', R: 'שים את האמצע האדום בריבוע האמצעי.', O: 'שים את האמצע הכתום בריבוע האמצעי.', B: 'שים את האמצע הכחול בריבוע האמצעי.', G: 'שים את האמצע הירוק בריבוע האמצעי.' },
  },
  camTipShiny: {
    en: 'A square looks shiny. Tilt the cube a little, away from the light.',
    he: 'ריבוע אחד נראה מבריק. הטה את הקובייה קצת, הרחק מהאור.',
  },
  camTipStill: {
    en: 'Hold still for a moment.',
    he: 'החזק רגע בלי לזוז.',
  },
  camTipUnsure: {
    en: 'I’m not sure about the dotted squares. You can fix them after.',
    he: 'אני לא בטוח לגבי הריבועים המקווקווים. אפשר לתקן אותם אחר כך.',
  },
  camTipGood: {
    en: 'Looks good! Tap “Use these colors”.',
    he: 'נראה טוב! לחץ על "השתמש בצבעים האלה".',
  },
};
