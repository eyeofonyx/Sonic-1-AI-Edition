import { drawPlayableCharacter } from './character-art'
import { drawEmeraldChunk, drawEmeraldBackdrop, drawEmeraldObject, drawEmeraldMonitor, drawEmeraldSign, drawEmeraldExtras, drawEmeraldTitle, emeraldEnemyFrame } from './emerald-art'
import { drawSuperSonic } from './super-art'
import { finaleFrames } from './finale-frames'
import { finaleData } from './finale-data'
import { finaleSprites, finalEnemyFrame } from './finale-mechanics'
import { originalHUD, originalTitleCard, drawFinalMachine } from './classic-presentation'
import { expansionFrames } from './expansion-frames'
import { expansionData } from './expansion-data'
import { zoneSprites, zoneEnemyFrame } from './zone-mechanics'
import { mazeDraw, resultNumber } from './maze-renderer'
import type { SonicGame } from './game'
import { originalFrames } from './original-frames'
import { classicDraw, classicArt, classicReady, setClassicPalette } from './classic-art'
import { marbleArt, marbleDraw } from './marble-art'
import { platformPosition } from './level'
import { ringFrame, monitorFrame, badnikFrame, shieldFrame, springFrame, signpostFrame, signpostSparkleOffsets } from './sonic-animation'
import { pixelText, spinArt } from './pixel-art'
import { drawBossScene } from './boss-art'
import { dashDustArt } from './spin-dash-art'
import type { OriginalSonicGame } from './original-game'
let scenePalette=''
const images=new Map<string,HTMLImageElement>()
function image(path:string){if(typeof Image==='undefined')return null;if(!images.has(path)){const a=new Image();a.src=path;images.set(path,a)}const a=images.get(path)!;return a.complete&&a.naturalWidth?a:null}
if(typeof Image!=='undefined')for(const path of['/art/original/ghz-chunks.png','/art/original/mz-chunks.png','/art/original/objects.png'])image(path)
function object(c:CanvasRenderingContext2D,name:string,x:number,y:number){if(name.startsWith('ehz/')){drawEmeraldObject(c,name,x,y);return}const nativeFinal=!!finaleFrames[name],expanded=!!expansionFrames[name],a=image(nativeFinal?(scenePalette==='sbz3-water'?'/art/original/finale-sbz3-water.png':'/art/original/finale-objects.png'):expanded?(scenePalette?'/art/original/expansion-'+scenePalette+'.png':'/art/original/expansion-objects.png'):(scenePalette?'/art/original/objects-'+scenePalette+'.png':'/art/original/objects.png')),f=nativeFinal?finaleFrames[name]:expanded?expansionFrames[name]:originalFrames[name];if(!a||!f)return;c.drawImage(a,f[0],f[1],f[2],f[3],Math.round(x+f[4]),Math.round(y+f[5]),f[2],f[3])}
function partner(g:OriginalSonicGame,ticks:number,plane:'back'|'normal'|'front'){
 const t=g.tailsAI;if(!g.duoMode||g.character!=='sonic'||!t?.visible||g.deathTimer||g.giantTaken||g.finaleState.ending)return
 if((t.front?'front':t.behind?'back':'normal')!==plane||t.invincible>0&&Math.floor(t.invincible/5)%2!==0)return
 const c=g.ctx;c.save();c.translate(Math.round(t.x),Math.round(t.y));drawPlayableCharacter(c,t,ticks,scenePalette.endsWith('-water'));c.restore()
}
function sonic(g:OriginalSonicGame,ticks:number){
 if(g.giantTaken)return
 if(!g.superSonic&&g.invincible>0&&Math.floor(g.invincible/5)%2!==0&&!g.deathTimer)return
 const c=g.ctx,a=g.grounded?g.angle:0;c.save();c.translate(Math.round(g.x),Math.round(g.y))
 if(g.shield&&shieldFrame(ticks)>0){c.save();const radius=g.character==='tails'?15:19;c.translate(Math.sin(a)*radius,-Math.cos(a)*radius);classicDraw(c,'shield/shield'+shieldFrame(ticks),0,0);c.restore()}
 if(g.character!=='sonic'){drawPlayableCharacter(c,g,ticks,scenePalette.endsWith('-water'));c.restore();return}
 if(g.superSonic){const radius=g.ball||g.rolling?14:19;c.translate(Math.sin(a)*radius,-Math.cos(a)*radius);if(g.ball||g.rolling||g.spinDashing||g.superTransform||g.zoneState.sliding)c.scale(g.face,1);else c.scale(g.animation.flipX?-1:1,g.animation.flipY?-1:1);drawSuperSonic(c,g,ticks,scenePalette.endsWith('-water')?scenePalette:'')}
 else if(g.zoneState?.drowning){c.translate(0,-19);classicDraw(c,'sonic/Drown',0,0)}
 else if(g.zoneState?.sliding&&!g.ball){c.translate(0,-19);c.scale(g.face,1);classicDraw(c,'sonic/WaterSlide',0,0)}
 else if(g.spinDashing){c.scale(g.face,1);const f=classicArt(g.animation.frame,52,44,39);if(f)c.drawImage(f,-26,-40)}
 else if(g.ball||g.rolling){c.translate(Math.sin(a)*14,-Math.cos(a)*14);c.scale(g.face,1);if(!classicDraw(c,'sonic/'+g.animation.frame,0,0))c.drawImage(spinArt(g.animation.cursor%5),-18,-18)}
 else{c.translate(Math.sin(a)*19,-Math.cos(a)*19);c.scale(g.animation.flipX?-1:1,g.animation.flipY?-1:1);classicDraw(c,'sonic/'+g.animation.frame,0,0)}
 c.restore()
}
export function drawOriginalGame(base:SonicGame){
 const g=base as OriginalSonicGame,wet=g.world.zone==='lz'||g.world.zone==='sbz3',top=Math.max(0,Math.min(224,Math.ceil(g.waterLevel-Math.floor(g.cameraY)))),zone=g.world.zone==='sbz3'?'sbz3':'lz';
 if(!wet){scenePalette='';setClassicPalette();drawOriginalScene(base);return}
 if(top>0){scenePalette=zone;setClassicPalette(scenePalette);drawOriginalScene(base)}
 if(top<224){g.ctx.save();g.ctx.beginPath();g.ctx.rect(0,top,320,224-top);g.ctx.clip();scenePalette=zone+'-water';setClassicPalette(scenePalette);drawOriginalScene(base);g.ctx.restore()}
 scenePalette='';setClassicPalette()
}
function drawOriginalScene(base:SonicGame){
 const g=base as OriginalSonicGame,world=g.level.original!,map=world.map,c=g.ctx,W=320,H=224,ticks=Math.round(g.clock*60),marble=world.zone==='mz',spring=world.zone==='syz',star=world.zone==='slz',industrial=world.zone==='sbz'||world.zone==='fz',labyrinth=world.zone==='lz'||world.zone==='sbz3',emerald=world.artZone==='ehz'
 g.viewW=W;g.viewH=H;if(g.canvas.width!==W||g.canvas.height!==H){g.canvas.width=W;g.canvas.height=H}c.imageSmoothingEnabled=false
 const atlas=image('/art/original/'+(world.artZone==='ehz'?'ehz-chunks':scenePalette.endsWith('-water')?(world.zone==='sbz3'?'sbz3-water-chunks':'lz-chunks-water'):world.zone==='fz'||world.zone==='sbz'&&map.act===2?'sbz2-chunks':world.zone+'-chunks')+'.png'),cam=Math.floor(g.camera),cy=Math.floor(g.cameraY)
 c.fillStyle=scenePalette.endsWith('-water')?'rgb('+(world.zone==='sbz3'?finaleData.palettes.water[32]:expansionData.palettes.water[32]).slice(0,3).join(',')+')':star?'#000024':industrial?'#242449':labyrinth?'#000000':spring?'#6d246d':marble?'#000092':'#2400b6';c.fillRect(0,0,W,H)
 if(!atlas||!classicReady()){pixelText(c,'LOADING ORIGINAL ART',W/2,H/2,'#fff4bc',8,'center');return}
 const chunk=(id:number,x:number,y:number)=>{if(emerald){drawEmeraldChunk(c,atlas,id,x,y);return}if(id>=0)c.drawImage(atlas,id%8*256,Math.floor(id/8)*256,256,256,Math.round(x),Math.round(y),256,256)}
 // The original background layout stays assembled, rather than mixing unrelated chunks.
 const bw=map.backgroundWidth||32,bh=map.backgroundHeight||1,bg=map.background||[],bx=Math.floor(cam*(marble?.5:.125)),by=marble||labyrinth||industrial?cy:spring||star?Math.floor(cy*.125):Math.max(0,Math.min(32,Math.floor(cy*.025)))
 if(emerald)drawEmeraldBackdrop(g,atlas);else for(let yy=Math.floor(by/256);yy*256-by<H;yy++)for(let xx=Math.floor(bx/256);xx*256-bx<W;xx++){const iy=marble||spring||labyrinth||star||industrial?Math.max(0,Math.min(bh-1,yy)):0,ix=((xx%bw)+bw)%bw,id=(bg[iy*bw+ix]||0)&127;chunk(id-1,xx*256-bx,yy*256-by)}
 c.save();c.translate(-cam,-cy)
 partner(g,ticks,'back');if(world.behindLoop)sonic(g,ticks)
 for(let yy=Math.max(0,cy>>8);yy<=Math.min(map.height-1,(cy+H)>>8);yy++)for(let xx=Math.max(0,cam>>8);xx<=Math.min(map.width-1,(cam+W)>>8);xx++){const id=(emerald?map.layout[yy*map.width+xx]:map.layout[yy*map.width+xx]&127)-1;chunk(id,xx*256,yy*256)}
 if(marble){const f=Math.floor(ticks/20)%3;for(let yy=Math.max(0,cy>>4);yy<=(cy+H)>>4;yy++)for(let xx=Math.max(0,cam>>4);xx<=(cam+W)>>4;xx++){const w=world.wordAt(xx*16,yy*16),id=w&1023;if(id<362||id>367)continue;const a=marbleArt((id<366?'lava/body':'lava/surface')+f);if(!a)continue;c.save();c.translate(xx*16+(w&2048?16:0),yy*16+(w&4096?16:0));c.scale(w&2048?-1:1,w&4096?-1:1);c.drawImage(a,(id-(id<366?362:366))%2*16,id<366?Math.floor((id-362)/2)*16:0,16,16,0,0,16,16);c.restore()}}
 for(const b of g.level.bridgeDefs)if(b.end>=cam&&b.x<cam+W)for(let x=b.x;x<b.end;x+=16)if(emerald)drawEmeraldObject(c,'ehz/bridge/0',x+8,b.y+8);else classicDraw(c,'bridge/bri_Log',x+8,b.y+8)
 for(const p of g.platforms){if(p.kind==='capsule'||p.invisible||p.inactive&&p.originalId!==0x0c||(p.timer||0)>40)continue;const pos=platformPosition(p,g.clock);if(pos.x+p.w<cam-32||pos.x>cam+W+32)continue
  if(p.originalId===0x31||p.originalId===0x15){const x=p.anchorX??pos.x+p.w/2,top=p.anchorY??pos.y-96;for(let y=top;y<pos.y;y+=16)classicDraw(c,'chain/chain',x,y);if(p.originalId===0x31)object(c,'mz/crusher/2',x,top)}
  c.save();c.translate(Math.round(pos.x+(p.artX||0)),Math.round(pos.y+(p.artY||0)));c.scale(p.flags!&1?-1:1,p.flags!&2?-1:1);if(p.art)object(c,p.art,0,0);c.restore()
 }
 for(const[x,y,type,sub,flags]of map.objects){if(x<cam-128||x>cam+W+128||y<cy-160||y>cy+H+160)continue;c.save();c.translate(x,y);c.scale(flags&1?-1:1,flags&2?-1:1)
  if(type===0x17){const count=Math.max(1,sub&15);for(let i=0;i<count;i++){const f=(Math.floor(ticks/8)+i)%8;if(f!==6)object(c,'ghz/helix/'+f,-(count-1)*8+i*16,0)}}
  if(type===0x1c){if(emerald)drawEmeraldObject(c,'ehz/bridge/1',0,0);else classicDraw(c,'bridge/bri_Stump',0,0)}
  if(type===0x44)object(c,'ghz/edge/'+Math.min(2,sub&15),0,0)
  if(type===0x32)object(c,'mz/switch/'+(g.switches?.has(sub&15)?1:0),0,0)
  if(type===0x36){const names=['upright_3','sideways_3','upright_1','upright_3_wide','upright_6','sideways_1'];classicDraw(c,'spikes/'+(names[sub>>4]||names[0]),(sub&15)===1?Math.sin(g.clock*2)*16:0,(sub&15)===2?Math.sin(g.clock*2)*16:0)}
  if(type===0x79){if(emerald)drawEmeraldObject(c,'ehz/post/'+((sub&127)<=g.checkpointId?1:0),0,0);else classicDraw(c,(sub&127)<=g.checkpointId?'checkpoint/red':'checkpoint/blue',0,0)}
  if(type===0x0d&&!(world.zone==='sbz'&&map.act===2)){if(emerald){drawEmeraldSign(g,0,0);c.restore();continue}const age=g.goalTime&&(g.signpostY===null||g.signpostY===y)?g.goalTime:0;classicDraw(c,'sign/'+signpostFrame(age),0,0);if(age>0&&age<122)for(let ago=0;ago<2;ago++){const born=Math.floor((age-1)/12)*12+1-ago*12,life=age-born;if(born<1||life>=24)continue;const pos=signpostSparkleOffsets[Math.floor((born-1)/12)%8];classicDraw(c,'ring/sparkle'+(Math.floor(life/6)+1),pos[0],pos[1])}}
  c.restore()
 }
 for(const sp of [...zoneSprites(g),...finaleSprites(g)]){c.save();c.translate(Math.round(sp.x),Math.round(sp.y));c.scale(sp.flipX?-1:1,sp.flipY?-1:1);object(c,sp.art,0,0);c.restore()}
 for(const s of emerald?[]:g.level.springDefs){if(s.x<cam-32||s.x>cam+W+32)continue;c.save();c.translate(s.x,s.y-(s.dir==='left'||s.dir==='right'?16:8));if(s.dir==='right')c.scale(-1,1);if(s.dir==='down')c.scale(1,-1);classicDraw(c,springFrame(g.springAnimations.get(s.x),s.dir==='left'||s.dir==='right'),0,0);c.restore()}
 for(const r of g.rocks)if(!r.broken&&r.x>=cam-32&&r.x<cam+W+32)classicDraw(c,'rock/rock',r.x,r.y-16)
 for(const m of g.monitors)if(m.x>=cam-32&&m.x<cam+W+32)if(emerald)drawEmeraldMonitor(c,m,ticks);else classicDraw(c,m.broken?'monitor/broken':monitorFrame(m.kind,ticks),m.x,m.y-16)
 const rf=['front','angle1','edge','angle2'][ringFrame(ticks)]
 for(const r of g.rings)if(!r.taken&&r.x>=cam-12&&r.x<cam+W+12)classicDraw(c,'ring/'+rf,r.x,r.y)
 for(const e of g.enemies){if(!e.alive||e.x<cam-64||e.x>cam+W+64)continue;c.save();c.translate(Math.round(e.x),Math.round(e.y-16));if((e.direction||-1)>0)c.scale(-1,1)
  const expanded=emeraldEnemyFrame(e,ticks)||finalEnemyFrame(g,e,ticks)||zoneEnemyFrame(e,ticks);if(expanded){object(c,expanded,0,0);if(e.originalId===0x60)for(let i=e.shots||0;i<4;i++){const a=g.clock*2+i*Math.PI/2;object(c,'lz/orbinaut/3',Math.cos(a)*24,Math.sin(a)*24)}}
  else if(e.originalId===0x55)marbleDraw(c,'bat/'+['fly1','fly2','fly3','fly2'][Math.floor(ticks/4)%4],0,0)
  else if(e.originalId===0x78){const f=Math.floor(ticks/8)%2+1;marbleDraw(c,'caterpillar/head'+f,-16,2);marbleDraw(c,'caterpillar/body'+f,0,8);marbleDraw(c,'caterpillar/body'+f,16,8)}
  else if(e.originalId===0x42)object(c,'ghz/newtron/'+(Math.abs(e.x-g.x)<160?Math.floor(ticks/8)%2+2:0),0,0)
  else{const f=badnikFrame(e.kind,ticks);if(f.flip)c.scale(-1,1);classicDraw(c,f.name,0,0)}c.restore()
 }
 for(const f of g.fires||[])if(world.zone==='slz'&&f.boss)object(c,'slz/seesawball/'+(f.landed&&f.life<60&&Math.floor(ticks/4)%2?0:1),f.x,f.y);else marbleDraw(c,'fire/vertical'+(Math.floor(ticks/6)%2+1),f.x,f.y)
 for(const b of emerald?[]:g.bullets){c.fillStyle='#ff4900';c.fillRect(b.x-3,b.y-3,6,6);c.fillStyle='#ffff92';c.fillRect(b.x-1,b.y-1,2,2)}
 if(g.specialPortal){const p=g.specialPortal;c.strokeStyle='#ffdb24';c.lineWidth=2;c.beginPath();c.ellipse(p.x,p.y,22,26,0,0,Math.PI*2);c.stroke();pixelText(c,'SPECIAL',p.x,p.y-34,'#ffff92',8,'center')}
 for(const giant of g.giantRings)mazeDraw(c,'giant/'+['gring_front','gring_angled1','gring_side','gring_angled2'][Math.floor(ticks/8)%4],giant[0],giant[1])
 if(!emerald&&world.zone!=='fz')drawBossScene(g);drawFinalMachine(g)
 if(g.boss?.arena.kind==='seesaw'&&g.boss.active&&g.boss.phase!=='escaped')object(c,'syz/weapon/3',g.boss.x,g.boss.y)
 if(g.boss?.arena.kind==='pinch'&&g.boss.active&&g.boss.phase!=='escaped')object(c,'syz/weapon/5',g.boss.x,g.boss.y+34)
 partner(g,ticks,'normal');if(!world.behindLoop&&!world.frontPlane)sonic(g,ticks)
 if(emerald)drawEmeraldExtras(g)
 if(g.dropCharging&&g.dropCharge>=20)pixelText(c,'DROP READY',Math.max(cam+48,Math.min(cam+W-48,g.x)),g.y-42,'#b6ffdb',8,'center')
 if(g.peelCharging)pixelText(c,g.peelCharge>=30?'PEEL READY':'PEEL '+Math.round(g.peelCharge/30*100)+'%',Math.max(cam+60,Math.min(cam+W-60,g.x)),g.y-46,g.peelCharge>=30?'#b6ffdb':'#ffff92',8,'center')
 if(g.spinDashing)pixelText(c,'REV '+g.spinRevs,g.x,g.y-44,'#ffff92',8,'center')
 for(const p of g.particles){if(p.x<cam-32||p.x>cam+W+32)continue;c.globalAlpha=Math.min(1,p.life/20);if(p.kind==='ring'){if(p.life>90||Math.floor(p.life/6)%2===0)classicDraw(c,'ring/'+rf,p.x,p.y)}else if(p.kind==='animal')classicDraw(c,(p.vx>0?'flicky/':'rabbit/')+(Math.floor(p.age/8)%2?'flap1':'flap2'),p.x,p.y);else if(p.kind==='dust'){const a=dashDustArt(Math.floor(p.age/6));c.drawImage(a,p.x-17,p.y+3-a.height)}else{c.fillStyle=p.kind==='smoke'?'#dbdbdb':'#ffff92';const size=p.kind==='smoke'?6:2;c.fillRect(p.x-size/2,p.y-size/2,size,size)}c.globalAlpha=1}
 for(const p of g.popups)pixelText(c,p.text,p.x,p.y,'#ffff92',8,'center')
 // Original high-priority 8px patterns cover the low sprite plane (tunnels/loops).
 for(let yy=Math.max(0,cy>>4);yy<=(cy+H)>>4;yy++)for(let xx=Math.max(0,cam>>4);xx<=(cam+W)>>4;xx++){
  const raw=map.layout[(yy>>4)*map.width+(xx>>4)];if(!raw)continue;const id=(emerald?raw:raw&127)-1,w=world.data.chunks[id*256+(yy&15)*16+(xx&15)],priority=world.data.priority[w&1023]||0;if(!priority)continue
  for(let p=0;p<4;p++){const source=(w&2048?p^1:p)^(w&4096?2:0);if(!(priority&(1<<source)))continue;const px=(xx&15)*16+(p%2)*8,py=(yy&15)*16+(p>>1)*8;if(emerald){const q=world.renderQuads![id],cid=q[(py>=128?2:0)+(px>=128?1:0)];c.drawImage(atlas,cid%16*128+(px&127),Math.floor(cid/16)*128+(py&127),8,8,xx*16+(p%2)*8,yy*16+(p>>1)*8,8,8)}else c.drawImage(atlas,id%8*256+px,Math.floor(id/8)*256+py,8,8,xx*16+(p%2)*8,yy*16+(p>>1)*8,8,8)}
 }
 partner(g,ticks,'front');if(world.frontPlane)sonic(g,ticks)
 if(labyrinth){for(let x=cam-(cam%192);x<cam+W+192;x+=192)object(c,'lz/surface/'+(Math.floor(ticks/8)%3),x,g.waterLevel);if(g.underwater&&g.zoneState.air<=720&&!g.deathTimer&&ticks%120<95){const n=Math.max(0,Math.min(5,Math.ceil(g.zoneState.air/120)-1));object(c,'lz/bubble/'+(n===0?13:19-n),g.x+22,g.y-56)}}
 c.restore()
 const text=(s:string,x:number,y:number,color='#ffffdb',align:CanvasTextAlign='left')=>pixelText(c,s,x,y,color,8,align)
 originalHUD(g);if(emerald)drawEmeraldTitle(g);else originalTitleCard(g)
 if(g.tally&&g.clearTimer>25){const slide=Math.max(0,1-(g.clearTimer-25)/25)*320;mazeDraw(c,'card/M_Card_Oval',220+slide,83);if(g.character==='sonic')mazeDraw(c,'card/M_Got_SonicHas',164-slide,60);else pixelText(c,g.character.toUpperCase()+' HAS',164-slide,51,'#fff',8,'center');mazeDraw(c,'card/M_Got_Passed',160+slide,80);mazeDraw(c,'card/M_Card_Act'+g.level.zoneAct,204+slide,86);mazeDraw(c,'label/M_Got_Score',160+slide,116);resultNumber(c,g.stats.score,192+slide,108);mazeDraw(c,'label/M_Got_TBonus',160+slide,140);resultNumber(c,g.tally.time,208+slide,132,5);mazeDraw(c,'label/M_Got_RBonus',160+slide,164);resultNumber(c,g.tally.ring,208+slide,156,5);if(g.giantTaken)text('SPECIAL STAGE NEXT',160,201,'#ffff00','center')}
 if(g.giantFlash&&g.giantFlash<18){c.fillStyle='rgba(255,255,255,'+(1-g.giantFlash/18)+')';c.fillRect(0,0,320,224)}
}
