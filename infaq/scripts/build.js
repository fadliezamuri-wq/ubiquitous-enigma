/**
 * Menggabungkan semua fail sumber menjadi SATU fail dist/Code.gs
 * supaya mudah disalin & ditampal ke editor Google Apps Script.
 */
const fs = require('fs');
const path = require('path');

const akar = path.join(__dirname, '..');
const baca = (f) => fs.readFileSync(path.join(akar, f), 'utf8');

const gaya = baca('src/html/_gaya.css');
const failLogo = path.join(akar, 'aset', 'logo-yapeim.png');
const logo = fs.existsSync(failLogo)
  ? `<div class="logo-ruang logo-sebenar"><img alt="YAPEIM" src="data:image/png;base64,${fs.readFileSync(failLogo).toString('base64')}"></div>`
  : '<div class="logo-ruang">LOGO RASMI YAPEIM</div>';

const html = {};
for (const nama of ['Borang', 'Dashboard', 'Paparan', 'Privasi']) {
  let h = baca(`src/html/${nama}.html`);
  for (const p of ['/*__GAYA__*/', '<!--__LOGO__-->', '/*__DATA__*/null']) {
    if (!h.includes(p) && p !== '<!--__LOGO__-->') throw new Error(`${nama}.html tiada penanda ${p}`);
  }
  html[nama] = h.replace('/*__GAYA__*/', () => gaya).replace('<!--__LOGO__-->', () => logo);
}

const versi = require('../package.json').version;
const kod = [
  '/**',
  ' * SISTEM INFAQ DAN MENANG GOLDBAR YAPEIM SARAWAK',
  ` * Versi ${versi} — fail ini DIJANA oleh scripts/build.js. Jangan sunting terus;`,
  ' * sunting fail dalam folder src/ dan jalankan "npm run build".',
  ' * Salin KESELURUHAN fail ini ke Code.gs dalam editor Apps Script.',
  ' */',
  '',
  baca('src/Core.js'),
  '',
  '/* ======================= Halaman HTML (dijana) ======================= */',
  'var HTML_ = ' + JSON.stringify(html) + ';',
  '',
  baca('src/Server.js'),
].join('\n');

fs.mkdirSync(path.join(akar, 'dist'), { recursive: true });
fs.writeFileSync(path.join(akar, 'dist', 'Code.gs'), kod);
fs.writeFileSync(path.join(akar, 'dist', 'appsscript.json'), JSON.stringify({
  timeZone: 'Asia/Kuching',
  dependencies: {},
  exceptionLogging: 'STACKDRIVER',
  runtimeVersion: 'V8',
  webapp: { executeAs: 'USER_DEPLOYING', access: 'ANYONE_ANONYMOUS' },
}, null, 2) + '\n');
console.log(`dist/Code.gs dijana (${(kod.length / 1024).toFixed(0)} KB)`);
