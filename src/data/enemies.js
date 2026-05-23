// 敵（罵言雑言）データ — 4種すべてを定義
// ARASHI: 突撃型 / NENCHAKU: 粘着タンク / ZOMBIE: 連射ザコ / BOT: 遠距離スナイパー
// talkLines は誹謗中傷バリエーション (敵が攻撃時にランダムで吐く)

export const ENEMIES = {
  // 突撃型: 近距離ラッシャー。脆いが数で押す。
  ARASHI: {
    id: 'ARASHI',
    name: '荒らしマン',
    hp: 50,
    atk: 10,
    speed: 40,
    range: 1.0,             // 近づかないと撃てない
    attackIntervalMs: 700,  // 早めの連射
    reward: 4,              // 撃破報酬コスト
    talkLines: [
      '死ねよww',
      '消えろゴミw',
      'きっしょw',
      '黙れカス',
      '何様だよwww',
      '草生えるwwww',
      '死ね死ね死ね',
      '引退しろ',
    ],
    color: 0xaa3322,
    radius: 18,
  },
  // 粘着タンク: しぶとくじわじわ前進、中距離壁役
  NENCHAKU: {
    id: 'NENCHAKU',
    name: '粘着アンチ',
    hp: 280,
    atk: 22,
    speed: 18,
    range: 1.8,
    attackIntervalMs: 1100, // やや遅め
    reward: 12,             // タンクの旨味
    talkLines: [
      'また炎上してて草',
      '頭おかしいだろ',
      'みんな嫌ってるよ',
      'ずっと監視してる',
      '永遠に許さない',
      'スクショ全部ある',
      '親の顔が見たい',
      '社会のゴミ',
    ],
    color: 0x551133,
    radius: 24,
  },
  // 連射ザコ: 一発の威力は弱いが連射で味方の弾幕を浪費させる
  ZOMBIE: {
    id: 'ZOMBIE',
    name: 'インプレゾンビ',
    hp: 60,
    atk: 4,
    speed: 22,
    range: 1.5,
    attackIntervalMs: 500,  // 高速連射
    reward: 3,              // 数で稼ぐ
    talkLines: [
      '見て見て俺の',
      '𝕏で書きました',
      '伸びてる伸びてる',
      'フォロバします',
      '拡散お願いします',
      'バズらせて',
      'インプレ稼ぎだ',
      'いいねください',
    ],
    color: 0x66aa77,
    radius: 20,
  },
  // 遠距離スナイパー: 重い一撃、撃ち落とせばチャンス
  BOT: {
    id: 'BOT',
    name: '炎上拡散bot',
    hp: 100,
    atk: 32,
    speed: 28,
    range: 2.5,
    attackIntervalMs: 1500, // 重い低速射
    reward: 10,             // 倒す価値あり
    talkLines: [
      '【拡散希望】',
      '【炎上中】',
      'みんなに広めよう',
      '【悲報】',
      '【まとめ】',
      'バズってる！',
      '通報案件',
      '【更新】',
    ],
    color: 0x333333,
    radius: 22,
  },
};
