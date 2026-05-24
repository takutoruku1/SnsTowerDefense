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
    this.add.text(GAME_WIDTH / 2, titleY + 220, `全 ${WAVES.length} WAVE`, {
      fontFamily: '"Noto Sans JP", sans-serif',
      fontSize: '14px',
      color: '#ffcc44',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // === 主人公選択 ===
    if (!this.registry.has('selectedGender')) {
      this.registry.set('selectedGender', 'female'); // デフォルト
    }

    const charLabelY = titleY + 250;
    this.add.text(GAME_WIDTH / 2, charLabelY, '主人公を選択', {
      fontFamily: '"Noto Sans JP", sans-serif',
      fontSize: '14px',
      color: '#aabbdd',
    }).setOrigin(0.5);

    const cardW = 110, cardH = 130;
    const gapX = 60;
    const cardY = charLabelY + 20 + cardH / 2;
    const femaleX = GAME_WIDTH / 2 - (cardW + gapX) / 2;
    const maleX = GAME_WIDTH / 2 + (cardW + gapX) / 2;

    const femaleCard = this.makeCharCard(femaleX, cardY, cardW, cardH, '女', 'influencer_happy', 0xff66cc);
    const maleCard = this.makeCharCard(maleX, cardY, cardW, cardH, '男', 'influencer_male_happy', 0x66aaff);

    const updateSelection = () => {
      const sel = this.registry.get('selectedGender');
      femaleCard.bg.setStrokeStyle(sel === 'female' ? 3 : 1, sel === 'female' ? 0xff66cc : 0x444466);
      maleCard.bg.setStrokeStyle(sel === 'male' ? 3 : 1, sel === 'male' ? 0x66aaff : 0x444466);
    };
    updateSelection();

    femaleCard.bg.on('pointerdown', () => {
      this.registry.set('selectedGender', 'female');
      updateSelection();
    });
    maleCard.bg.on('pointerdown', () => {
      this.registry.set('selectedGender', 'male');
      updateSelection();
    });

    // スタートボタン
    const btnY = GAME_HEIGHT - 110;
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

    let starting = false;
    const startGame = () => {
      if (starting) return; // 二重起動防止
      starting = true;

      // BGM 再生開始 — 選択された主人公の性別で曲を切り替え
      const gender = this.registry.get('selectedGender') || 'female';
      const bgmKey = gender === 'male' ? 'bgm_main_male' : 'bgm_main';
      const otherKey = gender === 'male' ? 'bgm_main' : 'bgm_main_male';

      // 反対の BGM が鳴っていたら停止
      const otherBgm = this.sound.get(otherKey);
      if (otherBgm && otherBgm.isPlaying) otherBgm.stop();

      let bgm = this.sound.get(bgmKey);
      if (!bgm) bgm = this.sound.add(bgmKey, { loop: true, volume: 0.4 });
      if (!bgm.isPlaying) bgm.play();

      // 前回のセッションが残っていれば完全停止してから再起動
      this.scene.stop('UIScene');
      this.scene.stop('GameScene');
      this.scene.launch('UIScene');
      this.scene.start('GameScene');
    };
    btnBg.on('pointerdown', startGame);
    this.input.keyboard.on('keydown-SPACE', startGame);
    this.input.keyboard.on('keydown-ENTER', startGame);

    // シーン終了時に keyboard リスナーを掃除 (再 boot 時の二重発火を防ぐ)
    this.events.once('shutdown', () => {
      this.input.keyboard.off('keydown-SPACE', startGame);
      this.input.keyboard.off('keydown-ENTER', startGame);
    });

    // フッター
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 40, '操作: 右パネルの味方を選択 → 左フィールドのセルをクリックで配置', {
      fontFamily: '"Noto Sans JP", sans-serif',
      fontSize: '12px',
      color: '#8878a8',
    }).setOrigin(0.5);
  }

  makeCharCard(x, y, w, h, label, textureKey, accentColor) {
    const bg = this.add.rectangle(x, y, w, h, 0x1a0820)
      .setStrokeStyle(1, 0x444466)
      .setInteractive({ useHandCursor: true });

    // キャラクター画像 (縦横を中央寄せにスケール、上寄り)
    const img = this.add.image(x, y - 12, textureKey).setDisplaySize(70, 90);

    // ラベル (下端)
    const labelText = this.add.text(x, y + h / 2 - 14, label, {
      fontFamily: '"Noto Sans JP", sans-serif',
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    bg.on('pointerover', () => bg.setFillStyle(0x2a0a35));
    bg.on('pointerout', () => bg.setFillStyle(0x1a0820));

    return { bg, img, labelText, accentColor };
  }
}
