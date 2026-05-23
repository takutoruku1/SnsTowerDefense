// タイトルシーン: ゲーム開始前の入り口
// クリック / スペースキーで GameScene + UIScene に遷移
import { GAME_WIDTH, GAME_HEIGHT } from '../data/config.js';
import { WAVES } from '../data/waves.js';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
  }

  create() {
    // ゲームシーンが残っていれば停止
    if (this.scene.isActive('GameScene')) this.scene.stop('GameScene');
    if (this.scene.isActive('UIScene')) this.scene.stop('UIScene');

    // 背景
    this.cameras.main.setBackgroundColor('#0a0518');
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x2a0a3a, 0x2a0a3a, 0x0a0518, 0x0a0518, 1, 1, 1, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // 装飾: ピンクの放射状の輝き
    const glow = this.add.graphics();
    glow.fillStyle(0xff44aa, 0.08);
    glow.fillCircle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 380);
    glow.fillStyle(0xff44aa, 0.05);
    glow.fillCircle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 540);

    // タイトル本体
    const titleY = 200;
    const title = this.add.text(GAME_WIDTH / 2, titleY, 'SNS × タワーディフェンス', {
      fontFamily: '"Noto Sans JP", "Hiragino Sans", sans-serif',
      fontSize: '64px',
      color: '#ff77cc',
      fontStyle: 'bold',
      stroke: '#1a0520',
      strokeThickness: 8,
    }).setOrigin(0.5);

    // タイトルのほのかな脈動
    this.tweens.add({
      targets: title,
      scale: { from: 1, to: 1.04 },
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // サブタイトル / リード文
    this.add.text(GAME_WIDTH / 2, titleY + 80, '最強の炎上女王になるのは、炎上の渦中のアタシだ。', {
      fontFamily: '"Noto Sans JP", sans-serif',
      fontSize: '20px',
      color: '#ff99cc',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // ゲーム概要
    this.add.text(GAME_WIDTH / 2, titleY + 140, [
      '主人公は炎上系インフルエンサー。',
      'TLから集めた「味方の罵詈雑言」や「擁護コメント」を配置して、',
      '襲い来る炎上を撃退せよ！',
    ].join('\n'), {
      fontFamily: '"Noto Sans JP", sans-serif',
      fontSize: '15px',
      color: '#b6a8d4',
      align: 'center',
      lineSpacing: 8,
    }).setOrigin(0.5);

    // WAVE 数の案内
    this.add.text(GAME_WIDTH / 2, titleY + 230, `全 ${WAVES.length} WAVE`, {
      fontFamily: '"Noto Sans JP", sans-serif',
      fontSize: '16px',
      color: '#ffcc44',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // スタートボタン
    const btnY = GAME_HEIGHT - 180;
    const btnBg = this.add.rectangle(GAME_WIDTH / 2, btnY, 320, 64, 0x1a0520)
      .setStrokeStyle(2, 0xff44aa)
      .setInteractive({ useHandCursor: true });
    const btnText = this.add.text(GAME_WIDTH / 2, btnY, 'クリックして開始', {
      fontFamily: '"Noto Sans JP", sans-serif',
      fontSize: '24px',
      color: '#ff77cc',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // ボタンの脈動
    this.tweens.add({
      targets: [btnBg, btnText],
      alpha: { from: 1, to: 0.65 },
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    btnBg.on('pointerover', () => {
      btnBg.setFillStyle(0x2a0a35);
      btnBg.setStrokeStyle(3, 0xff77cc);
    });
    btnBg.on('pointerout', () => {
      btnBg.setFillStyle(0x1a0520);
      btnBg.setStrokeStyle(2, 0xff44aa);
    });

    const startGame = () => {
      // BGM 再生開始 (autoplay 制限回避のためユーザー操作のタイミングで)
      let bgm = this.sound.get('bgm_main');
      if (!bgm) bgm = this.sound.add('bgm_main', { loop: true, volume: 0.4 });
      if (!bgm.isPlaying) bgm.play();

      this.scene.start('GameScene');
      this.scene.launch('UIScene');
    };
    btnBg.on('pointerdown', startGame);
    this.input.keyboard.on('keydown-SPACE', startGame);
    this.input.keyboard.on('keydown-ENTER', startGame);

    // フッター
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 40, '操作: 右パネルの味方を選択 → 左フィールドのセルをクリックで配置', {
      fontFamily: '"Noto Sans JP", sans-serif',
      fontSize: '12px',
      color: '#8878a8',
    }).setOrigin(0.5);
  }
}
