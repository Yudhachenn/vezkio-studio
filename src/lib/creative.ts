import type {Element, Page, Project} from './model';
import {deepClone} from './model';
import {defaultMotion} from './motion';
import type {MotionSettings, MotionType} from './motion';

export type Platform = 'shorts'|'tiktok'|'reels'|'square'|'landscape';
export type Severity = 'error'|'warning'|'info';
export type Finding = {code:string; severity:Severity; message:string; elementId?:string; fixable?:boolean; at?:number};
export type Constitution = {enabled:boolean; minMargin:number; minFontSize:number; palette:string[]; protectedIds:string[]; enforcePalette:boolean};
export const DEFAULT_CONSTITUTION:Constitution={enabled:false,minMargin:45,minFontSize:22,palette:['#4330a2','#ffffff','#ffb58c','#f7f3ff'],protectedIds:[],enforcePalette:false};
export type ReplayFrame = {id:string; timestamp:number; pageId:string; page:Page; description:string};
export const MAX_REPLAY_FRAMES=42;
const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n));
const color=(raw:string):[number,number,number]|null=>{const c=raw.replace('#','');if(!/^[0-9a-f]{6}$/i.test(c))return null;return [0,2,4].map(i=>parseInt(c.slice(i,i+2),16)) as [number,number,number];};
const lum=(value:string)=>{const rgb=color(value);if(!rgb)return undefined;const l=rgb.map(v=>{const x=v/255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4;});return .2126*l[0]+.7152*l[1]+.0722*l[2];};
export function contrast(a:string,b:string){const x=lum(a),y=lum(b);return x===undefined||y===undefined?undefined:(Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
export type Bounds={x:number;y:number;width:number;height:number};
export function bounds(el:Element):Bounds{const theta=el.rotation*Math.PI/180,c=Math.abs(Math.cos(theta)),s=Math.abs(Math.sin(theta));const width=el.width*c+el.height*s,height=el.width*s+el.height*c;return {x:el.x+(el.width-width)/2,y:el.y+(el.height-height)/2,width,height};}
const intersects=(a:Bounds,b:Bounds)=> Math.max(0,Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y));
export type Zone={x:number;y:number;width:number;height:number;label:string};
export function platformZones(page:Page,platform:Platform):Zone[]{
  const w=page.width,h=page.height;
  if(platform==='shorts'||platform==='tiktok'||platform==='reels'){
    const top=platform==='reels'?.10:.12, bottom=platform==='tiktok'?.24:.21;
    return [{x:0,y:0,width:w,height:h*top,label:'Header overlay (approx.)'},
      {x:0,y:h*(1-bottom),width:w,height:h*bottom,label:'Caption/action overlay (approx.)'},
      {x:w*.87,y:h*.2,width:w*.13,height:h*.65,label:'Action rail (approx.)'}];
  }
  if(platform==='square')return [{x:0,y:h*.88,width:w,height:h*.12,label:'Lower preview margin'}];
  return [{x:0,y:h*.88,width:w,height:h*.12,label:'Controls overlay (approx.)'}];
}
export function backdrop(page:Page,index:number,el:Element):string{
  const x=el.x+el.width*.5,y=el.y+el.height*.5;
  for(let i=index-1;i>=0;i--){const n=page.elements[i];if(n.hidden||n.opacity<.99||n.kind!=='rect'||n.rotation!==0)continue;
    if(x>=n.x&&x<=n.x+n.width&&y>=n.y&&y<=n.y+n.height)return n.fill;
  }
  return page.background;
}
export function auditPage(page:Page,constitution:Constitution=DEFAULT_CONSTITUTION, platform?:Platform):Finding[]{
  const issues:Finding[]=[];
  const visible=page.elements.filter(el=>!el.hidden);
  const zones=platform?platformZones(page,platform):[];
  page.elements.forEach((el,index)=>{
    if(el.hidden)return;
    const box=bounds(el);
    if(box.x<-1||box.y<-1||box.x+box.width>page.width+1||box.y+box.height>page.height+1)
      issues.push({code:'outside',severity:'error',elementId:el.id,fixable:true,message:`${el.name}: element extends beyond canvas`});
    if(constitution.enabled&& (box.x<constitution.minMargin||box.y<constitution.minMargin||box.x+box.width>page.width-constitution.minMargin||box.y+box.height>page.height-constitution.minMargin))
      issues.push({code:'margin',severity:'warning',elementId:el.id,fixable:true,message:`${el.name}: violates ${constitution.minMargin}px margin`});
    if(el.kind==='text'){
      const font=el.fontSize??42;
      if(font<(constitution.enabled?constitution.minFontSize:18))issues.push({code:'font',severity:'warning',elementId:el.id,fixable:true,message:`${el.name}: font ${font}px may be too small`});
      const ratio=contrast(el.fill,backdrop(page,index,el));
      if(ratio!==undefined&&ratio<(font>=32?3:4.5))issues.push({code:'contrast',severity:'warning',elementId:el.id,fixable:true,message:`${el.name}: estimated contrast ${ratio.toFixed(1)}:1`});
      if((el.text??'').length>0 && (el.text??'').split('\n').some(line=>line.length*font*.55>el.width*1.45))
        issues.push({code:'text-fit',severity:'info',elementId:el.id,message:`${el.name}: long text may wrap or clip`});
      if(constitution.enabled&&constitution.enforcePalette&&!constitution.palette.some(c=>c.toLowerCase()===el.fill.toLowerCase()))
        issues.push({code:'brand',severity:'warning',elementId:el.id,message:`${el.name}: text fill outside brand palette`});
    }
    if(el.kind==='image'&&!el.image)issues.push({code:'missing-image',severity:'error',elementId:el.id,message:`${el.name}: missing image source`});
    if(el.kind==='image'&&el.width<120&&el.height<120)issues.push({code:'resolution',severity:'info',elementId:el.id,message:`${el.name}: small displayed image; inspect resolution`});
    for(const z of zones){if(el.kind==='text'&&intersects(box,z)>Math.min(box.width*box.height,box.width*box.height*.1))
      issues.push({code:'overlay',severity:'warning',elementId:el.id,message:`${el.name}: may overlap ${z.label}`});}
  });
  const textVisible=visible.filter(el=>el.kind==='text').slice(0,180);
  for(let i=0;i<textVisible.length;i++)for(let j=i+1;j<textVisible.length;j++){
    const a=textVisible[i],b=textVisible[j];
    const overlap=intersects(bounds(a),bounds(b));
    if(overlap>Math.min(a.width*a.height,b.width*b.height)*.15)
      issues.push({code:'text-collision',severity:'warning',elementId:b.id,message:`${a.name} overlaps ${b.name} (approx.)`});
  }
  return issues;
}
export function repairPage(page:Page,policy:Constitution):{page:Page; changes:string[]}{
  const margin=policy.enabled?policy.minMargin:16;
  const changes:string[]=[];
  const elements=page.elements.map((el,index)=>{
    if(el.locked||(policy.enabled&&policy.protectedIds.includes(el.id)))return {...el};
    const next={...el};
    const fitX=Math.min(margin,Math.max(0,(page.width-16)/2));
    const fitY=Math.min(margin,Math.max(0,(page.height-16)/2));
    const maxW=Math.max(16,page.width-fitX*2),maxH=Math.max(16,page.height-fitY*2);
    if(next.width>maxW){next.width=maxW;changes.push(`${el.name}: shrink width`);}
    if(next.height>maxH){next.height=maxH;changes.push(`${el.name}: shrink height`);}
    const x=clamp(next.x,fitX,page.width-fitX-next.width),y=clamp(next.y,fitY,page.height-fitY-next.height);
    if(x!==next.x||y!==next.y){next.x=x;next.y=y;changes.push(`${el.name}: moved inside safe margins`);}
    if(next.kind==='text'){
      const size=Math.max(next.fontSize??42,policy.enabled?policy.minFontSize:18);
      if(size!==next.fontSize){next.fontSize=size;changes.push(`${el.name}: font size improved`);}
      const ratio=contrast(next.fill,backdrop(page,index,el));
      if(ratio!==undefined&&ratio<(size>=32?3:4.5)){
        const bg=backdrop(page,index,el);
        const white=contrast('#ffffff',bg)??0,black=contrast('#111827',bg)??0;
        const better=white>=black?'#ffffff':'#111827';
        if(next.fill!==better){next.fill=better;changes.push(`${el.name}: contrast improved`);}
      }
    }
    return next;
  });
  return {page:{...page,elements},changes};
}
export function guardProject(before:Project,after:Project):Project{
  const c=after.constitution;if(!c?.enabled||!c.protectedIds.length)return after;
  const keep=new Set(c.protectedIds);
  let changed=false;
  const pages=after.pages.map(p=>{
    const original=before.pages.find(z=>z.id===p.id);if(!original)return p;
    const previous=new Map(original.elements.filter(el=>keep.has(el.id)).map(el=>[el.id,el]));
    if(!previous.size)return p;
    const next=p.elements.map(el=>{const locked=previous.get(el.id);if(!locked)return el;previous.delete(el.id);if(JSON.stringify(locked)!==JSON.stringify(el)){changed=true;return {...locked};}return el;});
    if(previous.size){changed=true;next.push(...[...previous.values()].map(el=>({...el})));}
    return {...p,elements:next};
  });
  return changed?{...after,pages}:after;
}
const hash=(value:string)=>{let n=2166136261;for(const ch of value){n^=ch.charCodeAt(0);n=Math.imul(n,16777619);}return n>>>0;};
function prng(seed:number){let s=seed;return ()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};}
export function mutatePage(page:Page,variant:number,policy:Constitution=DEFAULT_CONSTITUTION):Page{
  const rng=prng(hash(page.id+'-'+variant));
  const margin=Math.min(policy.enabled?policy.minMargin:Math.round(Math.min(page.width,page.height)*.065),Math.floor(Math.min(page.width,page.height)*.25));
  const protectedIds=new Set(policy.enabled?policy.protectedIds:[]);
  const sx=[.9,1.06,.87,1.1,.96,1][variant%6],sy=[1,1,.92,.95,1.05,1.1][variant%6];
  const offsets=[[-.06,.02],[.05,-.05],[.03,.04],[-.04,-.02],[.04,.03],[0,-.05]][variant%6];
  return {...page,elements:page.elements.map((el,index)=>{
    if(el.locked||protectedIds.has(el.id))return {...el};
    const scale=el.kind==='text'?(index%2===0?sx:1/sx):sy;
    const width=clamp(Math.round(el.width*scale),16,Math.max(16,page.width-2*margin));
    const height=clamp(Math.round(el.height*(el.kind==='text'?1:scale)),16,Math.max(16,page.height-2*margin));
    const sign=index%2?1:-1;
    const x=clamp(Math.round(el.x+page.width*(offsets[0]*sign)+(rng()-.5)*page.width*.04),margin,page.width-margin-width);
    const y=clamp(Math.round(el.y+page.height*offsets[1]*sign+(rng()-.5)*page.height*.04),margin,page.height-margin-height);
    return {...el,x,y,width,height,fontSize:el.kind==='text'?Math.max(12,Math.round((el.fontSize??42)*scale)):el.fontSize};
  })};
}
export function motionBounds(el:Element,t:number,index:number,s:MotionSettings):Bounds{
  const preset:MotionType=s.overrides[el.id]??s.preset;
  const delay=s.delays[el.id]??index*s.stagger;
  const p=preset==='none'?1:1-(1-clamp((t-delay)/.85,0,1))**3;
  const shiftX=preset==='slide'?-150*(1-p):0,shiftY=preset==='rise'?90*(1-p):0;
  const scale=preset==='pop'?.5+.5*p:1;
  return bounds({...el,x:el.x+shiftX+el.width*(1-scale)/2,y:el.y+shiftY+el.height*(1-scale)/2,width:el.width*scale,height:el.height*scale,rotation:el.rotation+(preset==='spin'?-25*(1-p):0)});
}
export function motionRadar(page:Page,preset:MotionType='rise',steps=24):Finding[]{
  const settings={...defaultMotion(),preset};const findings:Finding[]=[];const seen=new Set<string>();
  const visible=page.elements.filter(e=>!e.hidden).slice(0,120);
  for(let step=0;step<=steps;step++){
    const t=step/steps*settings.duration;
    visible.forEach((el,i)=>{
      const b=motionBounds(el,t,i,settings);const active=t >= i*settings.stagger;
      if(!active)return;
      if(b.x<0||b.y<0||b.x+b.width>page.width||b.y+b.height>page.height){
        const code=`motion-out:${el.id}`;
        if(!seen.has(code)){seen.add(code);findings.push({code:'motion-out',severity:'warning',elementId:el.id,at:t,message:`${el.name} leaves artboard near ${t.toFixed(1)}s`});}
      }
      if(el.kind!=='text')return;
      for(let j=i+1;j<visible.length;j++){
        const other=visible[j];if(other.kind!=='text'||t<j*settings.stagger)continue;
        const ob=motionBounds(other,t,j,settings);if(intersects(b,ob)>Math.min(b.width*b.height,ob.width*ob.height)*.2){
          const code=`collision:${el.id}:${other.id}`;
          if(!seen.has(code)){seen.add(code);findings.push({code:'motion-collision',severity:'warning',elementId:other.id,at:t,message:`Text collision: ${el.name} & ${other.name} near ${t.toFixed(1)}s`});}
        }
      }
    });
  }
  return findings;
}
export function makeReplayFrame(page:Page,description:string):ReplayFrame{
  return {id:`${Date.now()}-${Math.random().toString(36).slice(2,7)}`,timestamp:Date.now(),pageId:page.id,
    page:{...deepClone(page),elements:page.elements.map(el=>({...el,image:undefined}))},description};
}
export function repairProjectPage(project:Project,pageId:string,policy:Constitution):{project:Project;changes:string[]}{
  const target=project.pages.find(p=>p.id===pageId);if(!target)return {project,changes:[]};
  const fixed=repairPage(target,policy);return {project:{...project,pages:project.pages.map(p=>p.id===pageId?fixed.page:p)},changes:fixed.changes};
}
