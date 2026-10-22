import { useEffect, useRef, useState } from 'react'
import { finaleData } from './finale-data'
import { originalData } from './original-data'
import { OriginalWorld } from './original-world'
import { classicDraw, classicReady } from './classic-art'
import { finaleDraw, finaleReady } from './classic-presentation'
import { OriginalMusic } from './original-music'
import { pixelText } from './pixel-art'
import { endingFrame, endingApproach, endingAnimal, endingLogoX, endingFinalTime } from './ending-sequence'
import './ClassicCinema.css'
type Props={emeralds:number[];sound:boolean;context:()=>AudioContext|null;onWake:()=>void;onSound:()=>void;onExit:()=>void}
export default function EndingScreen(props:Props){
 const canvas=useRef<HTMLCanvasElement>(null),current=useRef(props),clock=useRef(0),paused=useRef(false),credits=useRef(false),music=useRef(new OriginalMusic())
 current.current=props
 const[isPaused,setPaused]=useState(false),[phase,setPhase]=useState('Sonic returns to Green Hill'),[inCredits,setCredits]=useState(false),good=props.emeralds.length===6
 const toggle=()=>{paused.current=!paused.current;setPaused(paused.current);if(!paused.current)current.current.onWake()},replay=()=>{clock.current=0;credits.current=false;setCredits(false);paused.current=false;setPaused(false);music.current.reset();current.current.onWake()}
 useEffect(()=>{
  const c=canvas.current!.getContext('2d')!,bg=new Image();bg.src='/art/original/ending-chunks.png'
  const map={...originalData.zones.ghz.maps[0],...finaleData.endingMap,start:[160,436]},world=new OriginalWorld('ghz',map),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches
  let raf=0,last=0,lastPhase=''
  const paint=(now:number)=>{
   const ready=bg.complete&&bg.naturalWidth>0&&classicReady()&&finaleReady(),dt=last?Math.min(.05,(now-last)/1000):0;last=now
   if(ready&&!paused.current&&!document.hidden)clock.current+=dt
   const t=clock.current,p=current.current
   music.current.sync(p.context(),p.sound&&ready&&!paused.current&&!document.hidden,credits.current?'credits':'ending')
   c.imageSmoothingEnabled=false;c.fillStyle='#0092ff';c.fillRect(0,0,320,224)
   if(!ready){pixelText(c,'PREPARING THE ENDING',160,112,'#fff',8,'center')}
   else if(credits.current){
    c.fillStyle='#000';c.fillRect(0,0,320,224);const card=Math.min(9,Math.floor(t/5));finaleDraw(c,'credits/'+(card===9&&good?8:card),160,112)
    if(lastPhase!=='Original staff credits'){lastPhase='Original staff credits';setPhase(lastPhase)}
   }else{
    const f=endingFrame(t,good);if(f.phase!==lastPhase){lastPhase=f.phase;setPhase(f.phase)}
    const flower=good&&t>=9.2,layout:number[]=[...map.layout];if(flower){layout[map.width]=46;layout[map.width+1]=47}
    const chunk=(id:number,x:number,y:number)=>{if(id>=0)c.drawImage(bg,id%8*256,Math.floor(id/8)*256,256,256,Math.floor(x),Math.floor(y),256,256)}
    const back=originalData.zones.ghz.maps[0].background||[]
    for(let x=0;x<2;x++)chunk((back[x]||1)-1,x*256,-32)
    for(let y=1;y<3;y++)for(let x=0;x<2;x++)chunk((layout[y*map.width+x]&127)-1,x*256,y*256-272)
    const ground=(x:number)=>(world.floor(Math.max(1,Math.min(319,x)),300)?.y??455)-272
    // Rescued animals arrive from the sides, with native walking/flapping pairs.
    // They remain in the garden during the leap rather than vanishing together.
    for(let i=0;i<14;i++){
     const a=endingAnimal(t,i,reduced),y=ground(a.x)-12-a.yOffset
     c.save();c.translate(Math.round(a.x),Math.round(y));c.scale(a.flip?-1:1,1);finaleDraw(c,'ending/animal'+i%7+'/'+a.frame,0,0);c.restore()
    }
    const approach=endingApproach(t),sy=ground(t<3.6?approach.x:160)-19
    if(t<3.6){c.save();c.translate(Math.round(approach.x),Math.round(sy));c.scale(approach.face,1);classicDraw(c,approach.sprite,0,0);c.restore()}
    else if(f.pose<0)classicDraw(c,'sonic/'+(Math.floor((t-3.6)/.4)%2?'Wait3':'Wait2'),160,sy)
    else finaleDraw(c,'ending/sonic/'+f.pose,160,sy)
    if(good&&t>=5.7&&t<8.8){const age=t-5.7,r=Math.min(32,age*14),angle=reduced?0:age*Math.PI*2*1.2;for(let i=0;i<6;i++){const a=angle+i*Math.PI/3;finaleDraw(c,'ending/emerald/'+(i+1),160+Math.cos(a)*r,sy-12+Math.sin(a)*r)}}
    if(good&&t>=8.5&&t<10){const alpha=reduced?.45:t<9.2?(t-8.5)/.7:Math.max(0,1-(t-9.2)/.8);c.fillStyle='rgba(255,255,255,'+alpha+')';c.fillRect(0,0,320,224)}
    if(t>=f.leap)finaleDraw(c,'ending/logo/0',endingLogoX(t,f.leap,reduced),88)
   }
   if(paused.current){c.fillStyle='#00000099';c.fillRect(0,0,320,224);pixelText(c,'PAUSED',160,112,'#fff',8,'center')}
   raf=requestAnimationFrame(paint)
  }
  raf=requestAnimationFrame(paint)
  const key=(e:KeyboardEvent)=>{if(e.repeat)return;if((e.key==='p'||e.key===' '&&!(e.target instanceof HTMLElement&&e.target.closest('button')))){e.preventDefault();toggle()}if(e.key==='Escape')current.current.onExit()}
  const blur=()=>{paused.current=true;setPaused(true);music.current.pause()},visibility=()=>{if(document.hidden)blur()}
  window.addEventListener('keydown',key);window.addEventListener('blur',blur);document.addEventListener('visibilitychange',visibility)
  return()=>{cancelAnimationFrame(raf);music.current.dispose();window.removeEventListener('keydown',key);window.removeEventListener('blur',blur);document.removeEventListener('visibilitychange',visibility)}
 },[good])
 return <section className="title-screen classic-cinema ending-cinema" aria-label="Sonic 1 ending sequence"><h1 className="title-sr">{good?'All six emeralds — Green Hill restored':'Eggman defeated — the animals are free'}</h1><div className="title-picture"><canvas ref={canvas} width={320} height={224} role="img" aria-label={phase}/></div><div className="cinema-controls"><p role="status">{phase}</p><button onClick={toggle}>{isPaused?'Resume ending':'Pause ending'}</button><button onClick={props.onSound}>{props.sound?'Sound on':'Sound off'}</button><button onClick={()=>{clock.current=endingFinalTime(good);credits.current=false;setCredits(false);paused.current=false;setPaused(false);current.current.onWake()}}>Show final pose</button><button onClick={replay}>Replay ending</button><button onClick={()=>{credits.current=true;clock.current=0;setCredits(true);paused.current=false;setPaused(false);music.current.reset();props.onWake()}}>{inCredits?'Replay credits':'Original credits'}</button><button onClick={props.onExit}>Return to title →</button></div></section>
}
