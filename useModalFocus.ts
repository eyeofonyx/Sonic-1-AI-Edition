import { useEffect, useRef, type RefObject } from 'react'

/** Keep keyboard users inside a modal and return to the control that opened it. */
export function useModalFocus(dialog:RefObject<HTMLElement|null>,onClose:()=>void,open=true){
 const close=useRef(onClose);close.current=onClose
 useEffect(()=>{
  const previous=document.activeElement,root=dialog.current
  if(!root||!open)return
  const items=()=>Array.from(root.querySelectorAll<HTMLElement>('button:not(:disabled), select, input, textarea, a[href], [tabindex="0"]')).filter(e=>e.getClientRects().length>0)
  ;(root.querySelector<HTMLElement>('select')||items()[0]||root).focus()
  const key=(e:KeyboardEvent)=>{
   if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close.current();return}
   if(e.key!=='Tab')return
   const list=items(),first=list[0],last=list.at(-1)
   if(!first){e.preventDefault();return}
   if(!root.contains(document.activeElement)||e.shiftKey&&document.activeElement===first){e.preventDefault();(e.shiftKey?last:first)?.focus()}
   else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
  }
  window.addEventListener('keydown',key,true)
  return()=>{window.removeEventListener('keydown',key,true);if(previous instanceof HTMLElement&&previous.isConnected)previous.focus()}
 },[dialog,open])
}
