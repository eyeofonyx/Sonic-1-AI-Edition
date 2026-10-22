import { drawOriginalGame } from './original-renderer'
import { ringFrame, shieldFrame, monitorFrame, badnikFrame, springFrame } from './sonic-animation'
import { classicArt, classicDraw, classicReady, drawClassicBackground } from './classic-art'
import type { SonicGame } from './game'
import { platformPosition } from './level'
import { drawCaveBossScene, drawCaveBossHUD } from './cave-boss-art'
import { drawBossScene, drawBossHUD } from './boss-art'
import { marbleTile, marbleDraw, drawMarbleBackground, drawMarbleSurface, drawMarbleRuins, drawMarbleLava, drawMarbleBridge, drawMarblePlatform, drawMarbleHazards, drawMarbleEnemy } from './marble-art'
import { spinDashArt, dashDustArt } from './spin-dash-art'
import { sonicSide, spinArt, ringArt, groundTile, palmArt, cloudArt, hillLayer, flowerArt, pixelText, pixelPainter, skyArt, loopArt, enemyArt } from './pixel-art'
export function drawGame(g:SonicGame){
 if(g.level.original){drawOriginalGame(g);return}
 const {end:LEVEL_END,ground,inGap,gaps,bridgeDefs,loopDefs,spikeDefs,springDefs,checkpoints,palms,flowers}=g.level
 const cave=g.level.theme==='marble',ticks=Math.round(g.clock*60)
 const c=g.ctx;const mobile=g.canvas.clientWidth>0&&g.canvas.clientWidth<550,arenaView=!!g.activeArena;const W=mobile&&!arenaView?480:640,H=mobile?(arenaView?480:360):400;g.viewW=W;g.viewH=H;if(g.canvas.width!==W||g.canvas.height!==H){g.canvas.width=W;g.canvas.height=H}c.imageSmoothingEnabled=false
 const rect=(x:number,y:number,w:number,h:number,color:string)=>{c.fillStyle=color;c.fillRect(Math.floor(x),Math.floor(y),Math.ceil(w),Math.ceil(h))}
 const poly=pixelPainter(g.canvas).p
 const text=(s:string,x:number,y:number,color='#fff5db',size=14,align:CanvasTextAlign='left')=>pixelText(c,s,x,y,color,size,align)
 const cam=Math.floor(g.camera),cy=Math.floor(g.cameraY);const visible=(x:number,w=80)=>x>cam-w&&x<cam+W+w
 const ring=(x:number,y:number,size=6,spin=false)=>{const f=spin?ringFrame(ticks):0;if(classicDraw(c,'ring/'+['front','angle1','edge','angle2'][f],x,y))return;const w=spin?16:Math.round(size*2.4),h=spin?16:Math.round(size*2.7);c.drawImage(ringArt(f),Math.round(x-w/2),Math.round(y-h/2),w,h)}
 const sparkle=(x:number,y:number,size:number,color:string)=>{rect(x-size,y-1,size*2+1,3,color);rect(x-1,y-size,3,size*2+1,color)}
 const checker=(x:number,y:number,w:number,h:number,dark=false)=>{c.fillStyle=c.createPattern(cave?marbleTile():groundTile(dark),'repeat')!;c.fillRect(x,y,w,h)}
 const nativeGrass=!cave?classicArt('terrain/grass'):null
 const grass=(x:number,y:number,w:number)=>{if(nativeGrass){for(let i=0;i<w;i++){const sx=((Math.floor(x+i)%nativeGrass.width)+nativeGrass.width)%nativeGrass.width;c.drawImage(nativeGrass,sx,0,1,16,Math.floor(x+i),Math.floor(y),1,16)}return}if(cave){drawMarbleSurface(c,x,y,w);return}for(let i=0;i<w;i++){const xx=Math.floor(x+i),n=((xx*17)%13+13)%13,tip=n<4?-2:n>10?-1:0;rect(xx,y+tip,1,2,'#d0ee70');rect(xx,y+2,1,2,n%3?'#91dc3e':'#c0ec61');rect(xx,y+4,1,3,n%4?'#5bb92c':'#79d334');rect(xx,y+7,1,4,n%3?'#309b32':'#55b72b');rect(xx,y+11,1,3+n%5,n%2?'#156f3c':'#21873c');if(n<3)rect(xx,y+15+n,1,3,'#195f35')}}
 const palm=(x:number,y:number,s=1)=>c.drawImage(palmArt(),Math.round(x-80*s),Math.round(y-184*s),Math.round(184*s),Math.round(184*s))
 // Fine-grained palette bands and individually rasterized cloud silhouettes.
 if(cave)drawMarbleBackground(g,W,H)
 else if(!drawClassicBackground(c,cam,cy,W,H,g.elapsed)) {
 c.drawImage(skyArt(),0,0,W,H)
 for(let i=-1;i<6;i++){const x=i*196-(cam*.12%196),y=30+((i+6)%3)*19-cy*.035;c.drawImage(cloudArt(),Math.floor(x),Math.floor(y))}
 const hills=(near:boolean,scroll:number,y:number)=>{const layer=hillLayer(near),offset=Math.floor((cam*scroll)%768),top=Math.floor(y);for(let x=-offset-768;x<W;x+=768){c.drawImage(layer,x,top);if(top+layer.height<H)c.drawImage(layer,0,layer.height-1,layer.width,1,x,top+layer.height,layer.width,H-top-layer.height)}}
 hills(false,.18,78-cy*.10)
 const water=245-cy*.1;rect(0,water,W,H-water,'#37afcc');for(let i=0;i<65;i++){const x=((i*61-cam*.3-g.elapsed*6)%W+W)%W,y=water+5+(i%15)*7;rect(x,y,5+i%4*5,1,i%2?'#a9f1ee':'#68d8e5');if(i%5===0)rect(x+3,y+2,6,1,'#d1ffff')}
 hills(true,.32,147-cy*.15)
 }
 c.save();c.translate(-cam+(g.shake?Math.sin(g.elapsed*90)*2:0),-cy)
 // Waterfall ravines have their own foreground water, instead of invisible pits.
 for(const [a,b] of gaps){if(!visible(a,b-a))continue;if(cave){drawMarbleLava(c,a,ground(a)+72,b-a,1060,ticks);continue}const top=440;rect(a,top,b-a,940-top,cave?'#164257':'#198cbb');for(let x=a;x<b;x+=18){rect(x,top,7,940-top,cave?'#2d7e91':'#6ee1e6');rect(x+7,top,4,940-top,cave?'#67b4bb':'#bafaf0');for(let k=0;k<10;k++)rect(x,top+((k*40+g.elapsed*100)%(930-top)),12,3,cave?'#94dbd2':'#e0fff7')}rect(a,850,b-a,60,'#44d3dd');for(let k=0;k<10;k++)rect(a+((k*39+g.elapsed*24)%(b-a)),850+(k%3)*8,20,3,'#c4ffff')}
 for(const x of palms)if(visible(x,110)){if(cave)drawMarbleRuins(g,x);else palm(x,ground(x))}
 // Ground tiles are clipped to the continuous collision surface.
 c.save();c.beginPath();c.moveTo(cam-32,1120);for(let x=cam-32;x<=cam+W+32;x+=4)c.lineTo(x,inGap(x)?1050:ground(x));c.lineTo(cam+W+32,1120);c.closePath();c.clip();checker(cam-32,260,W+64,900);if(!cave){const facet=classicArt('terrain/facet');if(facet)for(let x=Math.floor((cam-256)/256)*256;x<cam+W+256;x+=256){const y=Math.ceil((ground(x+128)+28)/16)*16;c.drawImage(facet,x,y)}}c.restore()
 for(let x=Math.floor((cam-20)/4)*4;x<cam+W+20;x+=4)if(!inGap(x)){const y=ground(x);grass(x,y,5);if(x%32===0&&!cave&&!classicReady()){rect(x,y+35,2,28,'#8b4424');rect(x+6,y+59,12,2,'#b2662f')}}
 // Full circular track: the drawn inner edge is also the runner's physical path.
 for(const l of loopDefs){if(!visible(l.x,150))continue;c.drawImage(loopArt(l.r),l.x-l.r-31,l.base-l.r*2-31)}
 for(const p of g.platforms){if(p.kind==='capsule')continue;if((p.timer||0)>40)continue;const pos=platformPosition(p,g.clock);if(!visible(pos.x,p.w))continue;if(cave){drawMarblePlatform(g,p);continue}const shake=p.timer?Math.sin(g.elapsed*50)*2:0;c.save();c.translate(shake,0);if(p.kind==='moving'){rect(pos.x,pos.y,p.w,7,'#c79c68');rect(pos.x,pos.y+7,p.w,9,'#664e39');for(let x=pos.x+2;x<pos.x+p.w;x+=12){rect(x,pos.y+1,8,3,'#f6daa0');rect(x,pos.y+7,2,8,'#3e3e31')}rect(pos.x+8,pos.y+16,p.w-16,4,'#243f33')}else{c.save();c.beginPath();c.rect(pos.x,pos.y,p.w,p.h||35);c.clip();checker(pos.x,pos.y,p.w,p.h||35);c.restore();grass(pos.x,pos.y,p.w);if(!p.h){poly([[pos.x,pos.y+28],[pos.x+p.w*.3,pos.y+47],[pos.x+p.w*.7,pos.y+43],[pos.x+p.w,pos.y+28]],cave?'#353149':'#935326');rect(pos.x+8,pos.y+23,7,17,cave?'#5b536f':'#47822b');rect(pos.x+p.w-18,pos.y+24,6,16,cave?'#5b536f':'#47822b')}if(p.kind==='crumble'){poly([[pos.x+23,pos.y+18],[pos.x+32,pos.y+24],[pos.x+28,pos.y+31],[pos.x+38,pos.y+36]],'#603e23')}}c.restore()}
 for(const b of bridgeDefs){if(!visible(b.x,b.end-b.x))continue;if(cave){drawMarbleBridge(g,b);continue}c.strokeStyle='#5e472c';c.lineWidth=3;c.beginPath();for(let x=b.x;x<b.end;x+=8){const y=g.bridgeY(b,x);if(x===b.x)c.moveTo(x,y-28);else c.lineTo(x,y-28)}c.stroke();for(let x=b.x;x<b.end;x+=14){const y=g.bridgeY(b,x);if(classicDraw(c,'bridge/bri_Log',x+7,y+8)){if(Math.round((x-b.x)/14)%4===0){rect(x+4,y-29,3,29,'#b48d56');rect(x+4,y-29,3,4,'#f5d894')}continue}rect(x,y,13,7,'#bf7d3c');rect(x+1,y,11,2,'#f6cf84');rect(x+2,y+6,10,4,'#714f2c');if(Math.round((x-b.x)/14)%4===0){rect(x+4,y-29,3,29,'#b48d56');rect(x+4,y-29,3,4,'#f5d894')}}}
 for(const x of flowers){if(!visible(x)||inGap(x))continue;const y=ground(x);if(cave)continue;if(x%3){const image=flowerArt();c.drawImage(image,x-Math.floor(image.width/2),y-image.height)}else{for(let j=0;j<5;j++){const xx=x-10+j*5;poly([[xx,y],[xx-3,y-12-j%3*4],[xx+3,y-5]],'#137c3d');rect(xx,y-8,1,7,'#54ad3c')}}}
 if(cave)drawMarbleHazards(g)
 for(const s of spikeDefs){if(!visible(s.x,s.w))continue;const y=ground(s.x+s.w/2);if(classicReady()){for(let x=s.x+4;x<s.x+s.w;x+=16)classicDraw(c,'spikes/upright_1',x,y-16);continue}rect(s.x,y-6,s.w,6,'#748a9c');for(let x=s.x+1;x<s.x+s.w;x+=16){poly([[x,y-6],[x+7,y-27],[x+14,y-6]],'#d5e5ed');poly([[x+7,y-27],[x+7,y-6],[x+14,y-6]],'#6a879e');rect(x+6,y-16,2,9,'#ffffff')}}
 for(const s of springDefs){if(!visible(s.x))continue;const pressed=Math.abs(g.x-s.x)<28&&g.y<s.y-15&&g.y>s.y-70;const h=pressed?8:19;if(classicReady()){if(s.dir==='right'){c.save();c.translate(s.x,s.y-16);c.scale(-1,1);classicDraw(c,springFrame(g.springAnimations.get(s.x),true),0,0);c.restore()}else classicDraw(c,springFrame(g.springAnimations.get(s.x)),s.x,s.y-8);continue}rect(s.x-12,s.y-4,24,4,'#d2dbe0');for(let k=0;k<3;k++){rect(s.x-8,s.y-5-k*h/3,16,3,'#7d98b1');rect(s.x-6,s.y-6-k*h/3,12,1,'#e3eaf0')}rect(s.x-16,s.y-h-10,32,7,'#e83441');rect(s.x-15,s.y-h-10,30,2,'#ff9982');if(s.dir==='right')text('›',s.x-3,s.y-h-4,'#fff7c4',10)}
 for(const cp of checkpoints){if(!visible(cp))continue;const y=ground(cp);if(classicDraw(c,g.checkpoint>=cp?'checkpoint/red':'checkpoint/blue',cp,y-20)){if(g.level.caveArena&&cp===checkpoints.at(-1))text('BOSS CHECKPOINT',cp,y-92,'#bdf3d7',8,'center');if(g.checkpoint>=cp)sparkle(cp+17,y-77,3,'#fff2a1');continue}rect(cp-3,y-60,6,60,'#eef0e7');rect(cp+1,y-57,2,57,'#7b9ab2');c.fillStyle=g.checkpoint>=cp?'#f8da3a':'#428cef';c.beginPath();c.arc(cp,y-65,13,0,7);c.fill();rect(cp-5,y-70,5,5,'#ffffff');if(g.level.caveArena&&cp===checkpoints.at(-1))text('BOSS CHECKPOINT',cp,y-92,'#bdf3d7',8,'center');if(g.checkpoint>=cp)sparkle(cp+17,y-77,3,'#fff2a1')}
 for(const r of g.rocks){if(r.broken||!visible(r.x))continue;if(cave&&marbleDraw(c,'push/single',r.x,r.y-16))continue;if(classicDraw(c,'rock/rock',r.x,r.y-16))continue;poly([[r.x-24,r.y],[r.x-26,r.y-30],[r.x-12,r.y-47],[r.x+14,r.y-45],[r.x+27,r.y-25],[r.x+22,r.y]],'#a87d53');poly([[r.x-24,r.y-30],[r.x-12,r.y-47],[r.x+14,r.y-45],[r.x+2,r.y-30]],'#e4b47a');poly([[r.x+2,r.y-30],[r.x+14,r.y-45],[r.x+27,r.y-25],[r.x+22,r.y]],'#765a40');rect(r.x-13,r.y-24,6,3,'#765a40');rect(r.x-6,r.y-12,9,3,'#ca9861')}
 for(const m of g.monitors){if(!visible(m.x))continue;if(classicDraw(c,m.broken?'monitor/broken':monitorFrame(m.kind,ticks),m.x,m.y-15))continue;rect(m.x-16,m.y-5,32,5,'#74808f');if(m.broken){rect(m.x-13,m.y-11,26,7,'#485363');rect(m.x-10,m.y-14,5,4,'#9faab2');continue}rect(m.x-15,m.y-33,30,28,'#aab3b2');rect(m.x-12,m.y-30,24,20,'#273950');rect(m.x-10,m.y-28,20,16,'#132139');rect(m.x-12,m.y-7,24,2,'#e6eee1');if(m.kind==='rings')ring(m.x,m.y-20,5);if(m.kind==='shield'){c.strokeStyle='#74e5ff';c.lineWidth=2;c.beginPath();c.arc(m.x,m.y-20,7,0,7);c.stroke()}if(m.kind==='life'){rect(m.x-6,m.y-26,11,11,'#2674fc');rect(m.x,m.y-21,8,5,'#f4c68f')}if(m.kind==='shoes'){rect(m.x-7,m.y-23,7,4,'#ffffff');rect(m.x-8,m.y-19,17,5,'#ff4454');rect(m.x-8,m.y-14,17,2,'#ffffff')}if(m.kind==='invincible')sparkle(m.x,m.y-20,7,'#fff0ad');rect(m.x+9,m.y-8,2,2,'#e73836')}
 if(g.specialPortal){const p=g.specialPortal;c.save();c.translate(p.x,p.y);c.strokeStyle='#fff0a1';c.lineWidth=2;c.beginPath();c.ellipse(0,0,27+Math.sin(g.elapsed*8)*2,30,0,0,Math.PI*2);c.stroke();for(let i=0;i<8;i++){const a=g.elapsed*2+i*Math.PI/4;sparkle(Math.cos(a)*31,Math.sin(a)*33,3,i%2?'#fff8db':'#ffdb3f')}text('SPECIAL',0,-45,'#fff0a1',10,'center');c.restore()}
 for(const r of g.rings)if(!r.taken&&visible(r.x,15))ring(r.x,r.y,6,true)
 for(const e of g.enemies){if(!e.alive||!visible(e.x))continue;if(cave&&drawMarbleEnemy(g,e))continue;c.save();c.translate(Math.round(e.x),Math.round(e.y));if(e.kind==='bee')c.scale(g.x<e.x?-1:1,1);const frame=badnikFrame(e.kind,ticks,e.kind==='fish'&&e.y<=623);if(frame.flip)c.scale(-1,1);const fishStill=e.kind==='fish'&&e.y>623&&Math.cos((g.clock+e.phase)%2.9/2.9*Math.PI)<0;if(!classicDraw(c,fishStill?'fish/mouthshut':frame.name,0,-16))c.drawImage(enemyArt(e.kind,Math.floor(g.elapsed*8)%2),-26,-44);c.restore()}
 for(const b of g.bullets){rect(b.x-3,b.y-3,7,7,'#f34235');rect(b.x-1,b.y-1,3,3,'#fff3ad')}
 // Signpost spins only after crossing it, not just after walking near it.
 if(!g.level.bossArena&&!g.level.caveArena){const goalY=ground(LEVEL_END);if(classicReady()){const frames=[g.clearTimer<60?'eggman':'sonic','spin1','spin2','spin3'];classicDraw(c,'sign/'+(g.clearTimer?(g.clearTimer>120?'sonic':frames[Math.floor((g.clearTimer-1)/2)%4]):'eggman'),LEVEL_END,goalY-32)}else{rect(LEVEL_END-2,goalY-78,5,78,'#dee3dd');const signWidth=g.clearTimer?Math.max(3,Math.abs(Math.cos(g.elapsed*15))*46):46;rect(LEVEL_END-signWidth/2-2,goalY-91,signWidth+4,37,'#e7d7a8');rect(LEVEL_END-signWidth/2,goalY-89,signWidth,33,g.clearTimer?'#236ae1':'#e53d32');if(signWidth>30){if(g.clearTimer)text('SONIC',LEVEL_END,goalY-69,'#fff6ba',10,'center');else{rect(LEVEL_END-10,goalY-82,21,15,'#f4b383');rect(LEVEL_END-15,goalY-77,9,5,'#563f35');rect(LEVEL_END+7,goalY-77,9,5,'#563f35');rect(LEVEL_END-12,goalY-65,26,4,'#ffe7a0')}}}}
 drawBossScene(g);drawCaveBossScene(g)
 // Classic sprites supply the animation; never rotate the rolling image.
 if(g.invincible<=0||Math.floor(g.invincible/5)%2===0||g.deathTimer){
  c.save();c.translate(Math.round(g.x),Math.round(g.y));const angle=g.grounded?g.angle:0
  if(g.shield&&(!classicReady()||shieldFrame(ticks)>0)){c.save();c.translate(Math.sin(angle)*19,-Math.cos(angle)*19);if(!classicDraw(c,'shield/shield'+shieldFrame(ticks),0,0)){c.strokeStyle='#b0faff';c.lineWidth=2;c.beginPath();c.ellipse(0,0,23+Math.sin(g.elapsed*12)*2,25,0,0,7);c.stroke();c.strokeStyle='#368fea';c.beginPath();c.arc(0,0,20,g.elapsed*7,g.elapsed*7+3.5);c.stroke()}c.restore()}
  if(g.skidding){rect(-11,0,10,2,'#ffffff');rect(-18,-3,5,1,'#dae5e8')}
  if(g.spinDashing){c.scale(g.face,1);c.drawImage(classicArt(g.animation.frame,52,44,39)||spinDashArt(g.animation.cursor),-26,-40)}
  else if(g.ball||g.rolling){
   c.translate(Math.sin(angle)*14,-Math.cos(angle)*14);c.scale(g.face,1)
   if(!classicDraw(c,'sonic/'+g.animation.frame,0,0))c.drawImage(spinArt(Math.max(0,g.animation.cursor-1)%5),-18,-18)
  }else if(classicReady()){
   c.translate(Math.sin(angle)*19,-Math.cos(angle)*19);c.scale(g.animation.flipX?-1:1,g.animation.flipY?-1:1);classicDraw(c,'sonic/'+g.animation.frame,0,0)
  }else{
   c.scale(g.face,1);c.drawImage(sonicSide(Math.max(0,g.animation.cursor-1)%6,g.animation.mode==='motion'),-20,-43,42,44)
  }
  c.restore()
 }
 if(g.spinDashing){const x=g.x,y=g.y-53;text(`REV ${g.spinRevs}`,x,y-7,'#fff4bc',8,'center');rect(x-27,y,54,6,'#10243e');rect(x-26,y+1,52,4,'#47586c');rect(x-26,y+1,Math.max(2,g.spinCharge/8*52),4,g.spinCharge>6?'#fff0aa':'#68d8f1');if(g.spinCharge>6)sparkle(x+31,y+2,2,'#fff5a8')}
 if(g.starTime>0)for(let i=0;i<6;i++){const a=g.elapsed*7+i*Math.PI/3;sparkle(g.x+Math.cos(a)*27,g.y-18+Math.sin(a*1.2)*29,2+i%2,i%2?'#fff9df':'#ffdb4a')}
 if(g.skidding&&g.frame%3===0){rect(g.x-g.face*18,g.y-3,5,4,'#f6f0d8');rect(g.x-g.face*26,g.y-6,3,3,'#cedddd')}
 for(const p of g.particles){if(!visible(p.x))continue;c.globalAlpha=Math.min(1,p.life/20);if(p.kind==='ring'){if(p.life>90||Math.floor(p.life/6)%2===0)ring(p.x,p.y,6,true)}else if(p.kind==='spark'){sparkle(p.x,p.y,Math.max(1,3-p.age/15),p.color||'#fff6bf')}else if(p.kind==='smoke'){rect(p.x-4,p.y-4,8,8,p.age<15?'#fff1c1':'#cad2cd');rect(p.x-6,p.y-1,12,3,'#e0e4df')}else if(p.kind==='dust'){const image=dashDustArt(Math.floor(p.age/6));c.save();if(g.face<0){c.translate(p.x,p.y);c.scale(-1,1);c.drawImage(image,-17,3-image.height)}else c.drawImage(image,Math.floor(p.x)-17,Math.floor(p.y)+3-image.height);c.restore()}else{const original=classicArt((p.vx>0?'flicky/':'rabbit/')+(Math.floor(p.age/8)%2?'flap1':'flap2'));if(original)c.drawImage(original,p.x-original.width/2,p.y-original.height);else{rect(p.x-5,p.y-9,10,8,'#efd9bc');rect(p.x-5,p.y-17,3,10,'#fff0d5');rect(p.x+2,p.y-16,3,9,'#fff0d5');rect(p.x+4,p.y-8,2,2,'#152e45');rect(p.x-7,p.y-2,14,3,'#d3aa91')}}c.globalAlpha=1}
 for(const p of g.popups){c.globalAlpha=Math.min(1,p.life/20);text(p.text,p.x,p.y,'#fff4a4',10,'center');c.globalAlpha=1}
 c.restore()
 // Compact in-game HUD, sized for the actual screen rather than desktop only.
 const shade=c.createLinearGradient(0,0,0,92);shade.addColorStop(0,'#15396766');shade.addColorStop(1,'#15396700');c.fillStyle=shade;c.fillRect(0,0,W,92)
 const vals=[String(g.stats.score).padStart(6,'0'),`${Math.floor(g.stats.time/60)}:${String(g.stats.time%60).padStart(2,'0')}`,String(g.stats.rings).padStart(3,'0')];['SCORE','TIME','RINGS'].forEach((s,i)=>{text(s,16,26+i*21,i===2&&g.stats.rings===0&&g.frame%40<20?'#ffae73':'#ffe343',16);text(vals[i],89,26+i*21,'#fff9e9',16)})
 text('SONIC',16,H-15,'#fff9e9',12);text('× '+g.stats.lives,90,H-15,'#ffe34d',12)
 if(g.stats.power)text(g.stats.power,W-16,H-15,'#b7fbff',11,'right')
 if(g.mode==='playing'&&g.intro>0){const enter=Math.min(1,(150-g.intro)/18),leave=Math.min(1,g.intro/18),offset=(1-Math.min(enter,leave))*W;rect(W-270+offset,112,270,67,'#132e5fe8');rect(W-270+offset,112,5,67,'#ffe244');text(g.level.zoneName.toUpperCase(),W-23+offset,139,'#fff4d4',23,'right');text(`ZONE    ACT ${g.level.zoneAct}`,W-24+offset,163,'#ffe244',16,'right')}
 if(!g.activeArena)text(`ACT ${g.level.zoneAct}`,W-16,26,'#fff1c1',11,'right')
 drawBossHUD(g);drawCaveBossHUD(g)
 if(g.clearTimer>45){rect(W/2-155,H/2-39,310,60,'#133368dd');text(g.act===4?'SENTINEL SHATTERED':g.act===3?'EGGMAN DEFEATED':'SONIC GOT THROUGH',W/2,H/2-14,'#fff0ca',20,'center');text(`${g.level.zoneName.toUpperCase()} - ACT ${g.level.zoneAct}`,W/2,H/2+9,'#ffdf3f',15,'center')}
}
