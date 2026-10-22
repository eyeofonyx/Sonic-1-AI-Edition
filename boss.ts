import type { BossArena } from './acts'
export type BossPhase='waiting'|'intro'|'fight'|'defeated'|'escape'|'escaped'
/** All timings are fixed game frames, just like the platform physics. */
export class WreckingBoss {
 arena:BossArena;phase:BossPhase='waiting';hp=8;x:number;y:number;time=0;fightTime=0;hitTime=0;angle=0;dropX=0;dropY=0;dropV=0;capsuleReleased=false
 constructor(arena:BossArena){this.arena=arena;this.x=arena.right+90;this.y=arena.floor-(arena.original?128:190)}
 get active(){return this.phase!=='waiting'}
 get dangerous(){return this.phase==='fight'}
 get chainLength(){const length=this.arena.original?96:122;return this.phase==='intro'?length*Math.min(1,this.time/110):length}
 get ball(){if(this.phase==='defeated'||this.phase==='escape'||this.phase==='escaped')return {x:this.dropX,y:this.dropY};return {x:this.x+Math.sin(this.angle)*this.chainLength,y:this.y+26+Math.cos(this.angle)*this.chainLength}}
 enter(){this.phase='intro';this.hp=8;this.time=0;this.fightTime=0;this.hitTime=0;this.angle=0;this.x=this.arena.right+90;this.y=this.arena.floor-(this.arena.original?128:190);this.capsuleReleased=false}
 step(dt:number){if(!this.active)return;this.time+=dt;this.hitTime=Math.max(0,this.hitTime-dt)
  if(this.phase==='intro'){const t=Math.min(1,this.time/120),ease=t*t*(3-2*t);this.x=this.arena.right+90+(this.arena.center-this.arena.right-90)*ease;if(t===1){this.phase='fight';this.time=0;this.fightTime=0}}
  else if(this.phase==='fight'){this.fightTime+=dt/60;const cycle=this.fightTime*60%240;if(this.arena.kind==='chase'){this.x=this.arena.left+80+Math.min(440,(this.arena.floor-this.y)*.32);this.y=Math.max((this.arena.top||192)+64,this.y-1.1*dt)}else if(this.arena.kind==='pinch'){this.x+=((this.dropX||this.arena.center)-this.x)*Math.min(1,.06*dt);const dive=cycle<90?0:cycle<140?(cycle-90)/50:cycle<190?1:Math.max(0,1-(cycle-190)/50);this.y=this.arena.floor-128+dive*76;this.angle=0}else if(this.arena.kind==='seesaw'){this.x+=((this.dropX||this.arena.center)-this.x)*Math.min(1,.08*dt);this.y=this.arena.floor-128+Math.sin(this.fightTime*2)*4;this.angle=0}else{this.x=this.arena.center+Math.sin(this.fightTime*.75)*90;this.y=this.arena.floor-(this.arena.original?128:190)+Math.sin(this.fightTime*1.1)*7;this.angle=Math.sin(this.fightTime*1.65)*1.1}}
  else if(this.phase==='defeated'){this.dropV+=.22*dt;this.dropY+=this.dropV*dt;if(this.time>=120){this.phase='escape';this.time=0}}
  else if(this.phase==='escape'){this.x+=3.8*dt;this.y-=1.1*dt;this.dropY+=this.dropV*dt;if(this.time>=125){this.phase='escaped';this.time=0}}
 }
 hit(){if(!this.dangerous||this.hitTime>0)return false;this.hp--;this.hitTime=65;if(this.hp===0){const ball=this.ball;this.dropX=ball.x;this.dropY=ball.y;this.dropV=-2;this.phase='defeated';this.time=0}return true}
}
