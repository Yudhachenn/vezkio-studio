# Panduan pemasangan — VEZKIO Aurora Creative Suite 1.2

## A. Backup dulu (WAJIB)

1. Tutup jendela VEZKIO dev, lalu `Ctrl+C` pada terminal yang menjalankan `npm run tauri dev`.
2. Backup source proyekmu, terutama jika ada edit lokal yang belum kamu kirim ke ChatGPT:

```bat
robocopy D:\Projects\vezkio D:\Projects\vezkio-backup /E /XD node_modules target dist .git .testbuild
```

> `robocopy` bisa mengembalikan exit code 1–7 walaupun pekerjaan berhasil. Periksa hasil dan folder backup. Backup file source di atas berbeda dari backup dokumen VEZKIO (.vezkio) — ekspor dokumen penting secara terpisah juga.

## B. Pasang source ZIP

1. Unduh paket `VEZKIO_Aurora_Creative_Suite_v1.2_SOURCE.zip`.
2. Ekstrak sehingga terlihat `src`, `src-tauri`, `package.json`, `vite.config.ts` dan file README di folder hasil ekstrak.
3. Salin ISI folder ekstrak ke `D:\Projects\vezkio\`, pilih **Replace** bila diminta.
4. Jangan menyalin `.testbuild` (tidak ada dalam ZIP), `node_modules`, atau `src-tauri/target`.
5. Jangan menghapus folder data aplikasi, karena project/autosave masih ada di IndexedDB milik WebView.

**Alternatif untuk proyek dengan banyak perubahan lokal:** gunakan `VEZKIO_Aurora_Creative_Suite_v1.2_PATCH.zip`, yang hanya berisi file yang perlu ditambah/diganti. Tetap backup dahulu.

## C. Install dependencies dan tes

Gunakan **x64 Native Tools Command Prompt for VS** (bukan PowerShell biasa) karena Cargo butuh MSVC linker:

```bat
cd /d D:\Projects\vezkio
npm install
npm run check
npm run test:creative
npm run tauri dev
```

Jika `npm run check` menampilkan error TypeScript, berhenti dan perbaiki dulu; jangan lanjut build installer. Jika `EBUSY` kembali muncul, verifikasi `vite.config.ts` mengabaikan `**/src-tauri/**` dan `**/target/**`; cek proses lain yang mengunci file.

## D. Cek semua fitur

Buka toolbar atas → **CREATIVE SUITE**. Ikuti **QA_CHECKLIST.md** dan uji desain dengan beberapa elemen, foto, dan teks. Verifikasi bahwa fitur lama LAB dan MOTION masih terbuka.

## E. Build installer NSIS (setelah semua lolos)

```bat
cd /d D:\Projects\vezkio
npm run tauri build
```

Output biasanya: `D:\Projects\vezkio\src-tauri\target\release\bundle\nsis\`.

Uji installer dengan akun Windows lain atau VM, termasuk install, uninstall, open/save file, dan keamanan. Source ini **belum** menyertakan kode signing, sertifikasi, situs download, atau publikasi GitHub.
