# VEZKIO Studio v1.0 — Windows 11 release checklist

## Before shipping publicly

- [ ] `npm install` succeeds with internet access.
- [ ] `npm run check` prints no TypeScript errors.
- [ ] `npm run build` creates a `dist/` folder.
- [ ] `npm run tauri dev` opens VEZKIO Studio on Windows 11.
- [ ] Import and export `.vezkio` works using native file picker.
- [ ] Export PNG and SVG files; verify against canvas.
- [ ] Verify multi-select, group/ungroup, hide/lock, align, undo/redo.
- [ ] Verify Time Capsules persist across app restarts.
- [ ] Test WebM export in browser and in native WebView2; failures are handled.
- [ ] Verify open/restore on at least two new sample projects.
- [ ] Test 8 MB image upload, low free disk, long text, multi-page file.
- [ ] Benchmark latency and RAM on 8 GB Windows laptop.
- [ ] `npm run tauri build` creates `src-tauri\\target\\release\\bundle\\nsis\\*setup.exe`.
- [ ] Test install, launch, close, uninstall, reinstall on a clean Windows PC.
- [ ] Review CSP, dependency security, licensing, privacy, branding, installer signing, website domain.

Only publish the installer after the checklist passes. The archive is source code, not a precompiled Windows executable. The v1.0 label is a code milestone, **not a statement of commercial production readiness**.
