# VEZKIO Studio — Aurora UI Update

## Requirements
Existing VEZKIO Studio v1.0.1 project (Tauri 2 + React) with dependencies already installed.

## Install
1. Stop `npm run tauri dev` (Ctrl+C).
2. Back up `D:\Projects\vezkio\src` (at least `App.tsx`, `main.tsx`).
3. Extract AURORA_UI_PATCH.zip into `D:\Projects\vezkio` and **replace same-name files**.
4. Open the x64 Native Tools Command Prompt for VS (if required by your Rust setup).
5. Run:

```bat
cd /d D:\Projects\vezkio
npm run check
npm run tauri dev
```

## What's new
- Aurora Dark visual system, refined hierarchy, elevated artboard presentation.
- Professional topbar, rail navigation, editor toolbar, panels, inspector, and dialogs.
- Lightweight 145–180ms hover and transition animations, with reduced-motion support.
- Ctrl+K keyboard action search. Quick Actions also available from topbar.
- Contextual artboard name / size and concise status bar.

## Preserved
- Document model, Rust backend, Konva canvas engine, autosave/IndexedDB, export, and Motion/Lab panels are not rewritten.
- No new runtime dependencies and no network assets are required.

## Important
- Patch updates `src/App.tsx` and `src/main.tsx`; back up local customizations before replacement.
- Source syntax was checked with the TypeScript parser. Full typechecking and Windows Tauri runtime were NOT validated here because package installation was unavailable. Run `npm run check` locally.
- If your local `App.tsx` differs from the supplied v1.0.1 release, merge rather than overwrite it.

## Undo
Restore backed-up App.tsx / main.tsx. Optionally remove premium.css.
