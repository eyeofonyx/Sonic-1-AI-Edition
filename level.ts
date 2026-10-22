export type Platform = {x:number;y:number;w:number;h?:number;kind?:'ledge'|'moving'|'crumble'|'capsule';axis?:'x'|'y';range?:number;period?:number;phase?:number;timer?:number;art?:string;artX?:number;artY?:number;originalId?:number;subtype?:number;flags?:number;anchorX?:number;anchorY?:number;hazard?:boolean;pushable?:boolean;breakable?:boolean;invisible?:boolean;profile?:number[];inactive?:boolean;travel?:number;triggered?:boolean;path?:readonly(readonly number[])[];pathIndex?:number;reversed?:boolean}
export type Enemy = {x:number;y:number;base:number;baseY:number;kind:'crab'|'bug'|'bee'|'fish';alive:boolean;phase:number;cooldown:number;originalId?:number;subtype?:number;flags?:number;direction?:number;shots?:number;awake?:boolean}
export type Monitor = {x:number;y:number;kind:'rings'|'shield'|'shoes'|'invincible'|'life';broken:boolean}
export const LEVEL_END=8330
// Each stretch is deliberately different: meadow, river bridge, cliff staircase,
// speed valley and loop, high/low gorge routes, tunnel, treetops, final ravine.
export const terrain = [
 [0,560],[350,560],[500,594],[690,530],[850,530],[880,550],[1210,550],
 [1400,550],[1560,642],[1720,642],[1940,493],[2110,493],[2390,620],[2860,620],
 [3100,538],[3330,538],[3340,626],[3800,626],[3930,538],[4010,538],[4240,650],[4770,650],
 [4930,570],[5190,456],[5410,456],[5780,640],[6400,640],[6650,550],
 [6840,550],[6860,644],[7250,644],[7420,610],[7640,520],[8600,520]
]
export const gaps = [[880,1200],[3340,3740],[6870,7190]]
export function inGap(x:number){return gaps.some(([a,b])=>x>a&&x<b)}
export function ground(x:number){
 for(let i=1;i<terrain.length;i++){const a=terrain[i-1],b=terrain[i];if(x<=b[0]){const t=Math.max(0,(x-a[0])/(b[0]-a[0]));return a[1]+(b[1]-a[1])*(1-Math.cos(t*Math.PI))/2}}
 return 520
}
export const loopDefs = [{x:2620,base:620,r:92},{x:6100,base:640,r:104}]
export const bridgeDefs = [{x:868,end:1212,y:545},{x:3325,end:3750,y:626},{x:6850,end:7210,y:644}]
export const spikeDefs = [{x:1610,w:64},{x:3240,w:64},{x:4290,w:64},{x:4820,w:48},{x:6640,w:48},{x:7390,w:64}]
export const springDefs = [{x:1490,y:ground(1490),dir:'up'},{x:3150,y:ground(3150),dir:'up'},{x:4810,y:ground(4810),dir:'up'},{x:5510,y:ground(5510),dir:'right'},{x:7280,y:ground(7280),dir:'up'}] as const
export const checkpoints=[3890,6540]
export const palms=[70,570,790,1290,1470,1970,2180,2920,3190,3870,4110,4850,5140,5350,5640,6420,6710,7310,7720,8080]
export const flowers=[270,330,740,1320,1730,2050,2240,2890,3050,3920,4070,4470,4920,5240,5500,5900,6330,6520,6810,7520,7860,7960,8170]
export const sections=[{x:0,name:'PALM MEADOW'},{x:880,name:'WATERFALL CROSSING'},{x:1400,name:'THE HIGH ROAD'},{x:2200,name:'LOOP VALLEY'},{x:3100,name:'CASCADE GORGE'},{x:4100,name:'UNDER THE HILL'},{x:5100,name:'TREETOP RUN'},{x:5700,name:'THE BIG LOOP'},{x:6850,name:'FINAL CROSSING'},{x:7700,name:'THE HOME STRETCH'}]
export function makePlatforms():Platform[]{return [
 {x:414,y:462,w:190},{x:615,y:388,w:200},{x:930,y:396,w:100,kind:'moving',axis:'y',range:44,period:3.8},
 {x:1320,y:450,w:112},{x:1510,y:372,w:104},{x:1710,y:300,w:140},{x:1930,y:300,w:210},
 {x:2230,y:350,w:156},{x:2470,y:300,w:150},{x:2770,y:378,w:160},
 {x:3180,y:406,w:96},{x:3370,y:386,w:96,kind:'moving',axis:'x',range:65,period:4.5},
 {x:3560,y:360,w:96,kind:'moving',axis:'y',range:45,period:3.2,phase:1.2},{x:3750,y:408,w:112},
 {x:4160,y:478,w:100},{x:4400,y:530,w:380,h:74},{x:4670,y:428,w:100},
 {x:5050,y:380,w:100},{x:5300,y:310,w:132},{x:5510,y:288,w:180},
 {x:5770,y:352,w:112,kind:'moving',axis:'y',range:30,period:4},
 {x:5980,y:312,w:160},{x:6230,y:340,w:150},{x:6480,y:406,w:112},
 {x:6860,y:446,w:90},{x:7000,y:408,w:88,kind:'crumble'},{x:7130,y:450,w:88,kind:'crumble'},
 {x:7490,y:432,w:100},{x:7730,y:350,w:140}
]}
export function platformPosition(p:Platform,time:number){const offset=p.kind==='moving'?Math.sin(time*2*Math.PI/(p.period||4)+(p.phase||0))*(p.range||40):0;return {x:p.x+(p.axis==='x'?offset:0),y:p.y+(p.axis==='y'?offset:0)}}
export function platformTop(p:Platform,x:number,time:number){const pos=platformPosition(p,time);return pos.y+(p.profile?.[Math.max(0,Math.min(p.w-1,Math.floor(x-pos.x)))]||0)}
export function makeEnemies():Enemy[]{return ([
 [670,'bug'],[1020,'fish'],[1360,'crab'],[1780,'bee',400],[2030,'bug'],[2960,'crab'],
 [3480,'fish'],[3610,'bee',300],[4050,'bug'],[4520,'bug'],[4900,'crab'],
 [5320,'bee',230],[5710,'bug'],[6440,'crab'],[7020,'fish'],[7390,'bee',400],[7900,'bug']
 ] as [number,Enemy['kind'],number?][]).map(([x,kind,y],i)=>({x,y:y??ground(x),base:x,baseY:y??ground(x),kind,alive:true,phase:i*1.7,cooldown:100+i*11}))}
export function makeMonitors():Monitor[]{return ([
 [690,388,'shield'],[1330,450,'rings'],[1830,300,'life'],[2080,493,'rings'],
 [2540,300,'invincible'],[3250,406,'rings'],[3960,538,'shield'],[4550,650,'rings'],
 [4740,530,'shoes'],[5580,288,'life'],[6290,340,'rings'],[6770,ground(6770),'shield'],[7790,350,'rings']
 ] as [number,number,Monitor['kind']][]).map(([x,y,kind])=>({x,y,kind,broken:false}))}
export function makeRings(){const result:{x:number;y:number;taken:boolean}[]=[];const line=(x:number,y:number,n:number,dx=25,dy=0)=>{for(let i=0;i<n;i++)result.push({x:x+i*dx,y:y+i*dy,taken:false})};const arc=(x:number,y:number,n:number,span:number,height:number)=>{for(let i=0;i<n;i++)result.push({x:x+i*span/(n-1),y:y-Math.sin(i/(n-1)*Math.PI)*height,taken:false})};
 line(230,526,5);arc(405,503,7,250,120);line(636,350,4);arc(900,500,9,270,68);
 line(1328,415,4);arc(1430,526,6,300,150);line(1750,264,5);line(1960,264,6);
 for(const x of [2180,2230,2280,2330,2380,2430])line(x,ground(x)-31,1);
 for(let i=0;i<10;i++){const a=.2+i/9*(Math.PI*2-.4);result.push({x:2620+Math.sin(a)*73,y:528+Math.cos(a)*73,taken:false})}
 line(2500,265,4);arc(2930,537,7,220,75);line(3200,370,3);line(3390,350,3);line(3580,310,3);arc(3380,588,11,320,28);
 line(3800,504,5);arc(4250,599,7,200,110);line(4440,492,10);line(4470,620,5);arc(4870,534,7,240,110);
 line(5340,274,4);line(5540,252,5);line(5790,300,3);line(6010,276,5);line(6260,304,4);
 for(const x of [5450,5500,5550,5600,5650,5700,5750,5800,5850])line(x,ground(x)-31,1);
 for(let i=0;i<12;i++){const a=.2+i/11*(Math.PI*2-.4);result.push({x:6100+Math.sin(a)*85,y:536+Math.cos(a)*85,taken:false})}
 arc(6510,534,7,240,78);arc(6870,601,11,300,32);line(6875,410,3);line(7015,370,3);line(7140,414,3);
 arc(7470,572,8,250,120);line(7760,314,4);line(7910,486,8);return result
}
