const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const C = require('../src/Core.js');

const sha = (s) => crypto.createHash('sha256').update(s, 'utf8').digest('hex');
const tetapan = C.gabungTetapan({ tarikhMula: '2026-11-01T00:00', tarikhTamat: '2026-11-30T23:59', minSumbangan: 10 });

test('normalisasi nombor telefon Malaysia', () => {
  assert.equal(C.normalisasiTelefon('012-345 6789').nilai, '60123456789');
  assert.equal(C.normalisasiTelefon('+6012-3456789').nilai, '60123456789');
  assert.equal(C.normalisasiTelefon('011-12345678').nilai, '601112345678');
  assert.equal(C.normalisasiTelefon('082-123456').nilai, '6082123456');
  for (const salah of ['', '12345', '0123', 'abc0123456789', '0012345678', '+1 555 123 4567', '01234567890123']) {
    assert.equal(C.normalisasiTelefon(salah).ok, false, salah);
  }
});

test('masa tempatan Malaysia (UTC+8)', () => {
  const ms = C.masaTempatanKeMs('2026-11-01T00:00');
  assert.equal(new Date(ms).toISOString(), '2026-10-31T16:00:00.000Z');
  assert.equal(C.tarikhTempatan(ms), '2026-11-01');
  assert.equal(C.formatMasa(ms + 1234), '01/11/2026 00:00:01.234');
  assert.ok(isNaN(C.masaTempatanKeMs('2026-02-30')));
  assert.equal(C.statusKempen(tetapan, ms - 1), 'BELUM_MULA');
  assert.equal(C.statusKempen(tetapan, ms), 'DIBUKA');
  assert.equal(C.statusKempen(tetapan, C.masaTempatanKeMs('2026-12-01')), 'TAMAT');
  assert.equal(C.statusKempen(C.gabungTetapan({}), ms), 'BELUM_DITETAPKAN');
});

test('pengesahan borang', () => {
  const sekarang = C.masaTempatanKeMs('2026-11-10T12:00');
  const sah = { nama: '  Siti   Aminah binti Ali ', telefon: '0198765432', jumlah: 'RM1,000.50', tarikh: '2026-11-09', saluran: 'DuitNow QR', rujukan: 'abc123', pengesahan: true, persetujuan: true };
  const r = C.sahkanBorang(sah, tetapan, sekarang);
  assert.equal(r.ok, true, JSON.stringify(r.ralat));
  assert.equal(r.data.nama, 'Siti Aminah binti Ali');
  assert.equal(r.data.jumlah, 1000.5);
  assert.equal(r.data.rujukan, 'ABC123');

  const salah = C.sahkanBorang({ nama: '=HYPERLINK("x")', telefon: '1', jumlah: '5', tarikh: '2026-11-11', saluran: 'Bitcoin', rujukan: '<script>', pengesahan: 'true' }, tetapan, sekarang);
  assert.equal(salah.ok, false);
  assert.deepEqual(Object.keys(salah.ralat).sort(), ['jumlah', 'nama', 'pengesahan', 'persetujuan', 'rujukan', 'saluran', 'tarikh', 'telefon']);
  assert.match(salah.ralat.jumlah, /minimum/);
  assert.match(salah.ralat.tarikh, /masa hadapan/);
  assert.equal(C.sahkanBorang({ ...sah, jumlah: '10.555' }, tetapan, sekarang).ok, false);
  assert.equal(C.sahkanBorang({ ...sah, jumlah: '-10' }, tetapan, sekarang).ok, false);
});

test('pengesanan jenis fail dari bait sebenar (bukan nama fail)', () => {
  assert.equal(C.jenisFailDariBait([0xff, 0xd8, 0xff, 0xe0]), 'image/jpeg');
  assert.equal(C.jenisFailDariBait([-119, 0x50, 0x4e, 0x47]), 'image/png'); // bait bertanda seperti Apps Script
  assert.equal(C.jenisFailDariBait([0x25, 0x50, 0x44, 0x46, 0x2d]), 'application/pdf');
  assert.equal(C.jenisFailDariBait([0x4d, 0x5a, 0x90, 0x00]), null); // .exe
  assert.equal(C.jenisFailDariBait([0x3c, 0x68, 0x74, 0x6d]), null); // html
});

test('bendera pendua dan mencurigakan', () => {
  const sedia = [{ telefon: '60123456789', jumlah: 50, tarikh: '2026-11-02', saluran: 'DuitNow QR', rujukan: 'R1', hashResit: 'h1' }];
  const b = C.semakBendera({ telefon: '60199999999', jumlah: 9000, tarikh: '2026-10-01', saluran: 'DuitNow QR', rujukan: 'R1', hashResit: 'h1' }, sedia, tetapan, 0);
  assert.deepEqual(b.sort(), [C.BENDERA.JUMLAH_TINGGI, C.BENDERA.RESIT_BERULANG, C.BENDERA.RUJUKAN_BERULANG, C.BENDERA.TARIKH_LUAR_TEMPOH].sort());
  const b2 = C.semakBendera({ telefon: '60123456789', jumlah: 50, tarikh: '2026-11-02', saluran: 'DuitNow QR', rujukan: '', hashResit: 'h2' }, sedia, tetapan, 0);
  assert.deepEqual(b2, [C.BENDERA.MAKLUMAT_SAMA]);
  assert.deepEqual(C.semakBendera({ telefon: '60111111111', jumlah: 50, tarikh: '2026-11-02', saluran: 'X', rujukan: '', hashResit: 'h3' }, sedia, tetapan, 0), []);
});

test('peserta terpantas: cap masa pelayan, pemutus seri turutan, satu peluang setiap telefon', () => {
  const t0 = C.masaTempatanKeMs('2026-11-01T09:00');
  const e = (id, capMasa, turutan, telefon, status = C.STATUS.LULUS) =>
    ({ id, capMasa, turutan, telefon, status, jumlah: 50, tarikh: '2026-11-01' });
  const entri = [
    e('D', t0 + 5, 4, '604'), e('B', t0, 2, '602'), e('A', t0, 1, '601'),
    e('X', t0 - 1, 0, '609', C.STATUS.DITOLAK), e('P', t0 - 2, 5, '608', C.STATUS.MENUNGGU),
    e('A2', t0 + 1, 3, '601'), e('Z', t0 - 99999999999, 6, '607'),
  ];
  assert.deepEqual(C.senaraiLayak(entri, tetapan, false).map((x) => x.id), ['A', 'B', 'D']);
  assert.deepEqual(C.senaraiLayak(entri, { ...tetapan, satuPeluangSetiapTelefon: false }, false).map((x) => x.id), ['A', 'B', 'A2', 'D']);
  assert.deepEqual(C.senaraiTerpantas(entri, { ...tetapan, bilTerpantas: 2 }, false).map((x) => x.id), ['A', 'B']);
});

test('pilihRawak: tiada pendua, boleh diulang dengan benih sama, taburan seragam', () => {
  const ids = Array.from({ length: 10 }, (_, i) => 'INF-' + i);
  const a = C.pilihRawak(ids, 5, 'benih-1', sha);
  assert.equal(new Set(a).size, 5);
  assert.deepEqual(C.pilihRawak([...ids].reverse(), 5, 'benih-1', sha), a, 'tertib input tidak mempengaruhi keputusan');
  assert.notDeepEqual(C.pilihRawak(ids, 5, 'benih-2', sha), a);
  assert.equal(C.pilihRawak(ids, 50, 'x', sha).length, 10);

  const kiraan = Object.fromEntries(ids.map((i) => [i, 0]));
  const N = 20000;
  for (let i = 0; i < N; i++) kiraan[C.pilihRawak(ids, 1, 'b' + i, sha)[0]]++;
  const jangka = N / ids.length;
  const chi = Object.values(kiraan).reduce((s, k) => s + (k - jangka) ** 2 / jangka, 0);
  assert.ok(chi < 27.88, 'khi kuasa dua ' + chi.toFixed(2) + ' (had p=0.001, dk=9)');
});

test('topeng nama & CSV selamat', () => {
  assert.equal(C.topengNama('Muhammad Ali bin Abu'), 'Mu****** Al* bi* Ab*');
  assert.equal(C.topengNama('Ng'), 'N*');
  const csv = C.keCsv([['a', '=1+1', 'x,"y"', '-5']]);
  assert.equal(csv, '﻿a,"\'=1+1","x,""y""","\'-5"');
});

test('tapis & carian', () => {
  const entri = [
    { id: 'INF-00001-AB', nama: 'Ali', telefon: '60123456789', rujukan: '', tarikh: '2026-11-01', status: 'LULUS', capMasa: C.masaTempatanKeMs('2026-11-01T10:00') },
    { id: 'INF-00002-CD', nama: 'Siti', telefon: '60198765432', rujukan: 'TX9', tarikh: '2026-11-02', status: 'DITOLAK', capMasa: C.masaTempatanKeMs('2026-11-03T10:00'), ujian: false },
  ];
  assert.equal(C.tapisEntri(entri, { carian: '012-345' }).length, 1);
  assert.equal(C.tapisEntri(entri, { carian: 'siti' })[0].id, 'INF-00002-CD');
  assert.equal(C.tapisEntri(entri, { carian: 'tx9' }).length, 1);
  assert.equal(C.tapisEntri(entri, { status: 'LULUS' }).length, 1);
  assert.equal(C.tapisEntri(entri, { dari: '2026-11-02' }).length, 1);
  assert.equal(C.tapisEntri(entri, { carian: '2026-11-01' }).length, 1);
});
