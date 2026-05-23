// UIシーン: HP/コスト/WAVE表示、味方選択パネル
import { GAME_WIDTH, GAME_HEIGHT, PANEL_X, PANEL_WIDTH } from '../data/config.js';
import { ALLIES, MVP_ALLIES } from '../data/allies.js';
import { WAVES } from '../data/waves.js';

export class UIScene extends Phaser.Scene {
  constructor() {
    super('UIScene');
  }

  create() {
    const gameScene = this.scene.get('GameScene');

    // 右パネル背景
    const panelX = PANEL_X;
    const panelW = PANEL_WIDTH;
    this.add.rectangle(panelX, 0, panelW, GAME_HEIGHT, 0x0a0820, 0.5).setOrigin(0, 0);

    // タイトル
    this.add.text(panelX + 14, 14, 'SNS エリア（投稿選択）', {
      fontFamily: '"Noto Sans JP", sans-serif',
      fontSize: '15px',
      color: '#88ccff',
    });

    // WAVE / 残り敵数
    this.waveText = this.add.text(panelX + 14, 40, `WAVE 1 / ${WAVES.length}`, {
      fontSize: '18px', color: '#fff', fontStyle: 'bold',
    });
    this.enemiesText = this.add.text(panelX + 160, 44, '残り敵: -', {
      fontSize: '13px', color: '#ff99aa',
    });

    // コスト表示
    this.costText = this.add.text(panelX + 14, 70, 'コスト: 30 / 100', {
      fontSize: '16px', color: '#ffcc44',
    });

    // 味方カード: 2列 × 3行
    this.cards = [];
    const cardW = (panelW - 14 * 2 - 8) / 2; // 左右パディング14、中央ギャップ8
    const cardH = 140;
    const cardGapY = 10;
    const startY = 100;
    MVP_ALLIES.forEach((id, i) => {
      const a = ALLIES[id];
      const col = i % 2;
      const row = Math.floor(i / 2);
      const cx = panelX + 14 + col * (cardW + 8);
      const cy = startY + row * (cardH + cardGapY);
      const card = this.makeCard(cx, cy, cardW, cardH, a);
      this.cards.push({ id, container: card });
    });

    // ヘルプテキスト
    this.add.text(panelX + 14, GAME_HEIGHT - 88, [
      '操作: カード選択→セルクリックで配置',
      '勝利: 全WAVEクリア',
      '敗北: 主人公HPが0',
    ].join('\n'), {
      fontFamily: '"Noto Sans JP", sans-serif',
      fontSize: '11px',
      color: '#aabbdd',
      lineSpacing: 4,
    });

    // 主人公HPバー（左下）
    const hpBarY = GAME_HEIGHT - 30;
    const hpBarW = Math.min(360, panelX - 40);
    this.hpBarBg = this.add.rectangle(20, hpBarY, hpBarW, 22, 0x222233).setOrigin(0, 0.5);
    this.hpBar = this.add.rectangle(20, hpBarY, hpBarW, 22, 0xff4477).setOrigin(0, 0.5);
    this.hpText = this.add.text(20 + hpBarW / 2, hpBarY, '1250 / 1250', {
      fontSize: '14px', color: '#fff', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(20, hpBarY - 26, '主人公のメンタル（HP）', {
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
    gameScene.events.on('enemies-changed', (n) => {
      this.enemiesText.setText(`残り敵: ${n}`);
    });
    gameScene.events.on('selection-updated', (id) => {
      this.cards.forEach(c => {
        c.container.bg.setStrokeStyle(c.id === id ? 3 : 1, c.id === id ? 0xff66cc : 0x444466);
      });
    });
  }

  makeCard(x, y, w, h, a) {
    const bg = this.add.rectangle(x, y, w, h, 0x1a1430).setOrigin(0, 0).setStrokeStyle(1, 0x444466);
    const icon = this.add.image(x + 8, y + 8, a.texture).setOrigin(0, 0).setDisplaySize(40, 40);
    const name = this.add.text(x + 52, y + 8, a.name, {
      fontFamily: '"Noto Sans JP", sans-serif', fontSize: '12px', color: '#fff', fontStyle: 'bold',
      wordWrap: { width: w - 60 },
    });
    const cat = this.add.text(x + w - 24, y + 6, a.category, {
      fontSize: '12px', color: '#ff66aa', backgroundColor: '#330022', padding: { x: 3, y: 1 },
    }).setOrigin(0, 0);
    const stats = this.add.text(x + 8, y + 56, [
      `コスト: ${a.cost}`,
      `HP:${a.hp}  ATK:${a.atk}`,
    ].join('\n'), {
      fontFamily: '"Noto Sans JP", sans-serif', fontSize: '11px', color: '#cccccc', lineSpacing: 3,
    });

    // 射程ミニグリッド: 7×3 の 2D 帯で攻撃範囲を可視化 (中央が自分)
    const rangeLabel = this.add.text(x + 8, y + 92, '射程', {
      fontFamily: '"Noto Sans JP", sans-serif', fontSize: '10px', color: '#aabbdd',
    });
    const rangeGfx = this.add.graphics();
    this.drawRangeMiniGrid(rangeGfx, x + 38, y + 92, a.range);

    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerdown', () => {
      this.scene.get('GameScene').events.emit('select-ally', a.id);
    });
    bg.on('pointerover', () => bg.setFillStyle(0x261a40));
    bg.on('pointerout', () => bg.setFillStyle(0x1a1430));

    const container = { bg, icon, name, cat, stats, rangeLabel, rangeGfx };
    return container;
  }

  // 射程の視覚化: 7×3 の帯。中央が自分、ユークリッド距離 <= range で強調。
  drawRangeMiniGrid(gfx, startX, startY, range) {
    const cellW = 11, cellH = 11, gap = 1;
    const cols = 7;
    const rows = 3;
    const selfCol = 3;
    const selfRow = 1;
    const partialMax = range + 0.5;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const cx = startX + col * (cellW + gap);
        const cy = startY + row * (cellH + gap);
        const dx = col - selfCol;
        const dy = row - selfRow;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const isSelf = dx === 0 && dy === 0;
        const inFullRange = !isSelf && dist <= range;
        const isPartial = !isSelf && dist > range && dist <= partialMax;

        if (isSelf) {
          gfx.fillStyle(0xffcc44, 0.95).fillRect(cx, cy, cellW, cellH);
          gfx.lineStyle(1, 0xffdd66, 1).strokeRect(cx, cy, cellW, cellH);
        } else if (inFullRange) {
          gfx.fillStyle(0xff66cc, 0.85).fillRect(cx, cy, cellW, cellH);
          gfx.lineStyle(1, 0xff99dd, 0.9).strokeRect(cx, cy, cellW, cellH);
        } else if (isPartial) {
          gfx.fillStyle(0xff66cc, 0.4).fillRect(cx, cy, cellW, cellH);
          gfx.lineStyle(1, 0xff99dd, 0.55).strokeRect(cx, cy, cellW, cellH);
        } else {
          gfx.fillStyle(0x222233, 0.5).fillRect(cx, cy, cellW, cellH);
          gfx.lineStyle(1, 0x444466, 0.6).strokeRect(cx, cy, cellW, cellH);
        }
      }
    }
  }
}
