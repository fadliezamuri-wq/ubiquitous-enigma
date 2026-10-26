// Renders the Borneo icon set to SVG + 4000x4000 JPEG for Adobe Stock.
// Usage: node borneo-stock/build.cjs
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { bold, vintage } = require('./icons.cjs');

const OUT = path.join(__dirname, 'output');
fs.mkdirSync(OUT, { recursive: true });

// Seeded random so the paper specks are identical on every build.
let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

function boldBg() {
  return `<rect width="1000" height="1000" fill="#E9B949"/>
  <radialGradient id="glow" cx="50%" cy="50%" r="60%"><stop offset="0" stop-color="#F2C95F"/><stop offset="1" stop-color="#E9B949" stop-opacity="0"/></radialGradient>
  <rect width="1000" height="1000" fill="url(#glow)"/>`;
}

function paperBg() {
  let specks = '';
  for (let i = 0; i < 260; i++) {
    const c = rand() > 0.5 ? '#b49a78' : '#8c7358';
    specks += `<circle cx="${(rand() * 1000).toFixed(1)}" cy="${(rand() * 1000).toFixed(1)}" r="${(rand() * 2.2 + 0.5).toFixed(2)}" fill="${c}" opacity="${(rand() * 0.5 + 0.2).toFixed(2)}"/>`;
  }
  return `<filter id="paper" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" seed="4"/>
    <feColorMatrix values="0 0 0 0 0.45  0 0 0 0 0.36  0 0 0 0 0.25  0 0 0 0.16 0"/>
  </filter>
  <rect width="1000" height="1000" fill="#EFE7D6"/>
  <rect width="1000" height="1000" filter="url(#paper)"/>
  ${specks}`;
}

const svg = (bg, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">${bg}${body}</svg>`;

(async () => {
  const items = [
    ...Object.entries(bold).map(([k, v]) => [`borneo_bold_${k}`, svg(boldBg(), v)]),
    ...Object.entries(vintage).map(([k, v]) => [`borneo_vintage_${k}`, svg(paperBg(), v)]),
  ];
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1000, height: 1000 }, deviceScaleFactor: 4 });
  for (const [name, s] of items) {
    fs.writeFileSync(path.join(OUT, `${name}.svg`), s);
    await page.setContent(`<html><body style="margin:0">${s}</body></html>`);
    await page.locator('svg').screenshot({ path: path.join(OUT, `${name}.jpg`), type: 'jpeg', quality: 95 });
    console.log('rendered', name);
  }
  // Contact sheet for quick review.
  const thumbs = items.map(([n]) => `<img src="file://${OUT}/${n}.jpg" style="width:294px;height:294px;margin:6px">`).join('');
  const sheet = await browser.newPage({ viewport: { width: 1250, height: 1000 } });
  const sheetFile = path.join(OUT, '_sheet.html');
  fs.writeFileSync(sheetFile, `<body style="margin:0;background:#fff;display:flex;flex-wrap:wrap;padding:6px">${thumbs}</body>`);
  await sheet.goto(`file://${sheetFile}`, { waitUntil: 'load' });
  fs.unlinkSync(sheetFile);
  await sheet.screenshot({ path: path.join(__dirname, 'preview.jpg'), fullPage: true, type: 'jpeg', quality: 80 });
  await browser.close();
})();
