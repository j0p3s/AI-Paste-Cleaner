const fs = require('fs');
const html = fs.readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8');
const core = html.split('// ===== core =====')[1].split('// ===== ui =====')[0];
const { clean, ruleOf } = new Function(core + '; return {clean, ruleOf};')();
const D = {spaces:1,zw:1,bidi:1,ctrl:1,hidden:1,nfc:1,quotes:1,dashes:1,ellipsis:1,fullwidth:0,accents:0,labels:1,langhdr:1,fences:0,linenums:0,dblspace:1,trailing:1,edges:1,collapse:0,tabs:0,finalnl:0};
const tag = s => [...s].map(c => String.fromCodePoint(0xE0000 + c.charCodeAt(0))).join('');
let fails = 0;
function t(name, input, expected, o = {}) {
  const r = clean(input, {...D, ...o});
  const ok = r.text === expected;
  if (!ok) fails++;
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok ? '' : '\n  got: ' + JSON.stringify(r.text) + '\n  exp: ' + JSON.stringify(expected)));
  return r;
}
// Sample from the page
const sample = ['Bash','content_copy','#!/usr/bin/env bash ','','set -euo pipefail​','','for f in *.log; do','','  echo “Archiving $f…”','','  rsync —archive —verbose “$f” backup/'+tag('hidden note'),'','done','','Use code with caution.'].join('\n');
const r = t('page sample', sample, '#!/usr/bin/env bash\nset -euo pipefail\nfor f in *.log; do\n  echo "Archiving $f..."\n  rsync --archive --verbose "$f" backup/\ndone');
console.log('  hidden:', r.hidden, '| notes:', r.notes.map(n=>n.label).join('; '));
t('NBSP indent python', 'def f():\n    return 1', 'def f():\n    return 1');
t('normal blank lines kept', 'a\n\nb\nc\n\nd', 'a\n\nb\nc\n\nd');
t('real double spacing w/ blank', 'a\n\nb\n\n\n\nc\n\nd', 'a\nb\n\nc\nd');
t('PT gemini label', 'echo ola\nUse o código com cuidado.', 'echo ola');
t('ES gemini label', 'echo hola\nUsa el código con precaución.', 'echo hola');
t('comment w/ phrase kept', 'x=1\n# use code with caution', 'x=1\n# use code with caution');
t('emoji ZWJ kept', 'echo "👨‍💻 done"', 'echo "👨‍💻 done"');
t('ZWJ stray removed', 'ab‍cd', 'abcd');
t('england flag kept', 'x 🏴󠁧󠁢󠁥󠁮󠁧󠁿 y', 'x 🏴󠁧󠁢󠁥󠁮󠁧󠁿 y');
t('bidi trojan', 'if a‮ { }', 'if a { }');
t('BOM start .cmd', '﻿@echo off\r\necho hi\r\n', '@echo off\necho hi');
t('accents kept by default', 'echo ação', 'echo ação');
t('accents strip opt', 'echo ação', 'echo acao', {accents:1});
t('fullwidth opt', 'ｐｒｉｎｔ（１）', 'print(1)', {fullwidth:1});
t('fences opt', '```bash\nls -la\n```', 'ls -la', {fences:1});
t('line numbers opt', '1  import os\n2  print(os.name)\n3', 'import os\nprint(os.name)\n', {linenums:1, edges:0});
t('lang header single line kept', 'python', 'python');
t('LS -> newline', 'a b', 'a\nb');
t('final newline opt', 'a', 'a\n', {finalnl:1});
t('quotes off = kept', 'say “hi”', 'say “hi”', {quotes:0});
t('already clean', 'ls -la\necho "ok"', 'ls -la\necho "ok"');
console.log(fails ? fails + ' FAILED' : 'ALL PASS');
// extra cases
console.log('--- extra line-number cases');
t('ln right-aligned + indent', '  9  def f():\n 10      return 1\n 11', 'def f():\n    return 1\n', {linenums:1, edges:0});
t('ln left-aligned', '9   x = 1\n10  y = 2', 'x = 1\ny = 2', {linenums:1});
t('ln pipe sep', '1 | a\n2 |   b', 'a\n  b', {linenums:1});
t('ln not sequential kept', '5 apples\n3 pears', '5 apples\n3 pears', {linenums:1});
t('ln glued digits kept', '10abc\n11def', '10abc\n11def', {linenums:1});
console.log(fails ? fails + ' FAILED' : 'ALL PASS (extra)');
