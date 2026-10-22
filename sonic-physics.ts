/** Sonic 2 movement, in pixels/frame and pixels/frame² at 60 Hz.
 * Sources: Sonic Retro SPG:Forces, SPG:Slope_Physics,
 * SPG:Special_Abilities, SPG:Super_Speeds; cross-checked against
 * sonicretro/s2disasm: Sonic_Move, Sonic_RollSpeed, Sonic_ChgJumpDir,
 * Sonic_Jump, Sonic_UpdateSpindash, Sonic_SlopeResist, Sonic_RollRepel.
 * This is the movement model, not a claim of ROM-identical level collision.
 * Our handcrafted surfaces, platforms, bosses and half-pipe remain custom.
 */
export const SONIC_PHYSICS = Object.freeze({
 fps:60, subpixels:256,
 acceleration:12/256, braking:128/256, friction:12/256, topSpeed:6,
 airAcceleration:24/256, gravity:56/256, jumpSpeed:6.5, jumpRelease:4,
 rollFriction:6/256, rollBraking:32/256, rollStart:.5, rollStop:0,
 slope:32/256, rollUphill:20/256, rollDownhill:80/256,
 slipSpeed:2.5, controlLock:30, rollingXLimit:16,
 hurtX:2, hurtY:-4, hurtGravity:48/256, deathY:-7, redSpring:16, springLock:16,
 shoeAcceleration:24/256, shoeFriction:24/256, shoeAirAcceleration:48/256,
 shoeRollFriction:12/256, shoeTopSpeed:12,
 dashIncrement:2, dashMax:8, dashBase:8,
})
export const fixed = (value:number) => Math.floor(value*256)/256
// Original 256-angle, signed 8.8 sine table (including its two asymmetric entries).
const sine = Array.from({length:256},(_,i)=>i===147||i===237?-117:Math.trunc(Math.sin(i*Math.PI/128)*256))
export function surface(angle:number){
 const index=((Math.round(angle*128/Math.PI)%256)+256)%256
 return {index, angle:(index>128?index-256:index)*Math.PI/128, sin:sine[index]/256, cos:sine[(index+64)%256]/256}
}
export type JumpFeel='classic'|'crisp'
/** Optional landing assist. Classic retains the original forces on both halves. */
export const CRISP_FALL_GRAVITY=72/256
export function jumpGravity(vy:number,ownJump:boolean,feel:JumpFeel){return feel==='crisp'&&ownJump&&vy>=0?CRISP_FALL_GRAVITY:SONIC_PHYSICS.gravity}

export function slopeStep(speed:number,angle:number,rolling:boolean,dt=1){
 const s=surface(angle)
 // Sonic 2 excludes the ceiling quadrant from pseudo-gravity.
 if(s.index>=96&&s.index<=160||!rolling&&speed===0)return speed
 const factor=rolling?(speed*s.sin<0?SONIC_PHYSICS.rollUphill:SONIC_PHYSICS.rollDownhill):SONIC_PHYSICS.slope
 return speed+fixed(factor*s.sin)*dt
}
export function groundStep(speed:number,left:boolean,right:boolean,rolling:boolean,shoes:boolean,locked=false,dt=1,water=false,superForm=false){
 const p=SONIC_PHYSICS,scale=water?.5:1,acc=(superForm?48/256:shoes?p.shoeAcceleration:p.acceleration)*scale,top=(superForm?10:shoes?p.shoeTopSpeed:p.topSpeed)*scale
 if(!locked){
  if(rolling){
   if(left&&speed>0){speed-=p.rollBraking*dt;if(speed<0)speed=-.5}
   if(right&&speed<0){speed+=p.rollBraking*dt;if(speed>=0)speed=.5}
  }else{
   if(left){if(speed>0){speed-=(superForm?1:p.braking)*scale*dt;if(speed<0)speed=-.5}else if(speed>-top)speed=Math.max(-top,speed-acc*dt)}
   if(right){if(speed<0){speed+=(superForm?1:p.braking)*scale*dt;if(speed>=0)speed=.5}else if(speed<top)speed=Math.min(top,speed+acc*dt)}
  }
 }
 const friction=(rolling?(shoes?p.shoeRollFriction:p.rollFriction):superForm?48/256:shoes?p.shoeFriction:p.friction)*scale
 if(rolling||!left&&!right)speed-=Math.sign(speed)*Math.min(Math.abs(speed),friction*dt)
 return speed
}
export function airStep(vx:number,vy:number,left:boolean,right:boolean,shoes:boolean,rollJump:boolean,dt=1,water=false,superForm=false){
 const p=SONIC_PHYSICS,acc=(superForm?96/256:shoes?p.shoeAirAcceleration:p.airAcceleration)*(water?.5:1),top=(superForm?10:shoes?p.shoeTopSpeed:p.topSpeed)*(water?.5:1)
 if(!rollJump){if(left)vx=Math.max(-top,vx-acc*dt);if(right)vx=Math.min(top,vx+acc*dt)}
 // Original ASR #5 operates on the 8.8 velocity, before movement/gravity.
 if(vy>=-4&&vy<0)vx-=Math.floor(vx*256/32)/256*dt
 return vx
}
export const decayDash = (charge:number) => Math.max(0,charge-Math.floor(charge*256/32)/256)
export const dashSpeed = (charge:number) => SONIC_PHYSICS.dashBase+Math.floor(charge)/2
export function landingSpeed(vx:number,vy:number,angle:number){
 const a=surface(angle)
 if(Math.abs(vx)>Math.abs(vy))return vx
 if(((a.index+32)&64)!==0)return fixed(Math.min(vy,15.75)*Math.sign(a.sin))
 if(((a.index+16)&32)!==0)return fixed(fixed(vy/2)*Math.sign(a.sin))
 return vx
}
