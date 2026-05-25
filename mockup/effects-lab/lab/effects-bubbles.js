/* ============================================================
   吹き出し罵言エフェクト 3案
   A: pop — X風単発ポップ
   B: replyStorm — リプ欄が右から積み上がる
   C: spamWave — 赤フラッシュ大文字スパム
   ============================================================ */
(() => {
  const L = window.Lab;
  const { ctx, W, H, Ease, rand, irand, pick, SFX, hero } = L;

  const INSULTS = [
    '死ねよww', '消えろゴミw', 'きっしょw', '黙れカス',
    '何様だよwww', '草生えるwwww', '死ね死ね死ね', '引退しろ',
    '頭おかしい', 'みんな嫌ってる', '通報した', '炎上中www',
    'バーカww', '社会のゴミ', '永遠に許さない', 'スクショ全部ある',
  ];
  const USERS = [
    '@arashi_man01', '@nenchaku_anti', '@impression_zombie',
    '@spread_bot', '@anonymous_x', '@hate_account_3',
    '@truth_teller', '@just_saying__', '@watcher_24h',
  ];

  // ───────────────── A: pop (X風単発) ─────────────────
  // 主人公の頭上に1〜3個、わずかにオフセットしてポップ
  class BubblePop {
    constructor(opts = {}) {
      this.depth = 50;
      this.bubbles = [];
      const baseX = opts.x ?? hero.x + 40;
      const baseY = opts.y ?? hero.y - 280;
      const count = opts.count ?? irand(2, 3);
      for (let i = 0; i < count; i++) {
        this.bubbles.push({
          text: pick(INSULTS),
          user: pick(USERS),
          x: baseX + rand(-90, 110) + i * 20,
          y: baseY + rand(-30, 40) - i * 30,
          t: -i * 120,        // staggered birth
          life: 1800,
          age: 0,
          rot: rand(-0.06, 0.06),
        });
        setTimeout(() => SFX.pop(0.35, rand(0.95, 1.15)), Math.max(0, i * 110));
      }
    }
    update(dt) {
      let alive = false;
      for (const b of this.bubbles) {
        b.t += dt;
        if (b.t < 0) { alive = true; continue; }
        b.age += dt;
        if (b.age < b.life) {
          alive = true;
        } else if (b.age < b.life + 360) {
          alive = true;  // fade out phase
        }
      }
      return alive;
    }
    draw(ctx) {
      for (const b of this.bubbles) {
        if (b.t < 0) continue;
        const popT = Math.min(1, b.age / 220);
        const scale = Ease.easeOutBack(popT);
        let alpha = 1;
        let yOff = 0;
        if (b.age > b.life) {
          const fo = Math.min(1, (b.age - b.life) / 360);
          alpha = 1 - fo;
          yOff = -fo * 36;
        }
        ctx.save();
        ctx.translate(b.x, b.y + yOff);
        ctx.rotate(b.rot);
        ctx.scale(scale, scale);
        ctx.globalAlpha = alpha;
        drawXBubble(ctx, b.text, b.user);
        ctx.restore();
      }
    }
  }

  // X風カード型吹き出し（白〜薄ピンクbg、青チェック、@ユーザー名、本文）
  function drawXBubble(ctx, text, user) {
    ctx.font = 'bold 16px "Noto Sans JP", sans-serif';
    const textW = Math.max(120, ctx.measureText(text).width + 24);
    ctx.font = '11px "JetBrains Mono", monospace';
    const userW = ctx.measureText(user).width + 60;  // includes check + padding
    const w = Math.max(textW, userW);
    const h = 56;

    // shadow
    ctx.shadowColor = 'rgba(255, 51, 153, 0.55)';
    ctx.shadowBlur = 22;
    // card bg
    const grad = ctx.createLinearGradient(0, -h/2, 0, h/2);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(1, '#fff0f8');
    ctx.fillStyle = grad;
    roundRect(ctx, -w/2, -h/2, w, h, 8);
    ctx.fill();
    ctx.shadowBlur = 0;
    // border
    ctx.strokeStyle = '#ff3399';
    ctx.lineWidth = 2;
    roundRect(ctx, -w/2, -h/2, w, h, 8);
    ctx.stroke();

    // tail
    ctx.fillStyle = '#fff0f8';
    ctx.beginPath();
    ctx.moveTo(-8, h/2);
    ctx.lineTo(8, h/2);
    ctx.lineTo(0, h/2 + 10);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ff3399';
    ctx.beginPath();
    ctx.moveTo(-8, h/2);
    ctx.lineTo(0, h/2 + 10);
    ctx.lineTo(8, h/2);
    ctx.stroke();

    // user + verified badge
    ctx.fillStyle = '#0f1419';
    ctx.font = 'bold 11px "Noto Sans JP", sans-serif';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.fillText(user, -w/2 + 12, -h/2 + 8);
    // blue check
    const checkX = -w/2 + 12 + ctx.measureText(user).width + 6;
    drawVerifiedCheck(ctx, checkX, -h/2 + 10, 9);

    // text
    ctx.fillStyle = '#0f1419';
    ctx.font = 'bold 16px "Noto Sans JP", sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, -w/2 + 12, h/2 - 18);
  }

  function drawVerifiedCheck(ctx, x, y, r) {
    ctx.save();
    ctx.fillStyle = '#1d9bf0';
    ctx.beginPath();
    // 8-point starburst
    const pts = 8;
    for (let i = 0; i < pts * 2; i++) {
      const a = (i / (pts * 2)) * Math.PI * 2 - Math.PI/2;
      const rr = i % 2 === 0 ? r : r * 0.78;
      const px = x + r + Math.cos(a) * rr;
      const py = y + r + Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    // check
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x + r - 3, y + r);
    ctx.lineTo(x + r - 0.5, y + r + 3);
    ctx.lineTo(x + r + 4, y + r - 3);
    ctx.stroke();
    ctx.restore();
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // ───────────────── B: replyStorm (右からリプ欄積み上がり) ─────────────────
  class ReplyStorm {
    constructor(opts = {}) {
      this.depth = 60;
      this.items = [];
      this.spawned = 0;
      this.total = opts.count ?? 7;
      this.timer = 0;
      this.interval = 130;
    }
    update(dt) {
      this.timer += dt;
      while (this.spawned < this.total && this.timer >= this.interval) {
        this.timer -= this.interval;
        this.items.push({
          text: pick(INSULTS),
          user: pick(USERS),
          age: 0,
          slot: this.spawned,   // stacking order
        });
        SFX.notify(0.28);
        this.spawned++;
      }
      for (const it of this.items) it.age += dt;
      // keep alive until last item has aged ~3500ms
      if (this.spawned < this.total) return true;
      return this.items[this.items.length - 1].age < 3500;
    }
    draw(ctx) {
      const xRight = W - 20;
      const yTop = 70;
      const cardH = 54;
      const gap = 8;
      // compute "live" items (not yet faded out)
      for (let i = this.items.length - 1; i >= 0; i--) {
        const it = this.items[i];
        const slotIdx = it.slot;  // higher = older now... we want newest at top
        // newest on top: invert
        const stackPos = (this.total - 1 - slotIdx);
        const targetY = yTop + stackPos * (cardH + gap);

        // slide in from right
        const inT = Math.min(1, it.age / 280);
        const inE = Ease.easeOutCubic(inT);
        const slideX = xRight + (1 - inE) * 380;

        // fade out
        let alpha = 1;
        if (it.age > 2800) alpha = Math.max(0, 1 - (it.age - 2800) / 700);

        drawReplyCard(ctx, slideX, targetY, it.text, it.user, alpha);
      }
    }
  }

  function drawReplyCard(ctx, xRight, yTop, text, user, alpha) {
    const w = 320;
    const h = 54;
    const x = xRight - w;
    const y = yTop;

    ctx.save();
    ctx.globalAlpha = alpha;
    // shadow
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 4;
    // bg (dark X card)
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, '#1b1626');
    g.addColorStop(1, '#0f0a1c');
    ctx.fillStyle = g;
    roundRect(ctx, x, y, w, h, 10);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    // border
    ctx.strokeStyle = 'rgba(255, 119, 204, 0.45)';
    ctx.lineWidth = 1;
    roundRect(ctx, x, y, w, h, 10);
    ctx.stroke();

    // avatar circle
    const ax = x + 16, ay = y + h/2;
    const ag = ctx.createRadialGradient(ax-3, ay-3, 2, ax, ay, 14);
    ag.addColorStop(0, '#ff77cc');
    ag.addColorStop(1, '#aa2266');
    ctx.fillStyle = ag;
    ctx.beginPath();
    ctx.arc(ax, ay, 14, 0, Math.PI * 2);
    ctx.fill();
    // avatar glyph (just an X letter representing the troll)
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px "Dela Gothic One", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('×', ax, ay + 1);

    // user
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px "Noto Sans JP", sans-serif';
    ctx.fillText(user, x + 38, y + 8);
    // verified
    drawVerifiedCheck(ctx, x + 38 + ctx.measureText(user).width + 4, y + 10, 7);
    // "返信" tag
    ctx.fillStyle = '#1d9bf0';
    ctx.font = '10px "Noto Sans JP", sans-serif';
    ctx.fillText('· 返信', x + w - 50, y + 8);

    // body
    ctx.fillStyle = '#ffd9ec';
    ctx.font = 'bold 13px "Noto Sans JP", sans-serif';
    ctx.fillText(text, x + 38, y + 26);
    ctx.restore();
  }

  // Expose simple SVG-ish helper for blue check
  window.LabBubbles_drawCheck = drawVerifiedCheck;
  window.LabBubbles_roundRect = roundRect;

  // ───────────────── C: spamWave (赤フラッシュ大文字スパム) ─────────────────
  class SpamWave {
    constructor(opts = {}) {
      this.depth = 70;
      this.items = [];
      this.timer = 0;
      this.interval = 70;
      this.spawned = 0;
      this.total = opts.count ?? 14;
      L.startShake(10, 600);
      L.startFlash('#ff1f4d', 0.35, 280);
      SFX.alert(0.5);
    }
    update(dt) {
      this.timer += dt;
      while (this.spawned < this.total && this.timer >= this.interval) {
        this.timer -= this.interval;
        const text = pick(INSULTS);
        const big = Math.random() < 0.35;
        this.items.push({
          text,
          x: rand(80, W - 80),
          y: rand(40, H - 80),
          age: 0,
          life: rand(700, 1100),
          rot: rand(-0.14, 0.14),
          size: big ? rand(34, 48) : rand(18, 28),
          color: pick(['#ff1f4d', '#ff5252', '#ffb83d', '#ffffff', '#ff77cc']),
          glitch: Math.random() < 0.5,
        });
        if (this.spawned % 3 === 0) SFX.pop(0.28, rand(0.7, 1.0));
        this.spawned++;
      }
      for (const it of this.items) it.age += dt;
      if (this.spawned < this.total) return true;
      return this.items.some(it => it.age < it.life + 200);
    }
    draw(ctx) {
      for (const it of this.items) {
        const inT = Math.min(1, it.age / 120);
        const scale = Ease.easeOutBack(inT);
        let alpha = 1;
        if (it.age > it.life) alpha = Math.max(0, 1 - (it.age - it.life) / 200);
        ctx.save();
        ctx.translate(it.x, it.y);
        ctx.rotate(it.rot);
        ctx.scale(scale, scale);
        ctx.globalAlpha = alpha;
        ctx.font = `900 ${it.size}px "Dela Gothic One", "Noto Sans JP", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        // glitch: draw shifted copies in cyan/magenta
        if (it.glitch) {
          ctx.globalAlpha = alpha * 0.7;
          ctx.fillStyle = '#00f0ff';
          ctx.fillText(it.text, -3, 0);
          ctx.fillStyle = '#ff00aa';
          ctx.fillText(it.text, 3, 0);
          ctx.globalAlpha = alpha;
        }
        // glow
        ctx.shadowColor = it.color;
        ctx.shadowBlur = 18;
        ctx.fillStyle = it.color;
        ctx.fillText(it.text, 0, 0);
        ctx.restore();
      }
    }
  }

  // Expose
  window.LabBubbles = { BubblePop, ReplyStorm, SpamWave };
})();
