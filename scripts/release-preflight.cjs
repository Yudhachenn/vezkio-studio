const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
function data(p) { return JSON.parse(fs.readFileSync(path.join(root,p),'utf8')); }
const pkg = data('package.json');
const tauri = data('src-tauri/tauri.conf.json');
const cargo = fs.readFileSync(path.join(root,'src-tauri/Cargo.toml'),'utf8');
const required = ['src/App.tsx','src/components/CreativeSuite.tsx','docs/index.html',
  'docs/app.js','docs/style.css','.github/workflows/ci.yml',
  '.github/workflows/release-windows.yml','.github/workflows/pages.yml'];
let errors = 0;
for (const file of required) {
  if (!fs.existsSync(path.join(root,file))) { console.error('MISSING:',file); errors++; }
}
if (pkg.version !== tauri.version || !cargo.includes(`version = "${pkg.version}"`)) {
  console.error('VERSION MISMATCH:', pkg.version,tauri.version); errors++;
}
if (!tauri.bundle?.targets?.includes('nsis')) { console.error('NSIS target missing'); errors++; }
if (tauri.app?.security?.csp == null) console.warn('WARN: Tauri CSP not configured. Security review required before public stable release.');
if (!fs.existsSync(path.join(root,'package-lock.json'))) console.warn('WARN: package-lock.json absent; run npm install on Windows and commit lockfile before release.');
if (errors) process.exit(1);
console.log('PRE-FLIGHT OK: required files, versions, NSIS target checked.');
