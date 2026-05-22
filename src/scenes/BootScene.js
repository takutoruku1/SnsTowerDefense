// 初期ロード: 実アセットがあれば差し込み、無ければプレースホルダーを生成する
import { ALLIES } from '../data/allies.js';
import { ENEMIES } from '../data/enemies.js';

const ASSET_BASE = './assets';

// 主人公差分: HP 段階ごとの画像
const INFLUENCER_VARIANTS = [
  { key: 'influencer_happy',    path: `${ASSET_BASE}/influencer/happy.png` },
  { key: 'influencer_stressed', path: `${ASSET_BASE}/influencer/stressed.png` },
  { key: 'influencer_broken',   path: `${ASSET_BASE}/influencer/broken.png` },
];

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // 画像があれば読み込み、無ければ onerror でプレースホルダーをセット
    INFLUENCER_VARIANTS.forEach(v => this.tryLoadImage(v.key, v.path));

    Object.values(ALLIES).forEach(a => {
      this.tryLoadImage(a.texture, `${ASSET_BASE}/allies/${a.id.toLowerCase()}.png`);
    });

    Object.values(ENEMIES).forEach(e => {
      this.tryLoadImage(`enemy_${e.id.toLowerCase()}`, `${ASSET_BASE}/enemies/${e.id.toLowerCase()}.png`);
    });

    // 読み込み失敗を無視して次のシーンに進めるよう設定
    this.load.on('loaderror', (file) => {
      console.warn('[asset missing → placeholder]', file.key, file.src);
    });
  }

  create() {
    // 不足分のプレースホルダーを生成
    INFLUENCER_VARIANTS.forEach(v => {
      if (!this.textures.exists(v.key)) {
        this.generateInfluencerPlaceholder(v.key);
      }
    });

    Object.values(ALLIES).forEach(a => {
      if (!this.textures.exists(a.texture)) {
        this.generateAllyPlaceholder(a);
      }
    });

    Object.values(ENEMIES).forEach(e => {
      const key = `enemy_${e.id.toLowerCase()}`;
      if (!this.textures.exists(key)) {
        this.generateEnemyPlaceholder(key, e);
      }
    });

    this.scene.start('GameScene');
    this.scene.launch('UIScene');
  }

  tryLoadImage(key, path) {
    this.load.image(key, path);
  }

  // --- プレースホルダー生成 ---

  generateInfluencerPlaceholder(key) {
    const g = this.add.graphics({ x: 0, y: 0, add: false });
    const w = 220, h = 320;

    // 椅子
    g.fillStyle(0x111122, 1);
    g.fillRoundedRect(0, 60, w, h - 60, 18);
    g.lineStyle(3, 0xff44aa, 1);
    g.strokeRoundedRect(0, 60, w, h - 60, 18);

    // 顔（HP段階で色を変える）
    let faceColor = 0xffdde6;
    let mouthY = 200;
    if (key.endsWith('stressed')) { faceColor = 0xffccd6; mouthY = 210; }
    if (key.endsWith('broken'))   { faceColor = 0xeeb6c6; mouthY = 220; }
    g.fillStyle(faceColor, 1);
    g.fillCircle(w / 2, 130, 70);

    // ピンク髪
    g.fillStyle(0xffa0d0, 1);
    g.fillEllipse(w / 2, 90, 170, 100);
    g.fillEllipse(w / 2 - 60, 150, 60, 90);
    g.fillEllipse(w / 2 + 60, 150, 60, 90);

    // 目（差分）
    g.fillStyle(0xff44aa, 1);
    if (key.endsWith('happy')) {
      g.fillCircle(w / 2 - 22, 135, 8);
      g.fillCircle(w / 2 + 22, 135, 8);
    } else if (key.endsWith('stressed')) {
      g.fillRect(w / 2 - 28, 134, 14, 4);
      g.fillRect(w / 2 + 14, 134, 14, 4);
    } else {
      g.fillStyle(0x444444, 1);
      g.fillRect(w / 2 - 28, 134, 14, 4);
      g.fillRect(w / 2 + 14, 134, 14, 4);
    }

    // 口
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
    // 目
    g.fillStyle(0xffff66, 1);
    g.fillCircle(r - 5, r - 3, 3);
    g.fillCircle(r + 5, r - 3, 3);
    g.generateTexture(key, r * 2, r * 2);
    g.destroy();
  }
}
