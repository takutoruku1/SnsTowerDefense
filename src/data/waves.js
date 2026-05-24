// WAVE 定義 — 5 WAVE 構成
// 設計指針:
//   W1 チュートリアル: 全 5 レーン (0..4) の動きを覚える / ARASHI 中心
//   W2 マルチレーン圧:  ZOMBIE 初登場 / 両端同時湧き
//   W3 BOT 初登場:      長距離スナイプの脅威 / 中央レーン圧
//   W4 タンク戦線:      NENCHAKU の壁 + BOT 連打 / 削り切る訓練
//   W5 最終決戦:        全 5 レーン同時 + 連続波状攻撃
// spawns: { enemyId, delayMs, lane } の配列。 lane は 0..GRID_ROWS-1 (今は 0..4)

export const WAVES = [
  // ============================================================
  // WAVE 1: チュートリアル — 全 5 レーンを覚える
  // ============================================================
  {
    waveNumber: 1,
    spawns: [
      { enemyId: 'ARASHI',   delayMs:  1000, lane: 2 }, // 中央から
      { enemyId: 'ARASHI',   delayMs:  3000, lane: 0 },
      { enemyId: 'ARASHI',   delayMs:  4500, lane: 4 }, // 新レーン
      { enemyId: 'ARASHI',   delayMs:  6000, lane: 1 },
      { enemyId: 'ARASHI',   delayMs:  7500, lane: 3 },
      { enemyId: 'NENCHAKU', delayMs: 10000, lane: 2 }, // 初タンク
      { enemyId: 'ARASHI',   delayMs: 12000, lane: 0 },
      { enemyId: 'ARASHI',   delayMs: 13000, lane: 4 },
      { enemyId: 'NENCHAKU', delayMs: 15000, lane: 3 },
    ],
  },
  // ============================================================
  // WAVE 2: マルチレーン圧 — ZOMBIE 初登場 + 両端同時湧き
  // ============================================================
  {
    waveNumber: 2,
    spawns: [
      { enemyId: 'ARASHI',   delayMs:   500, lane: 0 }, // 両端同時で 5 レーン警戒を強制
      { enemyId: 'ARASHI',   delayMs:   500, lane: 4 },
      { enemyId: 'ZOMBIE',   delayMs:  2000, lane: 2 }, // 連射ザコ初登場 (中央)
      { enemyId: 'ARASHI',   delayMs:  3500, lane: 1 },
      { enemyId: 'ARASHI',   delayMs:  3500, lane: 3 },
      { enemyId: 'NENCHAKU', delayMs:  5500, lane: 2 },
      { enemyId: 'ZOMBIE',   delayMs:  7000, lane: 0 },
      { enemyId: 'ZOMBIE',   delayMs:  7000, lane: 4 }, // 両端ゾンビ
      { enemyId: 'ARASHI',   delayMs:  9000, lane: 1 },
      { enemyId: 'ARASHI',   delayMs:  9000, lane: 3 },
      { enemyId: 'NENCHAKU', delayMs: 11500, lane: 1 },
      { enemyId: 'NENCHAKU', delayMs: 11500, lane: 3 }, // ダブルタンク
      { enemyId: 'ARASHI',   delayMs: 14000, lane: 2 },
      { enemyId: 'ZOMBIE',   delayMs: 15500, lane: 0 },
    ],
  },
  // ============================================================
  // WAVE 3: BOT 初登場 — 長距離スナイプ + 中央集中
  // ============================================================
  {
    waveNumber: 3,
    spawns: [
      { enemyId: 'ZOMBIE',   delayMs:   800, lane: 1 },
      { enemyId: 'ZOMBIE',   delayMs:   800, lane: 3 },
      { enemyId: 'ARASHI',   delayMs:  2500, lane: 0 },
      { enemyId: 'ARASHI',   delayMs:  2500, lane: 4 },
      { enemyId: 'BOT',      delayMs:  4000, lane: 2 }, // 初 BOT (中央)
      { enemyId: 'NENCHAKU', delayMs:  5500, lane: 1 },
      { enemyId: 'NENCHAKU', delayMs:  5500, lane: 3 },
      { enemyId: 'ZOMBIE',   delayMs:  7000, lane: 0 },
      { enemyId: 'ZOMBIE',   delayMs:  7000, lane: 4 },
      { enemyId: 'ARASHI',   delayMs:  9000, lane: 2 },
      { enemyId: 'BOT',      delayMs: 10500, lane: 1 }, // BOT ダブル
      { enemyId: 'BOT',      delayMs: 10500, lane: 3 },
      { enemyId: 'ARASHI',   delayMs: 12500, lane: 0 },
      { enemyId: 'ARASHI',   delayMs: 12500, lane: 4 },
      { enemyId: 'NENCHAKU', delayMs: 14500, lane: 2 },
      { enemyId: 'ZOMBIE',   delayMs: 16000, lane: 1 },
      { enemyId: 'ZOMBIE',   delayMs: 16000, lane: 3 },
    ],
  },
  // ============================================================
  // WAVE 4: タンク戦線 — NENCHAKU の壁 + BOT 連打
  // ============================================================
  {
    waveNumber: 4,
    spawns: [
      // 開幕タンク + 中央 BOT
      { enemyId: 'NENCHAKU', delayMs:   500, lane: 1 },
      { enemyId: 'NENCHAKU', delayMs:   500, lane: 3 },
      { enemyId: 'BOT',      delayMs:  2000, lane: 2 },
      // ARASHI 全レーンラッシュ
      { enemyId: 'ARASHI',   delayMs:  3000, lane: 0 },
      { enemyId: 'ARASHI',   delayMs:  3500, lane: 4 },
      { enemyId: 'ARASHI',   delayMs:  4000, lane: 2 },
      { enemyId: 'ARASHI',   delayMs:  4500, lane: 1 },
      { enemyId: 'ARASHI',   delayMs:  5000, lane: 3 },
      // ZOMBIE トリプル
      { enemyId: 'ZOMBIE',   delayMs:  6500, lane: 0 },
      { enemyId: 'ZOMBIE',   delayMs:  6500, lane: 2 },
      { enemyId: 'ZOMBIE',   delayMs:  6500, lane: 4 },
      // BOT 連打
      { enemyId: 'BOT',      delayMs:  8500, lane: 1 },
      { enemyId: 'BOT',      delayMs:  8500, lane: 3 },
      // 第二波タンク
      { enemyId: 'NENCHAKU', delayMs: 10500, lane: 0 },
      { enemyId: 'NENCHAKU', delayMs: 10500, lane: 4 },
      // ARASHI 中央集中
      { enemyId: 'ARASHI',   delayMs: 12000, lane: 2 },
      { enemyId: 'ARASHI',   delayMs: 12500, lane: 1 },
      { enemyId: 'ARASHI',   delayMs: 13000, lane: 3 },
      // 終盤
      { enemyId: 'BOT',      delayMs: 15000, lane: 2 },
      { enemyId: 'ZOMBIE',   delayMs: 16000, lane: 0 },
      { enemyId: 'ZOMBIE',   delayMs: 16500, lane: 4 },
      { enemyId: 'NENCHAKU', delayMs: 18000, lane: 2 },
    ],
  },
  // ============================================================
  // WAVE 5: 最終決戦 — 5 レーン全開 + 波状攻撃
  // ============================================================
  {
    waveNumber: 5,
    spawns: [
      // 開幕全レーン同時
      { enemyId: 'NENCHAKU', delayMs:   500, lane: 0 },
      { enemyId: 'NENCHAKU', delayMs:   500, lane: 4 },
      { enemyId: 'BOT',      delayMs:  1500, lane: 1 },
      { enemyId: 'BOT',      delayMs:  1500, lane: 3 },
      { enemyId: 'ZOMBIE',   delayMs:  1500, lane: 2 },
      // 第二波 ARASHI 5 レーン同時
      { enemyId: 'ARASHI',   delayMs:  3500, lane: 0 },
      { enemyId: 'ARASHI',   delayMs:  3500, lane: 1 },
      { enemyId: 'ARASHI',   delayMs:  4000, lane: 2 },
      { enemyId: 'ARASHI',   delayMs:  4000, lane: 3 },
      { enemyId: 'ARASHI',   delayMs:  4500, lane: 4 },
      // 中盤タンク + ZOMBIE 3 体
      { enemyId: 'NENCHAKU', delayMs:  6500, lane: 1 },
      { enemyId: 'NENCHAKU', delayMs:  6500, lane: 3 },
      { enemyId: 'ZOMBIE',   delayMs:  7500, lane: 0 },
      { enemyId: 'ZOMBIE',   delayMs:  7500, lane: 2 },
      { enemyId: 'ZOMBIE',   delayMs:  7500, lane: 4 },
      // BOT トリプルスナイプ
      { enemyId: 'BOT',      delayMs:  9500, lane: 0 },
      { enemyId: 'BOT',      delayMs:  9500, lane: 2 },
      { enemyId: 'BOT',      delayMs:  9500, lane: 4 },
      // 第三波
      { enemyId: 'ARASHI',   delayMs: 11500, lane: 1 },
      { enemyId: 'ARASHI',   delayMs: 11500, lane: 3 },
      { enemyId: 'NENCHAKU', delayMs: 13000, lane: 0 },
      { enemyId: 'NENCHAKU', delayMs: 13000, lane: 2 },
      { enemyId: 'NENCHAKU', delayMs: 13000, lane: 4 },
      // 終盤 BOT スナイプ
      { enemyId: 'BOT',      delayMs: 15500, lane: 1 },
      { enemyId: 'BOT',      delayMs: 15500, lane: 3 },
      // ZOMBIE 3 連
      { enemyId: 'ZOMBIE',   delayMs: 17000, lane: 0 },
      { enemyId: 'ZOMBIE',   delayMs: 17000, lane: 2 },
      { enemyId: 'ZOMBIE',   delayMs: 17000, lane: 4 },
      // 最後のひと押し
      { enemyId: 'ARASHI',   delayMs: 19000, lane: 0 },
      { enemyId: 'ARASHI',   delayMs: 19000, lane: 1 },
      { enemyId: 'ARASHI',   delayMs: 19500, lane: 2 },
      { enemyId: 'ARASHI',   delayMs: 19500, lane: 3 },
      { enemyId: 'ARASHI',   delayMs: 19500, lane: 4 },
      { enemyId: 'NENCHAKU', delayMs: 21000, lane: 2 }, // ボス的な締め
    ],
  },
];
