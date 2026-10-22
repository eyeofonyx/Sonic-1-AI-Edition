const TIME_BONUSES=[50000,50000,10000,5000,4000,4000,3000,3000,2000,2000,2000,2000,1000,1000,1000,1000,500,500,500,500,0]
export function timeBonus(seconds:number){return TIME_BONUSES[Math.min(20,Math.max(0,Math.floor(seconds/15)))]}
/** Sonic 1 counts 100 from each nonempty bonus per frame; the blip sounds every fourth frame. */
export class ScoreTally{
 time:number;ring:number;total=0;age=0;doneAge=0;done=false
 constructor(seconds:number,rings:number,special=false){this.time=special?0:timeBonus(seconds);this.ring=Math.max(0,Math.floor(rings))*100}
 step(dt=1){this.age+=dt;if(this.done){this.doneAge+=dt;return{points:0,tick:false,finished:false}}if(this.age<210)return{points:0,tick:false,finished:false};const a=Math.min(100,this.time),b=Math.min(100,this.ring),points=a+b;this.time-=a;this.ring-=b;this.total+=points;if(!this.time&&!this.ring){this.done=true;return{points,tick:false,finished:true}}return{points,tick:Math.floor(this.age)%4===0,finished:false}}
 finish(){if(this.done)return 0;const points=this.time+this.ring;this.time=0;this.ring=0;this.total+=points;this.done=true;return points}
}
