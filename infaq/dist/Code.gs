/**
 * SISTEM INFAQ DAN MENANG GOLDBAR YAPEIM SARAWAK
 * Versi 1.0.0 — fail ini DIJANA oleh scripts/build.js. Jangan sunting terus;
 * sunting fail dalam folder src/ dan jalankan "npm run build".
 * Salin KESELURUHAN fail ini ke Code.gs dalam editor Apps Script.
 */

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
  if (!t.sah) return { layak: false, sebab: 'Tempoh kempen belum ditetapkan' };
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
var HTML_ = {"Borang":"<!DOCTYPE html>\n<html lang=\"ms\">\n<head>\n<base target=\"_top\">\n<meta charset=\"utf-8\">\n<style>:root {\n  --hijau: #0b5d3b; --hijau-gelap: #073d27; --hijau-muda: #e7f3ec;\n  --emas: #c9a227; --emas-muda: #fbf3d9;\n  --teks: #1d2a24; --teks-lembut: #55645c; --garis: #d6ded9; --latar: #f4f6f3; --kad: #ffffff;\n  --merah: #b42318; --merah-muda: #fdecea; --oren: #b54708; --oren-muda: #fef0c7; --biru: #175cd3; --biru-muda: #e8f0fe;\n  --jejari: 12px;\n}\n* { box-sizing: border-box; }\nhtml, body { margin: 0; padding: 0; }\nbody { font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif;\n  font-size: 17px; line-height: 1.5; color: var(--teks); background: var(--latar); -webkit-text-size-adjust: 100%; }\na { color: var(--hijau); }\nh1, h2, h3 { line-height: 1.25; margin: 0 0 .5em; }\n.bekas { max-width: 640px; margin: 0 auto; padding: 16px; }\n.kad { background: var(--kad); border-radius: var(--jejari); box-shadow: 0 1px 3px rgba(0,0,0,.08); padding: 20px; margin-bottom: 16px; }\n.kepala { background: linear-gradient(135deg, var(--hijau-gelap), var(--hijau)); color: #fff; padding: 20px 16px 28px; text-align: center; }\n.kepala h1 { font-size: 1.45rem; margin: 10px 0 4px; letter-spacing: .3px; }\n.kepala p { margin: 0; opacity: .92; font-size: .95rem; }\n.kepala .emas { color: var(--emas); }\n.logo-ruang { display: inline-flex; align-items: center; justify-content: center; min-width: 120px; height: 56px; padding: 0 12px;\n  border: 2px dashed rgba(255,255,255,.6); border-radius: 8px; font-size: .75rem; font-weight: 600; letter-spacing: .5px; }\n.logo-ruang img { max-height: 56px; max-width: 200px; }\n.logo-sebenar { border: none; }\nlabel.tajuk { display: block; font-weight: 600; margin: 16px 0 6px; }\nlabel.tajuk .wajib { color: var(--merah); }\n.bantuan { font-size: .85rem; color: var(--teks-lembut); margin-top: 4px; }\ninput[type=text], input[type=tel], input[type=number], input[type=date], input[type=password], input[type=datetime-local], select, textarea {\n  width: 100%; font-size: 17px; padding: 12px 14px; border: 1.5px solid var(--garis); border-radius: 10px; background: #fff; color: var(--teks);\n  font-family: inherit; appearance: none; -webkit-appearance: none; min-height: 48px; }\nselect { background-image: linear-gradient(45deg, transparent 50%, var(--teks-lembut) 50%), linear-gradient(135deg, var(--teks-lembut) 50%, transparent 50%);\n  background-position: calc(100% - 20px) 50%, calc(100% - 14px) 50%; background-size: 6px 6px; background-repeat: no-repeat; padding-right: 36px; }\ninput:focus, select:focus, textarea:focus { outline: 3px solid rgba(11,93,59,.25); border-color: var(--hijau); }\n.salah input, .salah select, .salah .pilih-fail { border-color: var(--merah); }\n.mesej-salah { color: var(--merah); font-size: .88rem; margin-top: 4px; display: none; }\n.salah .mesej-salah { display: block; }\n.awalan { position: relative; }\n.awalan span { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--teks-lembut); font-weight: 600; }\n.awalan input { padding-left: 48px; }\n.pilih-fail { display: block; border: 2px dashed var(--garis); border-radius: 10px; padding: 18px; text-align: center; cursor: pointer; background: #fafcfb; }\n.pilih-fail input { position: absolute; width: 1px; height: 1px; opacity: 0; }\n.pilih-fail strong { color: var(--hijau); }\n.pratonton { margin-top: 10px; font-size: .9rem; display: none; align-items: center; gap: 10px; }\n.pratonton img { max-width: 80px; max-height: 80px; border-radius: 6px; border: 1px solid var(--garis); }\n.semak { display: flex; gap: 12px; align-items: flex-start; margin: 14px 0 0; font-size: .95rem; cursor: pointer; }\n.semak input { width: 24px; height: 24px; flex: 0 0 24px; margin-top: 1px; accent-color: var(--hijau); }\n.butang { display: inline-flex; align-items: center; justify-content: center; gap: 8px; border: none; border-radius: 10px; padding: 12px 18px;\n  font-size: 16px; font-weight: 600; cursor: pointer; min-height: 48px; text-decoration: none; font-family: inherit; }\n.butang-utama { background: var(--hijau); color: #fff; width: 100%; font-size: 18px; min-height: 56px; margin-top: 22px; }\n.butang-utama:disabled { opacity: .6; cursor: wait; }\n.butang-hijau { background: var(--hijau); color: #fff; } .butang-merah { background: var(--merah); color: #fff; }\n.butang-oren { background: var(--oren); color: #fff; } .butang-garis { background: #fff; color: var(--hijau); border: 1.5px solid var(--hijau); }\n.butang-emas { background: var(--emas); color: #1d1600; }\n.butang-kecil { min-height: 36px; padding: 6px 12px; font-size: 14px; }\n.kotak-info { background: var(--emas-muda); border-left: 4px solid var(--emas); padding: 12px 14px; border-radius: 8px; font-size: .92rem; }\n.kotak-amaran { background: var(--merah-muda); border-left: 4px solid var(--merah); padding: 12px 14px; border-radius: 8px; }\n.kotak-ujian { background: var(--biru-muda); border: 2px solid var(--biru); color: var(--biru); padding: 10px 14px; border-radius: 8px; font-weight: 600; text-align: center; }\n.berjaya { text-align: center; }\n.berjaya .ikon { width: 72px; height: 72px; border-radius: 50%; background: var(--hijau-muda); color: var(--hijau); font-size: 40px; line-height: 72px; margin: 0 auto 12px; }\n.id-besar { font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 1.5rem; font-weight: 700; background: var(--emas-muda);\n  border: 2px solid var(--emas); padding: 10px 14px; border-radius: 10px; display: inline-block; margin: 8px 0; letter-spacing: 1px; word-break: break-all; }\n.kaki { text-align: center; font-size: .82rem; color: var(--teks-lembut); padding: 8px 16px 32px; }\n.lencana { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: .78rem; font-weight: 700; white-space: nowrap; }\n.l-menunggu { background: var(--oren-muda); color: var(--oren); } .l-semakan { background: #fde2e1; color: #912018; }\n.l-lulus { background: var(--hijau-muda); color: var(--hijau); } .l-ditolak { background: #eaecf0; color: #344054; }\n.l-pembetulan { background: var(--biru-muda); color: var(--biru); } .l-ujian { background: var(--biru); color: #fff; }\n.tersembunyi { display: none !important; }\n.pemutar { width: 20px; height: 20px; border: 3px solid rgba(255,255,255,.4); border-top-color: #fff; border-radius: 50%; animation: putar 0.8s linear infinite; }\n@keyframes putar { to { transform: rotate(360deg); } }\n.kemajuan { height: 6px; background: var(--garis); border-radius: 3px; overflow: hidden; margin-top: 12px; }\n.kemajuan div { height: 100%; width: 30%; background: var(--hijau); animation: gerak 1.2s ease-in-out infinite; }\n@keyframes gerak { 0% { margin-left: -30%; } 100% { margin-left: 100%; } }\n@media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }\n</style>\n</head>\n<body>\n<header class=\"kepala\">\n  <div class=\"logo-ruang\">LOGO RASMI YAPEIM</div>\n  <h1>INFAQ DAN MENANG <span class=\"emas\">GOLDBAR</span></h1>\n  <p>YAPEIM Sarawak</p>\n</header>\n\n<main class=\"bekas\" style=\"margin-top:-16px\">\n  <div id=\"kotakUjian\" class=\"kotak-ujian tersembunyi\" style=\"margin-bottom:12px\">MOD UJIAN — penyertaan ini tidak dikira untuk kempen sebenar</div>\n\n  <section id=\"tutup\" class=\"kad tersembunyi\">\n    <h2 id=\"tutupTajuk\">Kempen belum dibuka</h2>\n    <p id=\"tutupTeks\"></p>\n  </section>\n\n  <form id=\"borang\" class=\"kad tersembunyi\" novalidate autocomplete=\"on\">\n    <div class=\"kotak-info\" id=\"info\">Isi borang ini selepas anda membuat sumbangan. Sediakan gambar atau PDF resit sumbangan anda.</div>\n\n    <div class=\"medan\" data-medan=\"nama\">\n      <label class=\"tajuk\" for=\"nama\">Nama penuh <span class=\"wajib\">*</span></label>\n      <input type=\"text\" id=\"nama\" name=\"nama\" autocomplete=\"name\" maxlength=\"100\" required>\n      <div class=\"mesej-salah\"></div>\n    </div>\n\n    <div class=\"medan\" data-medan=\"telefon\">\n      <label class=\"tajuk\" for=\"telefon\">Nombor telefon <span class=\"wajib\">*</span></label>\n      <input type=\"tel\" id=\"telefon\" name=\"telefon\" autocomplete=\"tel\" inputmode=\"tel\" placeholder=\"cth: 012-3456789\" maxlength=\"16\" required>\n      <div class=\"bantuan\">Kami akan menghubungi nombor ini jika anda menang.</div>\n      <div class=\"mesej-salah\"></div>\n    </div>\n\n    <div class=\"medan\" data-medan=\"jumlah\">\n      <label class=\"tajuk\" for=\"jumlah\">Jumlah sumbangan <span class=\"wajib\">*</span></label>\n      <div class=\"awalan\"><span>RM</span><input type=\"text\" id=\"jumlah\" name=\"jumlah\" inputmode=\"decimal\" placeholder=\"0.00\" maxlength=\"12\" required></div>\n      <div class=\"mesej-salah\"></div>\n    </div>\n\n    <div class=\"medan\" data-medan=\"tarikh\">\n      <label class=\"tajuk\" for=\"tarikh\">Tarikh sumbangan <span class=\"wajib\">*</span></label>\n      <input type=\"date\" id=\"tarikh\" name=\"tarikh\" required>\n      <div class=\"mesej-salah\"></div>\n    </div>\n\n    <div class=\"medan\" data-medan=\"saluran\">\n      <label class=\"tajuk\" for=\"saluran\">Kaedah sumbangan <span class=\"wajib\">*</span></label>\n      <select id=\"saluran\" name=\"saluran\" required><option value=\"\">— Pilih —</option></select>\n      <div class=\"mesej-salah\"></div>\n    </div>\n\n    <div class=\"medan\" data-medan=\"rujukan\">\n      <label class=\"tajuk\" for=\"rujukan\">No. rujukan transaksi <span style=\"font-weight:400;color:var(--teks-lembut)\">(jika ada)</span></label>\n      <input type=\"text\" id=\"rujukan\" name=\"rujukan\" maxlength=\"40\" autocapitalize=\"characters\">\n      <div class=\"mesej-salah\"></div>\n    </div>\n\n    <div class=\"medan\" data-medan=\"fail\">\n      <label class=\"tajuk\">Resit sumbangan <span class=\"wajib\">*</span></label>\n      <label class=\"pilih-fail\" for=\"fail\">\n        <input type=\"file\" id=\"fail\" accept=\"image/jpeg,image/png,application/pdf\">\n        <span id=\"failTeks\"><strong>Tekan untuk pilih gambar atau PDF</strong><br><span class=\"bantuan\">JPG, PNG atau PDF · maksimum 5 MB</span></span>\n      </label>\n      <div class=\"pratonton\" id=\"pratonton\"></div>\n      <div class=\"mesej-salah\"></div>\n    </div>\n\n    <div style=\"position:absolute;left:-9999px\" aria-hidden=\"true\">\n      <label>Laman web <input type=\"text\" id=\"laman\" tabindex=\"-1\" autocomplete=\"off\"></label>\n    </div>\n\n    <div class=\"medan\" data-medan=\"pengesahan\">\n      <label class=\"semak\"><input type=\"checkbox\" id=\"pengesahan\"> <span>Saya mengesahkan bahawa maklumat dan resit yang diberikan adalah benar.</span></label>\n      <div class=\"mesej-salah\"></div>\n    </div>\n    <div class=\"medan\" data-medan=\"persetujuan\">\n      <label class=\"semak\"><input type=\"checkbox\" id=\"persetujuan\"> <span>Saya telah membaca dan bersetuju dengan <a id=\"pautanPrivasi\" href=\"#\" target=\"_blank\" rel=\"noopener\">Notis Privasi &amp; Syarat Kempen</a>.</span></label>\n      <div class=\"mesej-salah\"></div>\n    </div>\n\n    <div id=\"ralatUmum\" class=\"kotak-amaran tersembunyi\" style=\"margin-top:16px\" role=\"alert\"></div>\n    <button type=\"submit\" class=\"butang butang-utama\" id=\"hantar\">Hantar Penyertaan</button>\n    <div id=\"sedangHantar\" class=\"tersembunyi\" style=\"text-align:center;margin-top:10px\">\n      <div class=\"bantuan\">Sedang memuat naik resit… Jangan tutup halaman ini.</div>\n      <div class=\"kemajuan\"><div></div></div>\n    </div>\n  </form>\n\n  <section id=\"berjaya\" class=\"kad berjaya tersembunyi\" aria-live=\"polite\">\n    <div class=\"ikon\">✓</div>\n    <h2>Terima kasih!</h2>\n    <p>Penyertaan anda telah diterima.</p>\n    <div>ID Penyertaan anda:</div>\n    <div class=\"id-besar\" id=\"idPenyertaan\"></div>\n    <p class=\"bantuan\" id=\"masaDiterima\"></p>\n    <div class=\"kotak-info\" style=\"text-align:left\">\n      <strong>Status: MENUNGGU PENGESAHAN</strong><br>\n      Resit anda akan disemak oleh pegawai YAPEIM. Sila <strong>tangkap layar (screenshot)</strong> halaman ini dan simpan ID penyertaan anda sebagai rujukan.\n    </div>\n    <p id=\"mesejPendua\" class=\"bantuan tersembunyi\">Penyertaan dengan resit yang sama telah diterima sebelum ini — ini ialah ID asal anda.</p>\n    <button class=\"butang butang-garis\" style=\"margin-top:16px\" onclick=\"location.reload()\">Hantar penyertaan lain</button>\n  </section>\n</main>\n<footer class=\"kaki\">\n  <span id=\"kakiKempen\"></span><br>\n  <a id=\"pautanPrivasi2\" href=\"#\" target=\"_blank\" rel=\"noopener\">Notis Privasi &amp; Syarat Kempen</a>\n</footer>\n\n<script>\nvar DATA = /*__DATA__*/null;\nvar failDipilih = null;\n\nfunction $(id) { return document.getElementById(id); }\nfunction teksMasa(s) {\n  if (!s) return '';\n  var b = ['Jan','Feb','Mac','Apr','Mei','Jun','Jul','Ogo','Sep','Okt','Nov','Dis'];\n  var m = /^(\\d{4})-(\\d{2})-(\\d{2})(?:T(\\d{2}):(\\d{2}))?/.exec(s);\n  return m ? (+m[3]) + ' ' + b[+m[2] - 1] + ' ' + m[1] + (m[4] ? ', ' + m[4] + ':' + m[5] : '') : s;\n}\n\n(function mula() {\n  var t = DATA.tetapan;\n  var urlPrivasi = DATA.url + '?p=privasi';\n  $('pautanPrivasi').href = urlPrivasi; $('pautanPrivasi2').href = urlPrivasi;\n  $('kakiKempen').textContent = t.tarikhMula && t.tarikhTamat ? 'Tempoh kempen: ' + teksMasa(t.tarikhMula) + ' hingga ' + teksMasa(t.tarikhTamat) : '';\n  t.saluran.forEach(function (s) { var o = document.createElement('option'); o.value = s; o.textContent = s; $('saluran').appendChild(o); });\n  $('tarikh').max = DATA.hariIni;\n  if (Number(t.minSumbangan) > 0) $('info').innerHTML += '<br>Sumbangan minimum: <strong>RM ' + Number(t.minSumbangan).toFixed(2) + '</strong>.';\n\n  if (DATA.ujian) { $('kotakUjian').classList.remove('tersembunyi'); $('borang').classList.remove('tersembunyi'); return; }\n  if (DATA.statusKempen === 'DIBUKA') { $('borang').classList.remove('tersembunyi'); return; }\n  $('tutup').classList.remove('tersembunyi');\n  if (DATA.statusKempen === 'TAMAT') {\n    $('tutupTajuk').textContent = 'Kempen telah tamat';\n    $('tutupTeks').textContent = 'Terima kasih atas sokongan anda. Penyertaan tidak lagi diterima. Keputusan akan diumumkan oleh YAPEIM Sarawak.';\n  } else {\n    $('tutupTeks').textContent = t.tarikhMula ? 'Kempen akan dibuka pada ' + teksMasa(t.tarikhMula) + '.' : 'Tarikh kempen akan diumumkan.';\n  }\n})();\n\nfunction tandaSalah(medan, mesej) {\n  var el = document.querySelector('[data-medan=\"' + medan + '\"]');\n  if (!el) return;\n  el.classList.toggle('salah', !!mesej);\n  el.querySelector('.mesej-salah').textContent = mesej || '';\n}\n\nfunction semakTempatan() {\n  var r = {};\n  var nama = $('nama').value.trim();\n  if (nama.length < 3) r.nama = 'Sila masukkan nama penuh.';\n  var tel = $('telefon').value.replace(/[\\s\\-().]/g, '').replace(/^\\+?60/, '0');\n  if (!/^0(1\\d{8,9}|[3-9]\\d{7,8})$/.test(tel)) r.telefon = 'Nombor telefon tidak sah. Contoh: 012-3456789';\n  var j = $('jumlah').value.replace(/[,\\s]/g, '');\n  if (!/^\\d{1,7}(\\.\\d{1,2})?$/.test(j) || +j <= 0) r.jumlah = 'Masukkan jumlah dalam RM, contoh: 50 atau 50.00';\n  else if (+j < Number(DATA.tetapan.minSumbangan || 0)) r.jumlah = 'Jumlah minimum ialah RM ' + Number(DATA.tetapan.minSumbangan).toFixed(2);\n  if (!$('tarikh').value) r.tarikh = 'Sila pilih tarikh sumbangan.';\n  else if ($('tarikh').value > DATA.hariIni) r.tarikh = 'Tarikh sumbangan tidak boleh pada masa hadapan.';\n  if (!$('saluran').value) r.saluran = 'Sila pilih kaedah sumbangan.';\n  if (!failDipilih) r.fail = 'Sila muat naik resit sumbangan.';\n  if (!$('pengesahan').checked) r.pengesahan = 'Sila sahkan bahawa maklumat adalah benar.';\n  if (!$('persetujuan').checked) r.persetujuan = 'Sila bersetuju dengan notis privasi dan syarat kempen.';\n  return r;\n}\n\nfunction paparRalat(r) {\n  ['nama','telefon','jumlah','tarikh','saluran','rujukan','fail','pengesahan','persetujuan'].forEach(function (m) { tandaSalah(m, r[m]); });\n  var pertama = document.querySelector('.salah');\n  if (pertama) pertama.scrollIntoView({ behavior: 'smooth', block: 'center' });\n}\n\nfunction bacaDataUrl(blob) {\n  return new Promise(function (ok, gagal) {\n    var fr = new FileReader();\n    fr.onload = function () { ok(fr.result); };\n    fr.onerror = gagal;\n    fr.readAsDataURL(blob);\n  });\n}\n\n/** Kecilkan gambar besar supaya muat naik pantas di talian mudah alih. */\nfunction kecilkanGambar(fail) {\n  return new Promise(function (ok) {\n    if (fail.type === 'application/pdf' || fail.size < 1.2 * 1024 * 1024) return ok(fail);\n    var img = new Image();\n    var url = URL.createObjectURL(fail);\n    img.onload = function () {\n      var maks = 2000, w = img.naturalWidth, h = img.naturalHeight;\n      var s = Math.min(1, maks / Math.max(w, h));\n      var c = document.createElement('canvas');\n      c.width = Math.round(w * s); c.height = Math.round(h * s);\n      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);\n      URL.revokeObjectURL(url);\n      c.toBlob(function (b) { ok(b && b.size < fail.size ? b : fail); }, 'image/jpeg', 0.85);\n    };\n    img.onerror = function () { URL.revokeObjectURL(url); ok(fail); };\n    img.src = url;\n  });\n}\n\n$('fail').addEventListener('change', function () {\n  var f = this.files[0];\n  failDipilih = null;\n  var p = $('pratonton');\n  p.style.display = 'none'; p.innerHTML = '';\n  if (!f) return;\n  if (['image/jpeg', 'image/png', 'application/pdf'].indexOf(f.type) === -1) { tandaSalah('fail', 'Hanya fail JPG, PNG atau PDF diterima.'); return; }\n  if (f.type === 'application/pdf' && f.size > 5 * 1024 * 1024) { tandaSalah('fail', 'Saiz fail melebihi 5 MB.'); return; }\n  kecilkanGambar(f).then(function (b) {\n    if (b.size > 5 * 1024 * 1024) { tandaSalah('fail', 'Saiz fail melebihi 5 MB.'); return; }\n    failDipilih = b;\n    tandaSalah('fail', '');\n    var nama = document.createElement('span');\n    nama.textContent = '✓ ' + f.name + ' (' + (b.size / 1024 / 1024).toFixed(2) + ' MB)';\n    if (b.type !== 'application/pdf') { var im = document.createElement('img'); im.src = URL.createObjectURL(b); p.appendChild(im); }\n    p.appendChild(nama);\n    p.style.display = 'flex';\n    $('failTeks').innerHTML = '<strong>Tukar fail</strong>';\n  });\n});\n\n$('borang').addEventListener('submit', function (ev) {\n  ev.preventDefault();\n  $('ralatUmum').classList.add('tersembunyi');\n  var r = semakTempatan();\n  paparRalat(r);\n  if (Object.keys(r).length) return;\n  $('hantar').disabled = true;\n  $('hantar').innerHTML = '<span class=\"pemutar\"></span> Sedang menghantar…';\n  $('sedangHantar').classList.remove('tersembunyi');\n  bacaDataUrl(failDipilih).then(function (dataUrl) {\n    var payload = {\n      nama: $('nama').value, telefon: $('telefon').value, jumlah: $('jumlah').value, tarikh: $('tarikh').value,\n      saluran: $('saluran').value, rujukan: $('rujukan').value, pengesahan: $('pengesahan').checked,\n      persetujuan: $('persetujuan').checked, laman: $('laman').value, token: DATA.token, ujian: !!DATA.ujian,\n      fail: { data: dataUrl.split(',')[1] }\n    };\n    google.script.run.withSuccessHandler(selesai).withFailureHandler(function () {\n      selesai({ ok: false, mesej: 'Sambungan terputus. Semak internet anda dan cuba lagi.' });\n    }).hantarPenyertaan(payload);\n  });\n});\n\nfunction selesai(res) {\n  $('hantar').disabled = false;\n  $('hantar').textContent = 'Hantar Penyertaan';\n  $('sedangHantar').classList.add('tersembunyi');\n  if (res && res.ok) {\n    $('borang').classList.add('tersembunyi');\n    $('idPenyertaan').textContent = res.id;\n    $('masaDiterima').textContent = 'Diterima pada ' + res.masa + ' (waktu Malaysia)';\n    if (res.pendua) $('mesejPendua').classList.remove('tersembunyi');\n    $('berjaya').classList.remove('tersembunyi');\n    window.scrollTo(0, 0);\n    return;\n  }\n  paparRalat((res && res.ralat) || {});\n  $('ralatUmum').textContent = (res && res.mesej) || 'Penghantaran gagal. Sila cuba lagi.';\n  $('ralatUmum').classList.remove('tersembunyi');\n}\n</script>\n</body>\n</html>\n","Dashboard":"<!DOCTYPE html>\n<html lang=\"ms\">\n<head>\n<base target=\"_top\">\n<meta charset=\"utf-8\">\n<style>:root {\n  --hijau: #0b5d3b; --hijau-gelap: #073d27; --hijau-muda: #e7f3ec;\n  --emas: #c9a227; --emas-muda: #fbf3d9;\n  --teks: #1d2a24; --teks-lembut: #55645c; --garis: #d6ded9; --latar: #f4f6f3; --kad: #ffffff;\n  --merah: #b42318; --merah-muda: #fdecea; --oren: #b54708; --oren-muda: #fef0c7; --biru: #175cd3; --biru-muda: #e8f0fe;\n  --jejari: 12px;\n}\n* { box-sizing: border-box; }\nhtml, body { margin: 0; padding: 0; }\nbody { font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif;\n  font-size: 17px; line-height: 1.5; color: var(--teks); background: var(--latar); -webkit-text-size-adjust: 100%; }\na { color: var(--hijau); }\nh1, h2, h3 { line-height: 1.25; margin: 0 0 .5em; }\n.bekas { max-width: 640px; margin: 0 auto; padding: 16px; }\n.kad { background: var(--kad); border-radius: var(--jejari); box-shadow: 0 1px 3px rgba(0,0,0,.08); padding: 20px; margin-bottom: 16px; }\n.kepala { background: linear-gradient(135deg, var(--hijau-gelap), var(--hijau)); color: #fff; padding: 20px 16px 28px; text-align: center; }\n.kepala h1 { font-size: 1.45rem; margin: 10px 0 4px; letter-spacing: .3px; }\n.kepala p { margin: 0; opacity: .92; font-size: .95rem; }\n.kepala .emas { color: var(--emas); }\n.logo-ruang { display: inline-flex; align-items: center; justify-content: center; min-width: 120px; height: 56px; padding: 0 12px;\n  border: 2px dashed rgba(255,255,255,.6); border-radius: 8px; font-size: .75rem; font-weight: 600; letter-spacing: .5px; }\n.logo-ruang img { max-height: 56px; max-width: 200px; }\n.logo-sebenar { border: none; }\nlabel.tajuk { display: block; font-weight: 600; margin: 16px 0 6px; }\nlabel.tajuk .wajib { color: var(--merah); }\n.bantuan { font-size: .85rem; color: var(--teks-lembut); margin-top: 4px; }\ninput[type=text], input[type=tel], input[type=number], input[type=date], input[type=password], input[type=datetime-local], select, textarea {\n  width: 100%; font-size: 17px; padding: 12px 14px; border: 1.5px solid var(--garis); border-radius: 10px; background: #fff; color: var(--teks);\n  font-family: inherit; appearance: none; -webkit-appearance: none; min-height: 48px; }\nselect { background-image: linear-gradient(45deg, transparent 50%, var(--teks-lembut) 50%), linear-gradient(135deg, var(--teks-lembut) 50%, transparent 50%);\n  background-position: calc(100% - 20px) 50%, calc(100% - 14px) 50%; background-size: 6px 6px; background-repeat: no-repeat; padding-right: 36px; }\ninput:focus, select:focus, textarea:focus { outline: 3px solid rgba(11,93,59,.25); border-color: var(--hijau); }\n.salah input, .salah select, .salah .pilih-fail { border-color: var(--merah); }\n.mesej-salah { color: var(--merah); font-size: .88rem; margin-top: 4px; display: none; }\n.salah .mesej-salah { display: block; }\n.awalan { position: relative; }\n.awalan span { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--teks-lembut); font-weight: 600; }\n.awalan input { padding-left: 48px; }\n.pilih-fail { display: block; border: 2px dashed var(--garis); border-radius: 10px; padding: 18px; text-align: center; cursor: pointer; background: #fafcfb; }\n.pilih-fail input { position: absolute; width: 1px; height: 1px; opacity: 0; }\n.pilih-fail strong { color: var(--hijau); }\n.pratonton { margin-top: 10px; font-size: .9rem; display: none; align-items: center; gap: 10px; }\n.pratonton img { max-width: 80px; max-height: 80px; border-radius: 6px; border: 1px solid var(--garis); }\n.semak { display: flex; gap: 12px; align-items: flex-start; margin: 14px 0 0; font-size: .95rem; cursor: pointer; }\n.semak input { width: 24px; height: 24px; flex: 0 0 24px; margin-top: 1px; accent-color: var(--hijau); }\n.butang { display: inline-flex; align-items: center; justify-content: center; gap: 8px; border: none; border-radius: 10px; padding: 12px 18px;\n  font-size: 16px; font-weight: 600; cursor: pointer; min-height: 48px; text-decoration: none; font-family: inherit; }\n.butang-utama { background: var(--hijau); color: #fff; width: 100%; font-size: 18px; min-height: 56px; margin-top: 22px; }\n.butang-utama:disabled { opacity: .6; cursor: wait; }\n.butang-hijau { background: var(--hijau); color: #fff; } .butang-merah { background: var(--merah); color: #fff; }\n.butang-oren { background: var(--oren); color: #fff; } .butang-garis { background: #fff; color: var(--hijau); border: 1.5px solid var(--hijau); }\n.butang-emas { background: var(--emas); color: #1d1600; }\n.butang-kecil { min-height: 36px; padding: 6px 12px; font-size: 14px; }\n.kotak-info { background: var(--emas-muda); border-left: 4px solid var(--emas); padding: 12px 14px; border-radius: 8px; font-size: .92rem; }\n.kotak-amaran { background: var(--merah-muda); border-left: 4px solid var(--merah); padding: 12px 14px; border-radius: 8px; }\n.kotak-ujian { background: var(--biru-muda); border: 2px solid var(--biru); color: var(--biru); padding: 10px 14px; border-radius: 8px; font-weight: 600; text-align: center; }\n.berjaya { text-align: center; }\n.berjaya .ikon { width: 72px; height: 72px; border-radius: 50%; background: var(--hijau-muda); color: var(--hijau); font-size: 40px; line-height: 72px; margin: 0 auto 12px; }\n.id-besar { font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 1.5rem; font-weight: 700; background: var(--emas-muda);\n  border: 2px solid var(--emas); padding: 10px 14px; border-radius: 10px; display: inline-block; margin: 8px 0; letter-spacing: 1px; word-break: break-all; }\n.kaki { text-align: center; font-size: .82rem; color: var(--teks-lembut); padding: 8px 16px 32px; }\n.lencana { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: .78rem; font-weight: 700; white-space: nowrap; }\n.l-menunggu { background: var(--oren-muda); color: var(--oren); } .l-semakan { background: #fde2e1; color: #912018; }\n.l-lulus { background: var(--hijau-muda); color: var(--hijau); } .l-ditolak { background: #eaecf0; color: #344054; }\n.l-pembetulan { background: var(--biru-muda); color: var(--biru); } .l-ujian { background: var(--biru); color: #fff; }\n.tersembunyi { display: none !important; }\n.pemutar { width: 20px; height: 20px; border: 3px solid rgba(255,255,255,.4); border-top-color: #fff; border-radius: 50%; animation: putar 0.8s linear infinite; }\n@keyframes putar { to { transform: rotate(360deg); } }\n.kemajuan { height: 6px; background: var(--garis); border-radius: 3px; overflow: hidden; margin-top: 12px; }\n.kemajuan div { height: 100%; width: 30%; background: var(--hijau); animation: gerak 1.2s ease-in-out infinite; }\n@keyframes gerak { 0% { margin-left: -30%; } 100% { margin-left: 100%; } }\n@media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }\n\nbody { font-size: 15px; }\n.bar { background: var(--hijau-gelap); color: #fff; padding: 10px 16px; display: flex; align-items: center; gap: 12px; flex-wrap: wrap; position: sticky; top: 0; z-index: 5; }\n.bar .nama-sistem { font-weight: 700; flex: 1; min-width: 180px; }\n.bar .emas { color: var(--emas); }\n.bar button { background: transparent; color: #fff; border: 1px solid rgba(255,255,255,.4); border-radius: 8px; padding: 6px 10px; font-size: 13px; cursor: pointer; }\nnav.tab { display: flex; gap: 4px; overflow-x: auto; background: #fff; border-bottom: 1px solid var(--garis); padding: 0 8px; position: sticky; top: 50px; z-index: 4; }\nnav.tab button { border: none; background: none; padding: 14px 12px; font-size: 15px; font-weight: 600; color: var(--teks-lembut); border-bottom: 3px solid transparent; cursor: pointer; white-space: nowrap; font-family: inherit; }\nnav.tab button.aktif { color: var(--hijau); border-bottom-color: var(--hijau); }\n.isi { max-width: 1200px; margin: 0 auto; padding: 16px; }\n.statistik { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 12px; margin-bottom: 16px; }\n.stat { background: #fff; border-radius: 12px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,.08); border-top: 4px solid var(--garis); }\n.stat .n { font-size: 1.9rem; font-weight: 800; line-height: 1.1; }\n.stat .l { color: var(--teks-lembut); font-size: .88rem; margin-top: 4px; }\n.stat.hijau { border-top-color: var(--hijau); } .stat.oren { border-top-color: var(--oren); } .stat.merah { border-top-color: var(--merah); } .stat.emas { border-top-color: var(--emas); }\n.alat { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; margin-bottom: 12px; }\n.alat input:not([type=checkbox]), .alat select { width: auto; min-width: 140px; flex: 1; min-height: 42px; padding: 8px 12px; font-size: 15px; }\ntable { width: 100%; border-collapse: collapse; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,.08); }\nth, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid #eef1ee; vertical-align: top; font-size: 14px; }\nth { background: #f7f9f7; font-size: 12px; text-transform: uppercase; letter-spacing: .4px; color: var(--teks-lembut); }\ntbody tr { cursor: pointer; } tbody tr:hover { background: #f6faf7; }\n.mono { font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 13px; }\n.kecil { font-size: 12px; color: var(--teks-lembut); }\n.halaman { display: flex; gap: 8px; justify-content: center; align-items: center; margin: 14px 0; }\n.modal-latar { position: fixed; inset: 0; background: rgba(0,0,0,.5); z-index: 20; display: flex; align-items: flex-start; justify-content: center; overflow-y: auto; padding: 16px; }\n.modal { background: #fff; border-radius: 14px; max-width: 900px; width: 100%; padding: 20px; position: relative; margin: auto 0; }\n.modal .tutup { position: absolute; right: 12px; top: 12px; background: #eef1ee; border: none; border-radius: 50%; width: 36px; height: 36px; font-size: 20px; cursor: pointer; }\n.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }\n.resit { background: #f2f4f2; border-radius: 10px; min-height: 240px; display: flex; align-items: center; justify-content: center; overflow: auto; }\n.resit img { max-width: 100%; }\n.resit iframe { width: 100%; height: 520px; border: 0; }\ndl.butiran { display: grid; grid-template-columns: 130px 1fr; gap: 6px 10px; margin: 0; }\ndl.butiran dt { color: var(--teks-lembut); font-size: 13px; } dl.butiran dd { margin: 0; font-weight: 600; word-break: break-word; }\n.tindakan { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }\n.notis { position: fixed; bottom: 16px; left: 50%; transform: translateX(-50%); background: var(--teks); color: #fff; padding: 12px 18px; border-radius: 10px; z-index: 30; max-width: 90vw; }\n.log-masuk { max-width: 400px; margin: 40px auto; }\n.kolum-borang label { display: block; font-weight: 600; margin: 12px 0 4px; font-size: 14px; }\n.kolum-borang .grid2 > div { min-width: 0; }\n.pemenang-hasil { background: var(--emas-muda); border: 1px solid var(--emas); border-radius: 10px; padding: 10px 12px; margin: 6px 0; }\n@media (max-width: 720px) {\n  .grid2 { grid-template-columns: 1fr; }\n  .sorok-mudah-alih { display: none; }\n  th, td { padding: 8px; }\n}\n</style>\n</head>\n<body>\n\n<section id=\"vLogMasuk\" class=\"log-masuk bekas\">\n  <div class=\"kad\">\n    <h2>Log Masuk Pentadbir</h2>\n    <p class=\"kecil\">Infaq dan Menang Goldbar · YAPEIM Sarawak</p>\n    <form id=\"fLogMasuk\" class=\"kolum-borang\">\n      <label for=\"lmPengguna\">Nama pengguna</label>\n      <input type=\"text\" id=\"lmPengguna\" autocomplete=\"username\" autocapitalize=\"none\" required>\n      <label for=\"lmKata\">Kata laluan</label>\n      <input type=\"password\" id=\"lmKata\" autocomplete=\"current-password\" required>\n      <div id=\"lmRalat\" class=\"kotak-amaran tersembunyi\" style=\"margin-top:12px\"></div>\n      <button class=\"butang butang-utama\" id=\"lmButang\">Log Masuk</button>\n    </form>\n  </div>\n</section>\n\n<section id=\"vTukarKata\" class=\"log-masuk bekas tersembunyi\">\n  <div class=\"kad\">\n    <h2>Tukar Kata Laluan</h2>\n    <p class=\"kecil\" id=\"tkNota\">Kata laluan baharu: sekurang-kurangnya 10 aksara, mengandungi huruf dan nombor.</p>\n    <form id=\"fTukarKata\" class=\"kolum-borang\">\n      <label for=\"tkLama\">Kata laluan semasa / sementara</label>\n      <input type=\"password\" id=\"tkLama\" autocomplete=\"current-password\" required>\n      <label for=\"tkBaru\">Kata laluan baharu</label>\n      <input type=\"password\" id=\"tkBaru\" autocomplete=\"new-password\" required>\n      <label for=\"tkBaru2\">Ulang kata laluan baharu</label>\n      <input type=\"password\" id=\"tkBaru2\" autocomplete=\"new-password\" required>\n      <div id=\"tkRalat\" class=\"kotak-amaran tersembunyi\" style=\"margin-top:12px\"></div>\n      <button class=\"butang butang-utama\">Simpan Kata Laluan</button>\n      <button type=\"button\" class=\"butang butang-garis\" style=\"width:100%;margin-top:8px\" id=\"tkBatal\">Batal</button>\n    </form>\n  </div>\n</section>\n\n<section id=\"vUtama\" class=\"tersembunyi\">\n  <div class=\"bar\">\n    <div class=\"nama-sistem\">INFAQ &amp; MENANG <span class=\"emas\">GOLDBAR</span> · Dashboard</div>\n    <span id=\"barPengguna\" class=\"kecil\" style=\"color:#fff\"></span>\n    <button id=\"bTukarKata\">Tukar kata laluan</button>\n    <button id=\"bLogKeluar\">Log keluar</button>\n  </div>\n  <nav class=\"tab\" id=\"nav\">\n    <button data-v=\"ringkasan\" class=\"aktif\">Ringkasan</button>\n    <button data-v=\"penyertaan\">Penyertaan</button>\n    <button data-v=\"terpantas\">Peserta Terpantas</button>\n    <button data-v=\"cabutan\">Cabutan</button>\n    <button data-v=\"audit\">Sejarah Tindakan</button>\n    <button data-v=\"tetapan\" class=\"utama-sahaja\">Tetapan</button>\n    <button data-v=\"pentadbir\" class=\"utama-sahaja\">Pentadbir</button>\n  </nav>\n\n  <div class=\"isi\">\n    <!-- RINGKASAN -->\n    <section data-paparan=\"ringkasan\">\n      <div id=\"rgKempen\" class=\"kotak-info\" style=\"margin-bottom:12px\"></div>\n      <div class=\"statistik\">\n        <div class=\"stat\"><div class=\"n\" id=\"sJumlah\">–</div><div class=\"l\">Jumlah penyertaan</div></div>\n        <div class=\"stat oren\"><div class=\"n\" id=\"sMenunggu\">–</div><div class=\"l\">Menunggu pengesahan</div></div>\n        <div class=\"stat merah\"><div class=\"n\" id=\"sSemakan\">–</div><div class=\"l\">Perlu semakan manual (ditanda)</div></div>\n        <div class=\"stat hijau\"><div class=\"n\" id=\"sLulus\">–</div><div class=\"l\">Penyertaan sah (lulus)</div></div>\n        <div class=\"stat\"><div class=\"n\" id=\"sDitolak\">–</div><div class=\"l\">Ditolak</div></div>\n        <div class=\"stat\"><div class=\"n\" id=\"sPembetulan\">–</div><div class=\"l\">Perlu pembetulan</div></div>\n        <div class=\"stat emas\"><div class=\"n\" id=\"sLayak\">–</div><div class=\"l\">Layak untuk cabutan</div></div>\n      </div>\n      <div class=\"statistik\">\n        <div class=\"stat\"><div class=\"n\" id=\"sRmDirekod\">–</div><div class=\"l\"><strong>Jumlah sumbangan DIREKOD</strong> — dilaporkan peserta, <u>belum disahkan</u> (tidak termasuk yang ditolak)</div></div>\n        <div class=\"stat hijau\"><div class=\"n\" id=\"sRmDisahkan\">–</div><div class=\"l\"><strong>Jumlah sumbangan DISAHKAN</strong> — resit telah diluluskan pentadbir</div></div>\n      </div>\n      <div class=\"kad\">\n        <h3>Semakan integriti data</h3>\n        <p class=\"kecil\">Memeriksa sama ada cap masa, nombor telefon, jumlah atau log audit telah diubah secara manual dalam Google Sheet.</p>\n        <button class=\"butang butang-garis\" id=\"bIntegriti\">Jalankan semakan</button>\n        <div id=\"hasilIntegriti\" style=\"margin-top:10px\"></div>\n      </div>\n    </section>\n\n    <!-- PENYERTAAN -->\n    <section data-paparan=\"penyertaan\" class=\"tersembunyi\">\n      <div class=\"alat\">\n        <input type=\"search\" id=\"pCarian\" placeholder=\"Cari nama, telefon, ID, tarikh (YYYY-MM-DD) atau no. rujukan\">\n        <select id=\"pStatus\">\n          <option value=\"\">Semua status</option>\n          <option>MENUNGGU PENGESAHAN</option><option>PERLU SEMAKAN MANUAL</option><option>LULUS</option>\n          <option>DITOLAK</option><option>PERLU PEMBETULAN</option>\n        </select>\n        <input type=\"date\" id=\"pDari\" title=\"Diterima dari\">\n        <input type=\"date\" id=\"pHingga\" title=\"Diterima hingga\">\n        <select id=\"pSusun\"><option value=\"baru\">Terbaru dahulu</option><option value=\"awal\">Terawal dahulu</option></select>\n      </div>\n      <div class=\"alat\">\n        <label class=\"semak\" style=\"margin:0\"><input type=\"checkbox\" id=\"pUjian\"> <span>Papar data ujian sahaja</span></label>\n        <span style=\"flex:1\"></span>\n        <button class=\"butang butang-garis butang-kecil\" id=\"bCari\">Cari</button>\n        <button class=\"butang butang-hijau butang-kecil\" id=\"bEksport\">⬇ Eksport CSV (Excel)</button>\n      </div>\n      <div id=\"pJumlah\" class=\"kecil\" style=\"margin-bottom:6px\"></div>\n      <table>\n        <thead><tr><th>ID / Diterima</th><th>Nama</th><th class=\"sorok-mudah-alih\">Telefon</th><th>Jumlah</th><th>Status</th><th class=\"sorok-mudah-alih\">Kelayakan</th></tr></thead>\n        <tbody id=\"pBadan\"></tbody>\n      </table>\n      <div class=\"halaman\"><button class=\"butang butang-garis butang-kecil\" id=\"pSebelum\">‹ Sebelum</button><span id=\"pHalaman\"></span><button class=\"butang butang-garis butang-kecil\" id=\"pSelepas\">Seterusnya ›</button></div>\n    </section>\n\n    <!-- TERPANTAS -->\n    <section data-paparan=\"terpantas\" class=\"tersembunyi\">\n      <div class=\"alat\"><label class=\"semak\" style=\"margin:0\"><input type=\"checkbox\" id=\"tUjian\"> <span>Data ujian</span></label>\n        <button class=\"butang butang-garis butang-kecil\" id=\"bMuatTerpantas\">Muat semula</button></div>\n      <div id=\"tAmaran\" class=\"kotak-info\" style=\"margin-bottom:12px\"></div>\n      <table>\n        <thead><tr><th>#</th><th>ID</th><th>Nama</th><th class=\"sorok-mudah-alih\">Telefon</th><th>Diterima (cap masa pelayan)</th><th class=\"sorok-mudah-alih\">Turutan</th></tr></thead>\n        <tbody id=\"tBadan\"></tbody>\n      </table>\n      <p class=\"kecil\">Kedudukan berdasarkan cap masa pelayan semasa borang diterima. Pemutus seri: nombor turutan penerimaan. Hanya penyertaan LULUS & layak dikira. Baris selepas garisan emas ialah calon simpanan.</p>\n    </section>\n\n    <!-- CABUTAN -->\n    <section data-paparan=\"cabutan\" class=\"tersembunyi\">\n      <div class=\"kad kolum-borang utama-sahaja\">\n        <h3>Jalankan Cabutan / Umumkan Keputusan</h3>\n        <div class=\"grid2\">\n          <div><label for=\"cKaedah\">Kaedah</label>\n            <select id=\"cKaedah\"><option value=\"RAWAK\">B. Cabutan bertuah rawak</option><option value=\"TERPANTAS\">A. Peserta terpantas (sah)</option></select></div>\n          <div><label for=\"cJenis\">Jenis</label>\n            <select id=\"cJenis\"><option value=\"UJIAN\">UJIAN (data ujian sahaja, tidak rasmi)</option><option value=\"RASMI\">RASMI</option></select></div>\n          <div><label for=\"cPemenang\">Bilangan pemenang</label><input type=\"number\" id=\"cPemenang\" min=\"1\" max=\"100\" value=\"1\"></div>\n          <div><label for=\"cSimpanan\">Bilangan pemenang simpanan</label><input type=\"number\" id=\"cSimpanan\" min=\"0\" max=\"100\" value=\"2\"></div>\n        </div>\n        <label for=\"cHadiah\">Hadiah</label><input type=\"text\" id=\"cHadiah\" maxlength=\"100\">\n        <div id=\"cInfo\" class=\"kotak-info\" style=\"margin-top:12px\"></div>\n        <button class=\"butang butang-emas\" style=\"margin-top:12px\" id=\"bCabut\">🎲 Jalankan</button>\n        <div id=\"cHasil\" style=\"margin-top:14px\"></div>\n      </div>\n      <div class=\"kad\">\n        <h3>Rekod Cabutan</h3>\n        <p class=\"kecil\">Paparan untuk siaran langsung (tiada telefon/resit, nama ditopeng):\n          <a id=\"lPaparan\" href=\"#\" target=\"_blank\" rel=\"noopener\">Keputusan rasmi</a> ·\n          <a id=\"lPaparanUjian\" href=\"#\" target=\"_blank\" rel=\"noopener\">Keputusan ujian</a></p>\n        <div id=\"cSenarai\"></div>\n      </div>\n    </section>\n\n    <!-- AUDIT -->\n    <section data-paparan=\"audit\" class=\"tersembunyi\">\n      <p class=\"kecil\">300 tindakan terkini. Log ini dirantai dengan tandatangan — sebarang pengubahan akan dikesan oleh \"Semakan integriti\".</p>\n      <table><thead><tr><th>Masa</th><th>Pentadbir</th><th>Tindakan</th><th>Sasaran</th><th class=\"sorok-mudah-alih\">Butiran</th></tr></thead><tbody id=\"aBadan\"></tbody></table>\n    </section>\n\n    <!-- TETAPAN -->\n    <section data-paparan=\"tetapan\" class=\"tersembunyi\">\n      <form class=\"kad kolum-borang\" id=\"fTetapan\">\n        <h3>Tetapan Kempen</h3>\n        <div class=\"kotak-amaran kecil\">Semua perubahan direkodkan dalam Sejarah Tindakan. Elakkan menukar tarikh atau syarat selepas kempen bermula.</div>\n        <label>Nama kempen</label><input type=\"text\" name=\"namaKempen\" maxlength=\"150\">\n        <div class=\"grid2\">\n          <div><label>Tarikh &amp; masa MULA (waktu Malaysia)</label><input type=\"datetime-local\" name=\"tarikhMula\"></div>\n          <div><label>Tarikh &amp; masa TAMAT (waktu Malaysia)</label><input type=\"datetime-local\" name=\"tarikhTamat\"></div>\n          <div><label>Sumbangan minimum (RM)</label><input type=\"number\" name=\"minSumbangan\" min=\"0\" step=\"0.01\"></div>\n          <div><label>Bilangan peserta terpantas</label><input type=\"number\" name=\"bilTerpantas\" min=\"0\"></div>\n          <div><label>Tandakan semakan jika jumlah ≥ (RM)</label><input type=\"number\" name=\"hadJumlahSemakan\" min=\"0\"></div>\n          <div><label>Had penyertaan setiap telefon</label><input type=\"number\" name=\"hadPenyertaanSetiapTelefon\" min=\"1\"></div>\n        </div>\n        <label>Hadiah</label><input type=\"text\" name=\"hadiah\" maxlength=\"150\">\n        <label>Kaedah sumbangan (satu baris satu pilihan)</label><textarea name=\"saluran\" rows=\"4\"></textarea>\n        <div class=\"grid2\">\n          <div><label>Emel pertanyaan data</label><input type=\"text\" name=\"emelPertanyaan\"></div>\n          <div><label>Telefon pertanyaan</label><input type=\"text\" name=\"telefonPertanyaan\"></div>\n        </div>\n        <label>Tempoh simpanan data</label><input type=\"text\" name=\"tempohSimpanData\">\n        <label class=\"semak\"><input type=\"checkbox\" name=\"satuPeluangSetiapTelefon\"> <span>Satu peluang sahaja bagi setiap nombor telefon (terpantas &amp; cabutan)</span></label>\n        <label class=\"semak\"><input type=\"checkbox\" name=\"tarikhSumbanganDalamTempoh\"> <span>Tarikh sumbangan mesti dalam tempoh kempen</span></label>\n        <label class=\"semak\"><input type=\"checkbox\" name=\"benarkanUjian\"> <span>Benarkan mod ujian (<span class=\"mono\">?ujian=1</span>) — <strong>MATIKAN sebelum kempen dilancarkan</strong></span></label>\n        <button class=\"butang butang-utama\">Simpan Tetapan</button>\n      </form>\n      <div class=\"kad\">\n        <h3>Data Ujian</h3>\n        <p class=\"kecil\">Data palsu ditanda \"UJIAN\" dan tidak dikira dalam statistik, terpantas atau cabutan rasmi.</p>\n        <div class=\"tindakan\">\n          <button class=\"butang butang-garis\" id=\"bJanaUjian\">Jana 30 penyertaan palsu</button>\n          <button class=\"butang butang-merah\" id=\"bPadamUjian\">Padam semua data ujian</button>\n        </div>\n        <p class=\"kecil\">Borang mod ujian: <a id=\"lBorangUjian\" href=\"#\" target=\"_blank\" rel=\"noopener\"></a></p>\n      </div>\n    </section>\n\n    <!-- PENTADBIR -->\n    <section data-paparan=\"pentadbir\" class=\"tersembunyi\">\n      <div class=\"kad kolum-borang\">\n        <h3>Tambah Pentadbir</h3>\n        <div class=\"grid2\">\n          <div><label>Nama pengguna (huruf kecil)</label><input type=\"text\" id=\"tpPengguna\" autocapitalize=\"none\"></div>\n          <div><label>Nama penuh staf</label><input type=\"text\" id=\"tpNama\"></div>\n        </div>\n        <label>Peranan</label>\n        <select id=\"tpPeranan\"><option value=\"PENYEMAK\">PENYEMAK — semak &amp; lulus resit</option><option value=\"UTAMA\">UTAMA — semua termasuk cabutan &amp; tetapan</option></select>\n        <button class=\"butang butang-hijau\" style=\"margin-top:12px\" id=\"bTambahPentadbir\">Tambah</button>\n      </div>\n      <table><thead><tr><th>Pengguna</th><th>Nama</th><th>Peranan</th><th>Status</th><th>Tindakan</th></tr></thead><tbody id=\"tpBadan\"></tbody></table>\n    </section>\n  </div>\n</section>\n\n<div id=\"modal\" class=\"modal-latar tersembunyi\"><div class=\"modal\" id=\"modalIsi\"></div></div>\n<div id=\"notis\" class=\"notis tersembunyi\"></div>\n\n<script>\nvar DATA = /*__DATA__*/null;\nvar TOKEN = null, SAYA = null, halaman = 0, entriSemasa = {}, ringkasan = null;\nfunction $(id) { return document.getElementById(id); }\nfunction esc(s) { return String(s == null ? '' : s).replace(/[&<>\"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', \"'\": '&#39;' }[c]; }); }\nfunction rm(n) { return 'RM ' + Number(n || 0).toLocaleString('ms-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }\nfunction notis(m) { var n = $('notis'); n.textContent = m; n.classList.remove('tersembunyi'); clearTimeout(notis.t); notis.t = setTimeout(function () { n.classList.add('tersembunyi'); }, 4000); }\nfunction simpan(k, v) { try { if (v == null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, v); } catch (e) {} }\nfunction baca(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }\nfunction lencana(s, ujian) {\n  var k = { 'MENUNGGU PENGESAHAN': 'l-menunggu', 'PERLU SEMAKAN MANUAL': 'l-semakan', 'LULUS': 'l-lulus', 'DITOLAK': 'l-ditolak', 'PERLU PEMBETULAN': 'l-pembetulan' }[s] || '';\n  return '<span class=\"lencana ' + k + '\">' + esc(s) + '</span>' + (ujian ? ' <span class=\"lencana l-ujian\">UJIAN</span>' : '');\n}\n\n/** Panggil fungsi pelayan dan kendalikan sesi tamat. */\nfunction panggil(fn) {\n  var args = Array.prototype.slice.call(arguments, 1);\n  return new Promise(function (ok, gagal) {\n    var r = google.script.run.withSuccessHandler(function (res) {\n      if (res && res.sesiTamat) { logKeluar(true); return gagal(new Error(res.ralat)); }\n      if (res && res.mestiTukar) { tunjuk('vTukarKata'); return gagal(new Error(res.ralat)); }\n      if (!res || !res.ok) { notis((res && res.ralat) || 'Ralat'); return gagal(new Error(res && res.ralat)); }\n      ok(res.data);\n    }).withFailureHandler(function (e) { notis('Sambungan gagal. Cuba lagi.'); gagal(e); });\n    r[fn].apply(r, [TOKEN].concat(args));\n  });\n}\n\nfunction tunjuk(v) { ['vLogMasuk', 'vTukarKata', 'vUtama'].forEach(function (x) { $(x).classList.toggle('tersembunyi', x !== v); }); }\n\nfunction logKeluar(tamat) {\n  if (TOKEN && !tamat) google.script.run.adminLogKeluar(TOKEN);\n  TOKEN = null; SAYA = null; simpan('tk', null); simpan('saya', null);\n  tunjuk('vLogMasuk');\n  if (tamat) { $('lmRalat').textContent = 'Sesi tamat. Sila log masuk semula.'; $('lmRalat').classList.remove('tersembunyi'); }\n}\n\n$('fLogMasuk').onsubmit = function (e) {\n  e.preventDefault();\n  $('lmButang').disabled = true; $('lmRalat').classList.add('tersembunyi');\n  google.script.run.withSuccessHandler(function (res) {\n    $('lmButang').disabled = false; $('lmKata').value = '';\n    if (!res.ok) { $('lmRalat').textContent = res.ralat; $('lmRalat').classList.remove('tersembunyi'); return; }\n    TOKEN = res.token; SAYA = res; simpan('tk', TOKEN); simpan('saya', JSON.stringify(res));\n    if (res.mestiTukar) { $('tkNota').textContent = 'Ini log masuk pertama anda. Sila tukar kata laluan sementara. Minimum 10 aksara dengan huruf dan nombor.'; tunjuk('vTukarKata'); }\n    else masuk();\n  }).withFailureHandler(function () { $('lmButang').disabled = false; $('lmRalat').textContent = 'Sambungan gagal.'; $('lmRalat').classList.remove('tersembunyi'); })\n    .adminLogMasuk($('lmPengguna').value, $('lmKata').value);\n};\n\n$('fTukarKata').onsubmit = function (e) {\n  e.preventDefault();\n  $('tkRalat').classList.add('tersembunyi');\n  if ($('tkBaru').value !== $('tkBaru2').value) { $('tkRalat').textContent = 'Kata laluan baharu tidak sepadan.'; $('tkRalat').classList.remove('tersembunyi'); return; }\n  google.script.run.withSuccessHandler(function (res) {\n    if (!res.ok) { $('tkRalat').textContent = res.ralat; $('tkRalat').classList.remove('tersembunyi'); if (res.sesiTamat) logKeluar(true); return; }\n    $('fTukarKata').reset(); SAYA.mestiTukar = false; simpan('saya', JSON.stringify(SAYA));\n    notis('Kata laluan telah ditukar.'); masuk();\n  }).adminTukarKataLaluan(TOKEN, $('tkLama').value, $('tkBaru').value);\n};\n$('tkBatal').onclick = function () { if (SAYA && !SAYA.mestiTukar) tunjuk('vUtama'); else logKeluar(); };\n$('bTukarKata').onclick = function () { $('tkNota').textContent = 'Kata laluan baharu: sekurang-kurangnya 10 aksara, mengandungi huruf dan nombor.'; tunjuk('vTukarKata'); };\n$('bLogKeluar').onclick = function () { logKeluar(false); };\n\nfunction masuk() {\n  tunjuk('vUtama');\n  $('barPengguna').textContent = SAYA.nama + ' (' + SAYA.peranan + ')';\n  Array.prototype.forEach.call(document.querySelectorAll('.utama-sahaja'), function (el) { el.classList.toggle('tersembunyi', SAYA.peranan !== 'UTAMA'); });\n  $('lPaparan').href = DATA.url + '?p=paparan';\n  $('lPaparanUjian').href = DATA.url + '?p=paparan&ujian=1';\n  $('lBorangUjian').href = DATA.url + '?ujian=1'; $('lBorangUjian').textContent = DATA.url + '?ujian=1';\n  buka('ringkasan');\n}\n\nArray.prototype.forEach.call(document.querySelectorAll('#nav button'), function (b) { b.onclick = function () { buka(b.dataset.v); }; });\nfunction buka(v) {\n  Array.prototype.forEach.call(document.querySelectorAll('#nav button'), function (b) { b.classList.toggle('aktif', b.dataset.v === v); });\n  Array.prototype.forEach.call(document.querySelectorAll('[data-paparan]'), function (s) { s.classList.toggle('tersembunyi', s.dataset.paparan !== v); });\n  ({ ringkasan: muatRingkasan, penyertaan: function () { halaman = 0; muatSenarai(); }, terpantas: muatTerpantas, cabutan: muatCabutan,\n     audit: muatAudit, tetapan: muatTetapan, pentadbir: muatPentadbir })[v]();\n}\n\nvar NAMA_STATUS_KEMPEN = { BELUM_DITETAPKAN: 'Tarikh kempen BELUM DITETAPKAN — borang awam ditutup. Tetapkan di tab Tetapan.', BELUM_MULA: 'Kempen BELUM BERMULA.', DIBUKA: 'Kempen SEDANG BERJALAN — borang dibuka.', TAMAT: 'Kempen TELAH TAMAT — borang ditutup.' };\n\nfunction muatRingkasan() {\n  return panggil('adminRingkasan').then(function (r) {\n    ringkasan = r;\n    $('rgKempen').innerHTML = '<strong>' + esc(NAMA_STATUS_KEMPEN[r.statusKempen]) + '</strong>' +\n      (r.tetapan.tarikhMula ? '<br>Tempoh: ' + esc(r.tetapan.tarikhMula.replace('T', ' ')) + ' hingga ' + esc(r.tetapan.tarikhTamat.replace('T', ' ')) : '') +\n      '<br><span class=\"kecil\">Masa pelayan: ' + esc(r.sekarang) + (r.tetapan.benarkanUjian ? ' · <strong style=\"color:var(--biru)\">Mod ujian DIHIDUPKAN</strong>' : '') + '</span>';\n    $('sJumlah').textContent = r.jumlah; $('sMenunggu').textContent = r.menunggu; $('sSemakan').textContent = r.semakan;\n    $('sLulus').textContent = r.lulus; $('sDitolak').textContent = r.ditolak; $('sPembetulan').textContent = r.pembetulan;\n    $('sLayak').textContent = r.layak; $('sRmDirekod').textContent = rm(r.rmDirekod); $('sRmDisahkan').textContent = rm(r.rmDisahkan);\n    return r;\n  });\n}\n\n$('bIntegriti').onclick = function () {\n  $('hasilIntegriti').textContent = 'Menyemak…';\n  panggil('adminSemakIntegriti').then(function (r) {\n    $('hasilIntegriti').innerHTML = r.ok ? '<div class=\"kotak-info\">✓ Tiada pengubahan dikesan.</div>'\n      : '<div class=\"kotak-amaran\"><strong>Masalah dikesan:</strong><ul>' + r.masalah.map(function (m) { return '<li>' + esc(m) + '</li>'; }).join('') + '</ul></div>';\n  });\n};\n\nfunction tapisSemasa() {\n  return { carian: $('pCarian').value, status: $('pStatus').value, dari: $('pDari').value, hingga: $('pHingga').value,\n    susun: $('pSusun').value, ujian: $('pUjian').checked, halaman: halaman };\n}\nfunction muatSenarai() {\n  $('pBadan').innerHTML = '<tr><td colspan=\"6\">Memuatkan…</td></tr>';\n  panggil('adminSenarai', tapisSemasa()).then(function (r) {\n    entriSemasa = {};\n    $('pJumlah').textContent = r.jumlah + ' penyertaan dijumpai';\n    $('pBadan').innerHTML = r.entri.length ? r.entri.map(function (e) {\n      entriSemasa[e.id] = e;\n      return '<tr data-id=\"' + esc(e.id) + '\"><td><span class=\"mono\">' + esc(e.id) + '</span><div class=\"kecil\">' + esc(e.diterima) + '</div></td>' +\n        '<td>' + esc(e.nama) + (e.bendera ? '<div class=\"kecil\" style=\"color:var(--merah)\">⚑ ' + esc(e.bendera) + '</div>' : '') + (e.integriti ? '' : '<div class=\"kecil\" style=\"color:var(--merah)\">⚠ GAGAL INTEGRITI</div>') + '</td>' +\n        '<td class=\"sorok-mudah-alih\">' + esc(e.telefon) + '</td><td>' + rm(e.jumlah) + '</td><td>' + lencana(e.status, e.ujian) + '</td>' +\n        '<td class=\"sorok-mudah-alih kecil\">' + (e.layak ? '<strong style=\"color:var(--hijau)\">LAYAK</strong>' : esc(e.sebabKelayakan)) + '</td></tr>';\n    }).join('') : '<tr><td colspan=\"6\">Tiada rekod.</td></tr>';\n    var bilHal = Math.max(1, Math.ceil(r.jumlah / r.saiz));\n    $('pHalaman').textContent = 'Halaman ' + (r.halaman + 1) + ' / ' + bilHal;\n    $('pSebelum').disabled = r.halaman <= 0; $('pSelepas').disabled = r.halaman + 1 >= bilHal;\n  });\n}\n$('pBadan').onclick = function (e) { var tr = e.target.closest('tr[data-id]'); if (tr) bukaEntri(tr.dataset.id); };\n$('bCari').onclick = function () { halaman = 0; muatSenarai(); };\n$('pCarian').onkeydown = function (e) { if (e.key === 'Enter') { halaman = 0; muatSenarai(); } };\n['pStatus', 'pSusun', 'pUjian', 'pDari', 'pHingga'].forEach(function (x) { $(x).onchange = function () { halaman = 0; muatSenarai(); }; });\n$('pSebelum').onclick = function () { halaman--; muatSenarai(); };\n$('pSelepas').onclick = function () { halaman++; muatSenarai(); };\n\nfunction muatTurun(nama, kandungan, jenis) {\n  var b = kandungan instanceof Blob ? kandungan : new Blob([kandungan], { type: jenis });\n  var a = document.createElement('a');\n  a.href = URL.createObjectURL(b); a.download = nama; document.body.appendChild(a); a.click();\n  setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 2000);\n}\n$('bEksport').onclick = function () {\n  var t = tapisSemasa(); delete t.halaman;\n  panggil('adminEksportCsv', t).then(function (r) { muatTurun(r.namaFail, r.csv, 'text/csv;charset=utf-8'); notis(r.bil + ' rekod dieksport.'); });\n};\n\nfunction tutupModal() { $('modal').classList.add('tersembunyi'); $('modalIsi').innerHTML = ''; }\n$('modal').onclick = function (e) { if (e.target === $('modal')) tutupModal(); };\n\nfunction bukaEntri(id) {\n  var e = entriSemasa[id];\n  $('modalIsi').innerHTML = '<button class=\"tutup\" aria-label=\"Tutup\">×</button>' +\n    '<h3 class=\"mono\">' + esc(e.id) + '</h3><div>' + lencana(e.status, e.ujian) + '</div>' +\n    (e.integriti ? '' : '<div class=\"kotak-amaran\" style=\"margin-top:8px\">⚠ Rekod ini gagal semakan integriti — data asal telah diubah secara manual.</div>') +\n    (e.bendera ? '<div class=\"kotak-amaran\" style=\"margin-top:8px\"><strong>Ditanda untuk semakan manual:</strong> ' + esc(e.bendera) + '</div>' : '') +\n    '<div class=\"grid2\" style=\"margin-top:14px\"><div><dl class=\"butiran\">' +\n    '<dt>Diterima</dt><dd>' + esc(e.diterima) + ' <span class=\"kecil\">(turutan #' + e.turutan + ')</span></dd>' +\n    '<dt>Nama</dt><dd>' + esc(e.nama) + '</dd><dt>Telefon</dt><dd>' + esc(e.telefon) + '</dd>' +\n    '<dt>Jumlah</dt><dd>' + rm(e.jumlah) + '</dd><dt>Tarikh sumbangan</dt><dd>' + esc(e.tarikh) + '</dd>' +\n    '<dt>Kaedah</dt><dd>' + esc(e.saluran) + '</dd><dt>No. rujukan</dt><dd>' + esc(e.rujukan || '-') + '</dd>' +\n    '<dt>Kelayakan</dt><dd>' + (e.layak ? 'LAYAK' : esc(e.sebabKelayakan)) + '</dd>' +\n    '<dt>Catatan</dt><dd>' + esc(e.catatan || '-') + '</dd><dt>Disemak</dt><dd>' + esc(e.oleh ? e.oleh + ' · ' + e.pada : '-') + '</dd></dl>' +\n    '<div class=\"kotak-info kecil\" style=\"margin-top:12px\">Semak: nama &amp; jumlah pada resit sepadan, tarikh dalam tempoh, penerima ialah akaun rasmi YAPEIM, dan resit tidak kelihatan diubah. Jika ragu, sahkan dengan penyata bank.</div>' +\n    '<label class=\"tajuk\" for=\"mCatatan\">Catatan / sebab (wajib untuk Tolak &amp; Pembetulan)</label><textarea id=\"mCatatan\" rows=\"2\" maxlength=\"500\"></textarea>' +\n    '<div class=\"tindakan\"><button class=\"butang butang-hijau\" data-s=\"LULUS\">✓ Luluskan</button>' +\n    '<button class=\"butang butang-merah\" data-s=\"DITOLAK\">✗ Tolak</button>' +\n    '<button class=\"butang butang-oren\" data-s=\"PERLU PEMBETULAN\">✎ Minta Pembetulan</button></div></div>' +\n    '<div><div class=\"resit\" id=\"mResit\">' + (e.adaResit ? '<button class=\"butang butang-garis\" id=\"mLihat\">🔒 Lihat resit</button>' : '<span class=\"kecil\">Tiada fail (data ujian)</span>') + '</div>' +\n    '<div id=\"mResitAlat\" class=\"kecil\" style=\"margin-top:6px\"></div></div></div>';\n  $('modal').classList.remove('tersembunyi');\n  $('modalIsi').querySelector('.tutup').onclick = tutupModal;\n  if (e.adaResit) $('mLihat').onclick = function () { lihatResit(e.id); };\n  Array.prototype.forEach.call($('modalIsi').querySelectorAll('[data-s]'), function (b) {\n    b.onclick = function () {\n      var s = b.dataset.s, c = $('mCatatan').value.trim();\n      if (s !== 'LULUS' && c.length < 3) { notis('Sila tulis sebab dalam catatan.'); $('mCatatan').focus(); return; }\n      if (!confirm('Tukar status ' + e.id + ' kepada ' + s + '?')) return;\n      b.disabled = true;\n      panggil('adminTukarStatus', e.id, s, c).then(function () { notis('Status dikemas kini.'); tutupModal(); muatSenarai(); }, function () { b.disabled = false; });\n    };\n  });\n}\n\nfunction lihatResit(id) {\n  $('mResit').innerHTML = '<span class=\"kecil\">Memuatkan resit…</span>';\n  panggil('adminLihatResit', id).then(function (r) {\n    var bait = atob(r.data), arr = new Uint8Array(bait.length);\n    for (var i = 0; i < bait.length; i++) arr[i] = bait.charCodeAt(i);\n    var blob = new Blob([arr], { type: r.mime });\n    var url = URL.createObjectURL(blob);\n    $('mResit').innerHTML = r.mime === 'application/pdf' ? '<iframe src=\"' + url + '\" title=\"Resit PDF\"></iframe>' : '<img alt=\"Resit\" src=\"' + url + '\">';\n    $('mResitAlat').innerHTML = '';\n    var a = document.createElement('a'); a.href = url; a.download = r.nama; a.textContent = '⬇ Muat turun resit';\n    $('mResitAlat').appendChild(a);\n  });\n}\n\nfunction muatTerpantas() {\n  var ujian = $('tUjian').checked;\n  $('tBadan').innerHTML = '<tr><td colspan=\"6\">Memuatkan…</td></tr>';\n  panggil('adminTerpantas', ujian).then(function (r) {\n    var amaran = [];\n    if (!ujian && r.statusKempen !== 'TAMAT') amaran.push('Kempen belum tamat — senarai ini SEMENTARA dan bukan keputusan rasmi.');\n    if (r.belumSelesai) amaran.push(r.belumSelesai + ' penyertaan belum disemak. Kedudukan boleh berubah.');\n    $('tAmaran').innerHTML = esc(amaran.join(' ') || 'Kempen tamat dan semua penyertaan telah disemak. Senarai ini boleh diumumkan melalui tab Cabutan (kaedah Peserta Terpantas, RASMI).');\n    $('tBadan').innerHTML = r.senarai.length ? r.senarai.map(function (e) {\n      return '<tr' + (e.kedudukan === r.bilTerpantas ? ' style=\"border-bottom:3px solid var(--emas)\"' : '') + (e.kedudukan > r.bilTerpantas ? ' class=\"kecil\"' : '') + '><td><strong>' + e.kedudukan + '</strong></td><td class=\"mono\">' + esc(e.id) + '</td><td>' + esc(e.nama) +\n        '</td><td class=\"sorok-mudah-alih\">' + esc(e.telefon) + '</td><td class=\"mono\">' + esc(e.diterima) + '</td><td class=\"sorok-mudah-alih\">' + e.turutan + '</td></tr>';\n    }).join('') : '<tr><td colspan=\"6\">Belum ada penyertaan layak.</td></tr>';\n  });\n}\n$('bMuatTerpantas').onclick = muatTerpantas; $('tUjian').onchange = muatTerpantas;\n\nfunction kemasInfoCabutan() {\n  if (!ringkasan) return;\n  var ujian = $('cJenis').value === 'UJIAN';\n  var n = ujian ? ringkasan.layakUjian : ringkasan.layak;\n  var t = 'Jumlah peserta layak (' + (ujian ? 'data ujian' : 'rasmi') + '): <strong>' + n + '</strong>.';\n  if (!ujian) {\n    if (ringkasan.statusKempen !== 'TAMAT') t += '<br>⚠ Cabutan rasmi hanya dibenarkan selepas kempen tamat.';\n    if (ringkasan.menunggu + ringkasan.semakan > 0) t += '<br>⚠ Masih ada ' + (ringkasan.menunggu + ringkasan.semakan) + ' penyertaan belum disemak.';\n  }\n  $('cInfo').innerHTML = t;\n}\n['cJenis', 'cKaedah'].forEach(function (x) { $(x).onchange = kemasInfoCabutan; });\n\nfunction muatCabutan() {\n  muatRingkasan().then(function (r) { if (!$('cHadiah').value) $('cHadiah').value = r.tetapan.hadiah; kemasInfoCabutan(); });\n  panggil('adminSenaraiCabutan').then(function (senarai) {\n    $('cSenarai').innerHTML = senarai.length ? senarai.map(function (c) {\n      return '<div class=\"kad\" style=\"border:1px solid var(--garis)\"><div><strong class=\"mono\">' + esc(c.id) + '</strong> ' +\n        '<span class=\"lencana ' + (c.jenis === 'RASMI' ? 'l-lulus' : 'l-ujian') + '\">' + esc(c.jenis) + '</span> ' +\n        '<span class=\"lencana ' + (c.status === 'AKTIF' ? 'l-menunggu' : 'l-ditolak') + '\">' + esc(c.status) + '</span></div>' +\n        '<div class=\"kecil\">' + esc(c.kaedah === 'RAWAK' ? 'Cabutan bertuah' : 'Peserta terpantas') + ' · ' + esc(c.masa) + ' · oleh ' + esc(c.oleh) + ' · ' + c.bilLayak + ' layak · Hadiah: ' + esc(c.hadiah) + '</div>' +\n        '<div style=\"margin-top:6px\">Pemenang: ' + c.pemenang.map(function (p) { return '<span class=\"mono\">' + esc(p.id) + '</span> (' + esc(p.nama) + ')'; }).join(', ') + '</div>' +\n        (c.simpanan.length ? '<div class=\"kecil\">Simpanan: ' + c.simpanan.map(function (p) { return esc(p.id); }).join(', ') + '</div>' : '') +\n        '<div class=\"kecil mono\" style=\"word-break:break-all\">Hash senarai: ' + esc(c.hashSenarai) + (c.benih !== '-' ? ' · Benih: ' + esc(c.benih) : '') + '</div>' +\n        (c.catatan ? '<div class=\"kecil\">' + esc(c.catatan) + '</div>' : '') +\n        (c.status === 'AKTIF' && SAYA.peranan === 'UTAMA' ? '<button class=\"butang butang-garis butang-kecil\" style=\"margin-top:8px\" data-batal=\"' + esc(c.id) + '\">Batalkan (dengan sebab)</button>' : '') + '</div>';\n    }).join('') : '<p class=\"kecil\">Belum ada cabutan.</p>';\n    Array.prototype.forEach.call($('cSenarai').querySelectorAll('[data-batal]'), function (b) {\n      b.onclick = function () {\n        var sebab = prompt('Sebab pembatalan ' + b.dataset.batal + ' (akan direkod dalam audit):');\n        if (!sebab) return;\n        panggil('adminBatalCabutan', b.dataset.batal, sebab).then(function () { notis('Cabutan dibatalkan dan direkod.'); muatCabutan(); });\n      };\n    });\n  });\n}\n\n$('bCabut').onclick = function () {\n  var o = { kaedah: $('cKaedah').value, ujian: $('cJenis').value === 'UJIAN', bilPemenang: +$('cPemenang').value, bilSimpanan: +$('cSimpanan').value, hadiah: $('cHadiah').value };\n  var n = o.ujian ? ringkasan.layakUjian : ringkasan.layak;\n  if (!confirm((o.ujian ? 'CABUTAN UJIAN' : '⚠ CABUTAN RASMI — keputusan akan direkod secara kekal') + '\\n\\nKaedah: ' + (o.kaedah === 'RAWAK' ? 'Cabutan bertuah rawak' : 'Peserta terpantas') +\n    '\\nPeserta layak: ' + n + '\\nPemenang: ' + o.bilPemenang + ', Simpanan: ' + o.bilSimpanan + '\\n\\nTeruskan?')) return;\n  $('bCabut').disabled = true;\n  panggil('adminJalankanCabutan', o).then(function (c) {\n    $('bCabut').disabled = false;\n    $('cHasil').innerHTML = '<div class=\"kotak-info\"><strong>Keputusan direkod: ' + esc(c.id) + '</strong> — buka <a href=\"' + esc(DATA.url + '?p=paparan' + (o.ujian ? '&ujian=1' : '')) + '\" target=\"_blank\" rel=\"noopener\">paparan siaran langsung</a> untuk mendedahkan pemenang satu per satu.</div>' +\n      c.pemenang.map(function (p) { return '<div class=\"pemenang-hasil\">🏆 #' + p.kedudukan + ' <strong class=\"mono\">' + esc(p.id) + '</strong> ' + esc(p.nama) + '</div>'; }).join('') +\n      c.simpanan.map(function (p) { return '<div class=\"pemenang-hasil\" style=\"background:#fff\">Simpanan #' + p.kedudukan + ' <span class=\"mono\">' + esc(p.id) + '</span> ' + esc(p.nama) + '</div>'; }).join('');\n    muatCabutan();\n  }, function () { $('bCabut').disabled = false; });\n};\n\nfunction muatAudit() {\n  $('aBadan').innerHTML = '<tr><td colspan=\"5\">Memuatkan…</td></tr>';\n  panggil('adminAudit').then(function (r) {\n    $('aBadan').innerHTML = r.map(function (a) {\n      return '<tr><td class=\"kecil\">' + esc(a.masa) + '</td><td>' + esc(a.pentadbir) + '</td><td>' + esc(a.tindakan) + '</td><td class=\"mono\">' + esc(a.sasaran) + '</td><td class=\"sorok-mudah-alih kecil\">' + esc(a.butiran) + '</td></tr>';\n    }).join('');\n  });\n}\n\nfunction muatTetapan() {\n  panggil('adminRingkasan').then(function (r) {\n    var f = $('fTetapan'), t = r.tetapan;\n    Object.keys(t).forEach(function (k) {\n      var el = f.elements[k]; if (!el) return;\n      if (el.type === 'checkbox') el.checked = !!t[k];\n      else if (k === 'saluran') el.value = t[k].join('\\n');\n      else el.value = t[k];\n    });\n  });\n}\n$('fTetapan').onsubmit = function (e) {\n  e.preventDefault();\n  var f = this, t = {};\n  Array.prototype.forEach.call(f.elements, function (el) {\n    if (!el.name) return;\n    t[el.name] = el.type === 'checkbox' ? el.checked : el.value;\n  });\n  t.saluran = t.saluran.split('\\n');\n  panggil('adminSimpanTetapan', t).then(function () { notis('Tetapan disimpan.'); muatTetapan(); });\n};\n$('bJanaUjian').onclick = function () { panggil('adminJanaDataUjian', 30).then(function (n) { notis(n + ' penyertaan ujian dijana.'); }); };\n$('bPadamUjian').onclick = function () { if (confirm('Padam SEMUA data ujian (termasuk fail resit ujian)?')) panggil('adminPadamDataUjian').then(function (n) { notis(n + ' rekod ujian dipadam.'); }); };\n\nfunction paparKata(r) {\n  $('modalIsi').innerHTML = '<button class=\"tutup\">×</button><h3>Kata laluan sementara</h3><p>Berikan maklumat ini kepada staf secara peribadi (bukan dalam kumpulan WhatsApp). Ia hanya dipaparkan SEKALI.</p>' +\n    '<dl class=\"butiran\"><dt>Nama pengguna</dt><dd class=\"mono\">' + esc(r.pengguna) + '</dd><dt>Kata laluan</dt><dd class=\"mono\" style=\"font-size:1.2rem\">' + esc(r.kataSementara) + '</dd>' +\n    '<dt>Pautan</dt><dd class=\"mono\" style=\"font-size:12px\">' + esc(DATA.url + '?p=admin') + '</dd></dl>';\n  $('modal').classList.remove('tersembunyi');\n  $('modalIsi').querySelector('.tutup').onclick = tutupModal;\n}\nfunction muatPentadbir() {\n  panggil('adminSenaraiPentadbir').then(function (r) {\n    $('tpBadan').innerHTML = r.map(function (p) {\n      return '<tr><td class=\"mono\">' + esc(p.pengguna) + '</td><td>' + esc(p.nama) + '</td><td>' + esc(p.peranan) + '</td><td>' + (p.aktif ? 'Aktif' : 'Tidak aktif') + (p.mestiTukar ? ' <span class=\"kecil\">(belum tukar kata laluan)</span>' : '') + '</td>' +\n        '<td><button class=\"butang butang-garis butang-kecil\" data-reset=\"' + esc(p.pengguna) + '\">Set semula kata laluan</button> ' +\n        (p.pengguna !== SAYA.pengguna ? '<button class=\"butang butang-garis butang-kecil\" data-aktif=\"' + esc(p.pengguna) + '\" data-nilai=\"' + (!p.aktif) + '\">' + (p.aktif ? 'Nyahaktif' : 'Aktifkan') + '</button>' : '') + '</td></tr>';\n    }).join('');\n    Array.prototype.forEach.call($('tpBadan').querySelectorAll('[data-reset]'), function (b) {\n      b.onclick = function () { if (confirm('Set semula kata laluan ' + b.dataset.reset + '?')) panggil('adminSetSemulaKata', b.dataset.reset).then(function (x) { paparKata(x); muatPentadbir(); }); };\n    });\n    Array.prototype.forEach.call($('tpBadan').querySelectorAll('[data-aktif]'), function (b) {\n      b.onclick = function () { panggil('adminTukarAktif', b.dataset.aktif, b.dataset.nilai === 'true').then(muatPentadbir); };\n    });\n  });\n}\n$('bTambahPentadbir').onclick = function () {\n  panggil('adminTambahPentadbir', { pengguna: $('tpPengguna').value, nama: $('tpNama').value, peranan: $('tpPeranan').value })\n    .then(function (r) { $('tpPengguna').value = ''; $('tpNama').value = ''; paparKata(r); muatPentadbir(); });\n};\n\n(function () {\n  TOKEN = baca('tk');\n  try { SAYA = JSON.parse(baca('saya') || 'null'); } catch (e) { SAYA = null; }\n  if (TOKEN && SAYA && !SAYA.mestiTukar) masuk(); else if (TOKEN && SAYA) tunjuk('vTukarKata');\n})();\n</script>\n</body>\n</html>\n","Paparan":"<!DOCTYPE html>\n<html lang=\"ms\">\n<head>\n<base target=\"_top\">\n<meta charset=\"utf-8\">\n<style>:root {\n  --hijau: #0b5d3b; --hijau-gelap: #073d27; --hijau-muda: #e7f3ec;\n  --emas: #c9a227; --emas-muda: #fbf3d9;\n  --teks: #1d2a24; --teks-lembut: #55645c; --garis: #d6ded9; --latar: #f4f6f3; --kad: #ffffff;\n  --merah: #b42318; --merah-muda: #fdecea; --oren: #b54708; --oren-muda: #fef0c7; --biru: #175cd3; --biru-muda: #e8f0fe;\n  --jejari: 12px;\n}\n* { box-sizing: border-box; }\nhtml, body { margin: 0; padding: 0; }\nbody { font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif;\n  font-size: 17px; line-height: 1.5; color: var(--teks); background: var(--latar); -webkit-text-size-adjust: 100%; }\na { color: var(--hijau); }\nh1, h2, h3 { line-height: 1.25; margin: 0 0 .5em; }\n.bekas { max-width: 640px; margin: 0 auto; padding: 16px; }\n.kad { background: var(--kad); border-radius: var(--jejari); box-shadow: 0 1px 3px rgba(0,0,0,.08); padding: 20px; margin-bottom: 16px; }\n.kepala { background: linear-gradient(135deg, var(--hijau-gelap), var(--hijau)); color: #fff; padding: 20px 16px 28px; text-align: center; }\n.kepala h1 { font-size: 1.45rem; margin: 10px 0 4px; letter-spacing: .3px; }\n.kepala p { margin: 0; opacity: .92; font-size: .95rem; }\n.kepala .emas { color: var(--emas); }\n.logo-ruang { display: inline-flex; align-items: center; justify-content: center; min-width: 120px; height: 56px; padding: 0 12px;\n  border: 2px dashed rgba(255,255,255,.6); border-radius: 8px; font-size: .75rem; font-weight: 600; letter-spacing: .5px; }\n.logo-ruang img { max-height: 56px; max-width: 200px; }\n.logo-sebenar { border: none; }\nlabel.tajuk { display: block; font-weight: 600; margin: 16px 0 6px; }\nlabel.tajuk .wajib { color: var(--merah); }\n.bantuan { font-size: .85rem; color: var(--teks-lembut); margin-top: 4px; }\ninput[type=text], input[type=tel], input[type=number], input[type=date], input[type=password], input[type=datetime-local], select, textarea {\n  width: 100%; font-size: 17px; padding: 12px 14px; border: 1.5px solid var(--garis); border-radius: 10px; background: #fff; color: var(--teks);\n  font-family: inherit; appearance: none; -webkit-appearance: none; min-height: 48px; }\nselect { background-image: linear-gradient(45deg, transparent 50%, var(--teks-lembut) 50%), linear-gradient(135deg, var(--teks-lembut) 50%, transparent 50%);\n  background-position: calc(100% - 20px) 50%, calc(100% - 14px) 50%; background-size: 6px 6px; background-repeat: no-repeat; padding-right: 36px; }\ninput:focus, select:focus, textarea:focus { outline: 3px solid rgba(11,93,59,.25); border-color: var(--hijau); }\n.salah input, .salah select, .salah .pilih-fail { border-color: var(--merah); }\n.mesej-salah { color: var(--merah); font-size: .88rem; margin-top: 4px; display: none; }\n.salah .mesej-salah { display: block; }\n.awalan { position: relative; }\n.awalan span { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--teks-lembut); font-weight: 600; }\n.awalan input { padding-left: 48px; }\n.pilih-fail { display: block; border: 2px dashed var(--garis); border-radius: 10px; padding: 18px; text-align: center; cursor: pointer; background: #fafcfb; }\n.pilih-fail input { position: absolute; width: 1px; height: 1px; opacity: 0; }\n.pilih-fail strong { color: var(--hijau); }\n.pratonton { margin-top: 10px; font-size: .9rem; display: none; align-items: center; gap: 10px; }\n.pratonton img { max-width: 80px; max-height: 80px; border-radius: 6px; border: 1px solid var(--garis); }\n.semak { display: flex; gap: 12px; align-items: flex-start; margin: 14px 0 0; font-size: .95rem; cursor: pointer; }\n.semak input { width: 24px; height: 24px; flex: 0 0 24px; margin-top: 1px; accent-color: var(--hijau); }\n.butang { display: inline-flex; align-items: center; justify-content: center; gap: 8px; border: none; border-radius: 10px; padding: 12px 18px;\n  font-size: 16px; font-weight: 600; cursor: pointer; min-height: 48px; text-decoration: none; font-family: inherit; }\n.butang-utama { background: var(--hijau); color: #fff; width: 100%; font-size: 18px; min-height: 56px; margin-top: 22px; }\n.butang-utama:disabled { opacity: .6; cursor: wait; }\n.butang-hijau { background: var(--hijau); color: #fff; } .butang-merah { background: var(--merah); color: #fff; }\n.butang-oren { background: var(--oren); color: #fff; } .butang-garis { background: #fff; color: var(--hijau); border: 1.5px solid var(--hijau); }\n.butang-emas { background: var(--emas); color: #1d1600; }\n.butang-kecil { min-height: 36px; padding: 6px 12px; font-size: 14px; }\n.kotak-info { background: var(--emas-muda); border-left: 4px solid var(--emas); padding: 12px 14px; border-radius: 8px; font-size: .92rem; }\n.kotak-amaran { background: var(--merah-muda); border-left: 4px solid var(--merah); padding: 12px 14px; border-radius: 8px; }\n.kotak-ujian { background: var(--biru-muda); border: 2px solid var(--biru); color: var(--biru); padding: 10px 14px; border-radius: 8px; font-weight: 600; text-align: center; }\n.berjaya { text-align: center; }\n.berjaya .ikon { width: 72px; height: 72px; border-radius: 50%; background: var(--hijau-muda); color: var(--hijau); font-size: 40px; line-height: 72px; margin: 0 auto 12px; }\n.id-besar { font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 1.5rem; font-weight: 700; background: var(--emas-muda);\n  border: 2px solid var(--emas); padding: 10px 14px; border-radius: 10px; display: inline-block; margin: 8px 0; letter-spacing: 1px; word-break: break-all; }\n.kaki { text-align: center; font-size: .82rem; color: var(--teks-lembut); padding: 8px 16px 32px; }\n.lencana { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: .78rem; font-weight: 700; white-space: nowrap; }\n.l-menunggu { background: var(--oren-muda); color: var(--oren); } .l-semakan { background: #fde2e1; color: #912018; }\n.l-lulus { background: var(--hijau-muda); color: var(--hijau); } .l-ditolak { background: #eaecf0; color: #344054; }\n.l-pembetulan { background: var(--biru-muda); color: var(--biru); } .l-ujian { background: var(--biru); color: #fff; }\n.tersembunyi { display: none !important; }\n.pemutar { width: 20px; height: 20px; border: 3px solid rgba(255,255,255,.4); border-top-color: #fff; border-radius: 50%; animation: putar 0.8s linear infinite; }\n@keyframes putar { to { transform: rotate(360deg); } }\n.kemajuan { height: 6px; background: var(--garis); border-radius: 3px; overflow: hidden; margin-top: 12px; }\n.kemajuan div { height: 100%; width: 30%; background: var(--hijau); animation: gerak 1.2s ease-in-out infinite; }\n@keyframes gerak { 0% { margin-left: -30%; } 100% { margin-left: 100%; } }\n@media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }\n\nbody { background: radial-gradient(ellipse at top, #0f7a4e 0%, #073d27 60%, #04261a 100%); color: #fff; min-height: 100vh; }\n.pentas { max-width: 1100px; margin: 0 auto; padding: 24px 16px 48px; text-align: center; }\n.pentas h1 { font-size: clamp(1.6rem, 4vw, 3rem); margin: 12px 0 0; }\n.pentas h1 .emas { color: var(--emas); }\n.sub { opacity: .85; font-size: clamp(1rem, 2vw, 1.3rem); margin-bottom: 20px; }\n.gulung { font-family: ui-monospace, Menlo, Consolas, monospace; font-size: clamp(2rem, 7vw, 5rem); font-weight: 800; color: var(--emas);\n  background: rgba(0,0,0,.25); border: 3px solid var(--emas); border-radius: 20px; padding: 18px; margin: 18px auto; max-width: 760px; min-height: 1.6em; }\n.senarai { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); margin-top: 18px; text-align: left; }\n.pemenang { background: rgba(255,255,255,.08); border: 1px solid rgba(201,162,39,.6); border-radius: 14px; padding: 14px 16px; animation: muncul .6s ease-out; }\n.pemenang .no { color: var(--emas); font-weight: 800; font-size: .95rem; }\n.pemenang .idp { font-family: ui-monospace, Menlo, monospace; font-size: 1.25rem; font-weight: 700; }\n.pemenang .nm { opacity: .9; }\n.simpanan { border-color: rgba(255,255,255,.25); }\n@keyframes muncul { from { transform: scale(.85); opacity: 0; } to { transform: none; opacity: 1; } }\n.kawalan { margin-top: 24px; display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }\n.audit { margin-top: 28px; font-size: .78rem; opacity: .7; word-break: break-all; }\n.tab { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; margin: 14px 0; }\n.tab button { background: rgba(255,255,255,.1); color: #fff; border: 1px solid rgba(255,255,255,.3); }\n.tab button.aktif { background: var(--emas); color: #1d1600; border-color: var(--emas); }\n</style>\n</head>\n<body>\n<div class=\"pentas\">\n  <div class=\"logo-ruang\">LOGO RASMI YAPEIM</div>\n  <div id=\"labelUjian\" class=\"kotak-ujian tersembunyi\" style=\"margin:12px auto;max-width:600px\">PAPARAN UJIAN — BUKAN KEPUTUSAN RASMI</div>\n  <h1>INFAQ DAN MENANG <span class=\"emas\">GOLDBAR</span></h1>\n  <div class=\"sub\">YAPEIM Sarawak · <span id=\"tajukKaedah\">Keputusan</span></div>\n  <div class=\"tab\" id=\"tab\"></div>\n  <div id=\"kosong\" class=\"tersembunyi\" style=\"margin-top:40px;font-size:1.3rem\">Keputusan belum diumumkan.</div>\n  <div id=\"maklumat\" class=\"sub\"></div>\n  <div class=\"gulung\" id=\"gulung\">— — —</div>\n  <div class=\"kawalan\">\n    <button class=\"butang butang-emas\" id=\"dedah\">▶ Dedahkan pemenang seterusnya</button>\n    <button class=\"butang butang-garis\" id=\"dedahSemua\">Dedahkan semua</button>\n  </div>\n  <h2 id=\"tajukPemenang\" class=\"tersembunyi\" style=\"margin-top:28px;color:var(--emas)\">Pemenang</h2>\n  <div class=\"senarai\" id=\"senaraiPemenang\"></div>\n  <h3 id=\"tajukSimpanan\" class=\"tersembunyi\" style=\"margin-top:24px\">Pemenang Simpanan</h3>\n  <div class=\"senarai\" id=\"senaraiSimpanan\"></div>\n  <div class=\"audit\" id=\"audit\"></div>\n</div>\n<script>\nvar DATA = /*__DATA__*/null;\nvar cabutan = [], semasa = null, didedah = 0, giliran = [], sedangGulung = false;\nfunction $(id) { return document.getElementById(id); }\nif (DATA.ujian) $('labelUjian').classList.remove('tersembunyi');\n\ngoogle.script.run.withSuccessHandler(function (res) {\n  if (!res || !res.ok || !res.cabutan.length) { $('kosong').classList.remove('tersembunyi'); sorok(); return; }\n  cabutan = res.cabutan;\n  cabutan.forEach(function (c, i) {\n    var b = document.createElement('button');\n    b.className = 'butang butang-kecil';\n    b.textContent = c.kaedah === 'RAWAK' ? 'Cabutan Bertuah' : 'Peserta Terpantas';\n    b.onclick = function () { pilih(i); };\n    $('tab').appendChild(b);\n  });\n  pilih(0);\n}).withFailureHandler(function () { $('kosong').textContent = 'Keputusan tidak dapat dimuatkan.'; $('kosong').classList.remove('tersembunyi'); sorok(); })\n  .paparanKeputusan(!!DATA.ujian);\n\nfunction sorok() { ['gulung', 'dedah', 'dedahSemua'].forEach(function (x) { $(x).classList.add('tersembunyi'); }); }\n\nfunction pilih(i) {\n  semasa = cabutan[i];\n  Array.prototype.forEach.call($('tab').children, function (b, j) { b.classList.toggle('aktif', i === j); });\n  $('tajukKaedah').textContent = semasa.kaedah === 'RAWAK' ? 'Cabutan Bertuah' : 'Peserta Terpantas';\n  $('maklumat').textContent = (semasa.hadiah ? 'Hadiah: ' + semasa.hadiah + ' · ' : '') + semasa.bilLayak + ' penyertaan layak · ' + semasa.masa;\n  $('audit').textContent = 'ID Cabutan: ' + semasa.id + ' · Hash senarai layak: ' + semasa.hashSenarai + (semasa.benih !== '-' ? ' · Benih: ' + semasa.benih : '');\n  $('senaraiPemenang').innerHTML = ''; $('senaraiSimpanan').innerHTML = '';\n  $('tajukPemenang').classList.add('tersembunyi'); $('tajukSimpanan').classList.add('tersembunyi');\n  giliran = semasa.pemenang.map(function (p) { return { p: p, simpanan: false }; })\n    .concat(semasa.simpanan.map(function (p) { return { p: p, simpanan: true }; }));\n  didedah = 0;\n  $('gulung').textContent = '— — —';\n  $('dedah').disabled = false; $('dedahSemua').disabled = false;\n  $('dedah').classList.remove('tersembunyi'); $('dedahSemua').classList.remove('tersembunyi'); $('gulung').classList.remove('tersembunyi');\n}\n\nfunction kad(item) {\n  var d = document.createElement('div');\n  d.className = 'pemenang' + (item.simpanan ? ' simpanan' : '');\n  var no = document.createElement('div'); no.className = 'no';\n  no.textContent = (item.simpanan ? 'Simpanan ' : (semasa.kaedah === 'TERPANTAS' ? 'Kedudukan ' : 'Pemenang ')) + '#' + item.p.kedudukan;\n  var idp = document.createElement('div'); idp.className = 'idp'; idp.textContent = item.p.id;\n  var nm = document.createElement('div'); nm.className = 'nm'; nm.textContent = item.p.nama;\n  d.appendChild(no); d.appendChild(idp); d.appendChild(nm);\n  (item.simpanan ? $('senaraiSimpanan') : $('senaraiPemenang')).appendChild(d);\n  $(item.simpanan ? 'tajukSimpanan' : 'tajukPemenang').classList.remove('tersembunyi');\n}\n\nfunction dedah(segera) {\n  if (sedangGulung || didedah >= giliran.length) return;\n  var item = giliran[didedah++];\n  if (didedah >= giliran.length) { $('dedah').disabled = true; $('dedahSemua').disabled = true; }\n  if (segera || semasa.kaedah === 'TERPANTAS') { $('gulung').textContent = item.p.id; kad(item); return; }\n  sedangGulung = true;\n  var awalan = item.p.id.split('-')[0];\n  var mula = Date.now();\n  function rawak(n, aksara) { var s = ''; while (s.length < n) s += aksara.charAt(Math.floor(Math.random() * aksara.length)); return s; }\n  (function langkah() {\n    var t = Date.now() - mula;\n    if (t < 3000) {\n      // ID rawak semata-mata untuk kesan visual — keputusan sebenar telah ditetapkan & direkod oleh pelayan\n      $('gulung').textContent = awalan + '-' + rawak(5, '0123456789') + '-' + rawak(4, 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789');\n      setTimeout(langkah, 40 + t / 30);\n    } else {\n      $('gulung').textContent = item.p.id;\n      kad(item);\n      sedangGulung = false;\n    }\n  })();\n}\n$('dedah').onclick = function () { dedah(false); };\n$('dedahSemua').onclick = function () { while (didedah < giliran.length) dedah(true); };\ndocument.addEventListener('keydown', function (e) { if (e.code === 'Space' || e.code === 'ArrowRight') { e.preventDefault(); dedah(false); } });\n</script>\n</body>\n</html>\n","Privasi":"<!DOCTYPE html>\n<html lang=\"ms\">\n<head>\n<base target=\"_top\">\n<meta charset=\"utf-8\">\n<style>:root {\n  --hijau: #0b5d3b; --hijau-gelap: #073d27; --hijau-muda: #e7f3ec;\n  --emas: #c9a227; --emas-muda: #fbf3d9;\n  --teks: #1d2a24; --teks-lembut: #55645c; --garis: #d6ded9; --latar: #f4f6f3; --kad: #ffffff;\n  --merah: #b42318; --merah-muda: #fdecea; --oren: #b54708; --oren-muda: #fef0c7; --biru: #175cd3; --biru-muda: #e8f0fe;\n  --jejari: 12px;\n}\n* { box-sizing: border-box; }\nhtml, body { margin: 0; padding: 0; }\nbody { font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif;\n  font-size: 17px; line-height: 1.5; color: var(--teks); background: var(--latar); -webkit-text-size-adjust: 100%; }\na { color: var(--hijau); }\nh1, h2, h3 { line-height: 1.25; margin: 0 0 .5em; }\n.bekas { max-width: 640px; margin: 0 auto; padding: 16px; }\n.kad { background: var(--kad); border-radius: var(--jejari); box-shadow: 0 1px 3px rgba(0,0,0,.08); padding: 20px; margin-bottom: 16px; }\n.kepala { background: linear-gradient(135deg, var(--hijau-gelap), var(--hijau)); color: #fff; padding: 20px 16px 28px; text-align: center; }\n.kepala h1 { font-size: 1.45rem; margin: 10px 0 4px; letter-spacing: .3px; }\n.kepala p { margin: 0; opacity: .92; font-size: .95rem; }\n.kepala .emas { color: var(--emas); }\n.logo-ruang { display: inline-flex; align-items: center; justify-content: center; min-width: 120px; height: 56px; padding: 0 12px;\n  border: 2px dashed rgba(255,255,255,.6); border-radius: 8px; font-size: .75rem; font-weight: 600; letter-spacing: .5px; }\n.logo-ruang img { max-height: 56px; max-width: 200px; }\n.logo-sebenar { border: none; }\nlabel.tajuk { display: block; font-weight: 600; margin: 16px 0 6px; }\nlabel.tajuk .wajib { color: var(--merah); }\n.bantuan { font-size: .85rem; color: var(--teks-lembut); margin-top: 4px; }\ninput[type=text], input[type=tel], input[type=number], input[type=date], input[type=password], input[type=datetime-local], select, textarea {\n  width: 100%; font-size: 17px; padding: 12px 14px; border: 1.5px solid var(--garis); border-radius: 10px; background: #fff; color: var(--teks);\n  font-family: inherit; appearance: none; -webkit-appearance: none; min-height: 48px; }\nselect { background-image: linear-gradient(45deg, transparent 50%, var(--teks-lembut) 50%), linear-gradient(135deg, var(--teks-lembut) 50%, transparent 50%);\n  background-position: calc(100% - 20px) 50%, calc(100% - 14px) 50%; background-size: 6px 6px; background-repeat: no-repeat; padding-right: 36px; }\ninput:focus, select:focus, textarea:focus { outline: 3px solid rgba(11,93,59,.25); border-color: var(--hijau); }\n.salah input, .salah select, .salah .pilih-fail { border-color: var(--merah); }\n.mesej-salah { color: var(--merah); font-size: .88rem; margin-top: 4px; display: none; }\n.salah .mesej-salah { display: block; }\n.awalan { position: relative; }\n.awalan span { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--teks-lembut); font-weight: 600; }\n.awalan input { padding-left: 48px; }\n.pilih-fail { display: block; border: 2px dashed var(--garis); border-radius: 10px; padding: 18px; text-align: center; cursor: pointer; background: #fafcfb; }\n.pilih-fail input { position: absolute; width: 1px; height: 1px; opacity: 0; }\n.pilih-fail strong { color: var(--hijau); }\n.pratonton { margin-top: 10px; font-size: .9rem; display: none; align-items: center; gap: 10px; }\n.pratonton img { max-width: 80px; max-height: 80px; border-radius: 6px; border: 1px solid var(--garis); }\n.semak { display: flex; gap: 12px; align-items: flex-start; margin: 14px 0 0; font-size: .95rem; cursor: pointer; }\n.semak input { width: 24px; height: 24px; flex: 0 0 24px; margin-top: 1px; accent-color: var(--hijau); }\n.butang { display: inline-flex; align-items: center; justify-content: center; gap: 8px; border: none; border-radius: 10px; padding: 12px 18px;\n  font-size: 16px; font-weight: 600; cursor: pointer; min-height: 48px; text-decoration: none; font-family: inherit; }\n.butang-utama { background: var(--hijau); color: #fff; width: 100%; font-size: 18px; min-height: 56px; margin-top: 22px; }\n.butang-utama:disabled { opacity: .6; cursor: wait; }\n.butang-hijau { background: var(--hijau); color: #fff; } .butang-merah { background: var(--merah); color: #fff; }\n.butang-oren { background: var(--oren); color: #fff; } .butang-garis { background: #fff; color: var(--hijau); border: 1.5px solid var(--hijau); }\n.butang-emas { background: var(--emas); color: #1d1600; }\n.butang-kecil { min-height: 36px; padding: 6px 12px; font-size: 14px; }\n.kotak-info { background: var(--emas-muda); border-left: 4px solid var(--emas); padding: 12px 14px; border-radius: 8px; font-size: .92rem; }\n.kotak-amaran { background: var(--merah-muda); border-left: 4px solid var(--merah); padding: 12px 14px; border-radius: 8px; }\n.kotak-ujian { background: var(--biru-muda); border: 2px solid var(--biru); color: var(--biru); padding: 10px 14px; border-radius: 8px; font-weight: 600; text-align: center; }\n.berjaya { text-align: center; }\n.berjaya .ikon { width: 72px; height: 72px; border-radius: 50%; background: var(--hijau-muda); color: var(--hijau); font-size: 40px; line-height: 72px; margin: 0 auto 12px; }\n.id-besar { font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 1.5rem; font-weight: 700; background: var(--emas-muda);\n  border: 2px solid var(--emas); padding: 10px 14px; border-radius: 10px; display: inline-block; margin: 8px 0; letter-spacing: 1px; word-break: break-all; }\n.kaki { text-align: center; font-size: .82rem; color: var(--teks-lembut); padding: 8px 16px 32px; }\n.lencana { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: .78rem; font-weight: 700; white-space: nowrap; }\n.l-menunggu { background: var(--oren-muda); color: var(--oren); } .l-semakan { background: #fde2e1; color: #912018; }\n.l-lulus { background: var(--hijau-muda); color: var(--hijau); } .l-ditolak { background: #eaecf0; color: #344054; }\n.l-pembetulan { background: var(--biru-muda); color: var(--biru); } .l-ujian { background: var(--biru); color: #fff; }\n.tersembunyi { display: none !important; }\n.pemutar { width: 20px; height: 20px; border: 3px solid rgba(255,255,255,.4); border-top-color: #fff; border-radius: 50%; animation: putar 0.8s linear infinite; }\n@keyframes putar { to { transform: rotate(360deg); } }\n.kemajuan { height: 6px; background: var(--garis); border-radius: 3px; overflow: hidden; margin-top: 12px; }\n.kemajuan div { height: 100%; width: 30%; background: var(--hijau); animation: gerak 1.2s ease-in-out infinite; }\n@keyframes gerak { 0% { margin-left: -30%; } 100% { margin-left: 100%; } }\n@media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }\n .kad h2 { font-size: 1.15rem; color: var(--hijau); margin-top: 1.2em; } .kad li { margin-bottom: 6px; }</style>\n</head>\n<body>\n<header class=\"kepala\">\n  <div class=\"logo-ruang\">LOGO RASMI YAPEIM</div>\n  <h1>Notis Privasi &amp; Syarat Kempen</h1>\n  <p id=\"namaKempen\"></p>\n</header>\n<main class=\"bekas\">\n  <div class=\"kotak-amaran\" style=\"margin-bottom:16px;font-size:.9rem\"><strong>DRAF</strong> — Kandungan ini perlu disemak dan diluluskan oleh pihak pengurusan / penasihat undang-undang YAPEIM sebelum kempen dilancarkan.</div>\n  <article class=\"kad\">\n    <h2 style=\"margin-top:0\">A. Notis Privasi (Akta Perlindungan Data Peribadi 2010)</h2>\n    <ol>\n      <li><strong>Data yang dikumpul:</strong> nama penuh, nombor telefon, jumlah, tarikh dan kaedah sumbangan, nombor rujukan transaksi (jika diberi) serta salinan resit sumbangan.</li>\n      <li><strong>Tujuan:</strong> mengesahkan sumbangan, menentukan kelayakan dan pemenang kempen, menghubungi pemenang, serta rekod dan laporan dalaman YAPEIM Sarawak.</li>\n      <li><strong>Pendedahan:</strong> data anda tidak akan dijual atau didedahkan kepada pihak ketiga. Hanya pegawai YAPEIM yang diberi kuasa boleh melihat data dan resit. Semasa pengumuman pemenang, hanya ID penyertaan dan nama yang ditopeng sebahagiannya dipaparkan.</li>\n      <li><strong>Penyimpanan:</strong> data disimpan dalam akaun Google rasmi organisasi yang dilindungi, dan akan disimpan selama <span id=\"tempoh\"></span>, kemudian dipadam atau diarkibkan mengikut dasar organisasi.</li>\n      <li><strong>Hak anda:</strong> anda boleh meminta akses, pembetulan atau penarikan balik data anda. Penarikan balik sebelum cabutan akan menyebabkan penyertaan tidak lagi layak.</li>\n      <li><strong>Pertanyaan berkaitan data:</strong> <span id=\"hubungi\"></span></li>\n    </ol>\n\n    <h2>B. Syarat Kempen</h2>\n    <ol>\n      <li>Kempen terbuka kepada orang awam yang membuat sumbangan infaq kepada YAPEIM Sarawak dalam tempoh kempen: <strong id=\"tempohKempen\"></strong>.</li>\n      <li id=\"syaratMin\"></li>\n      <li>Setiap penyertaan mesti disertakan resit sumbangan yang sah. Semua resit akan disemak oleh pegawai YAPEIM. Penyertaan hanya layak selepas resit disahkan (status LULUS).</li>\n      <li>Penyertaan dengan maklumat palsu, resit yang diubah, resit berulang atau tidak dapat disahkan akan ditolak.</li>\n      <li id=\"syaratSatu\"></li>\n      <li><strong>Peserta terpantas:</strong> kedudukan ditentukan oleh cap masa pelayan sistem semasa borang diterima (bukan tarikh yang diisi oleh peserta). Jika dua penyertaan mempunyai cap masa yang sama sehingga milisaat, penyertaan yang diproses dahulu oleh sistem (nombor turutan lebih kecil) diberi kedudukan lebih awal. Hanya penyertaan yang disahkan layak diambil kira.</li>\n      <li><strong>Cabutan bertuah:</strong> dibuat secara rawak oleh sistem selepas tempoh kempen tamat dan semua resit telah disemak, daripada senarai penyertaan yang layak sahaja. Setiap cabutan direkodkan bersama senarai peserta layak, nilai benih rawak dan pemenang supaya ia boleh diaudit.</li>\n      <li>Pemenang simpanan akan dipilih sekiranya pemenang utama tidak dapat dihubungi atau tidak layak.</li>\n      <li>Pemenang akan dihubungi melalui nombor telefon yang didaftarkan. YAPEIM tidak akan meminta sebarang bayaran untuk menuntut hadiah.</li>\n      <li>Keputusan YAPEIM Sarawak adalah muktamad. YAPEIM berhak meminda syarat dengan notis.</li>\n    </ol>\n  </article>\n  <p style=\"text-align:center\"><a id=\"kembali\" href=\"#\" class=\"butang butang-garis\">← Kembali ke borang</a></p>\n</main>\n<script>\nvar DATA = /*__DATA__*/null;\n(function () {\n  var t = DATA.tetapan;\n  function teksMasa(s) {\n    var b = ['Jan','Feb','Mac','Apr','Mei','Jun','Jul','Ogo','Sep','Okt','Nov','Dis'];\n    var m = /^(\\d{4})-(\\d{2})-(\\d{2})(?:T(\\d{2}):(\\d{2}))?/.exec(s || '');\n    return m ? (+m[3]) + ' ' + b[+m[2] - 1] + ' ' + m[1] + (m[4] ? ', ' + m[4] + ':' + m[5] : '') : 'akan diumumkan';\n  }\n  document.getElementById('namaKempen').textContent = t.namaKempen;\n  document.getElementById('tempoh').textContent = t.tempohSimpanData || 'tempoh yang diluluskan organisasi';\n  var h = [];\n  if (t.emelPertanyaan) h.push('emel ' + t.emelPertanyaan);\n  if (t.telefonPertanyaan) h.push('telefon ' + t.telefonPertanyaan);\n  document.getElementById('hubungi').textContent = h.length ? 'Hubungi YAPEIM Sarawak melalui ' + h.join(' atau ') + '.' : 'Hubungi pejabat YAPEIM Sarawak.';\n  document.getElementById('tempohKempen').textContent = teksMasa(t.tarikhMula) + ' hingga ' + teksMasa(t.tarikhTamat) + ' (waktu Malaysia)';\n  document.getElementById('syaratMin').textContent = 'Sumbangan minimum bagi setiap penyertaan ialah RM ' + Number(t.minSumbangan || 0).toFixed(2) + '.';\n  document.getElementById('syaratSatu').textContent = t.satuPeluangSetiapTelefon\n    ? 'Setiap nombor telefon hanya dikira SEKALI dalam senarai peserta terpantas dan cabutan bertuah (penyertaan layak yang terawal digunakan).'\n    : 'Setiap penyertaan yang layak dikira sebagai satu peluang.';\n  document.getElementById('kembali').href = DATA.url;\n})();\n</script>\n</body>\n</html>\n"};

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
