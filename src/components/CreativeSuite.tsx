import {useEffect,useMemo,useRef,useState} from 'react';
import {WandSparkles,X,ShieldCheck,ScanEye,Shuffle,Clapperboard,Stethoscope,PackageCheck,History,Check,Download,RotateCcw,Play,Pause,AlertTriangle,Info,Eye} from 'lucide-react';
import type {Page,Project} from '../lib/model';
import {deepClone} from '../lib/model';
import {drawFrame,defaultMotion,imageCache} from '../lib/motion';
import type {MotionType} from '../lib/motion';
import {
  DEFAULT_CONSTITUTION, auditPage, mutatePage, motionRadar, platformZones, repairProjectPage,
  type Constitution,type ReplayFrame,type Platform,type Finding
} from '../lib/creative';
import './CreativeSuite.css';

type Tab='reality'|'mutation'|'radar'|'constitution'|'repair'|'guardian'|'replay';
type ExportType='png'|'svg'|'vezkio';
const tabs:{id:Tab;name:string;detail:string;icon:typeof Eye}[]=[
  {id:'reality',name:'Reality Lab',detail:'Platform overlays',icon:ScanEye},
  {id:'mutation',name:'Mutation Engine',detail:'6 compositions',icon:Shuffle},
  {id:'radar',name:'Motion Radar',detail:'Time sampling',icon:Clapperboard},
  {id:'constitution',name:'Design Constitution',detail:'Creative rules',icon:ShieldCheck},
  {id:'repair',name:'One-Click Repair',detail:'Preview fixes',icon:Stethoscope},
  {id:'guardian',name:'Export Guardian',detail:'Quality gate',icon:PackageCheck},
  {id:'replay',name:'Creative Replay',detail:'Edit snapshots',icon:History}
];
const platforms:{id:Platform;name:string;description:string}[]=[
  {id:'shorts',name:'YouTube Shorts',description:'Generic mobile overlay'},
  {id:'tiktok',name:'TikTok',description:'Generic action rail'},
  {id:'reels',name:'Instagram Reels',description:'Generic vertical UI'},
  {id:'square',name:'Square feed',description:'Feed thumbnail'},
  {id:'landscape',name:'Landscape',description:'Player controls'}
];
const memoPolicy=(p:Project):Constitution=>p.constitution??DEFAULT_CONSTITUTION;
const summary=(items:Finding[])=>({critical:items.filter(x=>x.severity==='error').length,warnings:items.filter(x=>x.severity==='warning').length});
function ScenePreview({page,platform,limit=440}:{page:Page;platform?:Platform;limit?:number}){
  const canvas=useRef<HTMLCanvasElement>(null);
  useEffect(()=>{
    const node=canvas.current;if(!node)return;
    const scale=Math.min(1,limit/Math.max(page.width,page.height));
    node.width=Math.max(1,Math.round(page.width*scale));node.height=Math.max(1,Math.round(page.height*scale));
    const images=imageCache(page);
    const render=()=>drawFrame(node,page,1,{...defaultMotion(),preset:'none'},images,false);
    render();
    for(const img of images.values()){if(!img.complete){img.onload=render;img.onerror=render;}}
    return()=>{for(const img of images.values()){img.onload=null;img.onerror=null;}};
  },[page,limit]);
  return <div className="cs-preview" style={{aspectRatio:`${page.width} / ${page.height}`}}>
    <canvas ref={canvas} aria-label="Design snapshot"/>
    {platform&&platformZones(page,platform).map((z,i)=><div key={i} title={z.label} className="cs-zone" style={{left:`${z.x/page.width*100}%`,top:`${z.y/page.height*100}%`,width:`${z.width/page.width*100}%`,height:`${z.height/page.height*100}%`}}/>)}
  </div>;
}
function Findings({items,select}:{items:Finding[];select:(id:string)=>void}){
  return <div className="cs-findings">{!items.length?<div className="cs-clean"><Check size={18}/> No issues detected by current checks.</div>:items.slice(0,35).map((issue,i)=><button type="button" key={`${issue.code}-${issue.elementId}-${i}`} disabled={!issue.elementId} className={`cs-finding ${issue.severity}`} onClick={()=>issue.elementId&&select(issue.elementId)}>
    {issue.severity==='error'?<AlertTriangle size={16}/>:<Info size={16}/>}<span>{issue.message}{issue.at!==undefined&&<small>Time: {issue.at.toFixed(2)}s</small>}</span>{issue.elementId&&<span className="cs-open">Select</span>}
  </button>)}{items.length>35&&<p className="cs-muted">Showing 35 of {items.length} findings.</p>}</div>;
}
function restoreReplay(current:Project,frame:ReplayFrame):Project{
  const pages=current.pages.map(page=>{
    if(page.id!==frame.pageId)return page;
    const imageMap=new Map(page.elements.filter(n=>n.kind==='image').map(el=>[el.id,el.image]));
    return {...deepClone(frame.page),elements:frame.page.elements.map(el=>({...el,image:el.kind==='image'?(imageMap.get(el.id)??undefined):el.image}))};
  });
  return {...current,pages,activePageId:frame.pageId};
}
export default function CreativeSuite({project,page,close,apply,select,replay,onExport,initialTab='reality',notify}:{
  project:Project;page:Page;close:()=>void;apply:(project:Project)=>void;select:(id:string)=>void;
  replay:ReplayFrame[];onExport:(kind:ExportType)=>void;initialTab?:Tab;notify:(message:string)=>void;
}){
  const [tab,setTab]=useState<Tab>(initialTab);
  const [platform,setPlatform]=useState<Platform>('shorts');
  const [variant,setVariant]=useState(0);
  const [motion,setMotion]=useState<MotionType>('rise');
  const [frameIndex,setFrameIndex]=useState(Math.max(0,replay.length-1));
  const [play,setPlay]=useState(false);
  const [repairPreview,setRepairPreview]=useState(false);
  const [exportAcknowledged,setExportAcknowledged]=useState(false);
  const [paletteDraft,setPaletteDraft]=useState((project.constitution??DEFAULT_CONSTITUTION).palette.join(', '));
  const policy=memoPolicy(project);
  const designs=useMemo(()=>Array.from({length:6},(_,i)=>mutatePage(page,i,policy)),[page,project.constitution]);
  const repaired=useMemo(()=>repairProjectPage(project,page.id,policy),[project,page.id]);
  const audit=useMemo(()=>auditPage(page,policy),[page,project.constitution]);
  const platformIssues=useMemo(()=>auditPage(page,policy,platform),[page,policy,platform]);
  const motionIssues=useMemo(()=>motionRadar(page,motion),[page,motion]);
  const frames=useMemo(()=>replay.filter(f=>f.pageId===page.id),[replay,page.id]);
  const index=Math.min(Math.max(0,frameIndex),Math.max(0,frames.length-1));
  const replayFrame=frames[index];
  const replayPage=replayFrame?restoreReplay(project,replayFrame).pages.find(p=>p.id===page.id):undefined;
  const exportIssues=audit.filter(f=>f.severity!=='info'||f.code==='text-fit');
  const quality=summary(exportIssues);
  useEffect(()=>{if(!play||frames.length<2)return;const handle=window.setInterval(()=>setFrameIndex(v=>{if(v>=frames.length-1){setPlay(false);return frames.length-1;}return v+1;}),500);return()=>clearInterval(handle);},[play,frames.length]);
  useEffect(()=>{const fn=(ev:KeyboardEvent)=>{if(ev.key==='Escape'){ev.stopPropagation();close();}};window.addEventListener('keydown',fn);return()=>window.removeEventListener('keydown',fn);},[close]);
  const setPolicy=(change:Partial<Constitution>)=>apply({...project,constitution:{...policy,...change}});
  const focus=(id:string)=>{select(id);close();};
  const fix=()=>{if(!repaired.changes.length){notify('No safe automatic fixes found.');return;}apply(repaired.project);setRepairPreview(false);notify(`${repaired.changes.length} fixes applied. Use Undo to revert.`);};
  const performExport=(kind:ExportType)=>{if(exportIssues.length&&!exportAcknowledged&&kind!=='vezkio'){notify('Review findings and confirm export with warnings first.');return;}onExport(kind);};
  return <div className="cs-backdrop" onMouseDown={ev=>{if(ev.target===ev.currentTarget)close();}}>
    <section className="cs-window" role="dialog" aria-modal="true" aria-label="VEZKIO Creative Suite">
      <header className="cs-header"><div className="cs-title"><span className="cs-glyph"><WandSparkles size={22}/></span><div><small>VEZKIO / AURORA EDITION</small><h2>Creative Suite <em>1.2</em></h2></div></div><button onClick={close} className="cs-close" aria-label="Close Creative Suite"><X size={19}/></button></header>
      <div className="cs-layout"><aside className="cs-navigation">{tabs.map(({id,name,detail,icon:Icon})=><button className={tab===id?'active':''} key={id} onClick={()=>setTab(id)}><Icon size={19}/><span><strong>{name}</strong><small>{detail}</small></span></button>)}<p className="cs-note">All analysis runs locally on demand. No external API or account required.</p></aside>
      <div className="cs-body">
        {tab==='reality'&&<><div className="cs-hero"><span>01 / REALITY LAB</span><h3>See it where it lives.</h3><p>Simulated platform overlays and safe-zone warnings. UI zones are approximate, not officially endorsed or pixel-accurate.</p></div><div className="cs-controls"><label>Platform<select value={platform} onChange={ev=>setPlatform(ev.target.value as Platform)}>{platforms.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><span>{platforms.find(x=>x.id===platform)?.description}</span></div><div className="cs-two"><div className="cs-preview-frame"><ScenePreview page={page} platform={platform}/></div><div><h4>Platform findings</h4><p className="cs-muted">Colored regions approximate where platform UI can obscure your design.</p><Findings items={platformIssues} select={focus}/></div></div></>}
        {tab==='mutation'&&<><div className="cs-hero"><span>02 / MUTATION ENGINE</span><h3>Six worlds, same message.</h3><p>Deterministic variations to element positions and size. Text, imagery and brand colors stay intact; protected layers stay fixed.</p></div><div className="cs-variants">{designs.map((p,i)=><button key={i} className={variant===i?'selected':''} onClick={()=>setVariant(i)}><ScenePreview page={p} limit={245}/><strong>Variant {String(i+1).padStart(2,'0')}</strong></button>)}</div><div className="cs-action-row"><span className="cs-muted">Preview before applying. Undo remains available.</span><button className="cs-primary" onClick={()=>{apply({...project,pages:project.pages.map(p=>p.id===page.id?designs[variant]:p)});notify('Mutation applied. Undo available.');}}><Shuffle size={16}/> Apply variation</button></div></>}
        {tab==='radar'&&<><div className="cs-hero"><span>03 / MOTION COLLISION RADAR</span><h3>Find problems across time.</h3><p>Samples 25 points across 5 seconds using the basic Motion DNA entrance model. Detects text-vs-text overlaps and off-canvas animation paths.</p></div><div className="cs-controls"><label>Motion preset<select value={motion} onChange={ev=>setMotion(ev.target.value as MotionType)}>{(['rise','slide','pop','spin','fade','none'] as const).map(x=><option key={x}>{x}</option>)}</select></label><span>Up to first 120 visible layers</span></div><div className="cs-stats"><span>{motionIssues.length} findings</span><span>25 time samples</span><span>5s simulation</span></div><Findings items={motionIssues} select={focus}/><p className="cs-muted">Radar does not read unsaved per-layer overrides from Motion Studio. It is an approximate preflight, not pixel-level collision detection.</p></>}
        {tab==='constitution'&&<><div className="cs-hero"><span>04 / DESIGN CONSTITUTION</span><h3>Your rules. Your style.</h3><p>Save per-project design rules in the .vezkio file. Protected layers cannot be changed through normal editor commits; font/margin/palette rules are audited by the other tools.</p></div><div className="cs-card"><label className="cs-check"><input type="checkbox" checked={policy.enabled} onChange={ev=>setPolicy({enabled:ev.target.checked})}/> Enable project constitution</label><div className="cs-fields"><label>Minimum margin (px)<input type="number" min="0" max="500" value={policy.minMargin} onChange={ev=>setPolicy({minMargin:Math.max(0,Math.min(500,Number(ev.target.value)||0))})}/></label><label>Minimum font (px)<input type="number" min="8" max="120" value={policy.minFontSize} onChange={ev=>setPolicy({minFontSize:Math.max(8,Math.min(120,Number(ev.target.value)||8))})}/></label></div><label className="cs-check"><input type="checkbox" checked={policy.enforcePalette} onChange={ev=>setPolicy({enforcePalette:ev.target.checked})}/> Flag text outside brand palette</label><label>Brand colors (comma-separated HEX)<input value={paletteDraft} onChange={ev=>setPaletteDraft(ev.target.value)} onBlur={()=>{const colors=paletteDraft.split(',').map(x=>x.trim()).filter(x=>/^#[0-9a-f]{6}$/i.test(x)).slice(0,12);setPolicy({palette:colors});}}/></label></div><h4>Pin layers (hard protection)</h4><div className="cs-pin-list">{page.elements.map(el=><label key={el.id}><input type="checkbox" checked={policy.protectedIds.includes(el.id)} onChange={ev=>setPolicy({protectedIds:ev.target.checked?[...policy.protectedIds,el.id]:policy.protectedIds.filter(id=>id!==el.id)})}/><span>{el.name}</span><small>{el.kind}</small></label>)}</div><p className="cs-muted">Pinned layers are restored if changed or deleted while constitution is enabled. For editing a pinned layer, unpin it first.</p></>}
        {tab==='repair'&&<><div className="cs-hero"><span>05 / ONE-CLICK REPAIR</span><h3>Fix what can be fixed.</h3><p>Clamps overflowing elements, adjusts margins, improves small text and sampled contrast. Locked and pinned layers are left untouched.</p></div><div className="cs-two"><div className="cs-preview-frame"><ScenePreview page={repairPreview?repaired.project.pages.find(p=>p.id===page.id)!:page}/></div><div><h4>{repaired.changes.length} proposed changes</h4><button className="cs-secondary" onClick={()=>setRepairPreview(v=>!v)}><Eye size={16}/>{repairPreview?'Show before':'Preview after'}</button><ul className="cs-changes">{repaired.changes.slice(0,18).map((c,i)=><li key={i}>{c}</li>)}</ul>{repaired.changes.length>18&&<p className="cs-muted">More changes omitted.</p>}</div></div><div className="cs-action-row"><span className="cs-muted">Repairs are heuristic. Always inspect results.</span><button className="cs-primary" disabled={!repaired.changes.length} onClick={fix}><Stethoscope size={16}/> Apply repairs</button></div></>}
        {tab==='guardian'&&<><div className="cs-hero"><span>06 / EXPORT GUARDIAN</span><h3>Check before shipping.</h3><p>Preflight checks for out-of-bounds elements, approximate contrast, small text, missing images and overlapping text. You decide whether to export with warnings.</p></div><div className="cs-stats"><span>{quality.critical} critical</span><span>{quality.warnings} warnings</span><span>{page.elements.length} layers</span></div><Findings items={exportIssues} select={focus}/><label className="cs-check cs-export-check"><input type="checkbox" checked={exportAcknowledged} onChange={ev=>setExportAcknowledged(ev.target.checked)}/> I reviewed the warnings and want to export anyway.</label><div className="cs-export-actions"><button onClick={()=>performExport('png')} disabled={exportIssues.length>0&&!exportAcknowledged}><Download size={16}/> PNG</button><button onClick={()=>performExport('svg')} disabled={exportIssues.length>0&&!exportAcknowledged}><Download size={16}/> SVG</button><button onClick={()=>performExport('vezkio')}><Download size={16}/> Project backup</button></div><p className="cs-muted">Guardian never changes the design automatically. Project backup remains available even with issues.</p></>}
        {tab==='replay'&&<><div className="cs-hero"><span>07 / CREATIVE REPLAY</span><h3>Watch your process.</h3><p>Locally recorded, throttled edit checkpoints. Up to 42 snapshots per project. Large designs (over 300 objects) skip replay capture to protect memory.</p></div>{frames.length?<><div className="cs-two"><div className="cs-preview-frame"><ScenePreview page={replayPage??replayFrame.page}/></div><div className="cs-replay-meta"><strong>{replayFrame.description}</strong><span>{new Date(replayFrame.timestamp).toLocaleString()}</span><span>Frame {index+1} / {frames.length}</span><button className="cs-secondary" onClick={()=>{if(window.confirm('Restore this frame? Undo is available.')){apply(restoreReplay(project,replayFrame));notify('Replay checkpoint restored.');}}}><RotateCcw size={16}/> Restore frame</button></div></div><div className="cs-replay-controls"><button onClick={()=>setPlay(v=>!v)}>{play?<Pause size={17}/>:<Play size={17}/>}</button><input type="range" min="0" max={frames.length-1} step="1" value={index} onChange={ev=>{setFrameIndex(Number(ev.target.value));setPlay(false);}}/><span>{index+1}/{frames.length}</span></div></>:<div className="cs-clean">No checkpoints yet. Edit this page and then reopen Creative Replay.</div>}<p className="cs-muted">Image pixels are intentionally omitted from snapshots to save space; current images with matching layer IDs are re-used on restore. Deleted image content is not recovered. For guaranteed recovery, save a .vezkio backup.</p></>}
      </div></div>
      <footer className="cs-footer"><span>LOCAL-FIRST · NO CLOUD ANALYSIS · NO BACKGROUND ANIMATION</span><span>AURORA CREATIVE SUITE 1.2</span></footer>
    </section>
  </div>;
}
