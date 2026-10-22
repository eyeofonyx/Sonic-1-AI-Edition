import { TailsCompanion } from './tails-companion'
import { CharacterMotion } from './character-motion'
import { leadCharacter, type Character, type CharacterChoice } from './characters'
import { DROP_CHARGE_FRAMES, dropDashSpeed, SuperSoundCode, EmeraldSoundCode } from './sonic-abilities'
import { resolveFinalCylinders } from './final-cylinders'
import { stepStarLightDrop, stepStarLightBall } from './starlight-seesaw'
import { resetFinale, stepFinaleZone, collideFinale, stepFinalEnemy, stepFinalBoss } from './finale-mechanics'
import { resetZone, updateZone, collideZone, stepZoneEnemy, type ZoneState } from './zone-mechanics'
import { ScoreTally } from './score-tally'
import { SonicGame } from './game'
import { levelFor, actLevels } from './acts'
import { createOriginalLevel } from './original-levels'
import { platformPosition, platformTop, type Platform } from './level'
import { SONIC_PHYSICS as P, surface, fixed, groundStep, slopeStep, airStep, landingSpeed, decayDash, dashSpeed, jumpGravity } from './sonic-physics'
import { OriginalMusic, type Track, type Jingle } from './original-music'
import { OriginalEffects, type GameSound, type Effect } from './original-effects'
export class OriginalSonicGame extends SonicGame{
 private peelQueued=false
 character:Character='sonic'
 characterMotion=new CharacterMotion(this)
 get characterAbility(){return this.characterMotion?.ability||'normal'}
 duoMode=false
 tailsAI=new TailsCompanion(this)
 get characterChoice():CharacterChoice{return this.duoMode?'sonic-tails':this.character}
 configureCharacter(choice:CharacterChoice){this.duoMode=choice==='sonic-tails';this.character=leadCharacter(choice);this.tailsAI?.reset()}
 selectCharacter(choice:CharacterChoice){if(choice===this.characterChoice)return;this.configureCharacter(choice);this.restart()}
 override update(dt:number){if(this.mode!=='playing')return;super.update(dt);if(this.mode==='playing')this.tailsAI?.step(dt)}
 emeraldCount=0
 superCheat=false
 superSonic=false
 superTransform=0
 superTicks=0
 private superRingTimer=0
 emeraldBonusUnlocked=false
 private bonusCode=new EmeraldSoundCode()
 private soundCode=new SuperSoundCode()
 private dropReleased=false
 private dropQueued=false
 get superAvailable(){return this.emeraldCount>=6||this.superCheat}
 get canSuper(){return this.character==='sonic'&&this.superAvailable&&!this.superSonic&&this.stats.rings>=50&&this.mode==='playing'&&!this.grounded&&this.ownJump&&this.ball&&!this.deathTimer&&!this.clearTimer&&!this.goalTime&&!this.giantTaken&&!this.hurtState&&!this.controlLock&&!this.zoneState?.current&&!this.zoneState?.sliding&&!this.finaleState?.tube&&!this.finaleState?.trap}
 registerSoundCode(id:number){const bonus=this.bonusCode.play(id)&&!this.emeraldBonusUnlocked,superForm=this.soundCode.play(id)&&!this.superCheat;if(bonus)this.emeraldBonusUnlocked=true;if(superForm)this.superCheat=true;if(bonus||superForm){this.emit();this.previewAudio('emerald')}return superForm}
 transformSuper(){if(!this.canSuper)return false;this.cancelSpinDash();this.superSonic=true;this.superTransform=40;this.superTicks=0;this.superRingTimer=0;this.keys.clear();this.jumpBuffer=0;this.jumpLatch=false;this.vx=this.vy=this.groundSpeed=0;this.ball=this.rolling=this.ownJump=this.rollJump=false;this.platform=null;this.animation.reset();this.sfx('special-enter');this.emit();return true}
 endSuper(){this.superSonic=false;this.superTransform=0;this.superTicks=0;this.superRingTimer=0}
 cancelDropDash(){this.dropCharging=false;this.dropCharge=0;this.dropQueued=false;this.dropReleased=false;this.audioEffects?.stopGroup('drop')}
 private stepDropDash(jump:boolean){if(this.grounded||!this.ownJump||!this.ball||this.hurtState||this.deathTimer||this.zoneState.sliding||this.zoneState.current||this.finaleState.tube||this.finaleState.trap){this.cancelDropDash();return}if(!jump){this.cancelDropDash();this.dropReleased=true;return}if(this.dropQueued){this.dropQueued=false;this.dropCharging=true;this.dropCharge=0}if(this.dropCharging){const before=this.dropCharge;this.dropCharge=Math.min(DROP_CHARGE_FRAMES,this.dropCharge+1);if(before<DROP_CHARGE_FRAMES&&this.dropCharge===DROP_CHARGE_FRAMES){this.audioEffects.attach(this.audio,this.sound);this.audioEffects.play('drop-charge',1,'drop');this.emit()}}}
 private landDropDash(left:boolean,right:boolean){if(!this.dropCharging)return;const ready=this.dropCharge>=DROP_CHARGE_FRAMES&&!this.hurtState&&!this.deathTimer&&!this.clearTimer&&!this.giantTaken&&!this.zoneState.sliding&&!this.zoneState.current;this.cancelDropDash();if(!ready)return;if(left!==right)this.face=right?1:-1;const s=surface(this.angle);this.groundSpeed=dropDashSpeed(this.groundSpeed,this.vx,this.angle,this.face,this.superSonic,this.underwater);this.vx=fixed(this.groundSpeed*s.cos);this.groundVX=this.vx;this.vy=fixed(this.groundSpeed*s.sin);this.rolling=this.ball=true;this.ownJump=false;this.dropFlash=30;this.dashDust(true);this.sfx(this.superSonic?'peel-release':'dash-release');this.emit()}
 finaleState=resetFinale()
 get canPeel(){return this.character==='sonic'&&this.mode==='playing'&&this.grounded&&!this.hurtState&&!this.deathTimer&&!this.clearTimer&&!this.giantTaken&&!this.spinDashing&&!this.controlLock&&Math.abs(this.groundSpeed)<.5&&Math.abs(this.angle)<Math.PI/4&&!this.zoneState?.sliding&&!this.zoneState?.current}
 override press(key:string){key=key.length===1?key.toLowerCase():key;if(this.mode!=='playing'||this.deathTimer||this.clearTimer||this.giantTaken||this.superTransform>0)return;if(key==='x'){this.transformSuper();return}if(this.character!=='sonic'&&[' ','w','z'].includes(key)&&!this.keys.has(key)&&![' ','w','z'].some(k=>this.keys.has(k))&&!this.grounded&&(this.characterAbility!=='normal'||this.ownJump&&this.characterMotion.released&&!this.characterMotion.used)){this.keys.add(key);this.characterMotion.queued=true;this.characterMotion.released=false;this.jumpBuffer=0;return}if(this.character==='sonic'&&[' ','w','z'].includes(key)&&!this.keys.has(key)&&![' ','w','z'].some(k=>this.keys.has(k))&&!this.grounded&&this.ownJump&&this.ball&&this.dropReleased){this.keys.add(key);this.dropQueued=true;this.dropReleased=false;this.jumpBuffer=0;return}if(key==='ArrowUp'){this.keys.add(key);return}if([' ','w','z'].includes(key)&&!this.keys.has(key)&&this.keys.has('ArrowUp')&&!this.keys.has('ArrowDown')&&!this.keys.has('s')&&this.canPeel){this.keys.add(key);this.peelQueued=true;this.jumpBuffer=0;return}super.press(key)}
 togglePeelOut(){if(this.peelCharging){this.release('ArrowUp');this.release(' ')}else if(this.canPeel){this.press('ArrowUp');this.press(' ')}}
 override release(key:string){key=key.length===1?key.toLowerCase():key;super.release(key);if([' ','w','z'].includes(key)&&![' ','w','z'].some(k=>this.keys.has(k))){if(!this.grounded&&this.ownJump)this.characterMotion.released=true;this.cancelDropDash();if(!this.grounded&&this.ownJump)this.dropReleased=true}}
 cancelPeelOut(){const active=this.peelCharging||this.peelQueued;this.peelCharging=false;this.peelCharge=0;this.peelFlash=0;this.peelQueued=false;this.audioEffects?.stopGroup('peel');if(active){this.jumpBuffer=0;this.jumpLatch=[' ','w','z'].some(k=>this.keys.has(k));this.animation.reset()}}
 tally:ScoreTally|null=null
 goalTime=0
 signpostY:number|null=null
 giantTaken=false
 giantFlash=0
 zoneState!:ZoneState
 checkpointId=0
 private ringLifeFlags=0
 private actEntry={score:0,lives:3}
 zoneCheckpoint:{x:number;y:number;time:number;clock:number;id:number;platforms:Platform[];water:number;target:number;phase:number;switches:number[];layout:number[]}|null=null
 get underwater(){return this.zoneState?.underwater||false}
 get waterLevel(){return this.zoneState?.water??Infinity}
 saveZoneCheckpoint(y=this.y){this.zoneCheckpoint={x:this.checkpoint,y,time:this.elapsed,clock:this.clock,id:this.checkpointId,platforms:this.platforms.map(p=>({...p,profile:p.profile?[...p.profile]:undefined})),water:this.zoneState.water,target:this.zoneState.target,phase:this.zoneState.phase,switches:[...this.switches],layout:[...this.world.map.layout]}}
 get giantRings(){return !this.boss&&this.specialAvailable&&this.stats.rings>=50&&!this.giantTaken?this.world.map.objects.filter(o=>o[2]===0x4b):[]}
 get giantRing(){return this.giantRings.sort((a,b)=>Math.abs(a[1]-this.y+18)-Math.abs(b[1]-this.y+18))[0]}
 addScore(points:number){const before=Math.floor(this.stats.score/50000);this.stats.score+=points;const lives=Math.floor(this.stats.score/50000)-before;if(lives>0){this.stats.lives+=lives;this.sfx('life')}}
 override addRings(n:number){this.stats.rings+=n;this.addScore(n*10);for(const [threshold,flag]of[[100,1],[200,2]])if(this.stats.rings>=threshold&&!(this.ringLifeFlags&flag)){this.ringLifeFlags|=flag;this.stats.lives++;this.popup('1 UP!');this.sfx('life')}this.ringSound()}
 override smashMonitor(m:Parameters<SonicGame['smashMonitor']>[0]){
  if(m.broken)return;m.broken=true;this.addScore(100);this.burst(m.x,m.y-20,'smoke');this.sfx('destroy');
  if(m.kind==='rings'){this.addRings(10);this.popup('+10 RINGS',m.x,m.y-50)}
  if(m.kind==='shield'){this.shield=true;this.sfx('shield');this.popup('SHIELD',m.x,m.y-50)}
  if(m.kind==='shoes'){this.shoeTime=1200;this.popup('SPEED SHOES',m.x,m.y-50)}
  if(m.kind==='invincible'){this.starTime=1200;this.popup('INVINCIBLE',m.x,m.y-50)}
  if(m.kind==='life'){this.stats.lives++;this.sfx('life');this.popup('1 UP!',m.x,m.y-50)}
  if(this.vy>0)this.vy=-6
 }
 finishTally(){if(!this.tally||this.tally.done)return;this.addScore(this.tally.finish());this.sfx('score-total');this.emit()}
 protected beginClear(){if(this.clearTimer)return;this.endSuper();this.jingle=null;this.jingleMusic?.reset();this.cancelSpinDash();this.clearTimer=1;this.tally=new ScoreTally(this.stats.time,this.stats.rings);this.vx=0;this.emit()}
 override emit(){this.stats.duoMode=this.duoMode||false;this.stats.tailsStatus=this.duoMode?this.tailsAI?.status:undefined;this.stats.character=this.character||'sonic';this.stats.characterAbility=this.characterAbility;this.stats.flightRemaining=(this.characterMotion?.ticks||0)/480;this.stats.emeraldBonusUnlocked=this.emeraldBonusUnlocked;this.stats.dropCharging=this.dropCharging;this.stats.dropCharge=this.dropCharge/DROP_CHARGE_FRAMES;this.stats.dropLaunched=this.dropFlash>0;this.stats.superSonic=this.superSonic;this.stats.superTransforming=this.superTransform>0;this.stats.superAvailable=this.superAvailable;this.stats.superCheat=this.superCheat;this.stats.canSuper=this.canSuper;this.stats.ending=this.finaleState?.ending||false;this.stats.tally=this.tally?{time:this.tally.time,ring:this.tally.ring,total:this.tally.total,done:this.tally.done}:undefined;this.stats.canPeel=this.canPeel;this.stats.peelCharging=this.peelCharging;this.stats.peelCharge=this.peelCharge/30;this.stats.peelLaunched=this.peelFlash>0;this.stats.underwater=this.underwater;this.stats.airSeconds=Math.ceil((this.zoneState?.air??1800)/60);this.stats.waterLevel=this.waterLevel;super.emit()}
 nativeMusic=new OriginalMusic()
 audioEffects=new OriginalEffects()
 jingleMusic=new OriginalMusic()
 previewMusic=new OriginalMusic()
 private bonusJingle=false
 private jingle:Jingle|null=null
 private previewTrack:Track|null=null
 private ringSide=1
 audioRoomOpen=false
 focusSuspended=false
 ringStyle:'original'|'egc'='original'
 override wake(){this.focusSuspended=false;super.wake();this.audioEffects?.attach(this.audio,this.sound);this.nativeMusic?.warm(this.audio)}
 override setSound(value:boolean){super.setSound(value);this.audioEffects?.attach(this.audio,value);if(!value){this.nativeMusic?.pause();this.jingleMusic?.pause();this.previewMusic?.pause()}else if(this.previewTrack)this.previewMusic.sync(this.audio,true,this.previewTrack)}
 override cancelSpinDash(){super.cancelSpinDash();this.characterMotion?.cancel();this.cancelPeelOut();this.cancelDropDash();this.audioEffects?.stopGroup('charge')}
 override dashSound(revs:number,launch=false){if(launch)this.audioEffects.stopGroup('charge');this.audioEffects.attach(this.audio,this.sound);this.audioEffects.play(launch?'dash-release':'dash-charge',launch?1:Math.pow(Math.max(1,revs),1/6),'charge')}
 override ringSound(){if(this.ringStyle==='egc'){super.ringSound();return}this.audioEffects.attach(this.audio,this.sound);this.audioEffects.play('ring',1,this.ringSide>0?'ring-left':'ring-right',.65*(this.ringSide*=-1))}
 override sfx(name:GameSound){if(!this.sound)return;if(name==='life'||name==='emerald'){this.bonusJingle=this.renderSuspended;this.jingle=name;this.jingleMusic.reset();this.nativeMusic.pause();this.jingleMusic.sync(this.audio,true,name);return}this.audioEffects.attach(this.audio,this.sound);this.audioEffects.play(name==='death'&&this.zoneState?.drowning?'drown':name,1,name==='skid'?'skid':'')}
 syncBonusJingle(playing:boolean){if(this.bonusJingle&&this.jingle)this.jingleMusic.sync(this.audio,this.sound&&playing,this.jingle)}
 endBonusAudio(){if(this.bonusJingle){this.jingle=null;this.bonusJingle=false;this.jingleMusic.reset()}}
 previewAudio(name:Effect|Track){this.wake();this.stopPreviewAudio();if(!this.sound)return;if(['hill','marble','boss','clear','invincible','life','over','emerald','title','special','spring','labyrinth','drowning','starlight','scrap','final','ending','credits','super','emeraldhill','s2boss','s2clear'].includes(name)){this.previewTrack=name as Track;this.previewMusic.sync(this.audio,true,this.previewTrack)}else this.audioEffects.play(name as Effect,1,'preview')}
 stopPreviewAudio(){this.previewTrack=null;this.previewMusic.reset();this.audioEffects.stopGroup('preview');this.audioEffects.lastPlayed=null}
 get previewStatus(){return this.previewTrack?this.previewMusic.status:this.audioEffects.error?'unavailable':this.audioEffects.lastPlayed?'played':'ready'}
 switches=new Set<number>()
 fires:{x:number;y:number;vx:number;vy:number;life:number;landed:boolean;boss?:boolean;seesawX?:number;returning?:boolean}[]=[]
 private fired=new Map<number,number>()
 get world(){return this.level.original!}
 override reset(preserve=false){
  super.reset(preserve);this.tailsAI?.reset();this.characterMotion?.reset();this.endSuper();this.dropFlash=0;this.tally=null;this.bonusJingle=false;this.goalTime=0;this.signpostY=null;this.giantTaken=false;this.giantFlash=0
  const template=levelFor(this.act).original!
  this.level=createOriginalLevel(template.zone,template.map,this.act)
  this.platforms=this.level.makePlatforms();this.rings=this.level.makeRings();this.enemies=this.level.makeEnemies();this.monitors=this.level.makeMonitors()
  this.x=this.world.map.start[0];this.y=this.world.map.start[1]+19;this.world.focusY=this.y
  const floor=this.world.floor(this.x,this.y-8,this.y+16);if(floor){this.y=floor.y;this.angle=floor.angle;this.grounded=true}else this.grounded=false
  this.checkpoint=this.x;this.viewW=320;this.viewH=224;this.camera=Math.max(0,this.x-120);this.cameraY=Math.max(0,Math.min(this.level.zoneName==='Green Hill'?768:this.world.height-224,this.y-192));this.nativeMusic?.reset();this.jingleMusic?.reset();this.previewMusic?.reset();this.audioEffects?.stopAll();this.jingle=null;this.previewTrack=null;this.switches?.clear();this.fired?.clear();if(this.fires)this.fires=[];this.finaleState=resetFinale();this.zoneState=resetZone(this);this.zoneCheckpoint=null;this.checkpointId=0;this.ringLifeFlags=0;this.actEntry={score:this.stats.score,lives:this.stats.lives}
 }
 override start(){if(this.mode==='paused'){this.mode='playing';this.wake();this.emit();return}if(this.bossPractice){this.practiceBoss(this.act as 3|6|9|12|15|19);return}if(this.mode==='won'&&this.act<actLevels.length){this.nextAct();return}if(this.mode==='won'){this.act=1;this.completedActs=[]}this.reset();this.mode='playing';this.wake();this.emit()}
 override practiceBoss(act:3|4|6|9|12|15|19=3){this.act=act===4?6:act;this.reset();this.bossPractice=true;const a=this.level.bossArena!;this.x=a.left+40;this.y=this.floorAt(this.x,a.floor-32).y;if(!Number.isFinite(this.y))this.y=a.floor;if(a.kind==='chase'){this.zoneState.phase=4;this.zoneState.water=1672;this.switches.add(8)}this.grounded=true;this.checkpoint=this.x;this.saveZoneCheckpoint();this.stats.rings=a.kind==='final'?0:12;this.intro=0;this.mode='playing';this.boss!.enter();this.camera=a.left;this.cameraY=a.floor-192;this.wake();this.emit()}
 override restart(){if(this.bossPractice){this.practiceBoss(this.act as 3|6|9|12|15|19);return}const entry=this.actEntry;this.reset();this.actEntry=entry;this.stats.score=entry.score;this.stats.lives=entry.lives;this.mode='playing';this.wake();this.emit()}
 override pause(){const motion=this.characterMotion,ability=motion.ability,lift=motion.lift,ticks=motion.ticks,preserve=this.mode==='playing'&&(ability==='flight'||ability==='tired'||ability==='climb');if(this.mode==='playing'){this.jumpBuffer=0;this.jumpLatch=false}super.pause();if(preserve){motion.ability=ability;motion.lift=lift;motion.ticks=ticks;this.emit()}if(this.mode==='playing')this.wake();else{this.nativeMusic?.pause();this.jingleMusic?.pause();this.audioEffects?.stopAll()}}
 get stageTrack():Track{return this.level.theme==='final'?'final':this.level.theme==='starlight'?'starlight':this.level.theme==='scrap'||this.world.zone==='sbz3'?'scrap':this.level.theme==='marble'?'marble':this.level.theme==='spring'?'spring':this.level.theme==='labyrinth'?'labyrinth':'hill'}
 get fightTrack():Track{return this.boss?.arena.kind==='final'?'final':'boss'}
 get clearTrack():Track{return 'clear'}
 override music(){
  this.audioEffects.attach(this.audio,this.sound)
  if(this.previewTrack)this.previewMusic.sync(this.audio,this.sound&&!this.focusSuspended,this.previewTrack)
  const playing=this.sound&&!this.focusSuspended&&!this.renderSuspended&&!this.audioRoomOpen&&(this.mode==='playing'||this.mode==='over'),track:Track=this.mode==='over'?'over':this.clearTimer?this.clearTrack:this.underwater&&(this.zoneState?.air??1800)<=720?'drowning':this.superSonic?'super':this.starTime>0?'invincible':this.boss?.active&&this.boss.hp>0?this.fightTrack:this.stageTrack
  if(this.mode==='over'||this.deathTimer||track==='drowning'){this.jingle=null;this.jingleMusic.reset()}
  if(this.jingle&&(this.jingleMusic.finished||this.jingleMusic.error)){this.jingle=null;this.jingleMusic.reset()}
  let player=this.nativeMusic
  if(this.jingle){this.nativeMusic.pause();this.jingleMusic.sync(this.audio,playing,this.jingle);player=this.jingleMusic}else{this.jingleMusic.pause();this.nativeMusic.sync(this.audio,playing&&!this.deathTimer,track)}
  const status=this.sound?player.status:'muted',title=player.title;if(status!==this.stats.musicStatus||title!==this.stats.musicTitle){this.stats.musicStatus=status;this.stats.musicTitle=title;this.emit()}
 }
 override get activeArena(){return this.boss?.active&&this.boss.phase!=='escaped'&&this.boss.arena.kind!=='chase'?this.boss.arena:null}
 override hurt(sourceX:number){if(this.superSonic)return;const wasHurt=this.hurtState;super.hurt(sourceX);if(this.underwater&&!wasHurt&&this.hurtState&&!this.deathTimer){this.vx*=.5;this.vy*=.5}}
 override die(){this.endSuper();const dying=!!this.deathTimer;super.die();if(!dying&&this.zoneState?.drowning){this.deathTimer=180;this.vy=0}}
 override respawn(){
  const cp=this.checkpoint,lives=this.stats.lives,score=this.stats.score,practice=this.bossPractice,act=this.act,entry=this.actEntry,snapshot=this.zoneCheckpoint?.x===this.checkpoint?this.zoneCheckpoint:null
  if(lives<=0){this.mode='over';this.deathTimer=0;this.nativeMusic.pause();this.emit();return}
  this.reset();this.actEntry=entry;this.act=act;this.stats.lives=lives;this.stats.score=score;this.checkpoint=cp;this.x=cp;if(snapshot&&snapshot.x===cp){this.zoneState.water=snapshot.water;this.zoneState.target=snapshot.target;this.zoneState.phase=snapshot.phase;this.switches=new Set(snapshot.switches);(this.world.map.layout as number[]).splice(0,this.world.map.layout.length,...snapshot.layout);this.zoneCheckpoint=snapshot;this.checkpointId=snapshot.id;this.clock=snapshot.clock;this.platforms=snapshot.platforms.map(p=>({...p,profile:p.profile?[...p.profile]:undefined}));this.elapsed=snapshot.time;this.stats.time=Math.floor(this.elapsed)}
  const marker=this.world.map.objects.find(o=>o[2]===0x79&&o[0]===cp),a=this.level.bossArena
  const y=snapshot?.y??(marker?marker[1]:practice&&a?a.floor:this.world.map.start[1]+19)
  this.y=this.floorAt(cp,y-32).y;if(!Number.isFinite(this.y))this.y=y;this.world.focusY=this.y;this.grounded=true;this.invincible=140;this.mode='playing';this.intro=0;this.camera=Math.max(0,cp-100);this.cameraY=Math.max(0,Math.min(this.world.height-224,this.y-160))
  if(practice)this.bossPractice=true
  this.emit()
 }
 override floorAt(x:number,previousY:number,reach=8){
  const terrain=this.world.floor(x,previousY-reach,Math.min(this.world.height,previousY+1024));let floor=terrain?.y??Infinity,platform:Platform|null=null,bridge=false
  for(const b of this.level.bridgeDefs)if(x>=b.x&&x<=b.end&&previousY<=b.y+reach&&b.y<floor){floor=b.y;bridge=true}
  for(const p of this.platforms){if(p.inactive||(p.timer||0)>40)continue;const pos=platformPosition(p,this.clock),top=platformTop(p,x,this.clock);if(x>pos.x-8&&x<pos.x+p.w+8&&previousY<=top+reach&&top<floor){floor=top;platform=p;bridge=false}}
  return{y:floor,platform,bridge}
 }
 override stepPhysics(dt:number){
  if(this.mode!=='playing')return
  this.dropFlash=Math.max(0,this.dropFlash-dt);if(this.superSonic&&this.stats.rings<=0)this.endSuper();if(this.superSonic&&!this.deathTimer&&!this.clearTimer&&!this.giantTaken){this.superTicks+=dt;if(this.superTransform>0)this.superTransform=Math.max(0,this.superTransform-dt);else{this.superRingTimer+=dt;while(this.superRingTimer>=60&&this.superSonic){this.superRingTimer-=60;this.stats.rings=Math.max(0,this.stats.rings-1);if(!this.stats.rings)this.endSuper();this.emit()}}}
  this.world.focusY=this.y;if(this.goalTime)this.goalTime+=dt;this.clock+=dt/60;if(!this.goalTime&&!this.clearTimer)this.elapsed+=dt/60;this.stats.time=Math.floor(this.elapsed);this.intro=Math.max(0,this.intro-dt);this.shake=Math.max(0,this.shake-dt);this.invincible=Math.max(0,this.invincible-dt);this.starTime=Math.max(0,this.starTime-dt);this.shoeTime=Math.max(0,this.shoeTime-dt);this.peelFlash=Math.max(0,this.peelFlash-dt);this.dashFlash=Math.max(0,this.dashFlash-dt)
  if(this.deathTimer){this.deathTimer-=dt;this.y+=this.vy*dt;this.vy+=(this.zoneState?.drowning?16/256:P.gravity)*dt;if(this.deathTimer<=0){this.deathTimer=1;this.respawn()}this.nativeEffects(dt);return}
  if(this.world.zone==='lz'&&this.level.zoneAct===3&&this.zoneState.slideGrace>0&&(this.y-19<0||this.y-19>=this.world.height)){const offset=this.y-19<0?this.world.height:-this.world.height;this.y+=offset;this.cameraY=Math.max(0,Math.min(this.world.height-224,this.cameraY+offset));this.world.focusY=this.y}
  if(this.world.zone==='sbz'&&this.level.zoneAct===2&&!this.finaleState?.tube&&(this.y<0||this.y>=this.world.height)){this.y=(this.y%this.world.height+this.world.height)%this.world.height;this.cameraY=Math.max(0,Math.min(this.world.height-224,this.y-192));this.platform=null;this.world.focusY=this.y}
  if(this.clearTimer){this.clearTimer+=dt;if(!this.tally)this.tally=new ScoreTally(this.stats.time,this.stats.rings);const tally=this.tally.step(dt);this.addScore(tally.points);if(tally.tick)this.sfx('score-tick');if(tally.finished)this.sfx('score-total');if(!this.boss&&!this.giantTaken){this.x=Math.min(this.level.end+220,this.x+3*dt);const f=this.world.floor(this.x,this.y-16);if(f)this.y=f.y}if(this.tally.doneAge>=180){if(!this.bossPractice&&!this.completedActs.includes(this.act))this.completedActs.push(this.act);this.stats.progress=100;this.mode='won';this.emit();if(this.giantTaken)this.onSpecialRequest?.()}else if(this.frame%4===0)this.emit();this.follow(dt);this.nativeEffects(dt);return}
  if(this.giantTaken){this.giantFlash+=dt;if(this.giantFlash>=18)this.beginClear();return}
  for(const[x,t]of this.springAnimations)t+dt>=10?this.springAnimations.delete(x):this.springAnimations.set(x,t+dt)
  for(const p of this.platforms)if(p.timer&&p.timer<41){p.timer+=dt;if(p.timer>=41&&p.kind==='crumble')this.sfx('collapse')}
  if(stepFinaleZone(this,dt)){this.follow(dt);return}updateZone(this,dt);if(this.deathTimer)return;this.updateMechanisms(dt)
  if(this.superTransform>0){const x=this.x,y=this.y;this.resolveBody(x,y);resolveFinalCylinders(this,x,y);this.collectAndHazards(dt,x);collideZone(this);collideFinale(this);if(!this.deathTimer){this.updateOriginalEnemies(dt);this.updateOriginalBoss(dt)}this.follow(dt);this.nativeEffects(dt);if(this.frame%4===0)this.emit();return}
  const left=this.keys.has('ArrowLeft')||this.keys.has('a'),right=this.keys.has('ArrowRight')||this.keys.has('d'),down=this.keys.has('ArrowDown')||this.keys.has('s'),up=this.keys.has('ArrowUp'),jump=[' ','w','z'].some(k=>this.keys.has(k)),pressed=jump&&!this.jumpLatch||this.jumpBuffer>0
  this.jumpBuffer=0;this.stepDropDash(jump);this.controlLock=Math.max(0,this.controlLock-dt);this.characterMotion.step(dt,jump,left,right,up,down)
  const queued=this.spinTapQueue,revs=queued||(pressed?1:0);this.spinTapQueue=0;let released=false,jumped=false,peelConsumed=false
  const peelRequested=this.peelQueued;this.peelQueued=false
  if(up&&jump&&!down&&(pressed||peelRequested)&&this.canPeel&&!this.peelCharging){this.cancelSpinDash();this.peelCharging=true;this.peelCharge=0;this.peelFacing=left!==right?(right?1:-1):this.face;this.face=this.peelFacing;this.ball=this.rolling=this.skidding=false;this.ownJump=false;this.animation.rev();this.audioEffects.attach(this.audio,this.sound);this.audioEffects.play('peel-charge',1,'peel');this.emit()}
  if(this.peelCharging){peelConsumed=true;if(!this.grounded||this.hurtState||down||this.zoneState?.sliding||this.zoneState?.current){this.cancelPeelOut();this.emit()}else if(!up){if(this.peelCharge>=30){this.peelCharging=false;this.peelCharge=0;this.peelFlash=36;this.face=this.peelFacing;this.groundSpeed=this.face*(this.superSonic?(this.underwater?8:16):this.underwater?6:12);this.vx=this.groundSpeed;this.groundVX=this.vx;this.vy=0;this.ball=this.rolling=false;this.audioEffects.stopGroup('peel');this.sfx('peel-release');released=true;this.emit()}else{this.cancelPeelOut();this.emit()}}else if(!jump){this.cancelPeelOut();this.emit()}else{this.peelCharge=Math.min(30,this.peelCharge+dt);this.groundSpeed=this.vx=this.vy=0;this.groundVX=0;this.face=this.peelFacing;this.ball=this.rolling=false;if(this.frame%4===0||this.peelCharge===30)this.emit()}}
  if(this.spinDashing&&!this.grounded)this.cancelSpinDash()
  if(this.spinDashing&&down)this.spinCharge=decayDash(this.spinCharge)
  if(!peelConsumed&&this.grounded&&!this.hurtState&&(this.spinDashing||Math.abs(this.groundSpeed)<P.rollStart)&&(down||queued>0)&&revs){for(let i=0;i<revs;i++){if(!this.spinDashing){this.spinDashing=true;this.spinCharge=0;this.spinRevs=0}else this.spinCharge=Math.min(P.dashMax,this.spinCharge+P.dashIncrement);this.spinRevs++;this.animation.rev();this.dashSound(this.spinRevs)}this.ownJump=false;this.emit()}
  if(this.spinDashing){if(left!==right)this.face=right?1:-1;this.rolling=true;this.ball=true;this.vy=0;if(down){this.groundSpeed=0;this.vx=0;if(this.frame%7===0)this.dashDust()}else{this.groundSpeed=this.face*(dashSpeed(this.spinCharge)+(this.superSonic?4:0))*(this.superSonic&&this.underwater?.5:1);this.spinDashing=false;this.spinCharge=0;this.dashFlash=26;released=true;this.dashSound(this.spinRevs,true);this.dashDust(true)}}
  const wasRolling=this.rolling,wasSkidding=this.skidding,prevX=this.x,prevY=this.y,wasGrounded=this.grounded
  if(this.platform&&this.grounded){const pos=platformPosition(this.platform,this.clock);this.x+=pos.x-this.platformOldX;this.y+=pos.y-this.platformOldY;this.platformOldX=pos.x;this.platformOldY=pos.y}
  if(this.grounded){
   let angle=this.angle
   if(this.platform){const p=this.platform;angle=p.profile?Math.atan2(platformTop(p,this.x+2,this.clock)-platformTop(p,this.x-2,this.clock),4):0}
   const s=surface(angle)
   if(this.vx!==this.groundVX&&!released&&!this.spinDashing)this.groundSpeed=fixed(this.vx/(Math.abs(s.cos)>.1?s.cos:1))
   if(pressed&&!this.zoneState.sliding&&!peelConsumed&&!this.spinDashing&&!released&&!this.hurtState){const impulse=this.underwater?(this.character==='knuckles'?3:3.5):this.superSonic?8:this.character==='knuckles'?6:P.jumpSpeed;this.vx=fixed(this.groundSpeed*s.cos+impulse*s.sin);this.vy=fixed(this.groundSpeed*s.sin-impulse*s.cos);this.rollJump=this.rolling;this.rolling=false;this.grounded=false;this.platform=null;this.ball=true;this.ownJump=true;this.cancelDropDash();jumped=true;this.sfx('jump')}
   else{if(!peelConsumed&&!this.spinDashing&&!released){this.skidding=!this.rolling&&left!==right&&(right?this.groundSpeed< -4:this.groundSpeed>4);this.groundSpeed=groundStep(slopeStep(this.groundSpeed,angle,this.rolling,dt),left,right,this.rolling,this.shoeTime>0,this.controlLock>0,dt,this.underwater,this.superSonic);if(left!==right&&!this.controlLock&&(this.groundSpeed===0||Math.sign(this.groundSpeed)===(right?1:-1)))this.face=right?1:-1;if((down||this.world.forceRoll(this.x,this.y-19))&&Math.abs(this.groundSpeed)>=P.rollStart)this.rolling=true;if(this.rolling&&this.groundSpeed===0)this.rolling=false}this.angle=angle;this.vx=fixed(this.groundSpeed*s.cos);this.vy=fixed(this.groundSpeed*s.sin);this.groundVX=this.vx;this.ball=this.rolling}
  }else{this.skidding=false;if(!this.hurtState){if(this.ownJump&&!jump&&this.vy< -(this.underwater?2:P.jumpRelease))this.vy=-(this.underwater?2:P.jumpRelease);if(this.characterAbility!=='glide'&&this.characterAbility!=='climb'){this.vx=airStep(this.vx,this.vy,left,right,this.shoeTime>0,this.rollJump,dt,this.underwater,this.superSonic);if(!this.rollJump&&left!==right)this.face=right?1:-1}}const turn=Math.PI/64*dt;this.angle=Math.abs(this.angle)<=turn?0:this.angle-Math.sign(this.angle)*turn}
  if(this.rolling&&!wasRolling&&!this.spinDashing&&!released)this.sfx('roll');if(this.skidding&&!wasSkidding)this.sfx('skid')
  if(!jumped&&!this.peelCharging&&!this.spinDashing&&!released){this.x=Math.max(10,Math.min(this.world.width-10,this.goalTime?this.level.end+180:Infinity,this.x+this.vx*dt));this.y+=this.vy*dt;if(!this.grounded&&this.characterAbility==='normal')this.vy+=(this.underwater?(this.hurtState?8/256:16/256):(this.hurtState?P.hurtGravity:jumpGravity(this.vy,this.ownJump,this.jumpFeel)))*dt}
  this.resolveBody(prevX,prevY);resolveFinalCylinders(this,prevX,prevY)
  this.world.focusY=this.y
  if(!jumped){
   let snap=wasGrounded&&!this.platform?this.world.snap(this.x,this.y,this.angle,Math.min(25,12+Math.abs(this.groundSpeed))):null
   const floor=this.floorAt(this.x,prevY,wasGrounded?24:8)
   if(floor.bridge&&((wasGrounded&&Math.abs(this.y-floor.y)<25)||this.vy>=0&&this.y>=floor.y&&prevY<=floor.y+8)){snap={x:this.x,y:floor.y,angle:0};this.platform=null}
   else if(floor.platform&&((wasGrounded&&Math.abs(this.y-floor.y)<25)||this.vy>=0&&this.y>=floor.y&&prevY<=floor.y+8)){snap={x:this.x,y:floor.y,angle:floor.platform.profile?Math.atan2(platformTop(floor.platform,this.x+2,this.clock)-platformTop(floor.platform,this.x-2,this.clock),4):0};this.platform=floor.platform}
   else if(!wasGrounded&&this.vy>=0){const hits=[this.world.floor(this.x-8,prevY-8,this.y+2),this.world.floor(this.x+8,prevY-8,this.y+2)].filter((h):h is NonNullable<typeof h>=>h!==null&&this.y>=h.y);if(hits.length){const h=hits.sort((a,b)=>a.y-b.y)[0];snap={...h,x:this.x};this.platform=null}}
   if(snap){const landed=!this.grounded,impact=this.vy;this.x=snap.x;this.y=snap.y;this.angle=snap.angle;this.grounded=true;if(landed){if(this.hurtState)this.invincible=120;this.groundSpeed=this.hurtState?0:landingSpeed(this.vx,impact,this.angle);this.hurtState=false;this.rollJump=false;this.ownJump=false;this.rolling=false}this.ball=this.rolling;const s=surface(this.angle);this.vx=fixed(this.groundSpeed*s.cos);this.groundVX=this.vx;this.vy=0;if(this.platform){const pos=platformPosition(this.platform,this.clock);this.platformOldX=pos.x;this.platformOldY=pos.y;if(this.platform.kind==='crumble'&&!this.platform.timer)this.platform.timer=1}if(!this.platform&&Math.abs(this.angle)>=Math.PI/4&&Math.abs(this.groundSpeed)<P.slipSpeed&&!this.spinDashing){this.grounded=false;this.controlLock=P.controlLock;this.vy=fixed(this.groundSpeed*s.sin);this.platform=null}}
   else if(this.grounded){this.grounded=false;this.platform=null;this.ownJump=false;this.rollJump=false}
  }
  this.characterMotion.finish()
  if(this.grounded)this.landDropDash(left,right)
  this.world.updateLoop(this.x+Math.sin(this.angle)*19,this.y-Math.cos(this.angle)*19,this.angle,!this.grounded)
  this.jumpLatch=jump
  this.collectAndHazards(dt,prevX);collideZone(this);collideFinale(this);if(this.grounded)this.landDropDash(left,right);if(this.deathTimer){this.follow(dt);this.nativeEffects(dt);return}
  this.updateOriginalEnemies(dt)
  this.updateOriginalBoss(dt);if(this.mode!=='playing')return
  if((this.y>this.world.height+64&&!(this.world.zone==='sbz'&&this.level.zoneAct===2))||!this.goalTime&&this.elapsed>=600)this.die()
  if(this.world.zone!=='sbz3'&&!(this.world.zone==='sbz'&&this.level.zoneAct===2)&&!this.boss&&this.x>=this.level.end&&!this.deathTimer&&!this.goalTime){this.endSuper();this.goalTime=1;this.signpostY=this.world.map.objects.filter(o=>o[2]===0x0d).sort((a,b)=>Math.abs(a[1]-this.y)-Math.abs(b[1]-this.y))[0]?.[1]??null;this.sfx('signpost');this.emit()}
  if(this.goalTime>=122&&(this.x>=this.level.end+180||this.goalTime>360))this.beginClear()
  this.world.focusY=this.y;this.follow(dt);this.nativeEffects(dt)
  this.stats.speed=Math.abs(this.grounded?this.groundSpeed:this.vx);this.stats.progress=Math.max(0,Math.min(99,Math.floor((this.x-this.world.map.start[0])/Math.max(1,this.level.end-this.world.map.start[0])*100)));this.stats.power=this.superSonic?'SUPER SONIC':this.starTime?'INVINCIBLE':this.shoeTime?'SPEED SHOES':this.shield?'SHIELD':'';this.stats.section=this.boss?.active&&this.boss.hp?'EGGMAN':`SONIC 1 · ${this.level.zoneName.toUpperCase()} ACT ${this.level.zoneAct}`;if(this.frame%8===0)this.emit()
 }
 private resolveBody(prevX:number,prevY:number){
  const height=this.ball||this.rolling?28:38,dx=this.x-prevX
  if(this.grounded&&this.platform&&this.y<prevY-.1&&(this.world.solid(this.x-7,this.y-height,true)||this.world.solid(this.x+7,this.y-height,true))){this.die();return}
  if(!this.grounded||Math.abs(this.angle)<.25){
   if(dx){const side=Math.sign(dx);for(let step=1;step<=Math.ceil(Math.abs(dx));step++){const x=prevX+side*(step+10);if([this.y-9,this.y-height+8].some(y=>this.world.solid(x,y,true))){this.x=Math.floor(x)-side*11;this.vx=0;this.groundSpeed=0;break}}}
   if(this.vy<0&&!this.grounded){for(let y=Math.floor(prevY-height);y>=Math.floor(this.y-height);y--)if(this.world.solid(this.x-7,y,true)||this.world.solid(this.x+7,y,true)){this.y=y+height+1;this.vy=0;break}}
  }
  for(const p of this.platforms){if(p.originalId===0x84||!p.h||p.inactive||(p.timer||0)>40)continue;const pos=platformPosition(p,this.clock),top=platformTop(p,this.x,this.clock),bottom=pos.y+p.h;if(this.x<pos.x-10||this.x>pos.x+p.w+10||this.y<=top+4||this.y-height>=bottom-1)continue
   if(p.breakable&&this.ball){p.timer=41;this.addScore(50);this.burst(this.x,this.y-20,'smoke');this.sfx('break');if(this.vy<0)this.vy=1;continue}
   if(this.vy<0&&prevY-height>=bottom-2){this.y=bottom+height;this.vy=0;this.grounded=false}
   else if(prevX<=pos.x-9||prevX>=pos.x+p.w+9){const side=prevX<pos.x?1:-1;if(p.pushable&&this.grounded&&!this.world.solid(pos.x+(side>0?p.w+1:-1),bottom-8,true)){p.x+=side*Math.min(1.5,Math.abs(dx))}this.x=side>0?pos.x-11:pos.x+p.w+11;this.vx=0;this.groundSpeed=0}
  }
 }
 private collectAndHazards(dt:number,prevX:number){
  for(const r of this.rings)if(!r.taken&&Math.abs(r.x-this.x)<17&&Math.abs(r.y-(this.y-18))<23){r.taken=true;this.addRings(1);this.burst(r.x,r.y)}
  for(const m of this.monitors){if(m.broken||Math.abs(m.x-this.x)>25||this.y<m.y-42||this.y>m.y+5)continue;if(this.ball||this.starTime||this.superSonic)this.smashMonitor(m);else if(this.vy>=0&&this.y<=m.y-18){this.y=m.y-31;this.vy=0;this.grounded=true;this.groundSpeed=this.vx}else{this.x=prevX;this.vx=0;this.groundSpeed=0}}
  for(const s of this.level.springDefs){const vertical=s.dir==='up'||s.dir==='down';if(this.springAnimations.has(s.x)||Math.abs(this.x-s.x)>(vertical?23:18)||Math.abs(this.y-s.y)>(vertical?18:32))continue;this.springAnimations.set(s.x,0);this.cancelSpinDash();this.platform=null;this.ownJump=false;this.rollJump=false;this.hurtState=false;this.rolling=false;this.ball=false;const force=s.force||16;if(vertical){this.y=s.y-8;this.vy=s.dir==='down'?force:-force;this.grounded=false;this.animation.spring()}else{this.vx=s.dir==='left'?-force:force;this.groundSpeed=this.vx;this.groundVX=this.vx;this.controlLock=16}this.sfx('spring')}
  for(const[x,y,type,sub,flags]of this.world.map.objects){
   if(Math.abs(x-this.x)>300)continue
   if(type===0x36){const side=[1,5].includes(sub>>4),width=[40,32,8,56,128,32][sub>>4]||40;const ox=(sub&15)===1?Math.sin(this.clock*2)*16:0,oy=(sub&15)===2?Math.sin(this.clock*2)*16:0;if(Math.abs(this.x-x-ox)<width/2+7&&Math.abs(this.y-18-y-oy)<(side?22:25))this.hurt(x)}
   if(type===0x17){const count=Math.max(1,sub&15);for(let i=0;i<count;i++)if((Math.floor(this.clock*60/8)+i)%8===0&&Math.abs(this.x-(x-(count-1)*8+i*16))<12&&Math.abs(this.y-18-y)<28)this.hurt(x)}
   if(type===0x32&&Math.abs(this.x-x)<23&&Math.abs(this.y-y)<20&&this.grounded&&!this.switches.has(sub&15)){this.switches.add(sub&15);this.sfx('switch')}
   if(type===0x79&&(sub&127)>this.checkpointId&&Math.abs(this.x-x)<24&&Math.abs(this.y-y)<96){this.checkpoint=x;this.checkpointId=sub&127;this.saveZoneCheckpoint();this.addScore(100);this.sfx('checkpoint')}
   if(type===0x54){const w=[64,128,256][sub&3]||64;if(Math.abs(this.x-x)<w/2&&Math.abs(this.y-16-y)<38)this.hurt(x)}
   if(type===0x31){const p=this.platforms.find(p=>p.originalId===type&&p.anchorX===x);if(p?.hazard){const pos=platformPosition(p,this.clock);if(Math.abs(this.x-pos.x-p.w/2)<p.w/2+8&&Math.abs(this.y-18-pos.y-(p.h||32)/2)<30)this.hurt(x)}}
   void flags
  }
  if((this.world.lava(this.x,this.y-3)||this.world.lava(this.x,this.y-20))&&!this.platform){const hurt=this.hurtState;this.hurt(this.x);if(!hurt&&this.hurtState&&!this.deathTimer)this.vy=-7}
  const giant=this.giantRing;if(giant&&Math.abs(this.x-giant[0])<26&&Math.abs(this.y-18-giant[1])<40){this.endSuper();this.giantTaken=true;this.giantFlash=1;this.goalTime=this.goalTime||1;this.cancelSpinDash();this.keys.clear();this.shield=false;this.starTime=0;this.sfx('special-enter');this.emit()}
  if(this.specialPortal){this.specialPortal.life-=dt;if(this.specialPortal.life<=0)this.specialPortal=null;else if(Math.hypot(this.x-this.specialPortal.x,this.y-18-this.specialPortal.y)<32){this.specialPortal=null;this.onSpecialRequest?.()}}
 }
 private updateMechanisms(dt:number){
  for(const p of this.platforms){
   if(p.originalId===0x30&&(p.subtype!&15)===4&&this.switches.has(p.subtype!>>4)){const travel=p.anchorY||0,delta=Math.max(0,Math.min(2*dt,160-travel));p.y+=delta;p.anchorY=travel+delta}
   if(p.pushable){let lava:number|undefined;for(let y=Math.floor(p.y);y<p.y+(p.h||32)+16;y++)if(this.world.lava(p.x+p.w/2,y)){lava=y;break}const floor=this.world.floor(p.x+p.w/2,p.y+(p.h||32)-4);if(lava!==undefined)p.y=lava-(p.h||32)+8;else if(floor&&p.y+(p.h||32)<floor.y)p.y=Math.min(floor.y-(p.h||32),p.y+2*dt)}
  }
  this.world.map.objects.forEach(([x,y,type,sub],i)=>{if(type!==0x13||Math.abs(x-this.x)>600)return;const cycle=Math.floor((this.clock*60+i*19)/(110+(sub&15)*12));if(this.fired.get(i)===cycle)return;this.fired.set(i,cycle);this.fires.push({x,y,vx:(sub>>4)>=4?(sub&1?-2:2):0,vy:(sub>>4)>=4?0:-6,life:180,landed:false})})
  for(const f of this.fires){f.x+=f.vx*dt;f.y+=f.vy*dt;if(!f.landed)f.vy+=.15*dt;if(f.boss&&this.world.zone==='slz'){stepStarLightBall(this,f)}else if(f.boss&&!f.landed&&f.vy>0){const floor=this.world.floor(f.x,f.y-12,f.y+12);if(floor&&f.y>=floor.y-8){f.y=floor.y-8;f.vy=0;f.vx=1.2;f.landed=true;f.life=120;this.fires.push({...f,vx:-1.2})}}f.life-=dt;if(f.life>0&&Math.abs(this.x-f.x)<18&&Math.abs(this.y-18-f.y)<24)this.hurt(f.x)}this.fires=this.fires.filter(f=>f.life>0)
 }
 protected updateOriginalEnemies(dt:number){
  for(const e of this.enemies){if(!e.alive||Math.abs(e.base-this.x)>600)continue;e.cooldown-=dt
   if(stepFinalEnemy(this,e,dt)){}
   else if(stepZoneEnemy(this,e,dt)){}
   else if(e.originalId===0x2b){e.y=e.baseY-Math.sin((this.clock%2.6)/2.6*Math.PI)*128}
   else if(e.originalId===0x22){e.x=e.base+Math.sin(this.clock*.8)*36;e.y=e.baseY+Math.sin(this.clock*2)*5;if(e.cooldown<0&&Math.abs(e.x-this.x)<220){e.cooldown=180;this.bullets.push({x:e.x,y:e.y-10,vx:this.x<e.x?-2.4:2.4,vy:1.5,life:150})}}
   else if(e.originalId===0x55){if(Math.abs(e.x-this.x)<160){e.x+=Math.sign(this.x-e.x)*.6*dt;e.y+=Math.max(-1,Math.min(1,(this.y-10-e.y)*.01))*dt}}
   else if(e.originalId!==0x42){const dir=e.direction||-1,next=e.x+dir*(e.originalId===0x78?.35:.6)*dt,floor=this.world.floor(next,e.y-12,e.y+24);if(!floor||this.world.solid(next+dir*16,e.y-15,true))e.direction=-dir;else{e.x=next;e.y=floor.y}}
   if(Math.abs(this.x-e.x)<(e.originalId===0x78?28:22)&&Math.abs(this.y-18-(e.y-16))<24){if(this.superSonic||this.starTime||this.ball&&!(e.originalId===0x50&&!this.grounded&&this.y-18<e.y-12)){e.alive=false;this.addScore(100);this.burst(e.x,e.y-16,'smoke');this.particles.push({x:e.x,y:e.y-16,vx:1.2,vy:-3,life:180,age:0,kind:'animal'});if(!this.grounded&&!this.superSonic){this.characterMotion.cancel();this.vy=-6;}this.sfx('destroy')}else this.hurt(e.x)}
  }
  for(const b of this.bullets){b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;if(Math.abs(b.x-this.x)<16&&Math.abs(b.y-this.y+18)<20){b.life=0;if(!this.ball)this.hurt(b.x)}}this.bullets=this.bullets.filter(b=>b.life>0)
 }
 protected updateOriginalBoss(dt:number){
  const b=this.boss;if(!b||this.deathTimer)return;const a=b.arena
  if(!b.active){if(this.x<a.left+18)return;b.enter();this.checkpoint=a.left+32;this.saveZoneCheckpoint(a.floor);this.specialPortal=null;this.bullets=[];this.intro=0;this.emit()}
  if(a.kind==='final'){stepFinalBoss(this,dt);return}
  if(a.kind==='pinch'&&b.phase==='fight'&&b.fightTime*60%240<80)b.dropX=a.left+16+Math.max(0,Math.min(9,Math.floor((this.x-a.left)/32)))*32
  if(a.kind==='seesaw'&&b.phase==='fight'){const saws=this.platforms.filter(p=>p.originalId===0x5e&&p.subtype===255).sort((p,q)=>p.anchorX!-q.anchorX!),cycle=Math.floor((b.fightTime*60+dt)/180),saw=saws[cycle%saws.length];if(saw)b.dropX=saw.anchorX!+(cycle%2?-38:38)}
  b.step(dt)
  if(a.kind==='pinch'&&b.phase==='fight'){const cycle=b.fightTime*60%240,key=50000+Math.floor(b.fightTime*60/240),block=this.platforms.find(p=>p.originalId===0x76&&Math.abs((p.anchorX||0)-b.dropX)<8&&p.timer!==41);if(cycle>=145&&block){block.y=a.floor-Math.min(48,(cycle-145)*1.2);if(cycle>=185&&!this.zoneState.cooldown.has(key)){block.timer=41;this.zoneState.cooldown.set(key,9999);this.burst(b.dropX,block.y,'smoke');this.sfx('break')}}if(Math.abs(this.x-b.x)<12&&this.y-18>b.y+10&&this.y-18<b.y+56)this.hurt(b.x)}
  if(a.kind==='chase'){if(b.phase==='intro'||b.phase==='fight')b.y=Math.min(b.y,Math.max((a.top||192)+48,this.y-112));if((b.phase==='intro'||b.phase==='fight')&&this.x>=a.right-128&&this.y<480){b.phase='escape';b.time=0;this.addScore(1000);this.emit()}}
  if(a.kind!=='chase'&&b.phase!=='escaped'){this.x=Math.max(a.left+12,Math.min(a.right-12,this.x));if(this.x===a.left+12)this.vx=Math.max(0,this.vx);if(this.x===a.right-12)this.vx=Math.min(0,this.vx)}
  if(a.kind==='seesaw')stepStarLightDrop(this)
  if(b.dangerous){if(a.kind==='fire'){if(this.frame%90===0)this.fires.push({x:b.x,y:b.y+20,vx:0,vy:1,life:210,landed:false,boss:true})}else if((a.kind==='wrecking'||!a.kind)&&Math.hypot(this.x-b.ball.x,this.y-18-b.ball.y)<35)this.hurt(b.ball.x)
   if(Math.abs(this.x-b.x)<37&&Math.abs(this.y-18-b.y)<33){if(this.ball||this.starTime||this.superSonic){if(b.hit()){this.addScore(100);this.burst(b.x,b.y);this.shake=5;this.sfx('boss-hit');if(!b.hp)this.addScore(1000);this.emit()}this.characterMotion.cancel();this.vy=-6.5;this.grounded=false;this.ball=true;this.ownJump=false;this.rolling=false;this.platform=null}else this.hurt(b.x)}}
  if(a.kind==='seesaw'&&!b.hp)this.fires=this.fires.filter(f=>!f.boss)
  if(b.phase==='defeated'&&this.frame%12===0){this.burst(b.x+Math.sin(b.time)*25,b.y-15,'smoke');this.sfx('explosion')}
  if(b.phase==='escaped'&&!this.capsuleSpawned){this.capsuleSpawned=true;const button=this.world.map.objects.find(o=>o[2]===0x3e&&o[3]===1);this.platforms.push({x:(a.capsuleX??a.center)-16,y:button?button[1]-4:a.floor-68,w:32,h:8,kind:'capsule'});this.emit()}
  if(this.capsuleSpawned&&!b.capsuleReleased&&this.grounded&&this.platform?.kind==='capsule'){b.capsuleReleased=true;this.platform=null;this.platforms=this.platforms.filter(p=>p.kind!=='capsule');for(let i=0;i<16;i++)this.particles.push({x:a.capsuleX??a.center,y:a.floor-20,vx:(i%2?-1:1)*(1+i%4*.5),vy:-3-i%3,life:360,age:0,kind:'animal'});this.beginClear();this.sfx('explosion');this.emit()}
 }
 private nativeEffects(dt:number){for(const p of this.particles){p.age+=dt;p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=(p.kind==='ring'||p.kind==='animal'?.2:.04)*dt;if(p.kind==='ring'||p.kind==='animal'){const f=this.world.floor(p.x,p.y-8,p.y+8);if(f&&p.vy>0){p.y=f.y-4;p.vy=p.kind==='animal'?-3:-p.vy*.6}if(p.kind==='ring'&&p.age>45&&Math.abs(p.x-this.x)<20&&Math.abs(p.y-this.y+18)<24&&!this.deathTimer){this.addRings(1);p.life=0}}}this.particles=this.particles.filter(p=>p.life>0);for(const p of this.popups){p.life-=dt;p.y-=.35*dt}this.popups=this.popups.filter(p=>p.life>0)}
 override follow(dt:number){if(this.world.zone==='sbz'&&this.level.zoneAct===2&&this.finaleState?.trap){this.camera+=(8272-this.camera)*Math.min(1,.2*dt);this.cameraY+=(1296-this.cameraY)*Math.min(1,.15*dt);return}const a=this.activeArena;if(a){this.camera+=(a.left-this.camera)*Math.min(1,.15*dt);this.cameraY+=(a.floor-192-this.cameraY)*Math.min(1,.12*dt);return}const tx=Math.max(0,Math.min(this.world.width-320,this.boss||this.world.zone==='sbz3'||this.world.zone==='sbz'&&this.level.zoneAct===2?Infinity:this.level.end-192,this.x-120+Math.max(-24,Math.min(24,this.vx*3))));this.camera+=(tx-this.camera)*Math.min(1,.2*dt);if(!this.grounded&&this.ownJump&&this.y>=this.cameraY+48&&this.y<=this.cameraY+208)return;const ty=Math.max(0,Math.min(this.world.height-224,this.y-192)),diff=ty-this.cameraY;if(this.grounded||Math.abs(diff)>48)this.cameraY+=Math.max(-12,Math.min(12,diff))*dt}
 override destroy(){this.nativeMusic?.dispose();this.jingleMusic?.dispose();this.previewMusic?.dispose();this.audioEffects?.dispose();super.destroy()}
}
