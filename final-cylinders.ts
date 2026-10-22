import type { OriginalSonicGame } from './original-game'
/** Native 64px cylinders, 160px travel and original floor/ceiling origins. */
export function cylinderState(g:OriginalSonicGame){
 const b=g.boss!,age=b.fightTime*60,cycle=Math.floor(age/360),t=age%360
 const extent=t<50?t/50*160:t<110?160:t<165?(165-t)/55*160:0
 return{cycle,t,extent,pair:[cycle%2,2+(cycle>>1)%2],columns:[{x:b.arena.left+128,top:false},{x:b.arena.left+256,top:false},{x:b.arena.left+64,top:true},{x:b.arena.left+192,top:true}]}
}
export function finalCylinderGeometry(g:OriginalSonicGame){
 const m=cylinderState(g),floor=g.boss!.arena.floor
 return m.columns.map((p,index)=>{const extent=g.boss!.phase==='fight'&&m.pair.includes(index)?m.extent:0,cap=p.top?floor-176+extent:floor-16-extent
 return{...p,index,extent,left:p.x-32,right:p.x+32,cap,upper:p.top,top:p.top?floor-176:cap,bottom:p.top?cap:floor-16,origin:p.top?floor-272+extent:floor+80-extent}})
}
export function syncFinalCylinders(g:OriginalSonicGame){for(const box of finalCylinderGeometry(g)){const p=g.platforms.find(p=>p.originalId===0x84&&p.subtype===box.index);if(p){p.x=box.left;p.y=box.top;p.h=box.bottom-box.top;p.w=64}}}
export function advanceFinalMachine(g:OriginalSonicGame,dt:number){g.finaleState.previousExtent=cylinderState(g).extent;g.boss!.step(dt);syncFinalCylinders(g)}
/** A cylinder is a solid platform/wall, not a lethal proximity field. Only
 * being squeezed into another solid surface is a crush. */
export function resolveFinalCylinders(g:OriginalSonicGame,prevX:number,prevY:number){
 if(g.world.zone!=='fz'||!g.boss?.active||g.deathTimer)return
 const height=g.ball||g.rolling?28:38,radius=9,m=cylinderState(g)
 for(const box of finalCylinderGeometry(g)){
  if(box.extent<=0||g.x+radius<=box.left||g.x-radius>=box.right||g.y<=box.top||g.y-height>=box.bottom)continue
  const oldCap=box.upper?box.cap-(m.extent-g.finaleState.previousExtent):box.cap+(m.extent-g.finaleState.previousExtent)
  const p=g.platforms.find(p=>p.originalId===0x84&&p.subtype===box.index)!
  if(!box.upper&&(prevY<=oldCap+4||g.platform===p)){
   g.y=box.cap;g.vy=0;g.grounded=true;g.platform=p;g.platformOldX=p.x;g.platformOldY=p.y
   if(g.world.solid(g.x-7,g.y-height,true)||g.world.solid(g.x+7,g.y-height,true))g.die()
  }else if(box.upper&&prevY-height>=oldCap-4){
   g.y=box.cap+height;g.vy=Math.max(0,g.vy);g.grounded=false;g.platform=null
   const floor=g.floorAt(g.x,prevY,4).y
   if(g.y>floor+.5)g.die()
  }else{
   const left=prevX<=box.left||prevX<box.right&&g.x<(box.left+box.right)/2
   g.x=left?box.left-radius:box.right+radius
   if(left&&g.vx>0||!left&&g.vx<0)g.vx=g.groundSpeed=g.groundVX=0
  }
  if(g.deathTimer)return
 }
 // Adjacent active pistons leave no imaginary slit between their faces.
 // A horizontal correction must not put Sonic inside the other cylinder.
 if(finalCylinderGeometry(g).some(b=>b.extent>0&&g.x+radius>b.left+.01&&g.x-radius<b.right-.01&&g.y>b.top+.01&&g.y-height<b.bottom-.01))g.die()
}
