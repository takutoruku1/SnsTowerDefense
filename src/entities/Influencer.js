// 主人公（炎上系インフルエンサー）
// HP段階でスプライトを差し替える + 定期的に吹き出しで発言
import { INFLUENCER_MAX_HP, HP_THRESHOLDS } from '../data/config.js';
import { SpeechBubble } from './SpeechBubble.js';

const TALK_LINES_HAPPY = [
  'ほら、また燃えてるw',
  'もっとやれよwww',
  '炎上上等！',
  '今日も平常運転w',
  'コメント欄カオスで草',
];
const TALK_LINES_STRESSED = [
  'うぜぇんだよ…',
  'もういいって…',
  'なんで俺ばっか',
  'ちょっと黙れよ',
];
const TALK_LINES_BROKEN = [
  '助けて…',
  'もうやだ…',
  '消えたい…',
];

export class Influencer extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);
    scene.add.existing(this);

    this.maxHp = INFLUENCER_MAX_HP;
    this.hp = this.maxHp;

    // sprite を先に作って足元 Y を決め、その後に shadow → sprite の順で重ねる
    this.sprite = scene.add.image(0, 0, 'influencer_happy').setOrigin(0.5, 0.6);
    // origin (0.5, 0.6) なので足元は y = displayHeight * 0.4。少し下に余裕を持たせる。
    const feetY = this.sprite.displayHeight * 0.4 - 6;
    const shadowW = Math.max(80, this.sprite.displayWidth * 0.55);

    this.shadow = scene.add.ellipse(0, feetY, shadowW, 22, 0x000000, 0.45);
    this.add(this.shadow);
    this.add(this.sprite);

    // ハート枠（演出）
    this.aura = scene.add.graphics();
    this.add(this.aura);
    this.drawAura();

    // 吹き出し定期発動
    this.scheduleTalk();
  }

  scheduleTalk() {
    const delay = 3500 + Math.random() * 2500;
    this.scene.time.delayedCall(delay, () => {
      if (!this.scene || !this.active || this.hp <= 0) return;
      this.talk();
      this.scheduleTalk();
    });
  }

  talk() {
    const ratio = this.hp / this.maxHp;
    let lines = TALK_LINES_HAPPY;
    let color = '#ff99cc';
    if (ratio < HP_THRESHOLDS.STRESSED) {
      lines = TALK_LINES_BROKEN;
      color = '#88aaff';
    } else if (ratio < HP_THRESHOLDS.HAPPY) {
      lines = TALK_LINES_STRESSED;
      color = '#ffaa88';
    }
    const line = Phaser.Utils.Array.GetRandom(lines);
    new SpeechBubble(this.scene, this.x, this.y - 80, line, {
      textColor: color,
      borderColor: 0xff44aa,
      fillColor: 0x1a0828,
      fontSize: '13px',
      tailDir: 1,
      duration: 1800,
    });
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
