export type Kind = 'rect' | 'ellipse' | 'text' | 'image';
export type Element = {
  id: string; kind: Kind; name: string;
  x: number; y: number; width: number; height: number;
  rotation: number; fill: string; opacity: number;
  hidden?: boolean; locked?: boolean; groupId?: string;
  text?: string; fontSize?: number; fontFamily?: string;
  image?: string; borderRadius?: number;
};
export type Page = {id: string; name: string; width: number; height: number; background: string; elements: Element[]};
import type {Constitution} from './creative';
export type Project = {constitution?:Constitution;format: 'vezkio-studio'; version: 1; id: string; name: string; pages: Page[]; activePageId: string; updatedAt: string};
export type Capsule = {id: string; name: string; date: string; project: Project};
export const id = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `vz-${Date.now()}-${Math.random().toString(36).slice(2)}`);
export const deepClone = <T,>(value:T): T => structuredClone(value);
export const e = (kind: Kind, values: Partial<Element> = {}): Element => ({
  id:id(), kind, name:kind === 'rect' ? 'Rectangle' : kind === 'ellipse' ? 'Ellipse' : kind === 'text' ? 'Text' : 'Image',
  x:170,y:170,width:260,height:180,rotation:0,fill:'#9279fa',opacity:1,borderRadius:18,
  ...(kind === 'text' ? { text:'Your next big idea', fontSize:54, fontFamily:'Arial', fill:'#ffffff',width:490,height:145 } : {}),
  ...values
});
export function createPage(name='Page 1', width=1080,height=1080): Page {return {id:id(),name,width,height,background:'#f7f3ff', elements:[]};}
export function createProject(): Project {
  const page=createPage('Cover');
  page.elements=[
    e('rect',{name:'Main card',x:65,y:65,width:950,height:950,fill:'#4330a2',borderRadius:48}),
    e('ellipse',{name:'Sunrise',x:700,y:162,width:260,height:260,fill:'#ffb58c'}),
    e('text',{name:'Eyebrow',x:125,y:190,width:590,height:55,fontSize:31,fill:'#c6b9ff',text:'VEZKIO  /  CREATIVE STUDIO'}),
    e('text',{name:'Main title',x:115,y:475,width:810,height:260,fontSize:110,fill:'#ffffff',text:'MAKE IT\nHAPPEN.'}),
    e('text',{name:'Subtitle',x:125,y:825,width:780,height:80,fontSize:38,fill:'#e9ddff',text:'Create beyond the canvas.'})
  ];
  return {format:'vezkio-studio',version:1,id:id(),name:'Untitled masterpiece',pages:[page],activePageId:page.id,updatedAt:new Date().toISOString()};
}
export function isValidProject(raw: unknown): raw is Project {
  if (!raw || typeof raw !== 'object') return false;
  const v=raw as Record<string,unknown>;
  if(v.format!=='vezkio-studio'||v.version!==1||typeof v.name!=='string'||!Array.isArray(v.pages)||!v.pages.length||v.pages.length>100) return false;
  if(v.constitution !== undefined){
    if(!v.constitution || typeof v.constitution!=='object')return false;
    const c=v.constitution as Record<string,unknown>;
    if(typeof c.enabled!=='boolean'||typeof c.enforcePalette!=='boolean')return false;
    if(typeof c.minMargin!=='number'||!Number.isFinite(c.minMargin)||c.minMargin<0||c.minMargin>500)return false;
    if(typeof c.minFontSize!=='number'||!Number.isFinite(c.minFontSize)||c.minFontSize<8||c.minFontSize>120)return false;
    if(!Array.isArray(c.palette)||c.palette.length>12||!c.palette.every(x=>typeof x==='string'&&/^#[0-9a-f]{6}$/i.test(x)))return false;
    if(!Array.isArray(c.protectedIds)||c.protectedIds.length>2500||!c.protectedIds.every(x=>typeof x==='string'))return false;
  }
  if (!v.pages.every(p=>{
    if (!p || typeof p!=='object') return false;
    const page=p as Record<string,unknown>;
    return typeof page.id==='string' && typeof page.width==='number' && page.width>=100 && page.width<=5000 && typeof page.height==='number' && page.height>=100 && page.height<=5000 && typeof page.background==='string' && Array.isArray(page.elements) && page.elements.length<=2500 && page.elements.every(el=>{
      if(!el||typeof el!=='object')return false;
      const item=el as Record<string,unknown>;
      return typeof item.id==='string' && ['rect','ellipse','text','image'].includes(String(item.kind)) && ['x','y','width','height','rotation','opacity'].every(k=>typeof item[k]==='number'&&Number.isFinite(item[k] as number)) && typeof item.fill==='string';
    });
  })) return false;
  return typeof v.activePageId==='string' && v.pages.some(p=>(p as Page).id===v.activePageId);
}
export const cleanName=(s:string)=>s.replace(/[\\/:*?"<>|\x00-\x1f]/g,'_').slice(0,90)||'VEZKIO';
