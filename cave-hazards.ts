import type { SonicGame } from './game'
import type { StageLevel } from './acts'
export type CaveDrop={x:number;y:number;origin:number;phase:'idle'|'warning'|'falling'|'rest';timer:number;vy:number}
export function createCaveDrops(level:StageLevel):CaveDrop[]{return level.fallingSpikes.map(x=>{const ledges=level.makePlatforms().filter(p=>x>p.x-40&&x<p.x+p.w+40);const origin=Math.min(level.ground(x)-240,...ledges.map(p=>p.y-85));return {x,y:origin,origin,phase:'idle',timer:0,vy:0}})}
export function ventPhase(clock:number,index:number){return (clock*60+index*73)%240}
export function updateCaveHazards(g:SonicGame,dt:number){
 for(const d of g.caveDrops){
  if(d.phase==='idle'){if(Math.abs(g.x-d.x)<155){d.phase='warning';d.timer=42}}
  else if(d.phase==='warning'){d.timer-=dt;if(d.timer<=0){d.phase='falling';d.vy=1;g.beep(210,.07,'triangle',.02)}}
  else if(d.phase==='falling'){const old=d.y;d.vy=Math.min(12,d.vy+.3*dt);d.y+=d.vy*dt;const floor=g.floorAt(d.x,old,0).y;
   if(d.y>=floor){d.y=floor;d.phase='rest';d.timer=220;g.burst(d.x,d.y-8,'smoke')}
   else if(Math.abs(g.x-d.x)<21&&g.y>d.y-34&&g.y-32<d.y+5)g.hurt(d.x)
  }else{d.timer-=dt;if(d.timer<=0){d.y=d.origin;d.vy=0;d.phase='idle'}}
 }
 // The aqueduct floors are solid stone bridges above real, damaging lava.
 for(const [left,right]of g.level.gaps){const lavaY=g.level.ground(left)+72;if(g.x>left&&g.x<right&&g.y>=lavaY&&g.y<990){const wasHurt=g.hurtState;g.hurt((left+right)/2);if(!wasHurt&&g.hurtState&&!g.deathTimer)g.vy=-7}}
 g.level.vents.forEach((x,i)=>{const phase=ventPhase(g.clock,i),y=g.level.ground(x);if(phase>=160&&phase<220&&Math.abs(g.x-x)<24&&g.y>y-96&&g.y-30<y+5)g.hurt(x)})
}
