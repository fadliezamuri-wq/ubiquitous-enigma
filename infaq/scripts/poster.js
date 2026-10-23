/**
 * Jana poster digital (PNG + PDF saiz A4) dengan QR Code sebenar.
 *
 * Guna:
 *   npm run poster -- <pautan-borang> --tarikh "1 – 30 November 2026" --hadiah "Goldbar 999.9"
 *   (tambah --ujian untuk pratonton dengan pautan contoh; poster akan ditanda CONTOH)
 *
 * Logo: letakkan logo rasmi YAPEIM di aset/logo-yapeim.png. Jika tiada, ruang kosong (placeholder) digunakan.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');
const QRCode = require('qrcode');
const { semakUrl, janaQr } = require('./qr');

function hujah(nama, asal) {
  const i = process.argv.indexOf('--' + nama);
  return i > -1 ? process.argv[i + 1] : asal;
}
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

async function main() {
  const ujian = process.argv.includes('--ujian');
  const url = semakUrl(process.argv.slice(2).find((a, i, arr) => !a.startsWith('--') && !(arr[i - 1] || '').match(/^--(tarikh|hadiah|telefon)$/)), ujian);
  const tarikh = hujah('tarikh', '[TARIKH KEMPEN]');
  const hadiah = hujah('hadiah', 'Goldbar');
  const telefon = hujah('telefon', '[NO. TELEFON YAPEIM SARAWAK]');
  const keluar = ujian ? path.join(os.tmpdir(), 'poster-contoh') : path.join(__dirname, '..', 'qr');
  fs.mkdirSync(keluar, { recursive: true });

  await janaQr(url, keluar); // pastikan QR sah sebelum diletak dalam poster
  const qrSvg = await QRCode.toString(url, { type: 'svg', margin: 2, errorCorrectionLevel: 'M' });
  const failLogo = path.join(__dirname, '..', 'aset', 'logo-yapeim.png');
  const logo = fs.existsSync(failLogo)
    ? `<img class="logo" src="data:image/png;base64,${fs.readFileSync(failLogo).toString('base64')}" alt="YAPEIM">`
    : '<div class="logo ruang">RUANG LOGO RASMI YAPEIM<br><small>(letak fail di aset/logo-yapeim.png)</small></div>';

  const html = `<!DOCTYPE html><html lang="ms"><head><meta charset="utf-8"><style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; } body { margin: 0; font-family: "Helvetica Neue", Arial, sans-serif; }
  .p { width: 210mm; height: 297mm; position: relative; overflow: hidden; color: #fff; text-align: center;
       background: radial-gradient(ellipse at top, #12844f 0%, #0b5d3b 45%, #052a1b 100%); padding: 14mm 14mm 10mm; }
  .logo { height: 24mm; max-width: 80mm; object-fit: contain; display: block; margin: 0 auto; }
  .ruang { width: 70mm; border: 2px dashed rgba(255,255,255,.7); border-radius: 4mm; display: flex; flex-direction: column; align-items: center; justify-content: center; font-weight: 700; font-size: 11pt; }
  .ruang small { font-weight: 400; font-size: 8pt; opacity: .8; }
  h1 { font-size: 40pt; line-height: 1; margin: 8mm 0 0; letter-spacing: 1px; }
  h1 span { display: block; color: #e2bb3c; font-size: 64pt; margin-top: 2mm; text-shadow: 0 2px 0 #8a6b0e; }
  .sub { font-size: 15pt; margin-top: 3mm; opacity: .95; }
  .tarikh { display: inline-block; margin-top: 6mm; background: #e2bb3c; color: #2a1f00; font-weight: 800; font-size: 16pt; padding: 3mm 8mm; border-radius: 20mm; }
  .qrkad { background: #fff; color: #0b5d3b; width: 92mm; margin: 8mm auto 0; border-radius: 6mm; padding: 5mm; box-shadow: 0 3mm 8mm rgba(0,0,0,.3); }
  .qrkad svg { width: 82mm; height: 82mm; display: block; }
  .qrkad b { display: block; font-size: 14pt; margin-top: 2mm; }
  .langkah { display: flex; gap: 4mm; margin-top: 8mm; text-align: left; }
  .langkah div { flex: 1; background: rgba(255,255,255,.1); border: 1px solid rgba(226,187,60,.6); border-radius: 4mm; padding: 4mm; font-size: 10.5pt; line-height: 1.35; }
  .langkah em { display: block; font-style: normal; color: #e2bb3c; font-weight: 800; font-size: 18pt; }
  .hadiah { margin-top: 6mm; font-size: 14pt; } .hadiah b { color: #e2bb3c; }
  .kaki { position: absolute; left: 14mm; right: 14mm; bottom: 8mm; font-size: 8.5pt; opacity: .85; }
  .contoh { position: absolute; top: 120mm; left: -20mm; right: -20mm; transform: rotate(-25deg); font-size: 46pt; font-weight: 900; color: rgba(255,0,0,.55); border: 6px solid rgba(255,0,0,.55); padding: 4mm; }
  </style></head><body><div class="p">
  ${logo}
  <h1>INFAQ DAN MENANG<span>GOLDBAR</span></h1>
  <div class="sub">Kempen Infaq YAPEIM Sarawak</div>
  <div class="tarikh">${esc(tarikh)}</div>
  <div class="qrkad">${qrSvg}<b>IMBAS UNTUK SERTAI</b></div>
  <div class="langkah">
    <div><em>1</em>Buat sumbangan infaq kepada YAPEIM Sarawak.</div>
    <div><em>2</em>Imbas kod QR dan isi borang penyertaan.</div>
    <div><em>3</em>Muat naik resit. Simpan ID penyertaan anda.</div>
  </div>
  <div class="hadiah">Hadiah: <b>${esc(hadiah)}</b> — peserta terpantas yang sah &amp; cabutan bertuah</div>
  <div class="kaki">Tertakluk kepada syarat kempen. Penyertaan hanya sah selepas resit disahkan. YAPEIM tidak akan meminta sebarang bayaran untuk menuntut hadiah.<br>Pertanyaan: ${esc(telefon)}</div>
  ${ujian ? '<div class="contoh">CONTOH — JANGAN CETAK</div>' : ''}
  </div></body></html>`;

  let chromium;
  try { chromium = require('playwright').chromium; } catch (e) {
    chromium = require(path.join(execSync('npm root -g').toString().trim(), 'playwright')).chromium;
  }
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 794, height: 1123 }, deviceScaleFactor: 3 });
  await page.setContent(html);
  const png = path.join(keluar, 'poster-infaq.png');
  const pdf = path.join(keluar, 'poster-infaq.pdf');
  fs.writeFileSync(path.join(keluar, 'poster-infaq.html'), html);
  await page.screenshot({ path: png, clip: { x: 0, y: 0, width: 794, height: 1123 } });
  await page.pdf({ path: pdf, format: 'A4', printBackground: true });
  await browser.close();
  console.log('✓ Poster dijana:\n  ' + png + '\n  ' + pdf);
}

main().catch((e) => { console.error('✗ ' + e.message); process.exit(1); });
