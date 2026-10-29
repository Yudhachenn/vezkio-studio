import {useEffect,useMemo,useRef,useState} from 'react';
import {Film,Play,Pause,Download,X,Smartphone,Monitor,Square,Check,Clapperboard} from 'lucide-react';
import type {Page} from '../lib/model';
import {saveBytes,savePng} from '../lib/export';
import {defaultMotion,drawFrame,imageCache,reformatPage} from '../lib/motion';
import type {MotionSettings,MotionType} from '../lib/motion';
const presets:MotionType[]=['rise','pop','slide','fade','spin','none'];
export default function MotionPanel({page,close,apply,notify}:{page:Page;close:()=>void;apply:(p:Page)=>void;notify:(s:string)=>void}){
  const [settings,setSettings]=useState<MotionSettings>(defaultMotion);
  const [time,setTime]=useState(0);
  const [play,setPlay]=useState(true);
  const [recording,setRecording]=useState(false);
  const [format,setFormat]=useState('original');
  const [guides,setGuides]=useState(false);
  const preview=useRef<HTMLCanvasElement>(null);
  const timeRef=useRef(0);
  const [images]=useState(()=>imageCache(page));
  const recordRef=useRef<MediaRecorder|null>(null);
  const stops=useRef(false);
  const formats:Record<string,[number,number]|undefined>={original:undefined,vertical:[1080,1920],square:[1080,1080],wide:[1920,1080]};
  const dimensions=formats[format];
  const composed=useMemo(()=>dimensions?reformatPage(page,...dimensions):page,[page,format]);
  useEffect(()=>{
    if(!preview.current)return;
    const canvas=preview.current;const scale=Math.min(1,680/Math.max(composed.width,composed.height));
    canvas.width=Math.max(1,Math.round(composed.width*scale));canvas.height=Math.max(1,Math.round(composed.height*scale));
    let raf=0;let start=performance.now()-timeRef.current*1000;let prev=0;
    const tick=(now:number)=>{
      const t=play?(now-start)/1000%settings.duration:timeRef.current;
      timeRef.current=t;
      drawFrame(canvas,composed,t,settings,images,guides);
      if(play&&now-prev>75){setTime(t);prev=now;}
      raf=requestAnimationFrame(tick);
    };
    raf=requestAnimationFrame(tick);return()=>cancelAnimationFrame(raf);
  },[composed,settings,play,guides,images]);
  useEffect(()=>()=>{stops.current=true; if(recordRef.current?.state==='recording')recordRef.current.stop();},[]);
  const update=(values:Partial<MotionSettings>)=>setSettings(s=>({...s,...values}));
  const snapshot=async()=>{
    const canvas=document.createElement('canvas');canvas.width=composed.width;canvas.height=composed.height;
    drawFrame(canvas,composed,timeRef.current,settings,images,false);
    try{const saved=await savePng(canvas.toDataURL('image/png'),`${page.name}-frame`);if(saved)notify('Frame PNG disimpan');}catch(err){notify(`Ekspor PNG gagal: ${String(err)}`);}
  };
  const record=async()=>{
    if(typeof MediaRecorder==='undefined'||typeof HTMLCanvasElement.prototype.captureStream!=='function') {notify('WebM tidak didukung di runtime ini; coba Chrome/Edge.');return;}
    const mime=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].find(m=>MediaRecorder.isTypeSupported(m));
    if(!mime){notify('Encoder WebM tidak tersedia');return;}
    setPlay(false);setRecording(true);stops.current=false;
    const canvas=document.createElement('canvas');canvas.width=composed.width;canvas.height=composed.height;
    const stream=canvas.captureStream(30);const parts:Blob[]=[];
    let recorder:MediaRecorder;
    try{recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:3_500_000});recordRef.current=recorder;}
    catch(err){setRecording(false);stream.getTracks().forEach(t=>t.stop());notify(`Perekaman gagal: ${String(err)}`);return;}
    let raf=0;
    recorder.ondataavailable=event=>{if(event.data.size)parts.push(event.data);};
    recorder.onstop=async()=>{
      cancelAnimationFrame(raf);stream.getTracks().forEach(t=>t.stop());setRecording(false);recordRef.current=null;
      if(stops.current)return;
      try{const blob=new Blob(parts,{type:mime});if(!blob.size)throw new Error('Video kosong');
        const bytes=new Uint8Array(await blob.arrayBuffer());const saved=await saveBytes(bytes,`${page.name}-motion.webm`,['webm'],'video/webm');if(saved)notify('Video WebM disimpan.');}
      catch(err){notify(`Gagal menyimpan video: ${String(err)}`);}
    };
    recorder.onerror=()=>notify('Encoder WebM mengalami error.');
    drawFrame(canvas,composed,0,settings,images,false);
    try{recorder.start(100);}catch(err){setRecording(false);stream.getTracks().forEach(t=>t.stop());notify(`MediaRecorder gagal: ${String(err)}`);return;}
    const start=performance.now();
    const frame=(now:number)=>{if(stops.current)return;const t=Math.min(settings.duration,(now-start)/1000);drawFrame(canvas,composed,t,settings,images,false);
      if(t>=settings.duration){if(recorder.state==='recording')recorder.stop();}else raf=requestAnimationFrame(frame);
    };
    raf=requestAnimationFrame(frame);
  };
  return <div className="overlay" onMouseDown={event=>{if(event.target===event.currentTarget&&!recording)close();}}>
    <div className="motion-modal" role="dialog" aria-modal="true" aria-label="Motion DNA Studio">
      <header className="modal-header"><div><span className="eyebrow">VEZKIO CREATIVE ENGINE · v1.0</span><h2><Clapperboard size={24}/> Motion DNA Studio</h2></div><button className="icon-btn" disabled={recording} onClick={close}><X size={18}/></button></header>
      <div className="motion-body"><section className="motion-controls"><div className="section-label"><Film size={15}/> PRESETS</div><div className="preset-grid">{presets.map(p=><button key={p} className={settings.preset===p?'selected':''} onClick={()=>update({preset:p,overrides:{}})}>{p}</button>)}</div>
        <label className="field">Duration · {settings.duration}s<input type="range" min="2" max="12" value={settings.duration} onChange={ev=>update({duration:+ev.target.value})}/></label>
        <label className="field">Layer stagger · {settings.stagger.toFixed(2)}s<input type="range" min="0" max="0.7" step="0.05" value={settings.stagger} onChange={ev=>update({stagger:+ev.target.value})}/></label>
        <div className="section-label">FORMAT MORPH</div><div className="preset-grid">{[['original','Original'],['vertical','9:16'],['square','1:1'],['wide','16:9']].map(([key,label])=><button className={format===key?'selected':''} key={key} onClick={()=>setFormat(key)}>{key==='vertical'?<Smartphone size={14}/>:key==='wide'?<Monitor size={14}/>:<Square size={14}/>} {label}</button>)}</div>
        <button className="small-full" disabled={!dimensions} onClick={()=>{apply(composed);setFormat('original');notify('Format diterapkan. Undo tersedia.');}}><Check size={15}/> Apply format</button>
        <label className="check-row"><input type="checkbox" checked={guides} onChange={ev=>setGuides(ev.target.checked)}/> Safe-zone preview</label>
        <p className="hint">Motion memakai canvas real-time tanpa layanan cloud. Format Morph menyesuaikan posisi proporsional; cek lagi hasil layout.</p>
      </section><section className="motion-main"><div className="motion-preview"><canvas ref={preview}/></div>
        <div className="player"><button className="icon-btn" onClick={()=>setPlay(v=>!v)}>{play?<Pause size={17}/>:<Play size={17}/>}</button><span>{time.toFixed(1)}s</span><input type="range" min="0" max={settings.duration} step=".01" value={time} onChange={ev=>{setPlay(false);timeRef.current=+ev.target.value;setTime(+ev.target.value);}}/><span>{settings.duration}s</span></div>
        <div className="section-label">PER-LAYER TIMELINE</div><div className="motion-tracks">{composed.elements.map((el,index)=><div className="motion-track" key={el.id}><span title={el.name}>{el.name}</span><select value={settings.overrides[el.id]??'auto'} onChange={ev=>{const value=ev.target.value;const overrides={...settings.overrides};if(value==='auto')delete overrides[el.id];else overrides[el.id]=value as MotionType;update({overrides});}}><option value="auto">Auto</option>{presets.map(p=><option key={p} value={p}>{p}</option>)}</select><input type="range" min="0" max={settings.duration-0.1} step=".1" value={settings.delays[el.id]??Math.min(settings.duration-.1,index*settings.stagger)} onChange={ev=>update({delays:{...settings.delays,[el.id]:+ev.target.value}})}/></div>)}</div>
        <div className="modal-actions"><button className="secondary" onClick={snapshot}><Download size={16}/> PNG frame</button><button className="primary" disabled={recording} onClick={record}><Film size={16}/>{recording?'Recording…':'Export WebM'}</button></div>
      </section></div>
    </div>
  </div>;
}
