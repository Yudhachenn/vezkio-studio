const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const src = fs.readFileSync(require('node:path').join(__dirname, '../docs/app.js'), 'utf8');
function element() { return { textContent:'', href:'', classList:{remove(){},add(){}}, setAttribute(k,v){this[k]=v}, removeAttribute(k){delete this[k]}, innerHTML:''}; }
async function run(mock) {
  const nodes = Object.fromEntries(['year','download-button','release-meta'].map(k=>[k,element()]));
  const context = { document: {getElementById:k=>nodes[k]}, Date, AbortController, setTimeout, clearTimeout,
    fetch:async ()=>({ok:mock.ok,json:async()=>mock.data,status:mock.ok?200:404}) };
  vm.runInNewContext(src,context);
  await new Promise(r=>setTimeout(r,30));
  return nodes;
}
(async () => {
  const unavailable=await run({ok:false});
  assert.match(unavailable['download-button'].innerHTML,/Belum ada installer publik/);
  const available=await run({ok:true,data:{tag_name:'v1.2.0',draft:false,prerelease:false,assets:[{name:'VEZKIO_Studio_1.2.0_x64-setup.exe',browser_download_url:'https://github.com/Yudhachenn/vezkio-studio/releases/download/v1.2.0/VEZKIO_Studio_1.2.0_x64-setup.exe'}]}});
  assert.match(available['download-button'].innerHTML,/Download for Windows/);
  assert.match(available['download-button'].href,/setup\.exe$/);
  const prerelease=await run({ok:true,data:{tag_name:'v1.2.0-rc.1',draft:false,prerelease:true,assets:[]}});
  assert.match(prerelease['download-button'].innerHTML,/Belum ada installer publik/);
  console.log('PASS 3 landing page download-state checks (404, stable, prerelease)');
})().catch(e=>{console.error(e);process.exitCode=1;});
