# Sistem Infaq dan Menang Goldbar YAPEIM Sarawak

Sistem penyertaan kempen infaq: orang ramai imbas QR Code, isi borang dan muat naik resit melalui telefon;
staf YAPEIM menyemak resit melalui dashboard; sistem menyusun peserta terpantas dan menjalankan cabutan
bertuah dengan rekod yang boleh diaudit.

> **Status:** Kod siap dan diuji secara automatik (22 ujian, data palsu sahaja). Sistem **belum diterbitkan**,
> kerana penerbitan memerlukan akaun Google anda. Ikuti [Panduan Pemasangan (iPad)](dokumen/PANDUAN-PEMASANGAN-IPAD.md).

## Kandungan

| Fail / folder | Kegunaan |
| --- | --- |
| `dist/Code.gs` | **Fail untuk disalin ke Google Apps Script.** Ia mengandungi keseluruhan sistem. |
| `src/` | Kod sumber: `Core.js` (logik), `Server.js` (pelayan), `html/` (paparan) |
| `tests/` | Ujian automatik |
| `scripts/` | Penjana `Code.gs`, QR Code, poster dan alat pengesahan cabutan |
| `dokumen/` | Panduan, teks promosi, senarai semak akhir dan tangkapan skrin |
| `aset/` | Letak logo rasmi di sini (`logo-yapeim.png`). Sekarang ia masih kosong. |

## Seni bina (kenapa begini)

```
 Orang ramai (telefon)                         Staf YAPEIM (iPad / komputer)
        │ imbas QR                                       │ ?p=admin + kata laluan
        ▼                                                ▼
 ┌──────────────────────── Google Apps Script Web App (HTTPS) ────────────────────────┐
 │  Borang  ·  Dashboard  ·  Paparan cabutan  ·  Notis privasi                         │
 │  Pengesahan input, anti-spam, kunci serentak, audit, cabutan rawak boleh disahkan   │
 └───────────────┬───────────────────────────────────────────┬────────────────────────┘
                 ▼                                           ▼
   Google Sheet (peribadi, dilindungi)          Folder Google Drive (peribadi, tidak dikongsi)
   Penyertaan · Cabutan · Audit                 Fail resit JPG/PNG/PDF
```

**Kenapa tidak guna Google Forms biasa sahaja?**

| | Google Forms + Sheets | Sistem ini (Apps Script + Sheets) |
| --- | --- | --- |
| Kos | Percuma | Percuma |
| Muat naik resit | **Peserta wajib log masuk akaun Google.** Ramai orang ramai tidak akan teruskan. | Tidak perlu log masuk |
| ID penyertaan unik & dipaparkan kepada peserta | Tidak | Ya |
| Semak pendua / resit berulang | Manual | Automatik, ditanda untuk semakan |
| Lulus / Tolak / Minta pembetulan + sejarah tindakan | Manual dalam Sheet, tiada audit | Butang dalam dashboard, semua direkod |
| Cabutan bertuah yang boleh diaudit | Tiada | Ada, dengan pengesahan bebas |
| Staf perlu akses Sheet | Ya, jadi semua data terdedah kepada mereka | Tidak. Staf guna dashboard dengan akaun sendiri |
| Penyelenggaraan | Paling mudah | Mudah: satu fail, tiada pelayan untuk diurus |

Kesimpulan: sistem ini mengekalkan kos sifar dan kemudahan Google, tetapi menyelesaikan masalah utama Google Forms
(peserta perlu log masuk Google untuk memuat naik fail).

## Ciri utama

- **Borang mesra telefon** (Bahasa Melayu): nama, telefon, jumlah RM, tarikh, kaedah, no. rujukan (pilihan),
  resit JPG/PNG/PDF ≤ 5 MB, pengesahan kebenaran maklumat dan persetujuan privasi. Gambar besar dikecilkan
  secara automatik supaya muat naik pantas. Selepas dihantar, peserta mendapat **ID penyertaan**.
- **Direkod automatik:** ID unik, cap masa pelayan (hingga milisaat), nombor turutan, status, bendera semakan,
  kelayakan, catatan pentadbir, siapa yang menyemak dan bila.
- **Keselamatan:** jenis fail disemak melalui kandungan sebenar (bukan nama fail), had saiz, perangkap bot (honeypot),
  token borang, had kadar (5 penghantaran/jam bagi setiap nombor, 60/minit keseluruhan), perlindungan suntikan
  formula hamparan dan XSS. Kata laluan disimpan dalam bentuk hash dan akaun dikunci selepas 5 cubaan gagal.
  Sesi tamat selepas 6 jam.
- **Pendua:** jika resit dan telefon yang sama dihantar semula, sistem memulangkan ID asal tanpa mencipta rekod baru.
  Resit berulang, no. rujukan berulang, maklumat sama, jumlah luar biasa tinggi atau tarikh di luar tempoh
  ditanda **PERLU SEMAKAN MANUAL**.
- **Dashboard:** statistik, senarai dengan carian (nama/telefon/ID/tarikh/rujukan) dan penapis, lihat resit secara selamat,
  butang Luluskan / Tolak / Minta Pembetulan, eksport CSV (boleh dibuka dengan Excel), sejarah tindakan, tetapan,
  pengurusan staf (peranan UTAMA dan PENYEMAK). Jumlah sumbangan *direkod* dan *disahkan* dipaparkan secara berasingan.
- **Peserta terpantas:** disusun mengikut cap masa pelayan. Jika masa sama, nombor turutan menjadi pemutus seri.
  Hanya penyertaan LULUS dan layak dikira. Secara lalai, setiap nombor telefon hanya dikira sekali.
- **Cabutan bertuah:** cabutan RASMI hanya boleh dibuat **selepas kempen tamat dan semua resit disemak**. Sistem
  menyimpan senarai layak, hash senarai dan benih rawak. Keputusan boleh disahkan semula sesiapa
  (`npm run sahkan-cabutan`). Cabutan semula tidak boleh dibuat secara senyap: keputusan lama mesti dibatalkan
  dengan sebab, dan rekodnya kekal. Pemenang simpanan disokong.
- **Mod ujian berasingan:** data ujian ditanda `UJI-` dan tidak dikira dalam statistik atau keputusan rasmi.
- **Paparan siaran langsung:** pemenang didedahkan satu per satu. Hanya ID dan nama bertopeng dipaparkan
  (cth: `Mu****** Al*`), tanpa telefon atau resit.
- **Integriti:** setiap rekod ditandatangani (HMAC) dan log audit dirantai. Jika sesiapa mengubah cap masa, telefon,
  jumlah atau log audit secara manual dalam Sheet, perubahan itu dikesan.

## Pautan sistem (selepas diterbitkan)

| Halaman | Pautan |
| --- | --- |
| Borang awam (untuk QR) | `https://script.google.com/macros/s/<ID>/exec` |
| Borang mod ujian | `…/exec?ujian=1` |
| Dashboard pentadbir | `…/exec?p=admin` |
| Paparan cabutan (siaran langsung) | `…/exec?p=paparan` (ujian: `&ujian=1`) |
| Notis privasi & syarat | `…/exec?p=privasi` |

## Untuk pembangun

Keperluan: Node.js 18 atau lebih baharu. Playwright diperlukan untuk ujian pelayar dan poster.

```sh
cd infaq
npm install
npm test            # bina dist/Code.gs + jalankan semua ujian
npm run build       # bina dist/Code.gs sahaja
npm run qr -- <pautan /exec sebenar>            # QR PNG (2000px) + SVG, disahkan dengan imbasan semula
npm run poster -- <pautan> --tarikh "1 – 30 November 2026" --hadiah "Goldbar 999.9" --telefon "082-xxxxxx"
npm run sahkan-cabutan -- senarai.csv <ID Cabutan> <benih> <bilangan>
```

Ujian merangkumi: penghantaran borang, muat naik resit, penyimpanan, kelulusan/penolakan/pembetulan, pendua,
peserta terpantas & pemutus seri, cabutan (data palsu), akses tanpa kebenaran, eksport CSV, integriti, XSS/suntikan formula,
dan satu aliran penuh dalam pelayar Chromium bersaiz telefon dan iPad. Hasilnya ada dalam `dokumen/tangkapan-skrin/`.

**Jangan sunting `dist/Code.gs` secara terus.** Sunting fail dalam `src/`, kemudian jalankan `npm run build`.

## Sandaran (backup)

1. **Setiap minggu:** dashboard → Penyertaan → *Eksport CSV*. Simpan dalam folder Drive organisasi yang terhad.
2. **Setiap minggu:** dalam Google Sheet → *Fail → Muat turun → Microsoft Excel (.xlsx)*.
3. Fail resit berada dalam folder Drive `RESIT INFAQ YAPEIM SARAWAK (SULIT …)`. Google Drive menyimpannya secara kekal
   sehingga dipadam. Untuk sandaran luar talian, gunakan *Muat turun* pada folder itu.
4. **Jangan** simpan sandaran dalam GitHub, WhatsApp atau e-mel peribadi.

## Privasi & penyimpanan data

- Repository GitHub ini **awam**. Ia hanya mengandungi kod. Tiada kata laluan, kunci rahsia atau data peserta.
  Rahsia sistem dijana dalam akaun Google anda (Script Properties) semasa `sediakanSistem`.
- Google Sheet dan folder resit **jangan dikongsi** dengan sesiapa. Staf menggunakan dashboard sahaja.
- Selepas tempoh simpanan yang diluluskan tamat (tetapan *Tempoh simpanan data*), eksport rekod yang perlu untuk audit,
  kemudian padam Sheet dan folder resit.
- Notis privasi & syarat dalam sistem ialah **DRAF** dan perlu disemak oleh pihak pengurusan/undang-undang YAPEIM.
