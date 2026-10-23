/**
 * Simulasi ringkas perkhidmatan Google Apps Script supaya dist/Code.gs
 * yang SEBENAR boleh dijalankan dan diuji dalam Node.
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const keBertanda = (buf) => Array.from(buf, (b) => (b > 127 ? b - 256 : b));
const keBuffer = (data) => (typeof data === 'string' ? Buffer.from(data, 'utf8') : Buffer.from(data.map((b) => (b + 256) % 256)));

class Julat {
  constructor(sheet, r, c, nr, nc) { Object.assign(this, { sheet, r, c, nr, nc }); }
  setValues(v) {
    if (v.length !== this.nr || v.some((row) => row.length !== this.nc)) throw new Error('Saiz julat tidak sepadan');
    v.forEach((row, i) => row.forEach((x, j) => this.sheet._set(this.r + i, this.c + j, x)));
    return this;
  }
  getValue() { return this.sheet._get(this.r, this.c); }
  getValues() {
    const out = [];
    for (let i = 0; i < this.nr; i++) { const row = []; for (let j = 0; j < this.nc; j++) row.push(this.sheet._get(this.r + i, this.c + j)); out.push(row); }
    return out;
  }
  setFontWeight() { return this; } setBackground() { return this; } setFontColor() { return this; } setNumberFormat() { return this; }
}

class Helaian {
  constructor(nama) { this.nama = nama; this.data = []; this.perlindungan = []; }
  _set(r, c, v) {
    if (typeof v === 'string' && /^[=+\-@]/.test(v)) throw new Error('SUNTIKAN FORMULA dikesan: ' + v);
    if (typeof v === 'string' && v.startsWith("'")) v = v.slice(1);
    while (this.data.length < r) this.data.push([]);
    this.data[r - 1][c - 1] = v;
  }
  _get(r, c) { const row = this.data[r - 1]; const v = row ? row[c - 1] : undefined; return v === undefined ? '' : v; }
  getName() { return this.nama; }
  getLastRow() { return this.data.length; }
  getMaxRows() { return Math.max(1000, this.data.length); }
  _lebar() { return this.data.reduce((m, r) => Math.max(m, r.length), 0); }
  getDataRange() { return new Julat(this, 1, 1, Math.max(this.data.length, 1), Math.max(this._lebar(), 1)); }
  getRange(r, c, nr = 1, nc = 1) { return new Julat(this, r, c, nr, nc); }
  appendRow(row) { const r = this.data.length + 1; row.forEach((v, j) => this._set(r, j + 1, v)); return this; }
  deleteRow(r) { this.data.splice(r - 1, 1); }
  setFrozenRows() {}
  protect() {
    const p = { setDescription() { return p; }, removeEditors() { return p; }, getEditors() { return []; }, canDomainEdit() { return false }, setDomainEdit() { return p; } };
    this.perlindungan.push(p);
    return p;
  }
  getProtections() { return this.perlindungan; }
}

function cipta(pilihan = {}) {
  const sifat = {};
  const cache = {};
  const fail = {};
  const helaian = {};
  let pembilangId = 0;
  const jam = { nilai: null };

  const hamparan = {
    getId: () => 'SS-UJIAN',
    getSheetByName: (n) => helaian[n] || null,
    insertSheet: (n) => (helaian[n] = new Helaian(n)),
    getSheets: () => Object.values(helaian),
    deleteSheet: (s) => { delete helaian[s.nama]; },
    setSpreadsheetTimeZone() {},
  };
  helaian.Sheet1 = new Helaian('Sheet1');

  const g = {
    console: pilihan.senyap ? { log() {}, error() {} } : console,
    PropertiesService: { getScriptProperties: () => ({
      getProperty: (k) => (k in sifat ? sifat[k] : null),
      setProperty: (k, v) => { sifat[k] = String(v); },
    }) },
    CacheService: { getScriptCache: () => ({
      get: (k) => (k in cache ? cache[k] : null),
      put: (k, v) => { cache[k] = String(v); },
      remove: (k) => { delete cache[k]; },
    }) },
    LockService: { getScriptLock: () => {
      let dipegang = false;
      return {
        waitLock: () => { if (g.__kunci) throw new Error('Kunci bersarang — akan tersekat dalam Apps Script'); g.__kunci = true; dipegang = true; },
        releaseLock: () => { if (dipegang) g.__kunci = false; dipegang = false; },
      };
    } },
    Utilities: {
      DigestAlgorithm: { SHA_256: 'sha256' },
      Charset: { UTF_8: 'utf8' },
      computeDigest: (alg, data) => keBertanda(crypto.createHash(alg).update(keBuffer(data)).digest()),
      computeHmacSha256Signature: (v, k) => keBertanda(crypto.createHmac('sha256', Buffer.from(k, 'utf8')).update(keBuffer(v)).digest()),
      getUuid: () => crypto.randomUUID(),
      base64Decode: (s) => {
        if (!/^[A-Za-z0-9+/=\s]*$/.test(s)) throw new Error('base64 tidak sah');
        return keBertanda(Buffer.from(s, 'base64'));
      },
      base64Encode: (b) => keBuffer(b).toString('base64'),
      newBlob: (bait, mime, nama) => ({ bait, mime, nama }),
    },
    SpreadsheetApp: {
      ProtectionType: { SHEET: 'SHEET' },
      getActiveSpreadsheet: () => hamparan,
      openById: (id) => { if (id !== 'SS-UJIAN') throw new Error('tiada'); return hamparan; },
      getUi: () => { throw new Error('Tiada UI'); },
    },
    DriveApp: {
      createFolder: (nama) => { const id = 'FOLDER-' + ++pembilangId; fail[id] = { folder: true, nama }; return { getId: () => id }; },
      getFolderById: (id) => {
        if (!fail[id] || !fail[id].folder) throw new Error('Folder tiada');
        return {
          getName: () => fail[id].nama,
          createFile: (blob) => { const fid = 'FAIL-' + ++pembilangId; fail[fid] = { ...blob, induk: id, sampah: false }; return { getId: () => fid }; },
        };
      },
      getFileById: (id) => {
        if (!fail[id]) throw new Error('Fail tiada');
        return { getBlob: () => ({ getBytes: () => fail[id].bait }), setTrashed: (t) => { fail[id].sampah = t; } };
      },
    },
    HtmlService: { createHtmlOutput: (html) => {
      const o = { html, tajuk: '', meta: {}, setTitle: (t) => { o.tajuk = t; return o; }, addMetaTag: (k, v) => { o.meta[k] = v; return o; }, getContent: () => o.html };
      return o;
    } },
    ScriptApp: { getService: () => ({ getUrl: () => 'https://script.google.com/macros/s/UJIAN/exec' }) },
  };

  const konteks = vm.createContext(g);
  vm.runInContext('var __asalNow = Date.now; Date.now = function () { return __jam.nilai === null ? __asalNow() : __jam.nilai; };', Object.assign(konteks, { __jam: jam }));
  const kod = fs.readFileSync(path.join(__dirname, '..', 'dist', 'Code.gs'), 'utf8');
  vm.runInContext(kod, konteks, { filename: 'Code.gs' });

  return {
    gs: konteks,
    sifat, cache, fail, helaian,
    /** Tetapkan masa pelayan (ms) atau null untuk masa sebenar. */
    setMasa: (ms) => { jam.nilai = ms; },
    sekarang: () => (jam.nilai === null ? Date.now() : jam.nilai),
    majuMasa: (ms) => { jam.nilai = (jam.nilai === null ? Date.now() : jam.nilai) + ms; },
  };
}

module.exports = { cipta };
