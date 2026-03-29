window.CoquitoLevelData = (() => {
    function mapCoins(points) {
      return points.map(([x, y], i) => ({ id: i, x, y, r: 12, collected: false, bob: Math.random() * Math.PI * 2 }));
    }
    function mapRelics(items) {
      return items.map((r, i) => ({ id: r.id || `relic${i+1}`, x: r.x, y: r.y, w: 24, h: 32, collected: false, zone: r.zone }));
    }
    function softenSpike(x, w = 38, h = 16, y = 620 - h) {
      return { x, y, w, h };
    }
    function lowerWallVines(level, ratio = 0.76, minHeight = 96) {
      for (const solid of level.solids) {
        if (solid.kind !== 'wallvine') continue;
        const bottom = solid.y + solid.h;
        solid.h = Math.max(minHeight, Math.round(solid.h * ratio));
        solid.y = bottom - solid.h;
      }
    }

    const LEVELS = [
      {
        name: 'Lowland Run',
        intro: 'Level 1 — Lowland Run',
        worldWidth: 9600,
        respawnX: 120,
        respawnY: 520,
        flagX: 9300,
        zoneBreaks: [3200, 6700],
        zoneNames: ['Lowland Run', 'Waterfall Rise', 'Canopy Night'],
        skyStyle: 'forest',
        mechanics: [],
        solids: [
          {x:0,y:620,w:700,h:140,kind:'ground'},{x:770,y:620,w:760,h:140,kind:'ground'},{x:1600,y:620,w:520,h:140,kind:'ground'},
          {x:2200,y:620,w:670,h:140,kind:'ground'},{x:2980,y:620,w:540,h:140,kind:'ground'},{x:3630,y:620,w:720,h:140,kind:'ground'},
          {x:4460,y:620,w:530,h:140,kind:'ground'},{x:5110,y:620,w:610,h:140,kind:'ground'},{x:5840,y:620,w:520,h:140,kind:'ground'},
          {x:6510,y:620,w:580,h:140,kind:'ground'},{x:7220,y:620,w:660,h:140,kind:'ground'},{x:8010,y:620,w:560,h:140,kind:'ground'},
          {x:8700,y:620,w:800,h:140,kind:'ground'},
          {x:220,y:514,w:150,h:24,kind:'moss'},{x:430,y:438,w:130,h:22,kind:'moss'},{x:620,y:380,w:120,h:22,kind:'stone'},
          {x:920,y:520,w:120,h:22,kind:'stone'},{x:1095,y:450,w:140,h:22,kind:'moss'},{x:1290,y:382,w:120,h:22,kind:'stone'},
          {x:1680,y:515,w:130,h:22,kind:'moss'},{x:1860,y:450,w:145,h:22,kind:'stone'},{x:2080,y:385,w:125,h:22,kind:'moss'},
          {x:2320,y:525,w:140,h:22,kind:'stone'},{x:2540,y:452,w:135,h:22,kind:'moss'},{x:2745,y:390,w:120,h:22,kind:'stone'},
          {x:3060,y:535,w:145,h:22,kind:'moss'},{x:3250,y:470,w:125,h:22,kind:'stone'},{x:3445,y:400,w:130,h:22,kind:'moss'},
          {x:3780,y:530,w:150,h:22,kind:'moss'},{x:3980,y:458,w:135,h:22,kind:'stone'},{x:4185,y:388,w:130,h:22,kind:'moss'},
          {x:4520,y:538,w:145,h:22,kind:'moss'},{x:4700,y:458,w:120,h:22,kind:'stone'},{x:4950,y:392,w:130,h:22,kind:'moss'},
          {x:5200,y:535,w:150,h:22,kind:'moss'},{x:5415,y:470,w:130,h:22,kind:'stone'},{x:5600,y:404,w:125,h:22,kind:'moss'},
          {x:5920,y:540,w:148,h:22,kind:'moss'},{x:6120,y:476,w:130,h:22,kind:'stone'},{x:6310,y:404,w:122,h:22,kind:'moss'},
          {x:6615,y:530,w:145,h:22,kind:'moss'},{x:6810,y:458,w:128,h:22,kind:'stone'},{x:7000,y:390,w:126,h:22,kind:'moss'},
          {x:7330,y:530,w:145,h:22,kind:'moss'},{x:7510,y:455,w:126,h:22,kind:'stone'},{x:7710,y:380,w:128,h:22,kind:'moss'},
          {x:8085,y:520,w:145,h:22,kind:'moss'},{x:8260,y:450,w:126,h:22,kind:'stone'},{x:8460,y:380,w:130,h:22,kind:'moss'},
          {x:8850,y:520,w:150,h:22,kind:'moss'},{x:9050,y:448,w:128,h:22,kind:'stone'},{x:9200,y:370,w:118,h:22,kind:'moss'},
          {x:1465,y:460,w:30,h:160,kind:'wallvine'},{x:3565,y:350,w:30,h:270,kind:'wallvine'},{x:6470,y:350,w:30,h:270,kind:'wallvine'},{x:8620,y:335,w:30,h:285,kind:'wallvine'}
        ],
        hiddenBridges: [
          { id: 'bridge1', x: 1450, y: 328, w: 150, h: 18 },
          { id: 'bridge2', x: 4880, y: 332, w: 150, h: 18 },
          { id: 'bridge3', x: 7080, y: 318, w: 160, h: 18 },
          { id: 'bridge4', x: 9110, y: 304, w: 140, h: 18 },
        ],
        movingPlatforms: [
          {x:2410,y:340,w:120,h:20,dx:0,dy:70,speed:0.8,t:0,kind:'leafbridge'},
          {x:5750,y:360,w:125,h:20,dx:90,dy:0,speed:0.95,t:0.35,kind:'leafbridge'},
          {x:7900,y:320,w:120,h:20,dx:0,dy:86,speed:0.75,t:0.2,kind:'leafbridge'},
        ],
        spikes: [
          {x:715,y:600,w:40,h:20},{x:1540,y:600,w:48,h:20},{x:2890,y:600,w:44,h:20},{x:4380,y:600,w:48,h:20},
          {x:6390,y:600,w:48,h:20},{x:7955,y:600,w:48,h:20}
        ],
        enemies: [
          {x:960,y:590,w:34,h:28,vx:-60,min:790,max:1510,type:'beetle',alive:true},
          {x:1710,y:590,w:38,h:28,vx:65,min:1620,max:2120,type:'snail',alive:true},
          {x:2600,y:425,w:34,h:28,vx:-58,min:2520,max:2680,type:'beetle',alive:true},
          {x:3850,y:590,w:38,h:28,vx:68,min:3650,max:4340,type:'snail',alive:true},
          {x:4690,y:430,w:34,h:28,vx:-62,min:4550,max:4840,type:'bat',alive:true},
          {x:6060,y:590,w:36,h:28,vx:74,min:5850,max:6350,type:'beetle',alive:true},
          {x:6860,y:430,w:38,h:28,vx:-64,min:6800,max:6980,type:'snail',alive:true},
          {x:8180,y:500,w:38,h:28,vx:72,min:8090,max:8410,type:'beetle',alive:true},
          {x:8930,y:590,w:40,h:30,vx:-75,min:8740,max:9460,type:'iguana',alive:true}
        ],
        chimePads: [
          {id:'chime1', x:3330, y:594, w:38, h:26, active:false},
          {id:'chime2', x:7340, y:594, w:38, h:26, active:false}
        ],
        relics: mapRelics([
          {id:'relic1', x:1360, y:285, zone:'Lowland Run'},
          {id:'relic2', x:5500, y:348, zone:'Waterfall Rise'},
          {id:'relic3', x:8770, y:300, zone:'Canopy Night'}
        ]),
        coins: mapCoins([
          [270,470],[340,470],[450,390],[520,390],[650,332],[965,470],[1120,405],[1315,338],[1700,470],[1895,404],
          [2100,338],[2350,482],[2578,405],[2780,342],[3090,495],[3290,430],[3490,360],[3810,485],[4010,420],[4210,350],
          [4545,492],[4720,420],[4975,352],[5225,488],[5455,418],[5630,350],[5945,495],[6140,425],[6330,354],[6635,485],
          [6835,410],[7030,338],[7350,484],[7535,408],[7735,330],[8110,475],[8285,398],[8485,330],[8875,468],[9070,396],[9228,322]
        ]),
        waterfalls: [
          {x:4460,y:180,w:40,h:440,a:0.38},{x:4505,y:210,w:28,h:410,a:0.28},{x:4550,y:240,w:22,h:380,a:0.22},
          {x:5790,y:155,w:36,h:465,a:0.34},{x:5840,y:210,w:24,h:410,a:0.25}
        ],
        fireflies: Array.from({length:26}, (_, i) => ({ x:6800 + i*110 + (i%3)*24, y:180 + (i%7)*48, phase:i*0.7 })),
        ambientPools: [],
        cavernCrystals: [],
        floatingLeaves: Array.from({length: 24}, (_, i) => ({ x: 350 + i * 390, y: 130 + (i % 5) * 58, size: 9 + (i % 3) * 3, drift: i * 0.6 })),
        mistVents: [],
        slipperyZones: [],
        checkpointRanges: [[3500,4300],[7200,8100]],
        powerups: [
          {id:'bubbleBurst', type:'bubbleBurst', x:3360, y:364, label:'Bubble Burst'}
        ],
      },
      {
        name: 'Waterfall Caverns',
        intro: 'Level 2 — Waterfall Caverns',
        worldWidth: 8200,
        respawnX: 120,
        respawnY: 500,
        flagX: 7900,
        zoneBreaks: [2700, 5600],
        zoneNames: ['Cavern Mouth', 'Flooded Grotto', 'Moonlit Exit'],
        skyStyle: 'cavern',
        mechanics: ['mistLift','slipperyStone'],
        solids: [
          {x:0,y:620,w:640,h:140,kind:'ground'},{x:760,y:620,w:520,h:140,kind:'ground'},{x:1390,y:620,w:640,h:140,kind:'ground'},
          {x:2140,y:620,w:510,h:140,kind:'ground'},{x:2790,y:620,w:620,h:140,kind:'ground'},{x:3530,y:620,w:540,h:140,kind:'ground'},
          {x:4200,y:620,w:580,h:140,kind:'ground'},{x:4920,y:620,w:520,h:140,kind:'ground'},{x:5580,y:620,w:610,h:140,kind:'ground'},
          {x:6310,y:620,w:560,h:140,kind:'ground'},{x:7000,y:620,w:1100,h:140,kind:'ground'},
          {x:200,y:520,w:150,h:22,kind:'stone'},{x:430,y:450,w:130,h:22,kind:'moss'},{x:660,y:388,w:120,h:22,kind:'stone'},
          {x:960,y:520,w:138,h:22,kind:'moss'},{x:1170,y:445,w:120,h:22,kind:'stone'},{x:1490,y:370,w:130,h:22,kind:'moss'},
          {x:1700,y:480,w:125,h:22,kind:'stone'},{x:1910,y:410,w:145,h:22,kind:'moss'},{x:2220,y:520,w:130,h:22,kind:'stone'},
          {x:2420,y:445,w:120,h:22,kind:'moss'},{x:2630,y:372,w:130,h:22,kind:'stone'},{x:2910,y:520,w:150,h:22,kind:'moss'},
          {x:3130,y:430,w:120,h:22,kind:'stone'},{x:3325,y:352,w:130,h:22,kind:'moss'},{x:3640,y:515,w:150,h:22,kind:'stone'},
          {x:3860,y:440,w:130,h:22,kind:'moss'},{x:4090,y:366,w:120,h:22,kind:'stone'},{x:4370,y:520,w:145,h:22,kind:'moss'},
          {x:4575,y:450,w:130,h:22,kind:'stone'},{x:4780,y:382,w:126,h:22,kind:'moss'},{x:5070,y:520,w:145,h:22,kind:'stone'},
          {x:5280,y:445,w:130,h:22,kind:'moss'},{x:5480,y:366,w:120,h:22,kind:'stone'},{x:5755,y:515,w:145,h:22,kind:'moss'},
          {x:5965,y:442,w:130,h:22,kind:'stone'},{x:6175,y:370,w:120,h:22,kind:'moss'},{x:6460,y:520,w:145,h:22,kind:'stone'},
          {x:6675,y:450,w:130,h:22,kind:'moss'},{x:6860,y:370,w:120,h:22,kind:'stone'},{x:7170,y:515,w:150,h:22,kind:'moss'},
          {x:7390,y:440,w:130,h:22,kind:'stone'},{x:7590,y:360,w:120,h:22,kind:'moss'},
          {x:880,y:420,w:28,h:200,kind:'wallvine'},{x:3440,y:330,w:30,h:290,kind:'wallvine'},{x:6120,y:320,w:30,h:300,kind:'wallvine'}
        ],
        hiddenBridges: [
          { id: 'caveBridge1', x: 1280, y: 320, w: 150, h: 18 },
          { id: 'caveBridge2', x: 3980, y: 320, w: 160, h: 18 },
          { id: 'caveBridge3', x: 6990, y: 310, w: 150, h: 18 }
        ],
        movingPlatforms: [
          {x:2080,y:330,w:120,h:20,dx:0,dy:90,speed:0.9,t:0.1,kind:'leafbridge'},
          {x:4340,y:340,w:120,h:20,dx:100,dy:0,speed:0.85,t:0.4,kind:'leafbridge'},
          {x:6400,y:310,w:125,h:20,dx:0,dy:100,speed:0.95,t:0.3,kind:'leafbridge'}
        ],
        spikes: [
          {x:690,y:600,w:48,h:20},{x:2030,y:600,w:48,h:20},{x:3420,y:600,w:50,h:20},{x:4790,y:600,w:50,h:20},
          {x:6205,y:600,w:50,h:20},{x:6940,y:600,w:50,h:20}
        ],
        enemies: [
          {x:820,y:590,w:34,h:28,vx:-64,min:760,max:1280,type:'beetle',alive:true},
          {x:1750,y:450,w:38,h:28,vx:70,min:1700,max:2060,type:'snail',alive:true},
          {x:3020,y:590,w:38,h:28,vx:-72,min:2800,max:3380,type:'beetle',alive:true},
          {x:3900,y:420,w:34,h:28,vx:66,min:3860,max:4010,type:'bat',alive:true},
          {x:5220,y:590,w:38,h:28,vx:-76,min:4950,max:5450,type:'beetle',alive:true},
          {x:6720,y:430,w:38,h:28,vx:74,min:6670,max:6810,type:'snail',alive:true},
          {x:7440,y:590,w:40,h:30,vx:-78,min:7050,max:8030,type:'iguana',alive:true}
        ],
        chimePads: [
          {id:'caveChime1', x:2740, y:594, w:38, h:26, active:false},
          {id:'caveChime2', x:5830, y:594, w:38, h:26, active:false}
        ],
        relics: mapRelics([
          {id:'caveRelic1', x:1385, y:278, zone:'Cavern Mouth'},
          {id:'caveRelic2', x:4160, y:276, zone:'Flooded Grotto'},
          {id:'caveRelic3', x:7090, y:266, zone:'Moonlit Exit'}
        ]),
        coins: mapCoins([
          [235,475],[320,475],[450,402],[680,340],[970,475],[1190,400],[1405,332],[1730,440],[1950,370],[2240,486],
          [2440,412],[2660,340],[2950,480],[3160,400],[3360,326],[3670,482],[3890,410],[4115,336],[4385,485],[4605,414],
          [4805,344],[5090,486],[5295,412],[5495,340],[5780,484],[5990,410],[6190,342],[6485,490],[6695,416],[6890,346],
          [7195,486],[7415,410],[7610,336]
        ]),
        waterfalls: [
          {x:2750,y:110,w:44,h:510,a:0.36},{x:2800,y:150,w:30,h:470,a:0.27},{x:4700,y:95,w:40,h:525,a:0.32},
          {x:4745,y:140,w:28,h:480,a:0.24},{x:6465,y:110,w:40,h:510,a:0.34}
        ],
        fireflies: Array.from({length:20}, (_, i) => ({ x:5600 + i*95, y:160 + (i%6)*55, phase:i*0.8 })),
        ambientPools: [
          {x: 2880, y: 610, w: 150, h: 18},
          {x: 4875, y: 610, w: 170, h: 18},
          {x: 6515, y: 610, w: 160, h: 18}
        ],
        cavernCrystals: [
          {x: 920, y: 295, size: 22}, {x: 1960, y: 325, size: 18}, {x: 4110, y: 285, size: 24},
          {x: 5440, y: 310, size: 20}, {x: 7390, y: 270, size: 26}
        ],
        floatingLeaves: [],
        mistVents: [
          {x: 2860, y: 585, w: 54, h: 35, power: 780},
          {x: 4860, y: 585, w: 54, h: 35, power: 820},
          {x: 6510, y: 585, w: 54, h: 35, power: 860}
        ],
        slipperyZones: [
          {x: 1390, y: 610, w: 210, h: 18},
          {x: 4200, y: 610, w: 210, h: 18},
          {x: 7000, y: 610, w: 260, h: 18}
        ],
        checkpointRanges: [[3300,4100],[6200,7000]],
        powerups: [
          {id:'leafGlide', type:'leafGlide', x:4130, y:332, label:'Leaf Glide'},
          {id:'fireBall', type:'fireBall', x:5620, y:320, label:'Fire Ball'},
          {id:'heartReserve', type:'heartReserve', x:7080, y:250, label:'Heart Reserve'}
        ],
      },
      {
        name: 'Storm Canopy Summit',
        intro: 'Level 3 — Storm Canopy Summit',
        worldWidth: 8600,
        respawnX: 120,
        respawnY: 500,
        flagX: 8300,
        zoneBreaks: [2800, 5900],
        zoneNames: ['Cloudroot Ascent', 'Tempest Bridges', 'Shrine Crown'],
        skyStyle: 'storm',
        mechanics: ['windZone','leafGlide','bubbleBurst','heartReserve'],
        solids: [
          {x:0,y:620,w:620,h:140,kind:'ground'},{x:760,y:620,w:520,h:140,kind:'ground'},{x:1400,y:620,w:580,h:140,kind:'ground'},
          {x:2100,y:620,w:540,h:140,kind:'ground'},{x:2780,y:620,w:620,h:140,kind:'ground'},{x:3530,y:620,w:540,h:140,kind:'ground'},
          {x:4250,y:620,w:620,h:140,kind:'ground'},{x:5000,y:620,w:580,h:140,kind:'ground'},{x:5710,y:620,w:540,h:140,kind:'ground'},
          {x:6400,y:620,w:540,h:140,kind:'ground'},{x:7100,y:620,w:520,h:140,kind:'ground'},{x:7800,y:620,w:700,h:140,kind:'ground'},
          {x:240,y:520,w:140,h:22,kind:'moss'},{x:450,y:450,w:140,h:22,kind:'stone'},{x:720,y:380,w:130,h:22,kind:'moss'},
          {x:980,y:520,w:140,h:22,kind:'stone'},{x:1190,y:440,w:130,h:22,kind:'moss'},{x:1480,y:368,w:130,h:22,kind:'stone'},
          {x:1770,y:505,w:140,h:22,kind:'moss'},{x:1980,y:430,w:130,h:22,kind:'stone'},{x:2280,y:360,w:130,h:22,kind:'moss'},
          {x:2580,y:500,w:140,h:22,kind:'stone'},{x:2840,y:430,w:130,h:22,kind:'moss'},{x:3110,y:355,w:130,h:22,kind:'stone'},
          {x:3400,y:510,w:140,h:22,kind:'moss'},{x:3640,y:435,w:130,h:22,kind:'stone'},{x:3900,y:360,w:130,h:22,kind:'moss'},
          {x:4300,y:520,w:140,h:22,kind:'stone'},{x:4540,y:440,w:130,h:22,kind:'moss'},{x:4790,y:360,w:130,h:22,kind:'stone'},
          {x:5150,y:510,w:140,h:22,kind:'moss'},{x:5400,y:430,w:130,h:22,kind:'stone'},{x:5650,y:350,w:130,h:22,kind:'moss'},
          {x:6020,y:510,w:140,h:22,kind:'stone'},{x:6260,y:430,w:130,h:22,kind:'moss'},{x:6530,y:350,w:130,h:22,kind:'stone'},
          {x:6900,y:505,w:140,h:22,kind:'moss'},{x:7130,y:425,w:130,h:22,kind:'stone'},{x:7400,y:345,w:130,h:22,kind:'moss'},
          {x:7760,y:500,w:140,h:22,kind:'stone'},{x:7990,y:420,w:130,h:22,kind:'moss'},
          {x:1660,y:340,w:30,h:280,kind:'wallvine'},{x:4210,y:320,w:30,h:300,kind:'wallvine'},{x:6820,y:320,w:30,h:300,kind:'wallvine'}
        ],
        hiddenBridges: [
          { id: 'stormBridge1', x: 1560, y: 315, w: 150, h: 18 },
          { id: 'stormBridge2', x: 4680, y: 300, w: 170, h: 18 },
          { id: 'stormBridge3', x: 7470, y: 288, w: 180, h: 18 }
        ],
        movingPlatforms: [
          {x:2420,y:330,w:120,h:20,dx:120,dy:0,speed:0.85,t:0.1,kind:'leafbridge'},
          {x:4950,y:310,w:120,h:20,dx:0,dy:120,speed:0.9,t:0.3,kind:'leafbridge'},
          {x:7190,y:300,w:130,h:20,dx:110,dy:0,speed:1.0,t:0.45,kind:'leafbridge'}
        ],
        spikes: [
          {x:1340,y:600,w:48,h:20},{x:2750,y:600,w:48,h:20},{x:4190,y:600,w:48,h:20},{x:5660,y:600,w:48,h:20},{x:7600,y:600,w:48,h:20}
        ],
        enemies: [
          {x:930,y:590,w:34,h:28,vx:-62,min:760,max:1270,type:'beetle',alive:true},
          {x:1820,y:475,w:38,h:28,vx:70,min:1770,max:1920,type:'snail',alive:true},
          {x:2940,y:590,w:38,h:28,vx:-76,min:2790,max:3400,type:'beetle',alive:true},
          {x:4350,y:495,w:34,h:28,vx:68,min:4300,max:4460,type:'bat',alive:true},
          {x:5780,y:590,w:38,h:28,vx:-80,min:5720,max:6230,type:'snail',alive:true},
          {x:7170,y:485,w:34,h:28,vx:72,min:7110,max:7300,type:'iguana',alive:true}
        ],
        chimePads: [
          {id:'stormChime1', x:3330, y:594, w:38, h:26, active:false},
          {id:'stormChime2', x:6110, y:594, w:38, h:26, active:false}
        ],
        relics: mapRelics([
          {id:'stormRelic1', x:1670, y:270, zone:'Cloudroot Ascent'},
          {id:'stormRelic2', x:4850, y:258, zone:'Tempest Bridges'},
          {id:'stormRelic3', x:7710, y:248, zone:'Shrine Crown'}
        ]),
        coins: mapCoins([
          [250,475],[360,475],[470,405],[735,332],[1000,475],[1210,395],[1505,320],[1805,455],[2010,382],[2305,310],
          [2600,470],[2870,395],[3135,320],[3430,480],[3670,402],[3925,330],[4325,486],[4560,410],[4810,332],[5175,482],
          [5420,405],[5675,325],[6045,484],[6280,406],[6550,326],[6920,480],[7160,402],[7430,320],[7785,472],[8015,392]
        ]),
        waterfalls: [
          {x:3660,y:150,w:34,h:470,a:0.20},{x:6020,y:120,w:34,h:500,a:0.18}
        ],
        fireflies: Array.from({length:18}, (_, i) => ({ x:5900 + i*100, y:160 + (i%5)*50, phase:i*0.75 })),
        ambientPools: [],
        cavernCrystals: [],
        floatingLeaves: Array.from({length: 18}, (_, i) => ({ x: 500 + i * 420, y: 120 + (i % 4) * 56, size: 10 + (i % 3) * 3, drift: i * 0.7 })),
        mistVents: [],
        slipperyZones: [],
        windZones: [
          {x: 2160, y: 180, w: 620, h: 280, fx: 180, fy: -120},
          {x: 4550, y: 150, w: 820, h: 320, fx: -140, fy: -80},
          {x: 7020, y: 160, w: 760, h: 300, fx: 220, fy: -150}
        ],
        checkpointRanges: [[3000,3800],[6400,7300]],
        powerups: [
          {id:'iceBall', type:'iceBall', x:4720, y:334, label:'Ice Ball'},
          {id:'stoneBall', type:'stoneBall', x:7800, y:298, label:'Stone Ball'}
        ]
      }
    ];

    const LEVEL_SCAFFOLDS = [
      { number: 4, name: 'Shrine of Echo Roots', biome: 'Rain shrine', focus: 'bubble switches, echo puzzles, shrine lifts' },
      { number: 5, name: 'Mangrove Drift', biome: 'Tidal mangrove', focus: 'rafts, low jumps, hidden reeds' },
      { number: 6, name: 'Sunset Orchid Traverse', biome: 'Blooming canopy', focus: 'glide chains, chime routes, relic forks' },
      { number: 7, name: 'Cenote Lantern Hollow', biome: 'Underground pools', focus: 'mist vents, puzzle caverns, reserve hearts' },
      { number: 8, name: 'Thunder Basin', biome: 'Rainstorm basin', focus: 'crosswinds, moving bridges, safe ledges' },
      { number: 9, name: 'Ruins of the Singing Stones', biome: 'Ancient forest ruin', focus: 'chirp reveals, relic shrines, gated paths' },
      { number: 10, name: 'Cloudriver Crossing', biome: 'Sky river', focus: 'wind surfing, bubble combat, glide rescue' },
      { number: 11, name: 'Luna Coquí Ascent', biome: 'Night summit', focus: 'tight traversal, elite enemy remix, multi-step checkpoints' },
      { number: 12, name: 'Coro del Yunque', biome: 'Final shrine', focus: 'full mechanic exam, celebratory finale' }
    ];



    function addObjects(list, items) {
      for (const item of items) list.push(item);
    }
    function enrichPlayableLevels() {
      const lowland = LEVELS[0];
      addObjects(lowland.solids, [
        {x:1180,y:312,w:90,h:20,kind:'leafbridge'},{x:3380,y:330,w:110,h:20,kind:'moss'},{x:3680,y:284,w:90,h:20,kind:'leafbridge'},
        {x:5400,y:318,w:120,h:20,kind:'stone'},{x:7440,y:296,w:110,h:20,kind:'leafbridge'},{x:9340,y:310,w:96,h:20,kind:'moss'},
        {x:900,y:468,w:110,h:20,kind:'brick'},{x:1030,y:396,w:98,h:18,kind:'brick'},{x:1142,y:324,w:88,h:18,kind:'brick'},
        {x:1086,y:324,w:24,h:134,kind:'wallvine'},{x:3290,y:404,w:104,h:18,kind:'brick'},{x:3476,y:344,w:102,h:18,kind:'brick'},
        {x:3654,y:278,w:24,h:176,kind:'wallvine'},{x:7310,y:466,w:110,h:20,kind:'brick'},{x:7488,y:394,w:108,h:18,kind:'brick'},
        {x:7686,y:320,w:98,h:18,kind:'brick'},{x:7612,y:320,w:24,h:166,kind:'wallvine'}
      ]);
      addObjects(lowland.movingPlatforms, [
        {x:1460,y:268,w:108,h:18,dx:100,dy:0,speed:1.05,t:0.45,kind:'leafbridge'},
        {x:6120,y:328,w:110,h:18,dx:0,dy:96,speed:0.78,t:0.62,kind:'leafbridge'},
        {x:7800,y:262,w:106,h:18,dx:92,dy:0,speed:0.92,t:0.22,kind:'leafbridge'}
      ]);
      addObjects(lowland.hiddenBridges, [
        { id:'bridge5', x: 3640, y: 256, w: 140, h: 18 },
        { id:'bridge6', x: 7420, y: 270, w: 150, h: 18 },
        { id:'bridge7', x: 7860, y: 240, w: 150, h: 18 }
      ]);
      addObjects(lowland.enemies, [
        {x:3490,y:302,w:34,h:28,vx:-70,min:3380,max:3820,type:'bat',alive:true},
        {x:7460,y:270,w:40,h:30,vx:76,min:7390,max:7740,type:'iguana',alive:true}
      ]);
      lowland.spikes = [
        softenSpike(516, 34),
        softenSpike(1244, 38),
        softenSpike(2468, 36),
        softenSpike(4010, 40),
        softenSpike(5996, 38),
        softenSpike(7708, 36),
        softenSpike(8196, 38)
      ];
      lowland.powerups[0].x = 3492;
      lowland.powerups[0].y = 306;
      lowland.checkpointRanges = [[2400,3300],[4700,6200],[7600,8700]];
      lowerWallVines(lowland);

      const caverns = LEVELS[1];
      addObjects(caverns.solids, [
        {x:840,y:320,w:92,h:18,kind:'stone'},{x:2240,y:320,w:102,h:18,kind:'moss'},{x:4720,y:300,w:108,h:18,kind:'stone'},
        {x:6110,y:292,w:112,h:18,kind:'moss'},{x:7340,y:286,w:98,h:18,kind:'stone'},
        {x:1080,y:368,w:100,h:18,kind:'brick'},{x:1260,y:304,w:24,h:170,kind:'wallvine'},{x:2108,y:314,w:96,h:18,kind:'brick'},
        {x:3940,y:286,w:108,h:18,kind:'brick'},{x:4136,y:226,w:24,h:178,kind:'wallvine'},{x:5205,y:260,w:102,h:18,kind:'brick'},
        {x:7030,y:338,w:110,h:18,kind:'brick'},{x:7224,y:276,w:24,h:170,kind:'wallvine'},{x:7428,y:224,w:106,h:18,kind:'brick'}
      ]);
      addObjects(caverns.movingPlatforms, [
        {x:1200,y:300,w:104,h:18,dx:88,dy:0,speed:0.82,t:0.2,kind:'leafbridge'},
        {x:5220,y:286,w:112,h:18,dx:0,dy:84,speed:1.02,t:0.66,kind:'leafbridge'},
        {x:3920,y:280,w:108,h:18,dx:98,dy:44,speed:0.9,t:0.33,kind:'leafbridge'}
      ]);
      addObjects(caverns.mistVents, [
        {x: 2140, y: 585, w: 54, h: 35, power: 760},
        {x: 7310, y: 585, w: 54, h: 35, power: 900}
      ]);
      addObjects(caverns.enemies, [
        {x:2300,y:290,w:34,h:28,vx:-64,min:2240,max:2460,type:'bat',alive:true},
        {x:6100,y:270,w:40,h:30,vx:68,min:6040,max:6280,type:'iguana',alive:true}
      ]);
      addObjects(caverns.hiddenBridges, [{ id:'caveBridge4', x: 5260, y: 274, w: 144, h: 18 }]);
      caverns.spikes = [
        softenSpike(482, 34),
        softenSpike(1762, 38),
        softenSpike(3168, 38),
        softenSpike(4548, 38),
        softenSpike(5826, 38),
        softenSpike(6642, 38)
      ];
      caverns.powerups[0].x = 4182;
      caverns.powerups[0].y = 296;
      caverns.powerups[1].x = 5658;
      caverns.powerups[1].y = 286;
      caverns.powerups[2].x = 7440;
      caverns.powerups[2].y = 188;
      caverns.checkpointRanges = [[2200,3100],[4700,5600],[6900,7600]];
      lowerWallVines(caverns);

      const summit = LEVELS[2];
      addObjects(summit.solids, [
        {x:1320,y:300,w:96,h:18,kind:'leafbridge'},{x:2980,y:286,w:104,h:18,kind:'stone'},{x:5220,y:270,w:108,h:18,kind:'leafbridge'},
        {x:6840,y:260,w:112,h:18,kind:'stone'},{x:8120,y:236,w:110,h:18,kind:'leafbridge'},
        {x:980,y:332,w:98,h:18,kind:'brick'},{x:1162,y:270,w:96,h:18,kind:'brick'},{x:1338,y:206,w:24,h:176,kind:'wallvine'},
        {x:2860,y:306,w:100,h:18,kind:'brick'},{x:4700,y:288,w:112,h:18,kind:'brick'},{x:4890,y:228,w:24,h:176,kind:'wallvine'},
        {x:7000,y:244,w:112,h:18,kind:'brick'},{x:7208,y:178,w:24,h:182,kind:'wallvine'},{x:7832,y:214,w:108,h:18,kind:'brick'}
      ]);
      addObjects(summit.movingPlatforms, [
        {x:1500,y:280,w:102,h:18,dx:90,dy:44,speed:0.9,t:0.12,kind:'leafbridge'},
        {x:5600,y:250,w:110,h:18,dx:120,dy:0,speed:1.08,t:0.44,kind:'leafbridge'},
        {x:7420,y:202,w:108,h:18,dx:96,dy:0,speed:0.94,t:0.18,kind:'leafbridge'}
      ]);
      addObjects(summit.windZones, [
        {x: 1240, y: 140, w: 520, h: 240, fx: 120, fy: -110},
        {x: 5980, y: 120, w: 660, h: 260, fx: -180, fy: -120},
        {x: 7420, y: 120, w: 520, h: 240, fx: 210, fy: -120}
      ]);
      addObjects(summit.hiddenBridges, [{ id:'stormBridge4', x: 5200, y: 242, w: 150, h: 18 }]);
      addObjects(summit.enemies, [
        {x:3140,y:256,w:34,h:28,vx:-74,min:3000,max:3280,type:'bat',alive:true},
        {x:6880,y:232,w:40,h:30,vx:80,min:6820,max:7060,type:'iguana',alive:true}
      ]);
      summit.spikes = [
        softenSpike(1068, 36),
        softenSpike(2408, 38),
        softenSpike(3120, 40),
        softenSpike(4688, 38),
        softenSpike(5438, 36),
        softenSpike(6064, 40),
        softenSpike(8042, 38)
      ];
      summit.powerups[0].x = 4900;
      summit.powerups[0].y = 272;
      summit.powerups[1].x = 7868;
      summit.powerups[1].y = 190;
      summit.checkpointRanges = [[1800,3300],[4300,6100],[7200,8050]];
      lowerWallVines(summit);
    }

    const LEVEL_TEMPLATE = {
      metadata: { number: 4, name: 'Biome Name', biome: 'Forest', focus: 'Traversal + puzzle + relic route' },
      terrain: ['solids', 'movingPlatforms', 'hiddenBridges'],
      encounters: ['enemies', 'hazards', 'windZones', 'mistVents'],
      progression: ['powerups', 'relics', 'coins', 'checkpoints', 'goal']
    };

    enrichPlayableLevels();

  return { LEVELS, LEVEL_SCAFFOLDS, LEVEL_TEMPLATE };
})();
