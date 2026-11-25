# ubiquitous-enigma

## Getting started

```sh
npm install
npm run build
npm start
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run build` | Compile TypeScript from `src/` to `dist/` |
| `npm start` | Run the compiled app |
| `npm run dev` | Recompile on change |
| `npm run typecheck` | Type-check without emitting |
| `npm test` | Run tests in `tests/` with the Node test runner |

## Structure

```
src/        Application source
tests/      Tests (*.test.ts)
dist/       Build output (git-ignored)
```

## Game: Rumah Pusaka (seram)

Game seram berlatarkan rumah pusaka di kampung, dengan 5 malam dan 5 hantu:
Toyol, Pocong, Pontianak, Langsuir dan Hantu Raya. Ada banyak jumpscare.

Setiap kali hantu menyerang, pemain kena **baca surah** dengan menyusun ayat-ayatnya
mengikut turutan yang betul sebelum masa tamat. Hantu tu hanya hilang selepas surah habis dibaca:

| Malam | Hantu | Surah |
| --- | --- | --- |
| 1 | Toyol | Al-Ikhlas |
| 2 | Pocong | Al-Falaq |
| 3 | Pontianak | An-Nas |
| 4 | Langsuir | Al-Fatihah |
| 5 | Hantu Raya | Ayat al-Kursi |

Cara main: buka `game/index.html` dalam pelayar (tak perlu install apa-apa). Pakai fon telinga.

## Website: BentukBadan (kurus & bina otot)

Laman jualan dengan akaun pengguna dan bayaran ToyyibPay (FPX + kad). Kandungan premium
hanya dihantar oleh server kepada akaun yang dah bayar, jadi tak boleh dibuka dengan "inspect" atau ubah URL.

- Kalkulator kalori & makro (Mifflin-St Jeor + TDEE + BMI panduan Asia)
- 20 resepi Malaysia dengan kalori, protein, karbo, lemak (6 percuma, 14 premium)
- 6 modul panduan penuh: pelan makan kurus & bina otot, program gym 12 minggu, latihan di rumah, plateau
- Daftar / log masuk (kata laluan di-hash dengan scrypt, sesi cookie HttpOnly bertandatangan)
- Bayaran disahkan terus dengan API ToyyibPay (`getBillTransactions`), bukan dengan parameter URL
- Lupa kata laluan melalui e-mel (Resend): pautan sekali guna, sah 1 jam, log keluar semua peranti lain
- E-mel terima kasih automatik selepas bayaran berjaya
- Halaman admin di `/admin`: jualan, senarai pelanggan, cari, beri/tarik akses (pindahan bank, pulang wang),
  pautan kata laluan manual + butang WhatsApp, semak status pesanan ToyyibPay, muat turun CSV

### Buku resepi PDF (100 hidangan Malaysia)

`npm run buku` menjana `fitness/buku/keluaran/BentukBadan-100-Hidangan.pdf` (108 halaman A4):
kulit, cara guna, kandungan, 4 bab (sarapan, makan tengah hari, makan malam, snek) dan 100 resepi
dengan bahan, kalori, protein, karbohidrat, lemak, masa dan cara penyediaan. Resepi disunting dalam
`fitness/buku/resepi.mjs`; gambar diletak dalam `fitness/buku/gambar/` (lihat BACA.md di situ).
Pembeli muat turun buku ini melalui `/api/premium/buku`.

### Cuba di komputer

```sh
ADMIN_EMAILS=anda@contoh.com npm run fitness:demo   # http://localhost:3000, bayaran demo
                                                    # e-mel dicetak ke terminal
npm run test:fitness     # ujian server + aliran bayaran dengan ToyyibPay palsu
```

### Jual betul-betul

1. Daftar di [ToyyibPay](https://toyyibpay.com) (cuba dulu di sandbox `dev.toyyibpay.com`).
2. Cipta **Category**, salin **Category Code** dan **User Secret Key**.
3. `cp fitness/.env.example fitness/.env` dan isi semua nilai.
4. Deploy ke host Node.js (Render, Railway, VPS) dengan HTTPS dan cakera kekal untuk `fitness/data/`.
   Jalankan `npm run fitness`.
5. Daftar akaun biasa di laman anda dengan e-mel dalam `ADMIN_EMAILS`, kemudian buka `/admin`.
6. (Pilihan) Daftar di [Resend](https://resend.com), sahkan domain, isi `RESEND_API_KEY` dan `MAIL_FROM`.
   Tanpa ini, laman tetap jalan, tapi pelanggan tak dapat e-mel. Guna butang "Pautan kata laluan" di admin.
7. Buat satu pembelian ujian di sandbox, kemudian tukar `TOYYIBPAY_BASE=https://toyyibpay.com` dan kunci live.

Struktur:

```
fitness/server.mjs          Server HTTP + API
fitness/lib/                Klien ToyyibPay, e-mel (Resend), pangkalan data fail JSON
fitness/content/            Resepi & modul (edit di sini untuk tambah kandungan)
fitness/public/index.html   Laman depan
fitness/public/admin.html   Halaman admin
fitness/data/               Data pelanggan (git-ignored, buat backup!)
```
