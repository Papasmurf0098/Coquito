import {clamp,lerp,rng} from './math.js';
import {POWER_INFO} from './game.js';
const TAU=Math.PI*2;
export function ellipse(c,x,y,rx,ry,color,angle=0){c.fillStyle=color;c.beginPath();c.ellipse(x,y,Math.max(.01,rx),Math.max(.01,ry),angle,0,TAU);c.fill();}
function rect(c,x,y,w,h,r,color){c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();}
function line(c,points,color,width=2){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(...points[0]);for(const p of points.slice(1))c.lineTo(...p);c.stroke();}
function gradient(c,x,y,h,colors){const g=c.createLinearGradient(x,y,x,y+h);colors.forEach((v,i)=>g.addColorStop(i/(colors.length-1),v));return g;}
function leaf(c,x,y,size,angle,color){c.save();c.translate(x,y);c.rotate(angle);c.fillStyle=color;c.beginPath();c.moveTo(0,0);c.bezierCurveTo(-size*.28,-size*.4,-size*.20,-size*.95,0,-size);c.bezierCurveTo(size*.20,-size*.95,size*.28,-size*.4,0,0);c.fill();line(c,[[0,0],[0,-size*.85]],'#e2efb42a',1);c.restore();}
function fern(c,x,y,size,time,color){for(let k=-3;k<=3;k++){const a=k*.25+Math.sin(time*.8+x)*.025;c.save();c.translate(x,y);c.rotate(a);line(c,[[0,0],[k*size*.2,-size*.75],[k*size*.35,-size]],color,2);for(let j=1;j<7;j++){leaf(c,k*size*.35*j/7,-size*j/7,size*(1-j/9)*.29,-.7,color);leaf(c,k*size*.35*j/7,-size*j/7,size*(1-j/9)*.29,.7,color);}c.restore();}}
export function drawCoqui(c,p,t,scale=1){
 const run=p.ground?Math.sin(p.anim*1.8):0,bob=p.ground?Math.abs(run)*1.3:0,air=!p.ground,glide=p.gliding;
 c.save();c.translate(p.x+p.w/2,p.y+p.h/2);c.scale(p.facing*scale,scale);c.lineCap='round';c.lineJoin='round';
 if(p.invincible>0&&Math.floor(t*14)%2)c.globalAlpha=.55;
 ellipse(c,0,24,19,4,'#082f302d');
 if(glide){for(const side of [-1,1]){c.save();c.scale(side,1);leaf(c,4,5,36,1.02,'#618e39');leaf(c,7,8,31,.8,'#a7d975');c.restore();}}
 // Rear articulated thigh, calf, and spreading toe pads.
 for(const side of [-1,1]){
  const swing=run*side*6,kneeY=air?12:18+swing*.4,kneeX=side*(air?19:15);
  c.strokeStyle='#382d24';c.lineWidth=9;c.beginPath();c.moveTo(side*8,10-bob);c.quadraticCurveTo(kneeX+side*4,kneeY-3,kneeX,kneeY);c.lineTo(side*19+(air?-side*2:swing),23-bob);c.stroke();
  c.strokeStyle=side<0?'#8b6641':'#caa066';c.lineWidth=6;c.stroke();
  for(let toe=0;toe<3;toe++){const tx=side*(17+toe*4)+(air?-side*2:swing),ty=23+toe*.4-bob;line(c,[[side*18+swing,22-bob],[tx,ty]],'#a87a4d',2);ellipse(c,tx,ty,2.7,1.8,'#e6ba79');ellipse(c,tx-.7,ty-.6,1,.5,'#fff0c2');}
 }
 const body=gradient(c,0,-24,49,['#e0b67b','#aa7d4e','#69472e']);
 ellipse(c,0,7-bob,15.5,19,body);ellipse(c,1,10-bob,9.5,13,'#f1d8ad');ellipse(c,2,9-bob,6.8,10,'#fbe7bf');
 // Splayed arms have a separate run cycle from the legs.
 for(const side of [-1,1]){
  const ay=glide?-4:air?4:10+run*side*4,ax=side*(glide?29:air?24:20);
  c.strokeStyle='#4c3928';c.lineWidth=6;c.beginPath();c.moveTo(side*12,-3-bob);c.quadraticCurveTo(side*19,ay-3,ax,ay);c.stroke();c.strokeStyle='#c69b61';c.lineWidth=3.8;c.stroke();
  for(let i=0;i<3;i++){const fx=ax+side*(i*2-1),fy=ay+i*2;line(c,[[ax,ay],[fx,fy]],'#bd8b54',1.4);ellipse(c,fx,fy,2.2,2,'#f2ce91');}
 }
 ellipse(c,0,-11-bob,21,15,body);ellipse(c,6,-7-bob,15,7,'#dec296');
 // Coquí dorsal stripe and stippled skin remain crisp at high-DPI resolution.
 ellipse(c,-4,-16-bob,5.5,8,'#765030',-.4);
 for(const [x,y,r]of [[-15,-8,1.4],[-12,-13,.8],[-5,-5,1],[4,-15,1],[12,-11,1.1],[-9,1,1],[9,4,.8],[-11,11,1]])ellipse(c,x,y-bob,r,r*.75,'#67452966');
 const blink=Math.sin(t*.8)>.997?1:0;
 for(const side of [-1,1]){
  ellipse(c,side*11,-20-bob,8.6,9,'#745438');
  const eye=gradient(c,0,-29,18,['#ffeec4','#d79843','#80562d']);ellipse(c,side*11,-21-bob,7,7.8,eye);
  if(blink)line(c,[[side*11-6,-21-bob],[side*11+6,-21-bob]],'#533b28',2);
  else{ellipse(c,side*11+1.5,-21-bob,3.2,5.5,'#17211c');ellipse(c,side*11+2,-24-bob,1.8,2,'#fff8dd');ellipse(c,side*11-2,-18-bob,.8,.8,'#f8dc8c');}
 }
 c.strokeStyle='#5e472e';c.lineWidth=1.5;c.beginPath();c.moveTo(-9,-6-bob);c.quadraticCurveTo(2,-1-bob,15,-7-bob);c.stroke();ellipse(c,13,-10-bob,.8,.7,'#463329');
 // A small leaf collar is the hero's original silhouette cue.
 leaf(c,-4,1-bob,13,-.95,'#416f3e');leaf(c,-3,2-bob,11,-1.7,'#8ac765');
 if(p.chirpFlash>0){ellipse(c,4,-1-bob,7+Math.sin(p.chirpFlash*10)*2,5,'#fff0b8');for(let i=0;i<3;i++){c.strokeStyle=`rgba(215,255,220,${p.chirpFlash*.7/(i+1)})`;c.lineWidth=1.5;c.beginPath();c.arc(0,0,36+(1-p.chirpFlash)*70+i*18,-1.1,1.1);c.stroke();}}
 if(p.shield){c.strokeStyle='#ffd8df99';c.lineWidth=1;c.beginPath();c.ellipse(0,-1,30,34,0,0,TAU);c.stroke();}
 c.restore();
}
export class Renderer {
 constructor(canvas){this.canvas=canvas;this.c=canvas.getContext('2d',{alpha:false});this.w=960;this.h=700;this.scale=1;this.tiles=new Map();this.backgrounds=[];this.low=false;this.failedAssets=[];
  for(const name of ['forest','cavern','mangrove','summit']){const img=new Image();img.src=`assets/backgrounds/${name}.png`;img.onerror=()=>this.failedAssets.push(name);this.backgrounds.push(img);}
 }
 resize(width,height){const dpr=Math.min(this.low?1.25:2,window.devicePixelRatio||1);this.canvas.width=Math.round(width*dpr);this.canvas.height=Math.round(height*dpr);this.px=dpr;this.cssW=width;this.cssH=height;this.scale=clamp(height/730,.64,1.25);this.w=width/this.scale;this.h=height/this.scale;}
 visible(s,cam,margin=90){return s.x+s.w>cam.x-margin&&s.x<cam.x+this.w+margin&&s.y+s.h>cam.y-margin&&s.y<cam.y+this.h+margin;}
 draw(game,dt=0){const c=this.c,p=game.player,theme=game.level.theme;
  if(game.mode==='playing'){
   const tx=clamp(p.x-this.w*.36+p.facing*60,0,Math.max(0,game.level.width-this.w));
   const ty=clamp(p.y-this.h*.57,0,Math.max(0,1050-this.h));
   game.camera.x=lerp(game.camera.x,tx,1-Math.exp(-dt*5));game.camera.y=lerp(game.camera.y,ty,1-Math.exp(-dt*4));
  }
  const cam=game.camera,t=game.time,menu=game.mode==='menu';
  c.setTransform(this.px,0,0,this.px,0,0);this.backdrop(game,menu);
  if(menu){c.save();c.scale(this.scale,this.scale);const mascot={...p,x:this.w*.71,y:this.h*.58,w:38,h:48,facing:-1,ground:true,anim:t};drawCoqui(c,mascot,t,3.8);c.restore();return;}
  c.setTransform(this.px*this.scale,0,0,this.px*this.scale,0,0);
  if(!this.low){this.parallax(game);}
  c.save();c.translate(-cam.x+(this.low?0:Math.sin(t*85)*game.shake*12),-cam.y);
  for(const v of game.level.vents)if(this.visible(v,cam)){
   const g=c.createLinearGradient(0,v.y,0,v.y+v.h);g.addColorStop(0,'#baffef00');g.addColorStop(1,'#baffef44');rect(c,v.x,v.y,v.w,v.h,20,g);
   for(let i=0;i<8;i++){const y=v.y+v.h-((t*140+i*47)%v.h);ellipse(c,v.x+v.w*.5+Math.sin(i+t)*20,y,13+i%3*3,4,'#d7fff126');}
  }
  for(const wind of game.level.winds)if(this.visible(wind,cam)){for(let i=0;i<8;i++){const xx=wind.x+((t*wind.fx*.7+i*113)%wind.w+wind.w)%wind.w,yy=wind.y+30+i*40;line(c,[[xx,yy],[xx+Math.sign(wind.fx)*35,yy-6]],'#edeeff66',1.5);}}
  for(const s of game.level.platforms){if(s.gone||!this.visible(s,cam))continue;if(s.kind==='hidden'&&!game.revealed.has(s.id)){if(Math.abs(s.x-p.x)<350){c.save();c.globalAlpha=.23+.12*Math.sin(t*3);for(let i=0;i<5;i++)ellipse(c,s.x+i*s.w/5,s.y+Math.sin(t+i)*5,2,2,'#e4ffaf');c.restore();}continue;}this.platform(s,theme,t);}
  for(const s of game.ice)if(this.visible(s,cam))this.platform(s,theme,t);
  for(const gate of game.level.gates)if(!game.broken.has(gate.id)&&this.visible(gate,cam))this.gate(gate,t);
  for(const h of game.level.hazards)if(!game.broken.has(`spike-${h.id}`)&&this.visible(h,cam)){
   rect(c,h.x,h.y+13,h.w,5,2,'#733849');for(let i=0;i<h.w;i+=11){c.fillStyle=gradient(c,0,h.y,h.h,['#ffb699','#bb4f57','#672f49']);c.beginPath();c.moveTo(h.x+i,h.y+h.h);c.lineTo(h.x+i+5.5,h.y);c.lineTo(h.x+i+11,h.y+h.h);c.fill();line(c,[[h.x+i+5.5,h.y+3],[h.x+i+7,h.y+12]],'#fff1be',1);}
  }
  for(const coin of game.level.coins)if(!game.coins.has(coin.id)&&this.visible(coin,cam)){const y=coin.y+8+Math.sin(t*3+coin.id)*3,w=3+Math.abs(Math.cos(t*2.4+coin.id))*5;ellipse(c,coin.x+8,y,w+2,10,'#916638');ellipse(c,coin.x+8,y,w,8,'#ffe9a4');line(c,[[coin.x+8,y-4],[coin.x+8,y+4]],'#c59448',1);ellipse(c,coin.x+6,y-4,1.5,2,'#fff9dc');}
  for(const r of game.level.relics)if(!game.relics.has(r.id)&&this.visible(r,cam)){const y=r.y+Math.sin(t*2)*5;this.glow(r.x+13,y+17,45,'#ef99ff');rect(c,r.x,y,26,34,9,gradient(c,0,y,34,['#ffebff','#ba87d1','#6b497a']));this.spiral(r.x+13,y+15,8,'#624678');}
  for(const cp of game.level.checkpoints)if(this.visible(cp,cam)){
   rect(c,cp.x+12,cp.y+8,8,46,3,'#926e4b');rect(c,cp.x+2,cp.y+43,28,11,3,'#465d4b');
   const lit=cp.id<=game.checkpoint;this.glow(cp.x+16,cp.y+8,lit?34:18,lit?'#bdffd2':'#788778');ellipse(c,cp.x+16,cp.y+8,9,13,lit?'#e4ffb8':'#58756c');leaf(c,cp.x+16,cp.y+12,18,-.5,lit?'#a8dd75':'#455f53');
  }
  for(const s of game.level.shrines)if(this.visible(s,cam))this.shrine(s,game.songs.has(s.id),t,p);
  for(const b of game.level.pickups)if(!b.collected&&!game.own(b.type)&&this.visible(b,cam))this.bloom(b,t);
  for(const e of game.level.enemies)if(e.hp>0&&this.visible(e,cam))this.enemy(e,t);
  for(const pool of game.embers){this.glow(pool.x,pool.y,65,'#ff9f51');for(let i=0;i<4;i++)leaf(c,pool.x-20+i*14,pool.y+8,20+Math.sin(t*15+i)*6,Math.sin(t+i)*.15,'#ffbd7166');}
  for(const s of game.shots){const def=POWER_INFO[s.type];this.glow(s.x,s.y,26,def.color);ellipse(c,s.x,s.y,s.r,s.r,gradient(c,0,s.y-s.r,s.r*2,['#fffce5',def.color,'#789fa5']));if(s.type==='bubble'){c.strokeStyle='#e8ffff';c.lineWidth=1.5;c.beginPath();c.arc(s.x,s.y,s.r,0,TAU);c.stroke();}if(s.type==='stone')this.spiral(s.x,s.y,7,'#78684e');ellipse(c,s.x-3,s.y-4,3,2,'#fff8');}
  const q={...p,x:lerp(p.prevX,p.x,.75),y:lerp(p.prevY,p.y,.75)};drawCoqui(c,q,t,1.13);
  for(const part of game.particles){c.globalAlpha=part.life/part.max;ellipse(c,part.x,part.y,part.r,part.r,part.color);}c.globalAlpha=1;
  if(this.visible(game.level.goal,cam,180))this.goal(game.level.goal,game.songs.size,t);
  for(const sign of game.level.signs)if(Math.abs(sign.x-p.x)<this.w){rect(c,sign.x,sign.y,5,70,2,'#634938');rect(c,sign.x-30,sign.y-17,180,33,6,'#183e36ed');c.fillStyle='#e5eccc';c.font='600 12px sans-serif';c.fillText(sign.text,sign.x-20,sign.y+4);}
  c.restore();
  if(!this.low)this.foreground(game);
 }
 backdrop(game,menu){const c=this.c,img=this.backgrounds[game.index],w=this.cssW,h=this.cssH;
  c.fillStyle=gradient(c,0,0,h,game.level.theme.sky);c.fillRect(0,0,w,h);
  if(img.complete&&img.naturalWidth){const zoom=menu?1:1.12,s=Math.max(w/img.width,h/img.height)*zoom,dw=img.width*s,dh=img.height*s;const travel=(Math.sin(game.camera.x*.00018)*.5+.5);c.drawImage(img,-(dw-w)*travel,-(dh-h)*.42,dw,dh);}
  const shade=c.createLinearGradient(0,0,0,h);shade.addColorStop(0,'#061a2820');shade.addColorStop(.55,'#061a2810');shade.addColorStop(1,'#061a2870');c.fillStyle=shade;c.fillRect(0,0,w,h);
 }
 parallax(game){const c=this.c,t=game.time,cam=game.camera,idx=game.index,theme=game.level.theme;
  c.save();c.globalAlpha=idx===1?.18:.23;
  const start=Math.floor(cam.x*.45/480)*480;
  for(let wx=start-480;wx<start+this.w+960;wx+=480){const x=wx-cam.x*.45,seed=rng(wx+10000);if(idx===1){c.fillStyle='#172e4388';c.beginPath();c.moveTo(x,-30);c.lineTo(x+70,190+seed()*90);c.lineTo(x+140,-30);c.fill();}else if(idx===2){c.strokeStyle='#193047';c.lineWidth=18;c.beginPath();c.moveTo(x+30,650);c.bezierCurveTo(x+80,460,x+10,380,x+100,210);c.stroke();for(let j=0;j<5;j++)leaf(c,x+100,220,120+seed()*60,(j-2)*.65,'#254b56');for(let j=0;j<4;j++){c.lineWidth=6;c.beginPath();c.moveTo(x+50,490);c.quadraticCurveTo(x-70+j*70,500,x-100+j*90,700);c.stroke();}}else if(idx===0){line(c,[[x+50,650],[x+78,240]],'#21583faa',18);for(let j=0;j<7;j++)leaf(c,x+78,260,90+seed()*70,(j-3)*.45,'#2e6b4d');}else{ellipse(c,x,520+Math.sin(wx)*30,200,42,'#f4e6ee25');}}
  c.restore();
  if(idx===2){for(let i=0;i<26;i++){const x=(i*97-cam.x*.6)%this.w,y=180+((i*57)%350)+Math.sin(t+i)*15;ellipse(c,x,y,1.5,1.5,`rgba(170,255,222,${.3+Math.sin(t*2+i)*.2})`);}}
 }
 platform(s,theme,t){const c=this.c,x=s.x,y=s.y,w=s.w,h=s.h;
  if(s.kind==='ice'){c.save();c.globalAlpha=clamp(s.life/1.2,.1,1);this.glow(x+w/2,y,65,'#b0f7ff');rect(c,x,y,w,h,6,gradient(c,0,y,h,['#f1ffff','#8accdf','#4d90ba']));for(let i=12;i<w;i+=18)line(c,[[x+i,y+3],[x+i-5,y+h-3]],'#fff9',1);c.restore();return;}
  if(s.kind==='vine'){line(c,[[x+w/2,y+h],[x+w*.2,y+h*.6],[x+w*.7,y]],'#365636',9);line(c,[[x+w/2,y+h],[x+w*.2,y+h*.6],[x+w*.7,y]],'#95ba6a',3);for(let i=10;i<h;i+=20){leaf(c,x+w/2,y+i,17,-.8,'#63a45e');leaf(c,x+w/2,y+i+9,17,.9,'#8dc97b');}return;}
  if(s.crumble)c.save(),c.translate(Math.sin(t*65)*2,0);
  const ground=['ground','rootground','cliff'].includes(s.kind),stone=['stone','cliff','shrine','crumble'].includes(s.kind),root=['root','rootground','raft'].includes(s.kind);
  const colors=stone?[theme.cap,theme.soil,'#2e3447']:root?['#a29670','#685c4b','#333a3b']:['#a38a5b',theme.soil,'#332e31'];
  rect(c,x,y,w,ground?h:Math.max(h,22),ground?8:7,gradient(c,0,y,ground?200:h,colors));
  // Batched, deterministic material detail. Only visible platform spans reach here.
  c.save();c.beginPath();c.rect(x,y,w,h);c.clip();
  if(stone){for(let row=0;row<(ground?5:2);row++){const yy=y+7+row*36;line(c,[[x,yy],[x+w,yy]],'#121b2438',2);for(let col=0;col<w;col+=66){line(c,[[x+col+(row%2)*33,yy],[x+col+(row%2)*33-8,yy+36]],'#121b2428',2);line(c,[[x+col+4,yy+3],[x+col+43,yy+3]],'#fff2',1);}}}else{for(let i=8;i<w;i+=24){c.strokeStyle='#271f242e';c.lineWidth=1.5;c.beginPath();c.moveTo(x+i,y+12);c.bezierCurveTo(x+i+10,y+40,x+i-10,y+80,x+i+12,y+145);c.stroke();}for(let i=0;i<w;i+=77)ellipse(c,x+i+30,y+18,8,3,'#291e2438');}
  c.restore();
  if(ground&&!this.low){
   const noise=rng(s.seed||s.id+1);
   c.save();c.beginPath();c.rect(x,y+10,w,h-10);c.clip();
   for(let row=0;row<6;row++)for(let col=0;col<w;col+=48){
    const xx=x+col+(row%2)*18,yy=y+24+row*33;
    if(stone){c.fillStyle=['#b2afa21a','#151f3233','#d6c7a51b'][Math.floor(noise()*3)];c.beginPath();c.moveTo(xx,yy);c.lineTo(xx+22+noise()*18,yy-9);c.lineTo(xx+43,yy+14);c.lineTo(xx+14,yy+29);c.closePath();c.fill();}
    else{for(let k=0;k<4;k++){const sx=xx+noise()*46,sy=yy+noise()*25;ellipse(c,sx,sy,1+noise()*3,1+noise()*2,noise()>.5?'#c6b88b36':'#201f2a38');}line(c,[[xx,yy],[xx+20,yy+5],[xx+38,yy+2]],'#29212b18',1);}
   }
   c.restore();
  }
  rect(c,x,y-3,w,8,4,theme.cap);line(c,[[x+5,y-1],[x+w-5,y-1]],'#efffc377',1.5);
  if(!this.low){for(let i=Math.ceil(x/32)*32;i<x+w;i+=32){leaf(c,i,y,8+(i%5),-.3,theme.cap);leaf(c,i+8,y,10,.5,theme.cap);}
   if(!ground&&w>110&&!stone)for(let j=20;j<w-15;j+=57){c.strokeStyle='#73916b';c.lineWidth=1.5;c.beginPath();c.moveTo(x+j,y+h);c.quadraticCurveTo(x+j-8,y+h+25,x+j+3,y+h+35);c.stroke();leaf(c,x+j,y+h+24,9,.7,'#7fbd81');}
  }
  if(s.kind==='raft'){for(let i=10;i<w-5;i+=25)rect(c,x+i,y+3,3,h-3,1,'#c2c594');}
  if(s.kind==='shrine'){this.spiral(x+w/2,y+13,7,'#d8f7c277');}
  if(s.crumble)c.restore();
 }
 glow(x,y,r,color){if(this.low)return;const c=this.c,g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color+'55');g.addColorStop(1,color+'00');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);}
 spiral(x,y,r,color){const c=this.c;c.strokeStyle=color;c.lineWidth=2;c.beginPath();for(let i=0;i<36;i++){const a=i/35*TAU*1.6,rad=r*i/35;const xx=x+Math.cos(a)*rad,yy=y+Math.sin(a)*rad;if(!i)c.moveTo(xx,yy);else c.lineTo(xx,yy);}c.stroke();}
 shrine(s,active,t,p){const c=this.c;rect(c,s.x-8,s.y+65,66,15,5,'#566c5f');rect(c,s.x,s.y+20,50,53,11,gradient(c,0,s.y,80,['#c3cab1','#7f9282','#425e59']));ellipse(c,s.x+25,s.y+21,27,20,'#a8b8a1');ellipse(c,s.x+13,s.y+13,5,5,'#34584d');ellipse(c,s.x+37,s.y+13,5,5,'#34584d');this.spiral(s.x+25,s.y+48,12,active?'#f6ffb9':'#425d54');
  if(active){this.glow(s.x+25,s.y+25,100,'#e9ffaf');for(let i=0;i<4;i++)ellipse(c,s.x+25+Math.cos(t+i*1.6)*40,s.y+15+Math.sin(t+i*1.6)*30,2,3,'#fff8c9');}
  else if(Math.abs(s.x-p.x)<220){c.font='700 13px sans-serif';c.textAlign='center';rect(c,s.x-35,s.y-34,120,25,12,'#082d30e8');c.fillStyle='#f5f1ca';c.fillText('♫  CHIRP  /  C',s.x+25,s.y-17);c.textAlign='left';}
 }
 gate(g,t){const c=this.c;if(g.type==='thorn'){for(let i=0;i<g.h;i+=18){line(c,[[g.x,g.y+i],[g.x+g.w,g.y+i+26],[g.x,g.y+i+38]],'#5a6f3c',8);leaf(c,g.x+g.w*.5,g.y+i,22,i%2?1:-1,'#9a9f48');}this.glow(g.x+20,g.y+50,35,'#ffb66b');}else{rect(c,g.x,g.y,g.w,g.h,8,gradient(c,0,g.y,g.h,['#bbb2a1','#777573','#4d555e']));for(let i=20;i<g.h;i+=35)line(c,[[g.x+8,g.y+i],[g.x+28,g.y+i+10],[g.x+12,g.y+i+27]],'#46495f',2);}}
 bloom(b,t){const c=this.c,info=POWER_INFO[b.type],y=b.y+Math.sin(t*2)*5;this.glow(b.x+15,y+15,55,info.color);for(let i=0;i<5;i++)leaf(c,b.x+15,y+20,24,i*TAU/5+t*.2,info.color);ellipse(c,b.x+15,y+15,10,10,'#fff2be');c.fillStyle='#37504a';c.font='bold 13px sans-serif';c.textAlign='center';c.fillText({fire:'F',ice:'❄',stone:'◆',glide:'↟',heart:'♥',bubble:'○'}[b.type],b.x+15,y+20);c.textAlign='left';}
 enemy(e,t){const c=this.c;c.save();c.translate(e.x+19,e.y+20);c.scale(e.dir,1);c.lineCap='round';if(e.flash>0)c.globalAlpha=.6;const walk=Math.sin(t*e.speed*.22+e.id);
  ellipse(c,0,19,21,4,'#031f3233');
  if(e.type==='bat'){for(const side of [-1,1]){c.fillStyle='#8e83b4';c.beginPath();c.moveTo(side*5,-5);c.quadraticCurveTo(side*27,-28+walk*12,side*34,10+walk*5);c.quadraticCurveTo(side*19,-1,side*9,14);c.fill();line(c,[[side*7,-4],[side*24,-10+walk*9],[side*31,8+walk*5]],'#cfbddb',1);}ellipse(c,0,3,10,16,'#6c6087');leaf(c,-5,-6,14,-.2,'#746992');leaf(c,5,-6,14,.2,'#746992');}
  else if(e.type==='iguana'){c.strokeStyle='#496d3e';c.lineWidth=8;c.beginPath();c.moveTo(-12,9);c.quadraticCurveTo(-33,15+walk*4,-40,1);c.stroke();ellipse(c,0,5,20,11,gradient(c,0,-6,22,['#b0c979','#6e8f50','#446944']));for(let j=-12;j<15;j+=5)leaf(c,j,-3,7,.3,'#d7ce8a');ellipse(c,17,1,11,9,'#95b466');}
  else{for(const side of [-1,1])for(let i=0;i<3;i++){const x=(i-1)*11,y=7;line(c,[[x,y],[x+side*9,13+walk*side*3],[x+side*12,18-walk*side*2]],'#614d62',3);}ellipse(c,0,3,20,15,gradient(c,0,-12,30,e.type==='crab'?['#e4a79a','#a36082','#653b6d']:['#a4a1cf','#68638c','#3f455f']));line(c,[[0,-10],[0,15]],'#eeeecc55',1.5);ellipse(c,-7,-4,5,3,'#ece1e633');if(e.type==='crab')for(const side of [-1,1]){line(c,[[side*14,0],[side*27,-10+walk*5]],'#ba7d96',4);ellipse(c,side*29,-11+walk*5,8,6,'#d7a6ad');}}
  const eyeX=e.type==='iguana'?22:e.type==='bat'?5:10;for(const x of e.type==='iguana'?[eyeX]:[-eyeX,eyeX]){ellipse(c,x,-3,4,5,'#ffebae');ellipse(c,x+1,-3,2,3,'#273039');ellipse(c,x,-5,1,1,'#fff');}
  if(e.frozen>0){ellipse(c,0,1,28,27,'#a6e7ff55');line(c,[[-12,-18],[0,-2],[-7,14]],'#ecffff',1.5);}
  c.restore();
 }
 goal(g,songs,t){const c=this.c;rect(c,g.x-20,g.y+125,130,19,6,'#788b84');for(const x of [g.x,g.x+70]){rect(c,x,g.y,20,140,6,gradient(c,0,g.y,140,['#bdc9ae','#83988a','#3e605a']));for(let i=15;i<120;i+=25)rect(c,x+3,g.y+i,14,2,1,'#eaffce44');}c.strokeStyle='#91a58d';c.lineWidth=22;c.beginPath();c.arc(g.x+45,g.y+15,35,Math.PI,TAU);c.stroke();for(let i=0;i<3;i++){ellipse(c,g.x+18+i*27,g.y-18,6,7,i<songs?'#f6f2ac':'#425d59');}if(songs===3){this.glow(g.x+45,g.y+60,105,'#e6ffc0');rect(c,g.x+20,g.y+20,50,110,24,'#dbffc626');}else{c.font='600 12px sans-serif';c.textAlign='center';c.fillStyle='#f5f4cf';c.fillText(`${songs} / 3 songs`,g.x+45,g.y-43);c.textAlign='left';}}
 foreground(game){const c=this.c,cam=game.camera,t=game.time;const start=Math.floor(cam.x*1.08/610)*610;c.save();c.globalAlpha=.8;for(let wx=start-610;wx<start+this.w+610;wx+=610){const x=wx-cam.x*1.08;if(game.index===0)fern(c,x,this.h+30,75,t,'#183c36');else if(game.index===2){leaf(c,x,this.h+30,90,-.3,'#1a334b');leaf(c,x+20,this.h+15,65,.5,'#375062');}else if(game.index===3)ellipse(c,x,this.h+12,210,46,'#f2deeb25');}c.restore();}
}
