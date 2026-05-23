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

    // 足元の影（地に足が付いた印象を出す）。Container の最下層へ追加。
    this.shadow = scene.add.ellipse(0, 32, 60, 14, 0x000000, 0.4);
    this.add(this.shadow);

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

    // 射程内 (全方向、ユークリッド距離) で最も近い敵を探す
    const rangePx = this.data_.range * CELL_SIZE;
    let target = null;
    let bestDist = Infinity;
    for (const e of enemies) {
      if (!e.alive) continue;
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

  takeDamage(amount) {
    if (!this.alive) return;
    this.hp -= amount;
    this.drawHpBar();
    // 被弾フラッシュ
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0.4,
      duration: 60,
      yoyo: true,
    });
    if (this.hp <= 0) this.kill();
  }

  kill() {
    if (!this.alive) return;
    this.alive = false;
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scale: this.scaleX * 0.4,
      duration: 250,
      onComplete: () => {
        this.scene.events.emit('ally-killed', this);
        this.destroy();
      },
    });
  }

  shoot(target) {
    // ターゲット方向にコメント発射 (たて/よこ/斜めにも飛ばせる)
    const dirX = target.x - this.x;
    const dirY = target.y - this.y;
    this.scene.addComment('ally', this.x, this.y, this.data_.name, this.data_.atk, dirX, dirY);
  }
}
