import {useCallback,useEffect,useRef,useState} from 'react';
import type Konva from 'konva';
import {
  WandSparkles,Clapperboard,ImagePlus,Type,Shapes,Layers3,PanelRight,PanelLeft,Plus,Square,Download,
  FolderOpen,Save,Undo2,Redo2,Copy,Trash2,Eye,EyeOff,Lock,LockOpen,MoveUp,MoveDown,AlignLeft,AlignCenter,
  AlignRight,Grid3X3,Magnet,ZoomIn,ZoomOut,Check,ChevronDown,Maximize2,Group,Unlink2,
  RectangleHorizontal,Smartphone,Monitor,FileJson,FileImage,FileCode2,ShieldCheck,LayoutTemplate,Search,ArrowUpRight,Keyboard
} from 'lucide-react';
import type {Element,Page,Project,Kind} from './lib/model';
import {createProject,createPage,e,id,isValidProject,deepClone} from './lib/model';
import {loadProject,saveProject,loadReplay,saveReplay} from './lib/storage';
import type {ReplayFrame} from './lib/creative';
import {guardProject,makeReplayFrame,MAX_REPLAY_FRAMES} from './lib/creative';
import CreativeSuite from './components/CreativeSuite';
import {saveDocument,savePng,saveSvg} from './lib/export';
import EditorCanvas from './components/EditorCanvas';
import LabPanel from './components/LabPanel';
import MotionPanel from './components/MotionPanel';

const presets=[{label:'Square Post',size:[1080,1080],icon:Square},{label:'Story / Shorts',size:[1080,1920],icon:Smartphone},{label:'Landscape',size:[1920,1080],icon:Monitor},{label:'Presentation',size:[1280,720],icon:RectangleHorizontal}];
const palette=['#9279fa','#4931a2','#ffb68c','#40c4b1','#f8d77a','#111827','#ffffff','#e874aa'];
const fonts=['Arial','Georgia','Verdana','Tahoma','Trebuchet MS','Courier New'];
const pageOf=(project:Project)=>project.pages.find(p=>p.id===project.activePageId)??project.pages[0];
function makeTemplate(index:number):Page{
  const base=createPage(index===1?'Minimal':index===2?'Sunset':'Bold violet');
  if(index===1){base.background='#f9f4eb';base.elements=[e('rect',{x:72,y:72,width:936,height:936,fill:'#182e35',borderRadius:25}),e('text',{x:140,y:235,width:800,height:130,text:'IDEAS IN',fill:'#e7f2d8',fontSize:103}),e('text',{x:140,y:355,width:800,height:145,text:'MOTION.',fill:'#d4f082',fontSize:115}),e('rect',{x:143,y:600,width:540,height:12,fill:'#d4f082'}),e('text',{x:143,y:674,width:800,height:160,text:'A new perspective on creativity',fill:'#ffffff',fontSize:42})];}
  else if(index===2){base.background='#fff0df';base.elements=[e('rect',{x:66,y:65,width:948,height:947,fill:'#a42e57',borderRadius:36}),e('ellipse',{x:600,y:170,width:360,height:360,fill:'#ffc468'}),e('text',{x:115,y:490,width:800,height:320,text:'MAKE\nWAVES',fontSize:130,fill:'#fff5dc'}),e('text',{x:130,y:865,width:720,height:85,text:'The future is what you create.',fontSize:37,fill:'#ffd7cc'})];}
  else{base.background='#f5eeff';base.elements=[e('rect',{x:75,y:75,width:930,height:930,fill:'#4330a2',borderRadius:42}),e('ellipse',{x:693,y:155,width:230,height:230,fill:'#ffa987'}),e('text',{x:128,y:310,width:830,height:280,text:'THINK\nBIGGER.',fontSize:140,fill:'#ffffff'}),e('text',{x:138,y:835,width:750,height:70,text:'BUILT WITH VEZKIO STUDIO',fontSize:38,fill:'#e4d7ff'})];}
  return base;
}
export default function App(){
  const [project,setProject]=useState<Project>(createProject);
  const [ready,setReady]=useState(false);
  const [saved,setSaved]=useState('Loading local project…');
  const [selection,setSelection]=useState<string[]>([]);
  const [tab,setTab]=useState<'templates'|'elements'|'text'|'images'|'layers'>('elements');
  const [zoom,setZoom]=useState(.48);
  const [snap,setSnap]=useState(true);
  const [grid,setGrid]=useState(false);
  const [inspector,setInspector]=useState(true);
  const [lab,setLab]=useState(false);
  const [motion,setMotion]=useState(false);
  const [suite,setSuite]=useState(false);
  const [suiteTab,setSuiteTab]=useState<'reality'|'mutation'|'radar'|'constitution'|'repair'|'guardian'|'replay'>('reality');
  const [replayFrames,setReplayFrames]=useState<ReplayFrame[]>([]);
  const [replayOwner,setReplayOwner]=useState('');
  const lastReplay=useRef(0);
  const openSuite=(tab:typeof suiteTab='reality')=>{setSuiteTab(tab);setSuite(true);};
  const [toast,setToast]=useState('');
  const [commandOpen,setCommandOpen]=useState(false);
  const [commandQuery,setCommandQuery]=useState('');
  const commandInputRef=useRef<HTMLInputElement>(null);
  const stageRef=useRef<Konva.Stage|null>(null);
  const fileRef=useRef<HTMLInputElement>(null);
  const projectFileRef=useRef<HTMLInputElement>(null);
  const history=useRef<Project[]>([]);
  const future=useRef<Project[]>([]);
  const clipboard=useRef<Element[]>([]);
  const projectRef=useRef(project);projectRef.current=project;
  const page=pageOf(project);
  const items=selection.map(key=>page.elements.find(n=>n.id===key)).filter((x):x is Element=>!!x);
  const active=items.length===1?items[0]:undefined;
  const notify=(text:string)=>{setToast(text);};
  useEffect(()=>{loadProject().then(p=>{if(p)setProject(p);setReady(true);}).catch(()=>{setReady(true);setSaved('Local storage unavailable; export backups.');});},[]);
  useEffect(()=>{if(!ready)return;setSaved('Saving locally…');const timer=setTimeout(()=>saveProject(project).then(()=>setSaved('Saved on this device')).catch(()=>setSaved('Autosave failed — export a backup')),550);return()=>clearTimeout(timer);},[project,ready]);
  useEffect(()=>{if(!toast)return;const id=setTimeout(()=>setToast(''),4200);return()=>clearTimeout(id);},[toast]);
  useEffect(()=>{let cancelled=false;loadReplay(project.id).then(frames=>{if(!cancelled){setReplayFrames(frames);setReplayOwner(project.id);}}).catch(()=>{if(!cancelled){setReplayFrames([]);setReplayOwner(project.id);}});return()=>{cancelled=true;};},[project.id]);
  useEffect(()=>{if(!ready||!replayFrames.length||replayOwner!==project.id)return;const timer=setTimeout(()=>{void saveReplay(project.id,replayFrames).catch(()=>setToast('Replay save failed; export a project backup.'));},1000);return()=>clearTimeout(timer);},[replayFrames,ready,project.id,replayOwner]);
  const commit=useCallback((next:Project)=>{
    const before=projectRef.current;
    const guarded=guardProject(before,next);
    history.current.push(deepClone(before));if(history.current.length>70)history.current.shift();future.current=[];
    projectRef.current={...guarded,updatedAt:new Date().toISOString()};setProject(projectRef.current);
    const now=Date.now();
    const activePage=projectRef.current.pages.find(p=>p.id===projectRef.current.activePageId);
    if(activePage&&activePage.elements.length<=300&&now-lastReplay.current>=1400){
      lastReplay.current=now;
      setReplayFrames(old=>[...old,makeReplayFrame(activePage,'Design edit')].slice(-MAX_REPLAY_FRAMES));
    }
  },[]);
  const updatePage=(updater:(p:Page)=>Page)=>commit({...projectRef.current,pages:projectRef.current.pages.map(p=>p.id===projectRef.current.activePageId?updater(p):p)});
  const changeNodes=(updates:{id:string;patch:Partial<Element>}[])=>{
    if(!updates.length)return;const entries=new Map(updates.map(u=>[u.id,u.patch]));
    updatePage(p=>({...p,elements:p.elements.map(n=>entries.has(n.id)?{...n,...entries.get(n.id)!}:n)}));
  };
  const add=(kind:Kind,partial:Partial<Element>={})=>{
    const element=e(kind,partial);updatePage(p=>({...p,elements:[...p.elements,element]}));setSelection([element.id]);
  };
  const addPage=(w=1080,h=1080)=>{const p=createPage(`Page ${projectRef.current.pages.length+1}`,w,h);commit({...projectRef.current,pages:[...projectRef.current.pages,p],activePageId:p.id});setSelection([]);};
  const select=(key:string,multi=false)=>{
    const found=page.elements.find(n=>n.id===key);if(!found)return;
    const ids=found.groupId?page.elements.filter(n=>n.groupId===found.groupId).map(n=>n.id):[key];
    setSelection(old=>multi?(ids.every(i=>old.includes(i))?old.filter(i=>!ids.includes(i)):[...new Set([...old,...ids])]):ids);
  };
  const remove=()=>{if(!selection.length)return;updatePage(p=>({...p,elements:p.elements.filter(n=>!selection.includes(n.id)||n.locked)}));setSelection([]);};
  const duplicate=()=>{const copies=items.filter(n=>!n.locked).map(n=>({...deepClone(n),id:id(),x:n.x+28,y:n.y+28,groupId:undefined,name:`${n.name} copy`}));if(!copies.length)return;updatePage(p=>({...p,elements:[...p.elements,...copies]}));setSelection(copies.map(x=>x.id));};
  const undo=useCallback(()=>{const prev=history.current.pop();if(!prev)return;future.current.push(deepClone(projectRef.current));projectRef.current=prev;setProject(prev);setSelection([]);},[]);
  const redo=useCallback(()=>{const next=future.current.pop();if(!next)return;history.current.push(deepClone(projectRef.current));projectRef.current=next;setProject(next);setSelection([]);},[]);
  const moveLayer=(direction:1|-1)=>{
    if(selection.length!==1)return;
    updatePage(p=>{const elements=[...p.elements];const i=elements.findIndex(n=>n.id===selection[0]);if(i<0||i+direction<0||i+direction>=elements.length)return p;[elements[i],elements[i+direction]]=[elements[i+direction],elements[i]];return {...p,elements};});
  };
  const align=(which:'left'|'center'|'right')=>{
    if(!selection.length)return;changeNodes(items.filter(n=>!n.locked).map(n=>({id:n.id,patch:{x:which==='left'?0:which==='right'?page.width-n.width:Math.round((page.width-n.width)/2)}})));
  };
  const makeGroup=()=>{if(selection.length<2)return;changeNodes(items.map(n=>({id:n.id,patch:{groupId:id()}})).map((u,_,all)=>({...u,patch:{groupId:all[0].patch.groupId}})));};
  const ungroup=()=>changeNodes(items.map(n=>({id:n.id,patch:{groupId:undefined}})));
  const upload=async(file?:File)=>{
    if(!file)return;if(!['image/png','image/jpeg','image/webp'].includes(file.type)){notify('Only PNG, JPG, WebP supported');return;}
    if(file.size>8*1024*1024){notify('Max 8 MB per image');return;}
    const reader=new FileReader();reader.onload=()=>{
      const src=String(reader.result);const img=new Image();img.onload=()=>{const ratio=Math.min(1,600/Math.max(img.width,img.height));add('image',{name:file.name,image:src,width:Math.round(img.width*ratio),height:Math.round(img.height*ratio)});};img.onerror=()=>notify('Image decode failed');img.src=src;
    };reader.onerror=()=>notify('Image loading failed');reader.readAsDataURL(file);
  };
  const openProject=async(file?:File)=>{
    if(!file)return;if(file.size>60*1024*1024){notify('Project larger than 60 MB');return;}
    try{const parsed:unknown=JSON.parse(await file.text());if(!isValidProject(parsed))throw new Error('Invalid .vezkio file (version 1 required)');commit(deepClone(parsed));setSelection([]);notify('Project imported successfully.');}
    catch(err){notify(`Import failed: ${String(err)}`);}
  };
  const exportPng=async()=>{
    const stage=stageRef.current;if(!stage)return;const transforms=stage.find('Transformer');transforms.forEach(n=>n.hide());stage.draw();
    try{const data=stage.toDataURL({pixelRatio:1/zoom});if(await savePng(data,page.name))notify('PNG exported');}
    catch(err){notify(`Export failed: ${String(err)}`);}finally{transforms.forEach(n=>n.show());stage.draw();}
  };
  const fileSave=async()=>{try{if(await saveDocument(project))notify('Project file saved');}catch(err){notify(`Save failed: ${String(err)}`);}};
  const svgSave=async()=>{try{if(await saveSvg(page,page.name))notify('SVG exported');}catch(err){notify(`SVG failed: ${String(err)}`);}};
  useEffect(()=>{
    const key=(ev:KeyboardEvent)=>{
      const target=ev.target as HTMLElement;if(target.closest('input,textarea,select')||lab||motion||suite)return;
      const mod=ev.ctrlKey||ev.metaKey,k=ev.key.toLowerCase();
      if(mod&&k==='z'){ev.preventDefault();ev.shiftKey?redo():undo();}
      else if(mod&&k==='y'){ev.preventDefault();redo();}
      else if(mod&&k==='d'){ev.preventDefault();duplicate();}
      else if(mod&&k==='c'){ev.preventDefault();clipboard.current=deepClone(items);}
      else if(mod&&k==='v'){ev.preventDefault();if(clipboard.current.length){const clones=clipboard.current.map(n=>({...deepClone(n),id:id(),groupId:undefined,x:n.x+30,y:n.y+30}));updatePage(p=>({...p,elements:[...p.elements,...clones]}));setSelection(clones.map(x=>x.id));clipboard.current=deepClone(clones);}}
      else if(mod&&k==='g'){ev.preventDefault();if(ev.shiftKey)ungroup();else makeGroup();}
      else if(mod&&k==='a'){ev.preventDefault();setSelection(page.elements.filter(n=>!n.locked&&!n.hidden).map(n=>n.id));}
      else if(mod&&k==='s'){ev.preventDefault();void fileSave();}
      else if(k==='delete'||k==='backspace'){ev.preventDefault();remove();}
      else if(k==='escape')setSelection([]);
      else if(['arrowup','arrowdown','arrowleft','arrowright'].includes(k)&&selection.length){ev.preventDefault();const unit=ev.shiftKey?10:1;
        changeNodes(items.filter(n=>!n.locked).map(n=>({id:n.id,patch:{x:n.x+(k==='arrowleft'?-unit:k==='arrowright'?unit:0),y:n.y+(k==='arrowup'?-unit:k==='arrowdown'?unit:0)}})));}
    };window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);
  });
  useEffect(()=>{
    const onKey=(ev:KeyboardEvent)=>{
      if((ev.ctrlKey||ev.metaKey)&&ev.key.toLowerCase()==='k'){ev.preventDefault();setCommandOpen(v=>!v);}
      if(ev.key==='Escape')setCommandOpen(false);
    };
    window.addEventListener('keydown',onKey);
    return()=>window.removeEventListener('keydown',onKey);
  },[]);
  useEffect(()=>{if(commandOpen){setCommandQuery('');const handle=window.setTimeout(()=>commandInputRef.current?.focus(),30);return()=>window.clearTimeout(handle);}},[commandOpen]);
  const commands=[
    {label:'Add a rectangle',detail:'Elements',search:'shape rectangle',run:()=>add('rect')},
    {label:'Add an ellipse',detail:'Elements',search:'shape circle ellipse',run:()=>add('ellipse')},
    {label:'Add headline text',detail:'Typography',search:'text title heading',run:()=>add('text',{text:'Your headline',fontSize:72,width:580,height:125})},
    {label:'Upload image',detail:'Assets',search:'picture photo asset',run:()=>fileRef.current?.click()},
    {label:'Browse templates',detail:'Workspace',search:'template gallery',run:()=>setTab('templates')},
    {label:'Open layers panel',detail:'Workspace',search:'layer group',run:()=>setTab('layers')},
    {label:'Open Design DNA Lab',detail:'Creative tools',search:'palette ai remix',run:()=>setLab(true)},
    {label:'Open Motion Studio',detail:'Creative tools',search:'animate motion video',run:()=>setMotion(true)},
    {label:'Open Creative Suite',detail:'Seven local creative tools',search:'reality mutation radar constitution repair guardian replay',run:()=>openSuite()},
    {label:'Create another page',detail:'Pages',search:'page new artboard',run:()=>addPage()},
    {label:'Save native project',detail:'File',search:'save vezkio file',run:()=>void fileSave()},
    {label:'Export current page PNG',detail:'Quality checked export',search:'download export picture',run:()=>openSuite('guardian')},
    {label:'Open inspector',detail:'Workspace',search:'properties right panel',run:()=>setInspector(true)}
  ];
  const filteredCommands=commands.filter(c=>`${c.label} ${c.detail} ${c.search}`.toLowerCase().includes(commandQuery.toLowerCase().trim()));
  const chooseCommand=(run:()=>void)=>{setCommandOpen(false);run();};
  const title=(kind:Kind)=>({rect:'Rectangle',ellipse:'Ellipse',text:'Text',image:'Image'}[kind]);
  return <div className="app">
    <input ref={fileRef} hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={ev=>{void upload(ev.target.files?.[0]);ev.target.value='';}}/>
    <input ref={projectFileRef} hidden type="file" accept=".vezkio,.json" onChange={ev=>{void openProject(ev.target.files?.[0]);ev.target.value='';}}/>
    <header className="topbar"><div className="brand"><div className="brand-mark">V<span>✦</span></div><div><b>VEZKIO</b><small>CREATIVE STUDIO <em>AURORA</em></small></div></div>
      <div className="project-heading"><input aria-label="Project name" value={project.name} onChange={ev=>setProject(p=>({...p,name:ev.target.value}))}/><span><Check size={11}/>{saved}</span></div>
      <div className="top-actions"><button className="command-button" title="Quick actions (Ctrl+K)" onClick={()=>setCommandOpen(true)}><Search size={16}/><span>Quick actions</span><kbd>Ctrl K</kbd></button><button title="Open .vezkio file" onClick={()=>projectFileRef.current?.click()}><FolderOpen size={17}/><span>Open</span></button><button title="Save .vezkio file" onClick={()=>void fileSave()}><Save size={17}/><span>Save</span></button>
      <span className="divider-v"/><button title="Undo" disabled={!history.current.length} onClick={undo}><Undo2 size={17}/></button><button title="Redo" disabled={!future.current.length} onClick={redo}><Redo2 size={17}/></button>
      <button className="lab-button" onClick={()=>setLab(true)}><WandSparkles size={16}/> LAB</button><button className="cs-launch" onClick={()=>openSuite()}><ShieldCheck size={16}/> CREATIVE SUITE</button><button className="motion-button" onClick={()=>setMotion(true)}><Clapperboard size={16}/> MOTION</button><button className="export-button" onClick={()=>openSuite('guardian')}><Download size={17}/> Export PNG</button></div>
    </header>
    <div className="workspace"><nav className="rail">{([['templates',LayoutTemplate,'Templates'],['elements',Shapes,'Elements'],['text',Type,'Text'],['images',ImagePlus,'Uploads'],['layers',Layers3,'Layers']] as const).map(([key,Icon,label])=><button key={key} className={tab===key?'active':''} onClick={()=>setTab(key)}><Icon size={21}/><span>{label}</span></button>)}<div className="rail-bottom"><button title="Toggle inspector" onClick={()=>setInspector(v=>!v)}><PanelRight size={20}/></button></div></nav>
      <aside className="left-panel"><div className="panel-head"><h3>{tab==='images'?'Uploads':tab[0].toUpperCase()+tab.slice(1)}</h3><span>✦</span></div>
        <div className="panel-scroll">
          {tab==='elements'&&<div className="studio-welcome"><span>✦ CREATIVE WORKSPACE</span><strong>Bring every idea to life.</strong><small>Choose a shape or start building with layers.</small></div>}
          {tab==='templates'&&<><p className="section-label">START FROM A LAYOUT</p><div className="template-list">{[0,1,2].map(i=><button className={`template tile-${i}`} key={i} onClick={()=>{const p=makeTemplate(i);updatePage(current=>({...p,id:current.id,name:current.name}));setSelection([]);}}><strong>{['Think bigger.','Ideas in motion.','Make waves.'][i]}</strong><small>Apply to current page</small></button>)}</div><p className="hint">Template replaces elements on the selected page. Use Undo if needed.</p></>}
          {tab==='elements'&&<><p className="section-label">ADD SHAPES</p><div className="element-grid"><button onClick={()=>add('rect')}><span className="shape-rect"/>Rectangle</button><button onClick={()=>add('ellipse')}><span className="shape-circle"/>Ellipse</button></div><p className="section-label">QUICK COLORS</p><div className="swatches">{palette.map(c=><button key={c} style={{background:c}} title={`Add ${c} rectangle`} onClick={()=>add('rect',{fill:c})}/>)}</div><p className="section-label">CANVAS SIZES</p>{presets.map(p=><button className="panel-list-btn" key={p.label} onClick={()=>updatePage(x=>({...x,width:p.size[0],height:p.size[1]}))}><p.icon size={16}/>{p.label}<small>{p.size.join('×')}</small></button>)}<p className="hint">Changing size here does not reflow elements. Use Motion DNA → Format Morph for proportional adaptation.</p></>}
          {tab==='text'&&<><p className="section-label">TYPOGRAPHY</p><button className="text-sample large" onClick={()=>add('text',{text:'Add your heading',fontSize:80,width:650,height:190,fill:'#22223d'})}>Add a heading</button><button className="text-sample" onClick={()=>add('text',{text:'Add your subtitle',fontSize:48,width:600,height:100,fill:'#383454'})}>Add a subtitle</button><button className="text-sample small" onClick={()=>add('text',{text:'This is your body copy.',fontSize:28,width:500,height:90,fill:'#383454'})}>Add body text</button></>}
          {tab==='images'&&<><div className="upload-card"><ImagePlus size={36}/><b>Upload an image</b><p>PNG, JPG, WebP · max 8 MB</p><button className="primary" onClick={()=>fileRef.current?.click()}>Choose image</button></div><p className="hint">Images are embedded in your .vezkio file and saved locally in IndexedDB. Large images can increase project size.</p></>}
          {tab==='layers'&&<><p className="section-label">{page.elements.length} LAYERS · TOP FIRST</p><div className="layer-list">{[...page.elements].reverse().map(n=><div className={`layer-row ${selection.includes(n.id)?'selected':''}`} key={n.id}><button className="layer-name" onClick={ev=>select(n.id,ev.shiftKey)}><span className="layer-kind">{n.kind==='text'?<Type size={14}/>:n.kind==='image'?<ImagePlus size={14}/>:<Shapes size={14}/>}</span><span title={n.name}>{n.name}</span>{n.groupId&&<Group size={12}/>}</button><button title={n.hidden?'Show':'Hide'} onClick={()=>changeNodes([{id:n.id,patch:{hidden:!n.hidden}}])}>{n.hidden?<EyeOff size={13}/>:<Eye size={13}/>}</button><button title={n.locked?'Unlock':'Lock'} onClick={()=>changeNodes([{id:n.id,patch:{locked:!n.locked}}])}>{n.locked?<Lock size={13}/>:<LockOpen size={13}/>}</button></div>)}{!page.elements.length&&<p className="hint">Add elements to see your layers here.</p>}</div><div className="layer-actions"><button onClick={()=>moveLayer(1)} disabled={selection.length!==1}><MoveUp size={14}/> Up</button><button onClick={()=>moveLayer(-1)} disabled={selection.length!==1}><MoveDown size={14}/> Down</button></div></>}
        </div>
      </aside>
      <main className="editor"><div className="toolbar"><span className="toolbar-title"><PanelLeft size={16}/> Design editor</span><span className="toolbar-sep"/><span className="toolbar-size">{page.width} × {page.height} px</span><div className="toolbar-grow"/>
        <button className={snap?'toggle-on':''} onClick={()=>setSnap(v=>!v)} title="Snap to 10px"><Magnet size={17}/></button><button className={grid?'toggle-on':''} onClick={()=>setGrid(v=>!v)} title="Grid overlay"><Grid3X3 size={17}/></button><span className="toolbar-sep"/>
        <button onClick={()=>align('left')} disabled={!selection.length} title="Align to left of canvas"><AlignLeft size={17}/></button><button onClick={()=>align('center')} disabled={!selection.length} title="Align to canvas center"><AlignCenter size={17}/></button><button onClick={()=>align('right')} disabled={!selection.length} title="Align to right of canvas"><AlignRight size={17}/></button>
        <button onClick={makeGroup} disabled={selection.length<2} title="Group selected (Ctrl+G)"><Group size={17}/></button><button onClick={ungroup} disabled={!items.some(n=>n.groupId)} title="Ungroup (Ctrl+Shift+G)"><Unlink2 size={17}/></button><button onClick={duplicate} disabled={!selection.length} title="Duplicate (Ctrl+D)"><Copy size={17}/></button><button onClick={remove} disabled={!selection.length} title="Delete"><Trash2 size={17}/></button>
      </div>
      <div className="artboard-surface"><div className="canvas-stack"><div className="canvas-meta"><span className="canvas-meta-index">ARTBOARD {String(project.pages.findIndex(p=>p.id===page.id)+1).padStart(2,'0')}</span><strong>{page.name}</strong><span className="canvas-meta-size">{page.width} × {page.height}</span></div><div className="page-shadow" style={{width:page.width*zoom,height:page.height*zoom}}><EditorCanvas page={page} zoom={zoom} selected={selection} select={select} deselect={()=>setSelection([])} patch={changeNodes} snap={snap} showGrid={grid} stageRef={stageRef}/></div><div className="canvas-tip">✦&nbsp; Create without limits. &nbsp;·&nbsp; Double-click a text layer to edit its content in Inspector.</div></div></div>
      <div className="page-strip"><div className="pages-list">{project.pages.map((p,i)=><button className={p.id===page.id?'active':''} key={p.id} onClick={()=>{setProject(a=>({...a,activePageId:p.id}));setSelection([]);}}><span>{i+1}</span>{p.name}</button>)}<button title="New page" className="page-add" onClick={()=>addPage()}><Plus size={17}/></button></div><div className="page-strip-actions"><button title="Duplicate page" onClick={()=>{const clone=deepClone(page);clone.id=id();clone.name=`${page.name} copy`;clone.elements=clone.elements.map(n=>({...n,id:id()}));commit({...project,pages:[...project.pages,clone],activePageId:clone.id});setSelection([]);}}><Copy size={15}/></button><button title="Delete page" disabled={project.pages.length===1} onClick={()=>{if(!window.confirm('Delete current page?'))return;const pages=project.pages.filter(p=>p.id!==page.id);commit({...project,pages,activePageId:pages[0].id});setSelection([]);}}><Trash2 size={15}/></button></div></div>
      <footer className="status-bar"><span><span className="online-dot"/> Local workspace <span className="status-divider">/</span> {page.elements.length} elements <span className="status-divider">/</span> {project.pages.length} page(s) <span className="status-hint"> <Keyboard size={13}/> Ctrl K for actions</span></span><div className="zoom-controls"><button title="Zoom out" onClick={()=>setZoom(z=>Math.max(.15,+(z-.1).toFixed(2)))}><ZoomOut size={16}/></button><span>{Math.round(zoom*100)}%</span><button title="Zoom in" onClick={()=>setZoom(z=>Math.min(2,+(z+.1).toFixed(2)))}><ZoomIn size={16}/></button><button title="Fit to approximate size" onClick={()=>setZoom(Math.min(.6,Math.round((570/Math.max(page.height,page.width))*100)/100))}><Maximize2 size={15}/></button></div></footer>
      </main>
      {inspector&&<aside className="right-panel"><div className="panel-head"><h3>Inspector</h3><span>PROPERTIES</span></div><div className="panel-scroll">
        {active?<><p className="section-label">{title(active.kind).toUpperCase()} / SELECTED</p><div className="selected-pill"><span>{active.name}</span><Check size={15}/></div><label className="field">Layer name<input value={active.name} onChange={ev=>changeNodes([{id:active.id,patch:{name:ev.target.value}}])}/></label>
          {active.kind==='text'&&<><label className="field">Text<textarea rows={4} value={active.text??''} onChange={ev=>changeNodes([{id:active.id,patch:{text:ev.target.value}}])}/></label><div className="field-pair"><label className="field">Font size<input type="number" min="8" max="500" value={active.fontSize??42} onChange={ev=>changeNodes([{id:active.id,patch:{fontSize:Math.max(8,+ev.target.value||8)}}])}/></label><label className="field">Font family<select value={active.fontFamily??'Arial'} onChange={ev=>changeNodes([{id:active.id,patch:{fontFamily:ev.target.value}}])}>{fonts.map(f=><option key={f}>{f}</option>)}</select></label></div></>}
          {active.kind!=='image'&&<label className="field">Fill color<div className="color-field"><input type="color" value={active.fill} onChange={ev=>changeNodes([{id:active.id,patch:{fill:ev.target.value}}])}/><span>{active.fill}</span></div></label>}
          <p className="section-label">TRANSFORM</p><div className="field-pair">{(['x','y','width','height'] as const).map(k=><label className="field" key={k}>{k.toUpperCase()}<input type="number" value={Math.round(active[k])} onChange={ev=>changeNodes([{id:active.id,patch:{[k]:['width','height'].includes(k)?Math.max(12,+ev.target.value||12):+ev.target.value}}])}/></label>)}</div>
          <div className="field-pair"><label className="field">Rotation<input type="number" value={active.rotation} onChange={ev=>changeNodes([{id:active.id,patch:{rotation:+ev.target.value}}])}/></label><label className="field">Opacity ({Math.round(active.opacity*100)}%)<input type="range" min="0" max="1" step=".05" value={active.opacity} onChange={ev=>changeNodes([{id:active.id,patch:{opacity:+ev.target.value}}])}/></label></div>
          {active.kind==='rect'&&<label className="field">Corner radius<input type="number" min="0" max="200" value={active.borderRadius??0} onChange={ev=>changeNodes([{id:active.id,patch:{borderRadius:Math.max(0,+ev.target.value)}}])}/></label>}
          <div className="inspector-actions"><button onClick={duplicate}><Copy size={14}/> Duplicate</button><button onClick={remove}><Trash2 size={14}/> Delete</button></div>
        </>:selection.length>1?<div className="empty-inspector"><Group size={30}/><strong>{selection.length} elements selected</strong><p>Group, align, duplicate or move the selected elements together.</p><button onClick={makeGroup}>Group selection</button></div>:<><div className="empty-inspector"><ShieldCheck size={30}/><strong>Your canvas is ready</strong><p>Select an element to adjust its properties.</p></div><p className="section-label">PAGE PROPERTIES</p><label className="field">Page name<input value={page.name} onChange={ev=>updatePage(p=>({...p,name:ev.target.value}))}/></label><label className="field">Background<div className="color-field"><input type="color" value={page.background} onChange={ev=>updatePage(p=>({...p,background:ev.target.value}))}/><span>{page.background}</span></div></label><div className="field-pair"><label className="field">Width<input type="number" min="100" max="5000" value={page.width} onChange={ev=>updatePage(p=>({...p,width:Math.max(100,Math.min(5000,+ev.target.value||100))}))}/></label><label className="field">Height<input type="number" min="100" max="5000" value={page.height} onChange={ev=>updatePage(p=>({...p,height:Math.max(100,Math.min(5000,+ev.target.value||100))}))}/></label></div></>}
        <p className="section-label">EXPORT & BACKUP</p><button className="panel-list-btn" onClick={()=>void fileSave()}><FileJson size={17}/>Project (.vezkio)</button><button className="panel-list-btn" onClick={()=>openSuite('guardian')}><FileImage size={17}/>Current page PNG</button><button className="panel-list-btn" onClick={()=>openSuite('guardian')}><FileCode2 size={17}/>Current page SVG</button><button className="panel-list-btn" onClick={()=>projectFileRef.current?.click()}><FolderOpen size={17}/>Import project</button><p className="hint">SVG supports basic vector/text elements. Line wrapping/fonts can differ from the canvas.</p>
      </div></aside>}
    </div>
    {lab&&<LabPanel project={project} page={page} close={()=>setLab(false)} apply={p=>{commit(p);setSelection([]);}} notify={notify}/>}
    {motion&&<MotionPanel page={page} close={()=>setMotion(false)} apply={p=>updatePage(()=>p)} notify={notify}/>}
    {suite&&<CreativeSuite key={suiteTab} initialTab={suiteTab} project={project} page={page} close={()=>setSuite(false)} apply={p=>{commit(p);setSelection([]);}} select={key=>setSelection([key])} replay={replayFrames} notify={notify} onExport={kind=>{if(kind==='png')void exportPng();else if(kind==='svg')void svgSave();else void fileSave();}}/>}
    {commandOpen&&<div className="command-overlay" onMouseDown={ev=>{if(ev.target===ev.currentTarget)setCommandOpen(false);}}><section className="command-dialog" role="dialog" aria-modal="true" aria-label="Quick actions"><div className="command-search"><Search size={20}/><input ref={commandInputRef} aria-label="Search actions" placeholder="What would you like to create?" value={commandQuery} onChange={ev=>setCommandQuery(ev.target.value)} onKeyDown={ev=>{if(ev.key==='Enter'&&filteredCommands.length)chooseCommand(filteredCommands[0].run);}}/><kbd>ESC</kbd></div><div className="command-results"><div className="command-section-label">{commandQuery?'MATCHING ACTIONS':'EXPLORE VEZKIO'}</div>{filteredCommands.map((c,i)=><button key={c.label} onClick={()=>chooseCommand(c.run)}><span className="command-result-icon">{i+1}</span><span><strong>{c.label}</strong><small>{c.detail}</small></span><ArrowUpRight size={16}/></button>)}{filteredCommands.length===0&&<div className="command-empty">No matching actions. Try “text”, “export”, or “motion”.</div>}</div><footer className="command-footer"><span><kbd>↵</kbd> Select</span><span><kbd>Esc</kbd> Close</span><span>VEZKIO / QUICK ACTIONS</span></footer></section></div>}
    {toast&&<div role="status" className="toast" onClick={()=>setToast('')}><Check size={16}/>{toast}<ChevronDown size={14}/></div>}
  </div>;
}
