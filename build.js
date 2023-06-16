const fs = require('fs');
const cp = require('child_process');


function main() {
  var cwd   = 'resources';
  var stdio = [0, 1, 2];
  fs.mkdirSync(cwd, {recursive: true});
  cp.execSync('curl -O https://i.imgur.com/MclalEN.gif', {cwd, stdio});
  cp.execSync('curl -O https://i.imgur.com/j5SNPdB.gif', {cwd, stdio});
  cp.execSync('curl -O https://i.imgur.com/sagelJi.png', {cwd, stdio});
  cp.execSync('curl -O https://cdn.jsdelivr.net/npm/@picocss/pico@1/css/pico.min.css', {cwd, stdio});
}
main();
