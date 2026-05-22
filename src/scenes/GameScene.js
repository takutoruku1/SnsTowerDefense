// メインゲームシーン: フィールド描画、敵スポーン、味方配置、勝敗判定
import {
  GAME_WIDTH, GAME_HEIGHT,
  GRID_COLS, GRID_ROWS, CELL_SIZE,
  FIELD_X, FIELD_Y,
  INFLUENCER_X, INFLUENCER_Y,
  COST_START, COST_MAX, COST_REGEN_PER_SEC,
} from '../data/config.js';
import { ALLIES, MVP_ALLIES } from '../data/allies.js';
import { WAVES } from '../data/waves.js';
import { Influencer } from '../entities/Influencer.js';
import { Enemy } from '../entities/Enemy.js';
import { Ally } from '../entities/Ally.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    this.cameras.main.setBackgroundColor('#0c0918');

    // 背景: SNS的なざらつき
    const bg = this.add.graphics();
    bg.fillStyle(0x1a0a1f, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // 炎上エリア（左半分）と SNSエリア（右半分）の境界
    bg.fillStyle(0x2a0815, 0.4);
    bg.fillRect(0, 0, GAME_WIDTH * 0.62, GAME_HEIGHT);
    bg.fillStyle(0x0c1530, 0.4);
    bg.fillRect(GAME_WIDTH * 0.62, 0, GAME_WIDTH * 0.38, GAME_HEIGHT);

    // タイトル
    this.add.text(20, 16, 'SNS × タワーディフェンス', {
      fontFamily: '"Noto Sans JP", sans-serif',
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    this.add.text(20, 50, '炎上エリア', { fontSize: '16px', color: '#ff6688' });

    // グリッド描画
    this.drawGrid();

    // 主人公
    this.influencer = new Influencer(this, INFLUENCER_X, INFLUENCER_Y);

    // 状態
    this.cost = COST_START;
    this.enemies = [];
    this.allies = [];
    this.selectedAllyId = null;
    this.cellOccupancy = Array.from({ length: GRID_COLS }, () => Array(GRID_ROWS).fill(null));
    this.gameOver = false;
    this.waveCleared = false;

    // セルクリックで配置
    this.setupGridInput();

    // 敵の話しかけで主人公にダメージ
    this.events.on('enemy-talk', (atk) => {
      if (this.gameOver) return;
      const dead = this.influencer.takeDamage(atk);
      this.events.emit('hp-changed', this.influencer.hp, this.influencer.maxHp);
      if (dead) this.handleGameOver();
    });

    // 敵撃破
    this.events.on('enemy-killed', (enemy) => {
      this.enemies = this.enemies.filter(e => e !== enemy);
      this.events.emit('enemies-changed', this.remainingCount());
      if (this.waveFinished && this.enemies.length === 0) {
        this.handleWaveClear();
      }
    });

    // UI側からのイベント
    this.events.on('select-ally', (id) => {
      this.selectedAllyId = id;
      this.events.emit('selection-updated', id);
    });

    // WAVE 開始
    this.startWave(0);

    // 初期UI更新
    this.events.emit('cost-changed', Math.floor(this.cost), COST_MAX);
    this.events.emit('hp-changed', this.influencer.hp, this.influencer.maxHp);
    this.events.emit('wave-changed', 1, WAVES.length);
  }

  drawGrid() {
    const g = this.add.graphics();
    g.lineStyle(1, 0xff44aa, 0.25);
    for (let c = 0; c <= GRID_COLS; c++) {
      g.beginPath();
      g.moveTo(FIELD_X + c * CELL_SIZE, FIELD_Y);
      g.lineTo(FIELD_X + c * CELL_SIZE, FIELD_Y + GRID_ROWS * CELL_SIZE);
      g.strokePath();
    }
    for (let r = 0; r <= GRID_ROWS; r++) {
      g.beginPath();
      g.moveTo(FIELD_X, FIELD_Y + r * CELL_SIZE);
      g.lineTo(FIELD_X + GRID_COLS * CELL_SIZE, FIELD_Y + r * CELL_SIZE);
      g.strokePath();
    }
  }

  setupGridInput() {
    for (let c = 0; c < GRID_COLS; c++) {
      for (let r = 0; r < GRID_ROWS; r++) {
        const x = FIELD_X + c * CELL_SIZE + CELL_SIZE / 2;
        const y = FIELD_Y + r * CELL_SIZE + CELL_SIZE / 2;
        const zone = this.add.zone(x, y, CELL_SIZE, CELL_SIZE).setInteractive();
        zone.on('pointerdown', () => this.tryPlace(c, r, x, y));
        zone.on('pointerover', () => this.highlightCell(c, r, true));
        zone.on('pointerout', () => this.highlightCell(c, r, false));
      }
    }
    this.cellHighlight = this.add.graphics();
  }

  highlightCell(c, r, on) {
    this.cellHighlight.clear();
    if (!on || !this.selectedAllyId || this.cellOccupancy[c][r]) return;
    const x = FIELD_X + c * CELL_SIZE;
    const y = FIELD_Y + r * CELL_SIZE;
    this.cellHighlight.fillStyle(0xff44aa, 0.18);
    this.cellHighlight.fillRect(x, y, CELL_SIZE, CELL_SIZE);
    this.cellHighlight.lineStyle(2, 0xff66cc, 0.8);
    this.cellHighlight.strokeRect(x, y, CELL_SIZE, CELL_SIZE);
  }

  tryPlace(c, r, x, y) {
    if (this.gameOver || !this.selectedAllyId) return;
    if (this.cellOccupancy[c][r]) return;
    const data = ALLIES[this.selectedAllyId];
    if (this.cost < data.cost) {
      this.flashCostInsufficient();
      return;
    }
    this.cost -= data.cost;
    const ally = new Ally(this, x, y, this.selectedAllyId);
    this.allies.push(ally);
    this.cellOccupancy[c][r] = ally;
    this.events.emit('cost-changed', Math.floor(this.cost), COST_MAX);
  }

  flashCostInsufficient() {
    this.cameras.main.flash(120, 80, 0, 0);
  }

  startWave(idx) {
    const wave = WAVES[idx];
    this.waveFinished = false;
    this.remainingEnemyCount = wave.spawns.length;
    this.events.emit('enemies-changed', this.remainingCount());

    wave.spawns.forEach(spawn => {
      this.time.delayedCall(spawn.delayMs, () => {
        this.spawnEnemy(spawn.enemyId, spawn.lane);
      });
    });

    // 全スポーン完了をマーク
    const last = Math.max(...wave.spawns.map(s => s.delayMs));
    this.time.delayedCall(last + 100, () => {
      this.waveFinished = true;
      if (this.enemies.length === 0 && !this.gameOver) this.handleWaveClear();
    });
  }

  spawnEnemy(enemyId, lane) {
    if (this.gameOver) return;
    const x = FIELD_X + GRID_COLS * CELL_SIZE + 40;
    const y = FIELD_Y + lane * CELL_SIZE + CELL_SIZE / 2;
    const enemy = new Enemy(this, x, y, enemyId, this.influencer);
    this.enemies.push(enemy);
  }

  remainingCount() {
    // まだ出現していない＋出現中の敵の合計
    return this.enemies.length + this.pendingSpawnCount();
  }

  pendingSpawnCount() {
    // 簡易: スポーン完了フラグまでの残数を推定（厳密版が必要なら別実装に）
    return this.waveFinished ? 0 : 0;
  }

  handleGameOver() {
    this.gameOver = true;
    this.showCenterMessage('GAME OVER', '#ff3366', '主人公のメンタルが崩壊した…');
  }

  handleWaveClear() {
    if (this.waveCleared) return;
    this.waveCleared = true;
    this.gameOver = true;
    this.showCenterMessage('WAVE CLEAR!', '#ffcc44', '炎上を完全鎮火！');
  }

  showCenterMessage(text, color, sub) {
    const overlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.5);
    const main = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20, text, {
      fontFamily: '"Noto Sans JP", sans-serif',
      fontSize: '72px',
      color,
      stroke: '#000',
      strokeThickness: 6,
      fontStyle: 'bold',
    }).setOrigin(0.5);
    const subText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50, sub, {
      fontFamily: '"Noto Sans JP", sans-serif',
      fontSize: '22px',
      color: '#ffffff',
    }).setOrigin(0.5);
    overlay.setAlpha(0);
    main.setAlpha(0);
    subText.setAlpha(0);
    this.tweens.add({ targets: [overlay, main, subText], alpha: 1, duration: 400 });
  }

  update(time, delta) {
    if (this.gameOver) return;

    // コスト自動回復
    this.cost = Math.min(COST_MAX, this.cost + COST_REGEN_PER_SEC * (delta / 1000));
    this.events.emit('cost-changed', Math.floor(this.cost), COST_MAX);

    // 敵更新
    this.enemies.forEach(e => e.update(time, delta));
    // 味方更新（射程内の敵を狙う）
    this.allies.forEach(a => a.update(time, delta, this.enemies));
  }
}
