// 味方（投稿）データ — モックの数値準拠
// MVPでは ZAMAA と YOUGO の2種のみ使用。他はPhase 4以降で解放予定。

export const ALLIES = {
  ZAMAA: {
    id: 'ZAMAA',
    name: 'ざまぁwww',
    category: '罵',      // 罵言
    cost: 15,
    hp: 220,
    atk: 45,
    range: 1.5,           // セル数
    attackIntervalMs: 1000,
    texture: 'ally_zamaa',
    color: 0xff3380,      // 仮スプライト用カラー
  },
  YOUGO: {
    id: 'YOUGO',
    name: '擁護してる人えらい!',
    category: '擁',      // 擁護
    cost: 20,
    hp: 400,
    atk: 30,
    range: 1.2,
    attackIntervalMs: 1300,
    texture: 'ally_yougo',
    color: 0x33ddff,
  },
};

// MVPで使う2種
export const MVP_ALLIES = ['ZAMAA', 'YOUGO'];
