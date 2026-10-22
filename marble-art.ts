import { marbleFrames } from './marble-frames'
import { platformPosition, type Platform, type Enemy } from './level'
import { pixelText } from './pixel-art'
import { ventPhase } from './cave-hazards'
import type { SonicGame } from './game'
const atlas=typeof Image==='undefined'?null:new Image()
if(atlas)atlas.src='/art/classic-marble.png'
const cache=new Map<string,HTMLCanvasElement>()
export const marbleReady=()=>!!atlas?.complete&&!!atlas.naturalWidth
export function marbleDraw(c:CanvasRenderingContext2D,name:string,x:number,y:number){const f=marbleFrames[name];if(!f||!marbleReady())return false;c.drawImage(atlas!,f[0],f[1],f[2],f[3],Math.round(x+f[4]),Math.round(y+f[5]),f[2],f[3]);return true}
export function marbleArt(name:string){if(!marbleReady())return null;if(cache.has(name))return cache.get(name)!;const f=marbleFrames[name];if(!f)return null;const a=document.createElement('canvas');a.width=f[2];a.height=f[3];const c=a.getContext('2d')!;c.imageSmoothingEnabled=false;c.drawImage(atlas!,f[0],f[1],f[2],f[3],0,0,f[2],f[3]);cache.set(name,a);return a}
export function marbleTile(){const native=marbleArt('wall');if(native)return native;if(cache.has('loading'))return cache.get('loading')!;const a=document.createElement('canvas');a.width=a.height=32;const c=a.getContext('2d')!;c.fillStyle='#6d4992';c.fillRect(0,0,32,32);cache.set('loading',a);return a}
const halls=[[1380,3900],[4470,7460],[8050,9100]]
const ROOF=128
export const marbleIndoor=(x:number)=>halls.some(([a,b])=>x>=a&&x<b)
function masonry(c:CanvasRenderingContext2D,x:number,y:number,w:number,h:number){if(h<=0)return;c.fillStyle=c.createPattern(marbleTile(),'repeat')!;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))}
export function drawMarbleBackground(g:SonicGame,W:number,H:number){
 const c=g.ctx,cam=Math.floor(g.camera),cy=Math.floor(g.cameraY)
 c.fillStyle='#000092';c.fillRect(0,0,W,H)
 const skyY=Math.round(H-300-cy*.06),scroll=Math.floor(cam*.18)
 for(let i=Math.floor(scroll/256)-1;i*256-scroll<W;i++){const a=marbleArt('sky/'+((i%3+3)%3));if(a){c.drawImage(a,i*256-scroll,skyY);for(let y=skyY+256;y<H;y+=64)c.drawImage(a,0,192,256,64,i*256-scroll,y,256,64)}}
 for(const[left,right]of halls){
  const a=Math.max(0,left-cam),b=Math.min(W,right-cam);if(b<=a)continue
  c.save();c.beginPath();c.rect(a,0,b-a,H);c.clip();c.fillStyle='#240024';c.fillRect(a,0,b-a,H)
  const ox=Math.floor(cam*.2),oy=-Math.floor(cy*.08),wall=marbleArt('back-wall')
  if(wall){c.save();c.translate(-ox,oy);c.fillStyle=c.createPattern(wall,'repeat')!;c.fillRect(ox,-oy,W,H);c.restore()}
  const window=marbleArt('window'),torch=marbleArt('torch')
  for(let x=Math.floor(ox/384)*384-384;x<ox+W;x+=384){if(window)c.drawImage(window,x+96-ox,96+oy);if(torch)c.drawImage(torch,x+224-ox,104+oy)}
  c.restore()
  // Full-height jambs conceal hard room seams; each is one coherent native column.
  const column=marbleArt('column')
  if(column)for(const edge of[left,right]){
   const x=Math.round(edge-cam-16),top=ROOF-cy,bottom=Math.round(g.level.ground(edge)-cy)
   if(x>W||x+32<0)continue
   c.drawImage(column,0,0,32,16,x,top,32,16)
   for(let y=top+16;y<bottom-16;y+=32){const h=Math.min(32,bottom-16-y);c.drawImage(column,0,16,32,h,x,y,32,h)}
   c.drawImage(column,0,48,32,16,x,bottom-16,32,16)
  }
 }
}
export function drawMarbleSurface(c:CanvasRenderingContext2D,x:number,y:number,w:number,indoor=marbleIndoor(x)){
 if(indoor){masonry(c,x,y,w,16);c.fillStyle='#b692db';c.fillRect(Math.floor(x),Math.floor(y),w,2);return}
 const image=marbleArt('grass');if(!image)return
 for(let i=0;i<w;i++){const sx=((Math.floor(x+i)%image.width)+image.width)%image.width;c.drawImage(image,sx,0,1,image.height,Math.floor(x+i),Math.floor(y),1,image.height)}
}
/** Only named, level-placed landmarks; no arithmetic/random scenery selection. */
export function drawMarbleRuins(g:SonicGame,x:number){
 const name=x===224||x===7840?'temple':'column',a=marbleArt(name);if(!a)return
 g.ctx.drawImage(a,Math.round(x-a.width/2),Math.round(g.level.ground(x)-a.height))
}
export function drawMarbleLava(c:CanvasRenderingContext2D,x:number,y:number,w:number,bottom:number,ticks:number){const frame=Math.floor(ticks/20)%3,surface=marbleArt('lava/surface'+frame),body=marbleArt('lava/body'+frame);c.save();c.beginPath();c.rect(x,y,w,bottom-y);c.clip();c.fillStyle='#ff4900';c.fillRect(x,y,w,bottom-y);if(body)for(let yy=y+16;yy<bottom;yy+=32)for(let xx=x;xx<x+w;xx+=32)c.drawImage(body,Math.round(xx),Math.round(yy));if(surface)for(let xx=x;xx<x+w;xx+=32)c.drawImage(surface,Math.round(xx),Math.round(y));c.restore()}
export function drawMarbleBridge(g:SonicGame,b:{x:number;end:number;y:number}){
 const c=g.ctx;masonry(c,b.x,b.y,b.end-b.x,32);drawMarbleSurface(c,b.x,b.y,b.end-b.x,true)
 // Solid, aligned piers terminate at the lava surface rather than poking through it.
 for(let x=b.x+32;x<b.end-24;x+=96)masonry(c,x,b.y+32,16,40)
}
function chain(c:CanvasRenderingContext2D,x:number,top:number,bottom:number){
 if(bottom<=top)return;c.save();c.beginPath();c.rect(x-4,top,8,bottom-top);c.clip()
 for(let y=top;y<bottom;y+=32)marbleDraw(c,'crusher/chain1',x,y)
 c.restore()
}
export function drawMarblePlatform(g:SonicGame,p:Platform){
 const c=g.ctx,pos=platformPosition(p,g.clock),height=p.h||32
 if(p.kind==='moving'){
  // Fixed world-space roof anchors: chains no longer originate at the camera edge.
  for(const x of[pos.x+16,pos.x+p.w-16]){marbleDraw(c,'crusher/ceiling',x,ROOF+36);chain(c,x,ROOF+32,pos.y)}
 }else{
  // Arch supports give the upper route a foundation while leaving a clear lower passage.
  for(const x of[pos.x+16,pos.x+p.w-32])if(!g.level.inGap(x))masonry(c,x,pos.y+height,16,g.level.ground(x)-(pos.y+height))
 }
 c.save();c.beginPath();c.rect(pos.x,pos.y,p.w,height);c.clip()
 if(p.kind==='moving'){const tile=marbleArt('push/single');if(tile)for(let x=pos.x;x<pos.x+p.w;x+=32)c.drawImage(tile,Math.round(x),Math.round(pos.y))}
 else{masonry(c,pos.x,pos.y,p.w,height);drawMarbleSurface(c,pos.x,pos.y,p.w,true)}
 if(p.kind==='crumble'){c.fillStyle='#49246d';c.fillRect(pos.x+p.w/2,pos.y+2,2,10);c.fillRect(pos.x+p.w/2-4,pos.y+12,6,2)}
 c.restore()
}
export function drawMarbleVent(g:SonicGame,x:number,y:number,warning:boolean,active:boolean,ticks:number){const c=g.ctx;c.fillStyle=warning||active?'#ffff00':'#490000';c.fillRect(Math.floor(x-16),Math.floor(y-3),32,3);if(active){c.save();c.beginPath();c.rect(x-24,y-96,48,96);c.clip();marbleDraw(c,'geyser/shortcolumn'+(Math.floor(ticks/4)%2+1),x,y+16);c.restore()}else if(warning){marbleDraw(c,'geyser/bubble'+(Math.floor(ticks/8)%2+1),x,y+12);pixelText(c,'!',x,y-42,'#ffff92',16,'center')}}
export function drawMarbleDrop(g:SonicGame,x:number,y:number,_origin:number,warning:boolean){
 const c=g.ctx;marbleDraw(c,'crusher/ceiling',x,ROOF+36);chain(c,x,ROOF+32,y-32)
 marbleDraw(c,'crusher/smallblock',x+(warning?Math.round(Math.sin(g.clock*48)*2):0),y-12)
 if(warning)pixelText(c,'!',x,Math.max(y-43,g.cameraY+92),'#ffff92',16,'center')
}
export function drawMarbleHazards(g:SonicGame){
 const c=g.ctx;for(const[left,right]of halls)if(right>g.camera&&left<g.camera+g.viewW)masonry(c,left,ROOF-16,right-left,48)
 for(const d of g.caveDrops){if(d.x<g.camera-64||d.x>g.camera+g.viewW+64)continue;const y=d.phase==='rest'?d.origin+(d.y-d.origin)*d.timer/220:d.y;drawMarbleDrop(g,d.x,y,d.origin,d.phase==='warning')}
 g.level.vents.forEach((x,i)=>{const p=ventPhase(g.clock,i);if(x>g.camera-64&&x<g.camera+g.viewW+64)drawMarbleVent(g,x,g.level.ground(x),p>=130&&p<160,p>=160&&p<220,Math.round(g.clock*60))})
}
export function drawMarbleEnemy(g:SonicGame,e:Enemy){
 if(!marbleReady())return false;const c=g.ctx,ticks=Math.round(g.clock*60)
 const gap=e.kind==='fish'?g.level.gaps.find(([a,b])=>e.x>a&&e.x<b):undefined
 c.save()
 if(gap){const surface=g.level.ground(gap[0])+72;if(e.y-40>surface||surface<g.cameraY){c.restore();return true}c.beginPath();c.rect(g.camera-64,g.cameraY-64,g.viewW+128,surface-g.cameraY+64);c.clip()}
 c.translate(Math.round(e.x),Math.round(e.y))
 if(e.kind==='bee')marbleDraw(c,'bat/'+['fly1','fly2','fly3','fly2'][Math.floor(ticks/4)%4],0,-14)
 else if(e.kind==='fish'){if(Math.cos((g.clock+e.phase)%2.9/2.9*Math.PI)<0){c.translate(0,-16);c.scale(1,-1);c.translate(0,16)}const f=Math.floor(ticks/6)%4;if(f%2)c.scale(-1,1);marbleDraw(c,'fire/vertical'+(Math.floor(f/2)+1),0,-8)}
 else{if(Math.cos((g.clock+e.phase)*(e.kind==='bug'?.85:1))>0)c.scale(-1,1);const f=Math.floor(ticks/8)%2+1;marbleDraw(c,'caterpillar/body'+f,16,-8);marbleDraw(c,'caterpillar/body'+f,0,-8);marbleDraw(c,'caterpillar/head'+f,-16,-10)}
 c.restore();return true
}
