/** Original Sonic 1 animation scripts/timers, evaluated once per 60 Hz game step.
 * Primary sources (sonicretro/s1disasm, AS branch):
 * _anim/Sonic.asm and _incObj/01 Sonic.asm, Sonic_Animate.
 * A script delay of N holds a picture for N+1 ticks. Speed changes do not
 * restart the walk/run or slow/fast roll cursor. Spin dash is explicitly the
 * Sonic 2 addition, using its original zero-delay, ten-frame sequence.
 * Sonic CD's original 0x94–0xA3 figure-eight frames replace the run cycle
 * at 10 px/frame, including the same four angle banks and flip rules.
 * CD source: _Objects/Sonic/Data/Animations.asm and Main.asm (.No3DRamp).
 */
export type SonicAnimationInput={speed:number;angle:number;face:number;grounded:boolean;ball:boolean;rolling:boolean;skidding:boolean;crouching:boolean;hurt:boolean;dead:boolean;charging:boolean;dropping?:boolean;peeling?:number;lookingUp?:boolean;balance?:number}
export type SonicAnimationMode='motion'|'roll'|'idle'|'skid'|'crouch'|'hurt'|'death'|'spring'|'dash'|'balance'|'peel'|'look'|'drop'
const walk=[3,4,5,6,1,2],run=[1,2,3,4],roll=['Roll1','Roll2','Roll3','Roll4','Roll5'],fastRoll=['Roll1','Roll2','Roll5','Roll3','Roll4','Roll5']
const wait=[...Array<string>(12).fill('Stand'),'Wait2','Wait1','Wait1','Wait1','Wait2','Wait3']
const dash=['dash/0','dash/1','dash/0','dash/2','dash/0','dash/3','dash/0','dash/4','dash/0','dash/5']
export class SonicAnimation{
 mode:SonicAnimationMode='idle';frame='Stand';cursor=0;remaining=0;flipX=false;flipY=false;springTicks=0;private lastFace=1
 reset(){this.mode='idle';this.frame='Stand';this.cursor=0;this.remaining=0;this.flipX=false;this.flipY=false;this.springTicks=0;this.lastFace=1}
 rev(){this.cursor=0;this.remaining=0}
 spring(){this.springTicks=49;this.remaining=0}
 step(s:SonicAnimationInput){
  if(s.grounded||s.ball||s.hurt||s.dead)this.springTicks=0
  const mode:SonicAnimationMode=s.dead?'death':s.hurt?'hurt':s.charging?'dash':s.peeling!==undefined?'peel':s.dropping?'drop':s.ball||s.rolling?'roll':s.skidding?'skid':this.springTicks>0?'spring':s.grounded&&s.crouching?'crouch':s.grounded&&s.lookingUp?'look':s.grounded&&s.balance?'balance':s.speed!==0||!s.grounded?'motion':'idle'
  if(this.springTicks>0)this.springTicks--
  if(mode!==this.mode||mode==='motion'&&s.grounded&&s.face!==this.lastFace){this.mode=mode;this.cursor=0;this.remaining=0}
  this.lastFace=s.face
  if(--this.remaining>=0)return
  const speed=Math.abs(s.speed);let frames:readonly string[]=[],delay=0,loop=0
  this.flipX=(mode==='balance'?s.balance!:s.face)<0;this.flipY=false
  if(mode==='motion'){
   let angle=((Math.round(s.angle*128/Math.PI)%256)+256)%256
   if(!this.flipX)angle=(~angle)&255
   angle=(angle+16)&255
   const inverted=(angle&128)!==0,bank=((angle>>4)&6)/2+1
   this.flipX=this.flipX!==inverted;this.flipY=inverted
   frames=speed>=10?run.map(n=>`Peel${bank}${n}`):speed>=6?run.map(n=>`Run${bank}${n}`):walk.map(n=>`Walk${bank}${n}`)
   delay=Math.floor(Math.max(0,8-speed))
  }else if(mode==='peel'){const chargeSpeed=Math.min(1,Math.max(0,s.peeling!))*12;frames=chargeSpeed>=10?run.map(n=>`Peel1${n}`):chargeSpeed>=6?run.map(n=>`Run1${n}`):walk.map(n=>`Walk1${n}`);delay=Math.floor(Math.max(0,8-chargeSpeed))}
  else if(mode==='drop'){frames=fastRoll;delay=0}
  else if(mode==='look'){frames=['LookUp'];delay=15}
  else if(mode==='roll'){frames=speed>=6?fastRoll:roll;delay=Math.floor(Math.max(0,4-speed))}
  else if(mode==='idle'){frames=wait;delay=23;loop=16}
  else if(mode==='skid'){frames=['Stop1','Stop2'];delay=7}
  else if(mode==='balance'){frames=['Balance1','Balance2'];delay=31}
  else if(mode==='crouch'){frames=['Duck'];delay=63}
  else if(mode==='spring'){frames=['Spring'];delay=47}
  else if(mode==='hurt'){frames=['Injury'];delay=3}
  else if(mode==='death'){frames=['Death'];delay=3}
  else if(mode==='dash'){frames=dash;delay=0}
  if(this.cursor>=frames.length)this.cursor=loop
  this.frame=frames[this.cursor++];this.remaining=delay
 }
}

// Object scripts from Sonic 1 _anim/, plus sonic.asm SynchroAnimate/Sync2.
export function signpostFrame(age:number){if(age<=0)return 'eggman';if(age>=122)return 'sonic';const second=age>=61;return[second?'sonic':'eggman','spin1','spin2','spin3'][Math.floor((age-(second?61:1))/2)%4]}
export const signpostSparkleOffsets=[[-24,-16],[8,8],[-16,0],[24,-8],[0,-8],[16,0],[-24,8],[24,16]] as const
const scriptIndex=(tick:number,hold:number,length:number)=>Math.floor(Math.max(0,tick-1)/hold)%length
export const ringFrame=(tick:number)=>(tick>0?Math.floor((tick-1)/8)+1:0)%4
export const shieldFrame=(tick:number)=>[1,0,2,0,3,0][scriptIndex(tick,2,6)]
export function monitorFrame(kind:string,tick:number){const i=scriptIndex(tick,2,9);return i%3===0?'monitor/static'+i/3:'monitor/'+(kind==='life'?'sonic':kind)}
export function badnikFrame(kind:'crab'|'bug'|'bee'|'fish',tick:number,fast=false){
 if(kind==='bug')return {name:'bug/'+['moto1','moto2','moto1','moto3'][scriptIndex(tick,8,4)],flip:false}
 if(kind==='bee')return {name:'bee/'+['Fly1','Fly2'][scriptIndex(tick,2,2)],flip:false}
 if(kind==='fish')return {name:'fish/'+['mouthshut','mouthopen'][scriptIndex(tick,fast?4:8,2)],flip:false}
 const i=scriptIndex(tick,16,3);return {name:'crab/'+(i<2?'walk':'stand'),flip:i===1}
}
export function springFrame(age:number|undefined,horizontal=false){const pose=age===undefined?'':age<1?'Flat':age<3||age>=9?'':'Ext';return 'spring/spg_'+(horizontal?'Left':'Up')+pose}
