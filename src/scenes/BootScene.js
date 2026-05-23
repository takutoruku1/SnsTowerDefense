// 初期ロード:
//  - 実アセットがあれば差し込む
//  - 主人公は happy.png 1枚だけあれば stressed / broken をピクセル加工で動的生成
//  - 何も無ければプレースホルダー（図形）で全種生成
import { ALLIES } from '../data/allies.js';
import { ENEMIES } from '../data/enemies.js';

const ASSET_BASE = './assets';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // 主人公: happy.png のみ読み込み試行
    this.load.image('influencer_happy_src', `${ASSET_BASE}/influencer/happy.png`);

    Object.values(ALLIES).forEach(a => {
      this.load.image(a.texture, `${ASSET_BASE}/allies/${a.id.toLowerCase()}.png`);
    });

    Object.values(ENEMIES).forEach(e => {
      this.load.image(`enemy_${e.id.toLowerCase()}`, `${ASSET_BASE}/enemies/${e.id.toLowerCase()}.png`);
    });

    // BGM
    this.load.audio('bgm_main', `${ASSET_BASE}/bgm/main.mp3`);

    this.load.on('loaderror', (file) => {
      console.warn('[asset missing → placeholder]', file.key, file.src);
    });
  }

  create() {
    // --- 主人公差分 ---
    if (this.textures.exists('influencer_happy_src')) {
      // happy.png 読み込み成功 → 加工で3段階を生成
      this.deriveInfluencerVariants('influencer_happy_src');
    } else {
      // happy.png が無い → 図形プレースホルダーで全段階生成
      this.generateInfluencerPlaceholder('influencer_happy');
      this.generateInfluencerPlaceholder('influencer_stressed', 'stressed');
      this.generateInfluencerPlaceholder('influencer_broken', 'broken');
    }

    Object.values(ALLIES).forEach(a => {
      if (!this.textures.exists(a.texture)) this.generateAllyPlaceholder(a);
    });

    Object.values(ENEMIES).forEach(e => {
      const key = `enemy_${e.id.toLowerCase()}`;
      if (!this.textures.exists(key)) this.generateEnemyPlaceholder(key, e);
    });

    this.scene.start('TitleScene');
  }

  // --- happy.png から stressed / broken を動的生成 ---
  deriveInfluencerVariants(sourceKey) {
    const src = this.textures.get(sourceKey).getSourceImage();
    const w = src.width;
    const h = src.height;

    // happy はソース画像をそのまま新キーで登録
    const happyCanvas = this.makeCanvasFromImage(src, w, h);
    this.textures.addCanvas('influencer_happy', happyCanvas);

    // stressed: 軽い脱彩 + 赤み + 汗
    const stressedCanvas = this.makeCanvasFromImage(src, w, h);
    this.applyPixelEffect(stressedCanvas, 'stressed');
    this.drawOverlay(stressedCanvas, 'stressed');
    this.textures.addCanvas('influencer_stressed', stressedCanvas);

    // broken: 強脱彩 + 暗化 + 青み + 涙 + ヒビ
    const brokenCanvas = this.makeCanvasFromImage(src, w, h);
    this.applyPixelEffect(brokenCanvas, 'broken');
    this.drawOverlay(brokenCanvas, 'broken');
    this.textures.addCanvas('influencer_broken', brokenCanvas);
  }

  makeCanvasFromImage(img, w, h) {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    return canvas;
  }

  applyPixelEffect(canvas, mode) {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imageData.data;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] === 0) continue; // 透明はスキップ
      const r = d[i], g = d[i + 1], b = d[i + 2];
      const grey = 0.299 * r + 0.587 * g + 0.114 * b;
      if (mode === 'stressed') {
        // 30% 脱彩 + 赤み
        d[i]     = Math.min(255, r * 0.7 + grey * 0.3 + 12);
        d[i + 1] = g * 0.6 + grey * 0.4;
        d[i + 2] = b * 0.6 + grey * 0.4;
      } else if (mode === 'broken') {
        // 強脱彩 + 暗化 + 青み
        d[i]     = grey * 0.45;
        d[i + 1] = grey * 0.5;
        d[i + 2] = Math.min(255, grey * 0.55 + 22);
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }

  drawOverlay(canvas, mode) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;

    if (mode === 'stressed') {
      // 汗マーク（右こめかみ辺り）
      ctx.fillStyle = 'rgba(120, 200, 255, 0.85)';
      ctx.strokeStyle = 'rgba(60, 120, 200, 0.9)';
      ctx.lineWidth = 1.5;
      this.drawTeardrop(ctx, w * 0.70, h * 0.18, 9);
      // 顔の赤面っぽい斜線
      ctx.strokeStyle = 'rgba(255, 80, 120, 0.35)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(w * 0.34 + i * 6, h * 0.27);
        ctx.lineTo(w * 0.32 + i * 6, h * 0.30);
        ctx.stroke();
      }
    } else if (mode === 'broken') {
      // 涙（両目から流れる）
      ctx.fillStyle = 'rgba(180, 220, 255, 0.85)';
      ctx.strokeStyle = 'rgba(80, 140, 220, 0.9)';
      ctx.lineWidth = 1.5;
      this.drawTearStreak(ctx, w * 0.43, h * 0.26, h * 0.10);
      this.drawTearStreak(ctx, w * 0.55, h * 0.26, h * 0.10);
      // ヒビ割れオーバーレイ（右上）
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(w * 0.85, h * 0.05);
      ctx.lineTo(w * 0.70, h * 0.18);
      ctx.lineTo(w * 0.78, h * 0.24);
      ctx.lineTo(w * 0.66, h * 0.32);
      ctx.lineTo(w * 0.72, h * 0.40);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(w * 0.78, h * 0.24);
      ctx.lineTo(w * 0.88, h * 0.22);
      ctx.stroke();
      // 全体に薄い暗幕
      ctx.fillStyle = 'rgba(0, 0, 20, 0.18)';
      ctx.fillRect(0, 0, w, h);
    }
  }

  drawTeardrop(ctx, x, y, size) {
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.bezierCurveTo(x + size, y, x + size * 0.6, y + size, x, y + size);
    ctx.bezierCurveTo(x - size * 0.6, y + size, x - size, y, x, y - size);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  drawTearStreak(ctx, x, y, length) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + 2, y + length * 0.5, x, y + length);
    ctx.lineWidth = 3;
    ctx.stroke();
    // 涙の雫
    ctx.beginPath();
    ctx.arc(x, y + length + 2, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- 完全プレースホルダー（happy.png すら無い時の図形版） ---
  generateInfluencerPlaceholder(key, mode = 'happy') {
    const g = this.add.graphics({ x: 0, y: 0, add: false });
    const w = 220, h = 320;

    g.fillStyle(0x111122, 1);
    g.fillRoundedRect(0, 60, w, h - 60, 18);
    g.lineStyle(3, 0xff44aa, 1);
    g.strokeRoundedRect(0, 60, w, h - 60, 18);

    let faceColor = 0xffdde6;
    let mouthY = 200;
    if (mode === 'stressed') { faceColor = 0xffccd6; mouthY = 210; }
    if (mode === 'broken')   { faceColor = 0xeeb6c6; mouthY = 220; }
    g.fillStyle(faceColor, 1);
    g.fillCircle(w / 2, 130, 70);

    g.fillStyle(0xffa0d0, 1);
    g.fillEllipse(w / 2, 90, 170, 100);
    g.fillEllipse(w / 2 - 60, 150, 60, 90);
    g.fillEllipse(w / 2 + 60, 150, 60, 90);

    g.fillStyle(0xff44aa, 1);
    if (mode === 'happy') {
      g.fillCircle(w / 2 - 22, 135, 8);
      g.fillCircle(w / 2 + 22, 135, 8);
    } else if (mode === 'stressed') {
      g.fillRect(w / 2 - 28, 134, 14, 4);
      g.fillRect(w / 2 + 14, 134, 14, 4);
    } else {
      g.fillStyle(0x444444, 1);
      g.fillRect(w / 2 - 28, 134, 14, 4);
      g.fillRect(w / 2 + 14, 134, 14, 4);
    }

    g.lineStyle(2, 0xff3377, 1);
    g.strokeCircle(w / 2, mouthY, 6);

    g.generateTexture(key, w, h);
    g.destroy();
  }

  generateAllyPlaceholder(ally) {
    const g = this.add.graphics({ x: 0, y: 0, add: false });
    const size = 80;
    g.fillStyle(ally.color, 1);
    g.fillRoundedRect(0, 0, size, size, 12);
    g.lineStyle(3, 0xffffff, 0.7);
    g.strokeRoundedRect(0, 0, size, size, 12);
    g.generateTexture(ally.texture, size, size);
    g.destroy();
  }

  generateEnemyPlaceholder(key, enemy) {
    const g = this.add.graphics({ x: 0, y: 0, add: false });
    const r = enemy.radius;
    g.fillStyle(enemy.color, 1);
    g.fillCircle(r, r, r);
    g.lineStyle(2, 0xff6677, 1);
    g.strokeCircle(r, r, r);
    g.fillStyle(0xffff66, 1);
    g.fillCircle(r - 5, r - 3, 3);
    g.fillCircle(r + 5, r - 3, 3);
    g.generateTexture(key, r * 2, r * 2);
    g.destroy();
  }
}
