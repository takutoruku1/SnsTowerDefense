/* ============================================================
   いいね♡演出エフェクト 3案
   A: HeartPop — カウンター + ハート粒子（標準）
   B: BuzzRain — ♡が画面を埋め尽くす（バズ）
   C: AngryReact — 炎上♡(怒り反応)+通報テキスト
   ============================================================ */
(() => {
  const L = window.Lab;
  const { ctx, W, H, Ease, rand, irand, pick, SFX, hero } = L;
  const TAU = L.TAU;

  // Heart shape path (centered at 0,0, "radius" r)
  function heartPath(ctx, r) {
    ctx.beginPath();
    const s = r / 16;
    ctx.moveTo(0, 6*s);
    ctx.bezierCurveTo(0, 4*s, -2*s, -8*s, -10*s, -8*s);
    ctx.bezierCurveTo(-18*s, -8*s, -18*s, 2*s, -18*s, 2*s);
    ctx.bezierCurveTo(-18*s, 8*s, -10*s, 14*s, 0, 18*s);
    ctx.bezierCurveTo(10*s, 14*s, 18*s, 8*s, 18*s, 2*s);
    ctx.bezierCurveTo(18*s, 2*s, 18*s, -8*s, 10*s, -8*s);
    ctx.bezierCurveTo(2*s, -8*s, 0, 4*s, 0, 6*s);
    ctx.closePath();
  }

  function drawHeart(ctx, x, y, r, color, glow = true) {
    ctx.save();
    ctx.translate(x, y);
    if (glow) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 14;
    }
    ctx.fillStyle = color;
    heartPath(ctx, r);
    ctx.fill();
    ctx.restore();
  }

  // ───────────────── A: HeartPop ─────────────────
  // 右上にカウンター（♡ 12,847 → +247）が現れて、ハートが弾ける
  class HeartPop {
    constructor(opts = {}) {
      this.depth = 80;
      this.startCount = opts.start ?? irand(8000, 15000);
      this.add = opts.add ?? irand(180, 320);
      this.cur = this.startCount;
      this.target = this.startCount + this.add;
      this.age = 0;
      this.life = 2200;
      this.particles = [];
      const baseX = opts.x ?? hero.x;
      const baseY = opts.y ?? hero.y - 240;
      // burst hearts at character
      for (let i = 0; i < 14; i++) {
        const a = rand(-Math.PI * 0.8, -Math.PI * 0.2);  // upward fan
        const v = rand(140, 280);
        this.particles.push({
          x: baseX + rand(-20, 20),
          y: baseY + rand(-10, 10),
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v,
          r: rand(10, 18),
          age: 0,
          life: rand(900, 1300),
          rot: rand(-0.3, 0.3),
          spin: rand(-2, 2),
        });
      }
      SFX.heart(0.38, 1.05);
      setTimeout(() => SFX.pop(0.28, 1.2), 90);
    }
    update(dt) {
      this.age += dt;
      const t = Math.min(1, this.age / 800);
      this.cur = this.startCount + Math.floor(Ease.easeOutCubic(t) * this.add);
      for (const p of this.particles) {
        p.age += dt;
        p.x += p.vx * (dt / 1000);
        p.y += p.vy * (dt / 1000);
        p.vy += 220 * (dt / 1000);  // gravity
        p.vx *= 0.99;
        p.rot += p.spin * (dt / 1000);
      }
      return this.age < this.life;
    }
    draw(ctx) {
      // Particles
      for (const p of this.particles) {
        const t = p.age / p.life;
        if (t > 1) continue;
        const a = t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = a;
        drawHeart(ctx, 0, 0, p.r, '#ff3399');
        ctx.restore();
      }
      // Counter card at top-right
      const inT = Math.min(1, this.age / 250);
      const outT = this.age > this.life - 400 ? (this.age - (this.life - 400)) / 400 : 0;
      const alpha = Math.min(1, inT) * (1 - Math.min(1, outT));
      const yOff = (1 - Ease.easeOutBack(inT)) * -40;
      drawCounterCard(ctx, W - 220, 60 + yOff, this.cur, '+' + this.add.toLocaleString(), alpha);
    }
  }

  function drawCounterCard(ctx, x, y, count, delta, alpha) {
    const w = 200, h = 64;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.shadowColor = 'rgba(255, 51, 153, 0.55)';
    ctx.shadowBlur = 22;
    // bg
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, '#1b1626');
    g.addColorStop(1, '#0f0a1c');
    ctx.fillStyle = g;
    window.LabBubbles_roundRect(ctx, x, y, w, h, 12);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#ff77cc';
    ctx.lineWidth = 1.5;
    window.LabBubbles_roundRect(ctx, x, y, w, h, 12);
    ctx.stroke();

    // heart icon
    drawHeart(ctx, x + 22, y + h/2, 12, '#ff3399', false);

    // count
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(count.toLocaleString(), x + 44, y + h/2);
    // delta
    ctx.fillStyle = '#ff5fa8';
    ctx.font = 'bold 12px "JetBrains Mono", monospace';
    ctx.fillText(delta, x + w - 12 - ctx.measureText(delta).width, y + 18);
    // label
    ctx.fillStyle = '#c3b6d4';
    ctx.font = '10px "Noto Sans JP", sans-serif';
    ctx.fillText('いいね', x + w - 12 - ctx.measureText('いいね').width, y + h - 14);
    ctx.restore();
  }

  // ───────────────── B: BuzzRain (♡ 大量降臨) ─────────────────
  class BuzzRain {
    constructor(opts = {}) {
      this.depth = 80;
      this.startCount = opts.start ?? irand(50000, 120000);
      this.cur = this.startCount;
      this.target = this.startCount + (opts.add ?? irand(8000, 18000));
      this.age = 0;
      this.life = 3600;
      this.particles = [];
      this.timer = 0;
      this.spawnRate = 22;  // ms between spawns
      SFX.burst(0.45);
      L.startShake(4, 300);
    }
    update(dt) {
      this.age += dt;
      this.timer += dt;
      // Spawn hearts rising from below
      while (this.timer >= this.spawnRate && this.age < this.life - 500) {
        this.timer -= this.spawnRate;
        for (let i = 0; i < 3; i++) {
          this.particles.push({
            x: rand(20, W - 20),
            y: H + rand(0, 40),
            vx: rand(-20, 20),
            vy: rand(-120, -220),
            r: rand(8, 22),
            age: 0,
            life: rand(2200, 3200),
            rot: rand(-0.3, 0.3),
            spin: rand(-1.2, 1.2),
            color: pick(['#ff3399', '#ff77cc', '#ff5252', '#ffffff', '#ffb83d']),
            phase: rand(0, TAU),
          });
        }
        if (Math.random() < 0.15) SFX.heart(0.18, rand(0.9, 1.6));
      }
      // Count up smoothly
      const t = Math.min(1, this.age / 2400);
      const diff = this.target - this.startCount;
      this.cur = this.startCount + Math.floor(Ease.easeOutQuint(t) * diff);
      // Update particles
      for (const p of this.particles) {
        p.age += dt;
        p.x += (p.vx + Math.sin(p.age / 200 + p.phase) * 40) * (dt / 1000);
        p.y += p.vy * (dt / 1000);
        p.rot += p.spin * (dt / 1000);
      }
      // cleanup off-screen
      this.particles = this.particles.filter(p => p.age < p.life && p.y > -60);
      return this.age < this.life;
    }
    draw(ctx) {
      for (const p of this.particles) {
        const t = p.age / p.life;
        const a = t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = a;
        drawHeart(ctx, 0, 0, p.r, p.color);
        ctx.restore();
      }
      // Big buzz counter — center top
      const inT = Math.min(1, this.age / 320);
      const outT = this.age > this.life - 500 ? (this.age - (this.life - 500)) / 500 : 0;
      const alpha = inT * (1 - Math.min(1, outT));
      const scale = 0.6 + Ease.easeOutBack(inT) * 0.4;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(W / 2, 90);
      ctx.scale(scale, scale);
      // BUZZ! tag
      ctx.font = 'bold 14px "Dela Gothic One", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffb83d';
      ctx.shadowColor = '#ffb83d';
      ctx.shadowBlur = 18;
      ctx.fillText('🔥 BUZZ TREND 🔥', 0, -36);
      ctx.shadowBlur = 0;
      // Count
      ctx.fillStyle = '#fff';
      ctx.shadowColor = '#ff3399';
      ctx.shadowBlur = 24;
      ctx.font = 'bold 56px "JetBrains Mono", monospace';
      const txt = '♡ ' + this.cur.toLocaleString();
      ctx.fillText(txt, 0, 18);
      ctx.restore();
    }
  }

  // ───────────────── C: AngryReact (炎上♡ + 通報テキスト) ─────────────────
  class AngryReact {
    constructor(opts = {}) {
      this.depth = 80;
      this.age = 0;
      this.life = 2800;
      this.particles = [];
      this.tags = [];   // floating text tags
      this.timer = 0;
      const baseX = opts.x ?? hero.x;
      const baseY = opts.y ?? hero.y - 240;
      // initial burst of mixed reactions
      const reactions = [
        { emoji: '💢', color: '#ffb83d', size: 28 },
        { emoji: '😡', color: '#ff5252', size: 30 },
        { emoji: '🥺', color: '#1d9bf0', size: 26 },
        { emoji: '❤️', color: '#ff3399', size: 26 },
      ];
      for (let i = 0; i < 18; i++) {
        const a = rand(-Math.PI, 0);
        const v = rand(120, 260);
        const react = pick(reactions);
        this.particles.push({
          x: baseX + rand(-30, 30),
          y: baseY + rand(-10, 10),
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v,
          age: 0,
          life: rand(1100, 1700),
          rot: rand(-0.2, 0.2),
          spin: rand(-1.5, 1.5),
          ...react,
        });
      }
      // floating action tags (rise up)
      const tagsText = [
        { text: '通報されました', color: '#ff1f4d' },
        { text: '引用RT +124', color: '#ffb83d' },
        { text: 'スクショ拡散', color: '#fff' },
        { text: '燃料投下', color: '#ff5252' },
        { text: 'まとめサイト掲載', color: '#1d9bf0' },
      ];
      for (let i = 0; i < tagsText.length; i++) {
        this.tags.push({
          ...tagsText[i],
          x: baseX + rand(-110, 110),
          y: baseY + rand(-40, 40),
          delay: i * 200,
          age: 0,
          life: 1800,
        });
      }
      SFX.alert(0.4);
      setTimeout(() => SFX.notify(0.35), 200);
      setTimeout(() => SFX.notify(0.35), 460);
    }
    update(dt) {
      this.age += dt;
      for (const p of this.particles) {
        p.age += dt;
        p.x += p.vx * (dt / 1000);
        p.y += p.vy * (dt / 1000);
        p.vy += 380 * (dt / 1000);
        p.vx *= 0.985;
        p.rot += p.spin * (dt / 1000);
      }
      for (const t of this.tags) {
        if (this.age < t.delay) continue;
        t.age += dt;
      }
      return this.age < this.life;
    }
    draw(ctx) {
      for (const p of this.particles) {
        const t = p.age / p.life;
        if (t > 1) continue;
        const a = t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = a;
        ctx.font = `${p.size}px "Noto Color Emoji", "Apple Color Emoji", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 12;
        ctx.fillText(p.emoji, 0, 0);
        ctx.restore();
      }
      // Tags rise up
      for (const tag of this.tags) {
        if (this.age < tag.delay) continue;
        const t = tag.age / tag.life;
        if (t > 1) continue;
        const inT = Math.min(1, tag.age / 220);
        const yOff = -Ease.easeOutCubic(t) * 100;
        const a = t < 0.7 ? inT : 1 - (t - 0.7) / 0.3;
        const scale = Ease.easeOutBack(inT);
        ctx.save();
        ctx.translate(tag.x, tag.y + yOff);
        ctx.scale(scale, scale);
        ctx.globalAlpha = a;
        // pill
        ctx.font = 'bold 13px "Noto Sans JP", sans-serif';
        const tw = ctx.measureText(tag.text).width + 22;
        ctx.fillStyle = '#100818';
        ctx.shadowColor = tag.color;
        ctx.shadowBlur = 14;
        window.LabBubbles_roundRect(ctx, -tw/2, -13, tw, 26, 13);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = tag.color;
        ctx.lineWidth = 1.5;
        window.LabBubbles_roundRect(ctx, -tw/2, -13, tw, 26, 13);
        ctx.stroke();
        ctx.fillStyle = tag.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(tag.text, 0, 0);
        ctx.restore();
      }
    }
  }

  window.LabLikes = { HeartPop, BuzzRain, AngryReact, drawHeart };
})();
