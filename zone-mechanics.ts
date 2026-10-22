import type { OriginalSonicGame } from './original-game'
import { platformPosition, type Enemy } from './level'
import { expansionFrames } from './expansion-frames'
export type ZoneState={water:number;target:number;phase:number;underwater:boolean;air:number;drowning:boolean;sliding:boolean;slideGrace:number;current:boolean;breathe:number;bubbles:{x:number;y:number;origin:number;full:boolean;age:number}[];spawn:Map<number,number>;cooldown:Map<number,number>}
export function resetZone(g:OriginalSonicGame):ZoneState{return{water:g.world.zone==='sbz3'?552:g.world.zone==='lz'?[184,808,2304][g.level.zoneAct-1]:Infinity,target:Infinity,phase:0,underwater:false,air:1800,drowning:false,sliding:false,slideGrace:0,current:false,breathe:0,bubbles:[],spawn:new Map(),cooldown:new Map()}}
function patch(g:OriginalSonicGame,id:number){(g.world.map.layout as number[])[2*g.world.map.width+6]=id}
function dynamicWater(g:OriginalSonicGame,dt:number){
 const s=g.zoneState,x=g.camera,y=g.y-19,act=g.level.zoneAct;let target=s.water
 if(act===1){if(s.phase===0){target=184;if(x>=1536){target=264;if(y<512){if(x>=3200)target=232;if(x>=5376)target=264}else{if(x>=3072)target=792;if(x>=4224){target=1480;g.switches.add(5)}if(x>=4992){target=936;if(Math.abs(s.water-target)<1)s.phase=1}}}}else if(s.phase===1){target=936;if(y<736&&x>=4864){target=264;s.phase=2}}else target=264}
 if(act===2)target=x>=2816?1064:x>=1280?968:808
 if(act===3){if(s.phase===0){target=2304;if(x>=1536&&y>=960&&y<1536){target=1224;s.phase=1;patch(g,75);g.sfx('collapse')}s.water=target}else if(s.phase===1){target=x>=1904?776:1224;if(x>=5120&&(y>=1536||y<640||s.target===1288)){target=1288;s.water=target;if(x>=6000)s.phase=2}}else if(s.phase===2){target=x>=6240?392:1288;if(x>=6896||s.water<=392)s.phase=3}else if(s.phase===3){target=x>=6896?2304:392;s.water=target;if(x>=7104){s.phase=4;s.water=1984;target=1544;g.switches.add(8)}}else target=x>=7680?296:1544;if(g.switches.has(15))patch(g,7)}
 s.target=target;s.water+=Math.sign(target-s.water)*Math.min(Math.abs(target-s.water),dt)
}
/** Zone events advance with the same fixed step as Sonic; pausing freezes water, air and every trap. */
export function updateZone(g:OriginalSonicGame,dt:number){
 const s=g.zoneState;if(!s)return;s.slideGrace=Math.max(0,s.slideGrace-dt);s.breathe=Math.max(0,s.breathe-dt);for(const[i,t]of s.cooldown)t<=dt?s.cooldown.delete(i):s.cooldown.set(i,t-dt)
 if(g.world.zone==='lz'||g.world.zone==='sbz3'){
  if(g.world.zone==='lz')dynamicWater(g,dt);const wet=g.y-19>s.water
  if(wet!==s.underwater){s.underwater=wet;s.air=1800;g.sfx('splash');if(wet){g.vx/=2;g.groundSpeed/=2;g.groundVX=g.vx;g.vy/=4}else{g.vy=Math.max(-16,g.vy*2)}}
  if(wet){const before=Math.ceil(s.air/60);s.air=Math.max(0,s.air-dt);const after=Math.ceil(s.air/60);if(before!==after&&[25,20,15].includes(after))g.sfx('air-warning');if(!s.air){s.drowning=true;g.die();g.vy=0;return}}else s.air=1800
  const tunnels=g.level.zoneAct===1?[[2688,768,3088,896],[3968,256,5136,384]]:g.level.zoneAct===2?[[1120,1024,1808,1152]]:[[2592,1536,5648,1760]]
  s.current=tunnels.some(([x,y,r,b])=>g.x>=x&&g.x<r&&g.y-19>=y&&g.y-19<b);if(s.current){g.vx=Math.min(8,g.vx+.5*dt);g.groundSpeed=g.vx;g.groundVX=g.vx;g.controlLock=Math.max(2,g.controlLock)}
  const chunk=g.world.map.layout[(Math.floor(g.y-19)>>8)*g.world.map.width+(Math.floor(g.x)>>8)]&127,speeds:Record<number,number>={2:10,7:-11,3:10,76:-10,75:-11,8:-12,4:11};s.sliding=g.grounded&&speeds[chunk]!==undefined
  if(s.sliding){s.slideGrace=90;g.groundSpeed=speeds[chunk];g.vx=g.groundSpeed;g.groundVX=g.vx;g.face=g.vx>0?1:-1;g.controlLock=Math.max(2,g.controlLock)}
  g.world.map.objects.forEach(([x,y,id,sub],i)=>{if(id!==0x64||y<=s.water||Math.abs(g.x-x)>480)return;const t=s.spawn.get(i)??-100;if(g.clock*60-t<80)return;s.spawn.set(i,g.clock*60);const cycle=Math.floor(g.clock*60/80);s.bubbles.push({x,y:y-12,origin:x,full:cycle%3===0,age:0});void sub})
  for(const b of s.bubbles){b.age+=dt;b.y-=.65*dt;b.x=b.origin+Math.sin(b.age/20)*4;if(b.full&&wet&&Math.hypot(g.x-b.x,g.y-26-b.y)<22){s.air=1800;s.breathe=25;b.y=-100;g.sfx('bubble');g.emit()}}
  s.bubbles=s.bubbles.filter(b=>b.y>s.water&&b.age<1200)
 }
 for(const p of g.platforms){const sub=p.subtype||0
  if(p.path){const path=p.path,reverse=g.switches.has(15);let index=p.pathIndex||0;if(reverse!==!!p.reversed){index=(index+(reverse?-1:1)+path.length)%path.length;p.reversed=reverse}const target=path[index%path.length],cx=p.x+(p.artX||0),cy=p.y+(p.artY||0),dx=target[0]-cx,dy=target[1]-cy,d=Math.max(Math.abs(dx),Math.abs(dy));if(d<dt){p.x=target[0]-(p.artX||0);p.y=target[1]-(p.artY||0);index=(index+(reverse?-1:1)+path.length)%path.length}else{p.x+=dx/d*dt;p.y+=dy/d*dt}p.pathIndex=index}
  if(g.world.zone==='syz'&&p.originalId===0x56&&(sub&15)===7){if(p.anchorX===7992)p.inactive=!g.switches.has(256);if(p.anchorX===7096){p.inactive=g.switches.has(256);if(g.platform===p)p.triggered=true;const target=7960;if(p.triggered&&p.x<target)p.x+=Math.min(dt,target-p.x);if(p.x>=target)g.switches.add(256)}}
  if(p.originalId===0x56&&sub>=128&&g.switches.has(sub&15)){const max=g.world.zone==='lz'&&(sub>>4&7)===7?128:(p.h||64),move=Math.min(2*dt,max-(p.travel||0));p.travel=(p.travel||0)+move;if(g.world.zone==='lz'&&(sub>>4&7)===7)p.x+=p.flags!&1?move:-move;else p.y-=move}
  if(g.world.zone!=='lz'&&g.world.zone!=='sbz3')continue
  if(p.originalId===0x61){const kind=sub&15;if(kind===7){const target=Math.max(0,Math.min((p.anchorY||0)-(p.artY||0),s.water-16));if(!g.world.solid(p.x+p.w/2,p.y-1,true)||target>p.y)p.y+=Math.sign(target-p.y)*Math.min(Math.abs(target-p.y),.75*dt)}else if(kind===1||kind===3){if(g.platform===p)p.triggered=true;if(p.triggered){const limit=kind===1?g.world.floor(p.x+p.w/2,p.y+(p.h||0)+2)?.y:p.anchorY!-128;const target=kind===1?(limit??p.y+1)-(p.h||0):limit!;p.y+=Math.sign(target-p.y)*Math.min(Math.abs(target-p.y),dt)}}}
  if(p.originalId===0x52){const kind=sub&15;if(kind===7&&g.switches.has(2))p.inactive=false;if(g.platform===p)p.triggered=true;if(p.triggered&&[2,3,4,5,7,9,10].includes(kind)){const side=p.flags!&1?-1:1;if(!g.world.solid(p.x+(side>0?p.w+2:-2),p.y-4,true))p.x+=side*dt}}
  if(p.originalId===0x0c){const delay=Math.max(60,sub*60),phase=(g.clock*60)% (delay*2);p.inactive=phase>delay;p.art='lz/flap/'+(p.inactive?2:0)}
  if(p.originalId===0x0b&&Math.abs(g.x-(p.anchorX||0))<25&&Math.abs(g.y-20-(p.anchorY||0))<64){p.travel=(p.travel||0)+dt;if(p.travel>60&&p.timer!==41){p.timer=41;g.sfx('break')}}
 }
}
export type ZoneSprite={x:number;y:number;art:string;flipX?:boolean;flipY?:boolean;danger?:number;rect?:boolean;bumper?:boolean;index?:number}
/** The exact same positions feed drawing and hazards—no invisible or offset spike balls. */
export function zoneSprites(g:OriginalSonicGame):ZoneSprite[]{
 const sprites:ZoneSprite[]=[],zone=g.world.zone,s=g.zoneState;if(zone!=='syz'&&zone!=='lz'&&zone!=='sbz3'||!s)return sprites
 const ticks=g.clock*60
 g.world.map.objects.forEach(([x,y,id,sub,flags],i)=>{
  if(Math.abs(x-g.x)>650||Math.abs(y-g.y)>400)return
  if(id===0x47)sprites.push({x,y,art:'syz/bumper/'+(s.cooldown.has(i)?1:0),bumper:true,index:i})
  if(id===0x12)sprites.push({x,y,art:'syz/light/'+(1+Math.floor(ticks/10)%2)})
  if(id===0x57){const n=sub&7,speed=(sub&240)>127?(sub&240)-256:sub&240,a=flags*Math.PI/2+ticks*speed*8*Math.PI*2/65536;for(let k=0;k<=n;k++)sprites.push({x:x+Math.cos(a)*k*16,y:y+Math.sin(a)*k*16,art:(zone==='sbz3'?'lz':zone)+'/chain/'+(zone==='lz'?(k===n?1:k===0?2:0):0),danger:zone==='syz'?10:k===n?18:undefined})}
  if(id===0x58){const movement=sub&7,offset=(1-Math.cos(g.clock*Math.PI/2))*48;let xx=x,yy=y;if(movement===1)xx-=flags&1?96-offset:offset;if(movement===2)yy-=flags&1?128-offset:offset;if(movement===3){const v=sub&240,speed=v>127?v-256:v,a=flags*Math.PI/2+ticks*speed*8*Math.PI*2/65536;xx+=Math.cos(a)*80;yy+=Math.sin(a)*80}sprites.push({x:xx,y:yy,art:'syz/ball/0',danger:25})}
  if(id===0x16){const f=ticks%180<60?0:ticks%180<68?1:ticks%180<128?2:ticks%180<136?1:0;sprites.push({x,y,art:'lz/harpoon/'+((sub&2?3:0)+f),flipX:!!(flags&1),flipY:!!(flags&2),rect:true,danger:1})}
  if(id===0x62)sprites.push({x,y,art:'lz/gargoyle/0',flipX:!!(flags&1)})
  if(id===0x63&&sub===127)sprites.push({x,y,art:'lz/conveyor/'+Math.floor(ticks/4)%4})
  if(id===0x65)sprites.push({x,y:sub&64?g.waterLevel-16:y,art:'lz/waterfall/'+((sub&15)===9?9+Math.floor(ticks/8)%2:Math.min(10,sub&15)),flipX:!!(flags&1),flipY:!!(flags&2)})
  if(id===0x64)sprites.push({x,y,art:'lz/bubble/'+(19+Math.floor(ticks/8)%3)})
 })
 for(const b of s.bubbles)sprites.push({x:b.x,y:b.y,art:'lz/bubble/'+(b.full?Math.min(6,Math.floor(b.age/6)):Math.min(2,Math.floor(b.age/4)))})
 return sprites
}
export function collideZone(g:OriginalSonicGame){
 if(g.deathTimer)return
 for(const sp of zoneSprites(g)){const dx=g.x-sp.x,dy=g.y-19-sp.y
  if(sp.bumper&&!g.zoneState.cooldown.has(sp.index!)&&Math.hypot(dx,dy)<29){const d=Math.max(1,Math.hypot(dx,dy));g.vx=dx/d*7;g.vy=dy/d*7;if(Math.abs(g.vy)<1)g.vy=-2;g.grounded=false;g.platform=null;g.ownJump=false;g.cancelSpinDash();g.ball=true;g.groundSpeed=g.vx;g.zoneState.cooldown.set(sp.index!,20);g.addScore(10);g.sfx('bump')}
  if(sp.danger){if(sp.rect){const f=expansionFrames[sp.art];if(!f)continue;const l=sp.x+(sp.flipX?-f[4]-f[2]:f[4]),t=sp.y+(sp.flipY?-f[5]-f[3]:f[5]);if(g.x+9>l&&g.x-9<l+f[2]&&g.y>t&&g.y-34<t+f[3])g.hurt(sp.x)}else if(Math.hypot(dx,dy)<sp.danger+11)g.hurt(sp.x)}
 }
 g.world.map.objects.forEach(([x,y,id,,flags],i)=>{if(id!==0x62||Math.abs(g.x-x)>400)return;const key=10000+i,last=g.zoneState.spawn.get(key)??-120;if(g.clock*60-last>=120){g.zoneState.spawn.set(key,g.clock*60);g.bullets.push({x:x+(flags&1?-12:12),y,vx:flags&1?-2:2,vy:0,life:220})}})
 for(const p of g.platforms){if(p.kind!=='moving'||!p.h||p.inactive||g.platform===p)continue;const pos=platformPosition(p,g.clock);if(g.grounded&&g.x>pos.x-8&&g.x<pos.x+p.w+8&&g.y>pos.y+8&&g.y-34<pos.y+p.h&&g.world.solid(g.x,g.y+2))g.die()}
}
export function stepZoneEnemy(g:OriginalSonicGame,e:Enemy,dt:number){
 const id=e.originalId
 if(![0x43,0x50,0x2c,0x2d,0x60].includes(id||0))return false
 if(id===0x2c){e.x=e.base+Math.sin(g.clock*.8)*90;e.y=e.baseY;return true}
 if(id===0x60){e.x+=((e.flags||0)&1?1:-1)*.3*dt;if(e.cooldown<0&&Math.abs(e.x-g.x)<192&&(e.shots||0)<4){const angle=g.clock*2+(e.shots||0)*Math.PI/2;e.shots=(e.shots||0)+1;e.cooldown=55;g.bullets.push({x:e.x+Math.cos(angle)*24,y:e.y-16+Math.sin(angle)*24,vx:Math.sign(g.x-e.x)*2,vy:0,life:180})}for(let i=e.shots||0;i<4;i++){const a=g.clock*2+i*Math.PI/2;if(Math.hypot(g.x-e.x-Math.cos(a)*24,g.y-19-e.y+16-Math.sin(a)*24)<17)g.hurt(e.x)}return true}
 if(id===0x43&&!e.awake){if(Math.abs(e.x-g.x)>224)return true;e.awake=true;e.direction=g.x<e.x?-1:1}
 const dir=e.direction||-1,speed=id===0x43?3.5:.6,next=e.x+dir*speed*dt,floor=g.world.floor(next,e.baseY-64,e.baseY+160)
 if(!floor||g.world.solid(next+dir*16,e.y-14,true))e.direction=-dir;else{e.x=next;e.y=floor.y;e.baseY=floor.y}
 if(id===0x2d)e.y-=Math.max(0,Math.sin(g.clock*2.3))*48
 return true
}
export function zoneEnemyFrame(e:Enemy,ticks:number):string|null{if(e.originalId===0x43)return'syz/roller/'+(e.awake?3+Math.floor(ticks/4)%2:0);if(e.originalId===0x50)return'syz/yadrin/'+Math.floor(ticks/8)%2;if(e.originalId===0x2c)return'lz/jaws/'+Math.floor(ticks/8)%2;if(e.originalId===0x2d)return'lz/burrobot/'+Math.floor(ticks/8)%3;if(e.originalId===0x60)return'lz/orbinaut/'+((e.shots||0)>0?1:0);return null}
