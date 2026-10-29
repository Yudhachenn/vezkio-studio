# Acceptance checklist — VEZKIO Aurora Creative Suite 1.2

## Foundation / regression
- [ ] `npm install` berhasil di Windows
- [ ] `npm run check` tanpa error TypeScript
- [ ] `npm run test:creative` meluluskan 16 tes
- [ ] `npm run tauri dev` membuka aplikasi desktop
- [ ] Main editor: tambah teks, rectangle, ellipse, gambar, drag, resize, rotate
- [ ] Undo/redo, lock/hide/group layers, multi-page, template lama tetap bekerja
- [ ] LAB lama (Design DNA, Story Lens, Capsules) tetap terbuka
- [ ] MOTION lama (preset, timeline, format, WebM jika tersedia) tetap terbuka
- [ ] Autosave dan buka ulang proyek tetap bekerja; eksport/import .vezkio

## Creative Suite / seven features
- [ ] Reality Lab: ganti Shorts/TikTok/Reels, overlay dan temuan tampak
- [ ] Mutation: keenam preview berbeda, terapkan, lalu Undo
- [ ] Motion Radar: ganti preset dan dapatkan temuan bila teks bertabrakan
- [ ] Constitution: aktifkan, pin layer, coba geser/hapus; layer tetap dipertahankan
- [ ] Constitution: atur minimum font/margin; audit memunculkan peringatan
- [ ] Repair: gambar keluar batas -> preview before/after -> apply -> Undo
- [ ] Guardian: desain bermasalah -> review -> acknowledge -> ekspor PNG/SVG
- [ ] Guardian: .vezkio tetap bisa disimpan walaupun ada temuan
- [ ] Replay: edit desain beberapa kali dengan jeda, buka Replay dan putar checkpoint
- [ ] Replay: restore checkpoint, kemudian Undo

## Performance / stability
- [ ] Uji 10, 50, 150, 300, dan >300 layer; perhatikan konsumsi RAM/CPU
- [ ] Uji 8 MB gambar dan proyek halaman 9:16
- [ ] Pastikan dialog tidak membuat UI macet pada laptop RAM 8 GB
- [ ] Uji setelah aplikasi ditutup/dibuka lagi, dan data tidak hilang
- [ ] Tidak ada kebocoran gambar pada snapshot Replay (pakai .vezkio untuk backup)
- [ ] Uji cancel dialog save/open dan tanda peringatan Windows

## Release gate
- [ ] Build Windows NSIS berhasil tanpa error
- [ ] Installer berjalan di komputer bersih / VM
- [ ] Install/uninstall/reinstall tidak merusak proyek pengguna
- [ ] Review keamanan/CSP, nama brand, lisensi, tanda tangan digital
- [ ] Baru setelah semuanya lolos: GitHub Release dan landing page download


## Installer + landing page QA (mandatory before public stable)
- [ ] npm run check; npm run test:creative; npm run build pass on Windows.
- [ ] Installer builds on Windows (NSIS) and SHA256SUMS.txt matches.
- [ ] Setup installs, launches, upgrades and uninstalls cleanly with standard user account.
- [ ] Persisted .vezkio projects survive app updates.
- [ ] Import untrusted/corrupted project gracefully shows error (no crash).
- [ ] Windows SmartScreen/code signing behaviour documented, no "trusted/signed" false claims.
- [ ] Test 8 GB RAM device using 100, 500 and 1000 layers and large images; measure memory and frame rate.
- [ ] Landing page keyboard navigation and mobile layout tested.
- [ ] Public latest stable GitHub Release contains *-setup.exe; download button points to correct GitHub asset.
- [ ] Source publication licensing decision and privacy notice reviewed.
