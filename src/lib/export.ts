import {isTauri} from '@tauri-apps/api/core';
import type {Page,Project,Element} from './model';
import {cleanName} from './model';
const xml=(t:string)=>t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
export function pageSvg(page:Page):string {
  const paths=page.elements.filter(n=>!n.hidden).map(n=>{
    const base=`transform="translate(${n.x} ${n.y}) rotate(${n.rotation})" opacity="${n.opacity}"`;
    if(n.kind==='rect')return `<rect ${base} width="${n.width}" height="${n.height}" rx="${n.borderRadius??0}" fill="${xml(n.fill)}"/>`;
    if(n.kind==='ellipse')return `<ellipse ${base} cx="${n.width/2}" cy="${n.height/2}" rx="${n.width/2}" ry="${n.height/2}" fill="${xml(n.fill)}"/>`;
    if(n.kind==='image')return `<image ${base} width="${n.width}" height="${n.height}" href="${xml(n.image??'')}" preserveAspectRatio="none"/>`;
    const size=n.fontSize??42;
    const lines=(n.text??'').split('\n').map((line,i)=>`<tspan x="0" dy="${i?size*1.15:0}">${xml(line)}</tspan>`).join('');
    return `<text ${base} fill="${xml(n.fill)}" font-family="${xml(n.fontFamily??'Arial')}" font-size="${size}" font-weight="700" dominant-baseline="text-before-edge">${lines}</text>`;
  }).join('\n');
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${page.width}" height="${page.height}" viewBox="0 0 ${page.width} ${page.height}"><rect width="100%" height="100%" fill="${xml(page.background)}"/>${paths}</svg>`;
}
export async function saveBytes(data:Uint8Array, filename:string, extensions:string[],mime:string):Promise<boolean>{
  if(isTauri()){
    const {save}=await import('@tauri-apps/plugin-dialog');
    const {writeFile}=await import('@tauri-apps/plugin-fs');
    const path=await save({defaultPath:filename,filters:[{name:extensions.join(', ').toUpperCase(),extensions}]});
    if(!path)return false;
    await writeFile(path,data);
    return true;
  }
  const blob=new Blob([new Uint8Array(data)],{type:mime}); const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),12000);return true;
}
export const saveText=(text:string, filename:string,ext:string,mime='text/plain')=>saveBytes(new TextEncoder().encode(text),filename,[ext],mime);
export const saveDocument=(project:Project)=>saveText(JSON.stringify(project,null,2),`${cleanName(project.name)}.vezkio`,'vezkio','application/json');
export const saveSvg=(page:Page, name:string)=>saveText(pageSvg(page),`${cleanName(name)}.svg`,'svg','image/svg+xml');
export async function savePng(dataUrl:string,name:string):Promise<boolean>{
  const response=await fetch(dataUrl);
  return saveBytes(new Uint8Array(await response.arrayBuffer()),`${cleanName(name)}.png`,['png'],'image/png');
}
export const isText=(n:Element)=>n.kind==='text';
