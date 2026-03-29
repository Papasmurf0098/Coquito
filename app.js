const canvas = document.getElementById('game');
    const wrap = document.getElementById('wrap');
    const ctx = canvas.getContext('2d');
    const rootStyle = document.documentElement.style;
    const coinsValue = document.getElementById('coinsValue');
    const livesValue = document.getElementById('livesValue');
    const relicValue = document.getElementById('relicValue');
    const zoneValue = document.getElementById('zoneValue');
    const progressValue = document.getElementById('progressValue');
    const chirpValue = document.getElementById('chirpValue');
    const powerValue = document.getElementById('powerValue');
    const attackValue = document.getElementById('attackValue');
    const banner = document.getElementById('banner');
    const startOverlay = document.getElementById('startOverlay');
    const startBtn = document.getElementById('startBtn');
    const attackBtn = document.getElementById('attackBtn');
    const attackBtnWord = attackBtn ? attackBtn.querySelector('.btn-word') : null;
    const levelCard = document.getElementById('levelCard');
    const levelCardKicker = document.getElementById('levelCardKicker');
    const levelCardTitle = document.getElementById('levelCardTitle');
    const levelCardSub = document.getElementById('levelCardSub');

    const controls = { left:false, right:false, jump:false, chirp:false, attack:false };
    const WORLD = { width:9600, height:760, flagX:9300, respawnX:120, respawnY:520 };
    const view = { w:0, h:0, x:0, y:0 };
    const CAMERA_SCALE = 1 / 1.2;
    let audioCtx = null;
    let gameStarted = false;
    let bannerTimer = 0;
    let rumbleTimer = 0;
    let lastTime = 0;
    let levelTransitionTimer = 0;
    let levelCardTimer = 0;
    let worldTime = 0;

    let solids = [];
    let hiddenBridges = [];
    let movingPlatforms = [];
    let spikes = [];
    let enemies = [];
    let chimePads = [];
    let relics = [];
    let coins = [];
    let waterfalls = [];
    let fireflies = [];
    let ambientPools = [];
    let cavernCrystals = [];
    let floatingLeaves = [];
    let mistVents = [];
    let slipperyZones = [];
    let windZones = [];
    let triggers = [];

    const DEBUG = { enabled:false, showHitboxes:false, showTriggers:false, showHud:false, fps:0, frames:0, timer:0 };

    const state = {
      coins: 0,
      maxCoins: 0,
      relics: 0,
      maxRelics: 0,
      lives: 3,
      won: false,
      revealedBridges: new Set(),
      activatedChimes: new Set(),
      checkpointX: WORLD.respawnX,
      checkpointY: WORLD.respawnY,
      levelIndex: 0,
      totalLevels: 12,
      currentLevelUnlocked: 1,
      pendingLevelCompletion: false,
      activeAttackType: 'bubbleBurst',
    };

    const player = {
      x: WORLD.respawnX,
      y: WORLD.respawnY,
      w: 48,
      h: 54,
      vx: 0,
      vy: 0,
      speed: 285,
      jumpPower: 565,
      gravity: 1280,
      maxFall: 780,
      onGround: false,
      onWall: false,
      facing: 1,
      coyote: 0,
      jumpBuffer: 0,
      hurtTimer: 0,
      chirpCooldown: 0,
      attackCooldown: 0,
      attackBuffer: 0,
      glideTime: 0,
      reserveHearts: 0,
      flutterReady: false,
      squish: 0,
      anim: 0,
      stateName: 'idle',
    };


    const { LEVELS, LEVEL_SCAFFOLDS } = window.CoquitoLevelData;

    const SAVE_KEY = 'coquito-del-yunque-save-v3';
    const permanentPowerups = { bubbleBurst: false, fireBall: false, iceBall: false, stoneBall: false, leafGlide: false, heartReserve: false };
    let projectiles = [];
    let powerups = [];
    let pickupBursts = [];
    let emberPools = [];
    let temporaryPlatforms = [];

    function createDefaultSave() {
      return { version: 3, unlockedLevel: 1, currentLevel: 1, activeAttackType: 'bubbleBurst', completedLevels: [], permanentPowerups: { bubbleBurst: false, fireBall: false, iceBall: false, stoneBall: false, leafGlide: false, heartReserve: false } };
    }
    function loadSaveData() {
      try {
        const raw = localStorage.getItem(SAVE_KEY);
        const parsed = raw ? JSON.parse(raw) : createDefaultSave();
        const safe = createDefaultSave();
        Object.assign(safe.permanentPowerups, parsed.permanentPowerups || {});
        safe.unlockedLevel = clamp(parsed.unlockedLevel || 1, 1, LEVELS.length);
        safe.currentLevel = clamp(parsed.currentLevel || 1, 1, safe.unlockedLevel);
        safe.completedLevels = Array.isArray(parsed.completedLevels) ? parsed.completedLevels.filter(n => Number.isInteger(n)) : [];
        safe.activeAttackType = typeof parsed.activeAttackType === 'string' ? parsed.activeAttackType : 'bubbleBurst';
        return safe;
      } catch (err) {
        return createDefaultSave();
      }
    }
    function persistProgress() {
      const payload = {
        unlockedLevel: state.currentLevelUnlocked,
        currentLevel: state.levelIndex + 1,
        version: 3,
        completedLevels: Array.from({length: state.currentLevelUnlocked - 1}, (_, i) => i + 1),
        activeAttackType: state.activeAttackType,
        permanentPowerups: {...permanentPowerups}
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
    }
    const saveData = loadSaveData();
    Object.assign(permanentPowerups, saveData.permanentPowerups);
    state.currentLevelUnlocked = saveData.unlockedLevel;
    state.activeAttackType = saveData.activeAttackType || 'bubbleBurst';
    state.totalLevels = LEVEL_SCAFFOLDS.length + LEVELS.length;

    const PROJECTILE_DEFS = {
      bubbleBurst: { label:'Bubble Burst', speed:420, life:1.1, radius:9, cooldown:0.42, color:'rgba(174,236,255,0.72)', edge:'rgba(255,255,255,0.82)', effect:'pop', summary:'soft homing + one chain' },
      fireBall: { label:'Fire Ball', speed:470, life:1.0, radius:10, cooldown:0.34, color:'rgba(255,152,92,0.78)', edge:'rgba(255,233,180,0.85)', effect:'ignite', summary:'impact embers burn a zone' },
      iceBall: { label:'Ice Ball', speed:390, life:1.2, radius:11, cooldown:0.4, color:'rgba(147,222,255,0.75)', edge:'rgba(232,252,255,0.88)', effect:'freeze', summary:'freeze foes + form ice steps' },
      stoneBall: { label:'Stone Ball', speed:320, life:0.95, radius:12, cooldown:0.55, color:'rgba(183,166,136,0.8)', edge:'rgba(240,230,204,0.82)', effect:'smash', summary:'crush spikes + heavy impact' }
    };
    const ATTACK_ORDER = ['bubbleBurst', 'fireBall', 'iceBall', 'stoneBall'];
    const LEVEL_THEMES = {
      forest: {
        accent: '#8fdd78',
        accentStrong: '#5fc25c',
        sun: '#f5c76c',
        panel: 'rgba(8, 23, 18, 0.76)',
        panelStrong: 'rgba(7, 18, 15, 0.9)',
        glow: 'rgba(143, 221, 120, 0.22)',
        badge: 'rgba(245, 199, 108, 0.14)'
      },
      cavern: {
        accent: '#7ed8da',
        accentStrong: '#4ba6b6',
        sun: '#d8f6ff',
        panel: 'rgba(10, 23, 29, 0.78)',
        panelStrong: 'rgba(7, 15, 20, 0.9)',
        glow: 'rgba(109, 206, 214, 0.24)',
        badge: 'rgba(157, 227, 235, 0.14)'
      },
      storm: {
        accent: '#adc46e',
        accentStrong: '#7e9651',
        sun: '#d9d4ff',
        panel: 'rgba(14, 20, 31, 0.78)',
        panelStrong: 'rgba(9, 13, 21, 0.92)',
        glow: 'rgba(173, 196, 110, 0.22)',
        badge: 'rgba(197, 209, 255, 0.14)'
      }
    };
    const ENEMY_DEFS = {
      beetle: { move:'patrol', body:'#7e4d8b', accent:'#c3a5d4', hp:1 },
      snail: { move:'patrol', body:'#b47e4e', accent:'#dcbc98', hp:1 },
      bat: { move:'hover', body:'#5b6da5', accent:'#d8e3ff', hp:1 },
      iguana: { move:'dart', body:'#5d9a58', accent:'#d7f0bf', hp:2 }
    };
    function attackAccent(type) {
      return {
        bubbleBurst: '#8edfff',
        fireBall: '#ffb06d',
        iceBall: '#a6efff',
        stoneBall: '#c9b086',
        leafGlide: '#8fdd78',
        heartReserve: '#ff98ab'
      }[type] || '#8edfff';
    }
    function applyLevelTheme(level) {
      const theme = LEVEL_THEMES[level.skyStyle] || LEVEL_THEMES.forest;
      rootStyle.setProperty('--shell-accent', theme.accent);
      rootStyle.setProperty('--shell-accent-strong', theme.accentStrong);
      rootStyle.setProperty('--shell-sun', theme.sun);
      rootStyle.setProperty('--shell-panel', theme.panel);
      rootStyle.setProperty('--shell-panel-strong', theme.panelStrong);
      rootStyle.setProperty('--shell-glow', theme.glow);
      rootStyle.setProperty('--shell-badge', theme.badge);
      rootStyle.setProperty('--button-focus', theme.sun);
    }
    function hasAttack(type) { return !!permanentPowerups[type]; }
    function currentAttackDef() { return PROJECTILE_DEFS[state.activeAttackType] || PROJECTILE_DEFS.bubbleBurst; }
    function currentPowerSummary() {
      if (!hasAttack(state.activeAttackType)) return 'Find Bubble Burst';
      return currentAttackDef().summary;
    }
    function syncAttackSelection(preferred = state.activeAttackType) {
      if (hasAttack(preferred)) { state.activeAttackType = preferred; return; }
      const fallback = ATTACK_ORDER.find(hasAttack) || 'bubbleBurst';
      state.activeAttackType = fallback;
    }
    function cycleAttackMode() {
      const unlocked = ATTACK_ORDER.filter(hasAttack);
      if (unlocked.length <= 1) return;
      const index = unlocked.indexOf(state.activeAttackType);
      state.activeAttackType = unlocked[(index + 1) % unlocked.length];
      showBanner(`Attack tuned — ${currentAttackDef().label}`);
      persistProgress();
    }
    function setPlayerState(nextState) {
      player.stateName = nextState;
    }
    function derivePlayerState() {
      if (levelTransitionTimer > 0 || state.won) return 'transition';
      if (player.hurtTimer > 0) return 'hurt';
      if (controls.attack && player.attackCooldown > 0.28) return 'attack';
      if (controls.chirp && player.chirpCooldown > 0.9) return 'chirp';
      if (player.onWall && !player.onGround && player.vy > 0) return 'wall-slide';
      if (!player.onGround && permanentPowerups.leafGlide && controls.jump && player.vy > 30) return 'glide';
      if (!player.onGround && player.vy < 0) return 'jump';
      if (!player.onGround) return 'fall';
      if (Math.abs(player.vx) > 45) return 'run';
      return 'idle';
    }
    function findNearestEnemy(x, y, maxDistance = 220, excludedIndexes = []) {
      let best = null;
      let bestDistance = maxDistance;
      for (let i = 0; i < enemies.length; i += 1) {
        if (excludedIndexes.includes(i)) continue;
        const enemy = enemies[i];
        if (!enemy.alive || enemy.frozen > 0) continue;
        const dx = enemy.x + enemy.w * 0.5 - x;
        const dy = enemy.y + enemy.h * 0.5 - y;
        const distance = Math.hypot(dx, dy);
        if (distance >= bestDistance) continue;
        bestDistance = distance;
        best = { enemy, index: i, dx, dy, distance };
      }
      return best;
    }
    function spawnEmberPool(x, y, radius = 42) {
      emberPools.push({ x, y, radius, life: 1.6, maxLife: 1.6 });
      if (emberPools.length > 6) emberPools.shift();
    }
    function spawnIceBridge(x, y) {
      temporaryPlatforms.push({
        x: clamp(x, 24, WORLD.width - 92),
        y: clamp(y, 96, WORLD.height - 120),
        w: 76,
        h: 16,
        life: 3.8,
        maxLife: 3.8,
        kind: 'icebridge'
      });
      if (temporaryPlatforms.length > 4) temporaryPlatforms.shift();
    }
    function buildLevelTriggers(level) {
      const next = [];
      for (const bridge of level.hiddenBridges) next.push({ id:`trigger_${bridge.id}`, kind:'bridgeReveal', sourceId:bridge.id, x:bridge.x - 120, y:bridge.y - 100, w:bridge.w + 240, h:bridge.h + 180, once:true });
      for (const pad of level.chimePads) next.push({ id:`trigger_${pad.id}`, kind:'chimePad', sourceId:pad.id, x:pad.x - 140, y:pad.y - 40, w:pad.w + 280, h:160, once:true });
      return next;
    }

    function cloneLevelData(level) {
      return {
        solids: level.solids.map(o => ({...o})),
        hiddenBridges: level.hiddenBridges.map(o => ({...o})),
        movingPlatforms: level.movingPlatforms.map(o => ({...o})),
        spikes: level.spikes.map(o => ({...o})),
        enemies: level.enemies.map(o => ({...o})),
        chimePads: level.chimePads.map(o => ({...o})),
        relics: level.relics.map(o => ({...o})),
        coins: level.coins.map(o => ({...o})),
        waterfalls: level.waterfalls.map(o => ({...o})),
        fireflies: level.fireflies.map(o => ({...o})),
        ambientPools: level.ambientPools.map(o => ({...o})),
        cavernCrystals: level.cavernCrystals.map(o => ({...o})),
        floatingLeaves: level.floatingLeaves.map(o => ({...o})),
        mistVents: (level.mistVents || []).map(o => ({...o})),
        slipperyZones: (level.slipperyZones || []).map(o => ({...o})),
        windZones: (level.windZones || []).map(o => ({...o})),
        powerups: (level.powerups || []).map((o, index) => ({...o, collected:false, bob:(index + 1) * 0.75, magnet:0, pulse:0}))
      };
    }
    function currentLevel() { return LEVELS[state.levelIndex]; }
    function zoneForX(x) {
      const level = currentLevel();
      if (x < level.zoneBreaks[0]) return level.zoneNames[0];
      if (x < level.zoneBreaks[1]) return level.zoneNames[1];
      return level.zoneNames[2];
    }

    function loadLevel(index, preserveLives = true) {
      state.levelIndex = index;
      const level = LEVELS[index];
      const cloned = cloneLevelData(level);
      solids = cloned.solids;
      hiddenBridges = cloned.hiddenBridges;
      movingPlatforms = cloned.movingPlatforms;
      spikes = cloned.spikes;
      enemies = cloned.enemies;
      chimePads = cloned.chimePads;
      relics = cloned.relics;
      coins = cloned.coins;
      waterfalls = cloned.waterfalls;
      fireflies = cloned.fireflies;
      ambientPools = cloned.ambientPools;
      cavernCrystals = cloned.cavernCrystals;
      floatingLeaves = cloned.floatingLeaves;
      mistVents = cloned.mistVents;
      slipperyZones = cloned.slipperyZones;
      windZones = cloned.windZones;
      powerups = cloned.powerups;
      triggers = buildLevelTriggers(level);
      projectiles = [];
      pickupBursts = [];
      emberPools = [];
      temporaryPlatforms = [];

      WORLD.width = level.worldWidth;
      WORLD.flagX = level.flagX;
      WORLD.respawnX = level.respawnX;
      WORLD.respawnY = level.respawnY;
      applyLevelTheme(level);

      player.x = level.respawnX;
      player.y = level.respawnY;
      player.vx = 0;
      player.vy = 0;
      player.onGround = false;
      player.onWall = false;
      player.coyote = 0;
      player.jumpBuffer = 0;
      player.hurtTimer = 0;
      player.chirpCooldown = 0;
      player.attackCooldown = 0;
      player.attackBuffer = 0;
      player.glideTime = 0;
      player.reserveHearts = permanentPowerups.heartReserve ? 1 : 0;
      player.flutterReady = permanentPowerups.leafGlide;
      syncAttackSelection(saveData.activeAttackType || state.activeAttackType);

      state.coins = 0;
      state.maxCoins = coins.length;
      state.relics = 0;
      state.maxRelics = relics.length;
      state.won = false;
      state.revealedBridges.clear();
      state.activatedChimes.clear();
      state.checkpointX = level.respawnX;
      state.checkpointY = level.respawnY;
      if (!preserveLives) state.lives = 3;
      state.currentLevelUnlocked = Math.max(saveData.unlockedLevel, state.currentLevelUnlocked || 1);
      view.x = 0;
      worldTime = 0;
      persistProgress();
      showBanner(level.intro, 2.2);
      const subtext = level.skyStyle === 'cavern' ? 'Mist vents, slippery stone, flooded grotto paths.' : (level.skyStyle === 'storm' ? 'Wind lanes, glide routes, and shrine-crown traversal.' : 'Rainforest run, waterfalls, and canopy ruins.');
      showLevelCard(level, subtext);
    }

    function goToNextLevel() {
      if (state.levelIndex < LEVELS.length - 1) {
        loadLevel(state.levelIndex + 1, true);
      } else {
        state.won = true;
        initAudio();
        playWinSound();
        showBanner('You cleared Levels 1–3. Levels 4–12 are scaffolded for expansion.', 4.2);
      }
    }

    function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
    function aabb(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
    function roundRect(x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }

    function viewportSize() {
      if (window.visualViewport) {
        return { width: Math.max(1, Math.round(window.visualViewport.width)), height: Math.max(1, Math.round(window.visualViewport.height)) };
      }
      return { width: window.innerWidth, height: window.innerHeight };
    }
    function resize() {
      const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      const viewport = viewportSize();
      canvas.width = Math.floor(viewport.width * dpr);
      canvas.height = Math.floor(viewport.height * dpr);
      view.w = canvas.width / (dpr * CAMERA_SCALE);
      view.h = canvas.height / (dpr * CAMERA_SCALE);
      ctx.setTransform(dpr * CAMERA_SCALE, 0, 0, dpr * CAMERA_SCALE, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', () => setTimeout(resize, 80));
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', resize);
      window.visualViewport.addEventListener('scroll', resize);
    }

    function showBanner(text, duration = 1.8) {
      banner.textContent = text;
      banner.classList.add('show');
      bannerTimer = duration;
    }
    function hideBanner() { banner.classList.remove('show'); }
    function showLevelCard(level, subtext = '') {
      levelCardKicker.textContent = `Level ${state.levelIndex + 1} of ${state.totalLevels}`;
      levelCardTitle.textContent = level.name;
      levelCardSub.textContent = subtext || `Explore ${level.zoneNames.join(' • ')}.`;
      levelCard.setAttribute('aria-hidden', 'false');
      levelCard.classList.add('show');
      levelCardTimer = 1.8;
    }
    function hideLevelCard() {
      levelCard.setAttribute('aria-hidden', 'true');
      levelCard.classList.remove('show');
    }

    function bindPress(id, key) {
      const el = document.getElementById(id);
      let holdTimer = null;
      const press = (e) => {
        e.preventDefault(); e.stopPropagation(); controls[key] = true; el.classList.add('active');
        if (typeof el.focus === 'function') el.focus({ preventScroll:true });
        if (key === 'chirp') attemptChirp();
        if (key === 'attack') {
          player.attackBuffer = Math.max(player.attackBuffer, 0.22);
          holdTimer = window.setTimeout(() => { cycleAttackMode(); holdTimer = null; }, 420);
          attemptAttack();
        }
      };
      const release = (e) => {
        e.preventDefault(); e.stopPropagation(); controls[key] = false; el.classList.remove('active');
        if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; }
      };
      el.addEventListener('pointerdown', press, { passive:false });
      el.addEventListener('pointerup', release, { passive:false });
      el.addEventListener('pointerleave', release, { passive:false });
      el.addEventListener('pointercancel', release, { passive:false });
      el.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    bindPress('leftBtn', 'left'); bindPress('rightBtn', 'right'); bindPress('jumpBtn', 'jump'); bindPress('chirpBtn', 'chirp'); bindPress('attackBtn', 'attack');
    ['selectstart','dragstart','gesturestart','gesturechange','gestureend'].forEach(evt => {
      window.addEventListener(evt, (e) => e.preventDefault(), { passive:false });
    });
    let lastTouchEnd = 0;
    window.addEventListener('touchend', (e) => {
      const now = Date.now(); if (now - lastTouchEnd < 320) e.preventDefault(); lastTouchEnd = now;
    }, { passive:false });
    const keyMap = { ArrowLeft:'left', KeyA:'left', ArrowRight:'right', KeyD:'right', ArrowUp:'jump', KeyW:'jump', Space:'jump', KeyC:'chirp', KeyX:'chirp', KeyZ:'attack', KeyK:'attack' };
    window.addEventListener('keydown', (e) => { const key = keyMap[e.code]; if (!key) return; e.preventDefault(); if (!controls[key]) { controls[key] = true; if (key === 'chirp') attemptChirp(); if (key === 'attack') { player.attackBuffer = Math.max(player.attackBuffer, 0.22); attemptAttack(); } } });
    window.addEventListener('keyup', (e) => { const key = keyMap[e.code]; if (!key) return; e.preventDefault(); controls[key] = false; });

    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyR') { e.preventDefault(); cycleAttackMode(); }
      if (e.code === 'Backquote') { e.preventDefault(); DEBUG.enabled = !DEBUG.enabled; }
      if (e.code === 'KeyH' && DEBUG.enabled) { e.preventDefault(); DEBUG.showHitboxes = !DEBUG.showHitboxes; }
      if (e.code === 'KeyT' && DEBUG.enabled) { e.preventDefault(); DEBUG.showTriggers = !DEBUG.showTriggers; }
      if (e.code === 'Digit1' && DEBUG.enabled) { e.preventDefault(); loadLevel(0, true); }
      if (e.code === 'Digit2' && DEBUG.enabled) { e.preventDefault(); loadLevel(1, true); }
      if (e.code === 'Digit3' && DEBUG.enabled) { e.preventDefault(); loadLevel(2, true); }
      if (e.code === 'KeyP' && DEBUG.enabled) { e.preventDefault(); Object.keys(permanentPowerups).forEach(k => permanentPowerups[k] = true); syncAttackSelection('stoneBall'); player.reserveHearts = 1; persistProgress(); showBanner('Debug: all powers granted'); }
    });


    function initAudio() {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
    }
    function beep(type, freq, duration, gainValue, glide = null, when = 0) {
      if (!audioCtx) return;
      const start = audioCtx.currentTime + when;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, start);
      if (glide) osc.frequency.exponentialRampToValueAtTime(glide, start + duration);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(start); osc.stop(start + duration + 0.03);
    }
    function playJumpSound() { beep('triangle', 350, 0.08, 0.05, 640); beep('sine', 480, 0.05, 0.03, 820, 0.015); }
    function playCoinSound() { beep('square', 760, 0.05, 0.04, 1220); beep('triangle', 1220, 0.08, 0.035, 1560, 0.03); }
    function playHurtSound() { beep('sawtooth', 220, 0.12, 0.045, 115); beep('square', 140, 0.15, 0.025, 88, 0.035); }
    function playWinSound() { [520, 680, 820, 1040, 1320].forEach((f, i) => beep('triangle', f, 0.12, 0.045, f * 1.04, i * 0.08)); }
    function playRelicSound() { [560, 740, 980].forEach((f, i) => beep('sine', f, 0.11, 0.04, f * 1.05, i * 0.07)); }
    function playChimePadSound() { beep('square', 930, 0.08, 0.035, 1180); beep('triangle', 1260, 0.12, 0.03, 1460, 0.05); }
    function playAttackSound(type = state.activeAttackType) { const tone = { bubbleBurst:[410,620], fireBall:[320,540], iceBall:[540,760], stoneBall:[190,250] }[type] || [410,620]; beep('sine', tone[0], 0.06, 0.04, tone[1]); beep(type === 'stoneBall' ? 'sawtooth' : 'triangle', tone[1], 0.10, 0.03, tone[1] * 1.35, 0.02); }
    function playPickupSound() { beep('triangle', 520, 0.08, 0.04, 740); beep('sine', 860, 0.12, 0.03, 920, 0.05); }
    function playCheckpointSound() { beep('triangle', 480, 0.08, 0.03, 620); beep('triangle', 620, 0.08, 0.03, 760, 0.07); }
    function spawnPickupBurst(x, y, color, accent = 'rgba(255,255,255,0.75)') {
      pickupBursts.push({ x, y, life:0.6, maxLife:0.6, color, accent });
    }
    function playChirpSound() {
      if (!audioCtx) return;
      const start = audioCtx.currentTime;
      const master = audioCtx.createGain();
      master.gain.setValueAtTime(0.0001, start);
      master.gain.exponentialRampToValueAtTime(0.10, start + 0.02);
      master.gain.exponentialRampToValueAtTime(0.0001, start + 0.48);
      master.connect(audioCtx.destination);

      const call = (type, points, level, offset) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(points[0], start + offset);
        osc.frequency.exponentialRampToValueAtTime(points[1], start + offset + 0.07);
        osc.frequency.exponentialRampToValueAtTime(points[2], start + offset + 0.16);
        gain.gain.setValueAtTime(0.0001, start + offset);
        gain.gain.exponentialRampToValueAtTime(level, start + offset + 0.018);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + offset + 0.18);
        osc.connect(gain).connect(master);
        osc.start(start + offset);
        osc.stop(start + offset + 0.21);
      };

      call('triangle', [2360, 1980, 2460], 0.82, 0.0);
      call('sine', [2100, 1900, 2240], 0.23, 0.0);
      call('triangle', [2620, 2200, 2790], 0.76, 0.18);
      call('sine', [2400, 2160, 2500], 0.22, 0.18);
      const flutter = audioCtx.createOscillator();
      const flutterGain = audioCtx.createGain();
      flutter.type = 'square';
      flutter.frequency.setValueAtTime(2800, start + 0.04);
      flutter.frequency.exponentialRampToValueAtTime(1700, start + 0.09);
      flutterGain.gain.setValueAtTime(0.0001, start + 0.04);
      flutterGain.gain.exponentialRampToValueAtTime(0.035, start + 0.05);
      flutterGain.gain.exponentialRampToValueAtTime(0.0001, start + 0.11);
      flutter.connect(flutterGain).connect(master);
      flutter.start(start + 0.04);
      flutter.stop(start + 0.12);
    }

    function attemptAttack() {
      if (!gameStarted || state.won || levelTransitionTimer > 0) return false;
      syncAttackSelection(state.activeAttackType);
      const attackType = state.activeAttackType;
      if (!hasAttack(attackType)) return false;
      const def = currentAttackDef();
      initAudio();
      if (player.attackCooldown > 0) {
        player.attackBuffer = Math.max(player.attackBuffer, 0.22);
        return false;
      }
      player.attackBuffer = 0;
      player.attackCooldown = def.cooldown;
      playAttackSound(attackType);
      const bubble = {
        x: player.x + player.w * 0.5 + player.facing * 16,
        y: player.y + (attackType === 'stoneBall' ? player.h * 0.72 : player.h * 0.45),
        w: def.radius * 2,
        h: def.radius * 2,
        radius:def.radius,
        vx: player.facing * def.speed,
        vy: attackType === 'fireBall' ? -24 : (attackType === 'iceBall' ? -14 : (attackType === 'bubbleBurst' ? -8 : 26)),
        life: def.life,
        type: attackType,
        effect:def.effect,
        spin:0,
        wobble: Math.random() * Math.PI * 2,
        chainsRemaining: attackType === 'bubbleBurst' ? 1 : 0,
        hitIndexes: [],
        impactCount: 0,
        grounded: false
      };
      projectiles.push(bubble);
      showBanner(def.label);
      return true;
    }

    function attemptChirp() {
      if (!gameStarted || state.won || levelTransitionTimer > 0) return;
      initAudio();
      if (player.chirpCooldown > 0) return;
      player.chirpCooldown = 1.12;
      playChirpSound();
      let reveals = 0;
      let chimes = 0;
      for (const trigger of triggers) {
        if (trigger.once && trigger.used) continue;
        const probe = { x: player.x - 30, y: player.y - 20, w: player.w + 60, h: player.h + 40 };
        if (!aabb(probe, trigger)) continue;
        if (trigger.kind === 'bridgeReveal' && !state.revealedBridges.has(trigger.sourceId)) { state.revealedBridges.add(trigger.sourceId); reveals++; trigger.used = true; }
        if (trigger.kind === 'chimePad' && player.onGround && !state.activatedChimes.has(trigger.sourceId)) { state.activatedChimes.add(trigger.sourceId); const pad = chimePads.find(p => p.id === trigger.sourceId); if (pad) pad.active = true; chimes++; trigger.used = true; }
      }
      if (chimes) playChimePadSound();
      if (reveals > 0) showBanner('The forest answers your coquí call');
      else if (chimes > 0) showBanner('Ancient chimes awaken');
      else showBanner('Co-quí!');
    }

    function getDynamicPlatforms() {
      return movingPlatforms.map(p => {
        const oscillate = Math.sin((worldTime * p.speed) + p.t * Math.PI * 2);
        return { ref: p, x: p.x + p.dx * oscillate, y: p.y + p.dy * oscillate, w: p.w, h: p.h, kind: p.kind };
      });
    }
    function solidRects() {
      const arr = solids.slice();
      for (const bridge of hiddenBridges) if (state.revealedBridges.has(bridge.id)) arr.push({...bridge, kind:'leafbridge'});
      for (const dyn of getDynamicPlatforms()) arr.push(dyn);
      for (const platform of temporaryPlatforms) arr.push(platform);
      return arr;
    }

    function resetToCheckpoint(full = false) {
      player.x = state.checkpointX; player.y = state.checkpointY; player.vx = 0; player.vy = 0; player.onGround = false; player.onWall = false; player.coyote = 0; player.jumpBuffer = 0; player.hurtTimer = full ? 0 : 1.2; player.flutterReady = permanentPowerups.leafGlide;
      if (full) loadLevel(state.levelIndex, false);
    }
    function hurtPlayer() {
      if (player.hurtTimer > 0 || state.won || levelTransitionTimer > 0) return;
      initAudio(); playHurtSound();
      if (player.reserveHearts > 0) {
        player.reserveHearts -= 1;
        showBanner('Heart Reserve saved you');
        rumbleTimer = 0.12;
        resetToCheckpoint(false);
        return;
      }
      state.lives -= 1; rumbleTimer = 0.18;
      if (state.lives <= 0) { showBanner('The forest gives you another chance'); state.lives = 3; loadLevel(state.levelIndex, true); return; }
      showBanner('Ouch — watch the jungle troublemakers'); resetToCheckpoint(false);
    }

    function update(dt) {
      if (!gameStarted) return;
      worldTime += dt;
      DEBUG.timer += dt;
      DEBUG.frames += 1;
      if (DEBUG.timer >= 0.25) { DEBUG.fps = Math.round(DEBUG.frames / DEBUG.timer); DEBUG.timer = 0; DEBUG.frames = 0; }
      if (bannerTimer > 0) {
        bannerTimer -= dt;
        if (bannerTimer <= 0) hideBanner();
      }
      if (levelCardTimer > 0) {
        levelCardTimer -= dt;
        if (levelCardTimer <= 0) hideLevelCard();
      }
      if (rumbleTimer > 0) rumbleTimer -= dt;
      if (player.hurtTimer > 0) player.hurtTimer -= dt;
      if (player.chirpCooldown > 0) player.chirpCooldown -= dt;
      if (player.attackCooldown > 0) player.attackCooldown -= dt;
      if (player.attackBuffer > 0) player.attackBuffer = Math.max(0, player.attackBuffer - dt);
      for (const burst of pickupBursts) burst.life -= dt;
      pickupBursts = pickupBursts.filter(burst => burst.life > 0);
      for (const pool of emberPools) pool.life -= dt;
      emberPools = emberPools.filter(pool => pool.life > 0);
      for (const platform of temporaryPlatforms) platform.life -= dt;
      temporaryPlatforms = temporaryPlatforms.filter(platform => platform.life > 0);
      if (levelTransitionTimer > 0) { levelTransitionTimer -= dt; if (levelTransitionTimer <= 0) goToNextLevel(); }
      if (player.attackBuffer > 0 && player.attackCooldown <= 0) attemptAttack();

      player.anim += dt * Math.max(1.4, Math.abs(player.vx) * 0.02);
      player.jumpBuffer = controls.jump ? 0.12 : Math.max(0, player.jumpBuffer - dt);
      player.coyote = player.onGround ? 0.1 : Math.max(0, player.coyote - dt);
      const target = (controls.left ? -1 : 0) + (controls.right ? 1 : 0);
      if (target !== 0) player.facing = target;

      const onSlippery = slipperyZones.some(slip => player.onGround && player.x + player.w > slip.x && player.x < slip.x + slip.w && player.y + player.h >= slip.y - 8 && player.y + player.h <= slip.y + 24);
      const accel = player.onGround ? (onSlippery ? 1160 : 1780) : 1200;
      const decel = player.onGround ? (onSlippery ? 280 : 1700) : 930;

      if (target !== 0) player.vx += target * accel * dt;
      else {
        if (player.vx > 0) player.vx = Math.max(0, player.vx - decel * dt);
        if (player.vx < 0) player.vx = Math.min(0, player.vx + decel * dt);
      }
      player.vx = clamp(player.vx, -player.speed, player.speed);

      if (player.jumpBuffer > 0 && (player.coyote > 0 || player.onWall)) {
        initAudio(); playJumpSound(); player.jumpBuffer = 0; player.vy = -player.jumpPower;
        if (player.onWall && !player.onGround) { player.vx = -player.facing * 260; player.facing *= -1; }
        player.onGround = false; player.onWall = false;
        player.flutterReady = permanentPowerups.leafGlide;
      } else if (player.jumpBuffer > 0 && permanentPowerups.leafGlide && !player.onGround && !player.onWall && player.flutterReady) {
        initAudio();
        beep('triangle', 540, 0.07, 0.035, 760);
        player.jumpBuffer = 0;
        player.vy = Math.min(player.vy, -255);
        player.vx += player.facing * 115;
        player.flutterReady = false;
        player.glideTime = 0.25;
      }

      const gliding = permanentPowerups.leafGlide && !player.onGround && controls.jump && player.vy > 30;
      if (!controls.jump && player.vy < -170) player.vy += 920 * dt;
      player.vy += player.gravity * dt * (gliding ? 0.42 : 1);
      if (gliding) {
        player.vy = Math.min(player.vy, 210);
        player.vx += player.facing * 16 * dt;
        player.glideTime += dt;
      } else {
        player.glideTime = Math.max(0, player.glideTime - dt * 2);
      }

      for (const wind of windZones) {
        if (aabb(player, wind)) {
          player.vx += wind.fx * dt;
          player.vy += wind.fy * dt;
        }
      }

      if (player.onWall && player.vy > 130) player.vy = Math.min(player.vy, 130);
      player.vy = Math.min(player.vy, player.maxFall);

      const rects = solidRects();
      player.x += player.vx * dt;
      player.onWall = false;
      for (const s of rects) {
        if (aabb(player, s)) {
          if (player.vx > 0) { player.x = s.x - player.w; if (s.kind === 'wallvine') player.onWall = true; }
          else if (player.vx < 0) { player.x = s.x + s.w; if (s.kind === 'wallvine') player.onWall = true; }
          player.vx = 0;
        }
      }
      player.y += player.vy * dt;
      player.onGround = false;
      const level = currentLevel();
      for (const s of rects) {
        if (aabb(player, s)) {
          if (player.vy > 0) {
            player.y = s.y - player.h; player.vy = 0; player.onGround = true;
            player.flutterReady = permanentPowerups.leafGlide;
            for (const range of level.checkpointRanges) {
              if (s.x > range[0] && s.x < range[1]) {
                const nextCheckpointX = s.x + 20;
                if (nextCheckpointX > state.checkpointX + 64) {
                  state.checkpointX = nextCheckpointX; state.checkpointY = s.y - player.h - 5;
                  initAudio(); playCheckpointSound(); showBanner('Checkpoint reached'); persistProgress();
                }
              }
            }
          } else if (player.vy < 0) { player.y = s.y + s.h; player.vy = 0; }
        }
      }

      for (const vent of mistVents) {
        const plume = { x: vent.x, y: vent.y - 185, w: vent.w, h: 185 };
        if (aabb(player, plume) && player.vy > -vent.power) {
          player.vy -= 36;
          if (player.vy < -vent.power) player.vy = -vent.power;
        }
      }

      if (player.x < 0) player.x = 0;
      if (player.y > WORLD.height + 160) hurtPlayer();
      for (const spike of spikes) if (!spike.broken && aabb(player, spike)) hurtPlayer();

      for (const pool of emberPools) {
        for (const enemy of enemies) {
          if (!enemy.alive) continue;
          const dx = enemy.x + enemy.w * 0.5 - pool.x;
          const dy = enemy.y + enemy.h * 0.5 - pool.y;
          if (Math.hypot(dx, dy) > pool.radius + enemy.w * 0.35 || enemy.burnLock > 0) continue;
          enemy.hp -= 1;
          enemy.flash = 0.18;
          enemy.burnLock = 0.38;
          if (enemy.hp <= 0) enemy.alive = false;
        }
      }

      for (const enemy of enemies) {
        if (!enemy.alive) continue;
        const enemyDef = ENEMY_DEFS[enemy.type] || ENEMY_DEFS.beetle;
        enemy.maxHp = enemy.maxHp || enemyDef.hp || 1;
        enemy.hp = enemy.hp || enemy.maxHp;
        enemy.frozen = Math.max(0, (enemy.frozen || 0) - dt);
        enemy.flash = Math.max(0, (enemy.flash || 0) - dt);
        enemy.burnLock = Math.max(0, (enemy.burnLock || 0) - dt);
        if (enemy.frozen > 0) continue;
        if (enemy.type === 'bat') {
          enemy.phase = (enemy.phase || 0) + dt * 3.4;
          enemy.x += enemy.vx * dt;
          enemy.y += Math.sin(enemy.phase) * 30 * dt;
        } else if (enemy.type === 'iguana') {
          enemy.burst = (enemy.burst || 0) - dt;
          if (enemy.burst <= 0) { enemy.vx = enemy.vx < 0 ? -120 : 120; enemy.burst = 1.2; }
          enemy.x += enemy.vx * dt;
        } else {
          enemy.x += enemy.vx * dt;
        }
        if (enemy.x < enemy.min || enemy.x + enemy.w > enemy.max) enemy.vx *= -1;
        if (aabb(player, {x:enemy.x,y:enemy.y,w:enemy.w,h:enemy.h})) {
          if (player.vy > 140 && player.y + player.h - enemy.y < 22) { enemy.hp -= 1; if (enemy.hp <= 0) enemy.alive = false;  player.vy = -340; player.squish = 0.18; initAudio(); beep('square', 280, 0.07, 0.04, 160); showBanner('Enemy bounced away'); }
          else hurtPlayer();
        }
      }

      for (const shot of projectiles) {
        const def = PROJECTILE_DEFS[shot.type] || PROJECTILE_DEFS.bubbleBurst;
        shot.spin += dt * 8;
        shot.wobble += dt * 5.8;
        if (shot.type === 'bubbleBurst') {
          const target = findNearestEnemy(shot.x, shot.y, 220, shot.hitIndexes || []);
          if (target) {
            shot.vx += clamp(target.dx * 4.5, -340, 340) * dt;
            shot.vy += clamp(target.dy * 5.4, -380, 380) * dt;
            const speed = Math.hypot(shot.vx, shot.vy);
            const maxSpeed = def.speed * 1.08;
            if (speed > maxSpeed) {
              shot.vx = (shot.vx / speed) * maxSpeed;
              shot.vy = (shot.vy / speed) * maxSpeed;
            }
          }
          shot.vy += Math.sin(shot.wobble) * 4 * dt;
        } else if (shot.type === 'fireBall') {
          shot.vy += (-20 - shot.vy) * dt * 2.8;
        } else if (shot.type === 'iceBall') {
          shot.vy += Math.sin(shot.wobble * 1.3) * 2.5 * dt;
        } else if (shot.type === 'stoneBall') {
          shot.vy += (shot.grounded ? 40 : 180) * dt;
          shot.grounded = false;
        }
        shot.x += shot.vx * dt;
        shot.y += shot.vy * dt;
        shot.life -= dt;
        const shotBox = { x: shot.x - shot.radius, y: shot.y - shot.radius, w: shot.radius * 2, h: shot.radius * 2 };
        for (const spike of spikes) {
          if (spike.broken || !aabb(shotBox, spike)) continue;
          if (shot.type === 'stoneBall') {
            spike.broken = true;
            shot.impactCount += 1;
            shot.vx *= 0.88;
            shot.life = Math.max(shot.life, 0.24);
            spawnPickupBurst(spike.x + spike.w * 0.5, spike.y + spike.h * 0.4, attackAccent('stoneBall'));
          } else if (shot.type === 'fireBall') {
            spawnEmberPool(shot.x, spike.y - 6, 34);
            shot.life = 0;
          } else if (shot.type === 'iceBall') {
            spawnIceBridge(shot.x - 38, spike.y - 18);
            shot.life = 0;
          } else {
            shot.life = 0;
          }
        }
        const solidHit = rects.find((rect) => aabb(shotBox, rect));
        if (solidHit) {
          if (shot.type === 'fireBall') {
            spawnEmberPool(shot.x, Math.min(shot.y, solidHit.y + 6));
            shot.life = 0;
          } else if (shot.type === 'iceBall') {
            spawnIceBridge(shot.x - 38, Math.min(shot.y - 10, solidHit.y - 18));
            shot.life = 0;
          } else if (shot.type === 'stoneBall') {
            if (shot.vy >= 0 && shot.y < solidHit.y + solidHit.h * 0.6) {
              shot.y = solidHit.y - shot.radius;
              shot.vy = 0;
              shot.grounded = true;
            } else {
              shot.vx *= -0.55;
              shot.vy *= 0.8;
            }
            shot.vx *= shot.grounded ? 0.98 : 0.92;
            shot.life -= 0.12;
          } else {
            shot.life = 0;
          }
        }
        for (let i = 0; i < enemies.length; i += 1) {
          const enemy = enemies[i];
          if (!enemy.alive || !aabb(shotBox, enemy) || (shot.hitIndexes || []).includes(i)) continue;
          enemy.flash = 0.12;
          shot.hitIndexes.push(i);
          if (shot.effect === 'freeze') {
            enemy.frozen = 1.6;
            enemy.hp = Math.max(0, enemy.hp - 1);
            if (enemy.hp <= 0) enemy.alive = false;
            spawnIceBridge(enemy.x - 18, enemy.y + enemy.h - 6);
            shot.life = 0;
            showBanner('Ice Ball chilled a foe');
          } else if (shot.effect === 'smash') {
            enemy.hp -= 2;
            if (enemy.hp <= 0) enemy.alive = false;
            if (shot.impactCount >= 1) shot.life = 0;
            shot.impactCount += 1;
            showBanner('Stone Ball smashed through');
          } else if (shot.type === 'fireBall') {
            enemy.hp -= 2;
            enemy.burnLock = 0.1;
            if (enemy.hp <= 0) enemy.alive = false;
            spawnEmberPool(enemy.x + enemy.w * 0.5, enemy.y + enemy.h * 0.5, 48);
            shot.life = 0;
            showBanner('Fire Ball scorched a foe');
          } else {
            enemy.hp -= 1;
            if (enemy.hp <= 0) enemy.alive = false;
            if (shot.chainsRemaining > 0) {
              const nextTarget = findNearestEnemy(enemy.x + enemy.w * 0.5, enemy.y + enemy.h * 0.5, 210, shot.hitIndexes);
              if (nextTarget) {
                const speed = def.speed * 0.94;
                const magnitude = Math.max(1, Math.hypot(nextTarget.dx, nextTarget.dy));
                shot.x = enemy.x + enemy.w * 0.5;
                shot.y = enemy.y + enemy.h * 0.45;
                shot.vx = (nextTarget.dx / magnitude) * speed;
                shot.vy = (nextTarget.dy / magnitude) * speed;
                shot.chainsRemaining -= 1;
                shot.life = Math.max(shot.life, 0.22);
                showBanner('Bubble Burst chained');
                continue;
              }
            }
            shot.life = 0;
            showBanner(`${PROJECTILE_DEFS[shot.type].label} landed`);
          }
        }
      }
      projectiles = projectiles.filter(b => b.life > 0 && b.x > view.x - 140 && b.x < view.x + view.w + 200 && b.y > -120 && b.y < WORLD.height + 180);

      for (const coin of coins) {
        coin.bob += dt * 2.6;
        if (!coin.collected && aabb(player, {x:coin.x - coin.r, y:coin.y - coin.r, w:coin.r * 2, h:coin.r * 2})) {
          coin.collected = true; state.coins += 1; initAudio(); playCoinSound(); if (state.coins === 1) showBanner('Forest echoes collected');
        }
      }
      for (const relic of relics) {
        if (!relic.collected && aabb(player, relic)) { relic.collected = true; state.relics += 1; initAudio(); playRelicSound(); showBanner(`Relic found — ${relic.zone}`); }
      }
      for (const powerup of powerups) {
        if (powerup.collected) continue;
        powerup.bob += dt * 2.8;
        powerup.pulse = Math.max(0, (powerup.pulse || 0) - dt * 2.4);
        const targetX = player.x + player.w * 0.5 - 14;
        const targetY = player.y + player.h * 0.42 - 14;
        const dx = targetX - powerup.x;
        const dy = targetY - powerup.y;
        const distance = Math.hypot(dx, dy);
        if (distance < 140) {
          const pull = clamp((140 - distance) / 140, 0, 1);
          powerup.magnet = Math.min(1, (powerup.magnet || 0) + dt * 3.5);
          powerup.pulse = Math.max(powerup.pulse, pull);
          const catchup = 2.4 + pull * 6.4;
          powerup.x += dx * dt * catchup;
          powerup.y += dy * dt * (catchup - 0.2);
        } else {
          powerup.magnet = Math.max(0, (powerup.magnet || 0) - dt * 3);
        }
        if (aabb(player, {x:powerup.x, y:powerup.y, w:28, h:28}) || distance < 26) {
          powerup.collected = true;
          permanentPowerups[powerup.type] = true;
          if (PROJECTILE_DEFS[powerup.type]) state.activeAttackType = powerup.type;
          if (powerup.type === 'heartReserve') player.reserveHearts = 1;
          if (powerup.type === 'leafGlide') player.flutterReady = true;
          if (PROJECTILE_DEFS[powerup.type]) player.attackCooldown = Math.min(player.attackCooldown, 0.12);
          player.attackBuffer = Math.max(player.attackBuffer, 0.18);
          spawnPickupBurst(powerup.x + 14, powerup.y + 14, attackAccent(powerup.type));
          initAudio(); playPickupSound(); showBanner(`${powerup.label} awakened`); persistProgress();
        }
      }
      for (const pad of chimePads) {
        if (pad.active && aabb(player, {x:pad.x - 10, y:pad.y - 120, w:pad.w + 20, h:140})) player.vy -= 22;
      }
      if (!state.won && levelTransitionTimer <= 0 && player.x + player.w > WORLD.flagX) {
        state.currentLevelUnlocked = Math.max(state.currentLevelUnlocked, Math.min(LEVELS.length, state.levelIndex + 2));
        persistProgress();
        if (state.levelIndex < LEVELS.length - 1) { levelTransitionTimer = 1.15; showBanner(`Level complete — ${LEVELS[state.levelIndex + 1].intro}`, 1.2); }
        else { state.won = true; initAudio(); playWinSound(); showBanner('You cleared Levels 1–3. Levels 4–12 are scaffolded for expansion.', 4.2); }
      }

      setPlayerState(derivePlayerState());
      const lookAhead = player.facing * (target !== 0 ? 130 : 70);
      const targetX = player.x - view.w * 0.33 + lookAhead;
      const targetY = clamp(player.y - view.h * 0.52 + Math.max(-40, player.vy * 0.05), 0, Math.max(0, WORLD.height - view.h));
      view.x += (clamp(targetX, 0, WORLD.width - view.w) - view.x) * Math.min(1, dt * 4.6);
      view.y += (targetY - view.y) * Math.min(1, dt * 2.4);

      coinsValue.textContent = `${state.coins}/${state.maxCoins}`;
      livesValue.textContent = `Lives ${state.lives}${player.reserveHearts > 0 ? ` +${player.reserveHearts}` : ''}`;
      relicValue.textContent = `${state.relics}/${state.maxRelics}`;
      zoneValue.textContent = `${zoneForX(player.x)} • L${state.levelIndex + 1}/${state.totalLevels}`;
      progressValue.textContent = `${clamp(Math.floor((player.x / WORLD.flagX) * 100), 0, 100)}%`;
      chirpValue.textContent = player.chirpCooldown > 0 ? `Chirp ${player.chirpCooldown.toFixed(1)}s` : 'Tap chirp to reveal paths';
      const passiveBoosts = ['leafGlide','heartReserve'].filter(key => permanentPowerups[key]).map(key => key === 'leafGlide' ? 'Glide' : 'Reserve');
      powerValue.textContent = hasAttack(state.activeAttackType)
        ? `${currentAttackDef().label} • ${passiveBoosts.join(' • ') || 'Journey'}`
        : (passiveBoosts.join(' • ') || 'Dormant');
      attackValue.textContent = hasAttack(state.activeAttackType)
        ? (player.attackCooldown > 0 ? `Attack ${player.attackCooldown.toFixed(1)}s • ${currentPowerSummary()}` : `${currentPowerSummary()} • hold to swap`)
        : 'Find Bubble Burst';
      if (attackBtn) {
        const accent = attackAccent(state.activeAttackType);
        attackBtn.style.borderColor = `${accent}77`;
        attackBtn.style.boxShadow = `0 12px 28px ${accent}2c`;
        attackBtn.setAttribute('aria-label', hasAttack(state.activeAttackType) ? `Attack with ${currentAttackDef().label}. Hold to swap power.` : 'Attack unavailable until you find Bubble Burst.');
      }
      if (attackBtnWord) {
        attackBtnWord.textContent = hasAttack(state.activeAttackType) ? ({
          bubbleBurst: 'Burst',
          fireBall: 'Flame',
          iceBall: 'Frost',
          stoneBall: 'Stone'
        }[state.activeAttackType] || 'Burst') : 'Find';
      }
    }

    function drawCloud(x, y, scale) {
      ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale); ctx.beginPath(); ctx.arc(25, 24, 20, 0, Math.PI * 2); ctx.arc(50, 18, 24, 0, Math.PI * 2); ctx.arc(78, 24, 20, 0, Math.PI * 2); ctx.arc(53, 34, 24, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
    function drawMountains(speed, baseY, color, points) {
      ctx.fillStyle = color;
      const offset = -(view.x * speed) % 1280;
      for (let k = -1; k < 4; k++) {
        ctx.beginPath();
        ctx.moveTo(offset + k * 1280, view.h);
        for (let i = 0; i < points.length; i += 2) ctx.lineTo(offset + k * 1280 + points[i], baseY - points[i + 1]);
        ctx.lineTo(offset + k * 1280 + 1280, view.h);
        ctx.closePath();
        ctx.fill();
      }
    }
    function drawCanopy(speed, yBase, color) {
      ctx.fillStyle = color;
      const offset = -(view.x * speed) % 320;
      for (let i = -2; i < Math.ceil(view.w / 320) + 2; i++) {
        const x = offset + i * 320;
        for (let j = 0; j < 6; j++) { ctx.beginPath(); ctx.arc(x + 55 + j * 44, yBase + Math.sin((i + j) * 0.8) * 10, 42 + (j % 2) * 9, 0, Math.PI * 2); ctx.fill(); }
      }
    }
    function drawPalms(offsetSpeed, y, tint) {
      const offset = -(view.x * offsetSpeed) % 220;
      for (let i = -2; i < Math.ceil(view.w / 220) + 2; i++) {
        const x = offset + i * 220;
        ctx.strokeStyle = tint; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(x + 50, view.h); ctx.lineTo(x + 52, y); ctx.stroke();
        ctx.fillStyle = tint;
        for (let j = 0; j < 5; j++) { ctx.beginPath(); ctx.ellipse(x + 52 + (j - 2) * 18, y - 12 + Math.abs(j - 2) * 4, 26, 8, (j - 2) * 0.45, 0, Math.PI * 2); ctx.fill(); }
      }
    }

    function drawSky() {
      const zone = zoneForX(player.x + view.w * 0.4);
      const style = currentLevel().skyStyle;
      const g = ctx.createLinearGradient(0, 0, 0, view.h);
      if (style === 'cavern') {
        if (zone.includes('Moonlit')) {
          g.addColorStop(0, '#12243d'); g.addColorStop(0.52, '#243e5d'); g.addColorStop(1, '#2f5059');
        } else if (zone.includes('Flooded')) {
          g.addColorStop(0, '#18364a'); g.addColorStop(0.52, '#24556b'); g.addColorStop(1, '#2d6f72');
        } else {
          g.addColorStop(0, '#17323b'); g.addColorStop(0.56, '#31525a'); g.addColorStop(1, '#58756d');
        }
      } else if (style === 'storm') {
        if (zone.includes('Shrine')) {
          g.addColorStop(0, '#243559'); g.addColorStop(0.56, '#4a5f8f'); g.addColorStop(1, '#7089a5');
        } else if (zone.includes('Tempest')) {
          g.addColorStop(0, '#304a70'); g.addColorStop(0.56, '#5577a1'); g.addColorStop(1, '#93b0bf');
        } else {
          g.addColorStop(0, '#486487'); g.addColorStop(0.56, '#7ba0b7'); g.addColorStop(1, '#d1e0e8');
        }
      } else {
        if (zone.includes('Night')) {
          g.addColorStop(0, '#18324e'); g.addColorStop(0.56, '#2b4f68'); g.addColorStop(1, '#375f62');
        } else if (zone.includes('Waterfall')) {
          g.addColorStop(0, '#91d9ec'); g.addColorStop(0.58, '#c5f0e6'); g.addColorStop(1, '#ebfbf3');
        } else {
          g.addColorStop(0, '#8dd6e9'); g.addColorStop(0.58, '#bdebd6'); g.addColorStop(1, '#e4f8ea');
        }
      }
      ctx.fillStyle = g; ctx.fillRect(0, 0, view.w, view.h);

      if (style === 'cavern') {
        drawMountains(0.10, 515, '#365568', [0,115,170,85,300,145,450,75,620,132,820,70,1030,140,1280]);
        drawMountains(0.18, 560, '#27424f', [0,140,140,75,330,155,520,90,690,165,890,95,1130,175,1280]);
        drawCanopy(0.34, 150, 'rgba(0,0,0,0.14)');
      } else if (style === 'storm') {
        drawMountains(0.13, 500, '#60779a', [0,90,190,120,350,150,530,95,710,160,960,110,1180,165,1280]);
        drawMountains(0.24, 550, '#435c79', [0,120,150,75,350,150,520,88,720,165,910,110,1130,180,1280]);
        drawCanopy(0.36, 180, '#46607b');
        drawCanopy(0.48, 230, '#31475f');
      } else {
        drawMountains(0.13, 490, zone.includes('Night') ? '#42627a' : '#8ecab7', [0,80,170,95,255,150,360,82,520,140,700,75,900,145,1150]);
        drawMountains(0.22, 540, zone.includes('Night') ? '#36536a' : '#6da994', [0,125,140,60,300,140,500,82,690,155,830,94,1040,165,1280]);
        drawCanopy(0.34, 170, zone.includes('Night') ? '#244a42' : '#4c8d67');
        drawCanopy(0.48, 220, zone.includes('Night') ? '#18392e' : '#2f6f52');
        drawPalms(0.58, 505, zone.includes('Night') ? '#2a5541' : '#4f8a59');
      }

      ctx.fillStyle = (zone.includes('Night') || zone.includes('Moonlit')) ? 'rgba(255,255,220,0.10)' : 'rgba(255,255,255,0.23)';
      for (let i = 0; i < 5; i++) {
        const x = ((i * 260) - view.x * 0.18) % (view.w + 280) - 120;
        drawCloud(x, 70 + i * 32, 1 + (i % 2) * 0.25);
      }
      for (const f of fireflies) {
        const sx = f.x - view.x * 0.92;
        const glow = 0.5 + Math.sin(performance.now() * 0.003 + f.phase) * 0.5;
        if (style === 'cavern' || zone.includes('Night') || zone.includes('Moonlit')) {
          ctx.fillStyle = `rgba(251, 239, 140, ${0.14 + glow * 0.32})`;
          ctx.beginPath(); ctx.arc(sx, f.y + Math.sin(performance.now() * 0.002 + f.phase) * 8, 3.5 + glow * 2.2, 0, Math.PI * 2); ctx.fill();
        }
      }
      for (const leaf of floatingLeaves) {
        const x = (leaf.x - view.x * 0.78 + Math.sin(performance.now() * 0.0015 + leaf.drift) * 18);
        const y = leaf.y + Math.sin(performance.now() * 0.0017 + leaf.drift) * 12;
        ctx.fillStyle = 'rgba(112, 181, 92, 0.22)';
        ctx.beginPath(); ctx.ellipse(x, y, leaf.size, leaf.size * 0.5, 0.4, 0, Math.PI * 2); ctx.fill();
      }
    }

    function drawGroundDecor(worldX, worldY, width, zone) {
      for (let x = worldX + 14; x < worldX + width - 20; x += 34) {
        const sx = x - view.x;
        ctx.fillStyle = (zone.includes('Night') || zone.includes('Moonlit')) ? '#4a8651' : '#5ba55d';
        ctx.beginPath(); ctx.moveTo(sx, worldY); ctx.lineTo(sx + 5, worldY - 18); ctx.lineTo(sx + 11, worldY); ctx.fill();
        ctx.beginPath(); ctx.moveTo(sx + 10, worldY); ctx.lineTo(sx + 16, worldY - 24); ctx.lineTo(sx + 23, worldY); ctx.fill();
      }
    }

    function drawBackProps() {
      const level = currentLevel();
      if (level.skyStyle === 'forest') {
        for (let i = 0; i < 24; i++) {
          const wx = 280 + i * 390;
          const x = wx - view.x * 0.72;
          const y = 515 + Math.sin(i * 0.6) * 10;
          ctx.fillStyle = 'rgba(56, 99, 69, 0.34)';
          ctx.fillRect(x + 18, y - 78, 14, 110);
          ctx.fillStyle = 'rgba(74, 143, 97, 0.28)';
          for (let j = 0; j < 6; j++) {
            ctx.beginPath();
            ctx.ellipse(x + 24 + (j - 2.5) * 14, y - 90 + Math.abs(j - 2.5) * 7, 24, 8, (j - 2.5) * 0.4, 0, Math.PI * 2);
            ctx.fill();
          }
          if (i % 3 === 1) {
            ctx.fillStyle = 'rgba(111, 83, 63, 0.14)';
            roundRect(x - 18, y - 24, 70, 54, 8);
            ctx.fill();
            ctx.fillStyle = 'rgba(178, 231, 211, 0.08)';
            roundRect(x + 4, y - 6, 22, 26, 5);
            ctx.fill();
          }
        }
      } else {
        for (let i = 0; i < 18; i++) {
          const wx = 320 + i * 430;
          const x = wx - view.x * 0.68;
          const y = 540 + Math.sin(i) * 12;
          ctx.fillStyle = 'rgba(39, 72, 82, 0.24)';
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + 42, y - 140);
          ctx.lineTo(x + 86, y);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = 'rgba(117, 233, 246, 0.12)';
          ctx.beginPath();
          ctx.moveTo(x + 26, y - 52);
          ctx.lineTo(x + 42, y - 118);
          ctx.lineTo(x + 58, y - 52);
          ctx.closePath();
          ctx.fill();
          if (i % 3 === 0) {
            ctx.fillStyle = 'rgba(129, 153, 170, 0.12)';
            roundRect(x + 96, y - 62, 36, 68, 8);
            ctx.fill();
            ctx.fillStyle = 'rgba(87, 111, 126, 0.1)';
            roundRect(x + 104, y - 54, 20, 18, 5);
            ctx.fill();
          }
        }
      }
    }

    function drawForegroundFoliage() {
      const level = currentLevel();
      if (level.skyStyle === 'forest') {
        for (let i = 0; i < 16; i++) {
          const wx = 120 + i * 620;
          const x = wx - view.x * 1.06;
          const baseY = view.h - 8;
          ctx.fillStyle = 'rgba(40, 96, 55, 0.22)';
          for (let j = 0; j < 5; j++) {
            ctx.beginPath();
            ctx.ellipse(x + j * 22, baseY - 18 - (j % 2) * 6, 26, 10, (j - 2) * 0.38, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.fillStyle = 'rgba(233, 199, 123, 0.16)';
          ctx.beginPath();
          ctx.arc(x + 26, baseY - 22, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        for (let i = 0; i < 12; i++) {
          const wx = 180 + i * 720;
          const x = wx - view.x * 1.08;
          const y = view.h - 12;
          ctx.fillStyle = 'rgba(95, 228, 245, 0.12)';
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + 20, y - 70);
          ctx.lineTo(x + 42, y);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = 'rgba(216, 232, 255, 0.1)';
          ctx.beginPath();
          ctx.arc(x + 20, y - 26, 5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }


    function drawHangingVines() {
      const style = currentLevel().skyStyle;
      for (let i = 0; i < 14; i++) {
        const wx = 260 + i * 580;
        const x = wx - view.x * 0.9;
        const top = style === 'cavern' ? 40 : 20;
        const len = 120 + (i % 4) * 46;
        ctx.strokeStyle = style === 'storm' ? 'rgba(118,153,138,0.24)' : 'rgba(76,132,93,0.28)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(x, top);
        ctx.quadraticCurveTo(x + Math.sin(i) * 12, top + len * 0.45, x + Math.cos(i) * 8, top + len);
        ctx.stroke();
      }
    }

    function drawAmbientPools() {
      for (const p of ambientPools) {
        const x = p.x - view.x, y = p.y - view.y;
        ctx.fillStyle = 'rgba(96, 206, 220, 0.26)';
        roundRect(x, y, p.w, p.h, 10); ctx.fill();
        ctx.fillStyle = 'rgba(182, 250, 255, 0.18)';
        for (let i = 0; i < p.w; i += 28) ctx.fillRect(x + i + 4, y + 4 + Math.sin(performance.now() * 0.004 + i) * 1.5, 16, 2);
      }
    }
    function drawMistVents() {
      for (const vent of mistVents) {
        const x = vent.x - view.x, y = vent.y - view.y;
        ctx.fillStyle = 'rgba(128, 245, 255, 0.18)';
        roundRect(x, y, vent.w, vent.h, 10); ctx.fill();
        for (let i = 0; i < 4; i++) {
          const drift = Math.sin(performance.now() * 0.004 + i + vent.x * 0.01) * 6;
          ctx.fillStyle = `rgba(170, 250, 255, ${0.08 + i * 0.03})`;
          ctx.beginPath();
          ctx.ellipse(x + vent.w * 0.5 + drift, y - 28 - i * 38, 18 - i * 2, 24 - i * 2, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    function drawSlipperyZones() {
      for (const slip of slipperyZones) {
        const x = slip.x - view.x, y = slip.y - view.y;
        ctx.fillStyle = 'rgba(145, 232, 255, 0.20)';
        roundRect(x, y, slip.w, slip.h, 8); ctx.fill();
        ctx.fillStyle = 'rgba(220, 250, 255, 0.22)';
        for (let i = 0; i < slip.w; i += 24) ctx.fillRect(x + i + 4, y + 4, 12, 2);
      }
    }
    function drawCrystals() {
      for (const c of cavernCrystals) {
        const x = c.x - view.x, y = c.y - view.y;
        ctx.fillStyle = 'rgba(112, 240, 255, 0.18)';
        ctx.beginPath(); ctx.moveTo(x, y + c.size); ctx.lineTo(x + c.size * 0.45, y); ctx.lineTo(x + c.size * 0.9, y + c.size); ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(184, 252, 255, 0.26)';
        ctx.beginPath(); ctx.moveTo(x + c.size * 0.3, y + c.size * 0.65); ctx.lineTo(x + c.size * 0.45, y + c.size * 0.18); ctx.lineTo(x + c.size * 0.6, y + c.size * 0.65); ctx.closePath(); ctx.fill();
      }
    }

    function drawTile(s) {
      const x = s.x - view.x, y = s.y - view.y;
      if (x + s.w < -40 || x > view.w + 40) return;
      const zone = zoneForX(s.x);
      const style = currentLevel().skyStyle;
      const nocturne = zone.includes('Night') || zone.includes('Moonlit');
      if (s.kind === 'ground') {
        const topColor = style === 'cavern' ? '#5ea88a' : (nocturne ? '#4d9554' : '#69b969');
        const bodyColor = style === 'cavern' ? '#624739' : (nocturne ? '#6a4a31' : '#835637');
        const shadeColor = style === 'cavern' ? '#432b24' : (nocturne ? '#4a311e' : '#5d3b21');
        ctx.save();
        roundRect(x, y, s.w, s.h, 14);
        const g = ctx.createLinearGradient(x, y, x, y + s.h);
        g.addColorStop(0, bodyColor);
        g.addColorStop(0.55, style === 'cavern' ? '#5b4030' : '#744c2c');
        g.addColorStop(1, shadeColor);
        ctx.fillStyle = g;
        ctx.fill();

        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        roundRect(x + 8, y + 10, s.w - 16, 18, 12);
        ctx.fill();
        ctx.fillStyle = topColor;
        roundRect(x, y - 12, s.w, 24, 12);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        roundRect(x + 10, y - 8, s.w - 20, 6, 5);
        ctx.fill();

        const ruinTint = style === 'cavern' ? 'rgba(137, 147, 157, 0.24)' : 'rgba(153, 126, 96, 0.18)';
        for (let i = 14; i < s.w - 26; i += 58) {
          ctx.fillStyle = ruinTint;
          roundRect(x + i, y + 26 + ((i / 58) % 2) * 4, 34, 14, 5);
          ctx.fill();
          ctx.fillStyle = 'rgba(0,0,0,0.08)';
          ctx.fillRect(x + i, y + 42 + ((i / 58) % 2) * 3, 34, 6);
        }
        ctx.strokeStyle = 'rgba(67, 40, 20, 0.18)';
        ctx.lineWidth = 3;
        for (let i = 20; i < s.w - 10; i += 72) {
          ctx.beginPath();
          ctx.moveTo(x + i, y + s.h - 12);
          ctx.bezierCurveTo(x + i - 4, y + s.h + 10, x + i + 18, y + s.h + 10, x + i + 12, y + s.h - 4);
          ctx.stroke();
        }
        drawGroundDecor(s.x, s.y, s.w, zone);
        ctx.restore();
      } else if (s.kind === 'moss' || s.kind === 'leafbridge') {
        const bark = style === 'cavern' ? '#6c5951' : (s.kind === 'leafbridge' ? '#698a45' : '#7f5b43');
        const barkDark = style === 'cavern' ? '#4c4039' : (s.kind === 'leafbridge' ? '#476a31' : '#5b3d2b');
        const cap = style === 'cavern' ? '#76b7a0' : (s.kind === 'leafbridge' ? '#86c45e' : '#73bf71');
        roundRect(x, y, s.w, s.h, 10);
        const g = ctx.createLinearGradient(x, y, x, y + s.h);
        g.addColorStop(0, bark);
        g.addColorStop(1, barkDark);
        ctx.fillStyle = g;
        ctx.fill();
        ctx.fillStyle = cap;
        roundRect(x, y - 8, s.w, 16, 10);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        roundRect(x + 8, y - 5, s.w - 16, 4, 4);
        ctx.fill();
        for (let i = 10; i < s.w - 8; i += 18) {
          ctx.fillStyle = s.kind === 'leafbridge' ? '#5e9b4f' : (style === 'cavern' ? '#4d8a79' : '#4e8f52');
          ctx.beginPath();
          ctx.ellipse(x + i, y + 8, 7, 3.5, 0.24, 0, Math.PI * 2);
          ctx.fill();
        }
        if (s.w > 90) {
          ctx.strokeStyle = style === 'cavern' ? 'rgba(116, 183, 160, 0.42)' : 'rgba(119, 204, 121, 0.42)';
          ctx.lineWidth = 2;
          for (let i = 20; i < s.w - 12; i += 32) {
            ctx.beginPath();
            ctx.moveTo(x + i, y + s.h - 2);
            ctx.quadraticCurveTo(x + i - 3, y + s.h + 10, x + i + 4, y + s.h + 20);
            ctx.stroke();
          }
        }
      } else if (s.kind === 'stone') {
        const stone = style === 'cavern' ? '#87939d' : '#a7b1ad';
        const dark = style === 'cavern' ? '#5f6c75' : '#818c88';
        const moss = style === 'cavern' ? '#63aeb4' : '#74ba72';
        roundRect(x, y, s.w, s.h, 9);
        const g = ctx.createLinearGradient(x, y, x, y + s.h);
        g.addColorStop(0, stone);
        g.addColorStop(1, dark);
        ctx.fillStyle = g;
        ctx.fill();
        ctx.fillStyle = moss;
        roundRect(x, y - 6, s.w, 12, 8);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.16)';
        roundRect(x + 8, y + 5, s.w - 16, 5, 4);
        ctx.fill();
        ctx.strokeStyle = 'rgba(54, 66, 73, 0.28)';
        ctx.lineWidth = 2;
        for (let i = 12; i < s.w - 12; i += 26) {
          ctx.beginPath();
          ctx.moveTo(x + i, y + 6);
          ctx.lineTo(x + i - 4, y + s.h - 6);
          ctx.moveTo(x + i - 4, y + 12);
          ctx.lineTo(x + i + 10, y + 16);
          ctx.stroke();
        }
      } else if (s.kind === 'brick') {
        const brick = style === 'cavern' ? '#765247' : (nocturne ? '#81523e' : '#9b6545');
        const brickDark = style === 'cavern' ? '#553a32' : (nocturne ? '#603a28' : '#6f452f');
        const moss = style === 'cavern' ? '#72b6a0' : '#77bf71';
        roundRect(x, y, s.w, s.h, 10);
        const g = ctx.createLinearGradient(x, y, x, y + s.h);
        g.addColorStop(0, brick);
        g.addColorStop(1, brickDark);
        ctx.fillStyle = g;
        ctx.fill();
        ctx.fillStyle = moss;
        roundRect(x, y - 6, s.w, 12, 8);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 1.5;
        const rows = Math.max(2, Math.floor(s.h / 10));
        for (let row = 0; row < rows; row += 1) {
          const offset = row % 2 === 0 ? 0 : 14;
          const brickY = y + row * (s.h / rows);
          ctx.beginPath();
          ctx.moveTo(x + 4, brickY);
          ctx.lineTo(x + s.w - 4, brickY);
          ctx.stroke();
          for (let i = 10 + offset; i < s.w - 6; i += 28) {
            ctx.beginPath();
            ctx.moveTo(x + i, brickY + 2);
            ctx.lineTo(x + i, brickY + (s.h / rows) - 2);
            ctx.stroke();
          }
        }
        for (let i = 18; i < s.w - 6; i += 36) {
          ctx.strokeStyle = 'rgba(53, 28, 19, 0.22)';
          ctx.beginPath();
          ctx.moveTo(x + i, y + s.h - 4);
          ctx.quadraticCurveTo(x + i + 5, y + s.h + 8, x + i - 1, y + s.h + 18);
          ctx.stroke();
        }
      } else if (s.kind === 'icebridge') {
        const lifeRatio = clamp((s.life || s.maxLife || 1) / (s.maxLife || 1), 0, 1);
        ctx.fillStyle = `rgba(166, 239, 255, ${0.24 + lifeRatio * 0.34})`;
        roundRect(x, y, s.w, s.h, 10);
        ctx.fill();
        ctx.fillStyle = 'rgba(241, 252, 255, 0.55)';
        roundRect(x + 4, y + 3, s.w - 8, 5, 7);
        ctx.fill();
        ctx.strokeStyle = 'rgba(123, 214, 255, 0.55)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 14; i < s.w - 10; i += 18) {
          ctx.moveTo(x + i, y + 3);
          ctx.lineTo(x + i - 6, y + s.h - 3);
        }
        ctx.stroke();
      } else if (s.kind === 'wallvine') {
        const stem = style === 'cavern' ? '#4f7e74' : '#5a8c5c';
        const stemBright = style === 'cavern' ? '#93d9d1' : '#8cd39b';
        ctx.strokeStyle = stem;
        ctx.lineWidth = 7;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x + s.w * 0.5, y);
        ctx.bezierCurveTo(x + s.w * 0.2, y + s.h * 0.28, x + s.w * 0.8, y + s.h * 0.68, x + s.w * 0.5, y + s.h);
        ctx.stroke();
        ctx.strokeStyle = stemBright;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + s.w * 0.45, y + 6);
        ctx.bezierCurveTo(x + s.w * 0.34, y + s.h * 0.32, x + s.w * 0.66, y + s.h * 0.62, x + s.w * 0.44, y + s.h - 8);
        ctx.stroke();
        for (let i = 14; i < s.h - 8; i += 20) {
          const leafX = x + s.w * 0.5;
          const leafY = y + i;
          ctx.fillStyle = style === 'cavern' ? '#79bda9' : '#77bf74';
          ctx.beginPath();
          ctx.ellipse(leafX - 8, leafY, 8, 4, -0.6, 0, Math.PI * 2);
          ctx.ellipse(leafX + 8, leafY + 4, 8, 4, 0.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    function drawSpikes() {
      for (const s of spikes) {
        if (s.broken) continue;
        const x = s.x - view.x;
        const y = s.y - view.y;
        if (x + s.w < -40 || x > view.w + 40) continue;
        const count = Math.max(2, Math.round(s.w / 14));
        const toothWidth = s.w / count;
        const baseY = y + s.h;

        ctx.fillStyle = '#7d3f34';
        roundRect(x, y + s.h - 5, s.w, 6, 3);
        ctx.fill();

        ctx.fillStyle = '#c95b4f';
        ctx.beginPath();
        for (let i = 0; i < count; i += 1) {
          const left = x + i * toothWidth;
          const right = left + toothWidth;
          const tipY = y + 2 + (i % 2) * 1.5;
          ctx.moveTo(left + 1, baseY);
          ctx.quadraticCurveTo(left + toothWidth * 0.5, tipY, right - 1, baseY);
        }
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 242, 225, 0.2)';
        ctx.lineWidth = 1.2;
        for (let i = 0; i < count; i += 1) {
          const left = x + i * toothWidth;
          ctx.beginPath();
          ctx.moveTo(left + toothWidth * 0.5, y + 4);
          ctx.lineTo(left + toothWidth * 0.5, baseY - 3);
          ctx.stroke();
        }
      }
    }
    function drawCoins() {
      for (const coin of coins) {
        if (coin.collected) continue;
        const x = coin.x - view.x, y = coin.y - view.y + Math.sin(coin.bob) * 4;
        const g = ctx.createRadialGradient(x - 2, y - 4, 2, x, y, coin.r + 3);
        g.addColorStop(0, '#fff8b3');
        g.addColorStop(0.7, '#ffd75d');
        g.addColorStop(1, '#e0a82f');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.ellipse(x, y, coin.r, coin.r - 2, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#cb8e18'; ctx.lineWidth = 3; ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.46)';
        ctx.beginPath(); ctx.ellipse(x - 4, y - 4, 3, 5, 0.2, 0, Math.PI * 2); ctx.fill();
      }
    }
    function drawRelics() {
      for (const relic of relics) {
        if (relic.collected) continue;
        const x = relic.x - view.x, y = relic.y - view.y + Math.sin(performance.now() * 0.004 + relic.x * 0.01) * 3;
        ctx.save();
        ctx.shadowColor = currentLevel().skyStyle === 'cavern' ? 'rgba(115,215,239,0.45)' : 'rgba(109,188,176,0.30)';
        ctx.shadowBlur = 12;
        ctx.fillStyle = currentLevel().skyStyle === 'cavern' ? '#d8f6ff' : '#d9f2f1';
        roundRect(x, y, relic.w, relic.h, 8); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = currentLevel().skyStyle === 'cavern' ? '#73d7ef' : '#6dbcb0';
        ctx.beginPath(); ctx.arc(x + relic.w * 0.5, y + 12, 5.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.32)'; ctx.fillRect(x + 5, y + 5, 8, 4);
        ctx.restore();
      }
    }
    function drawWaterfalls() {
      for (const d of waterfalls) {
        const x = d.x - view.x;
        const g = ctx.createLinearGradient(x, d.y, x + d.w, d.y);
        if (currentLevel().skyStyle === 'cavern') {
          g.addColorStop(0, `rgba(90,210,255,${d.a * 0.5})`);
          g.addColorStop(0.5, `rgba(145,245,255,${d.a})`);
          g.addColorStop(1, `rgba(90,210,255,${d.a * 0.45})`);
        } else {
          g.addColorStop(0, `rgba(180,236,255,${d.a * 0.45})`);
          g.addColorStop(0.5, `rgba(215,248,255,${d.a})`);
          g.addColorStop(1, `rgba(180,236,255,${d.a * 0.45})`);
        }
        ctx.fillStyle = g;
        roundRect(x, d.y, d.w, d.h, 10); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.16)';
        for (let i = 4; i < d.h; i += 26) ctx.fillRect(x + d.w * 0.22, d.y + i, d.w * 0.16, 10);
      }
    }
    function drawEnemy(e) {
      if (!e.alive) return;
      const x = e.x - view.x, y = e.y - view.y;
      ctx.save();
      ctx.translate(x + e.w / 2, y + e.h / 2);
      if (e.vx < 0) ctx.scale(-1, 1);
      if (e.frozen > 0) { ctx.globalAlpha = 0.72; }
      if (e.flash > 0) { ctx.shadowColor = 'rgba(255,255,255,0.45)'; ctx.shadowBlur = 14; }
      if (e.type === 'beetle') {
        ctx.fillStyle = '#7e4d8b'; ctx.beginPath(); ctx.ellipse(0, 4, 17, 13, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#c3a5d4'; ctx.beginPath(); ctx.ellipse(-4, 1, 6, 4, 0, 0, Math.PI * 2); ctx.ellipse(4, 1, 6, 4, 0, 0, Math.PI * 2); ctx.fill();
      } else if (e.type === 'snail') {
        ctx.fillStyle = '#b47e4e'; ctx.beginPath(); ctx.ellipse(2, 4, 16, 12, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#dcbc98'; ctx.beginPath(); ctx.arc(-9, 4, 8, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#845734'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(4, 2, 11, Math.PI * 1.1, Math.PI * 1.95); ctx.stroke();
      } else if (e.type === 'bat') {
        ctx.fillStyle = '#5b6da5'; ctx.beginPath(); ctx.ellipse(0, 4, 10, 12, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-6, 0); ctx.quadraticCurveTo(-22, -14, -24, 8); ctx.quadraticCurveTo(-12, 2, -6, 8); ctx.fill();
        ctx.beginPath(); ctx.moveTo(6, 0); ctx.quadraticCurveTo(22, -14, 24, 8); ctx.quadraticCurveTo(12, 2, 6, 8); ctx.fill();
        ctx.fillStyle = '#d8e3ff'; ctx.beginPath(); ctx.arc(-3, 2, 2, 0, Math.PI * 2); ctx.arc(3, 2, 2, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.fillStyle = '#5d9a58'; ctx.beginPath(); ctx.ellipse(0, 6, 18, 11, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#d7f0bf'; ctx.beginPath(); ctx.ellipse(-6, 2, 8, 5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#4f7247'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-8, 10); ctx.lineTo(-16, 18); ctx.moveTo(6, 10); ctx.lineTo(14, 18); ctx.stroke();
      }
      if (e.frozen > 0) { ctx.fillStyle = 'rgba(188,240,255,0.35)'; ctx.beginPath(); ctx.arc(0, 4, 20, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
    }
    function drawChimePads() { for (const pad of chimePads) { const x = pad.x - view.x, y = pad.y - view.y; ctx.fillStyle = pad.active ? '#8de0a0' : '#6a9180'; roundRect(x, y, pad.w, pad.h, 8); ctx.fill(); ctx.fillStyle = pad.active ? 'rgba(157,255,190,0.18)' : 'rgba(255,255,255,0.08)'; ctx.beginPath(); ctx.moveTo(x + pad.w * 0.5, y - 90); ctx.lineTo(x + pad.w * 0.5 - 18, y - 12); ctx.lineTo(x + pad.w * 0.5 + 18, y - 12); ctx.closePath(); ctx.fill(); } }

    function drawFrog() {
      const bounce = player.onGround ? Math.abs(Math.sin(player.anim * 6)) * 2 : 0;
      const stateMode = player.stateName === 'glide' ? 'jump' : (player.stateName === 'wall-slide' ? 'jump' : (player.stateName === 'attack' ? 'run' : player.stateName));
      const x = player.x - view.x;
      const y = player.y - view.y + (player.squish > 0 ? 3 : 0);
      const cx = x + player.w / 2;
      const cy = y + player.h / 2;
      const chirpPulse = player.stateName === 'chirp' ? 1 : 0;
      const glideSpread = player.stateName === 'glide' ? 1 : 0;
      const attackGlow = player.stateName === 'attack' ? attackAccent(state.activeAttackType) : null;
      ctx.save();
      ctx.translate(cx, cy);
      if (player.facing < 0) ctx.scale(-1, 1);
      if (player.squish > 0) {
        ctx.scale(1.1, 0.86);
        player.squish = Math.max(0, player.squish - 0.018);
      }

      const runCycle = Math.sin(player.anim * 8);
      const armSwing = stateMode === 'run' ? runCycle * 4.5 : 0;
      const legSwing = stateMode === 'run' ? runCycle * 6.5 : (stateMode === 'jump' ? -5.5 : 0);
      const crouch = stateMode === 'jump' ? -4 : 0;

      ctx.fillStyle = 'rgba(0,0,0,0.16)';
      ctx.beginPath();
      ctx.ellipse(0, 24, 20, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      if (glideSpread) {
        ctx.fillStyle = 'rgba(138, 198, 114, 0.24)';
        ctx.beginPath();
        ctx.moveTo(-5, -1);
        ctx.quadraticCurveTo(-20, -16, -30, 6);
        ctx.quadraticCurveTo(-13, 4, -3, 10);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(5, -1);
        ctx.quadraticCurveTo(20, -16, 30, 6);
        ctx.quadraticCurveTo(13, 4, 3, 10);
        ctx.closePath();
        ctx.fill();
      }
      if (attackGlow) {
        ctx.fillStyle = `${attackGlow}33`;
        ctx.beginPath();
        ctx.ellipse(12, 4, 18, 12, -0.1, 0, Math.PI * 2);
        ctx.fill();
      }

      const bodyGrad = ctx.createLinearGradient(-18, -24, 16, 20);
      bodyGrad.addColorStop(0, '#caa16d');
      bodyGrad.addColorStop(0.5, '#987046');
      bodyGrad.addColorStop(1, '#5f432c');
      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      ctx.ellipse(0, 10 - bounce + crouch * 0.2, 16.5, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(0, -10 - bounce + crouch * 0.35, 20.5, 17.5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(80, 54, 34, 0.46)';
      ctx.beginPath();
      ctx.ellipse(-7, -6 - bounce, 5, 7, 0.3, 0, Math.PI * 2);
      ctx.ellipse(7, -5 - bounce, 5, 7, -0.3, 0, Math.PI * 2);
      ctx.ellipse(0, -13 - bounce, 5.5, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();

      const bellyGrad = ctx.createLinearGradient(0, -4, 0, 24);
      bellyGrad.addColorStop(0, '#f6ead2');
      bellyGrad.addColorStop(1, '#dfc8a2');
      ctx.fillStyle = bellyGrad;
      ctx.beginPath();
      ctx.ellipse(0, 12 - bounce + crouch * 0.25, 10, 10.5, 0, 0, Math.PI * 2);
      ctx.fill();
      if (chirpPulse) {
        ctx.fillStyle = 'rgba(247, 225, 166, 0.85)';
        ctx.beginPath();
        ctx.ellipse(0, 2 - bounce, 7.5, 6, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = '#67472d';
      ctx.beginPath();
      ctx.arc(-10, -19 - bounce, 7.9, 0, Math.PI * 2);
      ctx.arc(10, -19 - bounce, 7.9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f4f0e1';
      ctx.beginPath();
      ctx.arc(-10, -19 - bounce, 5.8, 0, Math.PI * 2);
      ctx.arc(10, -19 - bounce, 5.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e7a44f';
      ctx.beginPath();
      ctx.arc(-9.5, -19 - bounce, 3.1, 0, Math.PI * 2);
      ctx.arc(9.5, -19 - bounce, 3.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1c1812';
      ctx.beginPath();
      ctx.arc(-9.2, -19 - bounce, 1.8, 0, Math.PI * 2);
      ctx.arc(9.8, -19 - bounce, 1.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#5d422a';
      ctx.lineWidth = 3.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-8, -7 - bounce);
      ctx.quadraticCurveTo(-2, -4 - bounce, 0, -2 - bounce);
      ctx.quadraticCurveTo(3, -4 - bounce, 8, -8 - bounce);
      ctx.stroke();
      ctx.strokeStyle = '#3f2e1f';
      ctx.lineWidth = 2.1;
      ctx.beginPath();
      ctx.arc(1, -4 - bounce, 6.5, 0.24, 0.98);
      ctx.stroke();

      ctx.strokeStyle = '#6b4a31';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-8, 11 - bounce);
      ctx.lineTo(-17, 18 + legSwing - bounce);
      ctx.lineTo(-22, 24 - bounce);
      ctx.moveTo(8, 11 - bounce);
      ctx.lineTo(18, 18 - legSwing - bounce);
      ctx.lineTo(24, 24 - bounce);
      ctx.moveTo(-11, -1 - bounce);
      ctx.lineTo(-18, 7 - armSwing - bounce);
      ctx.lineTo(-24, 12 - bounce);
      ctx.moveTo(11, -1 - bounce);
      ctx.lineTo(18, 7 + armSwing - bounce);
      ctx.lineTo(24, 12 - bounce);
      ctx.stroke();

      ctx.fillStyle = '#f2c08a';
      [[-24, 12], [-22, 24], [24, 12], [24, 24]].forEach(([tx, ty]) => {
        ctx.beginPath();
        ctx.arc(tx, ty - bounce, 3.8, 0, Math.PI * 2);
        ctx.fill();
      });

      if (player.hurtTimer > 0 && Math.floor(player.hurtTimer * 10) % 2 === 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.26)';
        ctx.beginPath();
        ctx.arc(0, 0, 25, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    function drawGoal() {
      const x = WORLD.flagX - view.x, y = 230;
      ctx.fillStyle = '#6f523a'; ctx.fillRect(x, y, 12, 390);
      ctx.fillStyle = '#d9f5e8'; ctx.beginPath(); ctx.moveTo(x + 12, y + 10); ctx.lineTo(x + 84, y + 34); ctx.lineTo(x + 12, y + 58); ctx.closePath(); ctx.fill();
      ctx.fillStyle = currentLevel().skyStyle === 'cavern' ? '#73d7ef' : '#54b072'; ctx.beginPath(); ctx.arc(x + 42, y + 34, 12, 0, Math.PI * 2); ctx.fill();
    }
    function drawMist() { for (let i = 0; i < 5; i++) { const x = ((i * 260) - view.x * (0.12 + i * 0.04)) % (view.w + 340) - 180; ctx.fillStyle = currentLevel().skyStyle === 'cavern' ? 'rgba(132,225,255,0.08)' : (currentLevel().skyStyle === 'storm' ? 'rgba(216,232,255,0.12)' : 'rgba(236,252,247,0.13)'); ctx.beginPath(); ctx.ellipse(x, 360 + i * 26, 120, 34, 0, 0, Math.PI * 2); ctx.fill(); } }
    function drawWindZones() { for (const wind of windZones) { const x = wind.x - view.x, y = wind.y - view.y; ctx.strokeStyle = 'rgba(255,255,255,0.14)'; ctx.setLineDash([8,10]); ctx.strokeRect(x, y, wind.w, wind.h); ctx.setLineDash([]); for (let i = 0; i < 4; i++) { const px = x + 20 + i * (wind.w / 4); const py = y + 40 + Math.sin(performance.now() * 0.004 + i) * 12; ctx.strokeStyle = 'rgba(220,240,255,0.26)'; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + wind.fx * 0.08, py + wind.fy * 0.08); ctx.stroke(); } } }
    function drawPowerups() {
      for (const powerup of powerups) {
        if (powerup.collected || permanentPowerups[powerup.type]) continue;
        const bobOffset = Math.sin(powerup.bob || 0) * (4 + (powerup.magnet || 0) * 3);
        const x = powerup.x - view.x;
        const y = powerup.y - view.y + bobOffset;
        const accent = attackAccent(powerup.type);
        const pulse = 1 + (powerup.pulse || 0) * 0.12;
        ctx.save();
        ctx.translate(x + 14, y + 14);
        ctx.scale(pulse, pulse);
        ctx.shadowColor = `${accent}88`;
        ctx.shadowBlur = 18;
        ctx.fillStyle = `${accent}40`;
        ctx.beginPath();
        ctx.arc(0, 0, 16 + (powerup.magnet || 0) * 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = `${accent}ee`;
        roundRect(-14, -14, 28, 28, 11);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        roundRect(-11, -11, 22, 10, 8);
        ctx.fill();

        if (powerup.type === 'bubbleBurst') {
          ctx.fillStyle = 'rgba(255,255,255,0.86)';
          ctx.beginPath();
          ctx.arc(-4, -3, 5, 0, Math.PI * 2);
          ctx.arc(5, 2, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(173,236,255,0.92)';
          ctx.beginPath();
          ctx.arc(-1, 4, 6, 0, Math.PI * 2);
          ctx.fill();
        } else if (powerup.type === 'leafGlide') {
          ctx.fillStyle = '#f0ffe3';
          ctx.beginPath();
          ctx.moveTo(-6, 6);
          ctx.quadraticCurveTo(-9, -7, 3, -8);
          ctx.quadraticCurveTo(10, -3, 5, 8);
          ctx.quadraticCurveTo(0, 11, -6, 6);
          ctx.fill();
          ctx.strokeStyle = '#76a44d';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(-4, 6);
          ctx.lineTo(4, -5);
          ctx.stroke();
        } else if (powerup.type === 'fireBall') {
          ctx.fillStyle = '#fff0c2';
          ctx.beginPath();
          ctx.moveTo(0, -9);
          ctx.quadraticCurveTo(8, -2, 5, 8);
          ctx.quadraticCurveTo(0, 12, -5, 8);
          ctx.quadraticCurveTo(-8, -1, 0, -9);
          ctx.fill();
          ctx.fillStyle = '#ff9056';
          ctx.beginPath();
          ctx.moveTo(0, -6);
          ctx.quadraticCurveTo(4, 0, 2, 5);
          ctx.quadraticCurveTo(0, 7, -2, 5);
          ctx.quadraticCurveTo(-4, 0, 0, -6);
          ctx.fill();
        } else if (powerup.type === 'iceBall') {
          ctx.fillStyle = '#effcff';
          ctx.beginPath();
          ctx.moveTo(0, -9);
          ctx.lineTo(7, 0);
          ctx.lineTo(0, 9);
          ctx.lineTo(-7, 0);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#8fdfff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(-6, 0);
          ctx.lineTo(6, 0);
          ctx.moveTo(0, -6);
          ctx.lineTo(0, 6);
          ctx.stroke();
        } else if (powerup.type === 'stoneBall') {
          ctx.fillStyle = '#f2e4ca';
          ctx.beginPath();
          ctx.arc(-5, 2, 4, 0, Math.PI * 2);
          ctx.arc(3, -1, 5, 0, Math.PI * 2);
          ctx.arc(6, 6, 3, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = '#fff0f4';
          ctx.beginPath();
          ctx.moveTo(0, 9);
          ctx.bezierCurveTo(-10, 2, -9, -8, 0, -4);
          ctx.bezierCurveTo(9, -8, 10, 2, 0, 9);
          ctx.fill();
        }
        ctx.restore();
      }
    }
    function drawProjectiles() {
      for (const bubble of projectiles) {
        const x = bubble.x - view.x;
        const y = bubble.y - view.y;
        const def = PROJECTILE_DEFS[bubble.type] || PROJECTILE_DEFS.bubbleBurst;
        if (bubble.type === 'bubbleBurst' && bubble.chainsRemaining > 0) {
          ctx.strokeStyle = 'rgba(142, 223, 255, 0.24)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(x, y, bubble.radius + 6, 0, Math.PI * 2);
          ctx.stroke();
        }
        if (bubble.type === 'fireBall') {
          ctx.fillStyle = 'rgba(255, 151, 77, 0.16)';
          ctx.beginPath();
          ctx.arc(x, y, bubble.radius + 8, 0, Math.PI * 2);
          ctx.fill();
        } else if (bubble.type === 'stoneBall') {
          ctx.fillStyle = 'rgba(201, 176, 134, 0.18)';
          ctx.beginPath();
          ctx.arc(x, y, bubble.radius + 6, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = def.color;
        ctx.beginPath();
        ctx.arc(x, y, bubble.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = def.edge;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.22)';
        ctx.beginPath();
        ctx.arc(x - bubble.radius * 0.3, y - bubble.radius * 0.35, bubble.radius * 0.25, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    function drawEmberPools() {
      for (const pool of emberPools) {
        const x = pool.x - view.x;
        const y = pool.y - view.y;
        const lifeRatio = clamp(pool.life / pool.maxLife, 0, 1);
        ctx.save();
        ctx.globalAlpha = 0.2 + lifeRatio * 0.4;
        const glow = ctx.createRadialGradient(x, y, 6, x, y, pool.radius);
        glow.addColorStop(0, 'rgba(255, 244, 196, 0.75)');
        glow.addColorStop(0.45, 'rgba(255, 154, 88, 0.45)');
        glow.addColorStop(1, 'rgba(255, 103, 48, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, pool.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
    function drawPickupBursts() {
      for (const burst of pickupBursts) {
        const progress = 1 - burst.life / burst.maxLife;
        const x = burst.x - view.x;
        const y = burst.y - view.y;
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - progress);
        ctx.strokeStyle = burst.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 10 + progress * 20, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = burst.accent;
        for (let i = 0; i < 6; i += 1) {
          const angle = (Math.PI * 2 * i) / 6 + progress * 1.2;
          ctx.beginPath();
          ctx.arc(x + Math.cos(angle) * (8 + progress * 18), y + Math.sin(angle) * (8 + progress * 18), 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    }
    function drawDebugOverlay() { if (!DEBUG.enabled) return; ctx.save(); ctx.font = '12px sans-serif'; ctx.fillStyle = 'rgba(5,10,12,0.72)'; ctx.fillRect(12, view.h - 96, 250, 84); ctx.fillStyle = '#dff8ef'; ctx.fillText(`FPS ${DEBUG.fps} | State ${player.stateName}`, 22, view.h - 70); ctx.fillText(`Attack ${state.activeAttackType} | Lv ${state.levelIndex + 1}`, 22, view.h - 52); ctx.fillText('` debug • H hitboxes • T triggers • 1/2/3 jump • P powers', 22, view.h - 34); if (DEBUG.showHitboxes) { ctx.strokeStyle = 'rgba(255,120,120,0.7)'; for (const rect of solidRects()) ctx.strokeRect(rect.x - view.x, rect.y - view.y, rect.w, rect.h); ctx.strokeStyle = 'rgba(120,220,255,0.7)'; ctx.strokeRect(player.x - view.x, player.y - view.y, player.w, player.h); } if (DEBUG.showTriggers) { ctx.strokeStyle = 'rgba(255,215,95,0.75)'; for (const trigger of triggers) ctx.strokeRect(trigger.x - view.x, trigger.y - view.y, trigger.w, trigger.h); } ctx.restore(); }

    function render() {
      const shakeX = rumbleTimer > 0 ? Math.sin(performance.now() * 0.08) * 4 * (rumbleTimer / 0.18) : 0;
      ctx.save();
      ctx.translate(shakeX, 0);
      drawSky();
      drawBackProps();
      drawHangingVines();
      drawMist();
      drawWaterfalls();
      drawAmbientPools();
      drawMistVents();
      drawSlipperyZones();
      drawWindZones();
      drawCrystals();
      solids.forEach(drawTile);
      getDynamicPlatforms().forEach(drawTile);
      hiddenBridges.filter(b => state.revealedBridges.has(b.id)).forEach(b => drawTile({...b, kind:'leafbridge'}));
      drawChimePads();
      drawSpikes();
      drawCoins();
      drawRelics();
      drawPowerups();
      drawEmberPools();
      drawProjectiles();
      drawPickupBursts();
      enemies.forEach(drawEnemy);
      drawGoal();
      drawFrog();
      drawForegroundFoliage();
      drawDebugOverlay();
      ctx.restore();
    }

    function renderGameToText() {
      return JSON.stringify({
        coordinateSystem: 'origin: top-left, +x: right, +y: down',
        gameStarted,
        level: state.levelIndex + 1,
        zone: zoneForX(player.x),
        camera: {
          scale: Number(CAMERA_SCALE.toFixed(3)),
          visibleWidth: Math.round(view.w),
          visibleHeight: Math.round(view.h),
        },
        player: {
          x: Math.round(player.x),
          y: Math.round(player.y),
          vx: Math.round(player.vx),
          vy: Math.round(player.vy),
          onGround: player.onGround,
          onWall: player.onWall,
          state: player.stateName,
          facing: player.facing,
        },
        controls: { ...controls },
        progress: {
          coins: `${state.coins}/${state.maxCoins}`,
          relics: `${state.relics}/${state.maxRelics}`,
          lives: state.lives,
          reserveHearts: player.reserveHearts,
          flutterReady: player.flutterReady,
          attack: state.activeAttackType,
          unlockedPowers: Object.entries(permanentPowerups).filter(([, unlocked]) => unlocked).map(([name]) => name),
          visiblePowerups: powerups.filter(powerup => !powerup.collected && !permanentPowerups[powerup.type]).map(powerup => ({
            type: powerup.type,
            x: Math.round(powerup.x),
            y: Math.round(powerup.y)
          })),
          temporaryPlatforms: temporaryPlatforms.map(platform => ({
            x: Math.round(platform.x),
            y: Math.round(platform.y),
            life: Number(platform.life.toFixed(2))
          })),
          emberPools: emberPools.map(pool => ({
            x: Math.round(pool.x),
            y: Math.round(pool.y),
            radius: Math.round(pool.radius),
            life: Number(pool.life.toFixed(2))
          })),
          spikesRemaining: spikes.filter(spike => !spike.broken).length,
          checkpoint: { x: Math.round(state.checkpointX), y: Math.round(state.checkpointY) },
        },
      });
    }
    window.advanceTime = (ms = 1000 / 60) => {
      const frameMs = 1000 / 60;
      const steps = Math.max(1, Math.round(ms / frameMs));
      for (let i = 0; i < steps; i += 1) {
        update(1 / 60);
        render();
      }
      lastTime = performance.now();
      return Promise.resolve();
    };
    window.render_game_to_text = renderGameToText;

    function beginGame() {
      if (gameStarted) return;
      gameStarted = true;
      startOverlay.style.display = 'none';
      if (wrap && typeof wrap.focus === 'function') wrap.focus();
      initAudio();
      showBanner('Run, chirp, and climb through denser rainforest routes across Levels 1–3.');
    }

    const urlParams = new URLSearchParams(window.location.search);
    const requestedLevel = Number.parseInt(urlParams.get('level') || '', 10);
    const requestedStartX = Number.parseInt(urlParams.get('x') || '', 10);
    const requestedStartY = Number.parseInt(urlParams.get('y') || '', 10);
    const requestedAttack = urlParams.get('attack');
    const grantAllPowers = urlParams.get('powers') === 'all';
    if (Number.isInteger(requestedLevel) && requestedLevel >= 1 && requestedLevel <= LEVELS.length) {
      saveData.currentLevel = requestedLevel;
      state.currentLevelUnlocked = Math.max(state.currentLevelUnlocked, requestedLevel);
    }

    loadLevel(saveData.currentLevel - 1, false);
    if (grantAllPowers) {
      Object.keys(permanentPowerups).forEach((key) => { permanentPowerups[key] = true; });
      player.reserveHearts = Math.max(player.reserveHearts, 1);
      player.flutterReady = true;
      syncAttackSelection(typeof requestedAttack === 'string' ? requestedAttack : 'stoneBall');
    } else if (typeof requestedAttack === 'string' && hasAttack(requestedAttack)) {
      state.activeAttackType = requestedAttack;
    }
    if (Number.isInteger(requestedStartX)) {
      player.x = clamp(requestedStartX, 0, WORLD.width - player.w);
      state.checkpointX = player.x;
    }
    if (Number.isInteger(requestedStartY)) {
      player.y = clamp(requestedStartY, -80, WORLD.height - player.h);
      state.checkpointY = player.y;
    }
    if (Number.isInteger(requestedStartX) || Number.isInteger(requestedStartY)) {
      player.vx = 0;
      player.vy = 0;
      view.x = clamp(player.x - view.w * 0.3, 0, Math.max(0, WORLD.width - view.w));
      view.y = clamp(player.y - view.h * 0.5, 0, Math.max(0, WORLD.height - view.h));
    }
    function loop(ts) {
      if (!lastTime) lastTime = ts;
      const dt = Math.min(0.033, (ts - lastTime) / 1000);
      lastTime = ts;
      update(dt); render(); requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
    startBtn.addEventListener('click', beginGame);
    if (urlParams.get('autostart') === '1') beginGame();
