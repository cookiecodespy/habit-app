// Sprint A — precompile JSX→JS offline so the phone never runs Babel.
// Usage: node transpile.js <file.jsx>   → prints compiled JS to stdout
//        node transpile.js --code '<jsx string>'  → transpiles a literal
const babel = require('@babel/core');
const fs = require('fs');

const opts = {
  presets: [['@babel/preset-react', { runtime: 'classic' }]],
  // JSX is the only non-standard syntax; modern mobile browsers run the rest
  // (optional chaining, async, spread) natively, so no preset-env needed.
  babelrc: false,
  configFile: false,
  compact: false,
  comments: false,
};

const arg = process.argv[2];
let code;
if (arg === '--code') {
  code = babel.transform(process.argv[3], { ...opts, filename: 'inline.jsx' }).code;
} else {
  code = babel.transform(fs.readFileSync(arg, 'utf8'), { ...opts, filename: arg }).code;
}
process.stdout.write(code);
