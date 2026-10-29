# VEZKIO v1.0.1 — fixes for Windows npm run check

Fixed in this revision:
- `vite.config.ts`: ignores `src-tauri/` and `target/` to prevent Vite watcher EBUSY failures on Cargo executables.
- `src/components/EditorCanvas.tsx`: removes unsafe Konva drag event type assertion; uses typed explicit transform update array.
- `src/components/MotionPanel.tsx`: fixes undefined `recorderRef` to existing `recordRef`.

## On Windows
1. Back up your existing project, especially any local changes.
2. Copy these files into your existing `D:\Projects\vezkio` directory, overwriting files with the same names.
3. From `x64 Native Tools Command Prompt` run `npm run check` and `npm run tauri dev`.
4. If a check fails, share the new log. Windows build and installer have **not** been validated here.

NOTE: If `vite.config.ts` contains lines like `D:\Projects\vezkio>npm run check`, the terminal output was accidentally pasted into a TypeScript file. Replacing it with the correct config fixes the long series of 'Invalid character' errors.
