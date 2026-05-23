// 敵（罵言雑言）
// 左からフィールドを横切り、停止状態 (主人公の射程内 or 味方ブロック中) でコメントを連射する
import { ENEMIES } from '../data/enemies.js';
import { ENEMY_TALK_RANGE, ENEMY_TALK_INTERVAL_MS, CELL_SIZE, entityScaleAtRow, rowAtY } from '../data/config.js';

// 自分より右(影響者側) かつ同レーンにある最も近い生存 Ally を返す
function findBlockingAlly(enemy, allies) {
  const laneTol = CELL_SIZE * 0.6;
  let best = null;
  let bestDx = Infinity;
  for (const a of allies) {
    if (!a.alive) continue;
    const dx = a.x - enemy.x;
    if (dx <= 0) continue; // 自分より左/同位置は無視
    if (Math.abs(a.y - enemy.y) > laneTol) continue;
    if (dx < bestDx) {
      bestDx = dx;
      best = a;
    }
  }
  return best;
}

export class Enemy extends Phaser.GameObjects.Container {
  constructor(scene, x, y, enemyId, influencer) {
    super(scene, x, y);
    scene.add.existing(this);

    this.data_ = ENEMIES[enemyId];
    this.hp = this.data_.hp;
    this.influencer = influencer;
    this.lastTalkAt = 0;

    const displaySize = this.data_.radius * 3.5;

    // 足元の影（最下層）
    const shadowW = displaySize * 0.7;
    const shadowH = Math.max(8, displaySize * 0.22);
    this.shadow = scene.add.ellipse(0, displaySize / 2 - 2, shadowW, shadowH, 0x000000, 0.4);
    this.add(this.shadow);

    this.sprite = scene.add.image(0, 0, `enemy_${enemyId.toLowerCase()}`);
    // 半径に比例してスプライト表示サイズを設定 (キャラ絵を視認しやすいサイズに)
    this.sprite.setDisplaySize(displaySize, displaySize);
    this.add(this.sprite);

    // HPバー (スプライト上端より少し上に配置)
    this.hpBarY = -displaySize / 2 - 6;
    this.hpBar = scene.add.graphics();
    this.add(this.hpBar);
    this.drawHpBar();

    this.alive = true;

    // 初期スケール/depth を適用（生成直後の1フレでも自然に見せる）
    this.applyPerspective();
  }

  applyPerspective() {
    const s = entityScaleAtRow(rowAtY(this.y));
    this.setScale(s);
    this.setDepth(this.y);
  }

  drawHpBar() {
    this.hpBar.clear();
    const w = 30;
    const h = 4;
    const ratio = Math.max(0, this.hp / this.data_.hp);
    this.hpBar.fillStyle(0x222222, 1).fillRect(-w / 2, this.hpBarY, w, h);
    this.hpBar.fillStyle(0xff4466, 1).fillRect(-w / 2, this.hpBarY, w * ratio, h);
  }

  update(time, delta, allies = []) {
    if (!this.alive) return;

    // 1) 進路上 (同レーンで自分の前) に味方がいるかチェック
    const blocker = findBlockingAlly(this, allies);
    const meleeRange = CELL_SIZE * 0.7;
    let firing = false;

    if (blocker) {
      const dx = blocker.x - this.x;
      if (dx <= meleeRange) {
        firing = true; // 停止してコメント発射
      } else {
        // 近接距離まではブロッカーに向かって進む（Y は揃える）
        const step = (this.data_.speed * delta) / 1000;
        const tdy = blocker.y - this.y;
        const tdist = Math.hypot(dx, tdy);
        this.x += (dx / tdist) * step;
        this.y += (tdy / tdist) * step * 0.3;
      }
    } else {
      // 2) ブロッカーがなければ主人公方向にスムーズに進む
      const dx = this.influencer.x - this.x;
      const dy = this.influencer.y - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist > ENEMY_TALK_RANGE) {
        const step = (this.data_.speed * delta) / 1000;
        this.x += (dx / dist) * step;
        this.y += (dy / dist) * step * 0.3;
      } else {
        firing = true; // 主人公射程内に入ったらコメント発射
      }
    }

    if (firing && time - this.lastTalkAt > ENEMY_TALK_INTERVAL_MS) {
      this.lastTalkAt = time;
      this.fireComment();
    }

    // 透視: 現在 Y に応じた表示倍率と前後関係を毎フレ更新
    this.applyPerspective();
  }

  fireComment() {
    const line = Phaser.Utils.Array.GetRandom(this.data_.talkLines);
    // キャラ右側少し前から発射
    const muzzleX = this.x + (this.data_.radius * 1.2);
    this.scene.addComment('enemy', muzzleX, this.y, line, this.data_.atk);
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
