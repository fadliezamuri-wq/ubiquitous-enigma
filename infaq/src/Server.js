/**
 * Server.js — kod pelayan Google Apps Script.
 *
 * Fungsi yang namanya berakhir dengan "_" adalah peribadi: Google tidak membenarkan
 * ia dipanggil dari pelayar. Fungsi admin* awam tetapi setiap satu memerlukan token
 * sesi yang sah (log masuk) sebelum melakukan apa-apa.
 */

var HELAIAN = {
  PENYERTAAN: 'Penyertaan',
  CABUTAN: 'Cabutan',
  SENARAI: 'Senarai Layak Cabutan',
  AUDIT: 'Audit'
};

var LAJUR = ['ID Penyertaan', 'Diterima (Waktu Malaysia)', 'Cap Masa Pelayan (ms)', 'Turutan', 'Nama Penuh',
  'Telefon', 'Jumlah (RM)', 'Tarikh Sumbangan', 'Kaedah Sumbangan', 'No. Rujukan', 'ID Fail Resit', 'Jenis Fail',
  'Hash Resit (SHA-256)', 'Status', 'Bendera Semakan', 'Kelayakan', 'Catatan Pentadbir', 'Disemak Oleh',
  'Disemak Pada', 'Tandatangan Integriti', 'Data Ujian'];
var K = {
  ID: 0, DITERIMA: 1, CAPMASA: 2, TURUTAN: 3, NAMA: 4, TELEFON: 5, JUMLAH: 6, TARIKH: 7, SALURAN: 8, RUJUKAN: 9,
  FAIL: 10, JENIS: 11, HASH: 12, STATUS: 13, BENDERA: 14, KELAYAKAN: 15, CATATAN: 16, OLEH: 17, PADA: 18,
  TANDATANGAN: 19, UJIAN: 20
};
var LAJUR_CABUTAN = ['ID Cabutan', 'Jenis', 'Kaedah', 'Masa', 'Cap Masa (ms)', 'Dijalankan Oleh', 'Bil. Layak',
  'Hash Senarai Layak', 'Benih Rawak', 'Bil. Pemenang', 'Bil. Simpanan', 'ID Pemenang', 'ID Simpanan', 'Status',
  'Hadiah', 'Catatan'];
var LAJUR_SENARAI = ['ID Cabutan', 'Bil.', 'ID Penyertaan'];
var LAJUR_AUDIT = ['Masa', 'Cap Masa (ms)', 'Pentadbir', 'Tindakan', 'Sasaran', 'Butiran', 'Hash Sebelum', 'Hash'];

var PERANAN = { UTAMA: 'UTAMA', PENYEMAK: 'PENYEMAK' };
var TEMPOH_SESI_SAAT = 6 * 60 * 60;
var ULANGAN_HASH_KATA = 300;

/* ======================= Utiliti ======================= */

function prop_() { return PropertiesService.getScriptProperties(); }

function bacaJson_(kunci, asal) {
  var v = prop_().getProperty(kunci);
  return v ? JSON.parse(v) : asal;
}

function simpanJson_(kunci, nilai) { prop_().setProperty(kunci, JSON.stringify(nilai)); }

function tetapan_() { return gabungTetapan(bacaJson_('TETAPAN', null)); }

function keHex_(bait) {
  var s = '';
  for (var i = 0; i < bait.length; i++) {
    var b = (bait[i] + 256) % 256;
    s += (b < 16 ? '0' : '') + b.toString(16);
  }
  return s;
}

function sha256Hex_(teks) {
  return keHex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(teks), Utilities.Charset.UTF_8));
}

function rahsia_() {
  var r = prop_().getProperty('RAHSIA');
  if (!r) throw new Error('Sistem belum disediakan. Jalankan fungsi sediakanSistem dahulu.');
  return r;
}

function hmacHex_(teks) {
  return keHex_(Utilities.computeHmacSha256Signature(String(teks), rahsia_(), Utilities.Charset.UTF_8));
}

function rawakTeks_(panjang) {
  var aksara = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  var bait = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, Utilities.getUuid() + Utilities.getUuid());
  var s = '';
  for (var i = 0; i < panjang; i++) s += aksara.charAt(((bait[i] + 256) % 256) % aksara.length);
  return s;
}

function hamparan_() {
  var id = prop_().getProperty('SPREADSHEET_ID');
  if (!id) throw new Error('Sistem belum disediakan. Jalankan fungsi sediakanSistem dahulu.');
  return SpreadsheetApp.openById(id);
}

function helaian_(nama) { return hamparan_().getSheetByName(nama); }

function denganKunci_(fn) {
  var kunci = LockService.getScriptLock();
  kunci.waitLock(30000);
  try { return fn(); } finally { kunci.releaseLock(); }
}

function teksSel_(v) {
  var s = v == null ? '' : String(v);
  return s.charAt(0) === "'" ? s.slice(1) : s;
}

/* ======================= Data penyertaan ======================= */

function barisKeEntri_(r, noBaris) {
  return {
    baris: noBaris,
    id: teksSel_(r[K.ID]),
    diterima: teksSel_(r[K.DITERIMA]),
    capMasa: Number(teksSel_(r[K.CAPMASA])),
    turutan: Number(teksSel_(r[K.TURUTAN])),
    nama: teksSel_(r[K.NAMA]),
    telefon: teksSel_(r[K.TELEFON]),
    jumlah: Number(teksSel_(r[K.JUMLAH])),
    tarikh: teksSel_(r[K.TARIKH]),
    saluran: teksSel_(r[K.SALURAN]),
    rujukan: teksSel_(r[K.RUJUKAN]),
    fail: teksSel_(r[K.FAIL]),
    jenis: teksSel_(r[K.JENIS]),
    hashResit: teksSel_(r[K.HASH]),
    status: teksSel_(r[K.STATUS]),
    bendera: teksSel_(r[K.BENDERA]),
    kelayakan: teksSel_(r[K.KELAYAKAN]),
    catatan: teksSel_(r[K.CATATAN]),
    oleh: teksSel_(r[K.OLEH]),
    pada: teksSel_(r[K.PADA]),
    tandatangan: teksSel_(r[K.TANDATANGAN]),
    ujian: teksSel_(r[K.UJIAN]) === 'YA'
  };
}

function bacaEntri_() {
  var nilai = helaian_(HELAIAN.PENYERTAAN).getDataRange().getValues();
  var hasil = [];
  for (var i = 1; i < nilai.length; i++) {
    if (nilai[i][K.ID]) hasil.push(barisKeEntri_(nilai[i], i + 1));
  }
  return hasil;
}

function tandatangan_(e) {
  return hmacHex_([e.id, e.capMasa, e.turutan, e.telefon, Number(e.jumlah).toFixed(2), e.hashResit, e.ujian ? 'YA' : ''].join('|'));
}

function entriKeBaris_(e) {
  var b = [];
  b[K.ID] = e.id; b[K.DITERIMA] = formatMasa(e.capMasa); b[K.CAPMASA] = String(e.capMasa);
  b[K.TURUTAN] = String(e.turutan); b[K.NAMA] = e.nama; b[K.TELEFON] = e.telefon;
  b[K.JUMLAH] = Number(e.jumlah).toFixed(2); b[K.TARIKH] = e.tarikh; b[K.SALURAN] = e.saluran;
  b[K.RUJUKAN] = e.rujukan || ''; b[K.FAIL] = e.fail || ''; b[K.JENIS] = e.jenis || '';
  b[K.HASH] = e.hashResit; b[K.STATUS] = e.status; b[K.BENDERA] = e.bendera || '';
  b[K.KELAYAKAN] = e.kelayakan || ''; b[K.CATATAN] = e.catatan || ''; b[K.OLEH] = e.oleh || '';
  b[K.PADA] = e.pada || ''; b[K.TANDATANGAN] = e.tandatangan; b[K.UJIAN] = e.ujian ? 'YA' : '';
  return b.map(selamatSel);
}

function logAudit_(pentadbir, tindakan, sasaran, butiran) {
  var sh = helaian_(HELAIAN.AUDIT);
  var akhir = sh.getLastRow();
  var hashSebelum = akhir > 1 ? teksSel_(sh.getRange(akhir, 8).getValue()) : 'MULA';
  var ms = Date.now();
  var baris = [formatMasa(ms), String(ms), pentadbir, tindakan, sasaran || '', butiran || '', hashSebelum];
  baris.push(hmacHex_(baris.join('|')));
  sh.appendRow(baris.map(selamatSel));
}

/* ======================= Halaman web ======================= */

function doGet(e) {
  var p = (e && e.parameter) || {};
  var tetapan = tetapan_();
  var url = ScriptApp.getService().getUrl();
  var awam = {
    namaKempen: tetapan.namaKempen, tarikhMula: tetapan.tarikhMula, tarikhTamat: tetapan.tarikhTamat,
    minSumbangan: tetapan.minSumbangan, saluran: tetapan.saluran, hadiah: tetapan.hadiah,
    emelPertanyaan: tetapan.emelPertanyaan, telefonPertanyaan: tetapan.telefonPertanyaan,
    tempohSimpanData: tetapan.tempohSimpanData, bilTerpantas: tetapan.bilTerpantas,
    satuPeluangSetiapTelefon: tetapan.satuPeluangSetiapTelefon
  };
  var halaman, tajuk, data;
  if (p.p === 'admin') {
    halaman = 'Dashboard'; tajuk = 'Dashboard Pentadbir'; data = { url: url };
  } else if (p.p === 'paparan') {
    halaman = 'Paparan'; tajuk = 'Keputusan Cabutan'; data = { url: url, ujian: p.ujian === '1', tetapan: awam };
  } else if (p.p === 'privasi') {
    halaman = 'Privasi'; tajuk = 'Notis Privasi & Syarat'; data = { url: url, tetapan: awam };
  } else {
    var ujian = p.ujian === '1' && tetapan.benarkanUjian;
    var ms = Date.now();
    halaman = 'Borang'; tajuk = tetapan.namaKempen;
    data = {
      url: url, tetapan: awam, ujian: ujian, statusKempen: statusKempen(tetapan, ms),
      hariIni: tarikhTempatan(ms), token: ms + '.' + hmacHex_('borang|' + ms).slice(0, 32)
    };
  }
  var json = JSON.stringify(data).replace(/</g, '\\u003c');
  var html = HTML_[halaman].replace('/*__DATA__*/null', function () { return json; });
  return HtmlService.createHtmlOutput(html)
    .setTitle(tajuk)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/* ======================= Penyertaan awam ======================= */

function gagal_(mesej, ralat) { return { ok: false, mesej: mesej, ralat: ralat || {} }; }

function hantarPenyertaan(p) {
  try {
    return hantarPenyertaan_(p || {});
  } catch (err) {
    console.error('hantarPenyertaan', err && err.stack);
    return gagal_('Maaf, berlaku ralat sistem. Sila cuba sebentar lagi.');
  }
}

function hantarPenyertaan_(p) {
  var sekarang = Date.now();
  if (p.laman) return gagal_('Penghantaran tidak dapat diproses.');

  var token = String(p.token || '').split('.');
  var msToken = Number(token[0]);
  if (token.length !== 2 || token[1] !== hmacHex_('borang|' + msToken).slice(0, 32))
    return gagal_('Sesi borang tidak sah. Sila muat semula halaman.');
  if (sekarang - msToken < 3000) return gagal_('Penghantaran terlalu pantas. Sila cuba semula.');
  if (sekarang - msToken > 12 * 3600 * 1000) return gagal_('Sesi borang telah tamat. Sila muat semula halaman.');

  var tetapan = tetapan_();
  var ujian = p.ujian === true;
  if (ujian && !tetapan.benarkanUjian) return gagal_('Mod ujian telah ditutup.');
  if (!ujian) {
    var sk = statusKempen(tetapan, sekarang);
    if (sk === 'BELUM_MULA' || sk === 'BELUM_DITETAPKAN') return gagal_('Kempen belum dibuka.');
    if (sk === 'TAMAT') return gagal_('Kempen telah tamat. Penyertaan tidak lagi diterima.');
  }

  var semakan = sahkanBorang(p, tetapan, sekarang);
  var fail = p.fail || {};
  var bait = null;
  if (!fail.data) semakan.ralat.fail = 'Sila muat naik resit sumbangan.';
  else {
    try { bait = Utilities.base64Decode(String(fail.data)); } catch (e) { bait = null; }
    if (!bait || !bait.length) semakan.ralat.fail = 'Fail resit tidak dapat dibaca.';
    else if (bait.length > SAIZ_FAIL_MAKS) semakan.ralat.fail = 'Saiz fail melebihi 5 MB.';
    else if (!jenisFailDariBait(bait)) semakan.ralat.fail = 'Hanya fail JPG, PNG atau PDF diterima.';
  }
  if (Object.keys(semakan.ralat).length) return gagal_('Sila betulkan maklumat yang ditanda.', semakan.ralat);
  var d = semakan.data;

  // Had kadar (anti-spam)
  var cache = CacheService.getScriptCache();
  var kGlobal = 'kadar_g_' + Math.floor(sekarang / 60000);
  var kTel = 'kadar_t_' + d.telefon;
  var nGlobal = Number(cache.get(kGlobal) || 0);
  var nTel = Number(cache.get(kTel) || 0);
  if (nGlobal >= 60) return gagal_('Sistem sedang sibuk. Sila cuba semula dalam seminit.');
  if (nTel >= 5) return gagal_('Terlalu banyak penghantaran dari nombor ini. Sila cuba semula selepas 1 jam.');
  cache.put(kGlobal, String(nGlobal + 1), 120);
  cache.put(kTel, String(nTel + 1), 3600);

  var mime = jenisFailDariBait(bait);
  var hashResit = keHex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, bait));

  return denganKunci_(function () {
    var semua = bacaEntri_();
    var kumpulan = semua.filter(function (e) { return e.ujian === ujian; });

    for (var i = 0; i < kumpulan.length; i++) {
      var e = kumpulan[i];
      if (e.telefon === d.telefon && e.hashResit === hashResit) {
        return { ok: true, pendua: true, id: e.id, masa: e.diterima, status: e.status };
      }
    }
    var bilTel = kumpulan.filter(function (e) { return e.telefon === d.telefon; }).length;
    if (bilTel >= Number(tetapan.hadPenyertaanSetiapTelefon || 20))
      return gagal_('Had penyertaan bagi nombor telefon ini telah dicapai.');

    var bendera = semakBendera({
      telefon: d.telefon, jumlah: d.jumlah, tarikh: d.tarikh, saluran: d.saluran,
      rujukan: d.rujukan, hashResit: hashResit
    }, kumpulan, tetapan, sekarang);

    var turutan = 1;
    semua.forEach(function (e) { if (e.turutan >= turutan) turutan = e.turutan + 1; });
    var capMasa = Date.now(); // diambil selepas kunci: tertib masa = tertib turutan
    var id = (ujian ? 'UJI-' : 'INF-') + pad(turutan, 5) + '-' + Utilities.getUuid().replace(/-/g, '').slice(0, 4).toUpperCase();

    var folder = DriveApp.getFolderById(prop_().getProperty('FOLDER_ID'));
    var fid = folder.createFile(Utilities.newBlob(bait, mime, id + '.' + JENIS_FAIL[mime])).getId();

    var entri = {
      id: id, capMasa: capMasa, turutan: turutan, nama: d.nama, telefon: d.telefon, jumlah: d.jumlah,
      tarikh: d.tarikh, saluran: d.saluran, rujukan: d.rujukan, fail: fid, jenis: mime, hashResit: hashResit,
      status: bendera.length ? STATUS.SEMAKAN : STATUS.MENUNGGU, bendera: bendera.join('; '),
      kelayakan: 'BELUM DISEMAK', ujian: ujian
    };
    entri.tandatangan = tandatangan_(entri);
    helaian_(HELAIAN.PENYERTAAN).appendRow(entriKeBaris_(entri));
    return { ok: true, id: id, masa: formatMasa(capMasa), status: STATUS.MENUNGGU };
  });
}

/** Keputusan cabutan rasmi terkini — nama ditopeng, tiada telefon atau resit. */
function paparanKeputusan(ujian) {
  try {
    var entri = {};
    bacaEntri_().forEach(function (e) { entri[e.id] = e; });
    var jenis = ujian === true ? 'UJIAN' : 'RASMI';
    var hasil = bacaCabutan_().filter(function (c) { return c.jenis === jenis && c.status === 'AKTIF'; })
      .map(function (c) { return ringkasCabutan_(c, entri); });
    return { ok: true, cabutan: hasil };
  } catch (err) {
    console.error('paparanKeputusan', err && err.stack);
    return { ok: false, mesej: 'Keputusan tidak dapat dimuatkan.' };
  }
}

/* ======================= Pentadbir: sesi ======================= */

function pentadbir_() { return bacaJson_('PENTADBIR', {}); }

function hashKata_(kata, garam) {
  var h = garam + '|' + kata;
  for (var i = 0; i < ULANGAN_HASH_KATA; i++) h = sha256Hex_(h + '|' + garam);
  return h;
}

function adminLogMasuk(namaPengguna, kata) {
  try {
    var u = String(namaPengguna || '').trim().toLowerCase();
    var cache = CacheService.getScriptCache();
    var kGagal = 'gagal_' + u;
    var gagal = Number(cache.get(kGagal) || 0);
    if (gagal >= 5) return { ok: false, ralat: 'Terlalu banyak cubaan gagal. Cuba lagi selepas 15 minit.' };
    var akaun = pentadbir_()[u];
    if (!akaun || !akaun.aktif || hashKata_(String(kata || ''), akaun.garam) !== akaun.hash) {
      cache.put(kGagal, String(gagal + 1), 900);
      if (akaun) denganKunci_(function () { logAudit_(u, 'LOG MASUK GAGAL', '', ''); });
      return { ok: false, ralat: 'Nama pengguna atau kata laluan salah.' };
    }
    cache.remove(kGagal);
    var token = Utilities.getUuid() + Utilities.getUuid();
    cache.put('sesi_' + sha256Hex_(token), JSON.stringify({ u: u }), TEMPOH_SESI_SAAT);
    denganKunci_(function () { logAudit_(u, 'LOG MASUK', '', ''); });
    return { ok: true, token: token, nama: akaun.nama, pengguna: u, peranan: akaun.peranan, mestiTukar: !!akaun.mestiTukar };
  } catch (err) {
    console.error('adminLogMasuk', err && err.stack);
    return { ok: false, ralat: 'Ralat sistem semasa log masuk.' };
  }
}

function adminLogKeluar(token) {
  CacheService.getScriptCache().remove('sesi_' + sha256Hex_(String(token || '')));
  return { ok: true };
}

/** Membungkus setiap fungsi admin: semak sesi & peranan, tangkap ralat. */
function api_(token, perananPerlu, fn) {
  try {
    var sesi = CacheService.getScriptCache().get('sesi_' + sha256Hex_(String(token || '')));
    if (!sesi) return { ok: false, sesiTamat: true, ralat: 'Sesi tamat. Sila log masuk semula.' };
    var u = JSON.parse(sesi).u;
    var akaun = pentadbir_()[u];
    if (!akaun || !akaun.aktif) return { ok: false, sesiTamat: true, ralat: 'Akaun tidak aktif.' };
    if (perananPerlu === PERANAN.UTAMA && akaun.peranan !== PERANAN.UTAMA)
      return { ok: false, ralat: 'Tindakan ini hanya untuk Pentadbir Utama.' };
    if (akaun.mestiTukar && fn !== tukarKataSendiri_)
      return { ok: false, mestiTukar: true, ralat: 'Sila tukar kata laluan sementara anda dahulu.' };
    return { ok: true, data: fn({ pengguna: u, nama: akaun.nama, peranan: akaun.peranan }) };
  } catch (err) {
    if (err && err.pengguna) return { ok: false, ralat: err.message };
    console.error('api', err && err.stack);
    return { ok: false, ralat: 'Ralat sistem. Sila cuba semula.' };
  }
}

function RalatPengguna_(mesej) { var e = new Error(mesej); e.pengguna = true; return e; }

/* ======================= Pentadbir: penyertaan ======================= */

function paparEntri_(e, tetapan) {
  var k = kiraKelayakan(e, tetapan);
  return {
    id: e.id, diterima: e.diterima, capMasa: e.capMasa, turutan: e.turutan, nama: e.nama,
    telefon: paparTelefon(e.telefon), jumlah: e.jumlah, tarikh: e.tarikh, saluran: e.saluran,
    rujukan: e.rujukan, adaResit: !!e.fail, jenis: e.jenis, status: e.status, bendera: e.bendera,
    layak: k.layak, sebabKelayakan: k.sebab, catatan: e.catatan, oleh: e.oleh, pada: e.pada, ujian: e.ujian,
    integriti: e.tandatangan === tandatangan_(e)
  };
}

function adminRingkasan(token) {
  return api_(token, PERANAN.PENYEMAK, function (u) {
    var tetapan = tetapan_();
    var sekarang = Date.now();
    var r = { jumlah: 0, menunggu: 0, semakan: 0, lulus: 0, ditolak: 0, pembetulan: 0, rmDirekod: 0, rmDisahkan: 0, ujian: 0 };
    var entri = bacaEntri_();
    entri.forEach(function (e) {
      if (e.ujian) { r.ujian++; return; }
      r.jumlah++;
      if (e.status === STATUS.MENUNGGU) r.menunggu++;
      if (e.status === STATUS.SEMAKAN) r.semakan++;
      if (e.status === STATUS.LULUS) { r.lulus++; r.rmDisahkan += e.jumlah; }
      if (e.status === STATUS.DITOLAK) r.ditolak++;
      if (e.status === STATUS.PEMBETULAN) r.pembetulan++;
      if (e.status !== STATUS.DITOLAK) r.rmDirekod += e.jumlah;
    });
    r.layak = senaraiLayak(entri, tetapan, false).length;
    r.layakUjian = senaraiLayak(entri, tetapan, true).length;
    r.statusKempen = statusKempen(tetapan, sekarang);
    r.tetapan = tetapan;
    r.pengguna = u;
    r.sekarang = formatMasa(sekarang);
    return r;
  });
}

function adminSenarai(token, tapis) {
  return api_(token, PERANAN.PENYEMAK, function () {
    tapis = tapis || {};
    var tetapan = tetapan_();
    var hasil = tapisEntri(bacaEntri_(), { carian: tapis.carian, status: tapis.status, ujian: !!tapis.ujian, dari: tapis.dari, hingga: tapis.hingga });
    if (tapis.susun === 'awal') hasil.sort(bandingMasa); else hasil.sort(function (a, b) { return bandingMasa(b, a); });
    var saiz = 50;
    var halaman = Math.max(0, Number(tapis.halaman) || 0);
    return {
      jumlah: hasil.length, halaman: halaman, saiz: saiz,
      entri: hasil.slice(halaman * saiz, halaman * saiz + saiz).map(function (e) { return paparEntri_(e, tetapan); })
    };
  });
}

function cariEntri_(id) {
  var e = bacaEntri_().filter(function (x) { return x.id === id; })[0];
  if (!e) throw RalatPengguna_('Penyertaan ' + id + ' tidak dijumpai.');
  return e;
}

function adminLihatResit(token, id) {
  return api_(token, PERANAN.PENYEMAK, function (u) {
    var e = cariEntri_(String(id));
    if (!e.fail) throw RalatPengguna_('Tiada fail resit bagi penyertaan ini (data ujian).');
    var blob = DriveApp.getFileById(e.fail).getBlob();
    denganKunci_(function () { logAudit_(u.pengguna, 'LIHAT RESIT', e.id, ''); });
    return { mime: e.jenis, data: Utilities.base64Encode(blob.getBytes()), nama: e.id + '.' + (JENIS_FAIL[e.jenis] || 'bin') };
  });
}

function adminTukarStatus(token, id, statusBaru, catatan) {
  return api_(token, PERANAN.PENYEMAK, function (u) {
    var dibenar = [STATUS.LULUS, STATUS.DITOLAK, STATUS.PEMBETULAN];
    if (dibenar.indexOf(statusBaru) === -1) throw RalatPengguna_('Status tidak sah.');
    catatan = bersihTeks(catatan, 500);
    if (statusBaru !== STATUS.LULUS && catatan.length < 3) throw RalatPengguna_('Sila nyatakan sebab dalam catatan.');
    return denganKunci_(function () {
      var e = cariEntri_(String(id));
      if (e.tandatangan !== tandatangan_(e)) throw RalatPengguna_('Rekod ini gagal semakan integriti. Rujuk Pentadbir Utama.');
      var lama = e.status;
      var tetapan = tetapan_();
      e.status = statusBaru;
      e.catatan = catatan;
      e.oleh = u.pengguna;
      e.pada = formatMasa(Date.now());
      var k = kiraKelayakan(e, tetapan);
      e.kelayakan = k.layak ? 'LAYAK' : 'TIDAK LAYAK: ' + k.sebab;
      var sh = helaian_(HELAIAN.PENYERTAAN);
      sh.getRange(e.baris, K.STATUS + 1, 1, 1).setValues([[e.status]]);
      sh.getRange(e.baris, K.KELAYAKAN + 1, 1, 4).setValues([[e.kelayakan, e.catatan, e.oleh, e.pada].map(selamatSel)]);
      logAudit_(u.pengguna, 'TUKAR STATUS', e.id, lama + ' -> ' + statusBaru + (catatan ? ' | ' + catatan : ''));
      return paparEntri_(e, tetapan);
    });
  });
}

function adminEksportCsv(token, tapis) {
  return api_(token, PERANAN.PENYEMAK, function (u) {
    tapis = tapis || {};
    var tetapan = tetapan_();
    var entri = tapisEntri(bacaEntri_(), { carian: tapis.carian, status: tapis.status, ujian: !!tapis.ujian, dari: tapis.dari, hingga: tapis.hingga })
      .sort(bandingMasa);
    var baris = [['ID Penyertaan', 'Diterima (Waktu Malaysia)', 'Turutan', 'Nama Penuh', 'Telefon', 'Jumlah (RM)', 'Tarikh Sumbangan',
      'Kaedah', 'No. Rujukan', 'Status', 'Bendera', 'Kelayakan', 'Catatan Pentadbir', 'Disemak Oleh', 'Disemak Pada', 'Data Ujian']];
    entri.forEach(function (e) {
      var k = kiraKelayakan(e, tetapan);
      baris.push([e.id, e.diterima, e.turutan, e.nama, paparTelefon(e.telefon), e.jumlah.toFixed(2), e.tarikh, e.saluran,
        e.rujukan, e.status, e.bendera, k.layak ? 'LAYAK' : 'TIDAK LAYAK: ' + k.sebab, e.catatan, e.oleh, e.pada, e.ujian ? 'YA' : '']);
    });
    denganKunci_(function () { logAudit_(u.pengguna, 'EKSPORT CSV', '', entri.length + ' rekod'); });
    return { namaFail: 'penyertaan-infaq-' + tarikhTempatan(Date.now()) + '.csv', csv: keCsv(baris), bil: entri.length };
  });
}

function adminTerpantas(token, ujian) {
  return api_(token, PERANAN.PENYEMAK, function () {
    var tetapan = tetapan_();
    var entri = bacaEntri_();
    var belumSelesai = entri.filter(function (e) { return !!e.ujian === !!ujian && STATUS_BELUM_SELESAI.indexOf(e.status) !== -1; }).length;
    var senarai = senaraiLayak(entri, tetapan, !!ujian).slice(0, Math.max(Number(tetapan.bilTerpantas) || 0, 1) + 10);
    return {
      bilTerpantas: Number(tetapan.bilTerpantas), belumSelesai: belumSelesai,
      statusKempen: statusKempen(tetapan, Date.now()),
      senarai: senarai.map(function (e, i) {
        return { kedudukan: i + 1, id: e.id, nama: e.nama, telefon: paparTelefon(e.telefon), jumlah: e.jumlah, diterima: e.diterima, capMasa: e.capMasa, turutan: e.turutan };
      })
    };
  });
}

/* ======================= Cabutan ======================= */

function bacaCabutan_() {
  var nilai = helaian_(HELAIAN.CABUTAN).getDataRange().getValues();
  var hasil = [];
  for (var i = 1; i < nilai.length; i++) {
    var r = nilai[i].map(teksSel_);
    if (!r[0]) continue;
    hasil.push({
      baris: i + 1, id: r[0], jenis: r[1], kaedah: r[2], masa: r[3], capMasa: Number(r[4]), oleh: r[5],
      bilLayak: Number(r[6]), hashSenarai: r[7], benih: r[8], bilPemenang: Number(r[9]), bilSimpanan: Number(r[10]),
      pemenang: r[11] ? r[11].split(',') : [], simpanan: r[12] ? r[12].split(',') : [], status: r[13], hadiah: r[14], catatan: r[15]
    });
  }
  return hasil;
}

function ringkasCabutan_(c, peta) {
  var f = function (id, i) { return { kedudukan: i + 1, id: id, nama: topengNama(peta[id] ? peta[id].nama : '') }; };
  return {
    id: c.id, jenis: c.jenis, kaedah: c.kaedah, masa: c.masa, oleh: c.oleh, bilLayak: c.bilLayak, hashSenarai: c.hashSenarai,
    benih: c.benih, hadiah: c.hadiah, status: c.status, catatan: c.catatan,
    pemenang: c.pemenang.map(f), simpanan: c.simpanan.map(f)
  };
}

function adminSenaraiCabutan(token) {
  return api_(token, PERANAN.PENYEMAK, function () {
    var peta = {};
    bacaEntri_().forEach(function (e) { peta[e.id] = e; });
    return bacaCabutan_().reverse().map(function (c) { return ringkasCabutan_(c, peta); });
  });
}

/**
 * @param o {{kaedah:'RAWAK'|'TERPANTAS', ujian:boolean, bilPemenang:number, bilSimpanan:number, hadiah:string}}
 */
function adminJalankanCabutan(token, o) {
  return api_(token, PERANAN.UTAMA, function (u) {
    o = o || {};
    var kaedah = o.kaedah === 'TERPANTAS' ? 'TERPANTAS' : o.kaedah === 'RAWAK' ? 'RAWAK' : null;
    if (!kaedah) throw RalatPengguna_('Kaedah tidak sah.');
    var ujian = o.ujian === true;
    var bilP = Math.floor(Number(o.bilPemenang));
    var bilS = Math.floor(Number(o.bilSimpanan) || 0);
    if (!(bilP >= 1 && bilP <= 100) || !(bilS >= 0 && bilS <= 100)) throw RalatPengguna_('Bilangan pemenang/simpanan tidak sah.');

    return denganKunci_(function () {
      var tetapan = tetapan_();
      var sekarang = Date.now();
      var entri = bacaEntri_();
      var cabutan = bacaCabutan_();
      var jenis = ujian ? 'UJIAN' : 'RASMI';
      if (!ujian) {
        if (statusKempen(tetapan, sekarang) !== 'TAMAT')
          throw RalatPengguna_('Cabutan rasmi hanya boleh dibuat selepas tempoh kempen tamat.');
        var belum = entri.filter(function (e) { return !e.ujian && STATUS_BELUM_SELESAI.indexOf(e.status) !== -1; }).length;
        if (belum > 0) throw RalatPengguna_('Masih ada ' + belum + ' penyertaan belum disemak. Selesaikan pengesahan dahulu.');
        if (cabutan.some(function (c) { return c.jenis === 'RASMI' && c.kaedah === kaedah && c.status === 'AKTIF'; }))
          throw RalatPengguna_('Keputusan rasmi bagi kaedah ini sudah wujud. Batalkan dahulu (dengan sebab) jika benar-benar perlu diulang.');
      }
      var layak = senaraiLayak(entri, tetapan, ujian);
      if (!layak.length) throw RalatPengguna_('Tiada penyertaan layak.');
      var ids = layak.map(function (e) { return e.id; });
      var hashS = hashSenarai(ids, sha256Hex_);
      var benih, dipilih;
      if (kaedah === 'TERPANTAS') {
        benih = '-';
        dipilih = ids.slice(0, bilP + bilS);
      } else {
        benih = sha256Hex_(Utilities.getUuid() + '|' + Utilities.getUuid() + '|' + sekarang + '|' + hashS);
        dipilih = pilihRawak(ids, bilP + bilS, benih, sha256Hex_);
      }
      var pemenang = dipilih.slice(0, bilP);
      var simpanan = dipilih.slice(bilP);
      var id = (ujian ? 'UJIAN-' : 'CAB-') + kaedah.charAt(0) + '-' + tarikhTempatan(sekarang).replace(/-/g, '') + '-' + rawakTeks_(4).toUpperCase();
      var hadiah = bersihTeks(o.hadiah || tetapan.hadiah, 100);
      helaian_(HELAIAN.CABUTAN).appendRow([id, jenis, kaedah, formatMasa(sekarang), String(sekarang), u.pengguna, String(ids.length),
        hashS, benih, String(bilP), String(bilS), pemenang.join(','), simpanan.join(','), 'AKTIF', hadiah,
        ids.length < bilP + bilS ? 'Peserta layak kurang daripada bilangan diminta' : ''].map(selamatSel));
      var shS = helaian_(HELAIAN.SENARAI);
      var barisS = ids.map(function (x, i) { return [id, String(i + 1), x]; });
      if (barisS.length) shS.getRange(shS.getLastRow() + 1, 1, barisS.length, 3).setValues(barisS);
      logAudit_(u.pengguna, 'CABUTAN ' + jenis + ' ' + kaedah, id, 'Layak: ' + ids.length + ' | Pemenang: ' + pemenang.join(',') + ' | Simpanan: ' + simpanan.join(','));
      var peta = {};
      entri.forEach(function (e) { peta[e.id] = e; });
      return ringkasCabutan_(bacaCabutan_().filter(function (c) { return c.id === id; })[0], peta);
    });
  });
}

function adminBatalCabutan(token, idCabutan, sebab) {
  return api_(token, PERANAN.UTAMA, function (u) {
    sebab = bersihTeks(sebab, 300);
    if (sebab.length < 10) throw RalatPengguna_('Sila nyatakan sebab pembatalan dengan jelas (sekurang-kurangnya 10 aksara).');
    return denganKunci_(function () {
      var c = bacaCabutan_().filter(function (x) { return x.id === idCabutan; })[0];
      if (!c) throw RalatPengguna_('Cabutan tidak dijumpai.');
      if (c.status !== 'AKTIF') throw RalatPengguna_('Cabutan ini sudah dibatalkan.');
      helaian_(HELAIAN.CABUTAN).getRange(c.baris, 14, 1, 3)
        .setValues([['DIBATALKAN', c.hadiah, selamatSel((c.catatan ? c.catatan + ' | ' : '') + 'Dibatalkan oleh ' + u.pengguna + ': ' + sebab)]]);
      logAudit_(u.pengguna, 'BATAL CABUTAN', c.id, sebab);
      return true;
    });
  });
}

/* ======================= Audit, tetapan, integriti ======================= */

function adminAudit(token) {
  return api_(token, PERANAN.PENYEMAK, function () {
    var nilai = helaian_(HELAIAN.AUDIT).getDataRange().getValues();
    var hasil = [];
    for (var i = nilai.length - 1; i >= 1 && hasil.length < 300; i--) {
      var r = nilai[i].map(teksSel_);
      hasil.push({ masa: r[0], pentadbir: r[2], tindakan: r[3], sasaran: r[4], butiran: r[5] });
    }
    return hasil;
  });
}

function adminSemakIntegriti(token) {
  return api_(token, PERANAN.PENYEMAK, function (u) {
    var masalah = [];
    bacaEntri_().forEach(function (e) {
      if (e.tandatangan !== tandatangan_(e)) masalah.push('Penyertaan ' + e.id + ' (baris ' + e.baris + '): data asal (masa/telefon/jumlah/resit) telah diubah secara manual.');
    });
    var nilai = helaian_(HELAIAN.AUDIT).getDataRange().getValues();
    var sebelum = 'MULA';
    for (var i = 1; i < nilai.length; i++) {
      var r = nilai[i].map(teksSel_);
      if (r[6] !== sebelum || hmacHex_(r.slice(0, 7).join('|')) !== r[7]) {
        masalah.push('Log audit baris ' + (i + 1) + ' telah diubah atau dipadam.');
      }
      sebelum = r[7];
    }
    denganKunci_(function () { logAudit_(u.pengguna, 'SEMAK INTEGRITI', '', masalah.length ? masalah.length + ' masalah' : 'OK'); });
    return { ok: masalah.length === 0, masalah: masalah };
  });
}

function adminSimpanTetapan(token, t) {
  return api_(token, PERANAN.UTAMA, function (u) {
    t = t || {};
    var lama = tetapan_();
    var baru = gabungTetapan(lama);
    ['namaKempen', 'hadiah', 'emelPertanyaan', 'telefonPertanyaan', 'tempohSimpanData'].forEach(function (k) {
      if (t[k] !== undefined) baru[k] = bersihTeks(t[k], 150);
    });
    ['tarikhMula', 'tarikhTamat'].forEach(function (k) {
      if (t[k] !== undefined) {
        var v = String(t[k] || '').trim();
        if (v && isNaN(masaTempatanKeMs(v))) throw RalatPengguna_('Format tarikh tidak sah.');
        baru[k] = v;
      }
    });
    if (baru.tarikhMula && baru.tarikhTamat && !tempohKempen(baru).sah) throw RalatPengguna_('Tarikh tamat mesti selepas tarikh mula.');
    [['minSumbangan', 0, 100000], ['bilTerpantas', 0, 1000], ['hadJumlahSemakan', 0, 10000000], ['hadPenyertaanSetiapTelefon', 1, 1000]].forEach(function (x) {
      if (t[x[0]] !== undefined) {
        var n = Number(t[x[0]]);
        if (isNaN(n) || n < x[1] || n > x[2]) throw RalatPengguna_('Nilai ' + x[0] + ' tidak sah.');
        baru[x[0]] = n;
      }
    });
    ['satuPeluangSetiapTelefon', 'tarikhSumbanganDalamTempoh', 'benarkanUjian'].forEach(function (k) {
      if (t[k] !== undefined) baru[k] = t[k] === true;
    });
    if (t.saluran !== undefined) {
      var s = (Array.isArray(t.saluran) ? t.saluran : String(t.saluran).split('\n'))
        .map(function (x) { return bersihTeks(x, 80); }).filter(function (x) { return x; });
      if (!s.length) throw RalatPengguna_('Sekurang-kurangnya satu kaedah sumbangan diperlukan.');
      baru.saluran = s;
    }
    return denganKunci_(function () {
      var beza = Object.keys(baru).filter(function (k) { return JSON.stringify(baru[k]) !== JSON.stringify(lama[k]); })
        .map(function (k) { return k + ': ' + JSON.stringify(lama[k]) + ' -> ' + JSON.stringify(baru[k]); });
      simpanJson_('TETAPAN', baru);
      if (beza.length) logAudit_(u.pengguna, 'UBAH TETAPAN', '', beza.join(' | '));
      return baru;
    });
  });
}

/* ======================= Pengurusan pentadbir ======================= */

function adminSenaraiPentadbir(token) {
  return api_(token, PERANAN.UTAMA, function () {
    var p = pentadbir_();
    return Object.keys(p).map(function (k) {
      return { pengguna: k, nama: p[k].nama, peranan: p[k].peranan, aktif: p[k].aktif, mestiTukar: !!p[k].mestiTukar };
    });
  });
}

function cipta_(nama, peranan) {
  var kata = rawakTeks_(12);
  var garam = rawakTeks_(16);
  return { kata: kata, akaun: { nama: nama, peranan: peranan, garam: garam, hash: hashKata_(kata, garam), aktif: true, mestiTukar: true } };
}

function adminTambahPentadbir(token, o) {
  return api_(token, PERANAN.UTAMA, function (u) {
    o = o || {};
    var pengguna = String(o.pengguna || '').trim().toLowerCase();
    if (!/^[a-z0-9._]{3,30}$/.test(pengguna)) throw RalatPengguna_('Nama pengguna 3-30 aksara: huruf kecil, nombor, titik atau _.');
    var peranan = o.peranan === PERANAN.UTAMA ? PERANAN.UTAMA : PERANAN.PENYEMAK;
    var nama = bersihTeks(o.nama, 80) || pengguna;
    return denganKunci_(function () {
      var p = pentadbir_();
      if (p[pengguna]) throw RalatPengguna_('Nama pengguna telah wujud.');
      var c = cipta_(nama, peranan);
      p[pengguna] = c.akaun;
      simpanJson_('PENTADBIR', p);
      logAudit_(u.pengguna, 'TAMBAH PENTADBIR', pengguna, peranan);
      return { pengguna: pengguna, kataSementara: c.kata };
    });
  });
}

function adminSetSemulaKata(token, pengguna) {
  return api_(token, PERANAN.UTAMA, function (u) {
    return denganKunci_(function () {
      var p = pentadbir_();
      if (!p[pengguna]) throw RalatPengguna_('Pengguna tidak dijumpai.');
      var c = cipta_(p[pengguna].nama, p[pengguna].peranan);
      c.akaun.aktif = true;
      p[pengguna] = c.akaun;
      simpanJson_('PENTADBIR', p);
      logAudit_(u.pengguna, 'SET SEMULA KATA LALUAN', pengguna, '');
      return { pengguna: pengguna, kataSementara: c.kata };
    });
  });
}

function adminTukarAktif(token, pengguna, aktif) {
  return api_(token, PERANAN.UTAMA, function (u) {
    if (pengguna === u.pengguna) throw RalatPengguna_('Anda tidak boleh menyahaktifkan akaun sendiri.');
    return denganKunci_(function () {
      var p = pentadbir_();
      if (!p[pengguna]) throw RalatPengguna_('Pengguna tidak dijumpai.');
      p[pengguna].aktif = aktif === true;
      simpanJson_('PENTADBIR', p);
      logAudit_(u.pengguna, aktif === true ? 'AKTIFKAN PENTADBIR' : 'NYAHAKTIF PENTADBIR', pengguna, '');
      return true;
    });
  });
}

var konteksTukarKata_ = null;
function tukarKataSendiri_(u) {
  var o = konteksTukarKata_;
  var p = pentadbir_();
  var akaun = p[u.pengguna];
  if (hashKata_(String(o.lama || ''), akaun.garam) !== akaun.hash) throw RalatPengguna_('Kata laluan semasa salah.');
  var baru = String(o.baru || '');
  if (baru.length < 10 || !/[A-Za-z]/.test(baru) || !/\d/.test(baru))
    throw RalatPengguna_('Kata laluan baharu mesti sekurang-kurangnya 10 aksara dan mengandungi huruf serta nombor.');
  if (baru === o.lama) throw RalatPengguna_('Kata laluan baharu mesti berbeza.');
  return denganKunci_(function () {
    var garam = rawakTeks_(16);
    akaun.garam = garam;
    akaun.hash = hashKata_(baru, garam);
    akaun.mestiTukar = false;
    simpanJson_('PENTADBIR', p);
    logAudit_(u.pengguna, 'TUKAR KATA LALUAN', u.pengguna, '');
    return true;
  });
}

function adminTukarKataLaluan(token, lama, baru) {
  konteksTukarKata_ = { lama: lama, baru: baru };
  try { return api_(token, PERANAN.PENYEMAK, tukarKataSendiri_); } finally { konteksTukarKata_ = null; }
}

/* ======================= Data ujian ======================= */

function adminJanaDataUjian(token, bil) {
  return api_(token, PERANAN.UTAMA, function (u) {
    var tetapan = tetapan_();
    if (!tetapan.benarkanUjian) throw RalatPengguna_('Mod ujian ditutup dalam Tetapan.');
    var n = Math.min(Math.max(Math.floor(Number(bil) || 20), 1), 200);
    return denganKunci_(function () {
      var semua = bacaEntri_();
      var turutan = 1;
      semua.forEach(function (e) { if (e.turutan >= turutan) turutan = e.turutan + 1; });
      var asas = Date.now() - n * 60000;
      var status = [STATUS.LULUS, STATUS.LULUS, STATUS.LULUS, STATUS.MENUNGGU, STATUS.DITOLAK];
      var baris = [];
      for (var i = 0; i < n; i++) {
        var e = {
          id: 'UJI-' + pad(turutan + i, 5) + '-' + rawakTeks_(4).toUpperCase(), capMasa: asas + i * 60000, turutan: turutan + i,
          nama: 'Peserta Ujian ' + pad(i + 1, 3), telefon: '60100000' + pad(i % 1000, 3), jumlah: 10 + (i % 5) * 10,
          tarikh: tarikhTempatan(asas), saluran: tetapan.saluran[0], rujukan: '', fail: '', jenis: '',
          hashResit: sha256Hex_('ujian|' + Utilities.getUuid()), status: status[i % status.length], bendera: '',
          kelayakan: '', catatan: 'Data palsu untuk ujian', oleh: 'SISTEM', pada: formatMasa(Date.now()), ujian: true
        };
        e.tandatangan = tandatangan_(e);
        baris.push(entriKeBaris_(e));
      }
      var sh = helaian_(HELAIAN.PENYERTAAN);
      sh.getRange(sh.getLastRow() + 1, 1, baris.length, LAJUR.length).setValues(baris);
      logAudit_(u.pengguna, 'JANA DATA UJIAN', '', n + ' rekod palsu');
      return n;
    });
  });
}

function adminPadamDataUjian(token) {
  return api_(token, PERANAN.UTAMA, function (u) {
    return denganKunci_(function () {
      var sh = helaian_(HELAIAN.PENYERTAAN);
      var ujian = bacaEntri_().filter(function (e) { return e.ujian; });
      for (var i = ujian.length - 1; i >= 0; i--) {
        if (ujian[i].fail) {
          try { DriveApp.getFileById(ujian[i].fail).setTrashed(true); } catch (e) { console.error(e); }
        }
        sh.deleteRow(ujian[i].baris);
      }
      logAudit_(u.pengguna, 'PADAM DATA UJIAN', '', ujian.length + ' rekod');
      return ujian.length;
    });
  });
}

/* ======================= Persediaan (dijalankan dari editor) ======================= */

function onOpen() {
  SpreadsheetApp.getUi().createMenu('INFAQ YAPEIM')
    .addItem('1. Sediakan sistem', 'sediakanSistem')
    .addItem('Set semula kata laluan "admin"', 'setSemulaKataAdmin')
    .addToUi();
}

function sediakanHelaian_(ss, nama, lajur) {
  var sh = ss.getSheetByName(nama) || ss.insertSheet(nama);
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, lajur.length).setValues([lajur]).setFontWeight('bold').setBackground('#0b5d3b').setFontColor('#ffffff');
    sh.setFrozenRows(1);
  }
  sh.getRange(1, 1, sh.getMaxRows(), lajur.length).setNumberFormat('@');
  if (!sh.getProtections(SpreadsheetApp.ProtectionType.SHEET).length) {
    var lindung = sh.protect().setDescription('Dikawal sistem Infaq — jangan ubah secara manual');
    lindung.removeEditors(lindung.getEditors());
    if (lindung.canDomainEdit()) lindung.setDomainEdit(false);
  }
  return sh;
}

function sediakanSistem() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var p = prop_();
  p.setProperty('SPREADSHEET_ID', ss.getId());
  ss.setSpreadsheetTimeZone('Asia/Kuching');
  if (!p.getProperty('RAHSIA')) p.setProperty('RAHSIA', Utilities.getUuid() + Utilities.getUuid());

  sediakanHelaian_(ss, HELAIAN.PENYERTAAN, LAJUR);
  sediakanHelaian_(ss, HELAIAN.CABUTAN, LAJUR_CABUTAN);
  sediakanHelaian_(ss, HELAIAN.SENARAI, LAJUR_SENARAI);
  sediakanHelaian_(ss, HELAIAN.AUDIT, LAJUR_AUDIT);
  var lalai = ss.getSheetByName('Sheet1') || ss.getSheetByName('Helaian1');
  if (lalai && ss.getSheets().length > 4 && lalai.getLastRow() === 0) ss.deleteSheet(lalai);

  var folderId = p.getProperty('FOLDER_ID');
  var folderOk = false;
  if (folderId) { try { DriveApp.getFolderById(folderId).getName(); folderOk = true; } catch (e) { folderOk = false; } }
  if (!folderOk) p.setProperty('FOLDER_ID', DriveApp.createFolder('RESIT INFAQ YAPEIM SARAWAK (SULIT - JANGAN KONGSI)').getId());

  if (!p.getProperty('TETAPAN')) simpanJson_('TETAPAN', gabungTetapan(null));

  var mesej = 'Sistem telah disediakan.';
  var pent = pentadbir_();
  if (!Object.keys(pent).length) {
    var c = cipta_('Pentadbir Utama', PERANAN.UTAMA);
    pent.admin = c.akaun;
    simpanJson_('PENTADBIR', pent);
    mesej += '\n\nAkaun pentadbir pertama:\nNama pengguna: admin\nKata laluan sementara: ' + c.kata +
      '\n\nSalin kata laluan ini sekarang. Anda akan diminta menukarnya semasa log masuk pertama.';
  }
  logAudit_('PEMILIK', 'SEDIAKAN SISTEM', '', '');
  console.log(mesej);
  try { SpreadsheetApp.getUi().alert(mesej); } catch (e) { /* dijalankan dari editor */ }
  return mesej;
}

function setSemulaKataAdmin() {
  var pent = pentadbir_();
  var c = cipta_('Pentadbir Utama', PERANAN.UTAMA);
  pent.admin = c.akaun;
  simpanJson_('PENTADBIR', pent);
  logAudit_('PEMILIK', 'SET SEMULA KATA LALUAN', 'admin', 'Dari editor');
  var mesej = 'Kata laluan sementara baharu untuk "admin": ' + c.kata;
  console.log(mesej);
  try { SpreadsheetApp.getUi().alert(mesej); } catch (e) { /* dijalankan dari editor */ }
  return mesej;
}
