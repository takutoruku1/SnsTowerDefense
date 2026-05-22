// 主人公（炎上系インフルエンサー）
// HP段階でスプライトを差し替える
import { INFLUENCER_MAX_HP, HP_THRESHOLDS } from '../data/config.js';

export class Influencer extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);
    scene.add.existing(this);

    this.maxHp = INFLUENCER_MAX_HP;
    this.hp = this.maxHp;

    this.sprite = scene.add.image(0, 0, 'influencer_happy').setOrigin(0.5, 0.6);
    this.add(this.sprite);

    // ハート枠（演出）
    this.aura = scene.add.graphics();
    this.add(this.aura);
    this.drawAura();
  }

  drawAura() {
    this.aura.clear();
    this.aura.lineStyle(2, 0xff3388, 0.4);
    this.aura.strokeCircle(0, 20, 130);
  }

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
    this.updateVariant();
    this.flash();
    return this.hp <= 0;
  }

  flash() {
    this.scene.tweens.add({
      targets: this.sprite,
      tint: 0xff5555,
      duration: 80,
      yoyo: true,
      onStart: () => this.sprite.setTint(0xff5555),
      onComplete: () => this.sprite.clearTint(),
    });
  }

  updateVariant() {
    const ratio = this.hp / this.maxHp;
    let key = 'influencer_happy';
    if (ratio < HP_THRESHOLDS.STRESSED) key = 'influencer_broken';
    else if (ratio < HP_THRESHOLDS.HAPPY) key = 'influencer_stressed';

    if (this.sprite.texture.key !== key) {
      this.sprite.setTexture(key);
    }
  }

  get isDefeated() {
    return this.hp <= 0;
  }
}
