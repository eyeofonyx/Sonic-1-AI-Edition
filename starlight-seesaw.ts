import type { OriginalSonicGame } from './original-game'
import { platformTop, type Platform } from './level'
const heights=[36,36,38,40,42,44,42,40,38,36,...Array.from({length:33},(_,i)=>35-i),2,2,2,2,2]
/** Original seesaw profile; both artwork and contact surface share the tilt. */
export function tiltSeesaw(g:OriginalSonicGame,p:Platform,side:number){
 const old=platformTop(p,g.x,g.clock),x=p.anchorX!,y=p.anchorY!
 p.x=x-48;p.w=96;p.artX=48;p.flags=(p.flags||0)&~1
 if(!side){p.y=y-21;p.artY=21;p.profile=undefined;p.art='slz/seesaw/1'}
 else{p.y=y-44;p.artY=44;p.art='slz/seesaw/'+(side>0?0:2);if(side<0)p.flags|=1;p.profile=Array.from({length:96},(_,i)=>44-heights[Math.floor((side>0?i:95-i)/2)])}
 if(g.platform===p&&g.grounded){g.y+=platformTop(p,g.x,g.clock)-old;g.platformOldX=p.x;g.platformOldY=p.y}
}
export function stepStarLightDrop(g:OriginalSonicGame){
 const b=g.boss!;if(b.phase!=='fight')return
 const age=b.fightTime*60,cycle=Math.floor(age/180),saws=g.platforms.filter(p=>p.originalId===0x5e&&p.subtype===255).sort((a,b)=>a.anchorX!-b.anchorX!)
 const saw=saws[cycle%saws.length];if(!saw)return
 b.dropX=saw.anchorX!+(cycle%2?-38:38)
 if(age%180>=60&&g.finaleState.slzDropCycle!==cycle&&Math.abs(b.x-b.dropX)<8){
  g.finaleState.slzDropCycle=cycle
  g.fires.push({x:b.x,y:b.y+30,vx:0,vy:1,life:300,landed:false,boss:true,seesawX:saw.anchorX,returning:false})
 }
}
export function stepStarLightBall(g:OriginalSonicGame,f:OriginalSonicGame['fires'][number]){
 const saw=g.platforms.find(p=>p.originalId===0x5e&&(f.seesawX===undefined?Math.abs(f.x-p.anchorX!)<52:p.anchorX===f.seesawX))
 if(!saw)return
 const side=Math.sign(f.x-saw.anchorX!)||1
 if(!f.landed&&f.vy>0&&f.y>=platformTop(saw,f.x,g.clock)-12){
  f.landed=true;f.returning=false;f.vx=f.vy=0;f.life=180;g.finaleState.tilts.set(saw.anchorX!,side);tiltSeesaw(g,saw,side)
  f.y=platformTop(saw,f.x,g.clock)-12
  if(g.platform===saw&&g.grounded&&(g.x-saw.anchorX!)*side< -12){g.vy=-12;g.grounded=false;g.platform=null;g.ball=true;g.rolling=false;g.ownJump=false;g.sfx('spring')}
 }
 if(f.landed){f.y=platformTop(saw,f.x,g.clock)-12
  if(g.platform===saw&&g.grounded&&(g.x-saw.anchorX!)*side< -20){f.landed=false;f.returning=true;f.vy=-11;f.vx=Math.max(-2,Math.min(2,(g.boss!.x-f.x)/12));f.life=150;g.sfx('spring')}
 }
 const b=g.boss
 if(f.returning&&b?.dangerous&&Math.hypot(f.x-b.x,f.y-b.y)<32&&b.hit()){f.life=0;g.addScore(b.hp?100:1100);g.sfx('boss-hit');g.burst(b.x,b.y);g.emit()}
}
