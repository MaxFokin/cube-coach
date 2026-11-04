// Runs the Node tests one after another: `npm test`
const { execFileSync } = require('child_process');
for (const t of ['strings.test.js', 'core2.test.js', 'core3.test.js', 'colorread.test.js']) {
  execFileSync(process.execPath, [require('path').join(__dirname, t)], { stdio: 'inherit' });
}
