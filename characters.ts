export type Character='sonic'|'tails'|'knuckles'
export type CharacterAbility='normal'|'flight'|'tired'|'glide'|'climb'
export const characterNames:Record<Character,string>={sonic:'Sonic',tails:'Tails',knuckles:'Knuckles'}
export const characterDescriptions:Record<Character,string>={sonic:'Speed, Peel Out, Drop Dash & unlocked Super Sonic.',tails:'Fly and swim. Tap Jump in midair, then tap to gain height.',knuckles:'Glide, grab walls and climb. Hold Jump after a second airborne tap.'}
export type CharacterChoice=Character|'sonic-tails'
export const leadCharacter=(choice:CharacterChoice):Character=>choice==='sonic-tails'?'sonic':choice
export const choiceNames:Record<CharacterChoice,string>={sonic:'Sonic',tails:'Tails',knuckles:'Knuckles','sonic-tails':'Sonic & Tails'}
export const choiceDescriptions:Record<CharacterChoice,string>={...characterDescriptions,'sonic-tails':'You play Sonic. AI Tails follows, jumps and helps out—then flies back if left behind.'}
export const FLIGHT_TICKS=480
