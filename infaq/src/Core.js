/**
 * Core.js — logik tulen (tiada panggilan API Google).
 * Digunakan oleh Server.js dalam Google Apps Script dan diuji terus dalam Node.
 */

var ZON_MASA_MINIT = 8 * 60; // Malaysia (Asia/Kuching), UTC+8, tiada waktu jimat siang

var STATUS = {
  MENUNGGU: 'MENUNGGU PENGESAHAN',
  SEMAKAN: 'PERLU SEMAKAN MANUAL',
  LULUS: 'LULUS',
  DITOLAK: 'DITOLAK',
  PEMBETULAN: 'PERLU PEMBETULAN'
};

var STATUS_BELUM_SELESAI = [STATUS.MENUNGGU, STATUS.SEMAKAN];

var BENDERA = {
  RESIT_BERULANG: 'RESIT BERULANG',
  RUJUKAN_BERULANG: 'NO. RUJUKAN BERULANG',
  MAKLUMAT_SAMA: 'MAKLUMAT SAMA DENGAN PENYERTAAN LAIN',
  JUMLAH_TINGGI: 'JUMLAH LUAR BIASA TINGGI',
  TARIKH_LUAR_TEMPOH: 'TARIKH SUMBANGAN DI LUAR TEMPOH',
  BANYAK_PENYERTAAN: 'BANYAK PENYERTAAN DARI TELEFON SAMA'
};

var TETAPAN_ASAL = {
  namaKempen: 'Infaq dan Menang Goldbar YAPEIM Sarawak',
  tarikhMula: '',  // 'YYYY-MM-DDTHH:mm' waktu Malaysia
  tarikhTamat: '',
  minSumbangan: 1,
  saluran: ['Pindahan bank / FPX', 'DuitNow QR', 'Kaunter YAPEIM', 'Lain-lain'],
  bilTerpantas: 10,
  satuPeluangSetiapTelefon: true,
  tarikhSumbanganDalamTempoh: true,
  hadJumlahSemakan: 5000,
  hadPenyertaanSetiapTelefon: 20,
  hadiah: 'Goldbar',
  emelPertanyaan: '',
  telefonPertanyaan: '',
  tempohSimpanData: '12 bulan selepas kempen tamat',
  benarkanUjian: true
};

var JENIS_FAIL = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'application/pdf': 'pdf'
};
var SAIZ_FAIL_MAKS = 5 * 1024 * 1024;

function gabungTetapan(simpanan) {
  var t = JSON.parse(JSON.stringify(TETAPAN_ASAL));
  if (simpanan) {
    for (var k in simpanan) {
      if (Object.prototype.hasOwnProperty.call(TETAPAN_ASAL, k)) t[k] = simpanan[k];
    }
  }
  return t;
}

/* ---------- Masa ---------- */

function pad(n, w) {
  n = String(n);
  while (n.length < (w || 2)) n = '0' + n;
  return n;
}

function bahagianMasa(ms) {
  var d = new Date(ms + ZON_MASA_MINIT * 60000);
  return {
    y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate(),
    h: d.getUTCHours(), min: d.getUTCMinutes(), s: d.getUTCSeconds(), ms: d.getUTCMilliseconds()
  };
}

function tarikhTempatan(ms) {
  var b = bahagianMasa(ms);
  return b.y + '-' + pad(b.m) + '-' + pad(b.d);
}

function formatMasa(ms) {
  var b = bahagianMasa(ms);
  return pad(b.d) + '/' + pad(b.m) + '/' + b.y + ' ' + pad(b.h) + ':' + pad(b.min) + ':' + pad(b.s) + '.' + pad(b.ms, 3);
}

/** 'YYYY-MM-DDTHH:mm' (waktu Malaysia) -> ms, atau NaN */
function masaTempatanKeMs(teks) {
  var m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?$/.exec(String(teks || '').trim());
  if (!m) return NaN;
  var ms = Date.UTC(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0));
  var semak = new Date(ms);
  if (semak.getUTCMonth() !== +m[2] - 1 || semak.getUTCDate() !== +m[3]) return NaN;
  return ms - ZON_MASA_MINIT * 60000;
}

function tempohKempen(tetapan) {
  var mula = masaTempatanKeMs(tetapan.tarikhMula);
  var tamat = masaTempatanKeMs(tetapan.tarikhTamat);
  return { mula: mula, tamat: tamat, sah: !isNaN(mula) && !isNaN(tamat) && tamat > mula };
}

/** 'BELUM_DITETAPKAN' | 'BELUM_MULA' | 'DIBUKA' | 'TAMAT' */
function statusKempen(tetapan, sekarangMs) {
  var t = tempohKempen(tetapan);
  if (!t.sah) return 'BELUM_DITETAPKAN';
  if (sekarangMs < t.mula) return 'BELUM_MULA';
  if (sekarangMs > t.tamat) return 'TAMAT';
  return 'DIBUKA';
}

/* ---------- Pengesahan input ---------- */

function normalisasiTelefon(mentah) {
  var s = String(mentah == null ? '' : mentah).replace(/[\s\-().]/g, '');
  if (s.indexOf('+') === 0) s = s.slice(1);
  if (!/^\d+$/.test(s)) return { ok: false };
  if (s.indexOf('60') === 0) s = '0' + s.slice(2);
  // Telefon bimbit 01X (10-11 digit) atau talian tetap 03-09 (9-10 digit)
  if (!/^0(1\d{8,9}|[3-9]\d{7,8})$/.test(s)) return { ok: false };
  return { ok: true, nilai: '6' + s, papar: s.slice(0, 3) + '-' + s.slice(3) };
}

function paparTelefon(nilai) {
  var s = String(nilai || '');
  if (s.indexOf('60') === 0) s = '0' + s.slice(2);
  return s.slice(0, 3) + '-' + s.slice(3);
}

function bersihTeks(s, maks) {
  return String(s == null ? '' : s)
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maks || 200);
}

/** Menghalang suntikan formula hamparan (=, +, -, @, tab) */
function selamatSel(v) {
  if (typeof v !== 'string') return v;
  return /^[=+\-@\t\r]/.test(v) ? "'" + v : v;
}

function jenisFailDariBait(bait) {
  if (!bait || bait.length < 4) return null;
  var b = function (i) { return bait[i] & 0xff; };
  if (b(0) === 0xff && b(1) === 0xd8 && b(2) === 0xff) return 'image/jpeg';
  if (b(0) === 0x89 && b(1) === 0x50 && b(2) === 0x4e && b(3) === 0x47) return 'image/png';
  if (b(0) === 0x25 && b(1) === 0x50 && b(2) === 0x44 && b(3) === 0x46) return 'application/pdf';
  return null;
}

/**
 * Mengesahkan medan borang. Fail diperiksa berasingan (lihat Server.js).
 * @return {{ok:boolean, ralat:Object, data:Object}}
 */
function sahkanBorang(input, tetapan, sekarangMs) {
  var ralat = {};
  var data = {};
  input = input || {};

  data.nama = bersihTeks(input.nama, 100);
  if (data.nama.length < 3) ralat.nama = 'Sila masukkan nama penuh.';
  else if (!/^[A-Za-zÀ-ɏ][A-Za-zÀ-ɏ '.@\/\-]*$/.test(data.nama))
    ralat.nama = 'Nama hanya boleh mengandungi huruf, ruang dan tanda \' . @ / -';

  var tel = normalisasiTelefon(input.telefon);
  if (!tel.ok) ralat.telefon = 'Nombor telefon tidak sah. Contoh: 012-3456789';
  else data.telefon = tel.nilai;

  var jumlahTeks = String(input.jumlah == null ? '' : input.jumlah).replace(/[,\s]/g, '').replace(/^RM/i, '');
  if (!/^\d{1,7}(\.\d{1,2})?$/.test(jumlahTeks)) ralat.jumlah = 'Masukkan jumlah dalam RM, contoh: 50 atau 50.00';
  else {
    data.jumlah = Math.round(parseFloat(jumlahTeks) * 100) / 100;
    if (data.jumlah < Number(tetapan.minSumbangan || 0) || data.jumlah <= 0)
      ralat.jumlah = 'Jumlah minimum ialah RM ' + Number(tetapan.minSumbangan || 0).toFixed(2);
    else if (data.jumlah > 1000000) ralat.jumlah = 'Jumlah terlalu besar. Sila semak semula.';
  }

  var tarikh = String(input.tarikh || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tarikh) || isNaN(masaTempatanKeMs(tarikh)))
    ralat.tarikh = 'Sila pilih tarikh sumbangan.';
  else if (tarikh > tarikhTempatan(sekarangMs)) ralat.tarikh = 'Tarikh sumbangan tidak boleh pada masa hadapan.';
  else data.tarikh = tarikh;

  var saluran = bersihTeks(input.saluran, 80);
  if ((tetapan.saluran || []).indexOf(saluran) === -1) ralat.saluran = 'Sila pilih kaedah sumbangan.';
  else data.saluran = saluran;

  data.rujukan = bersihTeks(input.rujukan, 40).toUpperCase();
  if (data.rujukan && !/^[A-Z0-9][A-Z0-9 \/\-]*$/.test(data.rujukan))
    ralat.rujukan = 'No. rujukan hanya boleh mengandungi huruf dan nombor.';

  if (input.pengesahan !== true) ralat.pengesahan = 'Sila sahkan bahawa maklumat adalah benar.';
  if (input.persetujuan !== true) ralat.persetujuan = 'Sila bersetuju dengan notis privasi dan syarat kempen.';

  return { ok: Object.keys(ralat).length === 0, ralat: ralat, data: data };
}

/* ---------- Pengesanan pendua / mencurigakan ---------- */

/**
 * @param baru {{telefon, jumlah, tarikh, saluran, rujukan, hashResit}}
 * @param sedia array penyertaan sedia ada (bukan ujian)
 */
function semakBendera(baru, sedia, tetapan, sekarangMs) {
  var b = [];
  var samaTelefon = 0;
  for (var i = 0; i < sedia.length; i++) {
    var e = sedia[i];
    if (e.hashResit && e.hashResit === baru.hashResit && b.indexOf(BENDERA.RESIT_BERULANG) === -1) b.push(BENDERA.RESIT_BERULANG);
    if (baru.rujukan && e.rujukan === baru.rujukan && b.indexOf(BENDERA.RUJUKAN_BERULANG) === -1) b.push(BENDERA.RUJUKAN_BERULANG);
    if (e.telefon === baru.telefon) {
      samaTelefon++;
      if (Number(e.jumlah) === Number(baru.jumlah) && e.tarikh === baru.tarikh && e.saluran === baru.saluran &&
          b.indexOf(BENDERA.MAKLUMAT_SAMA) === -1) b.push(BENDERA.MAKLUMAT_SAMA);
    }
  }
  if (samaTelefon >= 3) b.push(BENDERA.BANYAK_PENYERTAAN);
  if (Number(tetapan.hadJumlahSemakan) > 0 && baru.jumlah >= Number(tetapan.hadJumlahSemakan)) b.push(BENDERA.JUMLAH_TINGGI);
  if (tetapan.tarikhSumbanganDalamTempoh) {
    var t = tempohKempen(tetapan);
    if (t.sah && (baru.tarikh < tarikhTempatan(t.mula) || baru.tarikh > tarikhTempatan(t.tamat))) b.push(BENDERA.TARIKH_LUAR_TEMPOH);
  }
  return b;
}

/* ---------- Kelayakan, terpantas, cabutan ---------- */

function kiraKelayakan(e, tetapan) {
  if (e.status === STATUS.DITOLAK) return { layak: false, sebab: 'Ditolak' };
  if (e.status !== STATUS.LULUS) return { layak: false, sebab: 'Belum disahkan' };
  var t = tempohKempen(tetapan);
  // Data ujian tidak bergantung pada tarikh kempen (boleh diuji sebelum tarikh ditetapkan)
  if (!t.sah && !e.ujian) return { layak: false, sebab: 'Tempoh kempen belum ditetapkan' };
  if (!e.ujian && (e.capMasa < t.mula || e.capMasa > t.tamat)) return { layak: false, sebab: 'Dihantar di luar tempoh kempen' };
  if (Number(e.jumlah) < Number(tetapan.minSumbangan || 0)) return { layak: false, sebab: 'Bawah jumlah minimum' };
  if (tetapan.tarikhSumbanganDalamTempoh && !e.ujian &&
      (e.tarikh < tarikhTempatan(t.mula) || e.tarikh > tarikhTempatan(t.tamat)))
    return { layak: false, sebab: 'Tarikh sumbangan di luar tempoh' };
  return { layak: true, sebab: 'Layak' };
}

/** Pemutus seri: cap masa pelayan (milisaat), kemudian nombor turutan penerimaan (dikunci, unik). */
function bandingMasa(a, b) {
  return (a.capMasa - b.capMasa) || (a.turutan - b.turutan);
}

/** Penyertaan layak, disusun ikut masa. Jika satuPeluangSetiapTelefon, hanya penyertaan layak terawal bagi setiap telefon. */
function senaraiLayak(entri, tetapan, ujian) {
  var layak = entri.filter(function (e) {
    return !!e.ujian === !!ujian && kiraKelayakan(e, tetapan).layak;
  }).sort(bandingMasa);
  if (!tetapan.satuPeluangSetiapTelefon) return layak;
  var dilihat = {};
  return layak.filter(function (e) {
    if (dilihat[e.telefon]) return false;
    dilihat[e.telefon] = true;
    return true;
  });
}

function senaraiTerpantas(entri, tetapan, ujian) {
  return senaraiLayak(entri, tetapan, ujian).slice(0, Math.max(0, Number(tetapan.bilTerpantas) || 0));
}

/**
 * Pemilihan rawak yang boleh diaudit & disahkan semula.
 * Senarai ID disusun, kemudian indeks dipilih menggunakan SHA-256(benih:pembilang),
 * dengan "rejection sampling" supaya tiada kecenderungan modulo.
 * @param sha256Hex fungsi(string) -> hex
 */
function pilihRawak(ids, bilangan, benih, sha256Hex) {
  var kolam = ids.slice().sort();
  var pilihan = [];
  var pembilang = 0;
  var HAD = 4503599627370496; // 2^52
  while (pilihan.length < bilangan && kolam.length > 0) {
    var n = kolam.length;
    var had = Math.floor(HAD / n) * n;
    var x;
    do {
      x = parseInt(sha256Hex(benih + ':' + pembilang).slice(0, 13), 16);
      pembilang++;
    } while (x >= had);
    pilihan.push(kolam.splice(x % n, 1)[0]);
  }
  return pilihan;
}

function hashSenarai(ids, sha256Hex) {
  return sha256Hex(ids.slice().sort().join('\n'));
}

/* ---------- Paparan & eksport ---------- */

function topengNama(nama) {
  return String(nama || '').trim().split(/\s+/).map(function (w) {
    if (w.length <= 2) return w.charAt(0) + '*';
    return w.slice(0, 2) + new Array(Math.min(w.length - 2, 6) + 1).join('*');
  }).join(' ');
}

function keCsv(baris) {
  return '﻿' + baris.map(function (r) {
    return r.map(function (v) {
      var s = selamatSel(v == null ? '' : String(v));
      return /[",\r\n]/.test(s) || s !== String(v == null ? '' : v) ? '"' + s.replace(/"/g, '""') + '"' : s;
    }).join(',');
  }).join('\r\n');
}

function tapisEntri(entri, tapis) {
  tapis = tapis || {};
  var q = String(tapis.carian || '').trim().toLowerCase();
  var qDigit = q.replace(/\D/g, '');
  if (qDigit.indexOf('0') === 0) qDigit = '6' + qDigit;
  return entri.filter(function (e) {
    if (tapis.status && e.status !== tapis.status) return false;
    if (tapis.ujian !== undefined && !!e.ujian !== !!tapis.ujian) return false;
    if (tapis.dari && tarikhTempatan(e.capMasa) < tapis.dari) return false;
    if (tapis.hingga && tarikhTempatan(e.capMasa) > tapis.hingga) return false;
    if (!q) return true;
    return e.id.toLowerCase().indexOf(q) !== -1 ||
      e.nama.toLowerCase().indexOf(q) !== -1 ||
      (qDigit.length >= 4 && e.telefon.indexOf(qDigit) !== -1) ||
      (e.rujukan && e.rujukan.toLowerCase().indexOf(q) !== -1) ||
      e.tarikh.indexOf(q) !== -1;
  });
}

if (typeof module !== 'undefined') {
  module.exports = {
    STATUS: STATUS, BENDERA: BENDERA, TETAPAN_ASAL: TETAPAN_ASAL, SAIZ_FAIL_MAKS: SAIZ_FAIL_MAKS,
    gabungTetapan: gabungTetapan, tarikhTempatan: tarikhTempatan, formatMasa: formatMasa,
    masaTempatanKeMs: masaTempatanKeMs, statusKempen: statusKempen, normalisasiTelefon: normalisasiTelefon,
    paparTelefon: paparTelefon, selamatSel: selamatSel, jenisFailDariBait: jenisFailDariBait,
    sahkanBorang: sahkanBorang, semakBendera: semakBendera, kiraKelayakan: kiraKelayakan,
    senaraiLayak: senaraiLayak, senaraiTerpantas: senaraiTerpantas, pilihRawak: pilihRawak,
    hashSenarai: hashSenarai, topengNama: topengNama, keCsv: keCsv, tapisEntri: tapisEntri
  };
}
