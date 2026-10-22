import { marbleArt, marbleDraw, marbleTile, drawMarbleDrop, drawMarbleVent } from './marble-art'
import { pixelText } from './pixel-art'
import type { SonicGame } from './game'
/** A custom temple guardian assembled from native Marble ruins and block artwork. */
export function drawCaveBossScene(g:SonicGame){const b=g.caveBoss;if(!b)return;const c=g.ctx,a=b.arena,ticks=Math.round(g.clock*60),r=(x:number,y:number,w:number,h:number,color:string)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h)};
 if(!b.active){if(a.left>g.camera-80&&a.left<g.camera+g.viewW+150){pixelText(c,'SENTINEL AHEAD',a.left-70,g.level.ground(a.left)-96,'#ffff92',8,'center');marbleDraw(c,'pillar/short',a.left,g.level.ground(a.left)-56)}return}
 for(const x of[a.left,a.right])marbleDraw(c,'pillar/short',x,g.level.ground(x)-56)
 for(const v of b.vents)drawMarbleVent(g,v.x,g.level.ground(v.x),b.phase==='steam-warning'&&v.selected,b.phase==='steam'&&v.selected,ticks);
 for(const d of b.drops){if(d.landed)continue;const floor=g.level.ground(d.x);if(b.phase==='lock'){r(d.x-24,floor-3,48,2,'#ffdb49');for(let y=d.origin;y<floor-14;y+=14)r(d.x,y,1,5,'#b6926d');pixelText(c,'!',d.x,floor-48,'#ffff92',16,'center')}drawMarbleDrop(g,d.x,d.y,d.origin,b.phase==='lock')}
 if(b.phase==='defeated'||b.phase==='cleared'){const t=b.phase==='cleared'?150:b.time;for(let i=0;i<12;i++){const x=b.x+Math.sin(i*2.4)*(25+t*.65),y=Math.min(g.level.ground(x)-8,a.floor-80-Math.cos(i)*25-t*.4+t*t*.004);marbleDraw(c,'brick',x,y)}r(b.x-48,a.floor-9,96,8,'#49246d');return}
 const rise=b.phase==='intro'?Math.max(0,1-b.time/100)*64:0,base=a.floor+rise;
 c.save();c.beginPath();c.rect(b.x-100,a.floor-180,200,181);c.clip();const temple=marbleArt('temple');if(temple)c.drawImage(temple,b.x-80,base-temple.height);else{c.fillStyle=c.createPattern(marbleTile(),'repeat')!;c.fillRect(b.x-64,base-128,128,128)}
 r(b.x-27,base-66,54,57,'#240024');if(b.vulnerable){r(b.x-23,base-61,46,49,'#920000');r(b.x-16,base-57,32,42,'#ff4900');r(b.x-10,base-50,20,30,'#ffdb00');r(b.x-4,base-43,8,17,'#ffffb6');marbleDraw(c,'fire/vertical'+(Math.floor(ticks/6)%2+1),b.x,base-21)}else{marbleDraw(c,'push/single',b.x-16,base-48);marbleDraw(c,'push/single',b.x+16,base-48);marbleDraw(c,'push/single',b.x-16,base-16);marbleDraw(c,'push/single',b.x+16,base-16);r(b.x-2,base-61,4,48,b.enraged?'#ff9200':'#b6dbb6')}
 if(b.hitTime>50){c.globalAlpha=.5;r(b.x-65,base-116,130,110,'#ffffb6');c.globalAlpha=1}c.restore()
}
export function drawCaveBossHUD(g:SonicGame){const b=g.caveBoss;if(!b?.active)return;const c=g.ctx,W=g.viewW,H=g.viewH,small=g.canvas.clientWidth>0&&g.canvas.clientWidth<550;pixelText(c,'MARBLE SENTINEL',W-16,24,'#ffff92',16,'right');for(let i=0;i<6;i++){const x=W-16-6*14+i*14;c.fillStyle=i<b.hp?'#b6dbb6':'#49246d';c.fillRect(x,32,11,11);if(i<b.hp){c.fillStyle='#ffffdb';c.fillRect(x+1,33,9,2);c.fillStyle='#496d49';c.fillRect(x+2,40,8,2)}}
 const color=b.vulnerable?'#ffff92':b.phase==='lock'||b.phase==='steam-warning'?'#ffdb92':'#dbb6ff';c.fillStyle='#240024eb';c.fillRect(W/2-230,81,460,46);c.fillStyle=color;c.fillRect(W/2-230,81,3,46);pixelText(c,b.cue,W/2,103,color,16,'center');c.fillStyle='#49246d';c.fillRect(W/2-99,115,198,3);c.fillStyle=color;c.fillRect(W/2-99,115,Math.max(1,198*(1-Math.min(1,b.time/b.duration))),3);
 if(b.hp>0){pixelText(c,b.vulnerable?'ROLL THROUGH THE FIERY CORE':'ROLL DOWN A BANK TO BUILD SPEED',W/2,H-(small?62:42),'#ffffdb',small?16:8,'center');pixelText(c,'OR HOLD DOWN + TAP JUMP TO REV',W/2,H-(small?41:28),'#dbb6ff',small?16:8,'center')}
}
