import {clamp} from './math.js';
export const SAVE_KEY='coqui-beta-v1';
export const POWERS=['bubble','fire','ice','stone','glide','heart'];
export const defaults=()=>({version:1,unlocked:1,current:0,powers:['bubble'],attack:'bubble',runs:{},completed:{},muted:false,quality:'high'});
const integer=(v,a,b,fallback)=>Number.isInteger(v)?clamp(v,a,b):fallback;
export function sanitize(raw){
  const s=defaults();if(!raw||typeof raw!=='object')return s;
  s.unlocked=integer(raw.unlocked,1,4,1);s.current=integer(raw.current,0,s.unlocked-1,0);
  s.powers=Array.isArray(raw.powers)?[...new Set(['bubble',...raw.powers.filter(p=>POWERS.includes(p))])]:s.powers;
  s.attack=['bubble','fire','ice','stone'].includes(raw.attack)&&s.powers.includes(raw.attack)?raw.attack:'bubble';
  s.muted=raw.muted===true;s.quality=raw.quality==='low'?'low':'high';
  for(let i=0;i<4;i++){
    const r=raw.runs?.[i];if(r&&typeof r==='object')s.runs[i]={checkpoint:integer(r.checkpoint,0,20,0),coins:Array.isArray(r.coins)?r.coins.filter(Number.isInteger).slice(0,1000):[],relics:Array.isArray(r.relics)?r.relics.filter(Number.isInteger).slice(0,20):[],songs:Array.isArray(r.songs)?r.songs.filter(Number.isInteger).slice(0,4):[],time:Number.isFinite(r.time)?clamp(r.time,0,1e6):0,deaths:integer(r.deaths,0,1e6,0)};
    const c=raw.completed?.[i];if(c&&Number.isFinite(c.time)&&c.time>0)s.completed[i]={time:c.time,coins:integer(c.coins,0,1000,0),relics:integer(c.relics,0,20,0)};
  }return s;
}
export class SaveStore {
  constructor(storage){this.storage=storage;this.available=true;this.data=defaults();try{const raw=storage.getItem(SAVE_KEY);if(raw)this.data=sanitize(JSON.parse(raw));else this.migrate();}catch{this.available=false;}}
  migrate(){const raw=this.storage.getItem('coquito-del-yunque-save-v3');if(!raw)return;try{const old=JSON.parse(raw);const names={bubbleBurst:'bubble',fireBall:'fire',iceBall:'ice',stoneBall:'stone',leafGlide:'glide',heartReserve:'heart'};for(const [key,name]of Object.entries(names))if(old?.permanentPowerups?.[key]&&!this.data.powers.includes(name))this.data.powers.push(name);/* The new campaign uses different routes: old level indexes and coordinates are not transferable. */}catch{}}
  write(){try{this.storage.setItem(SAVE_KEY,JSON.stringify(this.data));this.available=true;return true;}catch{this.available=false;return false;}}
}
