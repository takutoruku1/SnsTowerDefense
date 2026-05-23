// 吹き出し: 敵/主人公/味方の発言を一定時間表示してフェードアウト
// new SpeechBubble(scene, x, y, '死ねよww', { textColor: '#ffcc66', ... })

export class SpeechBubble extends Phaser.GameObjects.Container {
  constructor(scene, x, y, line, opts = {}) {
    super(scene, x, y);
    scene.add.existing(this);

    const {
      textColor = '#ffcc66',
      borderColor = 0xff77cc,
      fillColor = 0x140828,
      fontSize = '13px',
      tailDir = 1,        // 1: tail at bottom, -1: tail at top
      duration = 1400,    // hold duration before fade out
      depth = 50,
    } = opts;

    this.setDepth(depth);

    this.text = scene.add.text(0, 0, line, {
      fontFamily: '"Noto Sans JP", sans-serif',
      fontSize,
      color: textColor,
    }).setOrigin(0.5);

    const padX = 10;
    const padY = 5;
    const w = Math.ceil(this.text.width + padX * 2);
    const h = Math.ceil(this.text.height + padY * 2);

    this.bg = scene.add.graphics();
    // 本体 (塗り)
    this.bg.fillStyle(fillColor, 0.92);
    this.bg.fillRoundedRect(-w / 2, -h / 2, w, h, 6);
    // しっぽ (塗り)
    const tt = 6;
    this.bg.fillTriangle(
      -tt, (h / 2) * tailDir,
      tt, (h / 2) * tailDir,
      0, (h / 2 + tt) * tailDir
    );
    // 枠線
    this.bg.lineStyle(1.5, borderColor, 0.9);
    this.bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 6);
    // しっぽの輪郭 (2辺だけ描画して本体側は描かない)
    this.bg.lineBetween(-tt, (h / 2) * tailDir, 0, (h / 2 + tt) * tailDir);
    this.bg.lineBetween(0, (h / 2 + tt) * tailDir, tt, (h / 2) * tailDir);

    this.add([this.bg, this.text]);

    this.setScale(0.6);
    this.setAlpha(0);

    // 出現演出
    scene.tweens.add({
      targets: this,
      scale: 1,
      alpha: 1,
      duration: 160,
      ease: 'Back.easeOut',
    });

    // ホールド → フェードアウト
    scene.time.delayedCall(duration, () => {
      if (!this.scene) return;
      scene.tweens.add({
        targets: this,
        y: this.y - 20,
        alpha: 0,
        duration: 350,
        ease: 'Quad.easeIn',
        onComplete: () => this.destroy(),
      });
    });
  }
}
