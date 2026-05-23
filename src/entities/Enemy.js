// 敵（罵言雑言）
// 左からフィールドを横切り、主人公の近くに来たら「話しかけ」攻撃を始める
import { ENEMIES } from '../data/enemies.js';
import { ENEMY_TALK_RANGE, ENEMY_TALK_INTERVAL_MS } from '../data/config.js';
import { SpeechBubble } from './SpeechBubble.js';

export class Enemy extends Phaser.GameObjects.Container {
  constructor(scene, x, y, enemyId, influencer) {
    super(scene, x, y);
    scene.add.existing(this);

    this.data_ = ENEMIES[enemyId];
    this.hp = this.data_.hp;
    this.influencer = influencer;
    this.lastTalkAt = 0;

    this.sprite = scene.add.image(0, 0, `enemy_${enemyId.toLowerCase()}`);
    this.add(this.sprite);

    // HPバー
    this.hpBar = scene.add.graphics();
    this.add(this.hpBar);
    this.drawHpBar();

    this.alive = true;
  }

  drawHpBar() {
    this.hpBar.clear();
    const w = 30;
    const h = 4;
    const ratio = Math.max(0, this.hp / this.data_.hp);
    this.hpBar.fillStyle(0x222222, 1).fillRect(-w / 2, -this.data_.radius - 8, w, h);
    this.hpBar.fillStyle(0xff4466, 1).fillRect(-w / 2, -this.data_.radius - 8, w * ratio, h);
  }

  update(time, delta) {
    if (!this.alive) return;

    // 主人公方向にスムーズに進む（基本的に左方向）
    const dx = this.influencer.x - this.x;
    const dy = this.influencer.y - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist > ENEMY_TALK_RANGE) {
      const step = (this.data_.speed * delta) / 1000;
      this.x += (dx / dist) * step;
      this.y += (dy / dist) * step * 0.3; // 縦の動きは抑え気味
    } else {
      // 話しかけ攻撃（遠隔負傷）
      if (time - this.lastTalkAt > ENEMY_TALK_INTERVAL_MS) {
        this.lastTalkAt = time;
        this.talk();
      }
    }
  }

  talk() {
    const line = Phaser.Utils.Array.GetRandom(this.data_.talkLines);
    new SpeechBubble(this.scene, this.x, this.y - this.data_.radius - 18, line, {
      textColor: '#ffcc66',
      borderColor: 0xaa3322,
      fillColor: 0x1a0810,
      fontSize: '12px',
      tailDir: 1,
      duration: 1000,
    });

    // 主人公にダメージ
    this.scene.events.emit('enemy-talk', this.data_.atk);
  }

  takeDamage(amount) {
    if (!this.alive) return;
    this.hp -= amount;
    this.drawHpBar();
    this.sprite.setTint(0xffffff);
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0.4,
      duration: 60,
      yoyo: true,
    });
    if (this.hp <= 0) this.kill();
  }

  kill() {
    this.alive = false;
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scale: 0.3,
      duration: 200,
      onComplete: () => {
        this.scene.events.emit('enemy-killed', this);
        this.destroy();
      },
    });
  }
}
