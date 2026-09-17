export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const lerp=(a,b,t)=>a+(b-a)*t;
export const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
export const approach=(v,t,d)=>v<t?Math.min(t,v+d):Math.max(t,v-d);
export function rng(seed=1){return ()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export const STEP=1/120;
export class Clock {
  constructor(){this.accumulator=0;this.last=null;}
  reset(){this.accumulator=0;this.last=null;}
  advance(ms,update){if(this.last===null){this.last=ms;return 0;}this.accumulator+=clamp((ms-this.last)/1000,0,.15);this.last=ms;let n=0;while(this.accumulator+1e-10>=STEP){update(STEP);this.accumulator-=STEP;n++;}return n;}
}
