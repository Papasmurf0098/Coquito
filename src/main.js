import {Clock,STEP,clamp} from './math.js';
import {Input} from './input.js';
import {SaveStore} from './save.js';
import {Audio} from './audio.js';
import {Game,POWER_INFO,ATTACKS} from './game.js';
import {Renderer} from './render.js';
import {THEMES} from './levels.js';
const $=id=>document.getElementById(id),input=new Input();
let storage;try{storage=window.localStorage;}catch{storage={getItem(){throw Error('Storage unavailable');},setItem(){throw Error('Storage unavailable');}};}
const store=new SaveStore(storage),game=new Game(store),audio=new Audio(),renderer=new Renderer($('game')),clock=new Clock();
let last=0,toastLeft=0,uiTimer=0,menuTime=0,lastMode='',powerKey='',running=true;
const fmt=t=>`${Math.floor(t/60)}:${Math.floor(t%60).toString().padStart(2,'0')}`;
audio.muted=store.data.muted;renderer.low=store.data.quality==='low'||matchMedia('(prefers-reduced-motion: reduce)').matches;
const resize=()=>{const box=$('game').getBoundingClientRect();renderer.resize(box.width,box.height);};resize();window.addEventListener('resize',resize);
function message(text){if(!text)return;$('toast').textContent=text;$('toast').classList.add('visible');toastLeft=4;}
function events(){for(const e of game.events.splice(0)){audio.play(e.type);if(e.type!=='coin'&&e.type!=='attack'&&e.type!=='jump')message(e.text);}}
function updateUI(){
 const p=game.player;$('level-number').textContent=String(game.index+1).padStart(2,'0');$('biome').textContent=game.level.theme.place.toUpperCase();$('zone').textContent=game.level.theme.route[Math.max(0,game.lastZone)];
 $('hearts').textContent='♥'.repeat(p.hp)+'♡'.repeat(3-p.hp)+(p.shield?' ◇':'');$('hearts').ariaLabel=`${p.hp} hearts${p.shield?', reserve shield active':''}`;
 $('coins').textContent=game.coins.size;$('songs').textContent=`${game.songs.size}/3`;$('relics').textContent=`${game.relics.size}/3`;
 $('route-progress').style.width=`${clamp(p.x/game.level.goal.x*100,0,100)}%`;
 const info=game.attack;$('attack-name').textContent=info.name.toUpperCase();$('attack-control').style.borderColor=info.color;$('attack-control').ariaLabel=`Attack with ${info.name}`;
 const key=store.data.powers.join(',')+store.data.attack;if(powerKey!==key){powerKey=key;$('power-strip').replaceChildren();for(const power of ATTACKS.filter(v=>game.own(v))){const button=document.createElement('button');button.textContent=POWER_INFO[power].name;button.title=POWER_INFO[power].label;button.setAttribute('aria-label',`Select ${POWER_INFO[power].name}`);button.classList.toggle('selected',power===store.data.attack);button.setAttribute('aria-pressed',String(power===store.data.attack));button.onclick=()=>game.select(power);$('power-strip').append(button);}}
 if(lastMode!==game.mode){lastMode=game.mode;syncScreens();}
}
function menuCards(){const bg=['forest','cavern','mangrove','summit'];$('level-cards').replaceChildren();THEMES.forEach((theme,i)=>{const b=document.createElement('button');b.className='level-card';b.style.backgroundImage=`url(assets/backgrounds/${bg[i]}.png)`;b.disabled=i>=store.data.unlocked;b.innerHTML=`<span class="card-number">0${i+1}<span class="card-status ${store.data.completed[i]?'completed':''}">${b.disabled?'LOCKED':store.data.completed[i]?'✓ CLEARED':'↗'}</span></span><div><strong>${theme.name}</strong><small>${theme.subtitle} · ${theme.minutes}</small></div>`;b.onclick=()=>start(i);$('level-cards').append(b);});$('continue').innerHTML=`${Object.keys(store.data.runs).some(i=>store.data.runs[i].time>1)?'Continue the chorus':'Begin the chorus'} <span>↗</span>`;}
function syncScreens(){const mode=game.mode;$('menu').hidden=mode!=='menu';$('hud').hidden=mode==='menu';$('controls').hidden=mode!=='playing';$('power-strip').hidden=mode!=='playing';$('pause-screen').hidden=mode!=='paused';$('complete-screen').hidden=mode!=='complete';
 if(mode==='menu'){menuCards();$('toast').classList.remove('visible');}
 if(mode==='paused'){$('pause-detail').textContent=`${game.level.theme.name} · ${fmt(game.elapsed)} · ${game.coins.size} echoes`;$('pause-map').innerHTML=game.level.shrines.map((s,i)=>`<span class="${game.songs.has(i)?'lit':''}"><b>♫</b>Song ${i+1}</span>`).join('');$('missing-shrine').hidden=game.songs.size===3;$('resume').focus();}
 if(mode==='complete'){$('complete-kicker').textContent=game.index===3?'CORO DEL YUNQUE':'SONG CARRIED';$('complete-title').textContent=game.index===3?'The island sings again.':'A new horizon.';$('complete-copy').textContent=game.index===3?'From the first raindrop to the highest cloud, your little voice found its chorus.':'Your song has awakened this corner of the island.';$('results').innerHTML=`<div><b>${fmt(game.elapsed)}</b><span>TRAIL TIME</span></div><div><b>${game.coins.size}</b><span>ECHOES</span></div><div><b>${game.relics.size}/3</b><span>RELICS</span></div>`;$('next').innerHTML=game.index===3?'Explore the island again <span>↗</span>':'Next route <span>↗</span>';$('next').focus();}
}
function start(index,resume=true){input.clear();audio.unlock();game.load(index,resume);clock.reset();lastMode='';updateUI();events();if(!store.available)message('Saving is unavailable. Progress lasts only for this session.');}
function pause(){game.pause();input.clear();clock.reset();updateUI();}
function resume(){input.clear();game.resume();clock.reset();updateUI();}
function home(){game.save();game.mode='menu';input.clear();lastMode='';syncScreens();}
input.bind(document,pause);
$('continue').onclick=()=>start(store.data.current);$('pause').onclick=pause;$('resume').onclick=resume;$('home').onclick=home;$('complete-home').onclick=home;
$('next').onclick=()=>{if(game.index<3)start(game.index+1,false);else home();};
$('missing-shrine').onclick=()=>{game.returnToShrine();input.clear();clock.reset();updateUI();};
$('restart').onclick=()=>$('restart-dialog').showModal();$('confirm-restart').onclick=()=>{$('restart-dialog').close();start(game.index,false);};
function settings(){if(game.mode==='playing')pause();$('sound-setting').checked=!audio.muted;$('quality-setting').checked=!renderer.low;$('save-status').textContent=store.available?'Your progress saves on this device.':'Saving is unavailable. You can still play, but progress will be lost when this page closes.';$('settings').showModal();}
$('settings-open').onclick=settings;$('pause-settings').onclick=settings;$('how-open').onclick=()=>$('how').showModal();
for(const b of document.querySelectorAll('[data-close]'))b.onclick=()=>$(b.dataset.close).close();
$('sound-setting').onchange=e=>{store.data.muted=audio.muted=!e.target.checked;audio.unlock();store.write();};$('quality-setting').onchange=e=>{renderer.low=!e.target.checked;store.data.quality=renderer.low?'low':'high';store.write();resize();};
window.addEventListener('pagehide',()=>game.save());
function tick(dt){game.update(dt,input);events();audio.update(dt,game.index);}
function loop(now){if(!running)return;const dt=last?Math.min(.1,(now-last)/1000):0;last=now;
 try{
  const dialogOpen=!!document.querySelector('dialog[open]');
  if(input.consume('pause')&&!dialogOpen){if(game.mode==='playing')pause();else if(game.mode==='paused')resume();}
  if(game.mode==='playing'&&!dialogOpen)clock.advance(now,tick);else clock.reset();
  if(game.mode==='menu'){menuTime+=dt;game.time=menuTime;game.player.anim=menuTime;}
  renderer.draw(game,dt);uiTimer+=dt;if(uiTimer>.08){uiTimer=0;updateUI();}
  if(toastLeft>0){toastLeft-=dt;if(toastLeft<=0)$('toast').classList.remove('visible');}
 }catch(error){running=false;console.error(error);$('boot-error').hidden=false;}
 requestAnimationFrame(loop);
}
menuCards();syncScreens();updateUI();requestAnimationFrame(loop);
// Read-only diagnostics are safe in production. State-changing test hooks require an explicit local test mode.
window.render_game_to_text=()=>JSON.stringify({version:'0.4.0-beta.1',mode:game.mode,level:game.index+1,player:{x:Math.round(game.player.x),y:Math.round(game.player.y),vx:Math.round(game.player.vx),vy:Math.round(game.player.vy),ground:game.player.ground,hp:game.player.hp},songs:game.songs.size,coins:game.coins.size,relics:game.relics.size,checkpoint:game.checkpoint,attack:store.data.attack,powers:store.data.powers,elapsed:game.elapsed,saveAvailable:store.available,failedAssets:renderer.failedAssets});
if(['localhost','127.0.0.1'].includes(location.hostname)&&new URLSearchParams(location.search).get('test')==='1'){
 window.coquiTest={game,input,renderer,start,step:n=>{for(let i=0;i<n;i++)game.update(STEP,input);renderer.draw(game,STEP);updateUI();},stop:()=>{running=false;}};
}
