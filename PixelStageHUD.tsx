import { useEffect, useRef } from 'react'
import type { BonusStats } from './special-course'
import { pixelText } from './pixel-art'

/** The HUD uses the same pixel grid as the scene, rather than smoothed type. */
export default function PixelStageHUD({stats,seconds}:{stats:BonusStats;seconds:number}){
 const canvas=useRef<HTMLCanvasElement>(null),latest=useRef({stats,seconds}),redraw=useRef<()=>void>(()=>{})
 latest.current={stats,seconds}
 useEffect(()=>{const el=canvas.current!,parent=el.parentElement!;const draw=()=>{const {stats:s,seconds:time}=latest.current,w=parent.clientWidth,h=parent.clientHeight,W=w<550?384:640,H=Math.round(W*h/Math.max(1,w));if(el.width!==W||el.height!==H){el.width=W;el.height=H}const c=el.getContext('2d')!;c.imageSmoothingEnabled=false;c.clearRect(0,0,W,H);const shade=c.createLinearGradient(0,0,0,66);shade.addColorStop(0,'#111a4544');shade.addColorStop(1,'#111a4500');c.fillStyle=shade;c.fillRect(0,0,W,66)
  pixelText(c,'RINGS',16,20,'#ffe257',8);pixelText(c,String(s.rings).padStart(3,'0'),16,48,'#fff7df',24);pixelText(c,`/ ${s.target}`,79,46,'#ffe0a0',16);pixelText(c,`SPECIAL STAGE ${s.stage}`,W-16,20,'#dedaff',8,'right');pixelText(c,`CHECKPOINT ${s.gate} / 3`,W-16,35,'#fff7df',8,'right')
  if(s.mode==='playing'&&s.banner){const size=W<500?16:24,scale=Math.round(size/8),width=(s.banner.length*6-1)*scale,y=Math.round(H*.25);c.fillStyle='#201635aa';c.fillRect(Math.round(W/2-width/2-10),y-7*scale-9,width+20,7*scale+18);pixelText(c,s.banner,W/2,y,s.lost?'#ffaf8c':'#fff0a2',size,'center');if(s.lost)pixelText(c,`-${s.lost} RINGS`,W/2,y+15,'#fff7df',8,'center')}
  if(s.mode==='playing'&&!s.banner){pixelText(c,s.remaining>0?`${s.remaining} RINGS TO GO`:'TARGET REACHED - KEEP RUNNING!',W/2,H-18,'#fff1b5',8,'center');pixelText(c,`${time}s TO CHECKPOINT`,W/2,H-6,'#d5d5f8',8,'center')}
 };redraw.current=draw;const observer=new ResizeObserver(draw);observer.observe(parent);draw();return()=>observer.disconnect()},[])
 useEffect(()=>redraw.current(),[stats,seconds])
 return <canvas ref={canvas} className="bonus-pixel-hud" aria-hidden="true"/>
}
