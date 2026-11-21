// Panduan premium. `body` hanya dihantar oleh server kepada pengguna yang dah bayar.
export const MODULES = [
  { n: 1, title: "Asas Kalori & Makro", desc: "Cara kira TDEE, defisit dan lebihan kalori, dan kenapa protein paling penting.",
    body: `<h4>1. Kira TDEE anda</h4><p>TDEE = BMR × faktor aktiviti. Guna kalkulator di laman utama sebagai titik mula, kemudian laraskan ikut berat sebenar selepas 2 minggu.</p>
<h4>2. Tetapkan sasaran</h4><ul><li><b>Kurus:</b> TDEE − 20% (contoh 2,400 → 1,900 kcal)</li><li><b>Bina otot:</b> TDEE + 10% (contoh 2,400 → 2,650 kcal)</li></ul>
<h4>3. Susun makro</h4><ul><li><b>Protein:</b> 2 g × berat badan (kg). Ini yang kekalkan otot semasa defisit.</li><li><b>Lemak:</b> 0.8 g × berat badan, minimum untuk hormon.</li><li><b>Karbo:</b> baki kalori. Tenaga untuk latihan.</li></ul>
<h4>4. Pantau</h4><p>Timbang setiap pagi selepas tandas, ambil purata mingguan. Jika purata tak berubah selama 2 minggu, kurangkan 150 kcal (kurus) atau tambah 150 kcal (bina otot).</p>` },
  { n: 2, title: "Pelan Makan 4 Minggu: Kurus", desc: "Menu harian ±1,600 kcal guna makanan Malaysia, dengan peraturan mudah untuk diikut.",
    body: `<p>Sasaran contoh: 1,600 kcal · 130 g protein · 150 g karbo · 50 g lemak. Laraskan saiz hidangan ikut sasaran anda.</p>
<div class="tablewrap"><table><tr><th>Hari</th><th>Sarapan</th><th>Tengah hari</th><th>Snek</th><th>Malam</th></tr>
<tr><td>Isnin</td><td>Telur dadar bayam + roti gandum</td><td>Ikan bakar air asam + nasi ½ cawan</td><td>Yogurt Greek</td><td>Sup ayam sayur</td></tr>
<tr><td>Selasa</td><td>Bubur oat ayam</td><td>Nasi ayam panggang kunyit</td><td>2 telur rebus</td><td>Salad tuna telur</td></tr>
<tr><td>Rabu</td><td>Roti gandum + telur hancur</td><td>Nasi goreng kampung putih telur</td><td>Epal + kacang 15 g</td><td>Ikan siakap stim limau + sayur</td></tr>
<tr><td>Khamis</td><td>Telur dadar bayam + roti gandum</td><td>Mee hoon sup ayam</td><td>Susu rendah lemak</td><td>Kerabu ayam mangga</td></tr>
<tr><td>Jumaat</td><td>Oat overnight pisang</td><td>Udang masak lemak (ringan) + nasi ½ cawan</td><td>Yogurt Greek</td><td>Tauhu sumbat bakar</td></tr>
<tr><td>Sabtu</td><td>Nasi lemak separuh (sambal sedikit)</td><td>Salad tuna telur</td><td>Buah</td><td>Sup ayam sayur</td></tr>
<tr><td>Ahad</td><td>Roti canai kosong 1 + telur rebus</td><td>Nasi ayam panggang kunyit</td><td>2 telur rebus</td><td>Ikan bakar + sayur</td></tr></table></div>
<h4>Peraturan mudah</h4><ul><li>Minum air 2.5–3 liter sehari.</li><li>Teh tarik / kopi: tukar kepada kurang manis atau kosong.</li><li>Sukat nasi dengan cawan, jangan agak.</li><li>Ulang menu yang sama minggu 2–4, tukar lauk ikut selera.</li></ul>` },
  { n: 3, title: "Pelan Makan 4 Minggu: Bina Otot", desc: "Menu harian ±2,700 kcal dengan 6 kali makan dan protein 150 g+.",
    body: `<p>Sasaran contoh: 2,700 kcal · 160 g protein · 330 g karbo · 80 g lemak.</p>
<div class="tablewrap"><table><tr><th>Waktu</th><th>Menu</th><th>Anggaran</th></tr>
<tr><td>07:00</td><td>Oat overnight pisang protein</td><td>410 kcal · 30 g P</td></tr>
<tr><td>10:00</td><td>Sandwich ayam telur tinggi protein</td><td>445 kcal · 38 g P</td></tr>
<tr><td>13:00</td><td>Ayam masak merah ringan & nasi</td><td>510 kcal · 38 g P</td></tr>
<tr><td>17:00 (lepas latihan)</td><td>Smoothie kacang susu coklat</td><td>420 kcal · 28 g P</td></tr>
<tr><td>20:00</td><td>Daging lada hitam + nasi perang</td><td>535 kcal · 40 g P</td></tr>
<tr><td>22:00</td><td>Lempeng pisang protein</td><td>410 kcal · 25 g P</td></tr></table></div>
<p>Tukar lauk tengah hari dan malam dengan ayam percik, daging kicap atau nasi ayam panggang kunyit supaya tak jemu.</p>
<h4>Tips</h4><ul><li>Susah nak makan banyak? Tambah kalori melalui minuman (susu, smoothie).</li><li>Makan karbo paling banyak sebelum dan selepas latihan.</li><li>Jika berat naik lebih 0.5 kg seminggu, kurangkan 150 kcal.</li></ul>` },
  { n: 4, title: "Program Latihan 12 Minggu (Gym)", desc: "Jadual Upper/Lower 4 hari, set, ulangan dan cara tambah beban setiap minggu.",
    body: `<h4>Jadual mingguan</h4><ul><li><b>Isnin:</b> Upper A</li><li><b>Selasa:</b> Lower A</li><li><b>Khamis:</b> Upper B</li><li><b>Jumaat:</b> Lower B</li><li>Hari lain: jalan kaki 30–45 minit</li></ul>
<div class="tablewrap"><table><tr><th>Hari</th><th>Senaman</th><th>Set × Ulangan</th></tr>
<tr><td>Upper A</td><td>Bench press<br>Barbell row<br>Overhead press<br>Lat pulldown<br>Bicep curl + tricep pushdown</td><td>4×6–8<br>4×8<br>3×8–10<br>3×10–12<br>3×12</td></tr>
<tr><td>Lower A</td><td>Squat<br>Romanian deadlift<br>Leg press<br>Calf raise<br>Plank</td><td>4×5–8<br>3×8–10<br>3×10–12<br>4×15<br>3×45 s</td></tr>
<tr><td>Upper B</td><td>Incline dumbbell press<br>Pull-up / assisted<br>Seated cable row<br>Lateral raise<br>Face pull</td><td>4×8–10<br>4×AMRAP<br>3×10–12<br>3×15<br>3×15</td></tr>
<tr><td>Lower B</td><td>Deadlift<br>Bulgarian split squat<br>Leg curl<br>Hip thrust<br>Hanging leg raise</td><td>3×5<br>3×8 setiap kaki<br>3×12<br>3×10<br>3×12</td></tr></table></div>
<h4>Progresi (double progression)</h4><p>Bila anda capai ulangan tertinggi untuk semua set, tambah beban 2.5 kg (atas) atau 5 kg (bawah) minggu berikutnya. Setiap minggu ke-6 dan ke-12, kurangkan beban 40% untuk pemulihan (deload).</p>` },
  { n: 5, title: "Program Latihan di Rumah", desc: "Tanpa gym: litar berat badan + dumbbell untuk bakar lemak dan bina otot.",
    body: `<h4>3 hari seminggu (Isnin, Rabu, Jumaat)</h4><p>Buat 4 pusingan. Rehat 60 saat antara pusingan.</p>
<div class="tablewrap"><table><tr><th>Senaman</th><th>Minggu 1–4</th><th>Minggu 5–8</th><th>Minggu 9–12</th></tr>
<tr><td>Push-up (atau atas lutut)</td><td>10</td><td>15</td><td>20 / tempo perlahan</td></tr>
<tr><td>Goblet squat (dumbbell)</td><td>12</td><td>15</td><td>20</td></tr>
<tr><td>Dumbbell row</td><td>10 / belah</td><td>12 / belah</td><td>15 / belah</td></tr>
<tr><td>Reverse lunge</td><td>8 / kaki</td><td>10 / kaki</td><td>12 / kaki</td></tr>
<tr><td>Pike push-up</td><td>6</td><td>8</td><td>10</td></tr>
<tr><td>Glute bridge</td><td>15</td><td>20</td><td>Satu kaki 12</td></tr>
<tr><td>Plank</td><td>30 s</td><td>45 s</td><td>60 s</td></tr></table></div>
<h4>Hari lain</h4><p>Jalan pantas 30 minit atau 8,000–10,000 langkah. Ini cara paling mudah tambah pembakaran kalori tanpa ganggu pemulihan otot.</p>` },
  { n: 6, title: "Pecahkan Plateau & Kekalkan Hasil", desc: "Apa nak buat bila berat tak turun, otot tak naik, dan cara elak naik semula.",
    body: `<h4>Berat tak turun 2 minggu?</h4><ol><li>Semak semula sukatan. Minyak masak, sos dan minuman manis selalu terlepas kira.</li><li>Tambah 2,000 langkah sehari.</li><li>Kurangkan 150 kcal daripada karbo atau lemak, bukan protein.</li><li>Pertimbangkan <b>diet break</b>: makan pada TDEE selama 7 hari, kemudian sambung defisit.</li></ol>
<h4>Otot tak naik?</h4><ol><li>Pastikan beban atau ulangan bertambah setiap minggu. Catat dalam buku log.</li><li>Tambah 1–2 set untuk otot yang ketinggalan.</li><li>Tidur 7–9 jam. Kurang tidur kurangkan hasil latihan.</li><li>Tambah 150–200 kcal sehari.</li></ol>
<h4>Selepas capai sasaran</h4><p>Naikkan kalori 100–150 kcal seminggu sehingga berat stabil. Teruskan latihan beban 3x seminggu dan protein tinggi. Itu cara paling berkesan elak berat naik semula.</p>` },
];

export function publicModule({ body, ...meta }) {
  return meta;
}
