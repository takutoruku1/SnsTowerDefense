// 敵（罵言雑言）データ — モックの数値準拠
// MVPでは ARASHI と NENCHAKU の2種のみ使用。

export const ENEMIES = {
  ARASHI: {
    id: 'ARASHI',
    name: '荒らしマン',
    hp: 60,
    atk: 8,                  // 主人公へのダメージ単位
    speed: 35,               // px/秒
    talkLines: ['死ねよww', '消えろゴミw', 'きっしょw'],
    color: 0xaa3322,
    radius: 18,
  },
  NENCHAKU: {
    id: 'NENCHAKU',
    name: '粘着アンチ',
    hp: 220,
    atk: 18,
    speed: 22,
    talkLines: ['また炎上してて草', '頭おかしいだろ', 'みんな嫌ってるよ'],
    color: 0x551133,
    radius: 24,
  },
};
