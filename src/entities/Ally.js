// 味方（投稿） — グリッドセルに配置されるタワー
import { ALLIES } from '../data/allies.js';
import { CELL_SIZE } from '../data/config.js';

export class Ally extends Phaser.GameObjects.Container {
  constructor(scene, x, y, allyId) {
    super(scene, x, y);
    scene.add.existing(this);

    this.data_ = ALLIES[allyId];
    this.hp = this.data_.hp;
    this.lastAttackAt = 0;

    this.sprite = scene.add.image(0, 0, this.data_.texture).setDisplaySize(70, 70);
    this.add(this.sprite);

    this.label = scene.add.text(0, 26, this.data_.name, {
      fontFamily: '"Noto Sans JP", sans-serif',
      fontSize: '10px',
      color: '#ffffff',
      stroke: '#000',
      strokeThickness: 3,
    }).setOrigin(0.5);
    this.add(this.label);

    this.hpBar = scene.add.graphics();
    this.add(this.hpBar);
    this.drawHpBar();

    this.alive = true;
  }

  drawHpBar() {
    this.hpBar.clear();
    const w = 60, h = 4;
    const ratio = Math.max(0, this.hp / this.data_.hp);
    this.hpBar.fillStyle(0x222222, 1).fillRect(-w / 2, -42, w, h);
    this.hpBar.fillStyle(0x44dd66, 1).fillRect(-w / 2, -42, w * ratio, h);
  }

  update(time, _delta, enemies) {
    if (!this.alive) return;

    if (time - this.lastAttackAt < this.data_.attackIntervalMs) return;

    // 射程内（左方向）の最も近い敵を探す
    const rangePx = this.data_.range * CELL_SIZE;
    let target = null;
    let bestDist = Infinity;
    for (const e of enemies) {
      if (!e.alive) continue;
      // 自分より左側にいる敵のみ狙う
      if (e.x >= this.x) continue;
      const d = Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y);
      if (d <= rangePx && d < bestDist) {
        bestDist = d;
        target = e;
      }
    }

    if (target) {
      this.shoot(target);
      this.lastAttackAt = time;
    }
  }

  shoot(target) {
    // 投稿（弾）を飛ばす演出
    const bullet = this.scene.add.circle(this.x, this.y, 5, 0xff66cc);
    this.scene.tweens.add({
      targets: bullet,
      x: target.x,
      y: target.y,
      duration: 200,
      onComplete: () => {
        bullet.destroy();
        if (target.alive) target.takeDamage(this.data_.atk);
      },
    });
  }
}
