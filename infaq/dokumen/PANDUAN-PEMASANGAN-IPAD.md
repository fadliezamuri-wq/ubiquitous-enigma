# Panduan Pemasangan di iPad (langkah demi langkah)

Masa diperlukan: lebih kurang 30 minit. Gunakan **Safari** di iPad.

> **Penting tentang akaun:** gunakan **akaun Google rasmi organisasi YAPEIM**, bukan akaun peribadi.
> Data peserta dan resit akan disimpan dalam akaun inilah. Jika staf bertukar, data kekal milik organisasi.

---

## Langkah 0 — Tetapkan Safari ke mod komputer

Editor Google Apps Script memerlukan paparan komputer.

1. Buka Safari.
2. Tekan ikon **aA** (atau ikon ☰ halaman) di bar alamat.
3. Pilih **Request Desktop Website** (*Minta Laman Web Desktop*).

Ulang langkah ini setiap kali anda membuka halaman Google yang baharu, jika paparan bertukar menjadi versi telefon.

## Langkah 1 — Cipta Google Sheet

1. Pergi ke **sheets.google.com**, kemudian log masuk dengan akaun Google organisasi.
2. Tekan **+ (Kosong / Blank)**.
3. Tekan nama "Untitled spreadsheet" di atas, kemudian tukar kepada:
   `INFAQ GOLDBAR YAPEIM SARAWAK - DATA (SULIT)`

## Langkah 2 — Buka Apps Script

1. Dalam Sheet tadi, pilih menu **Extensions (Sambungan) → Apps Script**. Tab baharu akan dibuka.
2. Tekan "Untitled project" di atas, kemudian namakan projek: `Sistem Infaq Goldbar`.

## Langkah 3 — Tampal kod sistem

1. Dalam tab baharu Safari, buka pautan fail kod. Saya akan memberi pautan ini selepas kod dimuat naik ke GitHub:
   `https://raw.githubusercontent.com/fadliezamuri-wq/ubiquitous-enigma/<cabang>/infaq/dist/Code.gs`
2. Tekan lama pada teks, pilih **Select All (Pilih Semua)**, kemudian **Copy (Salin)**.
3. Kembali ke tab Apps Script. Klik dalam kotak kod `Code.gs`, tekan lama, pilih **Select All**, kemudian **Paste (Tampal)**.
   Kod asal `function myFunction() {}` mesti digantikan sepenuhnya.
4. Tekan ikon **💾 Simpan** (atau ⌘S jika ada papan kekunci).

## Langkah 4 — Tetapkan zon masa projek

1. Di sebelah kiri editor, tekan ikon **⚙ Project Settings**.
2. Pada **Time zone**, pilih `(GMT+08:00) Kuching`.

## Langkah 5 — Jalankan persediaan (sekali sahaja)

1. Kembali ke **< > Editor**.
2. Di bar atas ada senarai fungsi. Pilih **`sediakanSistem`**.
3. Tekan **▶ Run (Jalankan)**.
4. Google akan meminta kebenaran:
   - Tekan **Review permissions**, kemudian pilih akaun organisasi.
   - Anda mungkin melihat amaran **"Google hasn't verified this app"**. Ini normal kerana skrip ini milik anda sendiri.
     Tekan **Advanced → Go to Sistem Infaq Goldbar (unsafe)**.
   - Tekan **Allow (Benarkan)**.
5. Di bahagian bawah, **Execution log** akan memaparkan:
   ```
   Nama pengguna: admin
   Kata laluan sementara: xxxxxxxxxxxx
   ```
   **Salin kata laluan ini sekarang** dan simpan di tempat yang selamat. Jangan kongsi dalam kumpulan WhatsApp.
6. Kembali ke tab Google Sheet. Kini ada 4 helaian: *Penyertaan, Cabutan, Senarai Layak Cabutan, Audit*.
   Folder Drive `RESIT INFAQ YAPEIM SARAWAK (SULIT - JANGAN KONGSI)` juga telah dicipta.

> Jika anda terlupa kata laluan admin, jalankan fungsi **`setSemulaKataAdmin`** dengan cara yang sama.

## Langkah 6 — Terbitkan sebagai aplikasi web

1. Dalam editor Apps Script, tekan **Deploy (Terapkan) → New deployment**.
2. Tekan ikon ⚙ di sebelah "Select type", kemudian pilih **Web app**.
3. Isi:
   - **Description:** `Versi 1`
   - **Execute as:** **Me (akaun anda)**
   - **Who has access:** **Anyone (Sesiapa sahaja)** — supaya orang ramai boleh mengisi borang tanpa log masuk.
4. Tekan **Deploy**. Jika diminta, berikan kebenaran sekali lagi.
5. Salin **Web app URL**. Bentuknya: `https://script.google.com/macros/s/AKfy…/exec`
   **Inilah pautan borang sebenar.** Hantar pautan ini kepada saya supaya saya boleh menjana QR Code.

> Data tetap selamat walaupun akses ditetapkan kepada "Anyone". Orang ramai hanya boleh *menghantar* borang.
> Semua fungsi pentadbir memerlukan log masuk, dan Sheet serta folder resit tidak dikongsi.

## Langkah 7 — Log masuk dashboard & tetapkan kempen

1. Buka `PAUTAN_WEB_APP?p=admin` (tambah `?p=admin` di hujung pautan).
2. Log masuk sebagai `admin` dengan kata laluan sementara, kemudian tukar kata laluan (sekurang-kurangnya 10 aksara, huruf dan nombor).
3. Pergi ke tab **Tetapan** dan isi:
   - Tarikh & masa **mula** dan **tamat** kempen
   - Sumbangan minimum, bilangan peserta terpantas dan hadiah
   - Kaedah sumbangan (satu baris bagi setiap pilihan)
   - Emel/telefon pertanyaan data
4. Tekan **Simpan Tetapan**.
5. Di tab **Pentadbir**, tambah akaun bagi setiap staf penyemak. Berikan kata laluan sementara kepada mereka secara peribadi.

## Langkah 8 — Uji sebelum dilancarkan

Gunakan **data palsu sahaja**.

1. Buka `PAUTAN?ujian=1` di telefon. Isi borang dengan nama palsu dan gambar resit contoh, kemudian hantar.
   Anda sepatutnya mendapat ID `UJI-…`.
2. Di dashboard → **Penyertaan** → tandakan *Papar data ujian sahaja*. Buka penyertaan itu, tekan **Lihat resit**, kemudian **Luluskan**.
3. Tetapan → **Jana 30 penyertaan palsu**. Kemudian buka Cabutan → jenis **UJIAN** → **Jalankan**.
4. Buka **Paparan siaran langsung (ujian)** dan cuba butang *Dedahkan pemenang seterusnya*.
5. Uji keselamatan: buka pautan `?p=admin` dalam tetingkap peribadi (Private) dan pastikan ia meminta log masuk.
6. Selepas semuanya berfungsi: Tetapan → **Padam semua data ujian**, kemudian **matikan mod ujian**.

## Langkah 9 — Kemas kini kod pada masa hadapan (pautan & QR kekal sama)

1. Gantikan kandungan `Code.gs` dengan versi baharu, kemudian simpan.
2. **Deploy → Manage deployments → ✏ (Edit)**.
3. Pada **Version**, pilih **New version**, kemudian tekan **Deploy**.

> **Jangan** pilih "New deployment" untuk kemas kini. Ia akan mencipta pautan BAHARU dan QR yang telah dicetak tidak lagi berfungsi.

## Nota had Google (akaun percuma)

- Sistem boleh mengendalikan ribuan penyertaan. Jika ramai menghantar pada saat yang sama, sesetengah peserta mungkin
  melihat "Sistem sedang sibuk" dan perlu cuba semula.
- Untuk akaun Gmail biasa, Google memaparkan jalur kecil di atas halaman: "This application was created by a Google Apps Script user".
  Jalur ini tidak muncul bagi akaun Google Workspace organisasi.
