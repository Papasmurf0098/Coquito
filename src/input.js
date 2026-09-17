const keys={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',Space:'jump',ArrowUp:'jump',KeyW:'jump',KeyC:'chirp',KeyX:'chirp',KeyZ:'attack',KeyK:'attack',KeyR:'swap',Escape:'pause',KeyP:'pause',Enter:'confirm'};
export class Input {
  constructor(){this.sources=new Map();this.edges=new Set();}
  down(action){return [...this.sources.values()].includes(action);}
  press(source,action){if(this.sources.has(source))return;if(!this.down(action))this.edges.add(action);this.sources.set(source,action);}
  release(source){this.sources.delete(source);}
  consume(action){const yes=this.edges.has(action);this.edges.delete(action);return yes;}
  clear(){this.sources.clear();this.edges.clear();}
  bind(doc,onBlur){
    doc.addEventListener('keydown',e=>{if(/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)||e.target.isContentEditable)return;if(e.target.tagName==='BUTTON'&&!e.target.dataset.control&&(e.code==='Space'||e.code==='Enter'))return;const a=keys[e.code];if(a){if(a!=='confirm')e.preventDefault();this.press(e.code,a);}});
    doc.addEventListener('keyup',e=>this.release(e.code));
    for(const button of doc.querySelectorAll('[data-control]')){
      button.addEventListener('pointerdown',e=>{e.preventDefault();button.setPointerCapture(e.pointerId);this.press(`pointer:${e.pointerId}`,button.dataset.control);button.classList.add('held');});
      const release=e=>{this.release(`pointer:${e.pointerId}`);if(!this.down(button.dataset.control))button.classList.remove('held');};
      for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,release);
    }
    const reset=()=>{this.clear();doc.querySelectorAll('.held').forEach(el=>el.classList.remove('held'));onBlur();};
    doc.addEventListener('visibilitychange',()=>{if(doc.hidden)reset();});
    window.addEventListener('blur',reset);
  }
}
