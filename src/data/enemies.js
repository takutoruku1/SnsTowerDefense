// 敵（罵言雑言）データ — 4種すべてを定義
// ARASHI: 雑魚 / NENCHAKU: タンク / ZOMBIE: 湧く敵 / BOT: 高威力範囲

export const ENEMIES = {
  ARASHI: {
    id: 'ARASHI',
    name: '荒らしマン',
    hp: 60,
    atk: 8,
    speed: 35,
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
  ZOMBIE: {
    id: 'ZOMBIE',
    name: 'インプレゾンビ',
    hp: 80,
    atk: 6,
    speed: 18,
    talkLines: ['見て見て俺の', '𝕏で書きました', '伸びてる伸びてる'],
    color: 0x66aa77,
    radius: 20,
  },
  BOT: {
    id: 'BOT',
    name: '炎上拡散bot',
    hp: 130,
    atk: 22,
    speed: 32,
    talkLines: ['【拡散希望】', '【炎上中】', 'みんなに広めよう'],
    color: 0x333333,
    radius: 22,
  },
};
