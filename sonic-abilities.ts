import type { Track } from './original-music'
/** Numbered previews are an adaptation to this game's Sonic 1 soundtrack. */
export const soundTestTracks:readonly Track[]=['title','hill','marble','spring','labyrinth','starlight','scrap','final','ending','credits','special','boss','clear','invincible','life','over','emerald','drowning','super']
export class SuperSoundCode{
 private cursor=0
 play(id:number){const code=[4,1,2,6];this.cursor=id===code[this.cursor]?this.cursor+1:id===4?1:0;if(this.cursor!==4)return false;this.cursor=0;return true}
}
export class EmeraldSoundCode{
 private cursor=0
 play(id:number){const code=[1,9,9,2,1,1,2,4],prefix=[0,0,0,0,1,1,0,0];while(this.cursor&&id!==code[this.cursor])this.cursor=prefix[this.cursor-1];if(id===code[this.cursor])this.cursor++;if(this.cursor!==code.length)return false;this.cursor=0;return true}
}
export const DROP_CHARGE_FRAMES=20
/** Mania's directional landing formula; water scales the resulting impulse. */
export function dropDashSpeed(ground:number,vx:number,angle:number,face:number,superForm=false,water=false){const direction=face<0?-1:1,boost=superForm?12:8,cap=superForm?13:12;let speed:number;if(vx*direction>=0)speed=direction*Math.min(cap,boost+ground*direction/4);else speed=angle?ground/2+direction*boost:direction*boost;return speed*(water?.5:1)}
