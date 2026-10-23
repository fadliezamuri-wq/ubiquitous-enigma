/**
 * Pengesahan bebas keputusan cabutan rawak.
 * 1. Dalam Google Sheet, eksport helaian "Senarai Layak Cabutan" sebagai CSV.
 * 2. Salin "ID Cabutan" dan "Benih Rawak" dari helaian "Cabutan".
 * 3. npm run sahkan-cabutan -- <fail.csv> <ID Cabutan> <benih> <bilangan pemenang+simpanan>
 */
const fs = require('fs');
const crypto = require('crypto');
const { pilihRawak, hashSenarai } = require('../src/Core.js');

const [fail, idCabutan, benih, bil] = process.argv.slice(2);
if (!fail || !idCabutan || !benih || !bil) {
  console.error('Guna: npm run sahkan-cabutan -- <senarai.csv> <ID Cabutan> <benih> <bilangan>');
  process.exit(1);
}
const sha = (s) => crypto.createHash('sha256').update(s, 'utf8').digest('hex');
const ids = fs.readFileSync(fail, 'utf8').replace(/^﻿/, '').split(/\r?\n/).slice(1)
  .map((l) => l.split(',').map((x) => x.replace(/^"|"$/g, '').trim()))
  .filter((r) => r[0] === idCabutan).map((r) => r[2]);
console.log('Bilangan peserta layak :', ids.length);
console.log('Hash senarai layak     :', hashSenarai(ids, sha));
console.log('Keputusan (mengikut tertib, pemenang dahulu kemudian simpanan):');
pilihRawak(ids, Number(bil), benih, sha).forEach((id, i) => console.log('  ' + (i + 1) + '. ' + id));
console.log('\nBandingkan dengan lajur "Hash Senarai Layak", "ID Pemenang" dan "ID Simpanan" dalam helaian Cabutan.');
