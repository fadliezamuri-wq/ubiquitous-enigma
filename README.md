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

## Game: Raja Gelanggang (tinju)

Game tinju "survivor" dalam gelanggang. Watak kau tumbuk sendiri musuh yang paling dekat;
kau cuma gerak, kutip syiling (🪙) dan permata XP. Setiap naik tahap, pilih 1 daripada 3 kad kuasa
(Kuasa, Jangkauan, Laju Tumbuk, Tolakan, Tangan Berganda, Kritikal, Magnet dan lain-lain).
Habiskan sasaran musuh untuk panggil bos; kalahkan bos untuk ke peringkat seterusnya.
Syiling disimpan untuk naik taraf kekal di kedai menu utama.

Cara main: buka `game/raja-gelanggang/index.html` dalam pelayar. Telefon: seret jari untuk bergerak.
Komputer: WASD / anak panah, `P` untuk rehat.
