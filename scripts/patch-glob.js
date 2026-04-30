const fs = require('fs');
const path = require('path');

const globFile = path.join(__dirname, '..', 'node_modules', 'next', 'dist', 'compiled', 'glob', 'glob.js');

let content = fs.readFileSync(globFile, 'utf8');

const searchStr = 'case"ENAMETOOLONG":case"UNKNOWN":';
const replaceStr = 'case"ENAMETOOLONG":case"UNKNOWN":case"EPERM":';

if (content.includes(replaceStr)) {
  console.log('Already patched!');
  process.exit(0);
}

if (!content.includes(searchStr)) {
  console.log('ERROR: Pattern not found in glob.js!');
  process.exit(1);
}

content = content.replace(searchStr, replaceStr);
fs.writeFileSync(globFile, content);
console.log('Successfully patched glob.js: added EPERM to handled error codes');
