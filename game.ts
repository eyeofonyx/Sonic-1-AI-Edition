import type { Character, CharacterAbility } from './characters'
import type { GameSound } from './original-effects'
import { SonicAnimation } from './sonic-animation'
import { SONIC_PHYSICS as P, surface, fixed, slopeStep, groundStep, airStep, decayDash, dashSpeed, landingSpeed, jumpGravity, type JumpFeel } from './sonic-physics'
import { platformPosition, type Platform, type Enemy, type Monitor } from './level'
import { actLevels, levelFor, type Act, type StageLevel } from './acts'
import { createCaveDrops, updateCaveHazards, type CaveDrop } from './cave-hazards'
import { CrystalWarden } from './cave-boss'
import { WreckingBoss } from './boss'
import { drawGame } from './renderer'
export { ground } from './level'
export type Mode='ready'|'playing'|'paused'|'won'|'over'
export type Stats={duoMode?:boolean;tailsStatus?:string;character?:Character;characterAbility?:CharacterAbility;flightRemaining?:number;emeraldBonusUnlocked?:boolean;dropCharging?:boolean;dropCharge?:number;dropLaunched?:boolean;superSonic?:boolean;superAvailable?:boolean;superCheat?:boolean;superTransforming?:boolean;canSuper?:boolean;score:number;rings:number;time:number;lives:number;progress:number;section?:string;speed?:number;power?:string;act?:Act;clearedActs?:number[];bossHP?:number;bossPhase?:string;bossPractice?:boolean;bossName?:string;bossCue?:string;musicStatus?:string;musicTitle?:string;underwater?:boolean;airSeconds?:number;waterLevel?:number;ending?:boolean;tally?:{time:number;ring:number;total:number;done:boolean};peelCharging?:boolean;peelCharge?:number;peelLaunched?:boolean;canPeel?:boolean;dashCharging?:boolean;dashCharge?:number;dashRevs?:number;dashLaunched?:boolean}
export type Particle={x:number;y:number;vx:number;vy:number;life:number;kind:'ring'|'spark'|'smoke'|'animal'|'dust';color?:string;age:number}
export type Popup={x:number;y:number;text:string;life:number}
export class SonicGame {
 canvas:HTMLCanvasElement;ctx:CanvasRenderingContext2D;onChange:(mode:Mode,stats:Stats)=>void;keys=new Set<string>();mode:Mode='ready';stats:Stats={score:0,rings:0,time:0,lives:3,progress:0}
 x=120;y=560;vx=0;vy=0;face=1;grounded=true;rolling=false;ball=false;skidding=false;angle=0;camera=0;cameraY=220;viewW=640;viewH=400;clock=0;elapsed=0;frame=0;last=0;accumulator=0;raf=0;disposed=false
 jumpFeel:JumpFeel='crisp'
 animation=new SonicAnimation();springAnimations=new Map<number,number>()
 groundSpeed=0;groundVX=NaN;rollJump=false;hurtState=false;controlLock=0
 dropCharging=false;dropCharge=0;dropFlash=0
 peelCharging=false;peelCharge=0;peelFlash=0;peelFacing=1
 spinDashing=false;spinCharge=0;spinRevs=0;spinTapQueue=0;dashPhase=0;dashFlash=0
 jumpLatch=false;ownJump=false;jumpBuffer=0;coyote=0;invincible=0;shield=false;starTime=0;shoeTime=0;checkpoint=120;deathTimer=0;clearTimer=0;intro=150;loop:{index:number;theta:number;speed:number;direction?:number}|null=null;loopCooldown=0;platform:Platform|null=null;platformOldX=0;platformOldY=0
 act:Act=1;level:StageLevel=levelFor(1);caveDrops:CaveDrop[]=[];completedActs:number[]=[];boss:WreckingBoss|null=null;caveBoss:CrystalWarden|null=null;bossPractice=false;capsuleSpawned=false
 rings:{x:number;y:number;taken:boolean}[]=[];enemies:Enemy[]=[];monitors:Monitor[]=[];platforms:Platform[]=[];particles:Particle[]=[];popups:Popup[]=[];bullets:{x:number;y:number;vx:number;vy:number;life:number;kind?:'buzzer'|'coconut'}[]=[];rocks:{x:number;y:number;broken:boolean}[]=[]
 sound=true;renderSuspended=false;audio:AudioContext|null=null;audioOutput:GainNode|null=null;musicNext=0;musicStep=0;shake=0
 specialAvailable=true;specialPortal:{x:number;y:number;life:number}|null=null;onSpecialRequest:(()=>void)|null=null
 constructor(canvas:HTMLCanvasElement,onChange:(mode:Mode,stats:Stats)=>void){this.canvas=canvas;this.ctx=canvas.getContext('2d',{willReadFrequently:true})!;this.onChange=onChange;this.reset();this.mode='ready';this.tick=this.tick.bind(this);this.raf=requestAnimationFrame(this.tick)}
 reset(preserve=false){
  const score=preserve?this.stats.score:0,lives=preserve?this.stats.lives:3;this.level=levelFor(this.act);const {ground,makeRings,makeEnemies,makeMonitors,makePlatforms}=this.level
  this.animation.reset();this.springAnimations.clear();this.groundSpeed=0;this.groundVX=NaN;this.rollJump=false;this.hurtState=false;this.controlLock=0;this.cancelSpinDash();this.dashPhase=0;this.caveDrops=createCaveDrops(this.level);this.x=120;this.y=ground(120);this.vx=0;this.vy=0;this.face=1;this.grounded=true;this.skidding=false;this.camera=0;this.cameraY=this.y-this.viewH*.73;this.clock=0;this.elapsed=0;this.checkpoint=120;this.invincible=0;this.shield=false;this.starTime=0;this.shoeTime=0;this.rolling=false;this.ball=false;this.angle=0;this.deathTimer=0;this.clearTimer=0;this.intro=150;this.loop=null;this.loopCooldown=0;this.platform=null;this.rings=makeRings();this.enemies=makeEnemies();this.monitors=makeMonitors();this.platforms=makePlatforms();this.particles=[];this.popups=[];this.bullets=[];this.specialPortal=null;this.rocks=this.level.rocks.map(r=>({...r,broken:false}));this.boss=this.level.bossArena?new WreckingBoss(this.level.bossArena):null;this.caveBoss=this.level.caveArena?new CrystalWarden(this.level.caveArena):null;this.bossPractice=false;this.capsuleSpawned=false;this.stats={score,rings:0,time:0,lives,progress:0,section:this.level.sections[0].name,speed:0,power:'',act:this.act,clearedActs:[...this.completedActs]};this.keys.clear();this.jumpLatch=false;this.ownJump=false;this.jumpBuffer=0;this.musicStep=0;this.musicNext=0
 }
 get activeArena(){return this.boss?.active?this.boss.arena:this.caveBoss?.active?this.caveBoss.arena:null}
 emit(){this.stats.dashCharging=this.spinDashing;this.stats.dashCharge=this.spinCharge;this.stats.dashRevs=this.spinRevs;this.stats.dashLaunched=this.dashFlash>0;this.stats.act=this.act;this.stats.clearedActs=[...this.completedActs];this.stats.bossHP=this.caveBoss?.active?this.caveBoss.hp:this.boss?.active?this.boss.hp:undefined;this.stats.bossPhase=this.caveBoss?.active?this.caveBoss.phase:this.boss?.active?this.boss.phase:undefined;this.stats.bossName=this.caveBoss?.active?'Marble Sentinel':this.boss?.active?(this.boss.arena.kind==='chase'?'Labyrinth chase':'Egg Mobile'):undefined;this.stats.bossCue=this.caveBoss?.active?this.caveBoss.cue:this.boss?.active&&this.boss.arena.kind==='chase'?'Outclimb the rising water. Reaching the top defeats this chase—eight hits are optional.':undefined;this.stats.bossPractice=this.bossPractice;this.onChange(this.mode,{...this.stats})}
 press(key:string){const fresh=!this.keys.has(key);this.keys.add(key);if(fresh&&[' ','ArrowUp','w','z'].includes(key)){if(this.mode==='playing'&&!this.deathTimer&&!this.clearTimer&&this.grounded&&!this.loop&&(this.keys.has('ArrowDown')||this.keys.has('s'))&&(this.spinDashing||Math.abs(this.vx)<P.rollStart)){this.spinTapQueue++;this.jumpBuffer=0}else if(!this.jumpLatch)this.jumpBuffer=1}}
 release(key:string){this.keys.delete(key);if([' ','ArrowUp','w','z'].includes(key)&&![' ','ArrowUp','w','z'].some(k=>this.keys.has(k)))this.jumpLatch=false}
 cancelSpinDash(){const charging=this.spinDashing;this.spinDashing=false;this.spinCharge=0;this.spinRevs=0;this.spinTapQueue=0;this.dashFlash=0;if(charging){this.animation.reset();this.rolling=false;this.ball=false;this.ownJump=false;this.jumpBuffer=0}}
 dashSound(revs:number,launch=false){
  if(!this.sound||!this.audio)return;const now=this.audio.currentTime,duration=launch?.32:.19,pitch=launch?920:240+130*Math.log2(revs+1)
  const o=this.audio.createOscillator(),gain=this.audio.createGain();o.type=launch?'sawtooth':'square';o.frequency.setValueAtTime(launch?pitch:pitch*.62,now);o.frequency.exponentialRampToValueAtTime(launch?150:pitch,now+(launch?duration:.045));if(!launch)o.frequency.exponentialRampToValueAtTime(pitch*.87,now+duration);gain.gain.setValueAtTime(.001,now);gain.gain.linearRampToValueAtTime(launch?.055:.035,now+.008);gain.gain.exponentialRampToValueAtTime(.0001,now+duration);o.connect(gain);gain.connect(this.audio.destination);o.start(now);o.stop(now+duration+.01)
  this.note(launch?110:pitch/2,launch?.18:.12,'triangle',.025,now)
 }
 dashDust(launch=false){for(let i=0;i<(launch?7:1);i++)this.particles.push({x:this.x-this.face*(15+i*3),y:this.y-3-i%3*2,vx:-this.face*(.45+i*.2),vy:-.25-i%3*.15,life:24+i%3*4,age:0,kind:'dust'})}
 start(){if(this.mode==='paused'){this.mode='playing';this.wake();this.emit();return}if(this.bossPractice){this.practiceBoss(this.act===4?4:3);return}if(this.mode==='won'&&this.act<actLevels.length){this.nextAct();return}if(this.mode==='won'){this.act=1;this.completedActs=[]}this.reset();this.mode='playing';this.wake();this.emit()}
 selectAct(act:Act){this.act=act;this.reset();this.mode='ready';this.emit()}
 nextAct(){if(this.act>=actLevels.length)return;this.act=(this.act+1) as Act;this.reset(true);this.mode='playing';this.wake();this.emit()}
 practiceBoss(act:3|4=3){this.act=act;this.reset();this.bossPractice=true;const arena=(act===4?this.level.caveArena:this.level.bossArena)!;this.x=arena.left+34;this.y=this.level.ground(this.x);this.checkpoint=act===4?this.level.checkpoints.at(-1)!:this.x;this.stats.rings=12;this.intro=0;this.mode='playing';if(act===4)this.caveBoss!.enter();else this.boss!.enter();this.viewW=640;this.viewH=this.canvas.clientWidth>0&&this.canvas.clientWidth<550?480:400;this.camera=arena.center-this.viewW/2;this.cameraY=arena.floor-this.viewH*.82;this.wake();this.emit()}
 pause(){if(this.mode==='playing'){this.cancelSpinDash();this.mode='paused';this.keys.clear()}else if(this.mode==='paused'){this.mode='playing';this.musicNext=0}this.emit()}
 restart(){if(this.bossPractice){this.practiceBoss(this.act===4?4:3);return}this.reset();this.mode='playing';this.wake();this.emit()}
 wake(){if(!this.audio){try{this.audio=new AudioContext();this.audioOutput=this.audio.createGain();this.audioOutput.connect(this.audio.destination)}catch{/* Audio is optional. */}}if(this.audioOutput)this.audioOutput.gain.value=this.sound?1:0;void this.audio?.resume()}
 setSound(value:boolean){this.sound=value;this.wake()}
 sfx(name:GameSound){const f=name==='life'?2000:name==='death'?140:name==='ring-loss'?170:name==='shield'?260:300;this.beep(f,.2,'triangle')}
 note(freq:number,duration:number,type:OscillatorType,volume:number,when?:number){if(!this.sound||!this.audio)return;const now=when??this.audio.currentTime;const o=this.audio.createOscillator(),g=this.audio.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(volume,now);g.gain.exponentialRampToValueAtTime(.0001,now+duration);o.connect(g);g.connect(this.audioOutput??this.audio.destination);o.start(now);o.stop(now+duration+.01)}
 beep(f:number,d=.1,type:OscillatorType='square',vol=.035){this.note(f,d,type,vol)}
 ringSound(){
  if(!this.audio||!this.sound)return;
  const now=this.audio.currentTime;
  // A quick rising E6–G6–C7 arpeggio, with a longer bell-like final note.
  this.note(1318.51022765148,.08,'sine',.065,now);
  this.note(1567.981743926997,.10,'sine',.055,now+.04);
  this.note(2093.004522404789,.22,'sine',.045,now+.08);
 }
 music(){if(!this.audio||!this.sound||this.mode!=='playing')return;const now=this.audio.currentTime;if(this.musicNext<now-.1)this.musicNext=now+.015;const bossBattle=(!!this.boss?.active&&this.boss.hp>0)||(!!this.caveBoss?.active&&this.caveBoss.hp>0);const notes=bossBattle?[52,0,55,58,52,0,59,58,52,55,58,64,63,58,55,0,53,0,56,59,53,0,60,59,53,56,59,65,64,59,56,0]:this.level.theme==='marble'?[64,67,71,72,71,67,64,0,62,65,69,71,69,65,62,0,60,64,67,71,67,64,60,0,59,62,65,69,65,62,59,0]:[76,79,81,79,76,72,74,76,79,0,81,84,83,79,76,0,77,81,84,81,77,74,76,77,81,0,79,77,76,74,72,0,76,79,84,83,81,79,76,74,72,76,79,81,79,76,74,0,77,76,74,72,71,74,77,79,81,79,77,76,74,71,72,0];while(this.musicNext<now+.11){const s=this.musicStep++,n=notes[s%notes.length];if(n)this.note(440*Math.pow(2,(n-69)/12),.135,this.level.theme==='marble'?'triangle':'square',this.level.theme==='marble'?.025:.012,this.musicNext);if(s%2===0){const b=[48,48,53,55,48,45,53,55][Math.floor(s/8)%8]+(s%4===2?7:0);this.note(440*Math.pow(2,(b-69)/12),.19,'triangle',.045,this.musicNext)}if(s%4===2)this.note(85,.055,'sawtooth',.013,this.musicNext);this.musicNext+=.135}}
 popup(text:string,x=this.x,y=this.y-40){this.popups.push({text,x,y,life:80})}
 burst(x:number,y:number,kind:Particle['kind']='spark'){for(let i=0;i<(kind==='smoke'?10:7);i++)this.particles.push({x,y,vx:Math.cos(i*2.4)*(1+i%3),vy:-2-Math.sin(i*2.4)*2,life:35+i*2,age:0,kind,color:['#fff1ad','#ffdb35','#f8a23b'][i%3]})}
 addRings(n:number){const before=Math.floor(this.stats.rings/100);this.stats.rings+=n;this.stats.score+=n*10;if(Math.floor(this.stats.rings/100)>before){this.stats.lives++;this.popup('1 UP!');this.sfx('life')}this.ringSound()}
 hurt(sourceX:number){if(this.hurtState||this.invincible>0||this.starTime>0||this.deathTimer>0)return;this.cancelSpinDash();this.loop=null;this.ball=false;this.ownJump=false;this.rolling=false;this.platform=null;this.grounded=false;this.rollJump=false;this.hurtState=true;this.vx=this.x<sourceX?-P.hurtX:P.hurtX;this.vy=P.hurtY;this.invincible=120;this.shake=8;if(this.shield){this.shield=false;this.burst(this.x,this.y-18);this.sfx('hurt');return}if(!this.stats.rings){this.die();return}for(let i=0;i<Math.min(32,this.stats.rings);i++){const a=-Math.PI*(.08+(i%16)/16*.84),speed=i<16?5.8:3.5;this.particles.push({x:this.x,y:this.y-20,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,life:420,age:0,kind:'ring'})}this.stats.rings=0;this.sfx('ring-loss');this.emit()}
 die(){if(this.deathTimer)return;this.cancelSpinDash();this.stats.lives--;this.deathTimer=85;this.loop=null;this.rolling=false;this.ball=false;this.hurtState=false;this.rollJump=false;this.vx=0;this.vy=P.deathY;this.sfx('death');this.emit()}
 respawn(){this.animation.reset();this.springAnimations.clear();this.cancelSpinDash();this.groundSpeed=0;this.groundVX=NaN;this.rollJump=false;this.hurtState=false;this.controlLock=0;const {ground}=this.level;this.deathTimer=0;if(this.stats.lives<=0){this.mode='over';this.emit();return}this.x=this.checkpoint;this.y=ground(this.x);this.camera=Math.max(0,this.x-this.viewW*.35);this.cameraY=this.y-this.viewH*.73;this.vx=0;this.vy=0;this.stats.rings=0;this.grounded=true;this.invincible=140;this.shield=false;this.starTime=0;this.shoeTime=0;this.platform=null;this.keys.clear();this.bullets=[];this.caveDrops=createCaveDrops(this.level);if(this.caveBoss?.active){this.caveBoss=new CrystalWarden(this.level.caveArena!);this.intro=0;for(const r of this.rings)if(r.x>=this.checkpoint)r.taken=false;for(const m of this.monitors)if(m.x>=this.checkpoint)m.broken=false;this.particles=[];this.popups=[]}if(this.boss?.active){this.boss=new WreckingBoss(this.level.bossArena!);this.boss.enter();this.platforms=this.platforms.filter(p=>p.kind!=='capsule');this.capsuleSpawned=false;for(const r of this.rings)if(r.x>=this.level.bossArena!.left)r.taken=false}this.emit()}
 bridgeY(b:{x:number;end:number;y:number},x:number){if(this.level.theme==='marble')return b.y;const t=(x-b.x)/(b.end-b.x);return b.y+Math.sin(t*Math.PI)*19+(this.grounded&&Math.abs(x-this.x)<90?Math.cos((x-this.x)/90*Math.PI/2)*5:0)}
 floorAt(x:number,previousY:number,reach=8){const {ground,inGap,bridgeDefs}=this.level;let floor=inGap(x)?Infinity:ground(x);let platform:Platform|null=null;for(const b of bridgeDefs)if(x>=b.x&&x<=b.end){const by=this.bridgeY(b,x);if(previousY<=by+reach&&by<floor)floor=by}for(const p of this.platforms){if((p.timer||0)>40)continue;const pos=platformPosition(p,this.clock);if(x>pos.x-8&&x<pos.x+p.w+8&&previousY<=pos.y+reach&&pos.y<floor){floor=pos.y;platform=p}}return {y:floor,platform}}
 smashMonitor(m:Monitor){m.broken=true;this.stats.score+=100;this.burst(m.x,m.y-20,'smoke');this.sfx('destroy');if(m.kind==='rings'){this.addRings(10);this.popup('+10 RINGS',m.x,m.y-50)}if(m.kind==='shield'){this.shield=true;this.sfx('shield');this.popup('SHIELD',m.x,m.y-50)}if(m.kind==='shoes'){this.shoeTime=1200;this.popup('SPEED SHOES',m.x,m.y-50)}if(m.kind==='invincible'){this.starTime=1200;this.popup('INVINCIBLE',m.x,m.y-50)}if(m.kind==='life'){this.stats.lives++;this.sfx('life');this.popup('1 UP!',m.x,m.y-50)}if(this.vy>0)this.vy=-6}
 handleLoop(dt:number,jumpPressed:boolean){
  const l=this.loop!,def=this.level.loopDefs[l.index],a=surface(-l.theta),direction=l.direction??(Math.sign(l.theta)||Math.sign(l.speed)||1)
  if(jumpPressed){this.vx=fixed(a.cos*l.speed+a.sin*P.jumpSpeed);this.vy=fixed(a.sin*l.speed-a.cos*P.jumpSpeed);this.rollJump=this.rolling;this.grounded=false;this.ball=true;this.ownJump=true;this.rolling=false;this.loop=null;this.loopCooldown=35;this.beep(700,.13);return}
  const left=this.keys.has('ArrowLeft')||this.keys.has('a'),right=this.keys.has('ArrowRight')||this.keys.has('d')
  l.speed=groundStep(slopeStep(l.speed,a.angle,this.rolling,dt),left,right,this.rolling,this.shoeTime>0,this.controlLock>0,dt)
  l.theta+=l.speed/def.r*dt;const next=surface(-l.theta);this.x=def.x+Math.sin(l.theta)*def.r;this.y=def.base-def.r+Math.cos(l.theta)*def.r;this.angle=next.angle
  this.groundSpeed=l.speed;this.vx=fixed(next.cos*l.speed);if(this.rolling)this.vx=Math.max(-P.rollingXLimit,Math.min(P.rollingXLimit,this.vx));this.vy=fixed(next.sin*l.speed);this.groundVX=this.vx;this.grounded=true;this.ball=this.rolling
  if(Math.abs(l.speed)<P.slipSpeed&&Math.abs(next.angle)>=Math.PI/4){this.grounded=false;this.loop=null;this.loopCooldown=30;this.controlLock=P.controlLock;this.groundSpeed=0;this.ownJump=false}
  else if(Math.abs(l.theta)>=Math.PI*2||l.theta*direction<0){const completed=Math.abs(l.theta)>=Math.PI*2;this.x=def.x+Math.sign(l.speed)*8;this.y=def.base;this.vx=l.speed;this.vy=0;this.groundVX=this.vx;this.angle=0;this.loop=null;this.loopCooldown=55;if(completed){this.popup('LOOP!',this.x,this.y-55);this.stats.score+=200;this.burst(this.x,this.y-20)}}
 }
 update(dt:number){if(this.mode!=='playing')return;this.stepPhysics(dt);const speed=this.clearTimer?this.vx:this.loop?.speed??this.groundSpeed,still=this.grounded&&Math.abs(speed)<1/256&&!this.spinDashing;let balance=0;if(still&&Math.abs(this.angle)<Math.PI/8){if(this.floorAt(this.x-12,this.y,12).y>this.y+12)balance=-1;else if(this.floorAt(this.x+12,this.y,12).y>this.y+12)balance=1}this.animation.step({speed,angle:this.angle,face:this.face,grounded:this.grounded,ball:this.ball,rolling:this.rolling,skidding:this.skidding,crouching:this.keys.has('ArrowDown')||this.keys.has('s'),hurt:this.hurtState,dead:this.deathTimer>0,charging:this.spinDashing,dropping:this.dropCharge>=20,peeling:this.peelCharging?this.peelCharge/30:undefined,lookingUp:this.keys.has('ArrowUp'),balance})}
 stepPhysics(dt:number){if(this.mode!=='playing')return;const {end:LEVEL_END,ground,inGap,loopDefs,spikeDefs,springDefs,checkpoints,sections}=this.level;this.clock+=dt/60;this.elapsed=this.clock;this.dashFlash=Math.max(0,this.dashFlash-dt);if(this.spinDashing||this.dashFlash>0)this.dashPhase+=(this.spinDashing?.25+this.spinCharge*.12:Math.abs(this.vx)*.09)*dt;this.stats.time=Math.floor(this.clock);this.intro=Math.max(0,this.intro-dt);this.shake=Math.max(0,this.shake-dt);this.invincible=Math.max(0,this.invincible-dt);this.starTime=Math.max(0,this.starTime-dt);this.shoeTime=Math.max(0,this.shoeTime-dt);this.loopCooldown=Math.max(0,this.loopCooldown-dt)
 if(this.deathTimer>0){this.deathTimer-=dt;this.y+=this.vy*dt;this.vy+=P.gravity*dt;if(this.deathTimer<=0){this.deathTimer=1;this.respawn()}this.effects(dt);return}
 if(this.clearTimer>0){this.clearTimer+=dt;if(!this.boss){this.x=Math.min(LEVEL_END+200,this.x+4*dt);this.y=ground(this.x)}else {this.vx=0;this.y=Math.min(ground(this.x),this.y+3*dt)}if(this.clearTimer>(this.boss?180:130)){this.stats.score+=this.stats.rings*100+Math.max(0,300-this.stats.time)*10;if(!this.bossPractice&&!this.completedActs.includes(this.act))this.completedActs.push(this.act);this.stats.progress=100;this.mode='won';this.emit()}this.follow(dt);this.effects(dt);return}
 for(const [x,age]of this.springAnimations){if(age+dt>=10)this.springAnimations.delete(x);else this.springAnimations.set(x,age+dt)}
 for(const p of this.platforms){if(p.timer){p.timer+=dt;if(p.timer>220)p.timer=0}}
 const left=this.keys.has('ArrowLeft')||this.keys.has('a'),right=this.keys.has('ArrowRight')||this.keys.has('d'),down=this.keys.has('ArrowDown')||this.keys.has('s'),jump=this.keys.has(' ')||this.keys.has('ArrowUp')||this.keys.has('z')||this.keys.has('w');
 const jumpPressed=jump&&!this.jumpLatch||this.jumpBuffer>0;this.jumpBuffer=0;this.coyote=this.grounded?1:0
 const queuedRevs=this.spinTapQueue,revs=queuedRevs||(jumpPressed?1:0);this.spinTapQueue=0;let dashReleased=false
 if(this.spinDashing&&(!this.grounded||this.loop))this.cancelSpinDash()
 if(this.spinDashing&&down)this.spinCharge=decayDash(this.spinCharge)
 if(this.grounded&&!this.hurtState&&!this.loop&&(this.spinDashing||Math.abs(this.vx)<P.rollStart)&&(down||queuedRevs>0)&&revs>0){
  for(let i=0;i<revs;i++){if(!this.spinDashing){this.spinDashing=true;this.spinCharge=0;this.spinRevs=0;this.dashPhase=0}else this.spinCharge=Math.min(P.dashMax,this.spinCharge+P.dashIncrement);this.spinRevs++;this.animation.rev();this.dashSound(this.spinRevs)}this.ownJump=false;this.emit()
 }
 if(this.spinDashing){
  if(left!==right)this.face=right?1:-1
  this.ownJump=false;this.skidding=false;this.rolling=true;this.ball=true;this.vy=0;this.rollJump=false
  if(down){this.vx=0;this.groundSpeed=0;if(this.frame%7===0)this.dashDust()}
  else{this.vx=this.face*dashSpeed(this.spinCharge);this.groundSpeed=this.vx;this.groundVX=this.vx;this.spinDashing=false;this.spinCharge=0;this.dashFlash=26;dashReleased=true;this.dashSound(this.spinRevs,true);this.dashDust(true);this.emit()}
 }
 if(this.loop)this.handleLoop(dt,jumpPressed)
 else {
 const prevX=this.x,prevY=this.y,wasGrounded=this.grounded,wasAttacking=this.ball||this.rolling;let surfaceAngle=0,jumped=false
 if(this.platform&&wasGrounded){const pos=platformPosition(this.platform,this.clock);this.x+=pos.x-this.platformOldX;this.y+=pos.y-this.platformOldY;this.platformOldX=pos.x;this.platformOldY=pos.y}
 if(this.grounded){
  if(!this.platform&&!inGap(this.x))surfaceAngle=surface(Math.atan2(ground(this.x+3)-ground(this.x-3),6)).angle
  const s=surface(surfaceAngle)
  // Object responses may alter horizontal velocity between movement steps.
  if(this.vx!==this.groundVX)this.groundSpeed=fixed(this.vx/(Math.abs(Math.cos(this.angle))>.01?Math.cos(this.angle):1))
  if(!this.spinDashing&&!dashReleased&&jumpPressed&&!this.hurtState){
   this.vx=fixed(this.groundSpeed*s.cos+P.jumpSpeed*s.sin);this.vy=fixed(this.groundSpeed*s.sin-P.jumpSpeed*s.cos);this.rollJump=this.rolling;this.grounded=false;this.platform=null;this.ball=true;this.ownJump=true;this.rolling=false;this.coyote=0;jumped=true;this.beep(720,.15)
  }else{
   if(!this.spinDashing&&!dashReleased){
    const locked=this.controlLock>0;if(locked)this.controlLock=Math.max(0,this.controlLock-dt)
    this.skidding=!this.rolling&&!locked&&left!==right&&(right?this.groundSpeed< -4:this.groundSpeed>4)
    this.groundSpeed=groundStep(slopeStep(this.groundSpeed,surfaceAngle,this.rolling,dt),left,right,this.rolling,this.shoeTime>0,locked,dt)
    if(!this.rolling&&left!==right&&!locked&&(this.groundSpeed===0||Math.sign(this.groundSpeed)===(right?1:-1)))this.face=right?1:-1
    if(down&&Math.abs(this.groundSpeed)>=P.rollStart)this.rolling=true
    if(this.rolling&&this.groundSpeed===P.rollStop)this.rolling=false
   }
   this.angle=surfaceAngle;this.ball=this.rolling;this.vx=fixed(this.groundSpeed*s.cos);if(this.rolling)this.vx=Math.max(-P.rollingXLimit,Math.min(P.rollingXLimit,this.vx));this.vy=fixed(this.groundSpeed*s.sin);this.groundVX=this.vx
  }
 }else{
  this.skidding=false
  if(!this.hurtState){if(this.ownJump&&!jump&&this.vy< -P.jumpRelease)this.vy=-P.jumpRelease;else if(!this.ownJump&&this.vy< -15.75)this.vy=-15.75;this.vx=airStep(this.vx,this.vy,left,right,this.shoeTime>0,this.rollJump,dt);if(!this.rollJump&&left!==right)this.face=right?1:-1}
  const turn=2*Math.PI/128*dt;this.angle=Math.abs(this.angle)<=turn?0:this.angle-Math.sign(this.angle)*turn
 }
 // Classic jump and spin-dash release frames do not advance position.
 if(!jumped&&!this.spinDashing&&!dashReleased){this.x=Math.max(18,this.x+this.vx*dt);this.y+=this.vy*dt;if(!this.grounded)this.vy+=(this.hurtState?P.hurtGravity:jumpGravity(this.vy,this.ownJump,this.jumpFeel))*dt}
 const reach=wasGrounded&&!jumped?25:5;const floor=this.floorAt(this.x,prevY,reach)
 // Ground is solid at the side of a high bank, unlike one-way ledges.
 if(!inGap(this.x)&&ground(this.x)<prevY-27&&wasGrounded&&!jumped){this.x=prevX;this.vx=0;this.groundSpeed=0}
 const terrainCross=!inGap(this.x)&&!inGap(prevX)&&prevY<=ground(prevX)+reach&&this.y>=ground(this.x)&&this.vy-this.vx*(ground(this.x+3)-ground(this.x-3))/6>=0
 if(!jumped&&(this.grounded||this.vy>=0||terrainCross)&&(this.y>=floor.y||(wasGrounded&&Math.abs(floor.y-prevY)<=25))&&(prevY<=floor.y+reach||terrainCross)){
  const landed=!this.grounded,impactY=this.vy;this.y=floor.y;this.grounded=true;this.platform=floor.platform
  const angle=this.platform||inGap(this.x)?0:surface(Math.atan2(ground(this.x+3)-ground(this.x-3),6)).angle
  if(landed){if(this.hurtState)this.invincible=120;this.groundSpeed=this.hurtState?0:landingSpeed(this.vx,impactY,angle);this.rollJump=false;this.hurtState=false;this.ownJump=false;this.rolling=false;this.angle=angle;const s=surface(angle);this.vx=fixed(this.groundSpeed*s.cos);this.groundVX=this.vx}
  this.vy=0;if(this.platform){const pos=platformPosition(this.platform,this.clock);this.platformOldX=pos.x;this.platformOldY=pos.y;if(this.platform.kind==='crumble'&&!this.platform.timer)this.platform.timer=1}this.ball=this.rolling
  if(!this.platform&&!this.spinDashing&&!dashReleased&&!this.controlLock&&Math.abs(angle)>=Math.PI/4&&Math.abs(this.groundSpeed)<P.slipSpeed){this.grounded=false;this.groundSpeed=0;this.controlLock=P.controlLock;const s=surface(angle);this.vy=fixed(this.vx*s.sin/(s.cos||1))}
 }else if(this.grounded){this.grounded=false;this.platform=null;this.ownJump=false;this.rollJump=false}
 const bodyHeight=this.ball||this.rolling?29:36;
 for(const p of this.platforms){if(!p.h||this.x<p.x-11||this.x>p.x+p.w+11)continue;const bottom=p.y+p.h;
 if(this.vy<0&&prevY-bodyHeight>=bottom-1&&this.y-bodyHeight<bottom){this.y=bottom+bodyHeight;this.vy=.2;this.grounded=false;this.beep(150,.05,'triangle',.015)}
 else if(this.y>p.y+5&&this.y-bodyHeight<bottom-2){if(prevX<=p.x-10){this.x=p.x-12;this.vx=0}else if(prevX>=p.x+p.w+10){this.x=p.x+p.w+12;this.vx=0}}
 }
 for(let i=0;i<loopDefs.length;i++){const l=loopDefs[i];if(this.loopCooldown===0&&this.grounded&&Math.abs(this.y-l.base)<12&&((prevX<l.x&&this.x>=l.x&&this.vx>0)||(prevX>l.x&&this.x<=l.x&&this.vx<0))){this.loop={index:i,theta:0,speed:this.groundSpeed,direction:Math.sign(this.vx)};this.platform=null;this.popup('KEEP YOUR MOMENTUM',l.x,l.base-l.r*2-25);break}}
 for(const r of this.rocks){if(r.broken||Math.abs(this.x-r.x)>(this.level.theme==='marble'?25:33)||this.y<r.y-32||this.y>r.y+8)continue;if(((this.rolling||this.ball||wasAttacking)&&Math.abs(this.vx)>2.5)||this.starTime>0){r.broken=true;this.stats.score+=50;this.burst(r.x,r.y-23,'smoke');this.popup('50',r.x,r.y-50);this.shake=5;this.beep(140,.14)}else {this.x=prevX;this.vx=0}}
 }
 this.jumpLatch=jump
 // Rings are placed to teach jumps and lead toward optional routes.
 for(const r of this.rings)if(!r.taken&&Math.abs(r.x-this.x)<19&&Math.abs(r.y-(this.y-18))<25){r.taken=true;this.addRings(1);this.burst(r.x,r.y)}
 for(const m of this.monitors){if(m.broken||Math.abs(this.x-m.x)>25||this.y<m.y-40||this.y>m.y+4)continue;if(this.ball||this.starTime>0){this.smashMonitor(m)}else if(this.vy>=0&&this.y<=m.y-18){this.y=m.y-31;this.vy=0;this.grounded=true}else{this.x=m.x+(this.x<m.x?-30:30);this.vx=0}}
 for(const s of springDefs){if(this.springAnimations.has(s.x)||Math.abs(this.x-s.x)>(s.dir==='up'?25:17)||this.y<(s.dir==='up'?s.y-16:s.y-32)||this.y>s.y+7||this.vy<0)continue;this.springAnimations.set(s.x,0);this.cancelSpinDash();this.platform=null;this.rollJump=false;this.hurtState=false;this.ownJump=false;if(s.dir==='up'){this.grounded=false;this.rolling=false;this.ball=false;this.y=s.y-16;this.vy=-P.redSpring;this.animation.spring()}else{this.y=s.y;this.vx=P.redSpring;this.groundSpeed=P.redSpring;this.groundVX=P.redSpring;this.vy=0;this.angle=0;this.grounded=true;this.controlLock=P.springLock}this.beep(1100,.23,'triangle');this.popup('BOING!',s.x,s.y-50)}
 for(const s of spikeDefs){const sy=ground(s.x+s.w/2);if(this.x>s.x-7&&this.x<s.x+s.w+7&&this.y>sy-22&&this.y<sy+15)this.hurt(s.x+s.w/2)}
 if(this.level.theme==='marble')updateCaveHazards(this,dt)
 if(!this.activeArena)this.updateEnemies(dt)
 this.updateBoss(dt);this.updateCaveBoss(dt)
 for(const cp of checkpoints)if(this.checkpoint<cp&&this.x>=cp&&this.x<cp+90){this.checkpoint=cp;this.stats.score+=100;this.popup('CHECKPOINT',cp,ground(cp)-80);this.beep(1600,.25,'triangle');if(this.specialAvailable&&this.stats.rings>=50){this.specialPortal={x:cp+75,y:ground(cp+75)-96,life:720};this.popup('JUMP INTO THE STAR RING!',cp+75,ground(cp+75)-145)}}
 if(this.specialPortal){this.specialPortal.life-=dt;if(this.specialPortal.life<=0)this.specialPortal=null;else if(Math.abs(this.x-this.specialPortal.x)<31&&Math.abs(this.y-18-this.specialPortal.y)<35&&this.deathTimer===0){this.specialPortal=null;this.onSpecialRequest?.()}}
 if(this.y>990)this.die();if(this.clock>=600)this.die();if(!this.boss&&!this.caveBoss&&this.x>=LEVEL_END&&this.deathTimer===0){this.cancelSpinDash();this.clearTimer=1;this.vx=4;this.beep(1760,.4,'triangle');this.popup('SONIC GOT THROUGH!',this.x-50,this.y-110)}
 this.follow(dt);this.effects(dt);this.stats.progress=Math.min(100,Math.floor(this.x/LEVEL_END*100));this.stats.section=sections.filter(s=>s.x<=this.x).at(-1)?.name||'PALM MEADOW';this.stats.speed=Math.abs(this.loop?.speed??(this.grounded?this.groundSpeed:this.vx));this.stats.power=this.starTime?'INVINCIBLE':this.shoeTime?'SPEED SHOES':this.shield?'SHIELD':'';if(this.boss?.active){this.stats.section=this.boss.hp>0?'EGGMAN - WRECKING BALL':this.boss.phase==='escaped'?'FREE THE ANIMALS':'EGGMAN IS RETREATING';this.stats.progress=Math.min(99,88+Math.floor((8-this.boss.hp)/8*11))}if(this.caveBoss?.active){this.stats.section=this.caveBoss.cue;this.stats.progress=95+Math.floor((6-this.caveBoss.hp)/6*4)}if(this.frame%8===0)this.emit()
 }
 updateBoss(dt:number){
  const b=this.boss;if(!b||this.deathTimer)return;const a=b.arena
  if(!b.active){if(this.x<a.left+18)return;b.enter();this.checkpoint=a.left+32;this.specialPortal=null;this.bullets=[];this.vx=Math.max(-2,Math.min(2,this.vx));this.intro=0;this.popup('EGGMAN!',a.center,a.floor-245);this.musicNext=0;this.musicStep=0;this.emit()}
  b.step(dt);if(this.x<a.left+18){this.x=a.left+18;this.vx=Math.max(0,this.vx)}if(this.x>a.right-18){this.x=a.right-18;this.vx=Math.min(0,this.vx)}
  if(b.dangerous){const ball=b.ball;if(Math.hypot(this.x-ball.x,this.y-18-ball.y)<39)this.hurt(ball.x)
   if(Math.abs(this.x-b.x)<41&&Math.abs(this.y-18-b.y)<35){if(this.ball||this.rolling||this.starTime>0){if(b.hit()){this.stats.score+=100;this.shake=6;this.burst(b.x,b.y);this.beep(165,.12,'sawtooth',.05);this.note(880,.08,'square',.025);if(b.hp===0){this.stats.score+=1000;this.popup('EGG MOBILE DEFEATED!',a.center,a.floor-255);[523.25,659.25,783.99,1046.5].forEach((f,i)=>this.note(f,.3,'triangle',.05,this.audio?this.audio.currentTime+i*.1:undefined))}this.emit()}this.vy=-6.8;this.grounded=false;this.platform=null;this.ball=true;this.rolling=false;this.ownJump=false}else this.hurt(b.x)}
  }
  if(b.phase==='defeated'&&Math.floor(b.time/12)!==Math.floor((b.time-dt)/12)){const t=b.time;this.burst(b.x+Math.sin(t*1.7)*39,b.y+Math.cos(t)*24,'smoke');this.beep(70+t%95,.08,'sawtooth',.02)}
  if(b.phase==='escaped'&&!this.capsuleSpawned){this.capsuleSpawned=true;this.platforms.push({x:a.center-35,y:a.floor-68,w:70,h:68,kind:'capsule'});this.popup('FREE THE ANIMALS!',a.center,a.floor-100)}
  if(this.capsuleSpawned&&!b.capsuleReleased&&this.grounded&&this.platform?.kind==='capsule'&&Math.abs(this.x-a.center)<25){this.cancelSpinDash();b.capsuleReleased=true;this.platform=null;this.platforms=this.platforms.filter(p=>p.kind!=='capsule');for(let i=0;i<16;i++)this.particles.push({x:a.center+(i%5-2)*7,y:a.floor-28,vx:(i%2?-1:1)*(1.2+i%4*.45),vy:-3-i%4*.55,life:400,age:0,kind:'animal'});this.clearTimer=1;this.vx=0;this.beep(1760,.35,'triangle');this.emit()}
 }
 updateCaveBoss(dt:number){
  const b=this.caveBoss;if(!b||this.deathTimer)return;const a=b.arena
  if(!b.active){if(this.x<a.left+18)return;this.cancelSpinDash();b.enter();this.checkpoint=this.level.checkpoints.at(-1)!;this.specialPortal=null;this.bullets=[];this.intro=0;this.vx=Math.max(-8,Math.min(8,this.vx));this.popup('CRYSTAL WARDEN',a.center,a.floor-165);this.musicStep=0;this.musicNext=0;this.beep(150,.3,'triangle',.055);this.emit()}
  const previous=b.phase;b.step(dt,this.x)
  if(this.x<a.left+18){this.x=a.left+18;this.vx=Math.max(0,this.vx)}if(this.x>a.right-18){this.x=a.right-18;this.vx=Math.min(0,this.vx)}
  if(previous!==b.phase){if(b.phase==='lock')this.beep(240,.16,'triangle',.04);if(b.phase==='steam-warning'){this.beep(400,.13,'triangle',.035);this.note(520,.13,'triangle',.035,this.audio?this.audio.currentTime+.17:undefined)}if(b.phase==='steam')this.beep(115,.32,'sawtooth',.035);if(b.phase==='open')[440,660,880].forEach((f,i)=>this.note(f,.16,'triangle',.035,this.audio?this.audio.currentTime+i*.09:undefined));this.emit()}
  if(b.phase==='fall')for(const d of b.drops){if(d.landed)continue;const floor=this.level.ground(d.x);if(d.y>=floor){d.y=floor;d.landed=true;this.burst(d.x,d.y-5,'smoke');this.shake=Math.max(this.shake,3);this.beep(100,.08,'triangle',.025)}else if(Math.abs(this.x-d.x)<23&&this.y>d.y-37&&this.y-32<d.y+5)this.hurt(d.x)}
  if(b.phase==='steam')for(const v of b.vents){const y=this.level.ground(v.x);if(v.selected&&Math.abs(this.x-v.x)<25&&this.y>y-96&&this.y-30<y+5)this.hurt(v.x)}
  if(b.dangerous&&Math.abs(this.x-b.x)<54&&this.y>a.floor-97&&this.y-30<a.floor-2){
   if(b.hit(this.vx,this.ball||this.rolling||this.starTime>0)){this.stats.score+=200;this.vx*=.88;this.shake=7;this.burst(b.x,b.y);this.beep(155,.13,'sawtooth',.04);this.note(900,.13,'triangle',.04);this.popup(b.hp===0?'SENTINEL SHATTERED!':'CORE CRACKED!',b.x,b.y-110);if(b.hp===0){this.stats.score+=2000;[523.25,659.25,783.99,1046.5].forEach((f,i)=>this.note(f,.35,'triangle',.05,this.audio?this.audio.currentTime+i*.12:undefined))}this.emit()}
   else if(b.touchCooldown<=0){if(b.vulnerable)this.popup('ROLL FASTER - USE A BANK!',b.x,b.y-110);this.hurt(b.x);b.touchCooldown=45}
  }
  if(b.phase==='defeated'&&Math.floor(b.time/12)!==Math.floor((b.time-dt)/12)){this.burst(b.x+Math.sin(b.time*1.7)*53,b.y-30+Math.cos(b.time)*38,'smoke');this.beep(80+b.time%70,.08,'sawtooth',.02)}
  if(b.phase==='cleared'&&!this.clearTimer){this.cancelSpinDash();this.clearTimer=1;this.vx=0;for(let i=0;i<16;i++)this.particles.push({x:b.x+(i%5-2)*9,y:a.floor-35,vx:(i%2?-1:1)*(1.4+i%4*.45),vy:-3-i%4*.5,life:360,age:0,kind:'animal'});this.popup('MARBLE ZONE RESTORED',b.x,a.floor-150);this.emit()}
 }
 updateEnemies(dt:number){const {ground}=this.level;for(const e of this.enemies){if(!e.alive||Math.abs(e.base-this.x)>750)continue;const time=this.clock+e.phase;e.cooldown-=dt
 if(e.kind==='crab'){e.x=e.base+Math.sin(time)*24;e.y=ground(e.x)}if(e.kind==='bug'){e.x=e.base+Math.sin(time*.85)*66;e.y=ground(e.x)}if(e.kind==='bee'){e.x=e.base+Math.sin(time*.8)*58;e.y=e.baseY+Math.sin(time*2)*12;if(this.level.theme!=='marble'&&e.cooldown<=0&&Math.abs(e.x-this.x)<340){const dir=this.x<e.x?-1:1;this.bullets.push({x:e.x,y:e.y-10,vx:dir*2.6,vy:1.3,life:150});e.cooldown=160}}
 if(e.kind==='fish'){const t=(time%2.9)/2.9;e.x=e.base;e.y=815-Math.sin(t*Math.PI)*300}
 if(Math.abs(this.x-e.x)<(e.kind==='fish'?20:27)&&Math.abs((this.y-17)-(e.y-15))<26){if((this.ball&&!(this.level.theme==='marble'&&e.kind==='fish'))||this.starTime>0){e.alive=false;this.stats.score+=100;this.popup('100',e.x,e.y-35);this.burst(e.x,e.y-18,'smoke');this.particles.push({x:e.x,y:e.y-12,vx:1.2,vy:-3,life:180,age:0,kind:'animal'});if(!this.grounded&&this.starTime===0)this.vy=-6;this.beep(240,.1,'triangle')}else this.hurt(e.x)}}
 for(const b of this.bullets){b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;if(Math.abs(b.x-this.x)<16&&Math.abs(b.y-(this.y-18))<21){b.life=0;if(this.ball){this.burst(b.x,b.y)}else this.hurt(b.x)}}this.bullets=this.bullets.filter(b=>b.life>0)}
 effects(dt:number){const {ground,inGap}=this.level;for(const p of this.particles){p.age+=dt;p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.kind==='ring'||p.kind==='animal'){p.vy+=.2*dt;const f=inGap(p.x)?Infinity:ground(p.x);if(p.y>f-5&&p.vy>0){p.y=f-5;p.vy=-p.vy*.62;if(p.kind==='animal')p.vy=-3.5}if(p.kind==='ring'&&p.age>45&&Math.abs(p.x-this.x)<20&&Math.abs(p.y-this.y+18)<24&&this.deathTimer===0){this.addRings(1);p.life=0}}else p.vy+=(p.kind==='dust'?.012:.06)*dt}this.particles=this.particles.filter(p=>p.life>0);for(const p of this.popups){p.y-=.35*dt;p.life-=dt}this.popups=this.popups.filter(p=>p.life>0)}
 follow(dt:number){if(this.activeArena){const arena=this.activeArena;this.camera+=(arena.center-this.viewW/2-this.camera)*Math.min(1,.09*dt);this.cameraY+=(arena.floor-this.viewH*.82-this.cameraY)*Math.min(1,.09*dt);return}const {end:LEVEL_END}=this.level;const targetX=Math.max(0,Math.min(LEVEL_END-this.viewW+250,this.x-this.viewW*.37+Math.max(-40,Math.min(55,this.vx*5))));this.camera+=(targetX-this.camera)*Math.min(1,.13*dt);const desired=this.y-this.viewH*.73;const targetY=Math.max(-512,Math.min(480,desired));const distance=targetY-this.cameraY;const holdJumpCamera=!this.grounded&&this.ownJump&&this.y>=this.cameraY+64&&this.y<=this.cameraY+this.viewH-48;if(holdJumpCamera)return;if(this.grounded||this.loop)this.cameraY+=Math.max(-16,Math.min(16,distance))*dt;else if(Math.abs(distance)>64)this.cameraY+=Math.max(-16,Math.min(16,distance-Math.sign(distance)*64))*dt}
 tick(t:number){if(this.disposed)return;if(this.renderSuspended){this.last=t;this.accumulator=0;this.raf=requestAnimationFrame(this.tick);return}const step=1000/P.fps,ms=this.last?Math.min(70,t-this.last):step;this.last=t;this.accumulator+=ms;while(this.accumulator>=step){if(this.mode==='playing')this.frame++;this.update(1);this.accumulator-=step}this.music();drawGame(this);this.raf=requestAnimationFrame(this.tick)}
 destroy(){this.disposed=true;cancelAnimationFrame(this.raf);void this.audio?.close()}
}
