/* ============================================================
   炎上エフェクト 3案
   A: VignetteFlames — 画面端で炎が揺らめく（雰囲気重視・継続）
   B: BodyFire — キャラ本体に炎パーティクル（中程度の継続）
   C: FullScreenAlert — 警告バナー+赤フラッシュ+「炎上中！」テロップ（一発派手）
   ============================================================ */
(() => {
  const L = window.Lab;
  const { ctx, W, H, Ease, rand, irand, pick, SFX, hero } = L;
  const TAU = L.TAU;

  // ───────────────── A: VignetteFlames ─────────────────
  // 画面の上下端から内側に向けてゆらゆら炎ライン
  class VignetteFlames {
    constructor(opts = {}) {
      this.depth = 110;
      this.age = 0;
      this.life = opts.life ?? 4000;
      this.intensity = opts.intensity ?? 1;
      this.cells = [];   // bottom-edge column flames
      this.embers = [];  // floating sparks
      // bottom column flames
      const cols = 24;
      for (let i = 0; i < cols; i++) {
        this.cells.push({
          x: (W / cols) * (i + 0.5),
          base: H,
          h: rand(80, 160),
          phase: rand(0, TAU),
          freq: rand(0.004, 0.008),
        });
      }
      // top edge subtle
      for (let i = 0; i < 16; i++) {
        this.cells.push({
          x: (W / 16) * (i + 0.5),
          base: 0,
          h: rand(40, 90),
          phase: rand(0, TAU),
          freq: rand(0.005, 0.009),
          top: true,
        });
      }
      SFX.flame(0.42);
    }
    update(dt) {
      this.age += dt;
      // spawn embers occasionally
      if (Math.random() < 0.5) {
        this.embers.push({
          x: rand(0, W),
          y: H - rand(0, 20),
          vx: rand(-30, 30),
          vy: rand(-100, -200),
          life: rand(900, 1400),
          age: 0,
          r: rand(1.5, 3.5),
          c: pick(['#ffb83d', '#ff5252', '#ffd97d', '#ff8a3d']),
        });
      }
      for (const e of this.embers) {
        e.age += dt;
        e.x += e.vx * (dt / 1000);
        e.y += e.vy * (dt / 1000);
        e.vy += 30 * (dt / 1000);
      }
      this.embers = this.embers.filter(e => e.age < e.life);
      return this.age < this.life;
    }
    draw(ctx) {
      // global fade in/out
      const inE = Math.min(1, this.age / 400);
      const outE = this.age > this.life - 600 ? 1 - (this.age - (this.life - 600)) / 600 : 1;
      const alpha = Math.max(0, inE * outE) * this.intensity;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.globalCompositeOperation = 'screen';

      // Vignette dark
      ctx.globalCompositeOperation = 'source-over';
      const vg = ctx.createRadialGradient(W/2, H/2, 200, W/2, H/2, 540);
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(1, 'rgba(120,10,30,0.45)');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, W, H);

      // Bottom flame columns
      ctx.globalCompositeOperation = 'screen';
      for (const c of this.cells) {
        const h = c.h * (0.7 + 0.3 * Math.sin(this.age * c.freq + c.phase));
        if (c.top) {
          drawFlameColumn(ctx, c.x, 0, h, true);
        } else {
          drawFlameColumn(ctx, c.x, H, h, false);
        }
      }

      // Embers
      ctx.globalCompositeOperation = 'screen';
      for (const e of this.embers) {
        const t = e.age / e.life;
        const a = (1 - t) * 0.9;
        ctx.globalAlpha = alpha * a;
        ctx.fillStyle = e.c;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.r, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  function drawFlameColumn(ctx, x, y, h, fromTop) {
    const dir = fromTop ? 1 : -1;
    const w = 56;
    const g = ctx.createLinearGradient(x, y, x, y + h * dir);
    g.addColorStop(0, 'rgba(255, 184, 61, 0.7)');
    g.addColorStop(0.3, 'rgba(255, 82, 82, 0.55)');
    g.addColorStop(0.7, 'rgba(255, 51, 153, 0.3)');
    g.addColorStop(1, 'rgba(255, 51, 153, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x - w/2, y);
    ctx.quadraticCurveTo(x - w/3, y + h * dir * 0.4, x, y + h * dir);
    ctx.quadraticCurveTo(x + w/3, y + h * dir * 0.4, x + w/2, y);
    ctx.closePath();
    ctx.fill();
  }

  // ───────────────── B: BodyFire (キャラ本体炎) ─────────────────
  class BodyFire {
    constructor(opts = {}) {
      this.depth = 120;  // above hero
      this.age = 0;
      this.life = opts.life ?? 3500;
      this.particles = [];
      this.timer = 0;
      this.spawnRate = 20;
      this.x = opts.x ?? hero.x;
      this.y = opts.y ?? hero.y - 90;
      SFX.flame(0.45);
      L.startShake(3, 200);
    }
    update(dt) {
      this.age += dt;
      this.timer += dt;
      const intensity = this.age < this.life - 600 ? 1 : Math.max(0, (this.life - this.age) / 600);
      while (this.timer >= this.spawnRate) {
        this.timer -= this.spawnRate;
        if (Math.random() > intensity) continue;
        // flame body
        for (let i = 0; i < 2; i++) {
          this.particles.push({
            kind: 'flame',
            x: this.x + rand(-40, 40),
            y: this.y + rand(-10, 30),
            vx: rand(-15, 15),
            vy: rand(-90, -180),
            r: rand(14, 28),
            age: 0,
            life: rand(600, 1000),
          });
        }
        // smoke
        if (Math.random() < 0.4) {
          this.particles.push({
            kind: 'smoke',
            x: this.x + rand(-25, 25),
            y: this.y - 60 + rand(-10, 10),
            vx: rand(-10, 10),
            vy: rand(-30, -60),
            r: rand(20, 36),
            age: 0,
            life: rand(1400, 2000),
          });
        }
        // sparks
        if (Math.random() < 0.5) {
          this.particles.push({
            kind: 'spark',
            x: this.x + rand(-30, 30),
            y: this.y + rand(-10, 20),
            vx: rand(-80, 80),
            vy: rand(-200, -380),
            r: rand(1.5, 3),
            age: 0,
            life: rand(700, 1200),
            c: pick(['#ffd97d', '#ffb83d', '#ff5252']),
          });
        }
      }
      // Update
      for (const p of this.particles) {
        p.age += dt;
        p.x += p.vx * (dt / 1000);
        p.y += p.vy * (dt / 1000);
        if (p.kind === 'flame') p.vy *= 0.97;
        if (p.kind === 'smoke') { p.vy *= 0.99; p.r += dt * 0.02; }
        if (p.kind === 'spark') p.vy += 220 * (dt / 1000);
      }
      this.particles = this.particles.filter(p => p.age < p.life);
      return this.age < this.life;
    }
    draw(ctx) {
      ctx.save();
      // smoke first (under)
      ctx.globalCompositeOperation = 'source-over';
      for (const p of this.particles) {
        if (p.kind !== 'smoke') continue;
        const t = p.age / p.life;
        const a = (1 - t) * 0.35;
        ctx.globalAlpha = a;
        ctx.fillStyle = '#221122';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, TAU);
        ctx.fill();
      }
      // flames + sparks with screen blending
      ctx.globalCompositeOperation = 'screen';
      for (const p of this.particles) {
        if (p.kind === 'flame') {
          const t = p.age / p.life;
          const a = (1 - t);
          ctx.globalAlpha = a * 0.9;
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
          grad.addColorStop(0, 'rgba(255, 230, 120, 0.95)');
          grad.addColorStop(0.4, 'rgba(255, 82, 82, 0.75)');
          grad.addColorStop(1, 'rgba(255, 51, 153, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * (1 - t * 0.3), 0, TAU);
          ctx.fill();
        } else if (p.kind === 'spark') {
          const t = p.age / p.life;
          const a = 1 - t;
          ctx.globalAlpha = a;
          ctx.fillStyle = p.c;
          ctx.shadowColor = p.c;
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, TAU);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
      ctx.restore();
    }
  }

  // ───────────────── C: FullScreenAlert ─────────────────
  class FullScreenAlert {
    constructor(opts = {}) {
      this.depth = 200;
      this.age = 0;
      this.life = 2800;
      this.bannerY = -80;
      this.targetBannerY = 30;
      this.titleScale = 0;
      L.startShake(14, 700);
      L.startFlash('#ff1f4d', 0.55, 320);
      SFX.siren(0.5);
      setTimeout(() => SFX.alert(0.4), 300);
    }
    update(dt) {
      this.age += dt;
      // banner ease in
      const t1 = Math.min(1, this.age / 320);
      this.bannerY = -80 + Ease.easeOutBack(t1) * (this.targetBannerY + 80);
      // title pop
      const t2 = Math.min(1, Math.max(0, (this.age - 200)) / 360);
      this.titleScale = Ease.easeOutBack(t2);
      // periodic flash
      if (this.age > 600 && this.age < 1600 && Math.random() < 0.06) {
        L.startFlash('#ff1f4d', 0.25, 120);
      }
      return this.age < this.life;
    }
    draw(ctx) {
      // Diagonal warning stripes border
      const stripeT = this.age / 80;
      ctx.save();
      ctx.globalAlpha = 0.55;
      const sH = 22;
      // top stripe band
      ctx.beginPath();
      ctx.rect(0, 0, W, sH);
      ctx.clip();
      drawStripes(ctx, 0, 0, W, sH, stripeT);
      ctx.restore();
      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.beginPath();
      ctx.rect(0, H - sH, W, sH);
      ctx.clip();
      drawStripes(ctx, 0, H - sH, W, sH, -stripeT);
      ctx.restore();

      // Top X-style warning banner
      const bw = 520, bh = 60;
      const bx = (W - bw) / 2;
      const by = this.bannerY;
      ctx.save();
      ctx.shadowColor = '#ff1f4d';
      ctx.shadowBlur = 24;
      const g = ctx.createLinearGradient(bx, by, bx, by + bh);
      g.addColorStop(0, '#2a0a14');
      g.addColorStop(1, '#1a0510');
      ctx.fillStyle = g;
      window.LabBubbles_roundRect(ctx, bx, by, bw, bh, 12);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#ff1f4d';
      ctx.lineWidth = 2;
      window.LabBubbles_roundRect(ctx, bx, by, bw, bh, 12);
      ctx.stroke();
      // warning icon
      drawWarningIcon(ctx, bx + 30, by + bh/2, 18);
      // banner text
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 13px "Noto Sans JP", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('このアカウントは現在 注目を集めています', bx + 60, by + 12);
      ctx.fillStyle = '#ff77cc';
      ctx.font = '11px "Noto Sans JP", sans-serif';
      ctx.fillText('@influencer_pink · 急上昇トレンド入り', bx + 60, by + 32);
      // close X
      ctx.fillStyle = '#777';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('×', bx + bw - 20, by + 16);
      ctx.restore();

      // 「炎上中！」テロップ (center)
      if (this.titleScale > 0) {
        ctx.save();
        ctx.translate(W / 2, H / 2);
        ctx.scale(this.titleScale, this.titleScale);
        // bg slab
        const tw = 460, th = 130;
        ctx.shadowColor = '#ff1f4d';
        ctx.shadowBlur = 40;
        ctx.rotate(-0.04);
        ctx.fillStyle = '#1a0510';
        ctx.fillRect(-tw/2, -th/2, tw, th);
        ctx.strokeStyle = '#ff1f4d';
        ctx.lineWidth = 3;
        ctx.strokeRect(-tw/2, -th/2, tw, th);
        ctx.shadowBlur = 0;
        // hot stripes inside
        ctx.save();
        ctx.beginPath();
        ctx.rect(-tw/2, -th/2, tw, th);
        ctx.clip();
        ctx.globalAlpha = 0.18;
        drawStripes(ctx, -tw/2, -th/2, tw, th, this.age / 50);
        ctx.restore();
        // text
        ctx.fillStyle = '#fff';
        ctx.font = '900 64px "Dela Gothic One", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#ff5252';
        ctx.shadowBlur = 24;
        ctx.fillText('炎 上 中', 0, -8);
        ctx.shadowBlur = 0;
        // subtitle
        ctx.fillStyle = '#ffb83d';
        ctx.font = 'bold 14px "Noto Sans JP", sans-serif';
        ctx.fillText('TRENDING #1 ON 𝕏', 0, 42);
        ctx.restore();
      }
    }
  }

  function drawStripes(ctx, x, y, w, h, offset) {
    const sp = 24;
    ctx.save();
    ctx.translate(x, y);
    for (let i = -h; i < w + h; i += sp) {
      const ox = (i + offset * 12) % (sp * 2);
      ctx.fillStyle = ox < sp ? '#ff1f4d' : '#100410';
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + sp, 0);
      ctx.lineTo(i + sp - h, h);
      ctx.lineTo(i - h, h);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function drawWarningIcon(ctx, x, y, r) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#ffb83d';
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.lineTo(r, r);
    ctx.lineTo(-r, r);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#1a0510';
    ctx.font = 'bold 16px "Dela Gothic One", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('!', 0, 4);
    ctx.restore();
  }

  window.LabFlame = { VignetteFlames, BodyFire, FullScreenAlert };
})();
