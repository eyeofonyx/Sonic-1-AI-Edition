import { SonicAnimation } from './sonic-animation'
import { platformPosition, platformTop } from './level'
import type { OriginalSonicGame } from './original-game'
import type { CharacterAbility } from './characters'

type Trail={x:number;y:number;vx:number;vy:number;face:number;angle:number;grounded:boolean;ball:boolean;rolling:boolean;charging:boolean;jump:boolean;behind:boolean;front:boolean;path:number}
export type PartnerState='following'|'flying'|'hurt'|'returning'
/** One lightweight local NPC. No second world, camera, life bank, audio context or game loop. */
export class TailsCompanion {
 readonly character='tails' as const
 readonly animation=new SonicAnimation()
 readonly zoneState={drowning:false,sliding:false}
 x=0;y=0;vx=0;vy=0;face=1;angle=0;grounded=false;ball=false;rolling=false;spinDashing=false
 underwater=false;deathTimer=0;visible=false;behind=false;front=false;state:PartnerState='following'
 air=1800;invincible=0;wait=0;stuck=0;jumpCooldown=0;flightTicks=0
 private initialized=false
 private trail:Trail[]=[]
 private platform:OriginalSonicGame['platform']=null
 private platformX=0;private platformY=0
 private jumpHold=0
 private jumpAttack=false
 private g:OriginalSonicGame
 constructor(g:OriginalSonicGame){this.g=g}
 get hurtState(){return this.state==='hurt'}
 get groundSpeed(){return this.vx}
 get characterAbility():CharacterAbility{return this.state==='flying'?'flight':'normal'}
 get status(){return this.state==='returning'?'Tails is flying back.':this.state==='flying'?'Tails is catching up.':this.state==='hurt'?'Tails is recovering.':'Tails is following Sonic.'}
 reset(){this.initialized=false;this.visible=false;this.state='following';this.vx=this.vy=0;this.trail=[];this.wait=0;this.stuck=0;this.jumpAttack=false;this.air=1800;this.invincible=0;this.flightTicks=0;this.platform=null;this.animation.reset()}
 private clear(x:number,y:number,height=32){for(const dx of[-7,0,7])for(let h=dx?8:1;h<height;h++)if(this.g.world.solid(x+dx,y-h,true))return false;return true}
 private returnLater(){this.visible=false;this.state='returning';this.wait=60;this.vx=this.vy=0;this.platform=null;this.stuck=0;this.flightTicks=0}
 private spawn(t:Trail,first=false){
  const g=this.g,side=t.face||1
  for(const dx of[-32,-16,0,16]){const x=Math.max(12,Math.min(g.world.width-12,t.x+dx*side)),f=g.floorAt(x,t.y-24,8)
   if(Math.abs(f.y-t.y)<32&&this.clear(x,f.y)){this.x=x;this.y=f.y;this.grounded=true;this.platform=f.platform;this.vx=this.vy=0;this.state='following';this.face=side;this.angle=0;this.ball=this.rolling=false;this.jumpAttack=false;this.visible=true;this.air=1800;this.invincible=first?0:90;this.behind=t.behind;this.front=t.front;this.initialized=true;if(this.platform){const p=platformPosition(this.platform,g.clock);this.platformX=p.x;this.platformY=p.y}return true}
  }
  const height=t.ball?24:32
  if(this.clear(t.x,t.y,height)){this.x=t.x;this.y=t.y;this.vx=t.vx;this.vy=t.vy;this.angle=t.angle;this.face=side;this.grounded=t.grounded;this.ball=t.ball;this.jumpAttack=t.ball&&!t.grounded;this.rolling=t.rolling;this.state='following';this.visible=true;this.air=1800;this.invincible=first?0:90;this.initialized=true;this.behind=t.behind;this.front=t.front;return true}
  if(!first)this.wait=15
  return false
 }
 private jump(){this.grounded=false;this.platform=null;this.ball=true;this.jumpAttack=true;this.rolling=this.spinDashing=false;this.vy=this.underwater?-3.5:-6.5;this.jumpHold=22;this.jumpCooldown=28}
 private hurt(sourceX:number){if(this.invincible||!this.visible)return;this.state='hurt';this.vx=this.x<sourceX?-3:3;this.vy=this.underwater?-2:-4;this.grounded=false;this.platform=null;this.ball=this.rolling=this.spinDashing=this.jumpAttack=false;this.invincible=120}
 step(dt:number){
  const g=this.g
  if(!g.duoMode||g.character!=='sonic'){if(this.initialized||this.visible||this.trail.length)this.reset();return}
  if(g.mode!=='playing'||g.renderSuspended||g.focusSuspended)return
  if(g.deathTimer||g.giantTaken||g.finaleState.ending||g.finaleState.tube||g.finaleState.trap){this.reset();return}
  const w=g.world as typeof g.world&{path?:number},now:Trail={x:g.x,y:g.y,vx:g.vx,vy:g.vy,face:g.face,angle:g.angle,grounded:g.grounded,ball:g.ball,rolling:g.rolling,charging:g.spinDashing,jump:[' ','w','z'].some(k=>g.keys.has(k)),behind:w.behindLoop,front:w.frontPlane,path:w.path??0}
  this.trail.push(now);if(this.trail.length>32)this.trail.shift()
  const t=this.trail[Math.max(0,this.trail.length-13)]
  if(!this.initialized){if(!this.spawn(now,true))this.returnLater();return}
  if(this.state==='returning'){
   this.wait=Math.max(0,this.wait-dt)
   if(!this.wait&&this.spawn(t)){
    // Rejoin through clear air if there is room; never fly through a ceiling.
    if(Array.from({length:40},(_,n)=>n+1).every(h=>this.clear(this.x,this.y-h))&&!t.ball){this.y-=40;this.grounded=false;this.platform=null;this.state='flying';this.flightTicks=180;this.vy=.5}
   }
   return
  }
  this.invincible=Math.max(0,this.invincible-dt);this.jumpCooldown=Math.max(0,this.jumpCooldown-dt);this.jumpHold=Math.max(0,this.jumpHold-dt)
  this.underwater=this.y-15>g.waterLevel
  this.air=this.underwater?Math.max(0,this.air-dt):1800
  if(!this.air||Math.abs(g.x-this.x)>480||Math.abs(g.y-this.y)>300||this.y>w.height+40||this.y<0){this.returnLater();return}
  const previousX=this.x,previousY=this.y,wasGrounded=this.grounded
  this.behind=t.behind;this.front=t.front
  // Sonic has already traversed these exact native loop/plane-switch surfaces.
  // Replay that short, bounded route instead of changing the player's collision plane.
  if(this.state!=='hurt'&&t.grounded&&(Math.abs(t.angle)>.35||(w.path??0)!==t.path)&&Math.hypot(t.x-this.x,t.y-this.y)<100){
   const d=Math.hypot(t.x-this.x,t.y-this.y),k=Math.min(1,12*dt/Math.max(1,d));this.x+=(t.x-this.x)*k;this.y+=(t.y-this.y)*k;this.vx=t.vx;this.vy=0;this.face=t.face;this.angle=t.angle;this.grounded=true;this.ball=t.ball;this.spinDashing=t.charging;this.rolling=t.rolling;this.jumpAttack=false;this.platform=null
  }else{
   if(this.platform&&this.grounded){if(this.platform.inactive||(this.platform.timer||0)>40){this.platform=null;this.grounded=false}else{const p=platformPosition(this.platform,g.clock);this.x+=p.x-this.platformX;this.y+=p.y-this.platformY;this.platformX=p.x;this.platformY=p.y}}
   const target=t.x-t.face*24,dx=target-this.x,dir=Math.abs(dx)>10?Math.sign(dx):0
   if(this.state!=='hurt'){
    if(dir)this.face=dir
    const cap=this.underwater?3:Math.abs(dx)>90?9:6,targetVX=dir*cap
    this.vx+=Math.max(-.3*dt,Math.min(.3*dt,targetVX-this.vx))
    const releasedDash=this.spinDashing&&!t.charging
    this.spinDashing=this.grounded&&t.charging&&Math.abs(dx)<64
    if(releasedDash&&this.grounded)this.vx=t.vx||this.face*8
    if(this.spinDashing)this.vx=0
    this.rolling=this.grounded&&(t.rolling||t.charging)&&Math.abs(dx)<160;this.ball=this.rolling||this.spinDashing||!this.grounded&&this.jumpAttack&&this.state!=='flying'
    if(this.grounded&&!this.spinDashing&&!this.jumpCooldown){const ahead=this.x+this.face*22,f=g.floorAt(ahead,this.y-12,8),wall=[10,24].some(h=>w.solid(ahead,this.y-h,true)),gap=f.y>this.y+40
     const enemy=g.enemies.some(e=>e.alive&&e.originalId!==0x50&&e.originalId!==0x60&&Math.abs(e.x-this.x)<52&&Math.abs(e.y-16-(this.y-15))<100),boss=g.boss,bossNear=!!boss?.dangerous&&['wrecking','fire','pinch','drill'].includes(boss.arena.kind||'wrecking')&&Math.abs(boss.x-this.x)<62&&this.y-boss.y>25&&this.y-boss.y<150
     if(!t.grounded&&t.ball&&t.vy<0||Math.abs(dx)>20&&(wall||gap||t.y<this.y-32)||enemy||bossNear)this.jump()
    }
    if(this.state==='flying'){this.flightTicks-=dt;this.ball=false;this.vy=Math.max(-1.5,Math.min(1.5,(t.y-this.y)*.045));if(this.flightTicks<=0){this.returnLater();return}}
    else if(!this.grounded){if(!this.jumpHold&&!t.jump&&this.vy< -4)this.vy=-4;this.vy+=dt*(this.underwater?16/256:56/256)}
   }else if(!this.grounded)this.vy+=dt*(this.underwater?16/256:48/256)
   if(this.grounded){this.angle=Math.abs(this.angle)<1.3?this.angle:0;this.x+=this.vx*Math.cos(this.angle)*dt;this.y+=this.vx*Math.sin(this.angle)*dt}else{this.x+=this.vx*dt;this.y+=this.vy*dt;this.angle=0}
   this.x=Math.max(11,Math.min(w.width-11,this.x))
   const height=this.ball?24:32,move=this.x-previousX
   if(move&&Math.abs(this.angle)<.35){const side=Math.sign(move);for(let n=1;n<=Math.ceil(Math.abs(move));n++){const x=previousX+side*(n+9);if([7,height-6].some(h=>w.solid(x,this.y-h,true))){this.x=x-side*10;this.vx=0;break}}}
   if(!this.grounded&&this.vy<0)for(let y=Math.floor(previousY-height);y>=Math.floor(this.y-height);y--)if(w.solid(this.x-7,y,true)||w.solid(this.x+7,y,true)){this.y=y+height+1;this.vy=0;break}
   const f=g.floorAt(this.x,previousY,wasGrounded?24:8),terrain=wasGrounded&&!this.platform?w.snap(this.x,this.y,this.angle,20):null
   let floor=terrain?.y??f.y
   if(f.platform?.kind==='capsule')floor=Infinity // Only the player presses the exit button.
   if(this.vy>=0&&(wasGrounded&&Math.abs(this.y-floor)<=24||this.y>=floor&&previousY<=floor+8)){
    this.y=floor;this.grounded=true;this.vy=0;this.state='following';this.flightTicks=0;this.platform=terrain?null:f.platform;this.angle=terrain?.angle??(this.platform?.profile?Math.atan2(platformTop(this.platform,this.x+2,g.clock)-platformTop(this.platform,this.x-2,g.clock),4):0)
    this.ball=this.rolling||this.spinDashing;this.jumpAttack=false
    if(this.platform){const p=platformPosition(this.platform,g.clock);this.platformX=p.x;this.platformY=p.y}
   }else{if(wasGrounded&&this.ball)this.jumpAttack=true;this.grounded=false;this.platform=null}
   // Solid object sides/undersides; partner never pushes, triggers, or breaks machinery.
   for(const p of g.platforms){if(!p.h||p.inactive||p.kind==='capsule'||(p.timer||0)>40)continue;const pos=platformPosition(p,g.clock),top=platformTop(p,this.x,g.clock),bottom=pos.y+p.h
    if(this.x<pos.x-9||this.x>pos.x+p.w+9||this.y<=top+2||this.y-height>=bottom-1)continue
    if(previousY-height>=bottom-2&&this.vy<0){this.y=bottom+height;this.vy=0}
    else if(previousX<=pos.x-8||previousX>=pos.x+p.w+8){this.x=previousX<pos.x?pos.x-10:pos.x+p.w+10;this.vx=0}
    else if(p.originalId===0x84||this.grounded&&w.solid(this.x,this.y-height,true)){this.returnLater();return}
   }
  }
  this.stuck=Math.abs(g.x-this.x)>100&&Math.abs(this.x-previousX)<.2?this.stuck+dt:0
  if(this.stuck>100||Math.abs(this.angle)<.35&&w.solid(this.x,this.y-16,true)&&w.solid(this.x,this.y-4,true)){this.returnLater();return}
  this.animation.step({speed:this.vx,angle:this.angle,face:this.face,grounded:this.grounded,ball:this.ball,rolling:this.rolling,skidding:false,crouching:false,hurt:this.hurtState,dead:false,charging:this.spinDashing})
  if(!g.clearTimer&&!g.goalTime)this.contacts()
 }
 private contacts(){
  const g=this.g,w=g.world
  // Shared rewards are awarded through the existing once-only player bank.
  for(const r of g.rings)if(!r.taken&&Math.abs(this.x-r.x)<16&&Math.abs(this.y-15-r.y)<20){r.taken=true;g.addRings(1);g.burst(r.x,r.y)}
  for(const e of g.enemies){if(!e.alive||Math.abs(this.x-e.x)>22||Math.abs(this.y-15-(e.y-16))>24)continue
   if(this.ball&&this.state!=='hurt'&&!(e.originalId===0x50&&this.y-15<e.y-12)&&!(e.originalId===0x60&&(e.shots||0)<4)){e.alive=false;g.addScore(100);g.burst(e.x,e.y-16,'smoke');g.particles.push({x:e.x,y:e.y-16,vx:1.2,vy:-3,life:180,age:0,kind:'animal'});g.sfx('destroy');if(!this.grounded){this.vy=-6;this.jumpAttack=true}}else this.hurt(e.x)
  }
  for(const m of g.monitors)if(!m.broken&&this.ball&&Math.abs(this.x-m.x)<22&&Math.abs(this.y-15-(m.y-16))<25){const playerVY=g.vy;g.smashMonitor(m);g.vy=playerVY;this.vy=-6;this.jumpAttack=true;this.grounded=false}
  if(w.lava(this.x,this.y-3)||w.lava(this.x,this.y-20))this.hurt(this.x+this.face)
  for(const b of g.bullets)if(Math.abs(b.x-this.x)<14&&Math.abs(b.y-this.y+15)<18)this.hurt(b.x)
  for(const f of g.fires)if(Math.abs(f.x-this.x)<18&&Math.abs(f.y-this.y+15)<22)this.hurt(f.x)
  for(const[x,y,id,sub]of w.map.objects)if((id===0x36||id===0x136)&&Math.abs(x-this.x)<((sub>>4&3)+1)*8+12&&Math.abs(y-this.y+15)<25)this.hurt(x)
  const b=g.boss
  if(!b?.dangerous)return
  const kind=b.arena.kind
  if(kind==='drill'){const x=b.x+((g as OriginalSonicGame&{drillFacing?:number}).drillFacing??-1)*54;if(Math.abs(this.x-x)<27&&Math.abs(this.y-15-b.y-8)<22)this.hurt(x)}
  if((kind==='wrecking'||!kind)&&Math.hypot(this.x-b.ball.x,this.y-15-b.ball.y)<35)this.hurt(b.ball.x)
  // Native seesaw and cylinder fights keep their special player-only hit rules.
  if(kind==='seesaw'||kind==='final')return
  const by=kind==='drill'?b.y-8:b.y
  if(Math.abs(this.x-b.x)<35&&Math.abs(this.y-15-by)<31){
   if(this.ball&&!this.hurtState){if(b.hit()){if(kind==='drill')b.hitTime=32;g.addScore(b.hp?100:1100);g.burst(b.x,by);g.sfx('boss-hit');g.emit()}this.vy=-6.5;this.grounded=false;this.platform=null;this.ball=true;this.jumpAttack=true;this.rolling=false}else this.hurt(b.x)
  }
 }
}
