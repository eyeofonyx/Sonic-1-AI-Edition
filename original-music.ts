export type Track='hill'|'marble'|'boss'|'clear'|'invincible'|'life'|'over'|'emerald'|'title'|'special'|'spring'|'labyrinth'|'drowning'|'starlight'|'scrap'|'final'|'ending'|'credits'|'super'|'emeraldhill'|'s2boss'|'s2clear'
export type Jingle='life'|'emerald'
export const trackTitles:Record<Track,string>={emeraldhill:'Emerald Hill theme',s2boss:'Sonic 2 boss theme',s2clear:'Sonic 2 act-clear theme',super:'Super Sonic theme',hill:'Green Hill theme',marble:'Marble theme',boss:'boss theme',clear:'act-clear theme',invincible:'invincibility theme',life:'extra-life jingle',over:'game-over jingle',emerald:'Chaos Emerald jingle',title:'title theme',special:'special-stage theme',spring:'Spring Yard theme',labyrinth:'Labyrinth theme',drowning:'drowning countdown',starlight:'Star Light theme',scrap:'Scrap Brain theme',final:'Final Zone theme',ending:'ending theme',credits:'staff roll'}
const loops:Partial<Record<Track,readonly[number,number]>>={emeraldhill:[3.470045351473921,44.937278911564626],s2boss:[.21136054421768335,36.29469387755102],super:[3.455804988662132,23.1224716553288],starlight:[3.3666893424036246,45.60002267573696],scrap:[.614761904761906,72.61487528344671],final:[2.397755102040815,21.59829931972789],hill:[14.79931972789116,53.19931972789116],marble:[2.4843310657596405,38.48433106575964],boss:[.26485260770975216,21.598185941043084],invincible:[1.128639455782313,12.095283446712019],special:[.450589569160994,33.368049886621314],spring:[2.299183673469385,40.699183673469385],labyrinth:[2.62832199546485,37.19498866213152]}
const lengths:Partial<Record<Track,number>>={s2clear:6.011882086167801,ending:18.011609977324262,clear:6.017256235827665,life:3.8711337868480724,over:11.830657596371882,emerald:2.815895691609977,title:8.766666666666667,drowning:11.562222222222223}
const decoded=new WeakMap<AudioContext,Map<Track,Promise<AudioBuffer|null>>>()
/** Original YM2612/PSG recordings. One-shots finish once; pauses retain sample position. */
export class OriginalMusic{
 private source:AudioBufferSourceNode|null=null
 private gain:GainNode|null=null
 private track:Track|null=null
 private offset=0
 private started=0
 private context:AudioContext|null=null
 private active=false
 private generation=0
 finished=false
 error=false
 get status(){return this.error?'unavailable':this.finished?'finished':this.active?this.source?'playing':'loading':'paused'}
 get title(){return this.track?trackTitles[this.track]:''}
 warm(context:AudioContext|null){if(context)for(const t of ['life','over','emerald'] as const)void this.load(context,t)}
 private load(context:AudioContext,track:Track){
  let buffers=decoded.get(context);if(!buffers){buffers=new Map();decoded.set(context,buffers)}
  if(!buffers.has(track))buffers.set(track,fetch(track==='super'||track==='emeraldhill'||track==='s2boss'||track==='s2clear'?'/audio/sonic2-'+(track==='emeraldhill'?'emerald':track)+'.ogg':'/audio/sonic1-'+track+'.ogg').then(r=>{if(!r.ok)throw Error('Music unavailable');return r.arrayBuffer()}).then(b=>context.decodeAudioData(b)).catch(()=>{this.error=true;return null}))
  return buffers.get(track)!
 }
 sync(context:AudioContext|null,playing:boolean,track:Track){
  if(!context||!playing){this.pause();return}
  if(this.context!==context){this.reset();this.gain?.disconnect();this.context=context;this.gain=context.createGain();this.gain.gain.value=.3;this.gain.connect(context.destination)}
  if(this.track!==track){this.pause();this.offset=0;this.track=track;this.finished=false;this.error=false}
  if(this.active||this.finished)return
  this.active=true;const generation=++this.generation
  void this.load(context,track).then(buffer=>{
   if(!buffer||!this.active||generation!==this.generation||this.track!==track)return
   const source=context.createBufferSource();source.buffer=buffer;source.connect(this.gain!);const loop=loops[track];source.loop=!!loop;source.loopStart=loop?.[0]||0;source.loopEnd=Math.min(buffer.duration,loop?.[1]??buffer.duration)
   if(source.loop&&this.offset>=source.loopEnd)this.offset=source.loopStart+(this.offset-source.loopStart)%(source.loopEnd-source.loopStart)
   const end=Math.min(buffer.duration,lengths[track]??buffer.duration)
   if(!source.loop&&this.offset>=end){this.active=false;this.finished=true;return}
   this.source=source;this.started=context.currentTime;source.onended=()=>{if(this.source!==source)return;this.source=null;this.active=false;this.finished=true;this.offset=end;source.disconnect()}
   if(source.loop)source.start(0,this.offset);else source.start(0,this.offset,end-this.offset)
  })
 }
 pause(){if(!this.active&&!this.source)return;this.active=false;this.generation++;if(this.source){this.offset+=(this.context?.currentTime||0)-this.started;const source=this.source;this.source=null;source.stop();source.disconnect()}}
 reset(){this.pause();this.track=null;this.offset=0;this.error=false;this.finished=false}
 dispose(){this.reset();this.gain?.disconnect();this.gain=null;this.context=null}
}
