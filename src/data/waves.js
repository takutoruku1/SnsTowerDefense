// WAVE 定義 — MVPは1WAVEのみ
// spawns: { enemyId, delayMs, lane } の配列。
// lane は 0..GRID_ROWS-1（出現する行）

export const WAVES = [
  {
    waveNumber: 1,
    spawns: [
      { enemyId: 'ARASHI',   delayMs: 1000,  lane: 0 },
      { enemyId: 'ARASHI',   delayMs: 2500,  lane: 2 },
      { enemyId: 'ARASHI',   delayMs: 4000,  lane: 1 },
      { enemyId: 'ARASHI',   delayMs: 5500,  lane: 3 },
      { enemyId: 'NENCHAKU', delayMs: 8000,  lane: 1 },
      { enemyId: 'ARASHI',   delayMs: 10000, lane: 0 },
      { enemyId: 'ARASHI',   delayMs: 11000, lane: 2 },
      { enemyId: 'NENCHAKU', delayMs: 13000, lane: 2 },
      { enemyId: 'ARASHI',   delayMs: 15000, lane: 3 },
    ],
  },
];
