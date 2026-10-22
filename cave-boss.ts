import type { BossArena } from './acts'
export type WardenPhase='waiting'|'intro'|'lock'|'fall'|'steam-warning'|'steam'|'open'|'stagger'|'defeated'|'cleared'
export type WardenDrop={x:number;y:number;origin:number;vy:number;landed:boolean}
/** Telegraphs, hazards and openings share one fixed-step clock. No random attacks. */
export class CrystalWarden {
 phase:WardenPhase='waiting';hp=6;time=0;totalTime=0;cycle=0;hitTime=0;touchCooldown=0;drops:WardenDrop[]=[];ventSide=1
 arena:BossArena
 constructor(arena:BossArena){this.arena=arena}
 get active(){return this.phase!=='waiting'}
 get x(){return this.arena.center}
 get y(){return this.arena.floor-39}
 get enraged(){return this.hp<=3}
 get vulnerable(){return this.phase==='open'}
 get dangerous(){return ['lock','fall','steam-warning','steam','open'].includes(this.phase)}
 get vents(){return [-230,-145,145,230].map(offset=>({x:this.x+offset,selected:Math.sign(offset)===this.ventSide}))}
 get duration(){switch(this.phase){case'intro':return 150;case'lock':return this.enraged?60:78;case'fall':return 86;case'steam-warning':return this.enraged?48:66;case'steam':return 72;case'open':return this.enraged?160:180;case'stagger':return 90;case'defeated':return 150;default:return 1}}
 get cue(){switch(this.phase){case'intro':return 'MARBLE SENTINEL AWAKENS';case'lock':return 'FALLING BLOCKS - KEEP MOVING';case'fall':return 'FALLING BLOCKS - DODGE THE FALL';case'steam-warning':return 'FIRE WARNING - LEAVE THE VENTS';case'steam':return 'FIRE GEYSERS - JUMP CLEAR';case'open':return 'CORE OPEN - ROLL AT SPEED';case'stagger':return this.enraged?'ARMOR CRACKED - FASTER ATTACKS':'CORE CRACKED - BACK TO A BANK';case'defeated':return 'SENTINEL SHATTERED!';case'cleared':return 'MARBLE ZONE RESTORED';default:return ''}}
 enter(){this.phase='intro';this.time=0;this.totalTime=0;this.hp=6;this.cycle=0;this.hitTime=0;this.drops=[]}
 setPhase(phase:WardenPhase){this.phase=phase;this.time=0}
 lock(playerX:number){this.cycle++;this.ventSide=this.cycle%2?1:-1;const a=this.arena,target=Math.max(a.left+24,Math.min(a.right-24,playerX)),toward=target<this.x?1:-1;this.drops=[0,94,188].map(offset=>({x:Math.max(a.left+30,Math.min(a.right-30,target+offset*toward)),y:a.floor-270,origin:a.floor-270,vy:1,landed:false}));this.setPhase('lock')}
 step(dt:number,playerX:number){if(!this.active)return;this.time+=dt;this.totalTime+=dt;this.hitTime=Math.max(0,this.hitTime-dt);this.touchCooldown=Math.max(0,this.touchCooldown-dt)
  if(this.phase==='fall')for(const d of this.drops)if(!d.landed){d.vy=Math.min(12,d.vy+.3*dt);d.y+=d.vy*dt}
  if(this.time<this.duration)return
  switch(this.phase){case'intro':case'stagger':this.lock(playerX);break;case'lock':this.setPhase('fall');break;case'fall':this.drops=[];this.setPhase('steam-warning');break;case'steam-warning':this.setPhase('steam');break;case'steam':this.setPhase('open');break;case'open':this.lock(playerX);break;case'defeated':this.setPhase('cleared');break}
 }
 hit(speed:number,spinning:boolean){if(!this.vulnerable||!spinning||Math.abs(speed)<7)return false;this.hp--;this.hitTime=70;this.drops=[];this.setPhase(this.hp===0?'defeated':'stagger');return true}
}
