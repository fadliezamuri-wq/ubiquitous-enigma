// Jana buku resepi PDF: node fitness/buku/bina.mjs
// Keluaran: fitness/buku/keluaran/BentukBadan-100-Hidangan.pdf (dan .html untuk pratonton)
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { RESEPI } from "./resepi.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, "keluaran");
const GAMBAR = path.join(HERE, "gambar");
fs.mkdirSync(OUT, { recursive: true });

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const gambar = fs.existsSync(GAMBAR) ? fs.readdirSync(GAMBAR).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).sort() : [];
const kulit = gambar.find((f) => f.startsWith("kulit")) || gambar[0];
const dalam = gambar.filter((f) => f !== kulit);
const src = (f) => f ? pathToFileURL(path.join(GAMBAR, f)).href : null;
const fmt = (n) => n.toLocaleString("ms-MY");

const KATEGORI = [
  ["sarapan", "Sarapan", "Mulakan hari dengan protein tinggi supaya kenyang lebih lama."],
  ["tengah-hari", "Makan Tengah Hari", "Hidangan Malaysia yang mengenyangkan dengan sukatan nasi yang jelas."],
  ["malam", "Makan Malam", "Rendah karbohidrat dan tinggi protein untuk pemulihan otot semasa tidur."],
  ["snek", "Snek", "Kudapan tradisional dan moden versi sihat apabila lapar di antara waktu makan."],
];

const jam = `<svg viewBox="0 0 48 48" class="jam" aria-hidden="true"><circle cx="24" cy="24" r="21" fill="none" stroke="currentColor" stroke-width="3"/>
<path d="M24 11v14l9 6" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>`;

function halamanResepi(r, nombor) {
  const g = dalam.length ? dalam[(nombor - 1) % dalam.length] : null;
  return `<section class="hal resepi">
  <header class="pita"><span>${esc(r.label.toUpperCase())}</span></header>
  <div class="isi">
    <div class="no">RESEPI ${nombor} / ${RESEPI.length}</div>
    <h1>${esc(r.nama)}</h1>
    <hr>
    <div class="grid">
      <div class="kiri">
        <h2>Bahan-bahan</h2>
        <ul>${r.bahan.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>
        <h2>Kalori &amp; Makronutrien</h2>
        <ul class="makro">
          <li><b>Protein:</b> ${r.protein} g</li>
          <li><b>Karbohidrat:</b> ${r.karbo} g</li>
          <li><b>Lemak:</b> ${r.lemak} g</li>
          <li><b>Jumlah Kalori:</b> ${fmt(r.kalori)} kcal</li>
        </ul>
        <div class="masa">${jam}<span>${typeof r.minit === "number" ? `${r.minit} minit` : esc(r.minit)}</span></div>
      </div>
      <figure class="foto">${g ? `<img src="${src(g)}" alt="">` : `<div class="kosong">Gambar</div>`}</figure>
    </div>
    <div class="cara">
      <h2>Cara Penyediaan</h2>
      <ol>${r.cara.map((c) => `<li>${esc(c)}</li>`).join("")}</ol>
    </div>
  </div>
  <footer class="kaki"><span class="logo">Bentuk<em>Badan</em></span><span>${nombor}</span></footer>
</section>`;
}

let n = 0;
const bahagian = KATEGORI.map(([id, label, ayat], i) => {
  const list = RESEPI.filter((r) => r.kategori === id);
  const mula = n + 1;
  const halaman = list.map((r) => halamanResepi(r, ++n)).join("\n");
  return { id, label, ayat, list, mula, akhir: n, halaman, no: i + 1 };
});

const kandungan = bahagian.map((b) => `
  <div class="kand-bah">
    <div class="kand-tajuk"><span>${String(b.no).padStart(2, "0")}</span>${esc(b.label)}<em>Resepi ${b.mula}–${b.akhir}</em></div>
    <ol start="${b.mula}">${b.list.map((r) => `<li><span>${esc(r.nama)}</span><i>${fmt(r.kalori)} kcal · ${r.protein} g protein</i></li>`).join("")}</ol>
  </div>`).join("");

const contoh = [0, 25, 83, 53]; // sarapan 1, tengah hari 26, snek 84, malam 54

const html = `<!doctype html>
<html lang="ms"><head><meta charset="utf-8">
<title>BentukBadan: 100 Hidangan Turun Lemak, Bina Otot</title>
<link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Kalam:wght@700&family=Montserrat:wght@500;600;700&display=block" rel="stylesheet">
<style>
  @page { size: A4; margin: 0; }
  :root { --kuning: #ffd523; --hitam: #1d1a1a; --hijau: #1f8a4c; --kelabu: #5d6b62; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Montserrat, sans-serif; color: var(--hitam); -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .hal { width: 210mm; height: 297mm; position: relative; overflow: hidden; page-break-after: always; background: #fff; }
  h1, .pita, .tajuk-kulit, .bab h1 { font-family: "Archivo Black", sans-serif; }

  /* Kulit */
  .kulit { display: flex; flex-direction: column; }
  .kulit .atas { background: var(--kuning); padding: 14mm 14mm 10mm; text-align: center; }
  .kulit .logo { font-size: 15pt; }
  .kulit .sub { font-family: "Archivo Black"; font-size: 15pt; line-height: 1.25; margin: 7mm 0 4mm; }
  .tajuk-kulit { font-size: 46pt; line-height: 1; letter-spacing: -.01em; }
  .kulit .gambar { flex: 1; margin-top: 3mm; background: #ddd center/cover no-repeat; }
  .kulit .bawah { background: var(--hitam); color: #fff; text-align: center; padding: 12mm; font-family: "Archivo Black"; font-size: 17pt; letter-spacing: .02em; }
  .logo { font-family: "Archivo Black"; letter-spacing: -.01em; }
  .logo em { font-style: normal; color: var(--hijau); }

  /* Pengenalan & kandungan */
  .teks { padding: 18mm 18mm 16mm; }
  .teks h1 { font-size: 30pt; margin: 0 0 6mm; line-height: 1.05; }
  .teks p, .teks li { font-size: 10.5pt; line-height: 1.6; }
  .teks h2 { font-family: Kalam, cursive; font-size: 19pt; margin: 7mm 0 2mm; }
  .kotak { background: var(--kuning); padding: 6mm 7mm; margin-top: 6mm; }
  .kotak p { margin: 0; }
  .kand { padding: 14mm 16mm; }
  .kand h1 { font-size: 26pt; margin: 0 0 4mm; }
  .kand-grid { columns: 2; column-gap: 8mm; }
  .kand-bah { break-inside: avoid-column; margin-bottom: 3mm; }
  .kand-tajuk { font-family: "Archivo Black"; font-size: 10pt; background: var(--kuning); padding: 1.5mm 2.5mm; display: flex; gap: 2mm; align-items: baseline; }
  .kand-tajuk em { margin-left: auto; font-family: Montserrat; font-style: normal; font-size: 7pt; font-weight: 600; }
  .kand ol { margin: 1.5mm 0 0; padding-left: 7mm; }
  .kand li { font-size: 7.2pt; line-height: 1.35; padding: .35mm 0; }
  .kand li span { font-weight: 600; }
  .kand li i { font-style: normal; color: var(--kelabu); margin-left: 1.5mm; font-size: 6.5pt; }

  /* Pembahagi bab */
  .bab { background: var(--hitam); color: #fff; display: flex; flex-direction: column; justify-content: flex-end; padding: 22mm 18mm; }
  .bab .gambar { position: absolute; inset: 0; background: center/cover no-repeat; opacity: .45; }
  .bab > * { position: relative; }
  .bab .bil { font-family: "Archivo Black"; font-size: 80pt; color: var(--kuning); line-height: 1; }
  .bab h1 { font-size: 46pt; margin: 2mm 0 4mm; line-height: 1; }
  .bab p { font-size: 13pt; max-width: 140mm; margin: 0; }

  /* Halaman resepi */
  .pita { background: var(--kuning); height: 36mm; display: grid; place-items: center; font-size: 30pt; letter-spacing: .01em; }
  .isi { padding: 8mm 13mm 0; }
  .no { font-size: 8pt; font-weight: 700; color: var(--kelabu); letter-spacing: .08em; }
  .resepi h1 { font-size: 27pt; line-height: 1.05; margin: 2mm 0 0; text-transform: uppercase; min-height: 20mm; display: flex; align-items: flex-end; }
  hr { border: 0; border-top: 1px solid var(--hitam); width: 82%; margin: 6mm 0 6mm; }
  .grid { display: grid; grid-template-columns: 1fr 87mm; gap: 6mm; }
  .resepi h2 { font-family: Kalam, cursive; font-size: 20pt; margin: 0 0 2mm; font-weight: 700; }
  .kiri ul { margin: 0 0 7mm; padding-left: 5mm; }
  .kiri li { font-size: 9.3pt; font-weight: 600; line-height: 1.45; margin-bottom: 1mm; }
  .makro li { font-weight: 500; }
  .masa { display: flex; align-items: center; gap: 4mm; font-family: Kalam, cursive; font-size: 21pt; font-weight: 700; }
  .jam { width: 16mm; height: 16mm; }
  .foto { margin: 0; border: 1px solid var(--hitam); height: 118mm; background: #eee; }
  .foto img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .kosong { height: 100%; display: grid; place-items: center; color: #999; }
  .cara { margin-top: 7mm; background: #faf6e1; padding: 5mm 7mm; }
  .cara h2 { font-size: 17pt !important; }
  .cara ol { margin: 0; padding-left: 5mm; }
  .cara li { font-size: 9.3pt; line-height: 1.5; margin-bottom: 1mm; }
  .kaki { position: absolute; bottom: 7mm; left: 13mm; right: 13mm; display: flex; justify-content: space-between; align-items: center; font-size: 9pt; font-weight: 700; }
  .kaki .logo { font-size: 11pt; }

  @media screen { body { background: #888; } .hal { margin: 10px auto; box-shadow: 0 4px 20px rgba(0,0,0,.3); } }
</style></head><body>

<section class="hal kulit">
  <div class="atas">
    <div class="logo">Bentuk<em>Badan</em></div>
    <div class="sub">100 HIDANGAN MALAYSIA UNTUK MEMBAKAR LEMAK PERUT, LEMAK DADA DAN LEMAK PINGGANG</div>
    <div class="tajuk-kulit">BUKU RESEPI</div>
  </div>
  <div class="gambar" style="${kulit ? `background-image:url('${src(kulit)}')` : ""}"></div>
  <div class="bawah">OLEH PASUKAN BENTUKBADAN</div>
</section>

<section class="hal teks">
  <h1>Cara Menggunakan Buku Ini</h1>
  <p>Buku ini mengandungi 100 resepi masakan Malaysia yang telah diubah suai supaya tinggi protein dan sederhana kalori. Setiap resepi disertakan senarai bahan, nilai kalori dan makronutrien, masa penyediaan serta cara penyediaan langkah demi langkah.</p>
  <h2>Untuk menurunkan lemak</h2>
  <p>Ambil makanan 300 hingga 500 kcal di bawah keperluan tenaga harian (TDEE) anda. Pilih tiga hidangan dan satu snek daripada buku ini yang jumlahnya hampir dengan sasaran kalori anda. Utamakan protein sebanyak 1.8 hingga 2.2 g bagi setiap kilogram berat badan.</p>
  <h2>Untuk membina otot</h2>
  <p>Ambil makanan 200 hingga 300 kcal melebihi TDEE anda dan lakukan latihan bebanan sekurang-kurangnya tiga kali seminggu. Tambahkan satu snek atau besarkan saiz hidangan nasi untuk mencapai sasaran kalori.</p>
  <h2>Cara membaca nilai nutrisi</h2>
  <p>Semua nilai adalah bagi <b>satu hidangan</b> dan merupakan anggaran berdasarkan sukatan bahan yang disenaraikan. Jenama bahan dan cara memasak boleh mengubah nilai sebenar. Gunakan penimbang dapur untuk ketepatan yang lebih baik.</p>
  <div class="kotak"><p><b>Contoh sehari untuk turun lemak:</b> ${contoh.map((i) => `${esc(RESEPI[i].label)} resepi ${i + 1} (${fmt(RESEPI[i].kalori)} kcal)`).join(" + ")} = <b>${fmt(contoh.reduce((t, i) => t + RESEPI[i].kalori, 0))} kcal</b>, protein ${contoh.reduce((t, i) => t + RESEPI[i].protein, 0)} g.</p></div>
  <p style="margin-top:8mm;font-size:8.5pt;color:#5d6b62">Penafian: Kandungan buku ini adalah untuk tujuan pendidikan dan bukan pengganti nasihat perubatan. Dapatkan nasihat doktor atau pakar dietetik sebelum membuat perubahan besar pada pemakanan, terutamanya jika anda menghidap penyakit kronik, hamil atau sedang menyusu. Gambar dalam buku ini dijana menggunakan AI dan tidak menggambarkan individu sebenar.</p>
</section>

<section class="hal kand">
  <h1>Kandungan</h1>
  <div class="kand-grid">${kandungan}</div>
</section>

${bahagian.map((b, i) => `
<section class="hal bab">
  <div class="gambar" style="${dalam.length ? `background-image:url('${src(dalam[(i * 3) % dalam.length])}')` : ""}"></div>
  <div class="bil">${String(b.no).padStart(2, "0")}</div>
  <h1>${esc(b.label.toUpperCase())}</h1>
  <p>${esc(b.ayat)} ${b.list.length} resepi.</p>
</section>
${b.halaman}`).join("\n")}

</body></html>`;

const htmlPath = path.join(OUT, "buku.html");
fs.writeFileSync(htmlPath, html);

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require("playwright")); }
catch { ({ chromium } = require("/opt/node-tools/node_modules/playwright")); }
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
const pdfPath = path.join(OUT, "BentukBadan-100-Hidangan.pdf");
await page.pdf({ path: pdfPath, format: "A4", printBackground: true, preferCSSPageSize: true });
await browser.close();
console.log(`Siap: ${pdfPath} (${(fs.statSync(pdfPath).size / 1e6).toFixed(1)} MB), ${RESEPI.length} resepi, ${gambar.length} gambar`);
