/**
 * Ujian hujung-ke-hujung: halaman HTML sebenar dibuka dalam Chromium (saiz telefon)
 * dan google.script.run disambung terus kepada dist/Code.gs dalam simulasi.
 * Tangkapan skrin disimpan dalam dokumen/tangkapan-skrin/ (data palsu sahaja).
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { PNG } = require('pngjs');
const { cipta } = require('./gas-mock');
const C = require('../src/Core.js');

let chromium;
try { chromium = require('playwright').chromium; } catch (e) {
  try { chromium = require(path.join(execSync('npm root -g').toString().trim(), 'playwright')).chromium; } catch (e2) { chromium = null; }
}

const MULA = C.masaTempatanKeMs('2026-11-01T00:00');
const TANGKAPAN = path.join(__dirname, '..', 'dokumen', 'tangkapan-skrin');

const SHIM = `
(function () {
  function runner(ok, gagal) {
    return new Proxy({}, { get: function (_, k) {
      if (k === 'withSuccessHandler') return function (f) { return runner(f, gagal); };
      if (k === 'withFailureHandler') return function (f) { return runner(ok, f); };
      return function () {
        var a = Array.prototype.slice.call(arguments);
        window.__gas(k, JSON.stringify(a)).then(function (r) { if (ok) ok(JSON.parse(r)); }, function (e) { if (gagal) gagal(e); });
      };
    } });
  }
  window.google = { script: { run: runner() } };
})();`;

function pngPalsu() {
  const png = new PNG({ width: 400, height: 600 });
  for (let i = 0; i < png.data.length; i += 4) { png.data[i] = 240; png.data[i + 1] = 240; png.data[i + 2] = 230; png.data[i + 3] = 255; }
  return PNG.sync.write(png);
}

test('aliran penuh dalam pelayar: borang -> dashboard -> cabutan', { skip: !chromium && 'Playwright tiada' }, async () => {
  fs.mkdirSync(TANGKAPAN, { recursive: true });
  const g = cipta({ senyap: true });
  g.setMasa(MULA - 86400000);
  const kata = /Kata laluan sementara: (\S+)/.exec(g.gs.sediakanSistem())[1];
  const tk = g.gs.adminLogMasuk('admin', kata).token;
  g.gs.adminTukarKataLaluan(tk, kata, 'Rahsia12345');
  g.gs.adminSimpanTetapan(tk, { tarikhMula: '2026-11-01T00:00', tarikhTamat: '2026-11-30T23:59', minSumbangan: 10, hadiah: 'Goldbar 999.9' });
  g.setMasa(MULA + 3600000);

  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const panggilan = [];
  await ctx.exposeFunction('__gas', (nama, args) => {
    if (nama.endsWith('_') || typeof g.gs[nama] !== 'function') throw new Error('Fungsi tidak dibenarkan: ' + nama);
    panggilan.push(nama);
    return JSON.stringify(g.gs[nama](...JSON.parse(args)) ?? null);
  });
  await ctx.addInitScript(SHIM);
  const ralatHalaman = [];
  const buka = async (param) => {
    const page = await ctx.newPage();
    page.on('pageerror', (e) => ralatHalaman.push(e.message));
    await page.setContent(g.gs.doGet({ parameter: param }).getContent());
    return page;
  };

  try {
    // ---- Borang awam ----
    const p = await buka({});
    await page_screenshot(p, '01-borang.png', true);
    await p.click('#hantar');
    assert.equal(await p.locator('.medan.salah').count(), 8, '8 medan wajib ditanda');
    await page_screenshot(p, '02-borang-ralat.png', false);

    await p.fill('#nama', 'Peserta Contoh Ujian');
    await p.fill('#telefon', '012-3456789');
    await p.fill('#jumlah', '100');
    await p.fill('#tarikh', '2026-11-01');
    await p.selectOption('#saluran', 'DuitNow QR');
    await p.setInputFiles('#fail', { name: 'resit.png', mimeType: 'image/png', buffer: pngPalsu() });
    await p.locator('#pratonton img').waitFor();
    await p.check('#pengesahan');
    await p.check('#persetujuan');
    g.majuMasa(20000);
    await p.click('#hantar');
    await p.locator('#berjaya').waitFor({ state: 'visible' });
    const id = (await p.textContent('#idPenyertaan')).trim();
    assert.match(id, /^INF-00001-/);
    await page_screenshot(p, '03-borang-berjaya.png', true);
    assert.equal(g.helaian.Penyertaan.data.length, 2);
    assert.equal(g.fail[g.helaian.Penyertaan.data[1][10]].mime, 'image/png');

    // ---- Dashboard ----
    const d = await buka({ p: 'admin' });
    await d.setViewportSize({ width: 1180, height: 820 }); // iPad mendatar
    await d.fill('#lmPengguna', 'admin');
    await d.fill('#lmKata', 'Rahsia12345');
    await d.click('#lmButang');
    await d.locator('#sJumlah', { hasText: '1' }).waitFor();
    assert.equal(await d.textContent('#sMenunggu'), '1');
    await page_screenshot(d, '04-dashboard-ringkasan.png', false);

    await d.click('nav button[data-v="penyertaan"]');
    await d.locator(`tr[data-id="${id}"]`).click();
    await d.click('#mLihat');
    await d.locator('#mResit img').waitFor();
    await page_screenshot(d, '05-dashboard-semak-resit.png', false);
    d.once('dialog', (dl) => dl.accept());
    await d.click('[data-s="LULUS"]');
    await d.locator('#modal.tersembunyi').waitFor({ state: 'attached' });
    await d.locator(`tr[data-id="${id}"] .l-lulus`).waitFor();
    assert.equal(g.helaian.Penyertaan.data[1][13], 'LULUS');

    // eksport CSV dimuat turun
    const [muat] = await Promise.all([d.waitForEvent('download'), d.click('#bEksport')]);
    assert.match(muat.suggestedFilename(), /\.csv$/);

    // cabutan ujian
    g.gs.adminJanaDataUjian(tk, 30);
    await d.click('nav button[data-v="cabutan"]');
    await d.locator('#cInfo', { hasText: 'data ujian' }).waitFor();
    d.once('dialog', (dl) => dl.accept());
    await d.click('#bCabut');
    await d.locator('#cHasil .pemenang-hasil').first().waitFor();
    await page_screenshot(d, '06-dashboard-cabutan.png', false);

    // ---- Paparan siaran langsung ----
    const v = await buka({ p: 'paparan', ujian: '1' });
    await v.setViewportSize({ width: 1280, height: 720 });
    await v.click('#dedahSemua');
    await v.locator('.pemenang').first().waitFor();
    const teks = await v.textContent('body');
    assert.doesNotMatch(teks, /6010000|Peserta Ujian 0/, 'tiada telefon / nama penuh');
    await page_screenshot(v, '07-paparan-cabutan.png', false);

    // ---- Privasi ----
    const pv = await buka({ p: 'privasi' });
    await page_screenshot(pv, '08-notis-privasi.png', false);

    assert.deepEqual(ralatHalaman, [], 'tiada ralat JavaScript');
    assert.ok(!panggilan.some((n) => n.endsWith('_')));
  } finally {
    await browser.close();
  }
});

async function page_screenshot(page, nama, penuh) {
  await page.waitForTimeout(150);
  await page.screenshot({ path: path.join(TANGKAPAN, nama), fullPage: !!penuh });
}
