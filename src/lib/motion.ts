import type {Page} from './model';
export type MotionType='rise'|'pop'|'slide'|'fade'|'spin'|'none';
export type MotionSettings={preset:MotionType;duration:number;stagger:number;overrides:Record<string,MotionType>;delays:Record<string,number>};
export const defaultMotion=():MotionSettings=>({preset:'rise',duration:5,stagger:.18,overrides:{},delays:{}});
const ease=(t:number)=>1-Math.pow(1-Math.max(0,Math.min(1,t)),3);
export function imageCache(page:Page):Map<string,HTMLImageElement> {
  const map=new Map<string,HTMLImageElement>();
  for(const item of page.elements) if(item.kind==='image'&&item.image){const img=new Image();img.src=item.image;map.set(item.id,img);}
  return map;
}
function wrapText(ctx:CanvasRenderingContext2D,text:string,width:number,height:number,size:number){
  ctx.textBaseline='top';ctx.font=`700 ${size}px Arial`;let y=0;const lineHeight=size*1.15;
  for(const para of text.split('\n')){
    let line='';
    for(const word of para.split(' ')){
      const candidate=line?`${line} ${word}`:word;
      if(line&&ctx.measureText(candidate).width>width){ctx.fillText(line,0,y);y+=lineHeight;line=word;}else line=candidate;
    }
    if(line)ctx.fillText(line,0,y);y+=lineHeight;
    if(y>height)break;
  }
}
export function drawFrame(canvas:HTMLCanvasElement,page:Page,time:number,settings:MotionSettings,images:Map<string,HTMLImageElement>,guides=false){
  const ctx=canvas.getContext('2d');if(!ctx)return;
  ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.save();ctx.scale(canvas.width/page.width,canvas.height/page.height);ctx.fillStyle=page.background;ctx.fillRect(0,0,page.width,page.height);
  page.elements.forEach((n,index)=>{
    if(n.hidden)return;const preset=settings.overrides[n.id]??settings.preset;
    const delay=settings.delays[n.id]??index*settings.stagger;
    const progress=preset==='none'?1:ease((time-delay)/.85);
    if(progress<=0)return;
    const rem=1-progress;const offsetX=preset==='slide'?-150*rem:0;
    const offsetY=preset==='rise'?90*rem:0;
    const scale=preset==='pop'?.5+.5*progress:1;
    const spin=preset==='spin'?-25*rem:0;
    ctx.save();ctx.globalAlpha=n.opacity*progress;
    ctx.translate(n.x+n.width/2+offsetX,n.y+n.height/2+offsetY);
    ctx.rotate((n.rotation+spin)*Math.PI/180);ctx.scale(scale,scale);ctx.translate(-n.width/2,-n.height/2);
    ctx.fillStyle=n.fill;
    if(n.kind==='rect'){ctx.beginPath();ctx.roundRect(0,0,n.width,n.height,Math.min(n.borderRadius??0,n.width/2,n.height/2));ctx.fill();}
    if(n.kind==='ellipse'){ctx.beginPath();ctx.ellipse(n.width/2,n.height/2,n.width/2,n.height/2,0,0,Math.PI*2);ctx.fill();}
    if(n.kind==='image'){const image=images.get(n.id);if(image?.complete&&image.naturalWidth)ctx.drawImage(image,0,0,n.width,n.height);}
    if(n.kind==='text'){ctx.beginPath();ctx.rect(0,0,n.width,n.height);ctx.clip();wrapText(ctx,n.text??'',n.width,n.height,n.fontSize??42);}
    ctx.restore();
  });
  if(guides){const min=Math.min(page.width,page.height);ctx.strokeStyle='#ef6c88';ctx.lineWidth=Math.max(2,min/400);ctx.setLineDash([12,12]);ctx.strokeRect(page.width*.06,page.height*.08,page.width*.88,page.height*.84);ctx.setLineDash([]);}
  ctx.restore();
}
export function reformatPage(page:Page,width:number,height:number):Page {
  const sx=width/page.width,sy=height/page.height;
  const scale=Math.min(sx,sy);
  return {...page,width,height,elements:page.elements.map(n=>({...n,x:Math.round(n.x*sx),y:Math.round(n.y*sy),width:Math.max(1,Math.round(n.width*sx)),height:Math.max(1,Math.round(n.height*sy)),fontSize:n.fontSize?Math.max(4,Math.round(n.fontSize*scale)):undefined}))};
}
