// メインゲームシーン: フィールド描画、敵スポーン、味方配置、勝敗判定
import {
  GAME_WIDTH, GAME_HEIGHT,
  GRID_COLS, GRID_ROWS, CELL_SIZE,
  FIELD_X, FIELD_Y,
  INFLUENCER_X, INFLUENCER_Y,
  COST_START, COST_MAX, COST_REGEN_PER_SEC,
  perspectiveX, entityScaleAtRow, rowAtY,
} from '../data/config.js';
import { ALLIES, MVP_ALLIES } from '../data/allies.js';
import { WAVES } from '../data/waves.js';
import { Influencer } from '../entities/Influencer.js';
import { Enemy } from '../entities/Enemy.js';
import { Ally } from '../entities/Ally.js';
import { Comment } from '../entities/Comment.js';

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

    // 主人公（フィールド右隣 = 最前列扱いで透視配置）
    const infRow = rowAtY(INFLUENCER_Y);
    const infX = perspectiveX(INFLUENCER_X, infRow);
    this.influencer = new Influencer(this, infX, INFLUENCER_Y);
    this.influencer.setScale(entityScaleAtRow(infRow));
    this.influencer.setDepth(INFLUENCER_Y);

    // 状態
    this.cost = COST_START;
    this.enemies = [];
    this.allies = [];
    this.comments = []; // 飛行中のコメント
    this.selectedAllyId = null;
    this.cellOccupancy = Array.from({ length: GRID_COLS }, () => Array(GRID_ROWS).fill(null));
    this.gameOver = false;
    this.waveCleared = false;
    this.currentWaveIdx = 0;

    // セルクリックで配置
    this.setupGridInput();

    // 敵撃破
    this.events.on('enemy-killed', (enemy) => {
      this.enemies = this.enemies.filter(e => e !== enemy);
      this.events.emit('enemies-changed', this.remainingCount());
      if (this.waveFinished && this.enemies.length === 0) {
        this.handleWaveClear();
      }
    });

    // 味方撃破: 配列とセル占有から取り除く
    this.events.on('ally-killed', (ally) => {
      this.allies = this.allies.filter(a => a !== ally);
      for (let c = 0; c < GRID_COLS; c++) {
        for (let r = 0; r < GRID_ROWS; r++) {
          if (this.cellOccupancy[c][r] === ally) this.cellOccupancy[c][r] = null;
        }
      }
    });

    // UI側からのイベント
    this.events.on('select-ally', (id) => {
      this.selectedAllyId = id;
      this.events.emit('selection-updated', id);
    });

    // WAVE 開始 (初回だけ準備時間を長めに)
    this.startWave(0);

    // 初期UI更新
    this.events.emit('cost-changed', Math.floor(this.cost), COST_MAX);
    this.events.emit('hp-changed', this.influencer.hp, this.influencer.maxHp);
  }

  drawGrid() {
    const yTop = FIELD_Y;
    const yBot = FIELD_Y + GRID_ROWS * CELL_SIZE;

    // フィールド床（台形）: 奥行きを強調するため少し暗めの面を敷く
    const floor = this.add.graphics();
    const xTL = perspectiveX(FIELD_X, 0);
    const xTR = perspectiveX(FIELD_X + GRID_COLS * CELL_SIZE, 0);
    const xBL = perspectiveX(FIELD_X, GRID_ROWS);
    const xBR = perspectiveX(FIELD_X + GRID_COLS * CELL_SIZE, GRID_ROWS);
    floor.fillStyle(0x1a0612, 0.55);
    floor.fillPoints([
      { x: xTL, y: yTop },
      { x: xTR, y: yTop },
      { x: xBR, y: yBot },
      { x: xBL, y: yBot },
    ], true);

    const g = this.add.graphics();
    g.lineStyle(1, 0xff44aa, 0.28);

    // 縦線（消失点に向かう奥行きライン）
    for (let c = 0; c <= GRID_COLS; c++) {
      const lx = FIELD_X + c * CELL_SIZE;
      g.beginPath();
      g.moveTo(perspectiveX(lx, 0), yTop);
      g.lineTo(perspectiveX(lx, GRID_ROWS), yBot);
      g.strokePath();
    }
    // 横線（手前ほど横幅が広い）
    for (let r = 0; r <= GRID_ROWS; r++) {
      const y = FIELD_Y + r * CELL_SIZE;
      g.beginPath();
      g.moveTo(perspectiveX(FIELD_X, r), y);
      g.lineTo(perspectiveX(FIELD_X + GRID_COLS * CELL_SIZE, r), y);
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
    const lx0 = FIELD_X + c * CELL_SIZE;
    const lx1 = lx0 + CELL_SIZE;
    const y0 = FIELD_Y + r * CELL_SIZE;
    const y1 = y0 + CELL_SIZE;
    const pts = [
      { x: perspectiveX(lx0, r),     y: y0 },
      { x: perspectiveX(lx1, r),     y: y0 },
      { x: perspectiveX(lx1, r + 1), y: y1 },
      { x: perspectiveX(lx0, r + 1), y: y1 },
    ];
    this.cellHighlight.fillStyle(0xff44aa, 0.18);
    this.cellHighlight.fillPoints(pts, true);
    this.cellHighlight.lineStyle(2, 0xff66cc, 0.85);
    this.cellHighlight.strokePoints(pts, true);
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
    // 透視: セル中心行で X を絞り、行に応じた表示倍率を適用
    const rowCenter = r + 0.5;
    const px = perspectiveX(x, rowCenter);
    const ally = new Ally(this, px, y, this.selectedAllyId);
    ally.setScale(entityScaleAtRow(rowCenter));
    ally.setDepth(y);
    this.allies.push(ally);
    this.cellOccupancy[c][r] = ally;
    this.events.emit('cost-changed', Math.floor(this.cost), COST_MAX);
  }

  flashCostInsufficient() {
    this.cameras.main.flash(120, 80, 0, 0);
  }

  startWave(idx) {
    this.currentWaveIdx = idx;
    const wave = WAVES[idx];
    this.waveFinished = false;
    this.pendingSpawns = wave.spawns.length;
    this.events.emit('wave-changed', idx + 1, WAVES.length);
    this.events.emit('enemies-changed', this.remainingCount());

    // 準備時間: 初回 WAVE は 3 秒、それ以降は 0.8 秒
    const prepMs = idx === 0 ? 3000 : 800;
    this.showWaveStartBanner(idx + 1, prepMs);

    wave.spawns.forEach(spawn => {
      this.time.delayedCall(prepMs + spawn.delayMs, () => {
        this.spawnEnemy(spawn.enemyId, spawn.lane);
      });
    });

    // 全スポーン完了をマーク
    const last = Math.max(...wave.spawns.map(s => s.delayMs));
    this.time.delayedCall(prepMs + last + 100, () => {
      this.waveFinished = true;
      if (this.enemies.length === 0 && !this.gameOver) this.handleWaveClear();
    });
  }

  showWaveStartBanner(waveNum, durationMs) {
    const main = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20, `WAVE ${waveNum}`, {
      fontFamily: '"Noto Sans JP", sans-serif',
      fontSize: '54px',
      color: '#ff77cc',
      stroke: '#1a0520',
      strokeThickness: 6,
      fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0).setDepth(2500);
    const sub = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30, '炎上が迫っています…', {
      fontFamily: '"Noto Sans JP", sans-serif',
      fontSize: '16px',
      color: '#ffffff',
    }).setOrigin(0.5).setAlpha(0).setDepth(2500);

    this.tweens.add({
      targets: [main, sub],
      alpha: 1,
      duration: 220,
      onComplete: () => {
        // バナーは prep の長さに応じて表示し、終わる前にフェード
        const hold = Math.max(0, durationMs - 600);
        this.time.delayedCall(hold, () => {
          this.tweens.add({
            targets: [main, sub],
            alpha: 0,
            duration: 350,
            onComplete: () => { main.destroy(); sub.destroy(); },
          });
        });
      },
    });
  }

  spawnEnemy(enemyId, lane) {
    if (this.gameOver) return;
    const rowCenter = lane + 0.5;
    const x = perspectiveX(FIELD_X - 40, rowCenter);
    const y = FIELD_Y + lane * CELL_SIZE + CELL_SIZE / 2;
    const enemy = new Enemy(this, x, y, enemyId, this.influencer);
    this.enemies.push(enemy);
    if (this.pendingSpawns > 0) this.pendingSpawns -= 1;
    this.events.emit('enemies-changed', this.remainingCount());
  }

  remainingCount() {
    // まだ出現していない＋出現中の敵の合計
    return this.enemies.length + (this.pendingSpawns || 0);
  }

  handleGameOver() {
    this.gameOver = true;
    this.showEndMessage('GAME OVER', '#ff3366', '主人公のメンタルが崩壊した…');
  }

  handleWaveClear() {
    if (this.waveCleared) return;
    this.waveCleared = true;

    const isLast = this.currentWaveIdx >= WAVES.length - 1;
    if (isLast) {
      this.gameOver = true;
      this.showEndMessage('GAME CLEAR!', '#ffcc44', '全ての炎上を完全鎮火した！');
    } else {
      this.showWaveClearBanner(() => {
        this.waveCleared = false;
        this.startWave(this.currentWaveIdx + 1);
      });
    }
  }

  showWaveClearBanner(onDone) {
    const main = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, `WAVE ${this.currentWaveIdx + 1} CLEAR!`, {
      fontFamily: '"Noto Sans JP", sans-serif',
      fontSize: '64px',
      color: '#ffcc44',
      stroke: '#000',
      strokeThickness: 6,
      fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0);
    const sub = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60, '次の炎上が迫っています…', {
      fontFamily: '"Noto Sans JP", sans-serif',
      fontSize: '18px',
      color: '#ffffff',
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: [main, sub],
      alpha: 1,
      duration: 300,
      onComplete: () => {
        this.time.delayedCall(1800, () => {
          this.tweens.add({
            targets: [main, sub],
            alpha: 0,
            duration: 400,
            onComplete: () => {
              main.destroy();
              sub.destroy();
              onDone();
            },
          });
        });
      },
    });
  }

  showEndMessage(text, color, sub) {
    const overlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6);
    const main = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 70, text, {
      fontFamily: '"Noto Sans JP", sans-serif',
      fontSize: '72px',
      color,
      stroke: '#000',
      strokeThickness: 6,
      fontStyle: 'bold',
    }).setOrigin(0.5);
    const subText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10, sub, {
      fontFamily: '"Noto Sans JP", sans-serif',
      fontSize: '22px',
      color: '#ffffff',
    }).setOrigin(0.5);

    const btnY = GAME_HEIGHT / 2 + 100;
    const btn = this.add.rectangle(GAME_WIDTH / 2, btnY, 260, 56, 0x1a0520)
      .setStrokeStyle(2, 0xff44aa)
      .setInteractive({ useHandCursor: true });
    const btnText = this.add.text(GAME_WIDTH / 2, btnY, 'タイトルへ戻る', {
      fontFamily: '"Noto Sans JP", sans-serif',
      fontSize: '20px',
      color: '#ff77cc',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    [overlay, main, subText, btn, btnText].forEach(o => o.setAlpha(0));
    this.tweens.add({ targets: [overlay, main, subText, btn, btnText], alpha: 1, duration: 400 });

    btn.on('pointerover', () => btn.setFillStyle(0x2a0a35));
    btn.on('pointerout', () => btn.setFillStyle(0x1a0520));
    btn.on('pointerdown', () => {
      this.scene.stop('UIScene');
      this.scene.start('TitleScene');
    });
  }

  update(time, delta) {
    if (this.gameOver) return;

    // コスト自動回復
    this.cost = Math.min(COST_MAX, this.cost + COST_REGEN_PER_SEC * (delta / 1000));
    this.events.emit('cost-changed', Math.floor(this.cost), COST_MAX);

    // 敵更新（同レーンの味方をブロッカーとして殴る）
    this.enemies.forEach(e => e.update(time, delta, this.allies));
    // 味方更新（射程内の敵を狙う）
    this.allies.forEach(a => a.update(time, delta, this.enemies));

    // コメント移動
    this.comments.forEach(c => c.step(delta));
    // 衝突解決
    this.resolveCommentCollisions();
    // destroyed されたコメントを掃除
    this.comments = this.comments.filter(c => c.scene);
  }

  addComment(side, x, y, text, atk) {
    const c = new Comment(this, x, y, { side, text, hp: atk, damage: atk });
    this.comments.push(c);
    return c;
  }

  resolveCommentCollisions() {
    const HIT = 26;
    const HIT_SQ = HIT * HIT;
    const LANE_TOL = CELL_SIZE * 0.55;
    const HIT_TARGET = 30;
    const INF_HIT_X = 60;
    const INF_LANE_TOL = 160;

    // 1) コメント同士 (敵 vs 味方): 互いに削り合う
    for (let i = 0; i < this.comments.length; i++) {
      const a = this.comments[i];
      if (a.dead || a.side !== 'enemy') continue;
      for (let j = 0; j < this.comments.length; j++) {
        const b = this.comments[j];
        if (b.dead || b.side !== 'ally') continue;
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        if (dx * dx + dy * dy < HIT_SQ) {
          const ad = a.damage, bd = b.damage;
          a.hit(bd);
          b.hit(ad);
        }
      }
    }

    // 2) 味方コメント → 敵 にヒット
    for (const c of this.comments) {
      if (c.dead || c.side !== 'ally') continue;
      for (const e of this.enemies) {
        if (!e.alive) continue;
        if (Math.abs(e.y - c.y) > LANE_TOL) continue;
        if (Math.abs(e.x - c.x) < HIT_TARGET) {
          e.takeDamage(c.damage);
          c.fade();
          break;
        }
      }
    }

    // 3) 敵コメント → 味方 (Ally) にヒット
    for (const c of this.comments) {
      if (c.dead || c.side !== 'enemy') continue;
      for (const ally of this.allies) {
        if (!ally.alive) continue;
        if (Math.abs(ally.y - c.y) > LANE_TOL) continue;
        if (Math.abs(ally.x - c.x) < HIT_TARGET) {
          ally.takeDamage(c.damage);
          c.fade();
          break;
        }
      }
    }

    // 4) 敵コメント → 主人公
    for (const c of this.comments) {
      if (c.dead || c.side !== 'enemy') continue;
      if (Math.abs(this.influencer.y - c.y) > INF_LANE_TOL) continue;
      if (Math.abs(this.influencer.x - c.x) < INF_HIT_X) {
        const dead = this.influencer.takeDamage(c.damage);
        this.events.emit('hp-changed', this.influencer.hp, this.influencer.maxHp);
        if (dead) this.handleGameOver();
        c.fade();
      }
    }
  }
}
