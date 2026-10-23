/**
 * Ujian integrasi: menjalankan dist/Code.gs SEBENAR terhadap simulasi Google (gas-mock.js).
 * Semua data adalah palsu.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const { cipta } = require('./gas-mock');
const C = require('../src/Core.js');

const MULA = C.masaTempatanKeMs('2026-11-01T00:00');
const TAMAT = C.masaTempatanKeMs('2026-11-30T23:59');
const JPG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.from('resit palsu 1')]);
const PDF = Buffer.from('%PDF-1.4 resit palsu');
const sha = (s) => crypto.createHash('sha256').update(s, 'utf8').digest('hex');
const j = (x) => JSON.parse(JSON.stringify(x)); // meniru serialisasi google.script.run

/** Sediakan sistem, log masuk admin, tukar kata laluan, tetapkan tarikh kempen. */
function sediakan() {
  const g = cipta({ senyap: true });
  g.setMasa(MULA - 86400000);
  const mesej = g.gs.sediakanSistem();
  const kata = /Kata laluan sementara: (\S+)/.exec(mesej)[1];
  let r = g.gs.adminLogMasuk('admin', kata);
  assert.equal(r.ok, true);
  assert.equal(r.mestiTukar, true);
  assert.equal(g.gs.adminRingkasan(r.token).mestiTukar, true, 'mesti tukar kata laluan sebelum guna');
  assert.equal(g.gs.adminTukarKataLaluan(r.token, kata, 'KataBaru12345').ok, true);
  const token = r.token;
  r = g.gs.adminSimpanTetapan(token, { tarikhMula: '2026-11-01T00:00', tarikhTamat: '2026-11-30T23:59', minSumbangan: 10 });
  assert.equal(r.ok, true, r.ralat);
  return { g, token };
}

function borang(g, ujian) {
  const html = g.gs.doGet({ parameter: ujian ? { ujian: '1' } : {} }).getContent();
  return JSON.parse(/var DATA = (\{.*?\});\n/.exec(html)[1]);
}

let nTel = 0;
function penyertaan(g, lain = {}) {
  const { fail, ...rest } = lain;
  const d = borang(g, lain.ujian);
  g.majuMasa(5000);
  const hariIni = C.tarikhTempatan(g.sekarang());
  return j(g.gs.hantarPenyertaan(j({
    nama: 'Peserta Palsu', telefon: '012-' + String(1000000 + ++nTel), jumlah: '50',
    tarikh: hariIni < '2026-11-01' ? hariIni : '2026-11-01', saluran: 'DuitNow QR', rujukan: '',
    pengesahan: true, persetujuan: true, laman: '', token: d.token, ujian: false,
    fail: { data: (fail || JPG).toString('base64') }, ...rest,
  })));
}

test('persediaan sistem: helaian, folder sulit, akaun admin, boleh diulang', () => {
  const g = cipta({ senyap: true });
  const m = g.gs.sediakanSistem();
  assert.match(m, /Nama pengguna: admin/);
  for (const h of ['Penyertaan', 'Cabutan', 'Senarai Layak Cabutan', 'Audit']) assert.ok(g.helaian[h], h);
  assert.equal(g.helaian.Sheet1, undefined, 'helaian kosong lalai dipadam');
  assert.ok(g.sifat.RAHSIA && g.sifat.FOLDER_ID);
  const m2 = g.gs.sediakanSistem();
  assert.doesNotMatch(m2, /Kata laluan sementara/, 'tidak cipta semula admin');
  assert.equal(g.helaian.Penyertaan.getProtections().length, 1, 'perlindungan tidak berganda');
});

test('borang ditutup sebelum/selepas kempen; mod ujian berasingan', () => {
  const { g, token } = sediakan();
  let d = borang(g);
  assert.equal(d.statusKempen, 'BELUM_MULA');
  assert.match(penyertaan(g).mesej, /belum dibuka/);
  const ujian = penyertaan(g, { ujian: true });
  assert.equal(ujian.ok, true);
  assert.match(ujian.id, /^UJI-/);

  g.setMasa(MULA + 1000);
  assert.equal(borang(g).statusKempen, 'DIBUKA');
  assert.equal(penyertaan(g).ok, true);

  g.setMasa(TAMAT + 60001);
  assert.match(penyertaan(g).mesej, /tamat/);

  g.gs.adminSimpanTetapan(token, { benarkanUjian: false });
  assert.equal(borang(g, true).ujian, false);
  assert.match(penyertaan(g, { ujian: true }).mesej, /ujian telah ditutup/);
});

test('penghantaran sah: rekod, fail resit sulit, cap masa pelayan, ID unik', () => {
  const { g, token } = sediakan();
  g.setMasa(MULA + 3600000);
  const r = penyertaan(g, { nama: 'Aminah binti Abu', telefon: '019-8765432', jumlah: '1,250.50', rujukan: 'tx-001', fail: PDF });
  assert.equal(r.ok, true, r.mesej);
  assert.match(r.id, /^INF-00001-[0-9A-F]{4}$/);
  assert.equal(r.masa, C.formatMasa(g.sekarang()));
  const baris = g.helaian.Penyertaan.data[1];
  assert.equal(baris[0], r.id);
  assert.equal(baris[2], String(g.sekarang()), 'cap masa pelayan, bukan masa dari peranti');
  assert.equal(baris[5], '60198765432');
  assert.equal(baris[6], '1250.50');
  assert.equal(baris[9], 'TX-001');
  assert.equal(baris[13], 'MENUNGGU PENGESAHAN');
  const fail = g.fail[baris[10]];
  assert.equal(fail.mime, 'application/pdf');
  assert.equal(fail.induk, g.sifat.FOLDER_ID);
  assert.deepEqual(Buffer.from(fail.bait.map((b) => (b + 256) % 256)), PDF);

  const lihat = j(g.gs.adminLihatResit(token, r.id));
  assert.equal(lihat.ok, true);
  assert.deepEqual(Buffer.from(lihat.data.data, 'base64'), PDF);
  const audit = g.helaian.Audit.data.map((x) => x[3]);
  assert.ok(audit.includes('LIHAT RESIT'), 'melihat resit direkod');
});

test('pengesahan input & perlindungan spam', () => {
  const { g } = sediakan();
  g.setMasa(MULA + 1000);
  let r = penyertaan(g, { telefon: '12345', nama: '=CMD()', fail: Buffer.from('MZ fail exe') });
  assert.equal(r.ok, false);
  assert.ok(r.ralat.telefon && r.ralat.nama && r.ralat.fail);
  assert.match(penyertaan(g, { fail: Buffer.alloc(0) }).ralat.fail, /muat naik/);
  const besar = Buffer.concat([JPG, Buffer.alloc(5 * 1024 * 1024)]);
  assert.match(penyertaan(g, { fail: besar }).ralat.fail, /5 MB/);
  assert.match(penyertaan(g, { laman: 'http://spam' }).mesej, /tidak dapat diproses/);
  assert.match(penyertaan(g, { token: '123.abc' }).mesej, /tidak sah/);
  assert.match(penyertaan(g, { pengesahan: 'true' }).ralat.pengesahan, /sahkan/);

  const d = borang(g); // terlalu pantas (bot)
  const pantas = g.gs.hantarPenyertaan(j({ nama: 'Bot Bot', telefon: '0123456789', jumlah: '50', tarikh: '2026-11-01', saluran: 'DuitNow QR', pengesahan: true, persetujuan: true, token: d.token, fail: { data: JPG.toString('base64') } }));
  assert.match(pantas.mesej, /terlalu pantas/);
  assert.equal(g.helaian.Penyertaan.data.length, 1, 'tiada rekod ditulis');

  // had kadar: 5 penghantaran sejam bagi nombor sama
  const tel = '013-9999999';
  for (let i = 0; i < 5; i++) assert.equal(penyertaan(g, { telefon: tel, fail: Buffer.concat([JPG, Buffer.from('k' + i)]) }).ok, true);
  assert.match(penyertaan(g, { telefon: tel, fail: Buffer.concat([JPG, Buffer.from('k9')]) }).mesej, /Terlalu banyak/);
});

test('penyertaan pendua & resit berulang ditanda untuk semakan manual', () => {
  const { g } = sediakan();
  g.setMasa(MULA + 1000);
  const a = penyertaan(g, { telefon: '0111111111' });
  const ulang = penyertaan(g, { telefon: '0111111111' });
  assert.equal(ulang.pendua, true);
  assert.equal(ulang.id, a.id, 'hantar semula = ID asal, tiada rekod baru');
  assert.equal(g.helaian.Penyertaan.data.length, 2);

  const lain = penyertaan(g, { telefon: '0122222222' }); // resit sama, telefon lain
  assert.equal(lain.ok, true);
  const baris = g.helaian.Penyertaan.data[2];
  assert.equal(baris[13], 'PERLU SEMAKAN MANUAL');
  assert.match(baris[14], /RESIT BERULANG/);

  const tinggi = penyertaan(g, { jumlah: '9000', fail: Buffer.concat([JPG, Buffer.from('t')]) });
  assert.equal(tinggi.ok, true);
  assert.match(g.helaian.Penyertaan.data[3][14], /JUMLAH LUAR BIASA/);
});

test('akses tanpa kebenaran ditolak', () => {
  const { g, token } = sediakan();
  for (const fn of ['adminRingkasan', 'adminSenarai', 'adminEksportCsv', 'adminAudit', 'adminSenaraiPentadbir']) {
    const r = g.gs[fn]('token-palsu');
    assert.equal(r.ok, false, fn); assert.equal(r.sesiTamat, true, fn);
    assert.equal(g.gs[fn](undefined).ok, false);
  }
  assert.equal(g.gs.adminLihatResit('', 'INF-00001-AAAA').ok, false);
  assert.equal(g.gs.adminTukarStatus(null, 'x', 'LULUS', '').ok, false);
  assert.equal(g.gs.adminJalankanCabutan('x', { kaedah: 'RAWAK', bilPemenang: 1 }).ok, false);

  // kata laluan salah -> kunci selepas 5 cubaan
  for (let i = 0; i < 5; i++) assert.equal(g.gs.adminLogMasuk('admin', 'salah' + i).ok, false);
  assert.match(g.gs.adminLogMasuk('admin', 'KataBaru12345').ralat, /Terlalu banyak/);

  // penyemak tidak boleh buat cabutan/tetapan
  const baru = j(g.gs.adminTambahPentadbir(token, { pengguna: 'staf1', nama: 'Staf Satu', peranan: 'PENYEMAK' }));
  const t2 = g.gs.adminLogMasuk('staf1', baru.data.kataSementara).token;
  g.gs.adminTukarKataLaluan(t2, baru.data.kataSementara, 'StafBaru9999');
  assert.equal(g.gs.adminRingkasan(t2).ok, true);
  assert.match(g.gs.adminJalankanCabutan(t2, { kaedah: 'RAWAK', ujian: true, bilPemenang: 1 }).ralat, /Pentadbir Utama/);
  assert.match(g.gs.adminSimpanTetapan(t2, { minSumbangan: 0 }).ralat, /Pentadbir Utama/);
  assert.match(g.gs.adminTambahPentadbir(t2, { pengguna: 'jahat' }).ralat, /Pentadbir Utama/);

  // nyahaktif -> sesi terus tidak sah
  g.gs.adminTukarAktif(token, 'staf1', false);
  assert.equal(g.gs.adminRingkasan(t2).sesiTamat, true);
  g.gs.adminLogKeluar(token);
  assert.equal(g.gs.adminRingkasan(token).sesiTamat, true);

  // kata laluan tidak disimpan dalam bentuk asal
  assert.doesNotMatch(g.sifat.PENTADBIR, /KataBaru12345|StafBaru9999/);
  // halaman admin tidak mengandungi rahsia
  const html = g.gs.doGet({ parameter: { p: 'admin' } }).getContent();
  assert.ok(!html.includes(g.sifat.RAHSIA));
});

test('kelulusan, penolakan, pembetulan & sejarah audit', () => {
  const { g, token } = sediakan();
  g.setMasa(MULA + 1000);
  const a = penyertaan(g), b = penyertaan(g, { fail: PDF }), c = penyertaan(g, { fail: Buffer.concat([JPG, Buffer.from('c')]) });
  assert.match(g.gs.adminTukarStatus(token, b.id, 'DITOLAK', '').ralat, /sebab/);
  assert.match(g.gs.adminTukarStatus(token, a.id, 'DIPADAM', 'x').ralat, /tidak sah/);
  let r = j(g.gs.adminTukarStatus(token, a.id, 'LULUS', ''));
  assert.equal(r.ok, true); assert.equal(r.data.layak, true);
  r = j(g.gs.adminTukarStatus(token, b.id, 'DITOLAK', 'Resit kabur'));
  assert.equal(r.data.status, 'DITOLAK');
  r = j(g.gs.adminTukarStatus(token, c.id, 'PERLU PEMBETULAN', '=Jumlah tidak sepadan'));
  assert.equal(r.data.catatan, '=Jumlah tidak sepadan', 'catatan bermula = disimpan dengan selamat');

  const ring = j(g.gs.adminRingkasan(token)).data;
  assert.equal(ring.jumlah, 3); assert.equal(ring.lulus, 1); assert.equal(ring.ditolak, 1); assert.equal(ring.pembetulan, 1);
  assert.equal(ring.rmDisahkan, 50); assert.equal(ring.rmDirekod, 100);
  const audit = j(g.gs.adminAudit(token)).data;
  assert.ok(audit.some((x) => x.tindakan === 'TUKAR STATUS' && x.sasaran === b.id && /Resit kabur/.test(x.butiran)));

  const cari = j(g.gs.adminSenarai(token, { carian: a.id })).data;
  assert.equal(cari.jumlah, 1);
  assert.equal(j(g.gs.adminSenarai(token, { status: 'DITOLAK' })).data.entri[0].id, b.id);
});

test('eksport CSV', () => {
  const { g, token } = sediakan();
  g.setMasa(MULA + 1000);
  const a = penyertaan(g, { nama: 'Ali bin Abu' });
  assert.equal(a.ok, true);
  g.gs.adminTukarStatus(token, a.id, 'DITOLAK', 'Resit, "kabur"');
  const r = j(g.gs.adminEksportCsv(token, {}));
  assert.equal(r.ok, true);
  assert.equal(r.data.bil, 1);
  const baris = r.data.csv.split('\r\n');
  assert.equal(baris.length, 2);
  assert.match(baris[0], /^﻿ID Penyertaan,/);
  assert.match(baris[1], /,Ali bin Abu,012-\d{7},50\.00,/);
  assert.match(baris[1], /"Resit, ""kabur"""/);
  assert.ok(g.helaian.Audit.data.some((x) => x[3] === 'EKSPORT CSV'));
});

test('peserta terpantas & cabutan rasmi: syarat, rekod audit, boleh disahkan semula', () => {
  const { g, token } = sediakan();
  g.setMasa(MULA + 1000);
  const ids = [];
  for (let i = 0; i < 12; i++) ids.push(penyertaan(g, { fail: Buffer.concat([JPG, Buffer.from('r' + i)]) }).id);
  const ulangTel = penyertaan(g, { telefon: '012-' + String(1000000 + nTel), fail: Buffer.concat([JPG, Buffer.from('ulang')]) }); // telefon sama dgn terakhir
  ids.forEach((id, i) => g.gs.adminTukarStatus(token, id, i === 3 ? 'DITOLAK' : 'LULUS', i === 3 ? 'Resit palsu' : ''));
  g.gs.adminTukarStatus(token, ulangTel.id, 'LULUS', '');

  const tp = j(g.gs.adminTerpantas(token, false)).data;
  assert.deepEqual(tp.senarai.slice(0, 4).map((x) => x.id), [ids[0], ids[1], ids[2], ids[4]], 'ikut masa; yang ditolak dikecualikan');
  assert.ok(!tp.senarai.some((x) => x.id === ulangTel.id), 'satu peluang setiap telefon');

  // belum tamat -> cabutan rasmi disekat
  assert.match(g.gs.adminJalankanCabutan(token, { kaedah: 'RAWAK', bilPemenang: 1 }).ralat, /selepas tempoh kempen tamat/);
  g.setMasa(TAMAT + 3600000);
  const pending = penyertaan(g); // kempen tamat -> ditolak
  assert.equal(pending.ok, false);

  // masih ada penyertaan menunggu? tambah satu sebelum tamat untuk uji syarat
  g.setMasa(MULA + 2000000);
  const menunggu = penyertaan(g, { fail: Buffer.concat([JPG, Buffer.from('m')]) });
  g.setMasa(TAMAT + 3600000);
  assert.match(g.gs.adminJalankanCabutan(token, { kaedah: 'RAWAK', bilPemenang: 1 }).ralat, /belum disemak/);
  g.gs.adminTukarStatus(token, menunggu.id, 'LULUS', '');

  const r = j(g.gs.adminJalankanCabutan(token, { kaedah: 'RAWAK', bilPemenang: 2, bilSimpanan: 2, hadiah: 'Goldbar 5g' }));
  assert.equal(r.ok, true, r.ralat);
  const c = r.data;
  assert.equal(c.pemenang.length, 2); assert.equal(c.simpanan.length, 2);
  assert.equal(c.bilLayak, 12); // 13 lulus - 1 telefon berulang
  const semua = [...c.pemenang, ...c.simpanan].map((p) => p.id);
  assert.equal(new Set(semua).size, 4);
  assert.ok(!semua.includes(ids[3]) && !semua.includes(ulangTel.id));
  assert.match(c.pemenang[0].nama, /\*/, 'nama ditopeng');

  // pengesahan bebas: senarai layak + benih -> keputusan sama
  const senarai = g.helaian['Senarai Layak Cabutan'].data.slice(1).filter((x) => x[0] === c.id).map((x) => x[2]);
  assert.equal(senarai.length, 12);
  assert.equal(C.hashSenarai(senarai, sha), c.hashSenarai);
  assert.deepEqual(C.pilihRawak(senarai, 4, c.benih, sha), semua);

  // tiada cabutan semula secara senyap
  assert.match(g.gs.adminJalankanCabutan(token, { kaedah: 'RAWAK', bilPemenang: 2 }).ralat, /sudah wujud/);
  assert.match(g.gs.adminBatalCabutan(token, c.id, 'x').ralat, /sebab/);
  assert.equal(g.gs.adminBatalCabutan(token, c.id, 'Ralat bilangan pemenang semasa majlis').ok, true);
  assert.equal(g.gs.adminJalankanCabutan(token, { kaedah: 'RAWAK', bilPemenang: 3 }).ok, true);
  const rekod = j(g.gs.adminSenaraiCabutan(token)).data;
  assert.equal(rekod.length, 2);
  assert.equal(rekod[1].status, 'DIBATALKAN');
  assert.match(rekod[1].catatan, /Ralat bilangan/);
  const audit = j(g.gs.adminAudit(token)).data.map((x) => x.tindakan);
  assert.ok(audit.includes('BATAL CABUTAN') && audit.includes('CABUTAN RASMI RAWAK'));

  // kaedah terpantas rasmi = 10 terawal yang layak
  const tpr = j(g.gs.adminJalankanCabutan(token, { kaedah: 'TERPANTAS', bilPemenang: 3, bilSimpanan: 1 })).data;
  assert.deepEqual(tpr.pemenang.map((x) => x.id), [ids[0], ids[1], ids[2]]);
  assert.deepEqual(tpr.simpanan.map((x) => x.id), [ids[4]]);

  // paparan awam: tiada telefon/nama penuh
  const awam = JSON.stringify(g.gs.paparanKeputusan(false));
  assert.doesNotMatch(awam, /601\d{7}|Peserta Palsu|FAIL-/);
  assert.match(awam, /Pe\*+ Pa\*+/);
  assert.equal(j(g.gs.paparanKeputusan(false)).cabutan.length, 2, 'hanya cabutan AKTIF');
});

test('cabutan ujian hanya guna data ujian & tidak campur rasmi', () => {
  const { g, token } = sediakan();
  g.setMasa(MULA + 1000);
  const sebenar = penyertaan(g);
  g.gs.adminTukarStatus(token, sebenar.id, 'LULUS', '');
  assert.equal(j(g.gs.adminJanaDataUjian(token, 20)).data, 20);
  const ring = j(g.gs.adminRingkasan(token)).data;
  assert.equal(ring.jumlah, 1, 'data ujian tidak dikira dalam statistik');
  assert.equal(ring.layakUjian, 12);
  const c = j(g.gs.adminJalankanCabutan(token, { kaedah: 'RAWAK', ujian: true, bilPemenang: 3, bilSimpanan: 1 })).data;
  assert.equal(c.jenis, 'UJIAN');
  assert.ok(c.pemenang.every((p) => p.id.startsWith('UJI-')));
  assert.equal(j(g.gs.paparanKeputusan(false)).cabutan.length, 0, 'paparan rasmi kosong');
  assert.equal(j(g.gs.paparanKeputusan(true)).cabutan.length, 1);
  // cabutan ujian boleh diulang tanpa sekatan
  assert.equal(g.gs.adminJalankanCabutan(token, { kaedah: 'RAWAK', ujian: true, bilPemenang: 3 }).ok, true);

  const ujianBorang = penyertaan(g, { ujian: true, fail: Buffer.concat([JPG, Buffer.from('u')]) });
  const failId = g.helaian.Penyertaan.data.find((x) => x[0] === ujianBorang.id)[10];
  assert.equal(j(g.gs.adminPadamDataUjian(token)).data, 21);
  assert.equal(g.fail[failId].sampah, true, 'fail resit ujian dibuang');
  assert.equal(g.helaian.Penyertaan.data.length, 2, 'hanya rekod sebenar kekal');
});

test('semakan integriti mengesan pengubahan manual', () => {
  const { g, token } = sediakan();
  g.setMasa(MULA + 1000);
  penyertaan(g);
  assert.equal(j(g.gs.adminSemakIntegriti(token)).data.ok, true);
  g.helaian.Penyertaan.data[1][2] = String(MULA); // ubah cap masa secara senyap
  g.helaian.Audit.data[2][5] = 'diubah';
  const r = j(g.gs.adminSemakIntegriti(token)).data;
  assert.equal(r.ok, false);
  assert.ok(r.masalah.some((m) => /Penyertaan INF-/.test(m)));
  assert.ok(r.masalah.some((m) => /Log audit baris 3/.test(m)));
  const id = g.helaian.Penyertaan.data[1][0];
  assert.match(g.gs.adminTukarStatus(token, id, 'LULUS', '').ralat, /integriti/);
});

test('halaman HTML: viewport mudah alih, data selamat disuntik', () => {
  const { g } = sediakan();
  for (const p of [{}, { p: 'admin' }, { p: 'paparan' }, { p: 'privasi' }]) {
    const o = g.gs.doGet({ parameter: p });
    assert.match(o.meta.viewport, /width=device-width/);
    assert.ok(!o.getContent().includes('/*__DATA__*/'));
    assert.ok(!o.getContent().includes('/*__GAYA__*/'));
  }
  g.gs.adminSimpanTetapan(sediakan().token, {});
  const { g: g2, token: t2 } = sediakan();
  g2.gs.adminSimpanTetapan(t2, { hadiah: "</script><script>alert(1)</script> $' $&" });
  assert.equal(borang(g2).tetapan.hadiah, "</script><script>alert(1)</script> $' $&", 'corak $ tidak merosakkan halaman');
  assert.ok(!g2.gs.doGet({ parameter: {} }).getContent().includes('</script><script>alert(1)'), 'tiada XSS melalui tetapan');
});
