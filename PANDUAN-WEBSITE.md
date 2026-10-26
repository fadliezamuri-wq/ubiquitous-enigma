# Panduan Website AI Digital Studio Sarawak

Website ini terletak dalam folder `docs/` dan hanya ada 3 fail:

| Fail | Fungsi |
| --- | --- |
| `docs/index.html` | Kandungan website (teks, pakej, contoh kerja, borang) |
| `docs/style.css` | Rupa website (warna, fon, susun atur telefon/iPad/komputer) |
| `docs/script.js` | Fungsi (butang WhatsApp, borang, menu telefon) **+ tetapan anda** |

Tiada pemasangan atau "build" diperlukan. Fail ini boleh dibuka terus dalam pelayar.

> **Status:** Website ini **belum diterbitkan**. Ikut Langkah 3 di bawah untuk menerbitkannya.

---

## Langkah 1: Tukar nombor WhatsApp & emel (wajib sebelum terbit)

1. Buka repo di GitHub (Safari di iPad): `github.com/fadliezamuri-wq/ubiquitous-enigma`
2. Pilih branch yang betul, kemudian buka fail `docs/script.js`.
3. Tekan ikon pensel ✏️ (Edit).
4. Di bahagian paling atas, cari:
   ```js
   WHATSAPP_NUMBER: "60XXXXXXXXX",
   EMAIL: "emel@contoh.com",
   ```
5. Tukar kepada maklumat anda. Format nombor: **kod negara 60, tanpa `+`, tanpa sengkang, tanpa ruang, dan tanpa 0 di depan**.
   - Nombor `012-345 6789` → tulis `"60123456789"`
   - Nombor `011-2345 6789` → tulis `"601123456789"`
6. Tekan **Commit changes**.

Selagi nombor masih `60XXXXXXXXX`, website berada dalam **mod demo**: butang WhatsApp hanya memaparkan notis dan tiada mesej dihantar kepada sesiapa.

## Langkah 2: Melihat demo

**Cara paling mudah di iPad (selepas Langkah 3):** buka alamat GitHub Pages dalam Safari.

**Sebelum terbit, di komputer:** muat turun repo (butang hijau **Code → Download ZIP**), buka zip, kemudian klik dua kali `docs/index.html`.

**Uji perkara ini:**
- Tekan menu ☰ di telefon untuk memastikan menu terbuka dan tertutup.
- Tekan "Pilih Starter" untuk memastikan borang diisi secara automatik.
- Hantar borang kosong untuk memastikan mesej ralat merah keluar.
- Isi borang dengan betul untuk memastikan WhatsApp dibuka dengan mesej siap ditulis. Dalam mod demo, notis yang keluar sebaliknya.
- Tekan butang hijau WhatsApp di bucu kanan bawah.

## Langkah 3: Terbitkan secara percuma (GitHub Pages)

1. Pastikan perubahan website sudah berada dalam branch **main** (gabungkan Pull Request dahulu jika perlu).
2. Dalam repo GitHub, tekan **Settings → Pages**.
3. Di bahagian **Build and deployment**:
   - Source: **Deploy from a branch**
   - Branch: **main**, folder: **/docs**
4. Tekan **Save**. Tunggu 1–3 minit.
5. Alamat website akan dipaparkan di atas halaman yang sama, biasanya:
   `https://fadliezamuri-wq.github.io/ubiquitous-enigma/`
6. Buka alamat itu di telefon dan iPad untuk menyemak.

> Nota: Untuk akaun GitHub percuma, repo mesti **Public** untuk menggunakan GitHub Pages.

**Pilihan lain:** Netlify atau Cloudflare Pages (juga percuma). Sambungkan repo GitHub dan tetapkan folder terbitan (publish directory) kepada `docs`.

**Nama domain sendiri** (contoh: `aidigitalstudio.my`): beli dari pendaftar domain, kemudian masukkan di **Settings → Pages → Custom domain**.

## Langkah 4: Edit kandungan

- **Tukar teks atau harga:** edit `docs/index.html` dan cari teks yang ingin ditukar (contoh: cari `RM</span>150`).
- **Tukar warna:** edit bahagian `:root` di atas `docs/style.css`.
- **Tukar nama syarikat:** cari "AI Digital Studio Sarawak" dalam `index.html` dan `script.js`.
- **Contoh kerja:** semua contoh sekarang ialah **kandungan demo**. Bila anda ada kerja sebenar dan **kebenaran pelanggan**, gantikan contoh demo dan buang label "CONTOH DEMO".

## Perkara penting

- Borang **tidak menyimpan** data pelanggan. Ia cuma membuka WhatsApp dengan mesej siap ditulis, dan pelanggan sendiri yang menekan hantar.
- Website ini **tidak menerima pembayaran**. Pembayaran dibincang terus dengan pelanggan.
- Jika mahu borang dihantar ke emel pada masa depan, servis seperti Formspree boleh disambungkan kemudian.
