import { mazeStages } from './maze-data'
import { ScoreTally } from './score-tally'
export type MazeMode='ready'|'playing'|'paused'|'exiting'|'success'|'failed'
export type MazeEvent='ring'|'jump'|'bumper'|'glass'|'switch'|'goal'|'emerald'|'life'|'tick'|'total'
export const emeraldColors=['#7777ff','#ffff00','#ff77dd','#00ee66','#ff3322','#dddddd']
export class MazeRun{
 stage:number;tiles:number[]=[];x=0;y=0;vx=0;vy=0;inertia=0;angle=0;rotation=64;frames=0;rings=0;extraLives=0;grounded=false;mode:MazeMode='ready';previous:MazeMode='playing';keys=new Set<string>();jumpQueued=false;contact=new Set<number>();cooldown=new Map<number,number>();exitAge=0;won=false;tally:ScoreTally|null=null;ghost=false
 event:(e:MazeEvent)=>void
 constructor(stage=1,event:(e:MazeEvent)=>void=()=>{}){this.event=event;this.stage=stage;this.reset()}
 reset(){const d=mazeStages[this.stage-1];this.tiles=[...d.tiles];[this.x,this.y]=d.start;this.vx=this.vy=this.inertia=this.angle=this.frames=this.rings=this.exitAge=this.extraLives=0;this.rotation=64;this.mode='ready';this.won=false;this.tally=null;this.grounded=false;this.keys.clear();this.cooldown.clear();this.contact.clear();this.ghost=false;this.jumpQueued=false}
 start(){if(this.mode==='paused'){this.mode=this.previous;return}this.reset();this.mode='playing'}
 pause(){if(this.mode==='paused')this.mode=this.previous;else if(this.mode!=='ready'){this.previous=this.mode;this.mode='paused';this.keys.clear();this.jumpQueued=false}}
 press(k:string){if(this.mode!=='playing')return;if([' ','ArrowUp','w','z'].includes(k)&&!this.keys.has(k))this.jumpQueued=true;this.keys.add(k)}
 release(k:string){this.keys.delete(k)}
 get resultReady(){return !!this.tally?.done&&this.tally.doneAge>=90}
 update(){if(this.mode==='ready'||this.mode==='paused')return;this.frames++
  if(this.mode==='success'||this.mode==='failed'){const s=this.tally!.step();if(s.tick)this.event('tick');if(s.finished)this.event('total');return}
  if(this.mode==='exiting'){this.exitAge++;this.angle+=this.rotation/65536*Math.PI*2;if(this.exitAge>=180){this.mode=this.won?'success':'failed';this.tally=new ScoreTally(0,this.rings,true)}return}
  const left=this.keys.has('ArrowLeft')||this.keys.has('a'),right=this.keys.has('ArrowRight')||this.keys.has('d'),s=Math.sin(this.angle),c=Math.cos(this.angle)
  if(left!==right){const d=right?1:-1;this.inertia=Math.max(-8,Math.min(8,this.inertia+d*(this.inertia*d<0?.25:12/256)))}else this.inertia=Math.abs(this.inertia)<=12/256?0:this.inertia-Math.sign(this.inertia)*12/256
  if(this.jumpQueued&&this.grounded){this.vx=-s*6.5;this.vy=-c*6.5;this.grounded=false;this.event('jump')}this.jumpQueued=false
  this.vx+=s*42/256;this.vy+=c*42/256;const speed=Math.hypot(this.vx,this.vy);if(speed>16){this.vx*=16/speed;this.vy*=16/speed}
  const q=Math.round(this.angle/(Math.PI/2))*Math.PI/2,controlX=Math.cos(q),controlY=-Math.sin(q),dx=this.vx+controlX*this.inertia,dy=this.vy+controlY*this.inertia,n=Math.max(1,Math.ceil(Math.hypot(dx,dy)/2)),touch=new Set<number>();this.grounded=false
  for(let i=0;i<n;i++)this.move(dx/n,dy/n,touch,controlX,controlY)
  for(const index of touch){if(this.mode!=='playing')break;this.action(index,!this.contact.has(index))}this.contact=touch
  if(this.mode==='playing')for(let yy=Math.floor((this.y-18)/24);yy<=Math.floor((this.y+18)/24);yy++)for(let xx=Math.floor((this.x-18)/24);xx<=Math.floor((this.x+18)/24);xx++){if(xx<0||yy<0||xx>=64||yy>=64)continue;const i=yy*64+xx,t=this.tiles[i];if(Math.hypot(this.x-(xx*24+12),this.y-(yy*24+12))>21)continue;if(t===58){this.tiles[i]=0;this.rings++;this.event('ring')}else if(t>=59&&t<=64){this.tiles[i]=0;this.won=true;this.exit();this.event('emerald')}else if(t===40){this.tiles[i]=0;this.extraLives++;this.event('life')}else if(t===65)this.ghost=true;else if(t===74&&this.ghost){this.tiles=this.tiles.map(v=>v===65?44:v);this.ghost=false;this.event('switch')}}
  this.angle+=this.rotation/65536*Math.PI*2;if(this.x< -200||this.y< -300||this.x>1736||this.y>1736){this.exit();this.event('goal')}
 }
 private solid(t:number){return t>0&&t<58&&t!==40}
 private move(dx:number,dy:number,touch:Set<number>,controlX:number,controlY:number){
  this.x+=dx;this.y+=dy;const radius=10,gravityX=Math.sin(this.angle),gravityY=Math.cos(this.angle)
  // Solve the circle against each nearby square along its true surface normal.
  // Axis snapping at corners used to teleport Sonic sideways and count walls
  // and ceilings as floors; short vector steps also prevent fast tunneling.
  for(let pass=0;pass<4;pass++){let moved=false;const left=Math.floor((this.x-radius)/24),right=Math.floor((this.x+radius)/24),top=Math.floor((this.y-radius)/24),bottom=Math.floor((this.y+radius)/24)
   for(let yy=top;yy<=bottom;yy++)for(let xx=left;xx<=right;xx++){if(xx<0||yy<0||xx>=64||yy>=64)continue;const i=yy*64+xx;if(!this.solid(this.tiles[i]))continue;const x=xx*24,y=yy*24,nearestX=Math.max(x,Math.min(x+24,this.x)),nearestY=Math.max(y,Math.min(y+24,this.y)),nx=this.x-nearestX,ny=this.y-nearestY,d=Math.hypot(nx,ny);if(d>radius+.01)continue
    let normalX:number,normalY:number,depth:number;if(d>1e-8){normalX=nx/d;normalY=ny/d;depth=radius-d}else{const sides=[{n:this.x-x+radius,x:-1,y:0},{n:x+24-this.x+radius,x:1,y:0},{n:this.y-y+radius,x:0,y:-1},{n:y+24-this.y+radius,x:0,y:1}].sort((a,b)=>a.n-b.n);normalX=sides[0].x;normalY=sides[0].y;depth=sides[0].n}
    touch.add(i);if(normalX*gravityX+normalY*gravityY<-.2)this.grounded=true
    if(depth>1e-6){this.x+=normalX*(depth+1e-5);this.y+=normalY*(depth+1e-5);moved=true}
    const into=this.vx*normalX+this.vy*normalY;if(into<0){this.vx-=normalX*into;this.vy-=normalY*into}const drive=controlX*normalX+controlY*normalY;if(this.inertia*drive<0&&Math.abs(drive)>.7)this.inertia=0
   }if(!moved)break
  }
 }
 private action(i:number,fresh:boolean){const t=this.tiles[i],age=this.frames-(this.cooldown.get(i)??-1000);if(t===39){this.exit();this.event('goal');return}if(t===37&&age>12){const dx=this.x-(i%64*24+12),dy=this.y-(Math.floor(i/64)*24+12),d=Math.hypot(dx,dy)||1;this.vx=dx/d*7;this.vy=dy/d*7;this.cooldown.set(i,this.frames);this.event('bumper');this.grounded=false}else if(t>=45&&t<=48&&age>24){this.tiles[i]=t===48?0:t+1;this.cooldown.set(i,this.frames);this.event('glass')}else if(fresh&&age>30&&(t===41||t===42||t===43)){if(t===43)this.rotation=-this.rotation;else{this.rotation=Math.sign(this.rotation)*(t===41?128:64);this.tiles[i]=t===41?42:41}this.cooldown.set(i,this.frames);this.event('switch')}}
 private exit(){if(this.mode==='playing'){this.mode='exiting';this.exitAge=0;this.keys.clear();this.jumpQueued=false}}
}
