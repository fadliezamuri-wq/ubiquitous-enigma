/**
 * Jana QR Code (PNG resolusi tinggi + SVG) dan SAHKAN dengan mengimbasnya semula.
 * Guna:  npm run qr -- https://script.google.com/macros/s/XXXX/exec
 * Pilihan --ujian membenarkan pautan contoh (output ditanda CONTOH, jangan cetak).
 */
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const jsQR = require('jsqr');
const { PNG } = require('pngjs');

function semakUrl(url, ujian) {
  let u;
  try { u = new URL(url); } catch (e) { throw new Error('Pautan tidak sah: ' + url); }
  if (u.protocol !== 'https:') throw new Error('Pautan mesti bermula dengan https://');
  if (!ujian) {
    if (/UJIAN|CONTOH|XXXX|example/i.test(url)) throw new Error('Ini kelihatan seperti pautan contoh. Gunakan pautan sebenar.');
    if (u.hostname === 'script.google.com' && !/^\/macros\/s\/[\w-]{20,}\/exec$/.test(u.pathname))
      throw new Error('Pautan Apps Script mesti dalam bentuk https://script.google.com/macros/s/<ID>/exec (bukan /dev).');
  }
  return u.toString();
}

async function janaQr(url, folder, nama = 'qr-borang-infaq') {
  fs.mkdirSync(folder, { recursive: true });
  const pilihan = { errorCorrectionLevel: 'M', margin: 4, color: { dark: '#000000', light: '#ffffff' } };
  const png = path.join(folder, nama + '.png');
  const svg = path.join(folder, nama + '.svg');
  await QRCode.toFile(png, url, { ...pilihan, width: 2000 });
  fs.writeFileSync(svg, await QRCode.toString(url, { ...pilihan, type: 'svg' }));
  // Pengesahan: imbas semula imej (termasuk versi kecil seperti cetakan kecil)
  for (const lebar of [2000, 300]) {
    const buf = await QRCode.toBuffer(url, { ...pilihan, width: lebar });
    const img = PNG.sync.read(buf);
    const hasil = jsQR(new Uint8ClampedArray(img.data), img.width, img.height);
    if (!hasil || hasil.data !== url) throw new Error(`QR ${lebar}px GAGAL diimbas semula dengan betul`);
  }
  return { png, svg };
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const ujian = args.includes('--ujian');
  const url = args.find((a) => !a.startsWith('--'));
  if (!url) { console.error('Guna: npm run qr -- <pautan-borang>'); process.exit(1); }
  const keluar = ujian ? path.join(require('os').tmpdir(), 'qr-contoh') : path.join(__dirname, '..', 'qr');
  Promise.resolve().then(() => janaQr(semakUrl(url, ujian), keluar)).then((r) => {
    console.log('✓ QR dijana dan disahkan (imbasan semula menghasilkan pautan yang sama):');
    console.log('  ' + r.png + '\n  ' + r.svg);
    console.log('Pautan: ' + url);
  }, (e) => { console.error('✗ ' + e.message); process.exit(1); });
}

module.exports = { janaQr, semakUrl };
