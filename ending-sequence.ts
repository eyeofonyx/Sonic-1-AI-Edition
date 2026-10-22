// Fixed-time, native-picture ending choreography. Pause cannot skip a pose.
export const endingLeap=(good:boolean)=>good?11.7:7.2
export const endingFinalTime=(good:boolean)=>endingLeap(good)+1.2
export function endingFrame(time:number,good:boolean){
 const leap=endingLeap(good),age=time-leap
 if(age>=.35)return{phase:age>=.65?'Sonic’s final pose':'Sonic leaps toward the screen',pose:7,leap}
 if(age>=0)return{phase:'Sonic leaps toward the screen',pose:age<.2?5:6,leap}
 if(good&&time>=10){const script=[3,4,3,4,3,4,3];return{phase:'The flowers have bloomed',pose:script[Math.min(6,Math.floor((time-10)*10))],leap}}
 if(good&&time>=5.7)return{phase:'The six Chaos Emeralds restore Green Hill',pose:2,leap}
 if(good&&time>=4.9){const script=[1,0,1,0,1,0,1,0,1,0,1,2];return{phase:'Sonic raises the emeralds',pose:script[Math.min(11,Math.floor((time-4.9)*15))],leap}}
 return{phase:time<3.6?'Sonic returns to Green Hill':'The animals gather around Sonic',pose:good?0:-1,leap}
}
export function endingApproach(t:number){
 if(t<1){const u=Math.max(0,t),distance=244*(2*u-u*u),speed=488*(1-u);return{x:336-distance,face:-1,sprite:speed>350?'sonic/Run1'+(Math.floor(distance/12)%4+1):'sonic/Walk1'+(Math.floor(distance/7)%6+1)}}
 if(t<1.3)return{x:92,face:-1,sprite:t<1.15?'sonic/Stop1':'sonic/Stop2'}
 if(t<2.4){const u=(t-1.3)/1.1,distance=68*(1-Math.cos(u*Math.PI))/2;return{x:92+distance,face:1,sprite:'sonic/Walk1'+(Math.floor(distance/7)%6+1)}}
 return{x:160,face:1,sprite:t<3?'sonic/Stand':'sonic/Wait2'}
}
export function endingLogoX(t:number,leap:number,reduced=false){if(reduced)return 64;const u=Math.max(0,Math.min(1,(t-leap-.15)/.65));return -64+128*(1-Math.pow(1-u,3))}
export function endingAnimal(t:number,i:number,reduced=false){
 const home=28+(i*23)%268,fly=[1,5].includes(i%7),arrival=Math.max(0,Math.min(1,(t-i*.07)/2.8)),ease=1-Math.pow(1-arrival,3),start=i%2?-40:360
 const x=reduced?home:start+(home-start)*ease+(arrival>=1?Math.sin(t*.8+i)*8:0),cycle=(t*(fly?2:1.6)+(i*.19))%1
 const hop=reduced?0:fly?14+Math.sin((t+i)*5)*8:4*cycle*(1-cycle)*(arrival<1?32:16)
 return{x,yOffset:hop,frame:1+(Math.floor(t*(fly?10:7)+i)%2),flip:i%2===0,fly}
}
