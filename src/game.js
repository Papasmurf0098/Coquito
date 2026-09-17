import {clamp,approach,overlap,distance} from './math.js';
import {createLevel} from './levels.js';
export const ATTACKS=['bubble','fire','ice','stone'];
export const POWER_INFO={bubble:{name:'Bubble',label:'Homing burst',color:'#9ce9ff',cooldown:.34,speed:510},fire:{name:'Flame',label:'Burn thorns · ember pools',color:'#ffb46c',cooldown:.4,speed:540},ice:{name:'Frost',label:'Freeze foes · make ice steps',color:'#b1f5ff',cooldown:.48,speed:470},stone:{name:'Stone',label:'Break rocks · crush spikes',color:'#d8caa9',cooldown:.58,speed:430},glide:{name:'Leaf Glide',label:'Press again to flutter · hold to glide',color:'#b4e995'},heart:{name:'Heart Reserve',label:'Absorbs one hit',color:'#ffabbe'}};
export class Game {
 constructor(store){this.store=store;this.events=[];this.mode='menu';this.time=0;this.particles=[];this.load(store.data.current,true);this.mode='menu';}
 emit(type,text=''){this.events.push({type,text});}
 load(index,resume=true){
  this.level=createLevel(index);this.index=index;this.time=0;this.particles=[];this.shots=[];this.embers=[];this.ice=[];this.revealed=new Set();this.broken=new Set();this.iceId=1e5;this.lastZone=-1;this.shake=0;
  const run=resume?this.store.data.runs[index]:null;
  this.coins=new Set(run?.coins||[]);this.relics=new Set(run?.relics||[]);this.songs=new Set((run?.songs||[]).filter(i=>i>=0&&i<3));this.elapsed=run?.time||0;this.deaths=run?.deaths||0;
  this.checkpoint=Math.min(run?.checkpoint||0,this.level.checkpoints.length-1);
  const cp=this.level.checkpoints[this.checkpoint];
  this.player={x:cp.x,y:cp.y,prevX:cp.x,prevY:cp.y,w:38,h:48,vx:0,vy:0,facing:1,ground:false,coyote:0,buffer:0,invincible:0,hp:3,shield:this.store.data.powers.includes('heart')?1:0,flutter:true,attack:0,chirp:0,chirpFlash:0,anim:0,support:null,wall:0,gliding:false};
  this.camera={x:Math.max(0,cp.x-260),y:0};this.mode='playing';this.store.data.current=index;this.save();
  this.emit('level',this.level.theme.intro);
 }
 save(){this.store.data.runs[this.index]={checkpoint:this.checkpoint,coins:[...this.coins],relics:[...this.relics],songs:[...this.songs],time:this.elapsed,deaths:this.deaths};this.store.write();}
 pause(){if(this.mode==='playing'){this.mode='paused';this.save();}}
 resume(){if(this.mode==='paused')this.mode='playing';}
 own(power){return this.store.data.powers.includes(power);}
 get attack(){return POWER_INFO[this.store.data.attack]||POWER_INFO.bubble;}
 swap(){const available=ATTACKS.filter(p=>this.own(p));this.store.data.attack=available[(available.indexOf(this.store.data.attack)+1)%available.length];this.emit('swap',this.attack.name);this.save();}
 select(power){if(ATTACKS.includes(power)&&this.own(power)){this.store.data.attack=power;this.save();}}
 burst(x,y,color,n=10){for(let i=0;i<n;i++){const angle=i/n*Math.PI*2;this.particles.push({x,y,vx:Math.cos(angle)*(65+i%3*28),vy:Math.sin(angle)*85-45,life:.55,max:.55,color,r:2+i%3});}if(this.particles.length>160)this.particles.splice(0,this.particles.length-160);}
 checkpointRespawn(){const p=this.player,cp=this.level.checkpoints[this.checkpoint];Object.assign(p,{x:cp.x,y:cp.y,prevX:cp.x,prevY:cp.y,vx:0,vy:0,ground:false,coyote:0,buffer:0,wall:0,support:null,flutter:true,invincible:1.6});this.deaths++;this.camera.x=Math.max(0,p.x-260);}
 hurt(fall=false){const p=this.player;if(this.mode!=='playing')return;if(fall){if(!p.invincible){if(p.shield)p.shield=0;else p.hp--;}if(p.hp<=0)p.hp=3;this.checkpointRespawn();this.emit('hurt');this.shake=.15;return;}if(p.invincible>0)return;if(p.shield)p.shield=0;else p.hp--;this.shake=.16;p.invincible=1.5;p.vx=-p.facing*180;p.vy=-230;this.emit('hurt');this.burst(p.x+19,p.y+24,'#ffe2b8');if(p.hp<=0){p.hp=3;this.checkpointRespawn();}}
 fire(){const p=this.player;if(p.attack>0||this.mode!=='playing')return;const type=this.store.data.attack,def=POWER_INFO[type];if(!def||!this.own(type))return;p.attack=def.cooldown;this.shots.push({x:p.x+19+p.facing*28,y:p.y+(type==='stone'?37:22),vx:p.facing*def.speed,vy:type==='stone'?20:0,r:type==='stone'?13:10,type,life:type==='stone'?2.2:1,hit:new Set(),chains:type==='bubble'?1:0,ground:false});this.emit('attack');}
 chirp(){const p=this.player;if(p.chirp>0)return;p.chirp=.85;p.chirpFlash=.6;this.emit('chirp');const center={x:p.x+19,y:p.y+24};
  for(const platform of this.level.platforms)if(platform.kind==='hidden'&&distance(center,{x:platform.x+platform.w/2,y:platform.y})<280){this.revealed.add(platform.id);this.burst(platform.x+platform.w/2,platform.y,'#caffce');}
  for(const s of this.level.shrines)if(!this.songs.has(s.id)&&distance(center,{x:s.x+25,y:s.y+40})<150){this.songs.add(s.id);this.emit('song',`${this.songs.size} / 3 songs awakened`);this.burst(s.x+25,s.y+35,'#fff0a9',24);this.save();}
 }
 addIce(x,y){this.ice.push({id:this.iceId++,x:clamp(x-45,0,this.level.width-90),y:clamp(y,120,645),w:100,h:18,kind:'ice',life:5,maxLife:5});if(this.ice.length>5)this.ice.shift();}
 terrain(){return [...this.level.platforms.filter(s=>s.kind!=='hidden'||this.revealed.has(s.id)).filter(s=>!s.gone),...this.ice,...this.level.gates.filter(g=>!this.broken.has(g.id)).map(g=>({...g,kind:'gate'}))];}
 update(dt,input){
  if(this.mode!=='playing')return;
  this.time+=dt;this.elapsed+=dt;const p=this.player;p.prevX=p.x;p.prevY=p.y;
  for(const k of ['invincible','attack','chirp','chirpFlash'])p[k]=Math.max(0,p[k]-dt);this.shake=Math.max(0,this.shake-dt);
  for(const part of this.particles){part.life-=dt;part.x+=part.vx*dt;part.y+=part.vy*dt;part.vy+=220*dt;}this.particles=this.particles.filter(p=>p.life>0);
  for(const s of this.ice)s.life-=dt;this.ice=this.ice.filter(s=>s.life>0);
  for(const s of this.level.platforms){
   s.dx=0;s.dy=0;if(s.motion){const m=s.motion,oldX=s.x,oldY=s.y;s.x=s.baseX+Math.sin(this.time*m.speed+m.phase)*(m.dx||0);s.y=s.baseY+Math.sin(this.time*m.speed+m.phase)*(m.dy||0);s.dx=s.x-oldX;s.dy=s.y-oldY;}
   if(s.crumble>0){s.crumble-=dt;if(s.crumble<=0){s.gone=3;this.burst(s.x+s.w/2,s.y,'#d2caba');}}
   else if(s.gone>0)s.gone=Math.max(0,s.gone-dt);
  }
  const support=this.level.platforms.find(s=>s.id===p.support);
  if(support&&!support.gone&&p.ground){p.x+=support.dx;p.y+=support.dy;}
  if(input.consume('swap'))this.swap();
  if(input.consume('chirp'))this.chirp();
  if(input.consume('attack'))this.fire();
  if(input.consume('jump'))p.buffer=.12;else p.buffer=Math.max(0,p.buffer-dt);
  p.coyote=p.ground?.1:Math.max(0,p.coyote-dt);
  const axis=Number(input.down('right'))-Number(input.down('left'));if(axis)p.facing=axis;
  const sliding=this.index===1&&Math.floor(p.x/2100)%4===2;
  p.vx=approach(p.vx,axis*290,(axis?(p.ground?2300:1500):p.ground?(sliding?400:2200):650)*dt);
  if(p.buffer>0&&(p.coyote>0||p.wall)){
   p.vy=-670;if(p.wall&&!p.ground){p.vx=-p.wall*290;p.facing=-p.wall;}p.buffer=0;p.coyote=0;p.ground=false;p.wall=0;p.support=null;p.flutter=true;this.emit('jump');
  }else if(p.buffer>0&&this.own('glide')&&!p.ground&&p.flutter){p.vy=Math.min(p.vy,-310);p.vx+=p.facing*65;p.flutter=false;p.buffer=0;this.emit('flutter');}
  p.gliding=this.own('glide')&&!p.ground&&input.down('jump')&&p.vy>0;
  p.vy+=1680*dt*(p.gliding?.38:1);
  if(!input.down('jump')&&p.vy< -190)p.vy+=1250*dt;
  if(p.gliding)p.vy=Math.min(p.vy,175);
  for(const wind of this.level.winds)if(overlap(p,wind)){p.vx+=wind.fx*dt;p.vy+=wind.fy*dt;}
  for(const vent of this.level.vents)if(overlap(p,vent))p.vy=Math.max(-640,p.vy-vent.force*dt);
  p.vy=clamp(p.vy,-850,850);
  const rects=this.terrain().filter(s=>s.x+s.w>p.x-160&&s.x<p.x+p.w+160);
  const full=s=>['ground','rootground','cliff','vine','gate'].includes(s.kind);
  p.x+=p.vx*dt;p.wall=0;
  for(const s of rects)if(full(s)&&overlap(p,s)){const dir=p.vx>0?1:-1;p.x=dir>0?s.x-p.w:s.x+s.w;p.vx=0;if(s.kind==='vine')p.wall=dir;}
  if(p.wall&&p.vy>130)p.vy=130;
  const bottom=p.y+p.h;p.y+=p.vy*dt;p.ground=false;p.support=null;
  // Choose the first surface crossed, independent of the order of level rectangles.
  const floors=rects.filter(s=>p.x+p.w>s.x+.5&&p.x<s.x+s.w-.5&&p.vy>=0&&bottom<=s.y+Math.max(2,s.dy||0)&&p.y+p.h>=s.y).sort((a,b)=>a.y-b.y);
  if(floors.length){const s=floors[0];p.y=s.y-p.h;p.vy=0;p.ground=true;p.support=s.id;p.flutter=true;if(s.kind==='crumble'&&!s.crumble)s.crumble=.75;}
  else if(p.vy<0){for(const s of rects)if(full(s)&&overlap(p,s)){p.y=s.y+s.h;p.vy=0;}}
  p.x=clamp(p.x,0,this.level.width-p.w);p.anim+=dt*(Math.abs(p.vx)>10?Math.abs(p.vx)*.035:2);
  if(p.y>1000){this.hurt(true);return;}
  for(const h of this.level.hazards)if(!this.broken.has(`spike-${h.id}`)&&overlap(p,h))this.hurt();
  for(const enemy of this.level.enemies){
   if(enemy.hp<=0)continue;enemy.flash=Math.max(0,(enemy.flash||0)-dt);enemy.frozen=Math.max(0,(enemy.frozen||0)-dt);
   if(!enemy.frozen){enemy.x+=enemy.dir*enemy.speed*dt;if(enemy.x<enemy.min){enemy.x=enemy.min;enemy.dir=1;}if(enemy.x+enemy.w>enemy.max){enemy.x=enemy.max-enemy.w;enemy.dir=-1;}if(enemy.type==='bat')enemy.y=365+Math.sin(this.time*2.5+enemy.id)*42;}
   if(overlap(p,enemy)){
    if(p.vy>30&&p.prevY+p.h<=enemy.y+12){enemy.hp--;enemy.flash=.2;p.vy=-390;this.burst(enemy.x+19,enemy.y+10,'#ffdc9a');this.emit('attack');}
    else if(!enemy.frozen)this.hurt();
   }
  }
  this.updateShots(dt);
  for(const pool of this.embers){pool.life-=dt;pool.tick-=dt;if(pool.tick<=0){pool.tick=.35;for(const e of this.level.enemies)if(e.hp>0&&distance(pool,{x:e.x+19,y:e.y+19})<70){e.hp--;e.flash=.2;}}}this.embers=this.embers.filter(e=>e.life>0);
  for(const c of this.level.coins)if(!this.coins.has(c.id)&&overlap(p,c)){this.coins.add(c.id);this.emit('coin');this.burst(c.x,c.y,'#ffe5a0',5);}
  for(const r of this.level.relics)if(!this.relics.has(r.id)&&overlap(p,r)){this.relics.add(r.id);this.emit('power',`Relic ${this.relics.size} / 3`);this.burst(r.x,r.y,'#f8bbff',20);this.save();}
  for(const bloom of this.level.pickups){
   if(bloom.collected||this.own(bloom.type))continue;
   const d=distance({x:p.x+19,y:p.y+24},{x:bloom.x+15,y:bloom.y+15});
   if(d<115){bloom.x+=(p.x+4-bloom.x)*dt*4;bloom.y+=(p.y+10-bloom.y)*dt*4;}
   if(d<32||overlap(p,bloom)){bloom.collected=true;this.store.data.powers.push(bloom.type);if(ATTACKS.includes(bloom.type))this.store.data.attack=bloom.type;if(bloom.type==='heart')p.shield=1;this.emit('power',`${POWER_INFO[bloom.type].name} — ${POWER_INFO[bloom.type].label}`);this.burst(bloom.x,bloom.y,POWER_INFO[bloom.type].color,22);this.save();}
  }
  for(const cp of this.level.checkpoints)if(cp.id>this.checkpoint&&overlap(p,{...cp,x:cp.x-30,w:95,h:70})){this.checkpoint=cp.id;p.hp=3;this.emit('checkpoint','Checkpoint · hearts restored');this.burst(cp.x+16,cp.y+20,'#9ef6dc');this.save();}
  const zone=Math.min(3,Math.floor(p.x/this.level.width*4));if(zone!==this.lastZone){this.lastZone=zone;if(zone>0)this.emit('zone',this.level.theme.route[zone]);}
  if(p.x+p.w>this.level.goal.x&&p.y<675){
   if(this.songs.size===3)this.finish();
   else if(!this.goalNotice||this.time-this.goalNotice>4){this.goalNotice=this.time;this.emit('notice',`The arch needs ${3-this.songs.size} more song${this.songs.size===2?'':'s'}. Use the pause map to return to a shrine.`);}
  }
 }
 finish(){this.mode='complete';this.player.vx=0;this.player.vy=0;const prev=this.store.data.completed[this.index];this.store.data.completed[this.index]={time:Math.min(prev?.time||Infinity,this.elapsed),coins:Math.max(prev?.coins||0,this.coins.size),relics:Math.max(prev?.relics||0,this.relics.size)};this.store.data.unlocked=Math.max(this.store.data.unlocked,Math.min(4,this.index+2));this.save();this.emit('win',this.index===3?'The island sings again.':'Song carried. A new path opens.');}
 returnToShrine(){const s=this.level.shrines.find(s=>!this.songs.has(s.id));if(!s)return;const cp=[...this.level.checkpoints].reverse().find(cp=>cp.x<s.x)||this.level.checkpoints[0];this.player.x=cp.x;this.player.y=cp.y;this.player.prevX=cp.x;this.player.prevY=cp.y;this.player.vx=0;this.player.vy=0;this.player.support=null;this.player.ground=false;this.player.coyote=0;this.player.buffer=0;this.player.invincible=1.5;this.camera.x=Math.max(0,cp.x-260);this.mode='playing';}
 updateShots(dt){
  for(const shot of this.shots){
   if(shot.type==='bubble'){
    const target=this.level.enemies.filter(e=>e.hp>0&&!shot.hit.has(e.id)).map(e=>({e,d:distance(shot,e)})).filter(o=>o.d<240).sort((a,b)=>a.d-b.d)[0]?.e;
    if(target){shot.vx+=clamp((target.x+19-shot.x)*5,-500,500)*dt;shot.vy+=clamp((target.y+19-shot.y)*7,-700,700)*dt;const n=Math.hypot(shot.vx,shot.vy);if(n>550){shot.vx*=550/n;shot.vy*=550/n;}}
   }
   if(shot.type==='stone')shot.vy+=800*dt;
   shot.x+=shot.vx*dt;shot.y+=shot.vy*dt;shot.life-=dt;
   const box={x:shot.x-shot.r,y:shot.y-shot.r,w:shot.r*2,h:shot.r*2};let impact=false;
   for(const gate of this.level.gates)if(!this.broken.has(gate.id)&&overlap(box,gate)){if((gate.type==='thorn'&&shot.type==='fire')||(gate.type==='rock'&&shot.type==='stone')){this.broken.add(gate.id);this.burst(gate.x,gate.y+50,this.attack.color,20);}impact=true;break;}
   if(shot.type==='stone')for(const h of this.level.hazards)if(!this.broken.has(`spike-${h.id}`)&&overlap(box,h)){this.broken.add(`spike-${h.id}`);this.burst(h.x,h.y,'#dbc6a5');}
   for(const e of this.level.enemies){if(e.hp<=0||shot.hit.has(e.id)||!overlap(box,e))continue;shot.hit.add(e.id);e.hp-=shot.type==='stone'||shot.type==='fire'?2:1;if(shot.type==='ice')e.frozen=2.5;e.flash=.2;this.burst(e.x+19,e.y+19,POWER_INFO[shot.type].color);
    if(shot.type==='bubble'&&shot.chains>0){shot.chains--;const next=this.level.enemies.find(n=>n.hp>0&&!shot.hit.has(n.id)&&distance(n,e)<250);if(next){const angle=Math.atan2(next.y+19-shot.y,next.x+19-shot.x);shot.vx=Math.cos(angle)*450;shot.vy=Math.sin(angle)*450;shot.life=.65;}else impact=true;}else impact=true;break;
   }
   if(!impact){const hit=this.terrain().find(s=>s.kind!=='ice'&&overlap(box,s));if(hit){if(shot.type==='stone'&&shot.vy>=0&&shot.y-shot.r<hit.y){shot.y=hit.y-shot.r;shot.vy=0;shot.vx=approach(shot.vx,0,70*dt);shot.ground=true;}else impact=true;}}
   if(impact||shot.life<=0){if(shot.type==='fire'){this.embers.push({x:shot.x,y:shot.y,life:1.6,tick:0});if(this.embers.length>6)this.embers.shift();}if(shot.type==='ice')this.addIce(shot.x,shot.y+18);shot.life=0;}
  }
  this.shots=this.shots.filter(s=>s.life>0&&s.x>=0&&s.x<=this.level.width&&s.y<1000);
 }
}
