import {rng} from './math.js';
export const THEMES=[
 {id:'yunque',name:'Senderos del Yunque',subtitle:'Rainforest foothills',place:'El Yunque',color:'#a4eb8a',sky:['#80cbdf','#d6efe2'],far:'#73a99c',mid:'#397e63',near:'#195543',soil:'#644737',cap:'#73bb63',route:['Tabonuco Trail','La Coca Falls','Orchid Canopy','The Listening Grove'],power:'bubble',minutes:'4–6 min',intro:'Three song shrines are waiting. Follow the fireflies and answer with your chirp.'},
 {id:'caverns',name:'Cavernas del Río',subtitle:'Waterfall caverns',place:'Karst country',color:'#ffc88a',sky:['#171e38','#475168'],far:'#354355',mid:'#536b6b',near:'#253a43',soil:'#4c464e',cap:'#a8d8bf',route:['Limestone Mouth','Water Cathedral','Amber Galleries','Moonlit Exit'],power:'fire',minutes:'4–7 min',intro:'Warm the thorn gates with Flame. Mist columns carry you to the upper paths.'},
 {id:'mangrove',name:'Mangle de las Estrellas',subtitle:'Bioluminescent coast',place:'Puerto Rican mangroves',color:'#9df7ea',sky:['#151334','#483471'],far:'#403363',mid:'#31576b',near:'#193e50',soil:'#5e4b54',cap:'#82c6ba',route:['Saltwater Roots','Blue Lantern Bay','Moon Rafts','The Singing Lagoon'],power:'ice',minutes:'5–7 min',intro:'Ride the root rafts. Frost leaves temporary stepping stones above the glowing water.'},
 {id:'summit',name:'Coro de la Cumbre',subtitle:'Storm above the clouds',place:'Sierra de Luquillo',color:'#ffe293',sky:['#4e5479','#d0a5a0'],far:'#8186a1',mid:'#595f81',near:'#393f63',soil:'#54586b',cap:'#b5c783',route:['Cloudroot Ascent','Trade Wind Bridges','Thunder Gardens','Coro del Yunque'],power:'stone',minutes:'5–8 min',intro:'Stone breaks brittle barriers. Combine the blooms and bring every shrine into the chorus.'}
];
const ORDERS=[
 ['garden','steps','falls','vines','arch','shrine','garden','steps','ruins','falls','shrine','canopy','vines','ruins','falls','shrine','canopy','finish'],
 ['mouth','columns','vents','water','gallery','shrine','vents','thorns','columns','water','shrine','gallery','thorns','vents','water','shrine','gallery','columns','finish'],
 ['roots','rafts','lagoon','islands','roots','shrine','rafts','lagoon','islands','moon','shrine','roots','rafts','moon','lagoon','shrine','islands','rafts','moon','finish'],
 ['cloud','steps','wind','crumble','stone','shrine','wind','pillars','crumble','cloud','shrine','pillars','wind','stone','crumble','shrine','cloud','wind','pillars','crumble','finish']
];
export const SECTION=2100;
export function createLevel(index){
 const theme=THEMES[index],beats=ORDERS[index],random=rng(index+721);
 const l={index,theme,width:beats.length*SECTION,height:1100,spawn:{x:110,y:500},platforms:[],hazards:[],enemies:[],coins:[],relics:[],shrines:[],checkpoints:[],pickups:[],winds:[],vents:[],gates:[],signs:[],sections:beats,goal:{x:beats.length*SECTION-280,y:476,w:90,h:144},groundY:620};
 let id=0,coinId=0;
 const platform=(x,y,w,h=24,kind='ledge',extra={})=>{const p={id:id++,x,y,w,h,kind,...extra};l.platforms.push(p);return p;};
 const coin=(x,y)=>l.coins.push({id:coinId++,x,y,w:16,h:16});
 const trail=(x,y,n=5)=>{for(let c=0;c<n;c++)coin(x+c*36,y-Math.sin(c/(n-1)*Math.PI)*24);};
 beats.forEach((beat,s)=>{
  const x=s*SECTION;
  // Authored ground rhythms: later biomes have longer water/air gaps and fewer safe islands.
  const spans=index===0?[[0,640],[740,1340],[1440,2100]]:index===1?[[0,500],[610,1060],[1160,1620],[1740,2100]]:index===2?[[0,440],[590,970],[1140,1540],[1700,2100]]:[[0,370],[490,890],[1040,1360],[1520,1810],[1920,2100]];
  spans.forEach(([a,b])=>platform(x+a,620,b-a,480,index===2?'rootground':index===3?'cliff':'ground'));
  if(s===0||s%2===0)l.checkpoints.push({id:l.checkpoints.length,x:x+90,y:566,w:32,h:54});
  if(s%5===0)l.signs.push({x:x+180,y:550,text:theme.route[Math.min(3,Math.floor(s/beats.length*4))]});
  if(index===0){
   if(['steps','vines','canopy','ruins'].includes(beat)){
    platform(x+360,536,160);platform(x+580,452,180);platform(x+825,366,160);platform(x+1080,430,190);platform(x+1360,504,150);trail(x+595,407);
    if(beat==='vines')platform(x+1020,405,24,215,'vine');
    if(beat==='ruins')platform(x+1490,386,130,24,'stone');
   }else{platform(x+270,528,190);platform(x+550,454,180);platform(x+1020,526,190);platform(x+1590,515,210);trail(x+282,483);}
   if(beat==='falls')platform(x+740,386,155,22,'raft',{motion:{dx:0,dy:70,speed:.7,phase:.2}});
  }else if(index===1){
   platform(x+250,526,160,28,'stone');platform(x+500,444,160,26,'stone');platform(x+745,350,155,26,'stone');platform(x+1010,436,170,28,'stone');platform(x+1410,508,160,24,'stone');
   // Roof teeth are visual; collision on a few broad ceilings remains legible.
   if(beat==='columns'||beat==='gallery'){platform(x+720,205,240,32,'stone');platform(x+1760,405,165,24,'stone');}
   if(beat==='vents'||beat==='water'){l.vents.push({x:x+530,y:240,w:88,h:380,force:2450});platform(x+640,296,150,24,'stone');}
   if(beat==='thorns')l.gates.push({id:`gate-${s}`,x:x+1550,y:420,w:38,h:200,type:'thorn'});
   trail(x+520,400);
  }else if(index===2){
   platform(x+440,524,145,22,'raft',{motion:{dx:92,dy:22,speed:.8,phase:s*.8}});
   platform(x+970,515,145,22,'raft',{motion:{dx:65,dy:38,speed:.7,phase:s*.6}});
   platform(x+1540,530,145,22,'raft',{motion:{dx:82,dy:0,speed:.9,phase:s*.4}});
   platform(x+210,520,145,24,'root');platform(x+760,414,150,24,'root');platform(x+1190,400,180,24,'root');
   if(beat==='roots')platform(x+670,355,22,265,'vine');
   if(beat==='moon'){platform(x+1130,290,170,20,'hidden');platform(x+1410,367,150,24,'root');}
   trail(x+1198,358);
  }else{
   platform(x+300,520,130,24,'stone');platform(x+545,428,135,22,beat==='crumble'?'crumble':'stone');platform(x+810,340,140,22,'stone');
   platform(x+1120,406,140,22,'raft',{motion:{dx:85,dy:28,speed:.9,phase:s*.9}});platform(x+1450,498,130,22,'crumble');
   if(beat==='wind')l.winds.push({x:x+560,y:180,w:900,h:400,fx:s%2?-170:180,fy:-220});
   if(beat==='pillars'){platform(x+1830,446,24,174,'vine');platform(x+1690,330,150,22,'stone');}
   if(beat==='stone')l.gates.push({id:`gate-${s}`,x:x+1550,y:420,w:42,h:200,type:'rock'});
   trail(x+555,383);
  }
  // Optional high routes: chirp reveals them; their relics reward exploration.
  if(s===3||s===8||s===13){
   platform(x+1290,388,180,20,'hidden');platform(x+1530,313,180,24,index===2?'root':'stone');
   platform(x+1230,500,150,22);l.relics.push({id:l.relics.length,x:x+1600,y:268,w:26,h:34});trail(x+1300,350,4);
  }
  if(beat==='shrine'){
   // The safe approach is deliberately identical in clearance, with biome-specific artwork.
   l.platforms=l.platforms.filter(p=>p.x<x+780||p.x>=x+1430||p.kind.includes('ground')||p.kind==='cliff');
   platform(x+850,540,165,24);platform(x+1090,460,245,28,'shrine');
   l.shrines.push({id:l.shrines.length,x:x+1200,y:380,w:50,h:80});
   l.checkpoints.push({id:l.checkpoints.length,x:x+1980,y:566,w:32,h:54});trail(x+868,500,4);
  }
  // Encounters are spread across safe ground, away from initial spawns and shrine approaches.
  if(s>0&&!['shrine','finish'].includes(beat)){
   const ex=x+(index===2?1250:162),count=index===0?1:index===3?3:2;
   for(let e=0;e<count;e++){
    const base=e===0?ex:x+1810;
    l.enemies.push({id:l.enemies.length,x:base,y:e===2?365:582,w:38,h:38,type:e===2?'bat':index===2?'crab':e===1?'iguana':'beetle',min:base-55,max:base+130,speed:40+index*9+e*6,dir:e%2?-1:1,hp:e===1?2:1});
   }
   l.hazards.push({id:l.hazards.length,x:x+(index===0?1170:index===1?1480:index===2?1450:1710),y:602,w:44+index*6,h:18});
  }
  if(s%3===1)trail(x+1840,554,4);
 });
 // Early blooms are always on the safe opening stretch. Traversal never requires an optional relic.
 l.pickups.push({id:'bloom',type:theme.power,x:300,y:558,w:30,h:30});
 if(index===1)l.pickups.push({id:'glide',type:'glide',x:940,y:558,w:30,h:30});
 l.pickups.push({id:'heart',type:'heart',x:SECTION*7+260,y:482,w:30,h:30});
 l.checkpoints.sort((a,b)=>a.x-b.x).forEach((p,i)=>p.id=i);
 // Song-shrine steps and checkpoint pads have clear landing zones.
 for(const cp of l.checkpoints)l.hazards=l.hazards.filter(h=>Math.abs(h.x-cp.x)>120);
 l.platforms.forEach(p=>{p.baseX=p.x;p.baseY=p.y;p.seed=Math.floor(random()*1e6);});
 return l;
}
