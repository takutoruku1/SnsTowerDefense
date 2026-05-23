// 味方（投稿）データ — コスト幅 10〜55 で戦略性を強調
// 安価枠: ZAMAA / NETA (10-15) — 序盤のばら撒き向け
// 中堅枠: DARE / YOUGO (25-30) — 主力
// 高級枠: SHINJA / ITSUMO (40-55) — 一発逆転 / 拠点防衛

export const ALLIES = {
  ZAMAA: {
    id: 'ZAMAA',
    name: 'ざまぁwww',
    category: '罵',
    cost: 10,
    hp: 150,
    atk: 25,
    range: 1.5,
    attackIntervalMs: 1000,
    texture: 'ally_zamaa',
    color: 0xff3380,
  },
  NETA: {
    id: 'NETA',
    name: 'ネタにしてて草',
    category: 'ネタ',
    cost: 15,
    hp: 180,
    atk: 25,
    range: 3.0,
    attackIntervalMs: 1500,
    texture: 'ally_neta',
    color: 0xffcc66,
  },
  DARE: {
    id: 'DARE',
    name: '誰も好きじゃないよね',
    category: '罵',
    cost: 25,
    hp: 300,
    atk: 60,
    range: 2.0,
    attackIntervalMs: 1100,
    texture: 'ally_dare',
    color: 0xffaa66,
  },
  YOUGO: {
    id: 'YOUGO',
    name: '擁護してる人えらい!',
    category: '擁',
    cost: 30,
    hp: 600,
    atk: 35,
    range: 1.2,
    attackIntervalMs: 1300,
    texture: 'ally_yougo',
    color: 0x33ddff,
  },
  SHINJA: {
    id: 'SHINJA',
    name: '信者きっしょw',
    category: '罵',
    cost: 40,
    hp: 350,
    atk: 100,
    range: 2.5,
    attackIntervalMs: 1000,
    texture: 'ally_shinja',
    color: 0xaa66ff,
  },
  ITSUMO: {
    id: 'ITSUMO',
    name: 'いつも応援してます!',
    category: '擁',
    cost: 55,
    hp: 800,
    atk: 50,
    range: 1.8,
    attackIntervalMs: 1100,
    texture: 'ally_itsumo',
    color: 0xff77aa,
  },
};

// MVP で使う 6 種 (コスト昇順)
export const MVP_ALLIES = ['ZAMAA', 'NETA', 'DARE', 'YOUGO', 'SHINJA', 'ITSUMO'];
