export const effectNames=['jump','ring','ring-loss','spring','roll','skid','shield','hurt','death','destroy','boss-hit','explosion','checkpoint','switch','break','collapse','signpost','dash-charge','dash-release','special-enter','score-tick','score-total','bump','splash','bubble','air-warning','drown','peel-charge','peel-release','sega','drop-charge','flight','flight-tired','grab'] as const
export type Effect=typeof effectNames[number]
export type GameSound=Effect|'life'|'emerald'
/** Local classic recordings. Decode once, allow overlapping rings, cancel stale async requests. */
export class OriginalEffects{
 private context:AudioContext|null=null
 private gain:GainNode|null=null
 private buffers=new Map<Effect,Promise<AudioBuffer|null>>()
 private nodes=new Map<AudioBufferSourceNode,string>()
 private generation=0
 private groups=new Map<string,number>()
 lastPlayed:Effect|null=null
 private enabled=true
 error=false
 get status(){return this.error?'unavailable':this.context?'ready':'waiting'}
 attach(context:AudioContext|null,enabled:boolean){
  if(this.enabled!==enabled){this.enabled=enabled;if(!enabled)this.stopAll()}
  if(!context||context===this.context)return
  this.dispose();this.context=context;this.gain=context.createGain();this.gain.gain.value=.55;this.gain.connect(context.destination)
  for(const name of effectNames)void this.load(name)
 }
 private load(name:Effect){
  if(!this.buffers.has(name)){const context=this.context!;this.buffers.set(name,fetch('/audio/effects/'+name+'.wav').then(r=>{if(!r.ok)throw Error('Effect unavailable');return r.arrayBuffer()}).then(b=>context.decodeAudioData(b)).catch(()=>{this.error=true;return null}))}
  return this.buffers.get(name)!
 }
 play(name:Effect,rate=1,group='',pan=0){
  if(!this.enabled||!this.context||!this.gain)return
  if(group)this.stopGroup(group)
  const generation=this.generation,context=this.context,requested=context.currentTime,version=this.groups.get(group)
  void this.load(name).then(buffer=>{
   if(!buffer||!this.enabled||generation!==this.generation||this.context!==context||(group&&version!==this.groups.get(group))||context.currentTime-requested>(name==='sega'?2:.3))return
   const source=context.createBufferSource();source.buffer=buffer;source.playbackRate.value=rate
   let panner:StereoPannerNode|null=null
   if(pan&&context.createStereoPanner){panner=context.createStereoPanner();panner.pan.value=pan;source.connect(panner);panner.connect(this.gain!)}else source.connect(this.gain!)
   this.nodes.set(source,group);source.onended=()=>{this.nodes.delete(source);source.disconnect();panner?.disconnect()};source.start();this.lastPlayed=name
  })
 }
 stopGroup(group:string){this.groups.set(group,(this.groups.get(group)||0)+1);for(const[node,g]of this.nodes)if(g===group){node.stop();this.nodes.delete(node)}}
 stopAll(){this.generation++;for(const node of this.nodes.keys())node.stop();this.nodes.clear()}
 dispose(){this.stopAll();this.gain?.disconnect();this.gain=null;this.context=null;this.buffers.clear()}
}
