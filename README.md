# VEZKIO Studio Aurora v1.2.0 — Release Kit

# VEZKIO Studio Aurora — Creative Suite v1.2.0

**Status: test build / release candidate, NOT a public-ready release.**

Offline-first creative editor for Windows (Tauri 2 + Rust + React + TypeScript + Konva). This source is based on the **VEZKIO Aurora Full Source** package previously supplied in this conversation. Existing editor functionality remains: layer inspector, multi-page projects, Konva canvas manipulation, undo/redo, Design DNA Lab, Motion DNA, format morph, PNG/SVG/.vezkio export, project import, IndexedDB autosave, local capsules, Quick Actions (Ctrl+K), and Aurora dark UI.

## NEW: 7 Creative Suite modules

Open **CREATIVE SUITE** in the top toolbar (or Ctrl+K → Open Creative Suite).

1. **Reality Lab** — Simulated YouTube Shorts, TikTok, Reels, square and landscape overlays, checks off-canvas elements, text contrast and likely UI overlap. **Approximate overlays only**, not pixel-perfect current platform UIs.
2. **Mutation Engine** — Six deterministic layout variants; maintains layer IDs, names, colors, text content and image references. Keeps native locked layers and Constitution-pinned layers unchanged. Use Undo after Apply.
3. **Motion Collision Radar** — Samples 25 moments using a single selected Motion DNA preset, detects text-text intersections and off-canvas trajectories. Limited to first 120 visible layers. Does not read Motion Studio's unsaved per-layer settings.
4. **Design Constitution** — Optional rules saved inside native project: minimum margin and font size, palette text warnings, and *hard protection* for selected layer IDs. Hard protection is enforced through the editor commit path; other rules are audits and optional repairs. Existing `locked` behavior remains.
5. **One-Click Repair** — Preview and apply proposed bounds, margins, font-size and sampled contrast fixes, skipping locked/pinned objects. Not a universal layout solver and may change deliberate full-bleed designs.
6. **Export Guardian** — Quality preflight for PNG/SVG. Warnings must be acknowledged before export; `.vezkio` backup always accessible. Does not guarantee SVG fidelity or image quality.
7. **Creative Replay** — Throttled edit checkpoints per project, up to 42 in IndexedDB. Preview, play and restore. Embeddable image bytes are omitted from snapshots for memory efficiency; matching current images are reused on restore. If images were deleted, snapshots cannot recover their pixels. Save `.vezkio` backup for data safety.

## Install on Windows 11

See **INSTALL_WINDOWS.md** (recommended) and **QA_CHECKLIST.md**.

### Quick commands

Open **x64 Native Tools Command Prompt for VS**, then:

```bat
cd /d D:\Projects\vezkio
npm install
npm run check
npm run test:creative
npm run tauri dev
```

Do not run a second Tauri dev server if one is already active. On first build Cargo compiles Tauri and can require substantial disk/RAM/time; the initial build can be slow. If `link.exe` is missing, use x64 Native Tools Command Prompt and install the *Desktop development with C++* workload.

### Build installer only AFTER QA is complete

```bat
npm run tauri build
```

Expected result on Windows: `src-tauri\target\release\bundle\nsis\...-setup.exe` (actual filename may differ). No installer binary is included in this ZIP and **nothing has been pushed to GitHub**.

## RAM / CPU design

- Reality/Guardian/Repair/Motion analysis is computed in the Creative Suite only, not permanently in the editor background.
- Six mutation thumbnails are rendered at small preview dimensions and do not run endless animation loops.
- Motion check samples fixed 25 positions, first 120 visible layers; some collision scans cap text comparisons.
- Replay stores max 42 checkpoint pages, excludes base64 image bytes, records at most once per 1.4s, skips snapshots for pages >300 elements.
- IndexedDB autosave retains image data for regular projects; `.vezkio` export remains the durable backup.
- Browser and Tauri WebView memory depends on source image sizes and number of elements; **60 FPS or an 8 GB ceiling is not guaranteed**.

## Tests and limitations

See **TEST_REPORT.md**. Verified: 16 pure-engine tests pass; all TS/TSX files parsed without syntax error. NOT verified in this environment: complete React TypeScript check with npm packages, Vite bundling, Windows Rust build, runtime UI and NSIS installer. Run checks on your own Windows PC before release.

## Safe collaboration and release

- Avoid storing secrets in source code or project files.
- Test importing untrusted `.vezkio` files only in a sandbox: validation has bounds, but source still needs security auditing before public release.
- Version 1.2 is a source milestone, not a claim to feature parity with Canva/Figma.
- Do not publish this as stable or promise zero lag until acceptance tests pass.


---

## Distribution preparation included
- GitHub Actions: Windows TypeScript checks, creative engine tests, NSIS setup build, optional **draft** prerelease upload.
- GitHub Pages landing page at `docs/index.html` (static, accessible, responsive).
- `scripts/release-preflight.cjs` checks required files and version consistency.
- `RELEASE_GUIDE.md` explains local build, repository creation, Windows testing and publishing.

**IMPORTANT:** No public release, GitHub repo or installer has been created by preparing these source files.
