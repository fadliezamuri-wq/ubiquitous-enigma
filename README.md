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

Laman jualan untuk orang yang nak kuruskan badan dan bina otot. Buka `fitness/index.html` dalam pelayar.

- Kalkulator kalori & makro (BMR Mifflin-St Jeor + TDEE + BMI ikut panduan Asia)
- Resepi dengan kalori, protein, karbo dan lemak. 4 resepi percuma, 4 premium dikunci
- 6 modul panduan penuh (pelan makan, program latihan gym/rumah, plateau) yang dibuka selepas beli
- Butang **Beli** (RM49) dengan borang checkout

Untuk jualan sebenar, letak pautan bayaran (ToyyibPay / Billplz / Stripe) dalam `PAYMENT_LINK`
di bahagian atas skrip, dan tetapkan URL pulang gateway kepada `.../fitness/?akses=berjaya`.
Jika `PAYMENT_LINK` kosong, checkout berjalan dalam mod demo.
