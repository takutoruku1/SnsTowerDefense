// UIシーン: HP/コスト/WAVE表示、味方選択パネル
import { GAME_WIDTH, GAME_HEIGHT } from '../data/config.js';
import { ALLIES, MVP_ALLIES } from '../data/allies.js';

export class UIScene extends Phaser.Scene {
  constructor() {
    super('UIScene');
  }

  create() {
    const gameScene = this.scene.get('GameScene');

    // 右パネル背景
    const panelX = GAME_WIDTH * 0.62;
    const panelW = GAME_WIDTH - panelX;
    this.add.rectangle(panelX, 0, panelW, GAME_HEIGHT, 0x0a0820, 0.5).setOrigin(0, 0);

    // タイトル
    this.add.text(panelX + 20, 18, 'SNS エリア（投稿選択）', {
      fontFamily: '"Noto Sans JP", sans-serif',
      fontSize: '16px',
      color: '#88ccff',
    });

    // WAVE / 残り敵数
    this.waveText = this.add.text(panelX + 20, 50, 'WAVE 1 / 1', {
      fontSize: '20px', color: '#fff', fontStyle: 'bold',
    });

    // コスト表示
    this.costText = this.add.text(panelX + 20, 80, 'コスト: 30 / 100', {
      fontSize: '18px', color: '#ffcc44',
    });

    // 味方カード（MVP: 2枚）
    this.cards = [];
    MVP_ALLIES.forEach((id, i) => {
      const a = ALLIES[id];
      const cx = panelX + 30 + (i % 2) * 220;
      const cy = 130 + Math.floor(i / 2) * 150;
      const card = this.makeCard(cx, cy, a);
      this.cards.push({ id, container: card });
    });

    // ヘルプテキスト
    this.add.text(panelX + 20, GAME_HEIGHT - 90, [
      '操作: 右カードを選択 → 左フィールドのセルをクリックで配置',
      '勝利: 全WAVEクリア',
      '敗北: 主人公HPが0',
    ].join('\n'), {
      fontFamily: '"Noto Sans JP", sans-serif',
      fontSize: '12px',
      color: '#aabbdd',
      lineSpacing: 4,
    });

    // 主人公HPバー（左下）
    this.hpBarBg = this.add.rectangle(20, GAME_HEIGHT - 40, 360, 22, 0x222233).setOrigin(0, 0.5);
    this.hpBar = this.add.rectangle(20, GAME_HEIGHT - 40, 360, 22, 0xff4477).setOrigin(0, 0.5);
    this.hpText = this.add.text(200, GAME_HEIGHT - 40, '1250 / 1250', {
      fontSize: '14px', color: '#fff', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(20, GAME_HEIGHT - 68, '主人公のメンタル（HP）', {
      fontSize: '12px', color: '#ff88aa',
    });

    // イベント受信
    gameScene.events.on('cost-changed', (cost, max) => {
      this.costText.setText(`コスト: ${cost} / ${max}`);
    });
    gameScene.events.on('hp-changed', (hp, max) => {
      this.hpText.setText(`${hp} / ${max}`);
      this.hpBar.width = 360 * (hp / max);
    });
    gameScene.events.on('wave-changed', (cur, total) => {
      this.waveText.setText(`WAVE ${cur} / ${total}`);
    });
    gameScene.events.on('selection-updated', (id) => {
      this.cards.forEach(c => {
        c.container.bg.setStrokeStyle(c.id === id ? 3 : 1, c.id === id ? 0xff66cc : 0x444466);
      });
    });
  }

  makeCard(x, y, a) {
    const w = 200, h = 130;
    const bg = this.add.rectangle(x, y, w, h, 0x1a1430).setOrigin(0, 0).setStrokeStyle(1, 0x444466);
    const icon = this.add.image(x + 16, y + 16, a.texture).setOrigin(0, 0).setDisplaySize(50, 50);
    const name = this.add.text(x + 76, y + 16, a.name, {
      fontFamily: '"Noto Sans JP", sans-serif', fontSize: '14px', color: '#fff', fontStyle: 'bold',
    });
    const cat = this.add.text(x + w - 32, y + 16, a.category, {
      fontSize: '14px', color: '#ff66aa', backgroundColor: '#330022', padding: { x: 4, y: 2 },
    });
    const stats = this.add.text(x + 16, y + 76, [
      `コスト: ${a.cost}`,
      `HP: ${a.hp}    ATK: ${a.atk}    射程: ${a.range}`,
    ].join('\n'), {
      fontFamily: '"Noto Sans JP", sans-serif', fontSize: '12px', color: '#cccccc', lineSpacing: 4,
    });

    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerdown', () => {
      this.scene.get('GameScene').events.emit('select-ally', a.id);
    });
    bg.on('pointerover', () => bg.setFillStyle(0x261a40));
    bg.on('pointerout', () => bg.setFillStyle(0x1a1430));

    const container = { bg, icon, name, cat, stats };
    return container;
  }
}
