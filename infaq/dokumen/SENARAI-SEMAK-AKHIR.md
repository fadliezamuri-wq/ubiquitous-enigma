# Senarai Semak Akhir Sebelum Kempen Dilancarkan

Tandakan setiap perkara. Jangan lancarkan selagi ada perkara yang belum ditanda.

## A. Kelulusan organisasi
- [ ] Syarat kempen (termasuk kaedah pemutus seri dan "satu peluang setiap telefon") diluluskan pengurusan
- [ ] Notis privasi disemak oleh penasihat undang-undang / pegawai PDPA dan tanda **DRAF** dibuang (`src/html/Privasi.html`)
- [ ] Tempoh simpanan data diluluskan dan diisi dalam Tetapan
- [ ] Isu hukum/peraturan peraduan berhadiah disemak oleh pihak berkaitan (contohnya pandangan syariah dan keperluan permit, jika ada)
- [ ] Logo rasmi YAPEIM diterima daripada unit komunikasi dan diletakkan di `aset/logo-yapeim.png`, kemudian `npm run build` dijalankan

## B. Akaun & akses
- [ ] Sistem dipasang dalam **akaun Google rasmi organisasi**
- [ ] Kata laluan `admin` sudah ditukar
- [ ] Setiap staf mempunyai akaun sendiri (tiada perkongsian akaun) dengan peranan yang betul
- [ ] Google Sheet dan folder resit **tidak dikongsi** dengan sesiapa (semak butang *Share*)
- [ ] Pengesahan dua langkah (2-Step Verification) dihidupkan pada akaun Google organisasi

## C. Tetapan
- [ ] Tarikh & masa mula/tamat betul (waktu Malaysia)
- [ ] Sumbangan minimum, bilangan peserta terpantas dan hadiah betul
- [ ] Senarai kaedah sumbangan betul
- [ ] Emel/telefon pertanyaan diisi
- [ ] Zon masa projek Apps Script ialah GMT+08:00

## D. Ujian (data palsu sahaja)
- [ ] Borang dihantar dari iPhone **dan** Android (gambar kamera dan PDF)
- [ ] ID penyertaan dipaparkan selepas penghantaran
- [ ] Resit boleh dilihat dalam dashboard, kemudian diluluskan, ditolak dan diminta pembetulan
- [ ] Hantar semula resit yang sama dan pastikan ID asal dipulangkan
- [ ] Peserta terpantas dan cabutan UJIAN berfungsi, dan paparan siaran langsung diuji pada skrin projektor
- [ ] Dashboard dibuka tanpa log masuk (tetingkap peribadi) dan pastikan ia meminta kata laluan
- [ ] Eksport CSV dibuka dalam Excel
- [ ] Semakan integriti menunjukkan "Tiada pengubahan dikesan"
- [ ] **Semua data ujian dipadam** dan **mod ujian DIMATIKAN**

## E. QR Code & bahan promosi
- [ ] QR dijana daripada pautan `/exec` sebenar (bukan `/dev`, bukan pautan contoh)
- [ ] QR diimbas dengan kamera iPhone **dan** Android, dan ia membuka borang yang betul
- [ ] Cetak satu salinan percubaan dan imbas dari jarak 1 meter. Saiz QR pada poster mestilah sekurang-kurangnya 3 cm × 3 cm.
- [ ] Teks promosi disemak dan pautan dalam teks diuji

## F. Semasa & selepas kempen
- [ ] Staf menyemak resit setiap hari dan bilangan "Menunggu" dipantau
- [ ] Sandaran CSV/XLSX dibuat setiap minggu
- [ ] Selepas tamat: semua penyertaan disemak, kemudian cabutan RASMI dibuat (disaksikan) dan pemenang disahkan dengan resit/penyata bank
- [ ] Rekod cabutan (ID cabutan, hash, benih) disimpan untuk audit
- [ ] Data dipadam selepas tempoh simpanan tamat
