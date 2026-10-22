import { superFrames, superPalettes } from './super-frames'
import type { OriginalSonicGame } from './original-game'
const atlas=typeof Image==='undefined'?null:new Image()
if(atlas)atlas.src='/art/original/super-sonic-indices.png'
const cache=new Map<string,HTMLCanvasElement>()
const reduced=typeof matchMedia!=='undefined'&&matchMedia('(prefers-reduced-motion: reduce)').matches
function sprite(id:number,variant:string,phase:number){const f=superFrames[id];if(!f||!atlas?.complete||!atlas.naturalWidth)return null;const key=id+':'+variant+':'+phase;if(cache.has(key))return cache.get(key)!;const out=document.createElement('canvas');out.width=f[2];out.height=f[3];const c=out.getContext('2d',{willReadFrequently:true})!;c.imageSmoothingEnabled=false;c.drawImage(atlas,f[0],f[1],f[2],f[3],0,0,f[2],f[3]);const pixels=c.getImageData(0,0,out.width,out.height),pal=superPalettes[variant][phase];for(let i=0;i<pixels.data.length;i+=4)if(pixels.data[i+3])pixels.data.set(pal[pixels.data[i]],i);c.putImageData(pixels,0,0);if(cache.size>=256)cache.delete(cache.keys().next().value!);cache.set(key,out);return out}
export function superFrame(g:OriginalSonicGame,ticks:number){
 if(g.superTransform>0)return[0x6d,0x6d,0x6e,0x6e,0x6f,0x70,0x71,0x70,0x71,0x70,0x71,0x70,0x71][Math.min(12,Math.floor((40-g.superTransform)/3))]
 if(g.spinDashing)return[0x42,0x43,0x42,0x44,0x42,0x45,0x42,0x46,0x42,0x47][(g.animation.cursor+9)%10]
 if(g.ball||g.rolling)return({Roll1:0x3d,Roll2:0x3e,Roll3:0x3f,Roll4:0x40,Roll5:0x41} as Record<string,number>)[g.animation.frame]||0x3d
 if(g.zoneState.sliding)return ticks%16<8?0x4e:0x4f
 const mode=g.animation.mode
 if(mode==='crouch')return 0xc1
 if(mode==='look')return ticks%24<12?0xb:0xc
 if(mode==='idle')return[0x72,0x73,0x74,0x73][Math.floor(ticks/8)%4]
 if(mode==='balance')return[0xc2,0xc3,0xc4,0xc3,0xc5,0xc6,0xc7,0xc6][Math.floor(ticks/10)%8]
 if(mode==='skid')return 0xd2+Math.floor(ticks/6)%4
 if(mode==='spring')return 0x5b
 const speed=g.peelCharging?g.peelCharge/30*12:Math.abs(g.grounded?g.groundSpeed:g.vx),angle=g.grounded?g.angle:0;let a=((Math.round(angle*128/Math.PI)%256)+256)%256;if(g.face>=0)a=(~a)&255;const bank=((((a+16)&255)>>4)&6)/2,step=Math.floor(ticks/(1+Math.floor(Math.max(0,8-speed))))
 if(speed>=8)return(step%2?0xb9:0xb5)+bank
 return[0x77,0x78,0x79,0x7a,0x7b,0x7c,0x75,0x76][step%8]+bank*8+(!reduced&&ticks%4===0?0x20:0)
}
export function drawSuperSonic(c:CanvasRenderingContext2D,g:OriginalSonicGame,ticks:number,variant:string){const phase=g.superTransform>0?Math.min(5,Math.floor((40-g.superTransform)/7)):6+(reduced?0:Math.floor(g.superTicks/8)%9),id=superFrame(g,ticks),f=superFrames[id],a=sprite(id,variant,phase);if(!a||!f)return false;c.imageSmoothingEnabled=false;c.drawImage(a,f[4],f[5]);return true}
