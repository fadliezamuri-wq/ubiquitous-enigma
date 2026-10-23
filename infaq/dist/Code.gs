/**
 * SISTEM INFAQ DAN MENANG GOLDBAR YAPEIM SARAWAK
 * Versi 1.0.2 — fail ini DIJANA oleh scripts/build.js. Jangan sunting terus;
 * sunting fail dalam folder src/ dan jalankan "npm run build".
 * Salin KESELURUHAN fail ini ke Code.gs dalam editor Apps Script.
 */

var VERSI_ = '1.0.2';

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


/* ======================= Halaman HTML (dijana) ======================= */
var HTML_ = {};
var GAYA_ = [
  ":root {",
  "  --hijau: #0b5d3b; --hijau-gelap: #073d27; --hijau-muda: #e7f3ec;",
  "  --emas: #c9a227; --emas-muda: #fbf3d9;",
  "  --teks: #1d2a24; --teks-lembut: #55645c; --garis: #d6ded9; --latar: #f4f6f3; --kad: #ffffff;",
  "  --merah: #b42318; --merah-muda: #fdecea; --oren: #b54708; --oren-muda: #fef0c7; --biru: #175cd3; --biru-muda: #e8f0fe;",
  "  --jejari: 12px;",
  "}",
  "* { box-sizing: border-box; }",
  "html, body { margin: 0; padding: 0; }",
  "body { font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif;",
  "  font-size: 17px; line-height: 1.5; color: var(--teks); background: var(--latar); -webkit-text-size-adjust: 100%; }",
  "a { color: var(--hijau); }",
  "h1, h2, h3 { line-height: 1.25; margin: 0 0 .5em; }",
  ".bekas { max-width: 640px; margin: 0 auto; padding: 16px; }",
  ".kad { background: var(--kad); border-radius: var(--jejari); box-shadow: 0 1px 3px rgba(0,0,0,.08); padding: 20px; margin-bottom: 16px; }",
  ".kepala { background: linear-gradient(135deg, var(--hijau-gelap), var(--hijau)); color: #fff; padding: 20px 16px 28px; text-align: center; }",
  ".kepala h1 { font-size: 1.45rem; margin: 10px 0 4px; letter-spacing: .3px; }",
  ".kepala p { margin: 0; opacity: .92; font-size: .95rem; }",
  ".kepala .emas { color: var(--emas); }",
  ".logo-ruang { display: inline-flex; align-items: center; justify-content: center; min-width: 120px; height: 56px; padding: 0 12px;",
  "  border: 2px dashed rgba(255,255,255,.6); border-radius: 8px; font-size: .75rem; font-weight: 600; letter-spacing: .5px; }",
  ".logo-ruang img { max-height: 56px; max-width: 200px; }",
  ".logo-sebenar { border: none; }",
  "label.tajuk { display: block; font-weight: 600; margin: 16px 0 6px; }",
  "label.tajuk .wajib { color: var(--merah); }",
  ".bantuan { font-size: .85rem; color: var(--teks-lembut); margin-top: 4px; }",
  "input[type=text], input[type=tel], input[type=number], input[type=date], input[type=password], input[type=datetime-local], select, textarea {",
  "  width: 100%; font-size: 17px; padding: 12px 14px; border: 1.5px solid var(--garis); border-radius: 10px; background: #fff; color: var(--teks);",
  "  font-family: inherit; appearance: none; -webkit-appearance: none; min-height: 48px; }",
  "select { background-image: linear-gradient(45deg, transparent 50%, var(--teks-lembut) 50%), linear-gradient(135deg, var(--teks-lembut) 50%, transparent 50%);",
  "  background-position: calc(100% - 20px) 50%, calc(100% - 14px) 50%; background-size: 6px 6px; background-repeat: no-repeat; padding-right: 36px; }",
  "input:focus, select:focus, textarea:focus { outline: 3px solid rgba(11,93,59,.25); border-color: var(--hijau); }",
  ".salah input, .salah select, .salah .pilih-fail { border-color: var(--merah); }",
  ".mesej-salah { color: var(--merah); font-size: .88rem; margin-top: 4px; display: none; }",
  ".salah .mesej-salah { display: block; }",
  ".awalan { position: relative; }",
  ".awalan span { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--teks-lembut); font-weight: 600; }",
  ".awalan input { padding-left: 48px; }",
  ".pilih-fail { display: block; border: 2px dashed var(--garis); border-radius: 10px; padding: 18px; text-align: center; cursor: pointer; background: #fafcfb; }",
  ".pilih-fail input { position: absolute; width: 1px; height: 1px; opacity: 0; }",
  ".pilih-fail strong { color: var(--hijau); }",
  ".pratonton { margin-top: 10px; font-size: .9rem; display: none; align-items: center; gap: 10px; }",
  ".pratonton img { max-width: 80px; max-height: 80px; border-radius: 6px; border: 1px solid var(--garis); }",
  ".semak { display: flex; gap: 12px; align-items: flex-start; margin: 14px 0 0; font-size: .95rem; cursor: pointer; }",
  ".semak input { width: 24px; height: 24px; flex: 0 0 24px; margin-top: 1px; accent-color: var(--hijau); }",
  ".butang { display: inline-flex; align-items: center; justify-content: center; gap: 8px; border: none; border-radius: 10px; padding: 12px 18px;",
  "  font-size: 16px; font-weight: 600; cursor: pointer; min-height: 48px; text-decoration: none; font-family: inherit; }",
  ".butang-utama { background: var(--hijau); color: #fff; width: 100%; font-size: 18px; min-height: 56px; margin-top: 22px; }",
  ".butang-utama:disabled { opacity: .6; cursor: wait; }",
  ".butang-hijau { background: var(--hijau); color: #fff; } .butang-merah { background: var(--merah); color: #fff; }",
  ".butang-oren { background: var(--oren); color: #fff; } .butang-garis { background: #fff; color: var(--hijau); border: 1.5px solid var(--hijau); }",
  ".butang-emas { background: var(--emas); color: #1d1600; }",
  ".butang-kecil { min-height: 36px; padding: 6px 12px; font-size: 14px; }",
  ".kotak-info { background: var(--emas-muda); border-left: 4px solid var(--emas); padding: 12px 14px; border-radius: 8px; font-size: .92rem; }",
  ".kotak-amaran { background: var(--merah-muda); border-left: 4px solid var(--merah); padding: 12px 14px; border-radius: 8px; }",
  ".kotak-ujian { background: var(--biru-muda); border: 2px solid var(--biru); color: var(--biru); padding: 10px 14px; border-radius: 8px; font-weight: 600; text-align: center; }",
  ".berjaya { text-align: center; }",
  ".berjaya .ikon { width: 72px; height: 72px; border-radius: 50%; background: var(--hijau-muda); color: var(--hijau); font-size: 40px; line-height: 72px; margin: 0 auto 12px; }",
  ".id-besar { font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 1.5rem; font-weight: 700; background: var(--emas-muda);",
  "  border: 2px solid var(--emas); padding: 10px 14px; border-radius: 10px; display: inline-block; margin: 8px 0; letter-spacing: 1px; word-break: break-all; }",
  ".kaki { text-align: center; font-size: .82rem; color: var(--teks-lembut); padding: 8px 16px 32px; }",
  ".lencana { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: .78rem; font-weight: 700; white-space: nowrap; }",
  ".l-menunggu { background: var(--oren-muda); color: var(--oren); } .l-semakan { background: #fde2e1; color: #912018; }",
  ".l-lulus { background: var(--hijau-muda); color: var(--hijau); } .l-ditolak { background: #eaecf0; color: #344054; }",
  ".l-pembetulan { background: var(--biru-muda); color: var(--biru); } .l-ujian { background: var(--biru); color: #fff; }",
  ".tersembunyi { display: none !important; }",
  ".pemutar { width: 20px; height: 20px; border: 3px solid rgba(255,255,255,.4); border-top-color: #fff; border-radius: 50%; animation: putar 0.8s linear infinite; }",
  "@keyframes putar { to { transform: rotate(360deg); } }",
  ".kemajuan { height: 6px; background: var(--garis); border-radius: 3px; overflow: hidden; margin-top: 12px; }",
  ".kemajuan div { height: 100%; width: 30%; background: var(--hijau); animation: gerak 1.2s ease-in-out infinite; }",
  "@keyframes gerak { 0% { margin-left: -30%; } 100% { margin-left: 100%; } }",
  "@media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }",
  ""
].join('\n');
var LOGO_ = "<div class=\"logo-ruang\">LOGO RASMI YAPEIM</div>";
HTML_.Borang = [
  "<!DOCTYPE html>",
  "<html lang=\"ms\">",
  "<head>",
  "<base target=\"_top\">",
  "<meta charset=\"utf-8\">",
  "<style>/*__GAYA__*/</style>",
  "</head>",
  "<body>",
  "<header class=\"kepala\">",
  "  <!--__LOGO__-->",
  "  <h1>INFAQ DAN MENANG <span class=\"emas\">GOLDBAR</span></h1>",
  "  <p>YAPEIM Sarawak</p>",
  "</header>",
  "",
  "<main class=\"bekas\" style=\"margin-top:-16px\">",
  "  <div id=\"kotakUjian\" class=\"kotak-ujian tersembunyi\" style=\"margin-bottom:12px\">MOD UJIAN — penyertaan ini tidak dikira untuk kempen sebenar</div>",
  "",
  "  <section id=\"tutup\" class=\"kad tersembunyi\">",
  "    <h2 id=\"tutupTajuk\">Kempen belum dibuka</h2>",
  "    <p id=\"tutupTeks\"></p>",
  "  </section>",
  "",
  "  <form id=\"borang\" class=\"kad tersembunyi\" novalidate autocomplete=\"on\">",
  "    <div class=\"kotak-info\" id=\"info\">Isi borang ini selepas anda membuat sumbangan. Sediakan gambar atau PDF resit sumbangan anda.</div>",
  "",
  "    <div class=\"medan\" data-medan=\"nama\">",
  "      <label class=\"tajuk\" for=\"nama\">Nama penuh <span class=\"wajib\">*</span></label>",
  "      <input type=\"text\" id=\"nama\" name=\"nama\" autocomplete=\"name\" maxlength=\"100\" required>",
  "      <div class=\"mesej-salah\"></div>",
  "    </div>",
  "",
  "    <div class=\"medan\" data-medan=\"telefon\">",
  "      <label class=\"tajuk\" for=\"telefon\">Nombor telefon <span class=\"wajib\">*</span></label>",
  "      <input type=\"tel\" id=\"telefon\" name=\"telefon\" autocomplete=\"tel\" inputmode=\"tel\" placeholder=\"cth: 012-3456789\" maxlength=\"16\" required>",
  "      <div class=\"bantuan\">Kami akan menghubungi nombor ini jika anda menang.</div>",
  "      <div class=\"mesej-salah\"></div>",
  "    </div>",
  "",
  "    <div class=\"medan\" data-medan=\"jumlah\">",
  "      <label class=\"tajuk\" for=\"jumlah\">Jumlah sumbangan <span class=\"wajib\">*</span></label>",
  "      <div class=\"awalan\"><span>RM</span><input type=\"text\" id=\"jumlah\" name=\"jumlah\" inputmode=\"decimal\" placeholder=\"0.00\" maxlength=\"12\" required></div>",
  "      <div class=\"mesej-salah\"></div>",
  "    </div>",
  "",
  "    <div class=\"medan\" data-medan=\"tarikh\">",
  "      <label class=\"tajuk\" for=\"tarikh\">Tarikh sumbangan <span class=\"wajib\">*</span></label>",
  "      <input type=\"date\" id=\"tarikh\" name=\"tarikh\" required>",
  "      <div class=\"mesej-salah\"></div>",
  "    </div>",
  "",
  "    <div class=\"medan\" data-medan=\"saluran\">",
  "      <label class=\"tajuk\" for=\"saluran\">Kaedah sumbangan <span class=\"wajib\">*</span></label>",
  "      <select id=\"saluran\" name=\"saluran\" required><option value=\"\">— Pilih —</option></select>",
  "      <div class=\"mesej-salah\"></div>",
  "    </div>",
  "",
  "    <div class=\"medan\" data-medan=\"rujukan\">",
  "      <label class=\"tajuk\" for=\"rujukan\">No. rujukan transaksi <span style=\"font-weight:400;color:var(--teks-lembut)\">(jika ada)</span></label>",
  "      <input type=\"text\" id=\"rujukan\" name=\"rujukan\" maxlength=\"40\" autocapitalize=\"characters\">",
  "      <div class=\"mesej-salah\"></div>",
  "    </div>",
  "",
  "    <div class=\"medan\" data-medan=\"fail\">",
  "      <label class=\"tajuk\">Resit sumbangan <span class=\"wajib\">*</span></label>",
  "      <label class=\"pilih-fail\" for=\"fail\">",
  "        <input type=\"file\" id=\"fail\" accept=\"image/jpeg,image/png,application/pdf\">",
  "        <span id=\"failTeks\"><strong>Tekan untuk pilih gambar atau PDF</strong><br><span class=\"bantuan\">JPG, PNG atau PDF · maksimum 5 MB</span></span>",
  "      </label>",
  "      <div class=\"pratonton\" id=\"pratonton\"></div>",
  "      <div class=\"mesej-salah\"></div>",
  "    </div>",
  "",
  "    <div style=\"position:absolute;left:-9999px\" aria-hidden=\"true\">",
  "      <label>Laman web <input type=\"text\" id=\"laman\" tabindex=\"-1\" autocomplete=\"off\"></label>",
  "    </div>",
  "",
  "    <div class=\"medan\" data-medan=\"pengesahan\">",
  "      <label class=\"semak\"><input type=\"checkbox\" id=\"pengesahan\"> <span>Saya mengesahkan bahawa maklumat dan resit yang diberikan adalah benar.</span></label>",
  "      <div class=\"mesej-salah\"></div>",
  "    </div>",
  "    <div class=\"medan\" data-medan=\"persetujuan\">",
  "      <label class=\"semak\"><input type=\"checkbox\" id=\"persetujuan\"> <span>Saya telah membaca dan bersetuju dengan <a id=\"pautanPrivasi\" href=\"#\" target=\"_blank\" rel=\"noopener\">Notis Privasi &amp; Syarat Kempen</a>.</span></label>",
  "      <div class=\"mesej-salah\"></div>",
  "    </div>",
  "",
  "    <div id=\"ralatUmum\" class=\"kotak-amaran tersembunyi\" style=\"margin-top:16px\" role=\"alert\"></div>",
  "    <button type=\"submit\" class=\"butang butang-utama\" id=\"hantar\">Hantar Penyertaan</button>",
  "    <div id=\"sedangHantar\" class=\"tersembunyi\" style=\"text-align:center;margin-top:10px\">",
  "      <div class=\"bantuan\">Sedang memuat naik resit… Jangan tutup halaman ini.</div>",
  "      <div class=\"kemajuan\"><div></div></div>",
  "    </div>",
  "  </form>",
  "",
  "  <section id=\"berjaya\" class=\"kad berjaya tersembunyi\" aria-live=\"polite\">",
  "    <div class=\"ikon\">✓</div>",
  "    <h2>Terima kasih!</h2>",
  "    <p>Penyertaan anda telah diterima.</p>",
  "    <div>ID Penyertaan anda:</div>",
  "    <div class=\"id-besar\" id=\"idPenyertaan\"></div>",
  "    <p class=\"bantuan\" id=\"masaDiterima\"></p>",
  "    <div class=\"kotak-info\" style=\"text-align:left\">",
  "      <strong>Status: MENUNGGU PENGESAHAN</strong><br>",
  "      Resit anda akan disemak oleh pegawai YAPEIM. Sila <strong>tangkap layar (screenshot)</strong> halaman ini dan simpan ID penyertaan anda sebagai rujukan.",
  "    </div>",
  "    <p id=\"mesejPendua\" class=\"bantuan tersembunyi\">Penyertaan dengan resit yang sama telah diterima sebelum ini — ini ialah ID asal anda.</p>",
  "    <button class=\"butang butang-garis\" style=\"margin-top:16px\" onclick=\"location.reload()\">Hantar penyertaan lain</button>",
  "  </section>",
  "</main>",
  "<footer class=\"kaki\">",
  "  <span id=\"kakiKempen\"></span><br>",
  "  <a id=\"pautanPrivasi2\" href=\"#\" target=\"_blank\" rel=\"noopener\">Notis Privasi &amp; Syarat Kempen</a>",
  "</footer>",
  "",
  "<script>",
  "var DATA = /*__DATA__*/null;",
  "var failDipilih = null;",
  "",
  "function $(id) { return document.getElementById(id); }",
  "function teksMasa(s) {",
  "  if (!s) return '';",
  "  var b = ['Jan','Feb','Mac','Apr','Mei','Jun','Jul','Ogo','Sep','Okt','Nov','Dis'];",
  "  var m = /^(\\d{4})-(\\d{2})-(\\d{2})(?:T(\\d{2}):(\\d{2}))?/.exec(s);",
  "  return m ? (+m[3]) + ' ' + b[+m[2] - 1] + ' ' + m[1] + (m[4] ? ', ' + m[4] + ':' + m[5] : '') : s;",
  "}",
  "",
  "(function mula() {",
  "  var t = DATA.tetapan;",
  "  var urlPrivasi = DATA.url + '?p=privasi';",
  "  $('pautanPrivasi').href = urlPrivasi; $('pautanPrivasi2').href = urlPrivasi;",
  "  $('kakiKempen').textContent = t.tarikhMula && t.tarikhTamat ? 'Tempoh kempen: ' + teksMasa(t.tarikhMula) + ' hingga ' + teksMasa(t.tarikhTamat) : '';",
  "  t.saluran.forEach(function (s) { var o = document.createElement('option'); o.value = s; o.textContent = s; $('saluran').appendChild(o); });",
  "  $('tarikh').max = DATA.hariIni;",
  "  if (Number(t.minSumbangan) > 0) $('info').innerHTML += '<br>Sumbangan minimum: <strong>RM ' + Number(t.minSumbangan).toFixed(2) + '</strong>.';",
  "",
  "  if (DATA.ujian) { $('kotakUjian').classList.remove('tersembunyi'); $('borang').classList.remove('tersembunyi'); return; }",
  "  if (DATA.statusKempen === 'DIBUKA') { $('borang').classList.remove('tersembunyi'); return; }",
  "  $('tutup').classList.remove('tersembunyi');",
  "  if (DATA.statusKempen === 'TAMAT') {",
  "    $('tutupTajuk').textContent = 'Kempen telah tamat';",
  "    $('tutupTeks').textContent = 'Terima kasih atas sokongan anda. Penyertaan tidak lagi diterima. Keputusan akan diumumkan oleh YAPEIM Sarawak.';",
  "  } else {",
  "    $('tutupTeks').textContent = t.tarikhMula ? 'Kempen akan dibuka pada ' + teksMasa(t.tarikhMula) + '.' : 'Tarikh kempen akan diumumkan.';",
  "  }",
  "})();",
  "",
  "function tandaSalah(medan, mesej) {",
  "  var el = document.querySelector('[data-medan=\"' + medan + '\"]');",
  "  if (!el) return;",
  "  el.classList.toggle('salah', !!mesej);",
  "  el.querySelector('.mesej-salah').textContent = mesej || '';",
  "}",
  "",
  "function semakTempatan() {",
  "  var r = {};",
  "  var nama = $('nama').value.trim();",
  "  if (nama.length < 3) r.nama = 'Sila masukkan nama penuh.';",
  "  var tel = $('telefon').value.replace(/[\\s\\-().]/g, '').replace(/^\\+?60/, '0');",
  "  if (!/^0(1\\d{8,9}|[3-9]\\d{7,8})$/.test(tel)) r.telefon = 'Nombor telefon tidak sah. Contoh: 012-3456789';",
  "  var j = $('jumlah').value.replace(/[,\\s]/g, '');",
  "  if (!/^\\d{1,7}(\\.\\d{1,2})?$/.test(j) || +j <= 0) r.jumlah = 'Masukkan jumlah dalam RM, contoh: 50 atau 50.00';",
  "  else if (+j < Number(DATA.tetapan.minSumbangan || 0)) r.jumlah = 'Jumlah minimum ialah RM ' + Number(DATA.tetapan.minSumbangan).toFixed(2);",
  "  if (!$('tarikh').value) r.tarikh = 'Sila pilih tarikh sumbangan.';",
  "  else if ($('tarikh').value > DATA.hariIni) r.tarikh = 'Tarikh sumbangan tidak boleh pada masa hadapan.';",
  "  if (!$('saluran').value) r.saluran = 'Sila pilih kaedah sumbangan.';",
  "  if (!failDipilih) r.fail = 'Sila muat naik resit sumbangan.';",
  "  if (!$('pengesahan').checked) r.pengesahan = 'Sila sahkan bahawa maklumat adalah benar.';",
  "  if (!$('persetujuan').checked) r.persetujuan = 'Sila bersetuju dengan notis privasi dan syarat kempen.';",
  "  return r;",
  "}",
  "",
  "function paparRalat(r) {",
  "  ['nama','telefon','jumlah','tarikh','saluran','rujukan','fail','pengesahan','persetujuan'].forEach(function (m) { tandaSalah(m, r[m]); });",
  "  var pertama = document.querySelector('.salah');",
  "  if (pertama) pertama.scrollIntoView({ behavior: 'smooth', block: 'center' });",
  "}",
  "",
  "function bacaDataUrl(blob) {",
  "  return new Promise(function (ok, gagal) {",
  "    var fr = new FileReader();",
  "    fr.onload = function () { ok(fr.result); };",
  "    fr.onerror = gagal;",
  "    fr.readAsDataURL(blob);",
  "  });",
  "}",
  "",
  "/** Kecilkan gambar besar supaya muat naik pantas di talian mudah alih. */",
  "function kecilkanGambar(fail) {",
  "  return new Promise(function (ok) {",
  "    if (fail.type === 'application/pdf' || fail.size < 1.2 * 1024 * 1024) return ok(fail);",
  "    var img = new Image();",
  "    var url = URL.createObjectURL(fail);",
  "    img.onload = function () {",
  "      var maks = 2000, w = img.naturalWidth, h = img.naturalHeight;",
  "      var s = Math.min(1, maks / Math.max(w, h));",
  "      var c = document.createElement('canvas');",
  "      c.width = Math.round(w * s); c.height = Math.round(h * s);",
  "      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);",
  "      URL.revokeObjectURL(url);",
  "      c.toBlob(function (b) { ok(b && b.size < fail.size ? b : fail); }, 'image/jpeg', 0.85);",
  "    };",
  "    img.onerror = function () { URL.revokeObjectURL(url); ok(fail); };",
  "    img.src = url;",
  "  });",
  "}",
  "",
  "$('fail').addEventListener('change', function () {",
  "  var f = this.files[0];",
  "  failDipilih = null;",
  "  var p = $('pratonton');",
  "  p.style.display = 'none'; p.innerHTML = '';",
  "  if (!f) return;",
  "  if (['image/jpeg', 'image/png', 'application/pdf'].indexOf(f.type) === -1) { tandaSalah('fail', 'Hanya fail JPG, PNG atau PDF diterima.'); return; }",
  "  if (f.type === 'application/pdf' && f.size > 5 * 1024 * 1024) { tandaSalah('fail', 'Saiz fail melebihi 5 MB.'); return; }",
  "  kecilkanGambar(f).then(function (b) {",
  "    if (b.size > 5 * 1024 * 1024) { tandaSalah('fail', 'Saiz fail melebihi 5 MB.'); return; }",
  "    failDipilih = b;",
  "    tandaSalah('fail', '');",
  "    var nama = document.createElement('span');",
  "    nama.textContent = '✓ ' + f.name + ' (' + (b.size / 1024 / 1024).toFixed(2) + ' MB)';",
  "    if (b.type !== 'application/pdf') { var im = document.createElement('img'); im.src = URL.createObjectURL(b); p.appendChild(im); }",
  "    p.appendChild(nama);",
  "    p.style.display = 'flex';",
  "    $('failTeks').innerHTML = '<strong>Tukar fail</strong>';",
  "  });",
  "});",
  "",
  "$('borang').addEventListener('submit', function (ev) {",
  "  ev.preventDefault();",
  "  $('ralatUmum').classList.add('tersembunyi');",
  "  var r = semakTempatan();",
  "  paparRalat(r);",
  "  if (Object.keys(r).length) return;",
  "  $('hantar').disabled = true;",
  "  $('hantar').innerHTML = '<span class=\"pemutar\"></span> Sedang menghantar…';",
  "  $('sedangHantar').classList.remove('tersembunyi');",
  "  bacaDataUrl(failDipilih).then(function (dataUrl) {",
  "    var payload = {",
  "      nama: $('nama').value, telefon: $('telefon').value, jumlah: $('jumlah').value, tarikh: $('tarikh').value,",
  "      saluran: $('saluran').value, rujukan: $('rujukan').value, pengesahan: $('pengesahan').checked,",
  "      persetujuan: $('persetujuan').checked, laman: $('laman').value, token: DATA.token, ujian: !!DATA.ujian,",
  "      fail: { data: dataUrl.split(',')[1] }",
  "    };",
  "    google.script.run.withSuccessHandler(selesai).withFailureHandler(function () {",
  "      selesai({ ok: false, mesej: 'Sambungan terputus. Semak internet anda dan cuba lagi.' });",
  "    }).hantarPenyertaan(payload);",
  "  });",
  "});",
  "",
  "function selesai(res) {",
  "  $('hantar').disabled = false;",
  "  $('hantar').textContent = 'Hantar Penyertaan';",
  "  $('sedangHantar').classList.add('tersembunyi');",
  "  if (res && res.ok) {",
  "    $('borang').classList.add('tersembunyi');",
  "    $('idPenyertaan').textContent = res.id;",
  "    $('masaDiterima').textContent = 'Diterima pada ' + res.masa + ' (waktu Malaysia)';",
  "    if (res.pendua) $('mesejPendua').classList.remove('tersembunyi');",
  "    $('berjaya').classList.remove('tersembunyi');",
  "    window.scrollTo(0, 0);",
  "    return;",
  "  }",
  "  paparRalat((res && res.ralat) || {});",
  "  $('ralatUmum').textContent = (res && res.mesej) || 'Penghantaran gagal. Sila cuba lagi.';",
  "  $('ralatUmum').classList.remove('tersembunyi');",
  "}",
  "</script>",
  "</body>",
  "</html>",
  ""
].join('\n');
HTML_.Dashboard = [
  "<!DOCTYPE html>",
  "<html lang=\"ms\">",
  "<head>",
  "<base target=\"_top\">",
  "<meta charset=\"utf-8\">",
  "<style>/*__GAYA__*/",
  "body { font-size: 15px; }",
  ".bar { background: var(--hijau-gelap); color: #fff; padding: 10px 16px; display: flex; align-items: center; gap: 12px; flex-wrap: wrap; position: sticky; top: 0; z-index: 5; }",
  ".bar .nama-sistem { font-weight: 700; flex: 1; min-width: 180px; }",
  ".bar .emas { color: var(--emas); }",
  ".bar button { background: transparent; color: #fff; border: 1px solid rgba(255,255,255,.4); border-radius: 8px; padding: 6px 10px; font-size: 13px; cursor: pointer; }",
  "nav.tab { display: flex; gap: 4px; overflow-x: auto; background: #fff; border-bottom: 1px solid var(--garis); padding: 0 8px; position: sticky; top: 50px; z-index: 4; }",
  "nav.tab button { border: none; background: none; padding: 14px 12px; font-size: 15px; font-weight: 600; color: var(--teks-lembut); border-bottom: 3px solid transparent; cursor: pointer; white-space: nowrap; font-family: inherit; }",
  "nav.tab button.aktif { color: var(--hijau); border-bottom-color: var(--hijau); }",
  ".isi { max-width: 1200px; margin: 0 auto; padding: 16px; }",
  ".statistik { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 12px; margin-bottom: 16px; }",
  ".stat { background: #fff; border-radius: 12px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,.08); border-top: 4px solid var(--garis); }",
  ".stat .n { font-size: 1.9rem; font-weight: 800; line-height: 1.1; }",
  ".stat .l { color: var(--teks-lembut); font-size: .88rem; margin-top: 4px; }",
  ".stat.hijau { border-top-color: var(--hijau); } .stat.oren { border-top-color: var(--oren); } .stat.merah { border-top-color: var(--merah); } .stat.emas { border-top-color: var(--emas); }",
  ".alat { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; margin-bottom: 12px; }",
  ".alat input:not([type=checkbox]), .alat select { width: auto; min-width: 140px; flex: 1; min-height: 42px; padding: 8px 12px; font-size: 15px; }",
  "table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,.08); }",
  "th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid #eef1ee; vertical-align: top; font-size: 14px; }",
  "th { background: #f7f9f7; font-size: 12px; text-transform: uppercase; letter-spacing: .4px; color: var(--teks-lembut); }",
  "tbody tr { cursor: pointer; } tbody tr:hover { background: #f6faf7; }",
  ".mono { font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 13px; }",
  ".kecil { font-size: 12px; color: var(--teks-lembut); }",
  ".halaman { display: flex; gap: 8px; justify-content: center; align-items: center; margin: 14px 0; }",
  ".modal-latar { position: fixed; inset: 0; background: rgba(0,0,0,.5); z-index: 20; display: flex; align-items: flex-start; justify-content: center; overflow-y: auto; padding: 16px; }",
  ".modal { background: #fff; border-radius: 14px; max-width: 900px; width: 100%; padding: 20px; position: relative; margin: auto 0; }",
  ".modal .tutup { position: absolute; right: 12px; top: 12px; background: #eef1ee; border: none; border-radius: 50%; width: 36px; height: 36px; font-size: 20px; cursor: pointer; }",
  ".grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }",
  ".resit { background: #f2f4f2; border-radius: 10px; min-height: 240px; display: flex; align-items: center; justify-content: center; overflow: auto; }",
  ".resit img { max-width: 100%; }",
  ".resit iframe { width: 100%; height: 520px; border: 0; }",
  "dl.butiran { display: grid; grid-template-columns: 130px 1fr; gap: 6px 10px; margin: 0; }",
  "dl.butiran dt { color: var(--teks-lembut); font-size: 13px; } dl.butiran dd { margin: 0; font-weight: 600; word-break: break-word; }",
  ".tindakan { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }",
  ".notis { position: fixed; bottom: 16px; left: 50%; transform: translateX(-50%); background: var(--teks); color: #fff; padding: 12px 18px; border-radius: 10px; z-index: 30; max-width: 90vw; }",
  ".log-masuk { max-width: 400px; margin: 40px auto; }",
  ".kolum-borang label { display: block; font-weight: 600; margin: 12px 0 4px; font-size: 14px; }",
  ".kolum-borang .grid2 > div { min-width: 0; }",
  ".pemenang-hasil { background: var(--emas-muda); border: 1px solid var(--emas); border-radius: 10px; padding: 10px 12px; margin: 6px 0; }",
  "@media (max-width: 720px) {",
  "  .grid2 { grid-template-columns: 1fr; }",
  "  .sorok-mudah-alih { display: none; }",
  "  th, td { padding: 8px; }",
  "}",
  "</style>",
  "</head>",
  "<body>",
  "",
  "<section id=\"vLogMasuk\" class=\"log-masuk bekas\">",
  "  <div class=\"kad\">",
  "    <h2>Log Masuk Pentadbir</h2>",
  "    <p class=\"kecil\">Infaq dan Menang Goldbar · YAPEIM Sarawak</p>",
  "    <form id=\"fLogMasuk\" class=\"kolum-borang\">",
  "      <label for=\"lmPengguna\">Nama pengguna</label>",
  "      <input type=\"text\" id=\"lmPengguna\" autocomplete=\"username\" autocapitalize=\"none\" required>",
  "      <label for=\"lmKata\">Kata laluan</label>",
  "      <input type=\"password\" id=\"lmKata\" autocomplete=\"current-password\" required>",
  "      <div id=\"lmRalat\" class=\"kotak-amaran tersembunyi\" style=\"margin-top:12px\"></div>",
  "      <button class=\"butang butang-utama\" id=\"lmButang\">Log Masuk</button>",
  "    </form>",
  "  </div>",
  "</section>",
  "",
  "<section id=\"vTukarKata\" class=\"log-masuk bekas tersembunyi\">",
  "  <div class=\"kad\">",
  "    <h2>Tukar Kata Laluan</h2>",
  "    <p class=\"kecil\" id=\"tkNota\">Kata laluan baharu: sekurang-kurangnya 10 aksara, mengandungi huruf dan nombor.</p>",
  "    <form id=\"fTukarKata\" class=\"kolum-borang\">",
  "      <label for=\"tkLama\">Kata laluan semasa / sementara</label>",
  "      <input type=\"password\" id=\"tkLama\" autocomplete=\"current-password\" required>",
  "      <label for=\"tkBaru\">Kata laluan baharu</label>",
  "      <input type=\"password\" id=\"tkBaru\" autocomplete=\"new-password\" required>",
  "      <label for=\"tkBaru2\">Ulang kata laluan baharu</label>",
  "      <input type=\"password\" id=\"tkBaru2\" autocomplete=\"new-password\" required>",
  "      <div id=\"tkRalat\" class=\"kotak-amaran tersembunyi\" style=\"margin-top:12px\"></div>",
  "      <button class=\"butang butang-utama\">Simpan Kata Laluan</button>",
  "      <button type=\"button\" class=\"butang butang-garis\" style=\"width:100%;margin-top:8px\" id=\"tkBatal\">Batal</button>",
  "    </form>",
  "  </div>",
  "</section>",
  "",
  "<section id=\"vUtama\" class=\"tersembunyi\">",
  "  <div class=\"bar\">",
  "    <div class=\"nama-sistem\">INFAQ &amp; MENANG <span class=\"emas\">GOLDBAR</span> · Dashboard</div>",
  "    <span id=\"barPengguna\" class=\"kecil\" style=\"color:#fff\"></span>",
  "    <button id=\"bTukarKata\">Tukar kata laluan</button>",
  "    <button id=\"bLogKeluar\">Log keluar</button>",
  "  </div>",
  "  <nav class=\"tab\" id=\"nav\">",
  "    <button data-v=\"ringkasan\" class=\"aktif\">Ringkasan</button>",
  "    <button data-v=\"penyertaan\">Penyertaan</button>",
  "    <button data-v=\"terpantas\">Peserta Terpantas</button>",
  "    <button data-v=\"cabutan\">Cabutan</button>",
  "    <button data-v=\"audit\">Sejarah Tindakan</button>",
  "    <button data-v=\"tetapan\" class=\"utama-sahaja\">Tetapan</button>",
  "    <button data-v=\"pentadbir\" class=\"utama-sahaja\">Pentadbir</button>",
  "  </nav>",
  "",
  "  <div class=\"isi\">",
  "    <!-- RINGKASAN -->",
  "    <section data-paparan=\"ringkasan\">",
  "      <div id=\"rgKempen\" class=\"kotak-info\" style=\"margin-bottom:12px\"></div>",
  "      <div class=\"statistik\">",
  "        <div class=\"stat\"><div class=\"n\" id=\"sJumlah\">–</div><div class=\"l\">Jumlah penyertaan</div></div>",
  "        <div class=\"stat oren\"><div class=\"n\" id=\"sMenunggu\">–</div><div class=\"l\">Menunggu pengesahan</div></div>",
  "        <div class=\"stat merah\"><div class=\"n\" id=\"sSemakan\">–</div><div class=\"l\">Perlu semakan manual (ditanda)</div></div>",
  "        <div class=\"stat hijau\"><div class=\"n\" id=\"sLulus\">–</div><div class=\"l\">Penyertaan sah (lulus)</div></div>",
  "        <div class=\"stat\"><div class=\"n\" id=\"sDitolak\">–</div><div class=\"l\">Ditolak</div></div>",
  "        <div class=\"stat\"><div class=\"n\" id=\"sPembetulan\">–</div><div class=\"l\">Perlu pembetulan</div></div>",
  "        <div class=\"stat emas\"><div class=\"n\" id=\"sLayak\">–</div><div class=\"l\">Layak untuk cabutan</div></div>",
  "      </div>",
  "      <div class=\"statistik\">",
  "        <div class=\"stat\"><div class=\"n\" id=\"sRmDirekod\">–</div><div class=\"l\"><strong>Jumlah sumbangan DIREKOD</strong> — dilaporkan peserta, <u>belum disahkan</u> (tidak termasuk yang ditolak)</div></div>",
  "        <div class=\"stat hijau\"><div class=\"n\" id=\"sRmDisahkan\">–</div><div class=\"l\"><strong>Jumlah sumbangan DISAHKAN</strong> — resit telah diluluskan pentadbir</div></div>",
  "      </div>",
  "      <div class=\"kad\">",
  "        <h3>Semakan integriti data</h3>",
  "        <p class=\"kecil\">Memeriksa sama ada cap masa, nombor telefon, jumlah atau log audit telah diubah secara manual dalam Google Sheet.</p>",
  "        <button class=\"butang butang-garis\" id=\"bIntegriti\">Jalankan semakan</button>",
  "        <div id=\"hasilIntegriti\" style=\"margin-top:10px\"></div>",
  "      </div>",
  "    </section>",
  "",
  "    <!-- PENYERTAAN -->",
  "    <section data-paparan=\"penyertaan\" class=\"tersembunyi\">",
  "      <div class=\"alat\">",
  "        <input type=\"search\" id=\"pCarian\" placeholder=\"Cari nama, telefon, ID, tarikh (YYYY-MM-DD) atau no. rujukan\">",
  "        <select id=\"pStatus\">",
  "          <option value=\"\">Semua status</option>",
  "          <option>MENUNGGU PENGESAHAN</option><option>PERLU SEMAKAN MANUAL</option><option>LULUS</option>",
  "          <option>DITOLAK</option><option>PERLU PEMBETULAN</option>",
  "        </select>",
  "        <input type=\"date\" id=\"pDari\" title=\"Diterima dari\">",
  "        <input type=\"date\" id=\"pHingga\" title=\"Diterima hingga\">",
  "        <select id=\"pSusun\"><option value=\"baru\">Terbaru dahulu</option><option value=\"awal\">Terawal dahulu</option></select>",
  "      </div>",
  "      <div class=\"alat\">",
  "        <label class=\"semak\" style=\"margin:0\"><input type=\"checkbox\" id=\"pUjian\"> <span>Papar data ujian sahaja</span></label>",
  "        <span style=\"flex:1\"></span>",
  "        <button class=\"butang butang-garis butang-kecil\" id=\"bCari\">Cari</button>",
  "        <button class=\"butang butang-hijau butang-kecil\" id=\"bEksport\">⬇ Eksport CSV (Excel)</button>",
  "      </div>",
  "      <div id=\"pJumlah\" class=\"kecil\" style=\"margin-bottom:6px\"></div>",
  "      <table>",
  "        <thead><tr><th>ID / Diterima</th><th>Nama</th><th class=\"sorok-mudah-alih\">Telefon</th><th>Jumlah</th><th>Status</th><th class=\"sorok-mudah-alih\">Kelayakan</th></tr></thead>",
  "        <tbody id=\"pBadan\"></tbody>",
  "      </table>",
  "      <div class=\"halaman\"><button class=\"butang butang-garis butang-kecil\" id=\"pSebelum\">‹ Sebelum</button><span id=\"pHalaman\"></span><button class=\"butang butang-garis butang-kecil\" id=\"pSelepas\">Seterusnya ›</button></div>",
  "    </section>",
  "",
  "    <!-- TERPANTAS -->",
  "    <section data-paparan=\"terpantas\" class=\"tersembunyi\">",
  "      <div class=\"alat\"><label class=\"semak\" style=\"margin:0\"><input type=\"checkbox\" id=\"tUjian\"> <span>Data ujian</span></label>",
  "        <button class=\"butang butang-garis butang-kecil\" id=\"bMuatTerpantas\">Muat semula</button></div>",
  "      <div id=\"tAmaran\" class=\"kotak-info\" style=\"margin-bottom:12px\"></div>",
  "      <table>",
  "        <thead><tr><th>#</th><th>ID</th><th>Nama</th><th class=\"sorok-mudah-alih\">Telefon</th><th>Diterima (cap masa pelayan)</th><th class=\"sorok-mudah-alih\">Turutan</th></tr></thead>",
  "        <tbody id=\"tBadan\"></tbody>",
  "      </table>",
  "      <p class=\"kecil\">Kedudukan berdasarkan cap masa pelayan semasa borang diterima. Pemutus seri: nombor turutan penerimaan. Hanya penyertaan LULUS & layak dikira. Baris selepas garisan emas ialah calon simpanan.</p>",
  "    </section>",
  "",
  "    <!-- CABUTAN -->",
  "    <section data-paparan=\"cabutan\" class=\"tersembunyi\">",
  "      <div class=\"kad kolum-borang utama-sahaja\">",
  "        <h3>Jalankan Cabutan / Umumkan Keputusan</h3>",
  "        <div class=\"grid2\">",
  "          <div><label for=\"cKaedah\">Kaedah</label>",
  "            <select id=\"cKaedah\"><option value=\"RAWAK\">B. Cabutan bertuah rawak</option><option value=\"TERPANTAS\">A. Peserta terpantas (sah)</option></select></div>",
  "          <div><label for=\"cJenis\">Jenis</label>",
  "            <select id=\"cJenis\"><option value=\"UJIAN\">UJIAN (data ujian sahaja, tidak rasmi)</option><option value=\"RASMI\">RASMI</option></select></div>",
  "          <div><label for=\"cPemenang\">Bilangan pemenang</label><input type=\"number\" id=\"cPemenang\" min=\"1\" max=\"100\" value=\"1\"></div>",
  "          <div><label for=\"cSimpanan\">Bilangan pemenang simpanan</label><input type=\"number\" id=\"cSimpanan\" min=\"0\" max=\"100\" value=\"2\"></div>",
  "        </div>",
  "        <label for=\"cHadiah\">Hadiah</label><input type=\"text\" id=\"cHadiah\" maxlength=\"100\">",
  "        <div id=\"cInfo\" class=\"kotak-info\" style=\"margin-top:12px\"></div>",
  "        <button class=\"butang butang-emas\" style=\"margin-top:12px\" id=\"bCabut\">🎲 Jalankan</button>",
  "        <div id=\"cHasil\" style=\"margin-top:14px\"></div>",
  "      </div>",
  "      <div class=\"kad\">",
  "        <h3>Rekod Cabutan</h3>",
  "        <p class=\"kecil\">Paparan untuk siaran langsung (tiada telefon/resit, nama ditopeng):",
  "          <a id=\"lPaparan\" href=\"#\" target=\"_blank\" rel=\"noopener\">Keputusan rasmi</a> ·",
  "          <a id=\"lPaparanUjian\" href=\"#\" target=\"_blank\" rel=\"noopener\">Keputusan ujian</a></p>",
  "        <div id=\"cSenarai\"></div>",
  "      </div>",
  "    </section>",
  "",
  "    <!-- AUDIT -->",
  "    <section data-paparan=\"audit\" class=\"tersembunyi\">",
  "      <p class=\"kecil\">300 tindakan terkini. Log ini dirantai dengan tandatangan — sebarang pengubahan akan dikesan oleh \"Semakan integriti\".</p>",
  "      <table><thead><tr><th>Masa</th><th>Pentadbir</th><th>Tindakan</th><th>Sasaran</th><th class=\"sorok-mudah-alih\">Butiran</th></tr></thead><tbody id=\"aBadan\"></tbody></table>",
  "    </section>",
  "",
  "    <!-- TETAPAN -->",
  "    <section data-paparan=\"tetapan\" class=\"tersembunyi\">",
  "      <form class=\"kad kolum-borang\" id=\"fTetapan\">",
  "        <h3>Tetapan Kempen</h3>",
  "        <div class=\"kotak-amaran kecil\">Semua perubahan direkodkan dalam Sejarah Tindakan. Elakkan menukar tarikh atau syarat selepas kempen bermula.</div>",
  "        <label>Nama kempen</label><input type=\"text\" name=\"namaKempen\" maxlength=\"150\">",
  "        <div class=\"grid2\">",
  "          <div><label>Tarikh &amp; masa MULA (waktu Malaysia)</label><input type=\"datetime-local\" name=\"tarikhMula\"></div>",
  "          <div><label>Tarikh &amp; masa TAMAT (waktu Malaysia)</label><input type=\"datetime-local\" name=\"tarikhTamat\"></div>",
  "          <div><label>Sumbangan minimum (RM)</label><input type=\"number\" name=\"minSumbangan\" min=\"0\" step=\"0.01\"></div>",
  "          <div><label>Bilangan peserta terpantas</label><input type=\"number\" name=\"bilTerpantas\" min=\"0\"></div>",
  "          <div><label>Tandakan semakan jika jumlah ≥ (RM)</label><input type=\"number\" name=\"hadJumlahSemakan\" min=\"0\"></div>",
  "          <div><label>Had penyertaan setiap telefon</label><input type=\"number\" name=\"hadPenyertaanSetiapTelefon\" min=\"1\"></div>",
  "        </div>",
  "        <label>Hadiah</label><input type=\"text\" name=\"hadiah\" maxlength=\"150\">",
  "        <label>Kaedah sumbangan (satu baris satu pilihan)</label><textarea name=\"saluran\" rows=\"4\"></textarea>",
  "        <div class=\"grid2\">",
  "          <div><label>Emel pertanyaan data</label><input type=\"text\" name=\"emelPertanyaan\"></div>",
  "          <div><label>Telefon pertanyaan</label><input type=\"text\" name=\"telefonPertanyaan\"></div>",
  "        </div>",
  "        <label>Tempoh simpanan data</label><input type=\"text\" name=\"tempohSimpanData\">",
  "        <label class=\"semak\"><input type=\"checkbox\" name=\"satuPeluangSetiapTelefon\"> <span>Satu peluang sahaja bagi setiap nombor telefon (terpantas &amp; cabutan)</span></label>",
  "        <label class=\"semak\"><input type=\"checkbox\" name=\"tarikhSumbanganDalamTempoh\"> <span>Tarikh sumbangan mesti dalam tempoh kempen</span></label>",
  "        <label class=\"semak\"><input type=\"checkbox\" name=\"benarkanUjian\"> <span>Benarkan mod ujian (<span class=\"mono\">?ujian=1</span>) — <strong>MATIKAN sebelum kempen dilancarkan</strong></span></label>",
  "        <button class=\"butang butang-utama\">Simpan Tetapan</button>",
  "      </form>",
  "      <div class=\"kad\">",
  "        <h3>Data Ujian</h3>",
  "        <p class=\"kecil\">Data palsu ditanda \"UJIAN\" dan tidak dikira dalam statistik, terpantas atau cabutan rasmi.</p>",
  "        <div class=\"tindakan\">",
  "          <button class=\"butang butang-garis\" id=\"bJanaUjian\">Jana 30 penyertaan palsu</button>",
  "          <button class=\"butang butang-merah\" id=\"bPadamUjian\">Padam semua data ujian</button>",
  "        </div>",
  "        <p class=\"kecil\">Borang mod ujian: <a id=\"lBorangUjian\" href=\"#\" target=\"_blank\" rel=\"noopener\"></a></p>",
  "      </div>",
  "    </section>",
  "",
  "    <!-- PENTADBIR -->",
  "    <section data-paparan=\"pentadbir\" class=\"tersembunyi\">",
  "      <div class=\"kad kolum-borang\">",
  "        <h3>Tambah Pentadbir</h3>",
  "        <div class=\"grid2\">",
  "          <div><label>Nama pengguna (huruf kecil)</label><input type=\"text\" id=\"tpPengguna\" autocapitalize=\"none\"></div>",
  "          <div><label>Nama penuh staf</label><input type=\"text\" id=\"tpNama\"></div>",
  "        </div>",
  "        <label>Peranan</label>",
  "        <select id=\"tpPeranan\"><option value=\"PENYEMAK\">PENYEMAK — semak &amp; lulus resit</option><option value=\"UTAMA\">UTAMA — semua termasuk cabutan &amp; tetapan</option></select>",
  "        <button class=\"butang butang-hijau\" style=\"margin-top:12px\" id=\"bTambahPentadbir\">Tambah</button>",
  "      </div>",
  "      <table><thead><tr><th>Pengguna</th><th>Nama</th><th>Peranan</th><th>Status</th><th>Tindakan</th></tr></thead><tbody id=\"tpBadan\"></tbody></table>",
  "    </section>",
  "  </div>",
  "</section>",
  "",
  "<div id=\"modal\" class=\"modal-latar tersembunyi\"><div class=\"modal\" id=\"modalIsi\"></div></div>",
  "<div id=\"notis\" class=\"notis tersembunyi\"></div>",
  "",
  "<script>",
  "var DATA = /*__DATA__*/null;",
  "var TOKEN = null, SAYA = null, halaman = 0, entriSemasa = {}, ringkasan = null;",
  "function $(id) { return document.getElementById(id); }",
  "function esc(s) { return String(s == null ? '' : s).replace(/[&<>\"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', \"'\": '&#39;' }[c]; }); }",
  "function rm(n) { return 'RM ' + Number(n || 0).toLocaleString('ms-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }",
  "function notis(m) { var n = $('notis'); n.textContent = m; n.classList.remove('tersembunyi'); clearTimeout(notis.t); notis.t = setTimeout(function () { n.classList.add('tersembunyi'); }, 10000); }",
  "function simpan(k, v) { try { if (v == null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, v); } catch (e) {} }",
  "function baca(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }",
  "function lencana(s, ujian) {",
  "  var k = { 'MENUNGGU PENGESAHAN': 'l-menunggu', 'PERLU SEMAKAN MANUAL': 'l-semakan', 'LULUS': 'l-lulus', 'DITOLAK': 'l-ditolak', 'PERLU PEMBETULAN': 'l-pembetulan' }[s] || '';",
  "  return '<span class=\"lencana ' + k + '\">' + esc(s) + '</span>' + (ujian ? ' <span class=\"lencana l-ujian\">UJIAN</span>' : '');",
  "}",
  "",
  "/** Panggil fungsi pelayan dan kendalikan sesi tamat. */",
  "function panggil(fn) {",
  "  var args = Array.prototype.slice.call(arguments, 1);",
  "  return new Promise(function (ok, gagal) {",
  "    var r = google.script.run.withSuccessHandler(function (res) {",
  "      if (res && res.sesiTamat) { logKeluar(true); return gagal(new Error(res.ralat)); }",
  "      if (res && res.mestiTukar) { tunjuk('vTukarKata'); return gagal(new Error(res.ralat)); }",
  "      if (!res || !res.ok) { notis((res && res.ralat) || 'Ralat'); return gagal(new Error((res && res.ralat) || 'Ralat tidak diketahui')); }",
  "      ok(res.data);",
  "    }).withFailureHandler(function (e) { var m = 'Ralat pelayan: ' + ((e && e.message) || e); notis(m); gagal(new Error(m)); });",
  "    r[fn].apply(r, [TOKEN].concat(args));",
  "  });",
  "}",
  "",
  "function tunjuk(v) { ['vLogMasuk', 'vTukarKata', 'vUtama'].forEach(function (x) { $(x).classList.toggle('tersembunyi', x !== v); }); }",
  "",
  "function logKeluar(tamat) {",
  "  if (TOKEN && !tamat) google.script.run.adminLogKeluar(TOKEN);",
  "  TOKEN = null; SAYA = null; simpan('tk', null); simpan('saya', null);",
  "  tunjuk('vLogMasuk');",
  "  if (tamat) { $('lmRalat').textContent = 'Sesi tamat. Sila log masuk semula.'; $('lmRalat').classList.remove('tersembunyi'); }",
  "}",
  "",
  "$('fLogMasuk').onsubmit = function (e) {",
  "  e.preventDefault();",
  "  $('lmButang').disabled = true; $('lmRalat').classList.add('tersembunyi');",
  "  google.script.run.withSuccessHandler(function (res) {",
  "    $('lmButang').disabled = false; $('lmKata').value = '';",
  "    if (!res.ok) { $('lmRalat').textContent = res.ralat; $('lmRalat').classList.remove('tersembunyi'); return; }",
  "    TOKEN = res.token; SAYA = res; simpan('tk', TOKEN); simpan('saya', JSON.stringify(res));",
  "    if (res.mestiTukar) { $('tkNota').textContent = 'Ini log masuk pertama anda. Sila tukar kata laluan sementara. Minimum 10 aksara dengan huruf dan nombor.'; tunjuk('vTukarKata'); }",
  "    else masuk();",
  "  }).withFailureHandler(function () { $('lmButang').disabled = false; $('lmRalat').textContent = 'Sambungan gagal.'; $('lmRalat').classList.remove('tersembunyi'); })",
  "    .adminLogMasuk($('lmPengguna').value, $('lmKata').value);",
  "};",
  "",
  "$('fTukarKata').onsubmit = function (e) {",
  "  e.preventDefault();",
  "  $('tkRalat').classList.add('tersembunyi');",
  "  if ($('tkBaru').value !== $('tkBaru2').value) { $('tkRalat').textContent = 'Kata laluan baharu tidak sepadan.'; $('tkRalat').classList.remove('tersembunyi'); return; }",
  "  google.script.run.withSuccessHandler(function (res) {",
  "    if (!res.ok) { $('tkRalat').textContent = res.ralat; $('tkRalat').classList.remove('tersembunyi'); if (res.sesiTamat) logKeluar(true); return; }",
  "    $('fTukarKata').reset(); SAYA.mestiTukar = false; simpan('saya', JSON.stringify(SAYA));",
  "    notis('Kata laluan telah ditukar.'); masuk();",
  "  }).adminTukarKataLaluan(TOKEN, $('tkLama').value, $('tkBaru').value);",
  "};",
  "$('tkBatal').onclick = function () { if (SAYA && !SAYA.mestiTukar) tunjuk('vUtama'); else logKeluar(); };",
  "$('bTukarKata').onclick = function () { $('tkNota').textContent = 'Kata laluan baharu: sekurang-kurangnya 10 aksara, mengandungi huruf dan nombor.'; tunjuk('vTukarKata'); };",
  "$('bLogKeluar').onclick = function () { logKeluar(false); };",
  "",
  "function masuk() {",
  "  tunjuk('vUtama');",
  "  $('barPengguna').textContent = SAYA.nama + ' (' + SAYA.peranan + ')';",
  "  Array.prototype.forEach.call(document.querySelectorAll('.utama-sahaja'), function (el) { el.classList.toggle('tersembunyi', SAYA.peranan !== 'UTAMA'); });",
  "  $('lPaparan').href = DATA.url + '?p=paparan';",
  "  $('lPaparanUjian').href = DATA.url + '?p=paparan&ujian=1';",
  "  $('lBorangUjian').href = DATA.url + '?ujian=1'; $('lBorangUjian').textContent = DATA.url + '?ujian=1';",
  "  buka('ringkasan');",
  "}",
  "",
  "Array.prototype.forEach.call(document.querySelectorAll('#nav button'), function (b) { b.onclick = function () { buka(b.dataset.v); }; });",
  "function buka(v) {",
  "  Array.prototype.forEach.call(document.querySelectorAll('#nav button'), function (b) { b.classList.toggle('aktif', b.dataset.v === v); });",
  "  Array.prototype.forEach.call(document.querySelectorAll('[data-paparan]'), function (s) { s.classList.toggle('tersembunyi', s.dataset.paparan !== v); });",
  "  ({ ringkasan: muatRingkasan, penyertaan: function () { halaman = 0; muatSenarai(); }, terpantas: muatTerpantas, cabutan: muatCabutan,",
  "     audit: muatAudit, tetapan: muatTetapan, pentadbir: muatPentadbir })[v]();",
  "}",
  "",
  "var NAMA_STATUS_KEMPEN = { BELUM_DITETAPKAN: 'Tarikh kempen BELUM DITETAPKAN — borang awam ditutup. Tetapkan di tab Tetapan.', BELUM_MULA: 'Kempen BELUM BERMULA.', DIBUKA: 'Kempen SEDANG BERJALAN — borang dibuka.', TAMAT: 'Kempen TELAH TAMAT — borang ditutup.' };",
  "",
  "function muatRingkasan() {",
  "  return panggil('adminRingkasan').then(function (r) {",
  "    ringkasan = r;",
  "    $('rgKempen').innerHTML = '<strong>' + esc(NAMA_STATUS_KEMPEN[r.statusKempen]) + '</strong>' +",
  "      (r.tetapan.tarikhMula ? '<br>Tempoh: ' + esc(r.tetapan.tarikhMula.replace('T', ' ')) + ' hingga ' + esc(r.tetapan.tarikhTamat.replace('T', ' ')) : '') +",
  "      '<br><span class=\"kecil\">Versi sistem: ' + esc(r.versi) + ' · Masa pelayan: ' + esc(r.sekarang) + (r.tetapan.benarkanUjian ? ' · <strong style=\"color:var(--biru)\">Mod ujian DIHIDUPKAN</strong>' : '') + '</span>';",
  "    $('sJumlah').textContent = r.jumlah; $('sMenunggu').textContent = r.menunggu; $('sSemakan').textContent = r.semakan;",
  "    $('sLulus').textContent = r.lulus; $('sDitolak').textContent = r.ditolak; $('sPembetulan').textContent = r.pembetulan;",
  "    $('sLayak').textContent = r.layak; $('sRmDirekod').textContent = rm(r.rmDirekod); $('sRmDisahkan').textContent = rm(r.rmDisahkan);",
  "    return r;",
  "  });",
  "}",
  "",
  "$('bIntegriti').onclick = function () {",
  "  $('hasilIntegriti').textContent = 'Menyemak…';",
  "  panggil('adminSemakIntegriti').then(function (r) {",
  "    $('hasilIntegriti').innerHTML = r.ok ? '<div class=\"kotak-info\">✓ Tiada pengubahan dikesan.</div>'",
  "      : '<div class=\"kotak-amaran\"><strong>Masalah dikesan:</strong><ul>' + r.masalah.map(function (m) { return '<li>' + esc(m) + '</li>'; }).join('') + '</ul></div>';",
  "  });",
  "};",
  "",
  "function tapisSemasa() {",
  "  return { carian: $('pCarian').value, status: $('pStatus').value, dari: $('pDari').value, hingga: $('pHingga').value,",
  "    susun: $('pSusun').value, ujian: $('pUjian').checked, halaman: halaman };",
  "}",
  "function muatSenarai() {",
  "  $('pBadan').innerHTML = '<tr><td colspan=\"6\">Memuatkan…</td></tr>';",
  "  panggil('adminSenarai', tapisSemasa()).then(function (r) {",
  "    entriSemasa = {};",
  "    $('pJumlah').textContent = r.jumlah + ' penyertaan dijumpai';",
  "    $('pBadan').innerHTML = r.entri.length ? r.entri.map(function (e) {",
  "      entriSemasa[e.id] = e;",
  "      return '<tr data-id=\"' + esc(e.id) + '\"><td><span class=\"mono\">' + esc(e.id) + '</span><div class=\"kecil\">' + esc(e.diterima) + '</div></td>' +",
  "        '<td>' + esc(e.nama) + (e.bendera ? '<div class=\"kecil\" style=\"color:var(--merah)\">⚑ ' + esc(e.bendera) + '</div>' : '') + (e.integriti ? '' : '<div class=\"kecil\" style=\"color:var(--merah)\">⚠ GAGAL INTEGRITI</div>') + '</td>' +",
  "        '<td class=\"sorok-mudah-alih\">' + esc(e.telefon) + '</td><td>' + rm(e.jumlah) + '</td><td>' + lencana(e.status, e.ujian) + '</td>' +",
  "        '<td class=\"sorok-mudah-alih kecil\">' + (e.layak ? '<strong style=\"color:var(--hijau)\">LAYAK</strong>' : esc(e.sebabKelayakan)) + '</td></tr>';",
  "    }).join('') : '<tr><td colspan=\"6\">Tiada rekod.</td></tr>';",
  "    var bilHal = Math.max(1, Math.ceil(r.jumlah / r.saiz));",
  "    $('pHalaman').textContent = 'Halaman ' + (r.halaman + 1) + ' / ' + bilHal;",
  "    $('pSebelum').disabled = r.halaman <= 0; $('pSelepas').disabled = r.halaman + 1 >= bilHal;",
  "  });",
  "}",
  "$('pBadan').onclick = function (e) { var tr = e.target.closest('tr[data-id]'); if (tr) bukaEntri(tr.dataset.id); };",
  "$('bCari').onclick = function () { halaman = 0; muatSenarai(); };",
  "$('pCarian').onkeydown = function (e) { if (e.key === 'Enter') { halaman = 0; muatSenarai(); } };",
  "['pStatus', 'pSusun', 'pUjian', 'pDari', 'pHingga'].forEach(function (x) { $(x).onchange = function () { halaman = 0; muatSenarai(); }; });",
  "$('pSebelum').onclick = function () { halaman--; muatSenarai(); };",
  "$('pSelepas').onclick = function () { halaman++; muatSenarai(); };",
  "",
  "function muatTurun(nama, kandungan, jenis) {",
  "  var b = kandungan instanceof Blob ? kandungan : new Blob([kandungan], { type: jenis });",
  "  var a = document.createElement('a');",
  "  a.href = URL.createObjectURL(b); a.download = nama; document.body.appendChild(a); a.click();",
  "  setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 2000);",
  "}",
  "$('bEksport').onclick = function () {",
  "  var t = tapisSemasa(); delete t.halaman;",
  "  panggil('adminEksportCsv', t).then(function (r) { muatTurun(r.namaFail, r.csv, 'text/csv;charset=utf-8'); notis(r.bil + ' rekod dieksport.'); });",
  "};",
  "",
  "function tutupModal() { $('modal').classList.add('tersembunyi'); $('modalIsi').innerHTML = ''; }",
  "$('modal').onclick = function (e) { if (e.target === $('modal')) tutupModal(); };",
  "",
  "function bukaEntri(id) {",
  "  var e = entriSemasa[id];",
  "  $('modalIsi').innerHTML = '<button class=\"tutup\" aria-label=\"Tutup\">×</button>' +",
  "    '<h3 class=\"mono\">' + esc(e.id) + '</h3><div>' + lencana(e.status, e.ujian) + '</div>' +",
  "    (e.integriti ? '' : '<div class=\"kotak-amaran\" style=\"margin-top:8px\">⚠ Rekod ini gagal semakan integriti — data asal telah diubah secara manual.</div>') +",
  "    (e.bendera ? '<div class=\"kotak-amaran\" style=\"margin-top:8px\"><strong>Ditanda untuk semakan manual:</strong> ' + esc(e.bendera) + '</div>' : '') +",
  "    '<div class=\"grid2\" style=\"margin-top:14px\"><div><dl class=\"butiran\">' +",
  "    '<dt>Diterima</dt><dd>' + esc(e.diterima) + ' <span class=\"kecil\">(turutan #' + e.turutan + ')</span></dd>' +",
  "    '<dt>Nama</dt><dd>' + esc(e.nama) + '</dd><dt>Telefon</dt><dd>' + esc(e.telefon) + '</dd>' +",
  "    '<dt>Jumlah</dt><dd>' + rm(e.jumlah) + '</dd><dt>Tarikh sumbangan</dt><dd>' + esc(e.tarikh) + '</dd>' +",
  "    '<dt>Kaedah</dt><dd>' + esc(e.saluran) + '</dd><dt>No. rujukan</dt><dd>' + esc(e.rujukan || '-') + '</dd>' +",
  "    '<dt>Kelayakan</dt><dd>' + (e.layak ? 'LAYAK' : esc(e.sebabKelayakan)) + '</dd>' +",
  "    '<dt>Catatan</dt><dd>' + esc(e.catatan || '-') + '</dd><dt>Disemak</dt><dd>' + esc(e.oleh ? e.oleh + ' · ' + e.pada : '-') + '</dd></dl>' +",
  "    '<div class=\"kotak-info kecil\" style=\"margin-top:12px\">Semak: nama &amp; jumlah pada resit sepadan, tarikh dalam tempoh, penerima ialah akaun rasmi YAPEIM, dan resit tidak kelihatan diubah. Jika ragu, sahkan dengan penyata bank.</div>' +",
  "    '<label class=\"tajuk\" for=\"mCatatan\">Catatan / sebab (wajib untuk Tolak &amp; Pembetulan)</label><textarea id=\"mCatatan\" rows=\"2\" maxlength=\"500\"></textarea>' +",
  "    '<div class=\"tindakan\"><button class=\"butang butang-hijau\" data-s=\"LULUS\">✓ Luluskan</button>' +",
  "    '<button class=\"butang butang-merah\" data-s=\"DITOLAK\">✗ Tolak</button>' +",
  "    '<button class=\"butang butang-oren\" data-s=\"PERLU PEMBETULAN\">✎ Minta Pembetulan</button></div></div>' +",
  "    '<div><div class=\"resit\" id=\"mResit\">' + (e.adaResit ? '<button class=\"butang butang-garis\" id=\"mLihat\">🔒 Lihat resit</button>' : '<span class=\"kecil\">Tiada fail (data ujian)</span>') + '</div>' +",
  "    '<div id=\"mResitAlat\" class=\"kecil\" style=\"margin-top:6px\"></div></div></div>';",
  "  $('modal').classList.remove('tersembunyi');",
  "  $('modalIsi').querySelector('.tutup').onclick = tutupModal;",
  "  if (e.adaResit) $('mLihat').onclick = function () { lihatResit(e.id); };",
  "  Array.prototype.forEach.call($('modalIsi').querySelectorAll('[data-s]'), function (b) {",
  "    b.onclick = function () {",
  "      var s = b.dataset.s, c = $('mCatatan').value.trim();",
  "      if (s !== 'LULUS' && c.length < 3) { notis('Sila tulis sebab dalam catatan.'); $('mCatatan').focus(); return; }",
  "      if (!confirm('Tukar status ' + e.id + ' kepada ' + s + '?')) return;",
  "      b.disabled = true;",
  "      panggil('adminTukarStatus', e.id, s, c).then(function () { notis('Status dikemas kini.'); tutupModal(); muatSenarai(); }, function () { b.disabled = false; });",
  "    };",
  "  });",
  "}",
  "",
  "function lihatResit(id) {",
  "  $('mResit').innerHTML = '<span class=\"kecil\">Memuatkan resit…</span>';",
  "  panggil('adminLihatResit', id).then(function (r) {",
  "    var bait = atob(r.data), arr = new Uint8Array(bait.length);",
  "    for (var i = 0; i < bait.length; i++) arr[i] = bait.charCodeAt(i);",
  "    var blob = new Blob([arr], { type: r.mime });",
  "    var url = URL.createObjectURL(blob);",
  "    $('mResit').innerHTML = r.mime === 'application/pdf' ? '<iframe src=\"' + url + '\" title=\"Resit PDF\"></iframe>' : '<img alt=\"Resit\" src=\"' + url + '\">';",
  "    $('mResitAlat').innerHTML = '';",
  "    var a = document.createElement('a'); a.href = url; a.download = r.nama; a.textContent = '⬇ Muat turun resit';",
  "    $('mResitAlat').appendChild(a);",
  "  });",
  "}",
  "",
  "function muatTerpantas() {",
  "  var ujian = $('tUjian').checked;",
  "  $('tBadan').innerHTML = '<tr><td colspan=\"6\">Memuatkan…</td></tr>';",
  "  var p = panggil('adminTerpantas', ujian);",
  "  p.catch(function (e) { $('tBadan').innerHTML = '<tr><td colspan=\"6\" style=\"color:var(--merah)\">Gagal: ' + esc(e && e.message) + '</td></tr>'; });",
  "  p.then(function (r) {",
  "    var amaran = [];",
  "    if (!ujian && r.statusKempen !== 'TAMAT') amaran.push('Kempen belum tamat — senarai ini SEMENTARA dan bukan keputusan rasmi.');",
  "    if (r.belumSelesai) amaran.push(r.belumSelesai + ' penyertaan belum disemak. Kedudukan boleh berubah.');",
  "    $('tAmaran').innerHTML = esc(amaran.join(' ') || 'Kempen tamat dan semua penyertaan telah disemak. Senarai ini boleh diumumkan melalui tab Cabutan (kaedah Peserta Terpantas, RASMI).');",
  "    $('tBadan').innerHTML = r.senarai.length ? r.senarai.map(function (e) {",
  "      return '<tr' + (e.kedudukan === r.bilTerpantas ? ' style=\"border-bottom:3px solid var(--emas)\"' : '') + (e.kedudukan > r.bilTerpantas ? ' class=\"kecil\"' : '') + '><td><strong>' + e.kedudukan + '</strong></td><td class=\"mono\">' + esc(e.id) + '</td><td>' + esc(e.nama) +",
  "        '</td><td class=\"sorok-mudah-alih\">' + esc(e.telefon) + '</td><td class=\"mono\">' + esc(e.diterima) + '</td><td class=\"sorok-mudah-alih\">' + e.turutan + '</td></tr>';",
  "    }).join('') : '<tr><td colspan=\"6\">Belum ada penyertaan layak.</td></tr>';",
  "  });",
  "}",
  "$('bMuatTerpantas').onclick = muatTerpantas; $('tUjian').onchange = muatTerpantas;",
  "",
  "function kemasInfoCabutan() {",
  "  if (!ringkasan) return;",
  "  var ujian = $('cJenis').value === 'UJIAN';",
  "  var n = ujian ? ringkasan.layakUjian : ringkasan.layak;",
  "  var t = 'Jumlah peserta layak (' + (ujian ? 'data ujian' : 'rasmi') + '): <strong>' + n + '</strong>.';",
  "  if (!ujian) {",
  "    if (ringkasan.statusKempen !== 'TAMAT') t += '<br>⚠ Cabutan rasmi hanya dibenarkan selepas kempen tamat.';",
  "    if (ringkasan.menunggu + ringkasan.semakan > 0) t += '<br>⚠ Masih ada ' + (ringkasan.menunggu + ringkasan.semakan) + ' penyertaan belum disemak.';",
  "  }",
  "  $('cInfo').innerHTML = t;",
  "}",
  "['cJenis', 'cKaedah'].forEach(function (x) { $(x).onchange = kemasInfoCabutan; });",
  "",
  "function muatCabutan() {",
  "  $('cInfo').textContent = 'Memuatkan bilangan peserta layak…';",
  "  muatRingkasan().then(function (r) { if (!$('cHadiah').value) $('cHadiah').value = r.tetapan.hadiah; kemasInfoCabutan(); },",
  "    function (e) { $('cInfo').textContent = 'Gagal memuatkan: ' + (e && e.message); });",
  "  panggil('adminSenaraiCabutan').then(function (senarai) {",
  "    $('cSenarai').innerHTML = senarai.length ? senarai.map(function (c) {",
  "      return '<div class=\"kad\" style=\"border:1px solid var(--garis)\"><div><strong class=\"mono\">' + esc(c.id) + '</strong> ' +",
  "        '<span class=\"lencana ' + (c.jenis === 'RASMI' ? 'l-lulus' : 'l-ujian') + '\">' + esc(c.jenis) + '</span> ' +",
  "        '<span class=\"lencana ' + (c.status === 'AKTIF' ? 'l-menunggu' : 'l-ditolak') + '\">' + esc(c.status) + '</span></div>' +",
  "        '<div class=\"kecil\">' + esc(c.kaedah === 'RAWAK' ? 'Cabutan bertuah' : 'Peserta terpantas') + ' · ' + esc(c.masa) + ' · oleh ' + esc(c.oleh) + ' · ' + c.bilLayak + ' layak · Hadiah: ' + esc(c.hadiah) + '</div>' +",
  "        '<div style=\"margin-top:6px\">Pemenang: ' + c.pemenang.map(function (p) { return '<span class=\"mono\">' + esc(p.id) + '</span> (' + esc(p.nama) + ')'; }).join(', ') + '</div>' +",
  "        (c.simpanan.length ? '<div class=\"kecil\">Simpanan: ' + c.simpanan.map(function (p) { return esc(p.id); }).join(', ') + '</div>' : '') +",
  "        '<div class=\"kecil mono\" style=\"word-break:break-all\">Hash senarai: ' + esc(c.hashSenarai) + (c.benih !== '-' ? ' · Benih: ' + esc(c.benih) : '') + '</div>' +",
  "        (c.catatan ? '<div class=\"kecil\">' + esc(c.catatan) + '</div>' : '') +",
  "        (c.status === 'AKTIF' && SAYA.peranan === 'UTAMA' ? '<button class=\"butang butang-garis butang-kecil\" style=\"margin-top:8px\" data-batal=\"' + esc(c.id) + '\">Batalkan (dengan sebab)</button>' : '') + '</div>';",
  "    }).join('') : '<p class=\"kecil\">Belum ada cabutan.</p>';",
  "    Array.prototype.forEach.call($('cSenarai').querySelectorAll('[data-batal]'), function (b) {",
  "      b.onclick = function () {",
  "        var sebab = prompt('Sebab pembatalan ' + b.dataset.batal + ' (akan direkod dalam audit):');",
  "        if (!sebab) return;",
  "        panggil('adminBatalCabutan', b.dataset.batal, sebab).then(function () { notis('Cabutan dibatalkan dan direkod.'); muatCabutan(); });",
  "      };",
  "    });",
  "  });",
  "}",
  "",
  "$('bCabut').onclick = function () {",
  "  var o = { kaedah: $('cKaedah').value, ujian: $('cJenis').value === 'UJIAN', bilPemenang: +$('cPemenang').value, bilSimpanan: +$('cSimpanan').value, hadiah: $('cHadiah').value };",
  "  var n = o.ujian ? ringkasan.layakUjian : ringkasan.layak;",
  "  if (!confirm((o.ujian ? 'CABUTAN UJIAN' : '⚠ CABUTAN RASMI — keputusan akan direkod secara kekal') + '\\n\\nKaedah: ' + (o.kaedah === 'RAWAK' ? 'Cabutan bertuah rawak' : 'Peserta terpantas') +",
  "    '\\nPeserta layak: ' + n + '\\nPemenang: ' + o.bilPemenang + ', Simpanan: ' + o.bilSimpanan + '\\n\\nTeruskan?')) return;",
  "  $('bCabut').disabled = true;",
  "  panggil('adminJalankanCabutan', o).then(function (c) {",
  "    $('bCabut').disabled = false;",
  "    $('cHasil').innerHTML = '<div class=\"kotak-info\"><strong>Keputusan direkod: ' + esc(c.id) + '</strong> — buka <a href=\"' + esc(DATA.url + '?p=paparan' + (o.ujian ? '&ujian=1' : '')) + '\" target=\"_blank\" rel=\"noopener\">paparan siaran langsung</a> untuk mendedahkan pemenang satu per satu.</div>' +",
  "      c.pemenang.map(function (p) { return '<div class=\"pemenang-hasil\">🏆 #' + p.kedudukan + ' <strong class=\"mono\">' + esc(p.id) + '</strong> ' + esc(p.nama) + '</div>'; }).join('') +",
  "      c.simpanan.map(function (p) { return '<div class=\"pemenang-hasil\" style=\"background:#fff\">Simpanan #' + p.kedudukan + ' <span class=\"mono\">' + esc(p.id) + '</span> ' + esc(p.nama) + '</div>'; }).join('');",
  "    muatCabutan();",
  "  }, function (e) { $('bCabut').disabled = false; $('cHasil').innerHTML = '<div class=\"kotak-amaran\"><strong>Cabutan tidak dijalankan:</strong> ' + esc(e && e.message) + '</div>'; });",
  "};",
  "",
  "function muatAudit() {",
  "  $('aBadan').innerHTML = '<tr><td colspan=\"5\">Memuatkan…</td></tr>';",
  "  panggil('adminAudit').then(function (r) {",
  "    $('aBadan').innerHTML = r.map(function (a) {",
  "      return '<tr><td class=\"kecil\">' + esc(a.masa) + '</td><td>' + esc(a.pentadbir) + '</td><td>' + esc(a.tindakan) + '</td><td class=\"mono\">' + esc(a.sasaran) + '</td><td class=\"sorok-mudah-alih kecil\">' + esc(a.butiran) + '</td></tr>';",
  "    }).join('');",
  "  });",
  "}",
  "",
  "function muatTetapan() {",
  "  panggil('adminRingkasan').then(function (r) {",
  "    var f = $('fTetapan'), t = r.tetapan;",
  "    Object.keys(t).forEach(function (k) {",
  "      var el = f.elements[k]; if (!el) return;",
  "      if (el.type === 'checkbox') el.checked = !!t[k];",
  "      else if (k === 'saluran') el.value = t[k].join('\\n');",
  "      else el.value = t[k];",
  "    });",
  "  });",
  "}",
  "$('fTetapan').onsubmit = function (e) {",
  "  e.preventDefault();",
  "  var f = this, t = {};",
  "  Array.prototype.forEach.call(f.elements, function (el) {",
  "    if (!el.name) return;",
  "    t[el.name] = el.type === 'checkbox' ? el.checked : el.value;",
  "  });",
  "  t.saluran = t.saluran.split('\\n');",
  "  panggil('adminSimpanTetapan', t).then(function () { notis('Tetapan disimpan.'); muatTetapan(); });",
  "};",
  "$('bJanaUjian').onclick = function () {",
  "  $('bJanaUjian').disabled = true;",
  "  panggil('adminJanaDataUjian', 30).then(function (n) { $('bJanaUjian').disabled = false; alert(n + ' penyertaan ujian palsu telah dijana. Semak di tab Penyertaan (tandakan \"Papar data ujian sahaja\").'); },",
  "    function (e) { $('bJanaUjian').disabled = false; alert('Gagal menjana data ujian: ' + (e && e.message)); });",
  "};",
  "$('bPadamUjian').onclick = function () { if (confirm('Padam SEMUA data ujian (termasuk fail resit ujian)?')) panggil('adminPadamDataUjian').then(function (n) { notis(n + ' rekod ujian dipadam.'); }); };",
  "",
  "function paparKata(r) {",
  "  $('modalIsi').innerHTML = '<button class=\"tutup\">×</button><h3>Kata laluan sementara</h3><p>Berikan maklumat ini kepada staf secara peribadi (bukan dalam kumpulan WhatsApp). Ia hanya dipaparkan SEKALI.</p>' +",
  "    '<dl class=\"butiran\"><dt>Nama pengguna</dt><dd class=\"mono\">' + esc(r.pengguna) + '</dd><dt>Kata laluan</dt><dd class=\"mono\" style=\"font-size:1.2rem\">' + esc(r.kataSementara) + '</dd>' +",
  "    '<dt>Pautan</dt><dd class=\"mono\" style=\"font-size:12px\">' + esc(DATA.url + '?p=admin') + '</dd></dl>';",
  "  $('modal').classList.remove('tersembunyi');",
  "  $('modalIsi').querySelector('.tutup').onclick = tutupModal;",
  "}",
  "function muatPentadbir() {",
  "  panggil('adminSenaraiPentadbir').then(function (r) {",
  "    $('tpBadan').innerHTML = r.map(function (p) {",
  "      return '<tr><td class=\"mono\">' + esc(p.pengguna) + '</td><td>' + esc(p.nama) + '</td><td>' + esc(p.peranan) + '</td><td>' + (p.aktif ? 'Aktif' : 'Tidak aktif') + (p.mestiTukar ? ' <span class=\"kecil\">(belum tukar kata laluan)</span>' : '') + '</td>' +",
  "        '<td><button class=\"butang butang-garis butang-kecil\" data-reset=\"' + esc(p.pengguna) + '\">Set semula kata laluan</button> ' +",
  "        (p.pengguna !== SAYA.pengguna ? '<button class=\"butang butang-garis butang-kecil\" data-aktif=\"' + esc(p.pengguna) + '\" data-nilai=\"' + (!p.aktif) + '\">' + (p.aktif ? 'Nyahaktif' : 'Aktifkan') + '</button>' : '') + '</td></tr>';",
  "    }).join('');",
  "    Array.prototype.forEach.call($('tpBadan').querySelectorAll('[data-reset]'), function (b) {",
  "      b.onclick = function () { if (confirm('Set semula kata laluan ' + b.dataset.reset + '?')) panggil('adminSetSemulaKata', b.dataset.reset).then(function (x) { paparKata(x); muatPentadbir(); }); };",
  "    });",
  "    Array.prototype.forEach.call($('tpBadan').querySelectorAll('[data-aktif]'), function (b) {",
  "      b.onclick = function () { panggil('adminTukarAktif', b.dataset.aktif, b.dataset.nilai === 'true').then(muatPentadbir); };",
  "    });",
  "  });",
  "}",
  "$('bTambahPentadbir').onclick = function () {",
  "  panggil('adminTambahPentadbir', { pengguna: $('tpPengguna').value, nama: $('tpNama').value, peranan: $('tpPeranan').value })",
  "    .then(function (r) { $('tpPengguna').value = ''; $('tpNama').value = ''; paparKata(r); muatPentadbir(); });",
  "};",
  "",
  "(function () {",
  "  TOKEN = baca('tk');",
  "  try { SAYA = JSON.parse(baca('saya') || 'null'); } catch (e) { SAYA = null; }",
  "  if (TOKEN && SAYA && !SAYA.mestiTukar) masuk(); else if (TOKEN && SAYA) tunjuk('vTukarKata');",
  "})();",
  "</script>",
  "</body>",
  "</html>",
  ""
].join('\n');
HTML_.Paparan = [
  "<!DOCTYPE html>",
  "<html lang=\"ms\">",
  "<head>",
  "<base target=\"_top\">",
  "<meta charset=\"utf-8\">",
  "<style>/*__GAYA__*/",
  "body { background: radial-gradient(ellipse at top, #0f7a4e 0%, #073d27 60%, #04261a 100%); color: #fff; min-height: 100vh; }",
  ".pentas { max-width: 1100px; margin: 0 auto; padding: 24px 16px 48px; text-align: center; }",
  ".pentas h1 { font-size: clamp(1.6rem, 4vw, 3rem); margin: 12px 0 0; }",
  ".pentas h1 .emas { color: var(--emas); }",
  ".sub { opacity: .85; font-size: clamp(1rem, 2vw, 1.3rem); margin-bottom: 20px; }",
  ".gulung { font-family: ui-monospace, Menlo, Consolas, monospace; font-size: clamp(2rem, 7vw, 5rem); font-weight: 800; color: var(--emas);",
  "  background: rgba(0,0,0,.25); border: 3px solid var(--emas); border-radius: 20px; padding: 18px; margin: 18px auto; max-width: 760px; min-height: 1.6em; }",
  ".senarai { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); margin-top: 18px; text-align: left; }",
  ".pemenang { background: rgba(255,255,255,.08); border: 1px solid rgba(201,162,39,.6); border-radius: 14px; padding: 14px 16px; animation: muncul .6s ease-out; }",
  ".pemenang .no { color: var(--emas); font-weight: 800; font-size: .95rem; }",
  ".pemenang .idp { font-family: ui-monospace, Menlo, monospace; font-size: 1.25rem; font-weight: 700; }",
  ".pemenang .nm { opacity: .9; }",
  ".simpanan { border-color: rgba(255,255,255,.25); }",
  "@keyframes muncul { from { transform: scale(.85); opacity: 0; } to { transform: none; opacity: 1; } }",
  ".kawalan { margin-top: 24px; display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }",
  ".audit { margin-top: 28px; font-size: .78rem; opacity: .7; word-break: break-all; }",
  ".tab { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; margin: 14px 0; }",
  ".tab button { background: rgba(255,255,255,.1); color: #fff; border: 1px solid rgba(255,255,255,.3); }",
  ".tab button.aktif { background: var(--emas); color: #1d1600; border-color: var(--emas); }",
  "</style>",
  "</head>",
  "<body>",
  "<div class=\"pentas\">",
  "  <!--__LOGO__-->",
  "  <div id=\"labelUjian\" class=\"kotak-ujian tersembunyi\" style=\"margin:12px auto;max-width:600px\">PAPARAN UJIAN — BUKAN KEPUTUSAN RASMI</div>",
  "  <h1>INFAQ DAN MENANG <span class=\"emas\">GOLDBAR</span></h1>",
  "  <div class=\"sub\">YAPEIM Sarawak · <span id=\"tajukKaedah\">Keputusan</span></div>",
  "  <div class=\"tab\" id=\"tab\"></div>",
  "  <div id=\"kosong\" class=\"tersembunyi\" style=\"margin-top:40px;font-size:1.3rem\">Keputusan belum diumumkan.</div>",
  "  <div id=\"maklumat\" class=\"sub\"></div>",
  "  <div class=\"gulung\" id=\"gulung\">— — —</div>",
  "  <div class=\"kawalan\">",
  "    <button class=\"butang butang-emas\" id=\"dedah\">▶ Dedahkan pemenang seterusnya</button>",
  "    <button class=\"butang butang-garis\" id=\"dedahSemua\">Dedahkan semua</button>",
  "  </div>",
  "  <h2 id=\"tajukPemenang\" class=\"tersembunyi\" style=\"margin-top:28px;color:var(--emas)\">Pemenang</h2>",
  "  <div class=\"senarai\" id=\"senaraiPemenang\"></div>",
  "  <h3 id=\"tajukSimpanan\" class=\"tersembunyi\" style=\"margin-top:24px\">Pemenang Simpanan</h3>",
  "  <div class=\"senarai\" id=\"senaraiSimpanan\"></div>",
  "  <div class=\"audit\" id=\"audit\"></div>",
  "</div>",
  "<script>",
  "var DATA = /*__DATA__*/null;",
  "var cabutan = [], semasa = null, didedah = 0, giliran = [], sedangGulung = false;",
  "function $(id) { return document.getElementById(id); }",
  "if (DATA.ujian) $('labelUjian').classList.remove('tersembunyi');",
  "",
  "google.script.run.withSuccessHandler(function (res) {",
  "  if (!res || !res.ok || !res.cabutan.length) { $('kosong').classList.remove('tersembunyi'); sorok(); return; }",
  "  cabutan = res.cabutan;",
  "  cabutan.forEach(function (c, i) {",
  "    var b = document.createElement('button');",
  "    b.className = 'butang butang-kecil';",
  "    b.textContent = c.kaedah === 'RAWAK' ? 'Cabutan Bertuah' : 'Peserta Terpantas';",
  "    b.onclick = function () { pilih(i); };",
  "    $('tab').appendChild(b);",
  "  });",
  "  pilih(0);",
  "}).withFailureHandler(function () { $('kosong').textContent = 'Keputusan tidak dapat dimuatkan.'; $('kosong').classList.remove('tersembunyi'); sorok(); })",
  "  .paparanKeputusan(!!DATA.ujian);",
  "",
  "function sorok() { ['gulung', 'dedah', 'dedahSemua'].forEach(function (x) { $(x).classList.add('tersembunyi'); }); }",
  "",
  "function pilih(i) {",
  "  semasa = cabutan[i];",
  "  Array.prototype.forEach.call($('tab').children, function (b, j) { b.classList.toggle('aktif', i === j); });",
  "  $('tajukKaedah').textContent = semasa.kaedah === 'RAWAK' ? 'Cabutan Bertuah' : 'Peserta Terpantas';",
  "  $('maklumat').textContent = (semasa.hadiah ? 'Hadiah: ' + semasa.hadiah + ' · ' : '') + semasa.bilLayak + ' penyertaan layak · ' + semasa.masa;",
  "  $('audit').textContent = 'ID Cabutan: ' + semasa.id + ' · Hash senarai layak: ' + semasa.hashSenarai + (semasa.benih !== '-' ? ' · Benih: ' + semasa.benih : '');",
  "  $('senaraiPemenang').innerHTML = ''; $('senaraiSimpanan').innerHTML = '';",
  "  $('tajukPemenang').classList.add('tersembunyi'); $('tajukSimpanan').classList.add('tersembunyi');",
  "  giliran = semasa.pemenang.map(function (p) { return { p: p, simpanan: false }; })",
  "    .concat(semasa.simpanan.map(function (p) { return { p: p, simpanan: true }; }));",
  "  didedah = 0;",
  "  $('gulung').textContent = '— — —';",
  "  $('dedah').disabled = false; $('dedahSemua').disabled = false;",
  "  $('dedah').classList.remove('tersembunyi'); $('dedahSemua').classList.remove('tersembunyi'); $('gulung').classList.remove('tersembunyi');",
  "}",
  "",
  "function kad(item) {",
  "  var d = document.createElement('div');",
  "  d.className = 'pemenang' + (item.simpanan ? ' simpanan' : '');",
  "  var no = document.createElement('div'); no.className = 'no';",
  "  no.textContent = (item.simpanan ? 'Simpanan ' : (semasa.kaedah === 'TERPANTAS' ? 'Kedudukan ' : 'Pemenang ')) + '#' + item.p.kedudukan;",
  "  var idp = document.createElement('div'); idp.className = 'idp'; idp.textContent = item.p.id;",
  "  var nm = document.createElement('div'); nm.className = 'nm'; nm.textContent = item.p.nama;",
  "  d.appendChild(no); d.appendChild(idp); d.appendChild(nm);",
  "  (item.simpanan ? $('senaraiSimpanan') : $('senaraiPemenang')).appendChild(d);",
  "  $(item.simpanan ? 'tajukSimpanan' : 'tajukPemenang').classList.remove('tersembunyi');",
  "}",
  "",
  "function dedah(segera) {",
  "  if (sedangGulung || didedah >= giliran.length) return;",
  "  var item = giliran[didedah++];",
  "  if (didedah >= giliran.length) { $('dedah').disabled = true; $('dedahSemua').disabled = true; }",
  "  if (segera || semasa.kaedah === 'TERPANTAS') { $('gulung').textContent = item.p.id; kad(item); return; }",
  "  sedangGulung = true;",
  "  var awalan = item.p.id.split('-')[0];",
  "  var mula = Date.now();",
  "  function rawak(n, aksara) { var s = ''; while (s.length < n) s += aksara.charAt(Math.floor(Math.random() * aksara.length)); return s; }",
  "  (function langkah() {",
  "    var t = Date.now() - mula;",
  "    if (t < 3000) {",
  "      // ID rawak semata-mata untuk kesan visual — keputusan sebenar telah ditetapkan & direkod oleh pelayan",
  "      $('gulung').textContent = awalan + '-' + rawak(5, '0123456789') + '-' + rawak(4, 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789');",
  "      setTimeout(langkah, 40 + t / 30);",
  "    } else {",
  "      $('gulung').textContent = item.p.id;",
  "      kad(item);",
  "      sedangGulung = false;",
  "    }",
  "  })();",
  "}",
  "$('dedah').onclick = function () { dedah(false); };",
  "$('dedahSemua').onclick = function () { while (didedah < giliran.length) dedah(true); };",
  "document.addEventListener('keydown', function (e) { if (e.code === 'Space' || e.code === 'ArrowRight') { e.preventDefault(); dedah(false); } });",
  "</script>",
  "</body>",
  "</html>",
  ""
].join('\n');
HTML_.Privasi = [
  "<!DOCTYPE html>",
  "<html lang=\"ms\">",
  "<head>",
  "<base target=\"_top\">",
  "<meta charset=\"utf-8\">",
  "<style>/*__GAYA__*/ .kad h2 { font-size: 1.15rem; color: var(--hijau); margin-top: 1.2em; } .kad li { margin-bottom: 6px; }</style>",
  "</head>",
  "<body>",
  "<header class=\"kepala\">",
  "  <!--__LOGO__-->",
  "  <h1>Notis Privasi &amp; Syarat Kempen</h1>",
  "  <p id=\"namaKempen\"></p>",
  "</header>",
  "<main class=\"bekas\">",
  "  <div class=\"kotak-amaran\" style=\"margin-bottom:16px;font-size:.9rem\"><strong>DRAF</strong> — Kandungan ini perlu disemak dan diluluskan oleh pihak pengurusan / penasihat undang-undang YAPEIM sebelum kempen dilancarkan.</div>",
  "  <article class=\"kad\">",
  "    <h2 style=\"margin-top:0\">A. Notis Privasi (Akta Perlindungan Data Peribadi 2010)</h2>",
  "    <ol>",
  "      <li><strong>Data yang dikumpul:</strong> nama penuh, nombor telefon, jumlah, tarikh dan kaedah sumbangan, nombor rujukan transaksi (jika diberi) serta salinan resit sumbangan.</li>",
  "      <li><strong>Tujuan:</strong> mengesahkan sumbangan, menentukan kelayakan dan pemenang kempen, menghubungi pemenang, serta rekod dan laporan dalaman YAPEIM Sarawak.</li>",
  "      <li><strong>Pendedahan:</strong> data anda tidak akan dijual atau didedahkan kepada pihak ketiga. Hanya pegawai YAPEIM yang diberi kuasa boleh melihat data dan resit. Semasa pengumuman pemenang, hanya ID penyertaan dan nama yang ditopeng sebahagiannya dipaparkan.</li>",
  "      <li><strong>Penyimpanan:</strong> data disimpan dalam akaun Google rasmi organisasi yang dilindungi, dan akan disimpan selama <span id=\"tempoh\"></span>, kemudian dipadam atau diarkibkan mengikut dasar organisasi.</li>",
  "      <li><strong>Hak anda:</strong> anda boleh meminta akses, pembetulan atau penarikan balik data anda. Penarikan balik sebelum cabutan akan menyebabkan penyertaan tidak lagi layak.</li>",
  "      <li><strong>Pertanyaan berkaitan data:</strong> <span id=\"hubungi\"></span></li>",
  "    </ol>",
  "",
  "    <h2>B. Syarat Kempen</h2>",
  "    <ol>",
  "      <li>Kempen terbuka kepada orang awam yang membuat sumbangan infaq kepada YAPEIM Sarawak dalam tempoh kempen: <strong id=\"tempohKempen\"></strong>.</li>",
  "      <li id=\"syaratMin\"></li>",
  "      <li>Setiap penyertaan mesti disertakan resit sumbangan yang sah. Semua resit akan disemak oleh pegawai YAPEIM. Penyertaan hanya layak selepas resit disahkan (status LULUS).</li>",
  "      <li>Penyertaan dengan maklumat palsu, resit yang diubah, resit berulang atau tidak dapat disahkan akan ditolak.</li>",
  "      <li id=\"syaratSatu\"></li>",
  "      <li><strong>Peserta terpantas:</strong> kedudukan ditentukan oleh cap masa pelayan sistem semasa borang diterima (bukan tarikh yang diisi oleh peserta). Jika dua penyertaan mempunyai cap masa yang sama sehingga milisaat, penyertaan yang diproses dahulu oleh sistem (nombor turutan lebih kecil) diberi kedudukan lebih awal. Hanya penyertaan yang disahkan layak diambil kira.</li>",
  "      <li><strong>Cabutan bertuah:</strong> dibuat secara rawak oleh sistem selepas tempoh kempen tamat dan semua resit telah disemak, daripada senarai penyertaan yang layak sahaja. Setiap cabutan direkodkan bersama senarai peserta layak, nilai benih rawak dan pemenang supaya ia boleh diaudit.</li>",
  "      <li>Pemenang simpanan akan dipilih sekiranya pemenang utama tidak dapat dihubungi atau tidak layak.</li>",
  "      <li>Pemenang akan dihubungi melalui nombor telefon yang didaftarkan. YAPEIM tidak akan meminta sebarang bayaran untuk menuntut hadiah.</li>",
  "      <li>Keputusan YAPEIM Sarawak adalah muktamad. YAPEIM berhak meminda syarat dengan notis.</li>",
  "    </ol>",
  "  </article>",
  "  <p style=\"text-align:center\"><a id=\"kembali\" href=\"#\" class=\"butang butang-garis\">← Kembali ke borang</a></p>",
  "</main>",
  "<script>",
  "var DATA = /*__DATA__*/null;",
  "(function () {",
  "  var t = DATA.tetapan;",
  "  function teksMasa(s) {",
  "    var b = ['Jan','Feb','Mac','Apr','Mei','Jun','Jul','Ogo','Sep','Okt','Nov','Dis'];",
  "    var m = /^(\\d{4})-(\\d{2})-(\\d{2})(?:T(\\d{2}):(\\d{2}))?/.exec(s || '');",
  "    return m ? (+m[3]) + ' ' + b[+m[2] - 1] + ' ' + m[1] + (m[4] ? ', ' + m[4] + ':' + m[5] : '') : 'akan diumumkan';",
  "  }",
  "  document.getElementById('namaKempen').textContent = t.namaKempen;",
  "  document.getElementById('tempoh').textContent = t.tempohSimpanData || 'tempoh yang diluluskan organisasi';",
  "  var h = [];",
  "  if (t.emelPertanyaan) h.push('emel ' + t.emelPertanyaan);",
  "  if (t.telefonPertanyaan) h.push('telefon ' + t.telefonPertanyaan);",
  "  document.getElementById('hubungi').textContent = h.length ? 'Hubungi YAPEIM Sarawak melalui ' + h.join(' atau ') + '.' : 'Hubungi pejabat YAPEIM Sarawak.';",
  "  document.getElementById('tempohKempen').textContent = teksMasa(t.tarikhMula) + ' hingga ' + teksMasa(t.tarikhTamat) + ' (waktu Malaysia)';",
  "  document.getElementById('syaratMin').textContent = 'Sumbangan minimum bagi setiap penyertaan ialah RM ' + Number(t.minSumbangan || 0).toFixed(2) + '.';",
  "  document.getElementById('syaratSatu').textContent = t.satuPeluangSetiapTelefon",
  "    ? 'Setiap nombor telefon hanya dikira SEKALI dalam senarai peserta terpantas dan cabutan bertuah (penyertaan layak yang terawal digunakan).'",
  "    : 'Setiap penyertaan yang layak dikira sebagai satu peluang.';",
  "  document.getElementById('kembali').href = DATA.url;",
  "})();",
  "</script>",
  "</body>",
  "</html>",
  ""
].join('\n');

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
  var html = HTML_[halaman]
    .replace('/*__GAYA__*/', function () { return GAYA_; })
    .replace('<!--__LOGO__-->', function () { return LOGO_; })
    .replace('/*__DATA__*/null', function () { return json; });
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
    r.versi = typeof VERSI_ !== 'undefined' ? VERSI_ : '?';
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
