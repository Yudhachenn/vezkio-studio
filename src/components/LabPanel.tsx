import {useEffect,useState} from 'react';
import {WandSparkles,ScanEye,History,Check,X,BookmarkPlus,RotateCcw,Trash2} from 'lucide-react';
import type {Capsule,Element,Project,Page} from '../lib/model';
import {deepClone,id} from '../lib/model';
import {loadCapsules,saveCapsules} from '../lib/storage';
const palettes=[
  {name:'Nebula',bg:'#f0e9ff',primary:'#49319b',accent:'#ffb98a',text:'#ffffff'},
  {name:'Matcha',bg:'#e7f4d8',primary:'#1c4c3d',accent:'#bcdf75',text:'#ffffff'},
  {name:'Solar',bg:'#fff3d6',primary:'#a92f5c',accent:'#ffcb5e',text:'#ffffff'},
  {name:'Editorial',bg:'#f4eee6',primary:'#202735',accent:'#ef795e',text:'#ffffff'}
];
function rgb(h:string){const x=h.replace('#','');if(!/^[\da-fA-F]{6}$/.test(x))return null;return [0,2,4].map(i=>parseInt(x.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);}
const contrast=(a:string,b:string)=>{const x=rgb(a),y=rgb(b);if(!x||!y)return null;const lum=(v:number[])=>v[0]*.2126+v[1]*.7152+v[2]*.0722;const [lo,hi]=[lum(x),lum(y)].sort((m,n)=>m-n);return (hi+.05)/(lo+.05);};
function bgBehind(page:Page,node:Element){const idx=page.elements.findIndex(x=>x.id===node.id);const cx=node.x+node.width/2,cy=node.y+node.height/2;for(let i=idx-1;i>=0;i--){const n=page.elements[i];if(n.kind==='rect'&&!n.hidden&&n.rotation===0&&cx>=n.x&&cx<=n.x+n.width&&cy>=n.y&&cy<=n.y+n.height)return n.fill;}return page.background;}
export default function LabPanel({project,page,apply,close,notify}:{project:Project;page:Page;apply:(p:Project)=>void;close:()=>void;notify:(s:string)=>void}){
  const [tab,setTab]=useState<'dna'|'audit'|'time'>('dna');const [selected,setSelected]=useState(0);
  const [capsules,setCapsules]=useState<Capsule[]>([]);const [label,setLabel]=useState('');
  useEffect(()=>{loadCapsules().then(setCapsules).catch(()=>notify('Penyimpanan snapshot tidak tersedia.'));},[]);
  const audits=page.elements.filter(n=>n.kind==='text'&&!n.hidden).map(n=>{
    const bg=bgBehind(page,n),ratio=contrast(n.fill,bg),font=n.fontSize??40,target=font>=48?3:4.5;
    return {node:n,ratio,target,ok:ratio!==null&&ratio>=target};
  });
  const score=Math.max(0,Math.round(100-audits.filter(x=>!x.ok).length*18-(audits.length===0?22:0)));
  const remix=()=>{
    const p=palettes[selected];let count=0;
    const elements=page.elements.map(n=>{if(n.kind==='image')return {...n};if(n.kind==='text')return {...n,fill:(n.fontSize??42)>=45?p.text:p.accent};
      const first=count++===0;return {...n,fill:first&&n.kind==='rect'?p.primary:p.accent};});
    apply({...project,pages:project.pages.map(x=>x.id===page.id?{...page,background:p.bg,elements}:x)});
    notify(`Design DNA ${p.name} diterapkan — Ctrl+Z untuk undo`);
  };
  const rescue=()=>{
    const elements=page.elements.map(n=>{
      const audit=audits.find(x=>x.node.id===n.id);if(!audit||audit.ok)return n;
      const bg=bgBehind(page,n);const light=contrast('#ffffff',bg)??0,dark=contrast('#111827',bg)??0;
      return {...n,fill:light>=dark?'#ffffff':'#111827'};
    });
    apply({...project,pages:project.pages.map(x=>x.id===page.id?{...page,elements}:x)});
    notify('Kontras teks diperbaiki (estimasi). Periksa visual secara manual.');
  };
  const snapshot=async()=>{
    const value:Capsule={id:id(),name:label.trim()||`Snapshot ${capsules.length+1}`,date:new Date().toLocaleString('id-ID'),project:deepClone(project)};
    const next=[value,...capsules].slice(0,8);
    try{await saveCapsules(next);setCapsules(next);setLabel('');notify('Time Capsule tersimpan di perangkat.');}
    catch{notify('Gagal menyimpan snapshot; kapasitas perangkat mungkin penuh.');}
  };
  return <div className="overlay" onMouseDown={ev=>{if(ev.target===ev.currentTarget)close();}}><section className="lab-modal" role="dialog" aria-modal="true" aria-label="VEZKIO Lab">
    <header className="modal-header"><div><span className="eyebrow">EXPERIMENTAL CREATIVE TOOLS</span><h2>✦ VEZKIO LAB</h2></div><button className="icon-btn" onClick={close}><X size={18}/></button></header>
    <div className="tabs">{([['dna',<WandSparkles size={16}/>,'Design DNA'],['audit',<ScanEye size={16}/>,'Story Lens'],['time',<History size={16}/>,'Time Capsules']] as const).map(([key,icon,name])=><button className={tab===key?'active':''} key={key} onClick={()=>setTab(key)}>{icon}{name}</button>)}</div>
    <div className="lab-content">
      {tab==='dna'&&<><div className="lab-hero"><span className="eyebrow">EXPERIMENT 01 · INSTANT REMIX</span><h3>One idea. Four moods.</h3><p>Ganti suasana visual tanpa menggeser foto dan teks. Ini mesin gaya deterministik, bukan AI generatif.</p></div><div className="palette-list">{palettes.map((p,i)=><button key={p.name} onClick={()=>setSelected(i)} className={selected===i?'active':''}><span className="palette-swatch" style={{background:p.bg}}><i style={{background:p.primary}}/><b style={{background:p.accent}}/></span><strong>{p.name}</strong>{selected===i&&<Check size={16}/>}</button>)}</div><button className="primary wide" onClick={remix}><WandSparkles size={17}/> Apply Design DNA</button></>}
      {tab==='audit'&&<><div className="lab-hero"><span className="eyebrow">EXPERIMENT 02 · READABILITY</span><h3>{score}/100 · Story Lens</h3><p>Skor heuristik, bukan pengukuran perhatian manusia atau validasi aksesibilitas lengkap.</p></div><div className="audit-list">{audits.length?audits.map(a=><div key={a.node.id} className="audit-row"><span className={a.ok?'good-dot':'bad-dot'}/><div><strong>{a.node.name}</strong><small>{a.ratio?.toFixed(1)??'?'}:1 kontras · target {a.target}:1</small></div></div>):<p>Tambahkan teks untuk memulai analisis.</p>}</div><button className="primary wide" onClick={rescue}><ScanEye size={17}/> Rescue text contrast</button><p className="hint">Deteksi warna hanya memperkirakan kotak latar yang menutupi titik tengah teks. Rotasi, transparansi, foto, dan lapisan kompleks belum diperhitungkan.</p></>}
      {tab==='time'&&<><div className="lab-hero"><span className="eyebrow">EXPERIMENT 03 · VERSION HISTORY</span><h3>Save a moment.</h3><p>Maksimal 8 snapshot lokal. Simpan file .vezkio secara terpisah untuk backup.</p></div><div className="capsule-add"><input placeholder="Nama snapshot, mis. Desain sebelum revisi" value={label} maxLength={60} onChange={ev=>setLabel(ev.target.value)}/><button className="primary" onClick={snapshot}><BookmarkPlus size={16}/> Save</button></div><div className="capsules">{capsules.map(c=><div key={c.id}><div><strong>{c.name}</strong><small>{c.date}</small></div><button title="Restore" onClick={()=>{if(window.confirm(`Pulihkan '${c.name}'?`)){apply(deepClone(c.project));notify('Snapshot dipulihkan.');}}}><RotateCcw size={16}/></button><button title="Delete" onClick={async()=>{if(!window.confirm('Hapus snapshot?'))return;const next=capsules.filter(x=>x.id!==c.id);try{await saveCapsules(next);setCapsules(next);}catch{notify('Gagal menghapus snapshot');}}}><Trash2 size={16}/></button></div>)}{!capsules.length&&<p className="hint">Belum ada snapshot tersimpan.</p>}</div></>}
    </div>
  </section></div>;
}
