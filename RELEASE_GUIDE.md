# VEZKIO Studio — Publishing guide (Windows + GitHub + landing page)

## Status of this release kit
This package **does not include a built .exe**, and no repository or public release has been created automatically. Source code was prepared from the v1.2 package you already tested. GitHub Actions builds the installer on Windows. The GitHub Pages site reads the actual public latest GitHub release and only enables the download button if a `*-setup.exe` asset exists.

## 1. Before uploading
1. Make a backup of `D:\Projects\vezkio` and important `.vezkio` project files.
2. Extract this ZIP into `D:\Projects\vezkio` after verifying it does not overwrite newer local changes. Use a separate folder first if your copy was modified.
3. In **x64 Native Tools Command Prompt for VS**:
   ```bat
   cd /d D:\Projects\vezkio
   npm install
   npm run check
   npm run test:creative
   npm run build
   npm run tauri build -- --bundles nsis
   ```
4. Test importing/exporting large projects, reopening a saved file, Windows installer installation/uninstall, and Defender/SmartScreen behavior. See QA_CHECKLIST.md.
5. Generate and commit `package-lock.json` after a successful `npm install`. Use `npm ci` subsequently.

## 2. Create the GitHub repository
GitHub account in this project: `Yudhachenn`. Repository destination set in website JavaScript: `Yudhachenn/vezkio-studio`.

If this repository is not yet present, create an **empty public GitHub repository** named `vezkio-studio` under the desired GitHub account. Avoid initializing a README in the web interface if you will push the supplied project, so histories don't conflict.

Using Git from the project root (Git may prompt for authentication):
```bat
cd /d D:\Projects\vezkio
git init
git add .
git commit -m "VEZKIO Aurora 1.2 release candidate and distribution kit"
git branch -M main
git remote add origin https://github.com/Yudhachenn/vezkio-studio.git
git push -u origin main
```
If you already have a Git repo, inspect `git remote -v` and don't run `git init`/`git remote add` blindly. Don't commit personal project files, credentials, private assets, `node_modules`, or `src-tauri/target`.

**License:** Public GitHub repositories show source but do not grant a reuse license automatically. Decide whether you want open-source (e.g., MIT/Apache) before adding a LICENSE; the current kit does **not** select one on your behalf.

## 3. Build the installer with GitHub Actions
1. Open repository → **Actions** → **Build Windows installer (draft release)**.
2. Select **Run workflow**, leave **publish_draft = false** for first build.
3. After the Windows runner finishes, download artifact `VEZKIO-Windows-NSIS-candidate`.
4. Test the extracted setup EXE on Windows; verify SHA256 checksums and QA checklist.
5. For a draft release after passing QA, run again with tag `v1.2.0-rc.1` and **publish_draft = true**. It will create a **draft prerelease**, invisible to ordinary site visitors until you publish it manually.
6. Publishing a GitHub Release is a separate explicit action in GitHub → Releases. A public **prerelease** will not be selected by the landing page's `latest` stable API. A stable release with an installer asset is necessary to enable the main Download button.

The release workflow does not auto-publish a public installer and cannot claim code signing. To distribute without SmartScreen warnings, follow current Tauri Windows code signing guidance.

## 4. Deploy landing page (GitHub Pages)
1. In repository **Settings → Pages**, choose **Build and deployment → Source: GitHub Actions**.
2. Go to **Actions → Deploy VEZKIO download site** → Run workflow (or push a change to `docs/`).
3. The expected URL will be `https://Yudhachenn.github.io/vezkio-studio/` (only after repo exists and Pages is enabled).
4. Page fetches the latest public stable release via GitHub API; until then, download is clearly shown unavailable. No fake binaries or download times.

## 5. Check before public launch
- Review security. Current source sets Tauri `csp` to null; this should be tightened and tested before a stable release.
- Audit file import, data handling, installer, third-party licenses and font/image assets.
- Decide public source license and privacy/support policy.
- Confirm frontend TypeScript build, creative engine tests, Windows Tauri NSIS installation/uninstallation, performance on RAM 8 GB.
- Code sign Windows builds when possible and explain unsigned installer limitations until signing is set up.
- Verify public landing page download asset, checksum, release notes.
