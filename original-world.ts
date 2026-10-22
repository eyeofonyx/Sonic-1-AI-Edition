import { finaleData } from './finale-data'
import { expansionData } from './expansion-data'
import { originalData } from './original-data'
export type OriginalZone='ghz'|'mz'|'syz'|'lz'|'slz'|'sbz'|'sbz3'|'fz'
export type OriginalMap={zone:string;act:number;width:number;height:number;layout:readonly number[];start:readonly number[];objects:readonly (readonly number[])[];backgroundWidth?:number;backgroundHeight?:number;background?:readonly number[]}
export type SurfaceHit={x:number;y:number;angle:number}
const tau=Math.PI*2
/** Original 256px layouts, 16px block solidity, signed heightmaps and angle maps. */
export type TerrainData={chunks:readonly number[];collision:readonly number[];priority:readonly number[]}
export class OriginalWorld {
 get artZone():string{return this.zone}
 get heights():readonly number[]{return originalData.heights}
 get angles():readonly number[]{return originalData.angles}
 renderQuads:readonly (readonly number[])[]|undefined
 frontPlane=false
 zone:OriginalZone;map:OriginalMap;focusY=0;behindLoop=false
 constructor(zone:OriginalZone,map:OriginalMap){this.zone=zone;this.map={...map,layout:[...map.layout]};this.focusY=map.start[1]+19}
 get width(){return this.map.width*256}get height(){return this.map.height*256}
 get data():TerrainData{return this.zone==='slz'||this.zone==='sbz'||this.zone==='sbz3'||this.zone==='fz'?finaleData.zones[this.zone]:this.zone==='syz'||this.zone==='lz'?expansionData.zones[this.zone]:originalData.zones[this.zone]}
 chunkAt(x:number,y:number){if(x<0||y<0||x>=this.width||y>=this.height)return -1;const raw=this.map.layout[(y>>8)*this.map.width+(x>>8)];let id=raw&127;if(!id)return -1;if(this.behindLoop&&(raw&128)){id++;if(id===41)id=81}return id-1}
 wordAt(x:number,y:number){const chunk=this.chunkAt(Math.floor(x),Math.floor(y));return chunk<0?0:this.data.chunks[chunk*256+((Math.floor(y)&255)>>4)*16+((Math.floor(x)&255)>>4)]||0}
 solid(x:number,y:number,full=false){const ix=Math.floor(x),iy=Math.floor(y),word=this.wordAt(ix,iy);if(!(word&(full?16384:8192)))return false;const shape=this.data.collision[word&1023]||0;if(!shape)return false;let col=ix&15,row=iy&15;if(word&2048)col=15-col;if(word&4096)row=15-row;const h=this.heights[shape*16+col];return h>0?row>=16-h:h<0?row< -h:false}
 angleAt(x:number,y:number,fallback=0){const w=this.wordAt(x,y),id=this.data.collision[w&1023]||0;let a:number=this.angles[id];if(a&1)return fallback;if(w&2048)a=-a;if(w&4096)a=128-a;a=((a+128)%256+256)%256-128;return a*tau/256}
 floor(x:number,from=this.focusY-28,to=this.height+32):SurfaceHit|null{
  const ix=Math.floor(x);if(ix<0||ix>=this.width)return null
  for(let by=Math.max(0,Math.floor((from-16)/16));by*16<=Math.min(to,this.height-1);by++){
   const w=this.wordAt(ix,by*16);if(!(w&8192))continue;const shape=this.data.collision[w&1023]||0;if(!shape)continue
   const col=w&2048?15-(ix&15):ix&15,h=this.heights[shape*16+col];if(!h)continue
   const top=by*16+((w&4096)?h>0?0:16+h:h>0?16-h:0)
   if(top<from||top>to||this.solid(ix,top-1))continue
   return {x,y:top,angle:this.angleAt(ix,top)}
  }
  return null
 }
 ground(x:number){return this.floor(x)?.y??this.height+256}
 snap(x:number,y:number,angle:number,reach=18):SurfaceHit|null{
  const q=((Math.round(angle/(Math.PI/2))%4)+4)%4,dx=[0,-1,0,1][q],dy=[1,0,-1,0][q]
  for(let d=-reach;d<=reach;d++){
   const xx=Math.floor(x+dx*d),yy=Math.floor(y+dy*d),full=q!==0
   if(!this.solid(xx,yy,full)||this.solid(xx-dx,yy-dy,full))continue
   return{x:dx?xx+(dx<0?1:0):x,y:dy?yy+(dy<0?1:0):y,angle:this.angleAt(xx,yy,q===3?-Math.PI/2:q*Math.PI/2)}
  }
  return null
 }
 updateLoop(x:number,y:number,angle:number,air:boolean){
  if(this.zone!=='ghz'&&this.zone!=='slz')return;const ix=Math.floor(x),iy=Math.floor(y),id=this.map.layout[(iy>>8)*this.map.width+(ix>>8)],first=this.zone==='slz'?170:181,second=this.zone==='slz'?180:127
  if(id!==first&&id!==second){this.behindLoop=false;return}
  if(id===second&&air){this.behindLoop=false;return}
  if((ix&255)<44){this.behindLoop=false;return}if((ix&255)>=224){this.behindLoop=true;return}
  const a=((Math.round(angle/tau*256)%256)+256)%256
  if(!this.behindLoop&&a!==0&&a<=128)this.behindLoop=true;else if(this.behindLoop&&a>128)this.behindLoop=false
 }
 forceRoll(x:number,y:number){if(this.zone!=='ghz')return false;const id=this.map.layout[(Math.floor(y)>>8)*this.map.width+(Math.floor(x)>>8)];return id===31||id===32}
 lava(x:number,y:number){if(this.zone!=='mz')return false;const id=this.wordAt(x,y)&1023;return id>=362&&id<=367}
}
