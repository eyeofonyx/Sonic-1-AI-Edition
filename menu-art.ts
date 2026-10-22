import { pixelText } from './pixel-art'
const make=(path:string)=>{if(typeof Image==='undefined')return null;const a=new Image();a.src=path;return a}
const font=make('/art/original/menu-font.png'),background=make('/art/original/level-select-background.png'),tints=new Map<string,HTMLCanvasElement>()
export function menuText(c:CanvasRenderingContext2D,s:string,x:number,y:number,color='#ffffff',align:CanvasTextAlign='left'){
 if(!font?.complete||!font.naturalWidth){pixelText(c,s,x,y,color,8,align);return}
 let source=tints.get(color);if(!source){source=document.createElement('canvas');source.width=font.width;source.height=font.height;const p=source.getContext('2d')!;p.drawImage(font,0,0);p.globalCompositeOperation='multiply';p.fillStyle=color;p.fillRect(0,0,source.width,source.height);p.globalCompositeOperation='destination-in';p.drawImage(font,0,0);tints.set(color,source)}
 x=Math.round(x-(align==='center'?s.length*4:align==='right'?s.length*8:0));y=Math.round(y-8);c.imageSmoothingEnabled=false
 for(let i=0;i<s.length;i++){const ch=s[i].toUpperCase(),n=/[0-9]/.test(ch)?ch.charCodeAt(0)-48:/[A-Z]/.test(ch)?ch.charCodeAt(0)-65+14:ch===':'?10:-1;if(n>=0)c.drawImage(source,n%16*8,Math.floor(n/16)*8,8,8,x+i*8,y,8,8)}
}
export function drawMenuBackground(c:CanvasRenderingContext2D,t:number,reduced:boolean){c.imageSmoothingEnabled=false;c.fillStyle='#0000aa';c.fillRect(0,0,320,224);if(!background?.complete||!background.naturalWidth)return;const tick=reduced?0:Math.floor(t*60)%424,frame=tick<200?0:tick<206?1:tick<212?2:tick<412?3:tick<418?2:1;c.drawImage(background,0,frame*224,320,224,0,0,320,224)}
