// 飛行コメント: 敵/味方が発射する弾幕兼セリフ
// HP = damage = atk。コメント同士は互いの damage を削り合い、HP<=0 で消滅。
// 敵コメントは右へ、味方コメントは左へ進む。

import { entityScaleAtRow, rowAtY } from '../data/config.js';

const SPEED_PX_PER_SEC = 360;
const LIFETIME_MS = 4500;

export class Comment extends Phaser.GameObjects.Container {
  constructor(scene, x, y, opts) {
    super(scene, x, y);
    scene.add.existing(this);

    const { side, text, hp, damage, dirX = 0, dirY = 0 } = opts;
    this.side = side;       // 'ally' | 'enemy'
    this.hp = hp;
    this.damage = damage;
    this.dead = false;
    this.lifeMs = LIFETIME_MS;

    // 任意方向に飛ばす。dir が 0 の場合は左右デフォルト (敵→右、味方→左)
    let dx = dirX, dy = dirY;
    if (dx === 0 && dy === 0) {
      dx = side === 'enemy' ? 1 : -1;
    }
    const norm = Math.hypot(dx, dy) || 1;
    this.vx = (dx / norm) * SPEED_PX_PER_SEC;
    this.vy = (dy / norm) * SPEED_PX_PER_SEC;

    const textColor   = side === 'enemy' ? '#ffcc66' : '#ff99cc';
    const fillColor   = side === 'enemy' ? 0x1a0810 : 0x140828;
    const borderColor = side === 'enemy' ? 0xaa3322 : 0xff66cc;

    this.label = scene.add.text(0, 0, text, {
      fontFamily: '"Yusei Magic", "Noto Sans JP", sans-serif',
      fontSize: '12px',
      color: textColor,
    }).setOrigin(0.5);

    const padX = 8, padY = 3;
    const w = this.label.width + padX * 2;
    const h = this.label.height + padY * 2;
    this.halfW = w / 2;
    this.halfH = h / 2;

    this.bg = scene.add.graphics();
    this.bg.fillStyle(fillColor, 0.95).fillRoundedRect(-w / 2, -h / 2, w, h, 5);
    this.bg.lineStyle(1.5, borderColor, 0.9).strokeRoundedRect(-w / 2, -h / 2, w, h, 5);

    this.add([this.bg, this.label]);

    // 発射時点の Y で透視倍率を決定（飛行中は固定）
    this.setScale(entityScaleAtRow(rowAtY(y)));
    this.setDepth(y + 0.5);

    this.setAlpha(0);
    scene.tweens.add({ targets: this, alpha: 1, duration: 80 });
  }

  step(delta) {
    if (this.dead) return;
    this.x += this.vx * (delta / 1000);
    this.y += this.vy * (delta / 1000);
    this.lifeMs -= delta;
    if (this.lifeMs <= 0) this.fade();
  }

  hit(amount) {
    if (this.dead) return;
    this.hp -= amount;
    if (this.hp <= 0) this.fade();
  }

  fade() {
    if (this.dead) return;
    this.dead = true;
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scale: this.scaleX * 0.7,
      duration: 130,
      onComplete: () => this.destroy(),
    });
  }
}
