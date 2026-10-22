import { pixelText } from './pixel-art'
const poses=new Image(),emblem=new Image(),background=new Image()
poses.src='/art/sonic-title-poses.png';emblem.src='/art/sonic-title-emblem.png';background.src='/art/original/title-background.png'
/** Original GHZ title backdrop, title palette and six-tick water palette cycle. */
export function drawTitle(c:CanvasRenderingContext2D,t:number,_compact:boolean,sound:boolean,continuing=false,reduced=false,unlocked=false,musicReady=false){
 if(reduced)t=0;c.imageSmoothingEnabled=false;c.fillStyle='#2400b6';c.fillRect(0,0,320,224)
 if(background.complete&&background.naturalWidth){const phase=Math.floor(t*10)%4,offset=Math.floor(t*8)%background.width;for(let x=-offset;x<320;x+=background.width)c.drawImage(background,0,phase*256,background.width,224,x,0,background.width,224)}
 if(emblem.complete&&emblem.naturalWidth&&poses.complete&&poses.naturalWidth){c.drawImage(emblem,0,0,256,148,32,12,256,148);const frame=reduced?0:Math.floor(t*7.5)%2;c.drawImage(poses,frame*88,0,88,104,120,2,88,104);c.drawImage(emblem,0,72,256,76,32,84,256,76)}else pixelText(c,'LOADING ORIGINAL ART',160,100,'#ffffff',8,'center')
 if(reduced||Math.floor(t*1.65)%2===0)pixelText(c,'PRESS START BUTTON',160,181,'#ffffff',8,'center')
 pixelText(c,unlocked?'LEVEL SELECT ENABLED':continuing?'CONTINUE YOUR ADVENTURE':'SONIC THE HEDGEHOG',160,199,unlocked?'#ffff00':'#ffffff',8,'center')
 pixelText(c,musicReady?'SEGA 1991':'TAP THE TITLE FOR ORIGINAL MUSIC',160,217,'#ffffff',8,'center');pixelText(c,sound?'SOUND ON':'SOUND OFF',313,12,'#ffffff',8,'right')
}
