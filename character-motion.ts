import { FLIGHT_TICKS, type CharacterAbility } from './characters'
import type { OriginalSonicGame } from './original-game'
export class CharacterMotion{
 ability:CharacterAbility='normal';ticks=0;released=false;queued=false;used=false;lift=0
 private g:OriginalSonicGame
 constructor(g:OriginalSonicGame){this.g=g}
 cancel(){this.g.audioEffects?.stopGroup('flight');this.ability='normal';this.ticks=0;this.released=this.queued=false;this.lift=0}
 reset(){this.cancel();this.used=false;this.ticks=0}
 wall(y=this.g.y){const g=this.g;return g.world.solid(g.x+g.face*12,y-12,true)&&g.world.solid(g.x+g.face*12,y-24,true)}
 step(dt:number,jump:boolean,left:boolean,right:boolean,up:boolean,down:boolean){const g=this.g;if(g.character==='sonic')return;if(g.grounded){this.reset();return}if(g.hurtState||g.deathTimer||g.controlLock||g.zoneState.sliding||g.zoneState.current||g.finaleState.tube||g.finaleState.trap){this.cancel();return}const queued=this.queued;if(!jump&&g.ownJump)this.released=true;this.queued=false;
  if(queued&&this.ability==='normal'&&g.ownJump&&!this.used){g.cancelSpinDash();this.used=true;g.rollJump=g.ownJump=false;g.angle=0;g.platform=null;if(g.character==='tails'){this.ability='flight';this.ticks=FLIGHT_TICKS;this.lift=24;g.ball=false;g.vy=Math.max(-1.5,Math.min(.5,g.vy))}else{this.ability='glide';g.ball=true;g.vx=g.face*Math.max(g.underwater?2:4,Math.min(g.underwater?4.5:9,Math.abs(g.vx)));g.vy=.5}g.emit()}
  if(this.ability==='flight'||this.ability==='tired'){if(down){this.cancel();return}this.ticks=Math.max(0,this.ticks-dt);if(!this.ticks)this.ability='tired';if((queued||up)&&this.ticks)this.lift=24;if(this.ticks&&this.lift>0){this.lift-=dt;g.vy=Math.max(g.underwater?-1:-1.5,g.vy-.125*dt)}else g.vy=Math.min(this.ticks?1:g.underwater?2:4,g.vy+(this.ticks?8/256:32/256)*dt);g.ball=g.rolling=g.ownJump=g.rollJump=false;if(!g.underwater&&g.frame%16===0){g.audioEffects.attach(g.audio,g.sound);g.audioEffects.play(this.ticks?'flight':'flight-tired',1,'flight')}}
  else if(this.ability==='glide'){if(!jump||down){g.vx*=.25;this.cancel();g.ball=false;return}if(left!==right&&Math.sign(g.vx)!==(right?1:-1)){g.vx+=(right?1:-1)*.125*dt;if(Math.abs(g.vx)<.15){g.face=right?1:-1;g.vx=g.face*(g.underwater?2:4)}}else g.vx=g.face*Math.min(g.underwater?4.5:9,Math.abs(g.vx)+dt/64);g.vy=Math.min(g.underwater?.75:1.25,g.vy+dt/128);g.ball=true}
  else if(this.ability==='climb'){if(queued){const facing=g.face;this.cancel();this.used=false;g.x-=facing*2;g.vx=-facing*4;g.vy=-(g.underwater?3:5);g.face=-facing;g.ball=true;g.ownJump=true;g.sfx('jump');return}g.vx=0;g.vy=up?-1.5:down?1.5:0;g.ball=false;g.angle=0;if(up&&!this.wall(g.y-2)){const nx=g.x+g.face*20,f=g.world.floor(nx,g.y-38,g.y-4),clear=f&&[-8,0,8].every(dx=>[1,18,37].every(n=>!g.world.solid(nx+dx,f.y-n,true)));if(f&&clear){g.x=nx;g.y=f.y;g.grounded=true;g.groundSpeed=g.groundVX=g.vx=g.vy=0;g.platform=null;this.reset();return}}if(!this.wall()&&!g.world.solid(g.x+g.face*12,g.y-7,true)){this.cancel();g.vy=1}}
 }
 finish(){const g=this.g;if(this.ability==='glide'&&!g.grounded&&g.vx===0&&this.wall()&&[-7,7].every(dx=>!g.world.solid(g.x+dx,g.y-36,true))){this.ability='climb';g.ball=false;g.vy=g.groundSpeed=0;g.sfx('grab');g.emit()}if(this.ability!=='normal'&&g.y<39){g.y=39;g.vy=Math.max(0,g.vy)}if(g.grounded)this.reset()}
}
