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
  // Colors and squares
  colorName: { en: { W: 'white', Y: 'yellow', R: 'red', O: 'orange', B: 'blue', G: 'green' } },
  colors: { en: 'Colors' },
  sqTopLeft: { en: 'Top left' },
  sqTopMiddle: { en: 'Top middle' },
  sqTopRight: { en: 'Top right' },
  sqMiddleLeft: { en: 'Middle left' },
  sqMiddle: { en: 'Middle' },
  sqMiddleRight: { en: 'Middle right' },
  sqBottomLeft: { en: 'Bottom left' },
  sqBottomMiddle: { en: 'Bottom middle' },
  sqBottomRight: { en: 'Bottom right' },
  squareLabel: { en: '{square} square: {state}' },
  notSet: { en: 'not set' },
  middleSquare: { en: 'Middle square: {color}' },
  sideLabel2: { en: 'Side {n}' },
  sideLabel3: { en: '{Color} side' },
  and: { en: ' and ' },
  // Header
  startOver: { en: 'Start over' },
  startOverArmed: { en: 'Tap again to start over' },
  // Welcome
  welcomeTitle: { en: 'Let’s solve your cube' },
  welcomeLead: { en: 'Copy your cube’s colors and I’ll show you every turn. Which cube do you have?' },
  tile2: { en: 'Copy 4 sides' },
  tile3: { en: 'Copy all 6 sides' },
  // Copying a side
  sideOf: { en: 'Side {n} of {total}' },
  fixLine: { en: 'Fix any square that’s wrong.' },
  side2FixTitle: { en: 'Check side {n}' },
  side2FixLead: { en: 'Turn your cube until this side faces you, like the picture.' },
  side2Review0Title: { en: 'Back to side 1' },
  side2Review0Lead: { en: 'Turn your cube until side 1 faces you, like the picture.' },
  side2First0Title: { en: 'Pick a side to start' },
  side2First0Lead: { en: 'Hold any side facing you. Keep the same side on top from now on.' },
  side2NextTitle: { en: 'Turn the cube to the left' },
  side2NextLead: { en: 'Keep the same side on top. Copy the side that’s facing you now.' },
  side3FixTitle: { en: 'Check the {color} side' },
  side3FixLead: { en: 'Turn your cube so the {color} middle faces you, like the picture.' },
  side3Review0Title: { en: 'Back to green' },
  side3First0Title: { en: 'Green faces you' },
  side3Lead0: { en: 'Hold your cube with the green middle facing you and white on top.' },
  side3NextTitle: { en: 'Turn it to the left' },
  side3NextLead: { en: 'Now the {color} middle faces you. Keep white on top.' },
  side3TopTitle: { en: 'Tip it toward you' },
  side3TopLead: { en: 'From green, tip the top toward you. Green goes down by the green bar.' },
  side3BottomTitle: { en: 'Flip it over' },
  side3BottomLead: { en: 'Flip it so yellow faces you and green is at the top, by the green bar.' },
  photo: { en: 'Photo' },
  photoAria: { en: 'Copy this side from a photo' },
  unsureNote: { en: 'I wasn’t sure about the dotted squares. Check them on your cube.' },
  tooMany: { en: { other: 'A cube has only {n} {color} squares, and you have <b>{have}</b>. Look closely at red and orange too.' } },
  checkAgain: { en: 'Check again' },
  back: { en: 'Back' },
  nextSide: { en: 'Next side' },
  checkMyCube: { en: 'Check my cube' },
  replay: { en: 'Show the turn again' },
  turnedNote: { en: 'You copied the {sides} side turned around. I fixed it.' },
  // Top and bottom check
  checkTopTitle: { en: 'Is this your top?' },
  checkBottomTitle: { en: 'And is this your bottom?' },
  turnedRightNote: { en: 'You turned your cube to the right. That works too, I sorted it out.' },
  checkTopLead: { en: 'Turn back to side 1. Then look down at the top of your cube.' },
  checkBottomLead: { en: 'Tip the top away from you, so the bottom faces you.' },
  edgeTag: { en: 'Side 1 is on this edge' },
  no: { en: 'No' },
  yes: { en: 'Yes' },
  // Something is wrong
  mismatchTitle: { en: 'Then a side got mixed up' },
  mismatchLead: { en: 'Let’s go through the sides again. Keep the same top as you turn, and look closely at red and orange.' },
  checkSides: { en: 'Check the sides' },
  oopsOneTitle: { en: 'Check this square' },
  oopsOneLead2: { en: 'On side {n}, this square doesn’t fit with the others.' },
  oopsOneLead3: { en: 'On the {color} side, this square doesn’t fit with the others.' },
  iThink: { en: 'I think it’s {color}.' },
  letMeLook: { en: 'Let me look' },
  makeIt: { en: 'Make it {color}' },
  checkSide2: { en: 'Check side {n}' },
  checkSide3: { en: 'Check the {color} side' },
  oopsSomeTitle: { en: 'One of these is wrong' },
  oopsSomeLead: { en: 'One of the marked squares doesn’t match your cube. Let’s go through the sides and look closely at them.' },
  checkMarked: { en: 'Check the marked squares' },
  oopsManyTitle: { en: 'Some colors got mixed up' },
  oopsManyLead3: { en: 'Let’s go through the sides again. Check that each middle color faces you as shown, and look closely at red and orange.' },
  // Working out the moves
  solvingTitle: { en: 'Working out the moves' },
  solvingLead: { en: 'This takes a few seconds the first time.' },
  solverErrorTitle: { en: 'The 3×3 helper didn’t load' },
  solverErrorLead: { en: 'It needs the internet the first time. Check the connection, then try again.' },
  tryAgain: { en: 'Try again' },
  // Hold, moves, done
  alreadySolvedTitle: { en: 'It’s already solved!' },
  alreadySolvedLead: { en: 'Mix it up, then copy it again to practice.' },
  copyAgain: { en: 'Copy my cube again' },
  holdTitle: { en: 'Hold your cube like this' },
  holdLead2: { en: 'Side 1 faces you, with the same top as before. Keep holding it this way and only turn the part I show you.' },
  holdLead3: { en: 'Green faces you and white is on top. Keep holding it this way and only turn the part I show you.' },
  ready: { en: 'I’m ready' },
  moveOf: { en: 'Move {n} of {total}' },
  cubeCode: { en: 'Cube code {m}' },
  previous: { en: 'Previous' },
  didIt: { en: 'I did it' },
  lost: { en: 'My cube looks different' },
  helpMatch2: { en: 'If you turned the whole cube, turn it back so it matches the picture.' },
  helpMatch3: { en: 'Keep green facing you and white on top, so your cube matches the picture.' },
  helpRecopy: { en: 'If a turn went wrong, copy your cube again and I’ll find new moves.' },
  doneTitle: { en: 'Solved!' },
  doneLead: { en: { one: 'That took {n} turn. Mix it up and copy it again to go another round.', other: 'That took {n} turns. Mix it up and copy it again to go another round.' } },
  solveAnother: { en: 'Solve another' },
  // Camera sheet
  camTitle2: { en: 'Photo of side {n}' },
  camHint2First: { en: 'Fit the side inside the square, with the top you picked at the top.' },
  camHint2Next: { en: 'Same top as before. Fit the side inside the square.' },
  camTitle3: { en: 'Photo of the {color} side' },
  camHint3Side: { en: '{Color} in the middle square, white at the top.' },
  camHint3Top: { en: 'White in the middle square, green at the bottom.' },
  camHint3Bottom: { en: 'Yellow in the middle square, green at the top.' },
  camStarting: { en: 'Starting the camera…' },
  camTipDefault: { en: 'Bright room, no flash. Hold the phone a hand away.' },
  cancel: { en: 'Cancel' },
  useColors: { en: 'Use these colors' },
  camNothingOpened: { en: 'Nothing opened? This app may block photos here. Open the page in your phone’s browser, or tap Cancel and tap the colors in.' },
  camBlocked: { en: 'This page can’t use the live camera here, so take a photo instead.' },
  camNotAllowed: { en: 'The live camera isn’t allowed here, so take a photo instead.' },
  camFailed: { en: 'The live camera didn’t start, so take a photo instead.' },
  camGetClose: { en: 'Get close, so the side fills most of the photo.' },
  takePhoto: { en: 'Take a photo' },
  choosePhoto: { en: 'Choose a photo' },
  camTipPhoto: { en: 'Bright room, no flash. Hold the phone straight at the side.' },
  camReading: { en: 'Reading the photo…' },
  camBadPhoto: { en: 'That photo didn’t open. Try taking it again.' },
  camTipFit: { en: 'Drag and pinch the photo so the side fits the square.' },
  retake: { en: 'Retake' },
  retakeAria: { en: 'Retake the photo' },
  camTipFillPhoto: { en: 'Drag and pinch the photo so the side fills the square.' },
  camTipCloser: { en: 'Move closer so the side fills the square.' },
  camTipCenter: { en: 'Put the {color} middle in the middle square.' },
  camTipShiny: { en: 'A square looks shiny. Tilt the cube a little, away from the light.' },
  camTipStill: { en: 'Hold still for a moment.' },
  camTipUnsure: { en: 'I’m not sure about the dotted squares. You can fix them after.' },
  camTipGood: { en: 'Looks good! Tap “Use these colors”.' },
};
