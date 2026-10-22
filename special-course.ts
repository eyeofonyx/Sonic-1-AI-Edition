export type BonusMode='ready'|'playing'|'paused'|'success'|'failed'|'error'
export type BonusObject={id:number;z:number;angle:number;kind:'ring'|'bomb';done:boolean}
export type BonusEvent='ring'|'bomb'|'jump'|'checkpoint'|'success'|'failed'
export type BonusStats={mode:BonusMode;stage:number;rings:number;target:number;gate:number;distance:number;progress:number;remaining:number;banner:string;lost:number}
export const LEG_LENGTH=360, COURSE_LENGTH=LEG_LENGTH*3, PIPE_RADIUS=7.2
export const specialThemes=[
 {name:'Sunset Sprint',gem:'#52e4ff',floor:'#df7033',alternate:'#a83a39',edge:'#ffe685',sky:'#292061',horizon:'#f39f99'},
 {name:'Emerald Bend',gem:'#59ef83',floor:'#43aab0',alternate:'#257086',edge:'#b8ff9d',sky:'#101e54',horizon:'#75d5cc'},
 {name:'Rose Rush',gem:'#fb7fca',floor:'#b75d91',alternate:'#744175',edge:'#ffe7ab',sky:'#301353',horizon:'#ec9cbb'},
 {name:'Cobalt Corkscrew',gem:'#5a8dff',floor:'#5484d8',alternate:'#3d4e9b',edge:'#8be9ff',sky:'#0b1339',horizon:'#818bcc'},
 {name:'Golden Gauntlet',gem:'#ffdf57',floor:'#d6ab45',alternate:'#99702d',edge:'#fff4b7',sky:'#301e4c',horizon:'#f3ba82'},
 {name:'Violet Velocity',gem:'#ba83ff',floor:'#9b67cb',alternate:'#613b88',edge:'#edbdff',sky:'#170f3d',horizon:'#b586cd'},
 {name:'Diamond Run',gem:'#edfaff',floor:'#a4c9ce',alternate:'#538395',edge:'#ffffff',sky:'#081c3d',horizon:'#82a9c9'}
]
export function targetsFor(stage:number){return [30+(stage-1)*4,65+(stage-1)*8,105+(stage-1)*12]}
export function courseCenter(s:number,stage:number){return {x:Math.sin(s/107+stage*.6)*10+Math.sin(s/221)*8,y:Math.sin(s/137)*3.2,bank:Math.sin(s/93+stage)*(.10+stage*.013)}}
export function makeSpecialCourse(stage:number):BonusObject[]{const objects:BonusObject[]=[];const add=(z:number,angle:number,kind:BonusObject['kind'])=>objects.push({id:objects.length,z,angle,kind,done:false});
 for(let leg=0;leg<3;leg++)for(let row=0;row<56;row++){
  const z=leg*LEG_LENGTH+28+row*5.2;let a=0;
  if(leg===0&&stage===1)a=row<22?0:Math.sin((row-22)/8)*.65;
  else {const pattern=(stage+leg)%5;if(pattern===0)a=Math.sin(row/7)*1.1;else if(pattern===1)a=row<18?-.85:row<36?.85:0;else if(pattern===2)a=Math.sin(row/11+leg)*1.18;else if(pattern===3)a=row%24<12?-.62:.62;else a=Math.sin(row/5)*(.7+stage*.03)}
  add(z,a,'ring');if(row%3===0){add(z,a-.14,'ring');add(z,a+.14,'ring')}
  // Bombs are readable gates, not random obstacles dropped on top of rings.
  const bombStep=stage<3?13:stage<6?10:8;
  if(row>8&&row%bombStep===0){const bombZ=z+2.6;const opposite=a>.2?-.68:a<-.2?.68:(leg%2?-.65:.65);add(bombZ,opposite,'bomb');if(leg>0||stage>2)add(bombZ,opposite+(opposite>0?.23:-.23),'bomb')}
  if(leg>0&&row%19===12){add(z+2.6,a,'bomb');add(z-5.2,a-.28,'ring');add(z-5.2,a+.28,'ring')}
 }
 return objects.sort((a,b)=>a.z-b.z)
}
export class HalfPipeRun {
 stage:number;mode:BonusMode='ready';objects:BonusObject[];rings=0;distance=0;angle=0;angularVelocity=0;jump=0;jumpVelocity=0;queuedJump=false;keys=new Set<string>();steerTarget:number|null=null;time=0;gate=0;gateWait=0;hitTime=0;banner='';bannerTime=0;lost=0;hitCount=0;nextObject=0;onEvent:(event:BonusEvent)=>void
 constructor(stage:number,onEvent:(event:BonusEvent)=>void=()=>{}){this.stage=stage;this.objects=makeSpecialCourse(stage);this.onEvent=onEvent}
 get target(){return this.targetFor(this.gate)}
 targetFor(index:number){return targetsFor(this.stage)[Math.min(2,index)]}
 get speed(){return (23+this.stage*1.15+this.gate*1.3)*(this.hitTime>0?.68:1)}
 start(){if(this.mode==='paused'){this.mode='playing';return}this.objects=makeSpecialCourse(this.stage);this.rings=0;this.distance=0;this.angle=0;this.angularVelocity=0;this.jump=0;this.jumpVelocity=0;this.queuedJump=false;this.keys.clear();this.steerTarget=null;this.time=0;this.gate=0;this.gateWait=0;this.hitTime=0;this.hitCount=0;this.lost=0;this.nextObject=0;this.banner=`GET ${this.target} RINGS!`;this.bannerTime=2.5;this.mode='playing'}
 press(key:string){this.keys.add(key);if(key==='ArrowLeft'||key==='a')this.angularVelocity=Math.min(-.65,this.angularVelocity);if(key==='ArrowRight'||key==='d')this.angularVelocity=Math.max(.65,this.angularVelocity);if([' ','ArrowUp','w','z'].includes(key))this.queuedJump=true}
 release(key:string){this.keys.delete(key)}
 pause(){if(this.mode==='playing'){this.mode='paused';this.keys.clear();this.steerTarget=null;this.queuedJump=false}else if(this.mode==='paused')this.mode='playing'}
 suspend(){this.keys.clear();this.steerTarget=null;this.queuedJump=false;if(this.mode==='playing')this.mode='paused'}
 stats():BonusStats{return {mode:this.mode,stage:this.stage,rings:this.rings,target:this.target,gate:Math.min(3,this.gate+1),distance:this.distance,progress:Math.min(100,this.distance/COURSE_LENGTH*100),remaining:Math.max(0,this.target-this.rings),banner:this.bannerTime>0?this.banner:'',lost:this.hitTime>0?this.lost:0}}
 update(dt:number){if(this.mode!=='playing')return;this.time+=dt;this.bannerTime=Math.max(0,this.bannerTime-dt);this.hitTime=Math.max(0,this.hitTime-dt)
 const dir=(this.keys.has('ArrowRight')||this.keys.has('d')?1:0)-(this.keys.has('ArrowLeft')||this.keys.has('a')?1:0)
 if(this.steerTarget!==null){const diff=this.steerTarget-this.angle;this.angularVelocity=Math.max(-2.5,Math.min(2.5,diff*9))}
 else if(dir){this.angularVelocity+=dir*11*dt;this.angularVelocity=Math.max(-2.5,Math.min(2.5,this.angularVelocity))}
 else {this.angularVelocity*=Math.exp(-12*dt);if(Math.abs(this.angularVelocity)<.02)this.angularVelocity=0}
 this.angle=Math.max(-1.35,Math.min(1.35,this.angle+this.angularVelocity*dt));
 if(this.queuedJump&&this.jump===0){this.jumpVelocity=7.6;this.onEvent('jump')}this.queuedJump=false;
 this.jumpVelocity-=18*dt;this.jump+=this.jumpVelocity*dt;if(this.jump<=0){this.jump=0;this.jumpVelocity=0}
 if(this.gateWait>0){this.gateWait-=dt;if(this.gateWait<=0){this.gate++;this.banner=`GET ${this.target} RINGS!`;this.bannerTime=2}return}
 const previous=this.distance;this.distance=Math.min((this.gate+1)*LEG_LENGTH,this.distance+this.speed*dt);let picked=0;
 for(let i=this.nextObject;i<this.objects.length;i++){const o=this.objects[i];if(o.z>this.distance+2)break;if(o.done)continue;if(o.z<previous-2.5){o.done=true;this.nextObject=i+1;continue}if(o.z>this.distance)continue;
  const close=Math.abs(o.angle-this.angle)<(o.kind==='ring'?.155:.19);o.done=true;
  if(close&&o.kind==='ring'&&this.jump<2.2){this.rings++;picked++}
  if(close&&o.kind==='bomb'&&this.jump<1.03&&this.hitTime<=0){this.lost=Math.min(10,this.rings);this.rings-=this.lost;this.hitTime=1.1;this.hitCount++;this.banner='WATCH THE BOMBS!';this.bannerTime=1;this.onEvent('bomb')}
 }
 if(picked)this.onEvent('ring');
 if(this.distance>=(this.gate+1)*LEG_LENGTH){if(this.rings<this.target){this.mode='failed';this.banner=`${this.target-this.rings} RINGS SHORT`;this.bannerTime=10;this.onEvent('failed')}else if(this.gate===2){this.mode='success';this.banner='CHAOS EMERALD!';this.bannerTime=10;this.onEvent('success')}else{this.gateWait=1.6;this.banner='CHECKPOINT CLEARED!';this.bannerTime=1.6;this.onEvent('checkpoint')}}
 }
}
