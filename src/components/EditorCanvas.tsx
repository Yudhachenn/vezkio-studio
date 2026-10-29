import {useEffect,useRef,useState} from 'react';
import type {RefObject} from 'react';
import {Stage,Layer,Group,Rect,Ellipse,Text,Image as KImage,Transformer,Line} from 'react-konva';
import type Konva from 'konva';
import type {Element,Page} from '../lib/model';

type Props={page:Page;zoom:number;selected:string[];select:(id:string,e?:boolean)=>void;deselect:()=>void;patch:(values:{id:string;patch:Partial<Element>}[])=>void;snap:boolean;showGrid:boolean;stageRef:RefObject<Konva.Stage|null>};
function LoadedImage({src,width,height}:{src:string;width:number;height:number}){
  const [image,setImage]=useState<HTMLImageElement|null>(null);
  useEffect(()=>{
    if(!src.startsWith('data:image/')){setImage(null);return;}
    let alive=true;const img=new Image();img.onload=()=>{if(alive)setImage(img);};img.onerror=()=>{if(alive)setImage(null);};img.src=src;
    return()=>{alive=false;};
  },[src]);
  return image?<KImage image={image} width={width} height={height}/>:<Rect width={width} height={height} fill="#a4a0bb"/>;
}
export default function EditorCanvas({page,zoom,selected,select,deselect,patch,snap,showGrid,stageRef}:Props){
  const shapes=useRef<Record<string,Konva.Group|null>>({});
  const transformer=useRef<Konva.Transformer|null>(null);
  useEffect(()=>{
    const nodes=selected.map(id=>shapes.current[id]).filter((n):n is Konva.Group=>!!n&&!n.getAttr('locked'));
    transformer.current?.nodes(nodes);
    transformer.current?.getLayer()?.batchDraw();
  },[selected,page.elements]);
  const onDragFinish=(id:string,n:Konva.Group)=>{
    const original=page.elements.find(x=>x.id===id);if(!original)return;
    const x=Math.round(n.x()),y=Math.round(n.y());
    const dx=x-original.x,dy=y-original.y;
    const groupIds=original.groupId? page.elements.filter(q=>q.groupId===original.groupId&&!q.locked).map(q=>q.id):[];
    const movingIds=selected.includes(id)?selected:[id];
    const affected=new Set([...movingIds,...groupIds]);
    patch([...affected].map(key=>{const item=page.elements.find(a=>a.id===key)!;return {id:key,patch:key===id?{x,y}:{x:item.x+dx,y:item.y+dy}};}));
  };
  return <Stage ref={stageRef} width={page.width*zoom} height={page.height*zoom} scaleX={zoom} scaleY={zoom}
    onMouseDown={e=>{if(e.target===e.target.getStage()||e.target.name()==='background')deselect();}} onTouchStart={e=>{if(e.target.name()==='background')deselect();}}>
    <Layer>
      <Rect name="background" x={0} y={0} width={page.width} height={page.height} fill={page.background}/>
      {showGrid && Array.from({length:Math.min(300,Math.floor(page.width/40)+1)},(_,i)=><Line key={`v${i}`} points={[i*40,0,i*40,page.height]} stroke="#6b6b95" opacity={.13} listening={false}/>)}
      {showGrid && Array.from({length:Math.min(300,Math.floor(page.height/40)+1)},(_,i)=><Line key={`h${i}`} points={[0,i*40,page.width,i*40]} stroke="#6b6b95" opacity={.13} listening={false}/>)}
      {page.elements.filter(n=>!n.hidden).map(n=><Group key={n.id} ref={node=>{shapes.current[n.id]=node;}}
        x={n.x} y={n.y} rotation={n.rotation} opacity={n.opacity} draggable={!n.locked}
        onClick={ev=>{ev.cancelBubble=true;select(n.id,ev.evt.shiftKey);}} onTap={ev=>{ev.cancelBubble=true;select(n.id,false);}}
        onDragMove={ev=>{if(!snap)return;const pos=ev.target.position();ev.target.position({x:Math.round(pos.x/10)*10,y:Math.round(pos.y/10)*10});}}
        onDragEnd={()=>{const g=shapes.current[n.id];if(g)onDragFinish(n.id,g);}}
        onTransformEnd={()=>{
          const updates: {id:string;patch:Partial<Element>}[]=[];
          for(const id of selected){
            const obj=page.elements.find(i=>i.id===id);
            const g=shapes.current[id];
            if(!obj||!g)continue;
            const sx=g.scaleX(),sy=g.scaleY();
            g.scale({x:1,y:1});
            updates.push({id,patch:{
              x:Math.round(g.x()),
              y:Math.round(g.y()),
              rotation:Math.round(g.rotation()),
              width:Math.max(10,Math.round(obj.width*sx)),
              height:Math.max(10,Math.round(obj.height*sy)),
              ...(obj.kind==='text'?{fontSize:Math.max(8,Math.round((obj.fontSize??40)*Math.abs(sy)))}:{})
            }});
          }
          if(updates.length)patch(updates);
        }}>
        {n.kind==='rect'&&<Rect width={n.width} height={n.height} fill={n.fill} cornerRadius={n.borderRadius??0}/>}
        {n.kind==='ellipse'&&<Ellipse x={n.width/2} y={n.height/2} radiusX={n.width/2} radiusY={n.height/2} fill={n.fill}/>}
        {n.kind==='image'&&<LoadedImage src={n.image??''} width={n.width} height={n.height}/>}
        {n.kind==='text'&&<Text text={n.text??''} width={n.width} height={n.height} fontSize={n.fontSize??42} fontFamily={n.fontFamily??'Arial'} fontStyle="bold" lineHeight={1.15} fill={n.fill} wrap="word"/>}
      </Group>)}
      <Transformer ref={transformer} rotateEnabled anchorSize={11} anchorCornerRadius={3} anchorFill="#ffffff" anchorStroke="#7766fd" borderStroke="#7766fd"
        boundBoxFunc={(prev,next)=>Math.abs(next.width)<12||Math.abs(next.height)<12?prev:next}/>
    </Layer>
  </Stage>;
}
