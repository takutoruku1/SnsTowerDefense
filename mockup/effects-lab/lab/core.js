/* ============================================================
   SNS TD — Effects Lab / Core engine
   - requestAnimationFrame loop
   - Effect base class (Phaser-friendly shape)
   - Helpers: easing, rand, shake, Audio synth
   - Mock "scene" with width/height/shake/sfx
   ============================================================ */

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  // ───────── Easing ─────────
  const Ease = {
    linear: t => t,
    easeOutQuad: t => 1 - (1 - t) * (1 - t),
    easeInQuad:  t => t * t,
    easeInOutQuad: t => t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t+2,2)/2,
    easeOutCubic: t => 1 - Math.pow(1 - t, 3),
    easeOutQuint: t => 1 - Math.pow(1 - t, 5),
    easeOutBack: (t, s = 1.70158) => {
      const c1 = s, c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    },
    easeOutElastic: t => {
      const c4 = (2 * Math.PI) / 3;
      return t === 0 ? 0 : t === 1 ? 1
        : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    },
  };

  // ───────── Rand ─────────
  const rand = (a, b) => a + Math.random() * (b - a);
  const irand = (a, b) => Math.floor(rand(a, b + 1));
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const TAU = Math.PI * 2;

  // ───────── Screen shake ─────────
  let shake = { amp: 0, decay: 0, t: 0, x: 0, y: 0 };
  function startShake(amp = 8, dur = 350) {
    shake.amp = Math.max(shake.amp, amp);
    shake.decay = 1 / Math.max(60, dur);
    shake.t = 1;
  }
  function tickShake(dt) {
    if (shake.t <= 0) { shake.x = shake.y = 0; return; }
    shake.t -= shake.decay * dt;
    if (shake.t < 0) shake.t = 0;
    const a = shake.amp * shake.t;
    shake.x = (Math.random() * 2 - 1) * a;
    shake.y = (Math.random() * 2 - 1) * a;
  }

  // ───────── Flash overlay (full canvas color flash) ─────────
  let flash = { color: '#fff', alpha: 0, decay: 0 };
  function startFlash(color = '#ff3399', alpha = 0.5, dur = 220) {
    flash.color = color;
    flash.alpha = Math.max(flash.alpha, alpha);
    flash.decay = alpha / Math.max(40, dur);
  }
  function drawFlash(dt) {
    if (flash.alpha <= 0) return;
    flash.alpha -= flash.decay * dt;
    if (flash.alpha < 0) flash.alpha = 0;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = flash.color;
    ctx.globalAlpha = flash.alpha;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  // ───────── Audio (Web Audio synth) ─────────
  let audioCtx = null;
  let soundOn = true;
  function ac() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }
  function setSoundOn(v) { soundOn = !!v; }
  function isSoundOn() { return soundOn; }

  // Simple SFX library — short, recognizable
  const SFX = {
    // ぽこっ (notification-like)
    pop(volume = 0.4, pitch = 1) {
      if (!soundOn) return;
      const a = ac();
      const o = a.createOscillator();
      const g = a.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(740 * pitch, a.currentTime);
      o.frequency.exponentialRampToValueAtTime(1480 * pitch, a.currentTime + 0.04);
      g.gain.setValueAtTime(volume, a.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + 0.18);
      o.connect(g).connect(a.destination);
      o.start();
      o.stop(a.currentTime + 0.2);
    },
    // ♡ (like)
    heart(volume = 0.35, pitch = 1) {
      if (!soundOn) return;
      const a = ac();
      const o = a.createOscillator();
      const g = a.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(880 * pitch, a.currentTime);
      o.frequency.exponentialRampToValueAtTime(1760 * pitch, a.currentTime + 0.08);
      g.gain.setValueAtTime(volume, a.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + 0.22);
      o.connect(g).connect(a.destination);
      o.start();
      o.stop(a.currentTime + 0.24);
    },
    // ジャラっ (cash/burst)
    burst(volume = 0.5) {
      if (!soundOn) return;
      const a = ac();
      const o = a.createOscillator();
      const o2 = a.createOscillator();
      const g = a.createGain();
      o.type = 'sawtooth';
      o2.type = 'square';
      o.frequency.setValueAtTime(180, a.currentTime);
      o.frequency.exponentialRampToValueAtTime(820, a.currentTime + 0.12);
      o2.frequency.setValueAtTime(260, a.currentTime);
      o2.frequency.exponentialRampToValueAtTime(1240, a.currentTime + 0.12);
      g.gain.setValueAtTime(volume, a.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + 0.3);
      o.connect(g);
      o2.connect(g);
      g.connect(a.destination);
      o.start(); o2.start();
      o.stop(a.currentTime + 0.32); o2.stop(a.currentTime + 0.32);
    },
    // ブブッ (alert)
    alert(volume = 0.45) {
      if (!soundOn) return;
      const a = ac();
      const o = a.createOscillator();
      const g = a.createGain();
      o.type = 'square';
      o.frequency.setValueAtTime(220, a.currentTime);
      o.frequency.setValueAtTime(180, a.currentTime + 0.08);
      o.frequency.setValueAtTime(220, a.currentTime + 0.16);
      g.gain.setValueAtTime(volume, a.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + 0.32);
      o.connect(g).connect(a.destination);
      o.start();
      o.stop(a.currentTime + 0.34);
    },
    // ぼぉっ (flame whoosh)
    flame(volume = 0.5) {
      if (!soundOn) return;
      const a = ac();
      // noise burst
      const bufSize = a.sampleRate * 0.7;
      const buf = a.createBuffer(1, bufSize, a.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
      const src = a.createBufferSource();
      src.buffer = buf;
      const filt = a.createBiquadFilter();
      filt.type = 'lowpass';
      filt.frequency.setValueAtTime(900, a.currentTime);
      filt.frequency.exponentialRampToValueAtTime(200, a.currentTime + 0.7);
      const g = a.createGain();
      g.gain.setValueAtTime(volume, a.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + 0.7);
      src.connect(filt).connect(g).connect(a.destination);
      src.start();
      src.stop(a.currentTime + 0.72);
    },
    // 通知音 (X風 ピロン)
    notify(volume = 0.35) {
      if (!soundOn) return;
      const a = ac();
      const o = a.createOscillator();
      const o2 = a.createOscillator();
      const g = a.createGain();
      o.type = 'sine';
      o2.type = 'sine';
      o.frequency.setValueAtTime(1320, a.currentTime);
      o2.frequency.setValueAtTime(1760, a.currentTime + 0.06);
      g.gain.setValueAtTime(volume, a.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + 0.28);
      o.connect(g);
      o2.connect(g);
      g.connect(a.destination);
      o.start(); o2.start(a.currentTime + 0.06);
      o.stop(a.currentTime + 0.16); o2.stop(a.currentTime + 0.30);
    },
    // 警告 (ピーポー風)
    siren(volume = 0.42) {
      if (!soundOn) return;
      const a = ac();
      const o = a.createOscillator();
      const g = a.createGain();
      o.type = 'sawtooth';
      const t0 = a.currentTime;
      o.frequency.setValueAtTime(440, t0);
      o.frequency.linearRampToValueAtTime(880, t0 + 0.18);
      o.frequency.linearRampToValueAtTime(440, t0 + 0.36);
      o.frequency.linearRampToValueAtTime(880, t0 + 0.54);
      g.gain.setValueAtTime(volume, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.62);
      o.connect(g).connect(a.destination);
      o.start();
      o.stop(t0 + 0.64);
    },
  };

  // ───────── Scene background ─────────
  let bgMode = 'game';  // 'game' | 'plain'
  function setBgMode(m) { bgMode = m; }

  // Heroine sprite
  const hero = new Image();
  let heroReady = false;
  hero.onload = () => { heroReady = true; };
  hero.src = '../../assets/influencer/happy.png';

  const HERO = { x: 320, y: 420 };  // bottom of the character
  function drawHero() {
    if (!heroReady) {
      // Placeholder while loading
      ctx.fillStyle = '#ff77cc';
      ctx.beginPath();
      ctx.ellipse(HERO.x, HERO.y - 60, 50, 120, 0, 0, TAU);
      ctx.fill();
      return;
    }
    // draw at ~280px height, scaled to fit
    const targetH = 320;
    const scale = targetH / hero.height;
    const w = hero.width * scale;
    const h = hero.height * scale;
    ctx.save();
    ctx.shadowColor = 'rgba(255, 51, 153, 0.35)';
    ctx.shadowBlur = 30;
    ctx.drawImage(hero, HERO.x - w / 2, HERO.y - h, w, h);
    ctx.restore();
  }

  function drawBg() {
    // Base
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    if (bgMode === 'plain') {
      grad.addColorStop(0, '#0a0a14');
      grad.addColorStop(1, '#05030a');
    } else {
      grad.addColorStop(0, '#1a0a2e');
      grad.addColorStop(1, '#0a0518');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    if (bgMode === 'plain') return;

    // Grid floor (perspective-ish)
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 119, 204, 0.12)';
    ctx.lineWidth = 1;
    const cols = 6, rows = 4;
    const fieldX = 80, fieldY = 280;
    const fieldW = 740, fieldH = 280;
    for (let c = 0; c <= cols; c++) {
      const x = fieldX + (fieldW / cols) * c;
      ctx.beginPath();
      ctx.moveTo(x, fieldY);
      ctx.lineTo(x, fieldY + fieldH);
      ctx.stroke();
    }
    for (let r = 0; r <= rows; r++) {
      const y = fieldY + (fieldH / rows) * r;
      ctx.beginPath();
      ctx.moveTo(fieldX, y);
      ctx.lineTo(fieldX + fieldW, y);
      ctx.stroke();
    }
    // pink glow line at character row
    ctx.strokeStyle = 'rgba(255, 51, 153, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(fieldX, HERO.y);
    ctx.lineTo(fieldX + fieldW, HERO.y);
    ctx.stroke();
    ctx.restore();

    // Top vignette
    const top = ctx.createLinearGradient(0, 0, 0, 220);
    top.addColorStop(0, 'rgba(255, 51, 153, 0.10)');
    top.addColorStop(1, 'rgba(255, 51, 153, 0)');
    ctx.fillStyle = top;
    ctx.fillRect(0, 0, W, 220);
  }

  // ───────── Effect manager ─────────
  // Each effect is { update(dt): boolean (alive), draw(ctx) }
  const effects = [];
  function add(eff) { effects.push(eff); return eff; }
  function clearAll() {
    effects.length = 0;
    shake = { amp: 0, decay: 0, t: 0, x: 0, y: 0 };
    flash = { color: '#fff', alpha: 0, decay: 0 };
  }

  // ───────── Main loop ─────────
  let lastT = performance.now();
  let frame = 0, fpsT = lastT, fps = 0;
  const fpsEl = document.getElementById('fps');

  function loop(now) {
    const dt = Math.min(50, now - lastT);  // cap to 50ms
    lastT = now;

    // fps counter
    frame++;
    if (now - fpsT > 500) {
      fps = Math.round((frame * 1000) / (now - fpsT));
      if (fpsEl) fpsEl.textContent = `${fps} fps · ${effects.length} fx`;
      frame = 0; fpsT = now;
    }

    tickShake(dt);
    ctx.save();
    ctx.translate(shake.x, shake.y);

    drawBg();
    drawHero();

    // Update + draw effects
    for (let i = effects.length - 1; i >= 0; i--) {
      const alive = effects[i].update(dt);
      if (!alive) effects.splice(i, 1);
    }
    // Draw with depth — sort by .depth (lower first)
    effects.sort((a, b) => (a.depth || 0) - (b.depth || 0));
    for (const eff of effects) eff.draw(ctx);

    drawFlash(dt);
    ctx.restore();

    requestAnimationFrame(loop);
  }
  requestAnimationFrame((t) => { lastT = t; loop(t); });

  // ───────── Expose ─────────
  window.Lab = {
    ctx, W, H,
    hero: HERO,
    add, clearAll, effects,
    Ease, rand, irand, pick, TAU,
    startShake, startFlash,
    SFX, setSoundOn, isSoundOn,
    setBgMode,
  };
})();
