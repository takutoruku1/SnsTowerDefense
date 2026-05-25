/* ============================================================
   おまけエフェクト — ダメージ/撃破
   ダメージ:
     A: NumberPop  — 数字ぴょん（標準）
     B: ReactionHit — 赤いいね♡で出血表現
     C: QuoteRT    — 引用RTカードで晒される
   撃破:
     D: BannedTag  — 「アカウント凍結」スタンプ
     E: ReportedX  — 「通報されました」+ ×でフェードアウト
     F: ViralBurst — 「いいね x9999」で吹っ飛ぶ（バズで成仏）
   ============================================================ */
(() => {
  const L = window.Lab;
  const { ctx, W, H, Ease, rand, irand, pick, SFX, hero } = L;
  const TAU = L.TAU;

  // ───── A: NumberPop ─────
  class NumberPop {
    constructor(opts = {}) {
      this.depth = 90;
      this.x = (opts.x ?? hero.x) + rand(-20, 20);
      this.y = (opts.y ?? hero.y - 200) + rand(-10, 10);
      this.dmg = opts.dmg ?? irand(20, 80);
      this.crit = opts.crit ?? Math.random() < 0.25;
      this.age = 0;
      this.life = 900;
      this.vy = -180;
      SFX.pop(0.3, this.crit ? 1.3 : 1.0);
    }
    update(dt) {
      this.age += dt;
      this.y += this.vy * (dt / 1000);
      this.vy += 280 * (dt / 1000);
      return this.age < this.life;
    }
    draw(ctx) {
      const t = this.age / this.life;
      const inT = Math.min(1, this.age / 120);
      const a = t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3;
      const scale = (this.crit ? 1.6 : 1.0) * Ease.easeOutBack(inT);
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.scale(scale, scale);
      ctx.globalAlpha = a;
      ctx.font = `900 ${this.crit ? 36 : 26}px "Dela Gothic One", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = this.crit ? '#ffb83d' : '#ff5252';
      ctx.shadowColor = this.crit ? '#ffb83d' : '#ff5252';
      ctx.shadowBlur = 14;
      ctx.fillText('-' + this.dmg, 0, 0);
      if (this.crit) {
        ctx.font = 'bold 12px "JetBrains Mono", monospace';
        ctx.fillStyle = '#fff';
        ctx.fillText('CRITICAL', 0, 22);
      }
      ctx.restore();
    }
  }

  // ───── B: ReactionHit (赤♡で出血表現) ─────
  class ReactionHit {
    constructor(opts = {}) {
      this.depth = 90;
      this.particles = [];
      this.age = 0;
      this.life = 1100;
      const x = opts.x ?? hero.x;
      const y = opts.y ?? hero.y - 180;
      for (let i = 0; i < 9; i++) {
        const a = rand(0, TAU);
        const v = rand(80, 200);
        this.particles.push({
          x, y,
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v - rand(0, 80),
          r: rand(6, 12),
          age: 0,
          life: rand(700, 1000),
          rot: rand(-0.3, 0.3),
          spin: rand(-3, 3),
        });
      }
      this.dmg = opts.dmg ?? irand(30, 90);
      SFX.heart(0.35, 0.7);
      SFX.pop(0.28, 0.8);
    }
    update(dt) {
      this.age += dt;
      for (const p of this.particles) {
        p.age += dt;
        p.x += p.vx * (dt / 1000);
        p.y += p.vy * (dt / 1000);
        p.vy += 280 * (dt / 1000);
        p.rot += p.spin * (dt / 1000);
      }
      return this.age < this.life;
    }
    draw(ctx) {
      for (const p of this.particles) {
        const t = p.age / p.life;
        if (t > 1) continue;
        const a = 1 - t;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = a;
        window.LabLikes.drawHeart(ctx, 0, 0, p.r, '#ff1f4d');
        ctx.restore();
      }
      // damage number
      const t = this.age / this.life;
      const inT = Math.min(1, this.age / 140);
      const a = t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3;
      const baseY = (hero.y - 180) - Ease.easeOutCubic(t) * 60;
      ctx.save();
      ctx.translate(hero.x, baseY);
      ctx.scale(Ease.easeOutBack(inT), Ease.easeOutBack(inT));
      ctx.globalAlpha = a;
      ctx.font = '900 28px "Dela Gothic One", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ff1f4d';
      ctx.shadowColor = '#ff1f4d';
      ctx.shadowBlur = 16;
      ctx.fillText('♡ -' + this.dmg, 0, 0);
      ctx.restore();
    }
  }

  // ───── C: QuoteRT (引用RTで晒される) ─────
  class QuoteRT {
    constructor(opts = {}) {
      this.depth = 95;
      this.age = 0;
      this.life = 2600;
      this.x = opts.x ?? hero.x + 40;
      this.y = opts.y ?? hero.y - 260;
      this.dmg = opts.dmg ?? irand(40, 110);
      this.user = pick(['@spread_bot', '@matome_master', '@anti_news']);
      this.quote = pick(['コレはひどいwww', '炎上不可避', '末路がコレかよ', '通報案件']);
      this.rtCount = irand(120, 980);
      SFX.notify(0.35);
    }
    update(dt) {
      this.age += dt;
      return this.age < this.life;
    }
    draw(ctx) {
      const inT = Math.min(1, this.age / 240);
      const outT = this.age > this.life - 500 ? (this.age - (this.life - 500)) / 500 : 0;
      const scale = Ease.easeOutBack(inT) * (1 - outT * 0.2);
      const alpha = inT * (1 - outT);
      const yOff = -Ease.easeOutCubic(Math.min(1, this.age / 1800)) * 80;

      ctx.save();
      ctx.translate(this.x, this.y + yOff);
      ctx.scale(scale, scale);
      ctx.globalAlpha = alpha;

      const w = 260, h = 110;
      // outer card (the quote-tweeter)
      ctx.shadowColor = 'rgba(255, 31, 77, 0.6)';
      ctx.shadowBlur = 20;
      ctx.fillStyle = '#1b1626';
      window.LabBubbles_roundRect(ctx, -w/2, -h/2, w, h, 10);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#ff1f4d';
      ctx.lineWidth = 1.5;
      window.LabBubbles_roundRect(ctx, -w/2, -h/2, w, h, 10);
      ctx.stroke();

      // header: user + quote
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px "Noto Sans JP", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(this.user, -w/2 + 12, -h/2 + 10);
      ctx.fillStyle = '#ffb83d';
      ctx.font = 'bold 13px "Noto Sans JP", sans-serif';
      ctx.fillText('"' + this.quote + '"', -w/2 + 12, -h/2 + 26);

      // inner quoted card (the victim — kinda crushed look)
      const ix = -w/2 + 12, iy = -h/2 + 50, iw = w - 24, ih = 44;
      ctx.fillStyle = '#0d0816';
      window.LabBubbles_roundRect(ctx, ix, iy, iw, ih, 6);
      ctx.fill();
      ctx.strokeStyle = '#33223a';
      ctx.lineWidth = 1;
      window.LabBubbles_roundRect(ctx, ix, iy, iw, ih, 6);
      ctx.stroke();
      ctx.fillStyle = '#c3b6d4';
      ctx.font = '10px "Noto Sans JP", sans-serif';
      ctx.fillText('@influencer_pink', ix + 6, iy + 6);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px "Noto Sans JP", sans-serif';
      ctx.fillText('普通の投稿でした...', ix + 6, iy + 22);

      // RT count corner
      ctx.fillStyle = '#1d9bf0';
      ctx.font = 'bold 11px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText('↻ ' + this.rtCount.toLocaleString(), w/2 - 12, h/2 - 16);

      // damage badge (top-right)
      ctx.save();
      ctx.translate(w/2 - 4, -h/2 + 4);
      ctx.rotate(0.18);
      ctx.fillStyle = '#ff1f4d';
      window.LabBubbles_roundRect(ctx, -38, -10, 38, 20, 4);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('-' + this.dmg, -19, 0);
      ctx.restore();

      ctx.restore();
    }
  }

  // ───── D: BannedTag (凍結スタンプ) ─────
  class BannedTag {
    constructor(opts = {}) {
      this.depth = 130;
      this.x = opts.x ?? hero.x - 80 + rand(-30, 30);
      this.y = opts.y ?? hero.y - 150 + rand(-20, 20);
      this.rot = rand(-0.3, -0.15);
      this.age = 0;
      this.life = 1800;
      SFX.alert(0.4);
      L.startShake(5, 250);
    }
    update(dt) { this.age += dt; return this.age < this.life; }
    draw(ctx) {
      const inT = Math.min(1, this.age / 200);
      // stamp slams in (overshoot scale)
      const slam = inT < 0.4
        ? 3.0 - inT / 0.4 * 2.2   // 3.0 → 0.8
        : 0.8 + Math.min(1, (inT - 0.4) / 0.6) * 0.2;  // 0.8 → 1.0
      const outT = this.age > this.life - 400 ? (this.age - (this.life - 400)) / 400 : 0;
      const alpha = Math.min(1, inT * 4) * (1 - outT);
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rot);
      ctx.scale(slam, slam);
      ctx.globalAlpha = alpha;
      // stamp box
      const tw = 200, th = 70;
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#1d9bf0';
      ctx.fillStyle = 'rgba(29, 155, 240, 0.18)';
      ctx.fillRect(-tw/2, -th/2, tw, th);
      ctx.strokeRect(-tw/2, -th/2, tw, th);
      // text
      ctx.fillStyle = '#1d9bf0';
      ctx.font = '900 26px "Dela Gothic One", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('アカウント凍結', 0, -2);
      ctx.font = 'bold 10px "JetBrains Mono", monospace';
      ctx.fillText('ACCOUNT SUSPENDED', 0, 22);
      ctx.restore();
    }
  }

  // ───── E: ReportedX (通報されました + ×フェード) ─────
  class ReportedX {
    constructor(opts = {}) {
      this.depth = 130;
      this.x = opts.x ?? hero.x;
      this.y = opts.y ?? hero.y - 180;
      this.age = 0;
      this.life = 1600;
      SFX.alert(0.4);
    }
    update(dt) { this.age += dt; return this.age < this.life; }
    draw(ctx) {
      const inT = Math.min(1, this.age / 200);
      const outT = this.age > this.life - 500 ? (this.age - (this.life - 500)) / 500 : 0;
      const alpha = inT * (1 - outT);
      const scale = Ease.easeOutBack(inT);
      // big × overlay
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.scale(scale, scale);
      ctx.globalAlpha = alpha;
      // ring
      ctx.strokeStyle = '#ff1f4d';
      ctx.lineWidth = 5;
      ctx.shadowColor = '#ff1f4d';
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(0, 0, 36, 0, TAU);
      ctx.stroke();
      // X
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-18, -18); ctx.lineTo(18, 18);
      ctx.moveTo(18, -18); ctx.lineTo(-18, 18);
      ctx.stroke();
      ctx.shadowBlur = 0;
      // tag below
      ctx.fillStyle = '#1a0510';
      window.LabBubbles_roundRect(ctx, -80, 50, 160, 28, 14);
      ctx.fill();
      ctx.strokeStyle = '#ff1f4d';
      ctx.lineWidth = 1.5;
      window.LabBubbles_roundRect(ctx, -80, 50, 160, 28, 14);
      ctx.stroke();
      ctx.fillStyle = '#ff5fa8';
      ctx.font = 'bold 13px "Noto Sans JP", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('通報されました', 0, 64);
      ctx.restore();
    }
  }

  // ───── F: ViralBurst (バズで成仏) ─────
  class ViralBurst {
    constructor(opts = {}) {
      this.depth = 130;
      this.x = opts.x ?? hero.x;
      this.y = opts.y ?? hero.y - 180;
      this.age = 0;
      this.life = 2200;
      this.count = irand(8000, 99999);
      this.rays = [];
      for (let i = 0; i < 12; i++) {
        this.rays.push({ a: (TAU / 12) * i, len: rand(80, 160) });
      }
      this.hearts = [];
      for (let i = 0; i < 22; i++) {
        const a = rand(0, TAU);
        const v = rand(180, 360);
        this.hearts.push({
          x: this.x, y: this.y,
          vx: Math.cos(a) * v, vy: Math.sin(a) * v,
          r: rand(10, 22),
          age: 0, life: rand(1100, 1700),
          rot: rand(-0.4, 0.4),
          spin: rand(-3, 3),
          c: pick(['#ff3399', '#ff77cc', '#ffb83d', '#fff'])
        });
      }
      SFX.burst(0.55);
      setTimeout(() => SFX.heart(0.35, 1.4), 150);
      L.startShake(8, 400);
      L.startFlash('#ff77cc', 0.5, 260);
    }
    update(dt) {
      this.age += dt;
      for (const h of this.hearts) {
        h.age += dt;
        h.x += h.vx * (dt / 1000);
        h.y += h.vy * (dt / 1000);
        h.vy += 280 * (dt / 1000);
        h.rot += h.spin * (dt / 1000);
      }
      return this.age < this.life;
    }
    draw(ctx) {
      const t = this.age / this.life;
      const outT = t > 0.7 ? (t - 0.7) / 0.3 : 0;
      const alpha = 1 - outT;
      const burstT = Math.min(1, this.age / 350);
      // rays
      ctx.save();
      ctx.globalAlpha = alpha * 0.7;
      ctx.translate(this.x, this.y);
      ctx.globalCompositeOperation = 'screen';
      for (const r of this.rays) {
        const len = r.len * Ease.easeOutQuint(burstT);
        const grad = ctx.createLinearGradient(0, 0, Math.cos(r.a) * len, Math.sin(r.a) * len);
        grad.addColorStop(0, 'rgba(255, 51, 153, 0.9)');
        grad.addColorStop(1, 'rgba(255, 51, 153, 0)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(r.a) * len, Math.sin(r.a) * len);
        ctx.stroke();
      }
      ctx.restore();
      // hearts
      for (const h of this.hearts) {
        const ht = h.age / h.life;
        if (ht > 1) continue;
        const a = (1 - ht) * alpha;
        ctx.save();
        ctx.translate(h.x, h.y);
        ctx.rotate(h.rot);
        ctx.globalAlpha = a;
        window.LabLikes.drawHeart(ctx, 0, 0, h.r, h.c);
        ctx.restore();
      }
      // center count text
      const scale = Ease.easeOutBack(burstT);
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.scale(scale, scale);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#fff';
      ctx.font = '900 38px "Dela Gothic One", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = '#ff3399';
      ctx.shadowBlur = 30;
      ctx.fillText('♡ +' + this.count.toLocaleString(), 0, -20);
      ctx.fillStyle = '#ffb83d';
      ctx.font = 'bold 18px "Noto Sans JP", sans-serif';
      ctx.shadowColor = '#ffb83d';
      ctx.shadowBlur = 14;
      ctx.fillText('バズって成仏', 0, 18);
      ctx.restore();
    }
  }

  window.LabBonus = { NumberPop, ReactionHit, QuoteRT, BannedTag, ReportedX, ViralBurst };
})();
