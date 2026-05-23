// ゲーム全体の設定値
export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

// グリッド: 6列 × 4行（配置可能セル）
export const GRID_COLS = 6;
export const GRID_ROWS = 4;
export const CELL_SIZE = 96;

// フィールドの左上座標（炎上エリア = 左、SNSエリア = 右側UIに寄せる）
export const FIELD_X = 60;
export const FIELD_Y = 140;

// 主人公（インフルエンサー）の配置: フィールドの右端の少し外
export const INFLUENCER_X = FIELD_X + GRID_COLS * CELL_SIZE + 80;
export const INFLUENCER_Y = FIELD_Y + (GRID_ROWS * CELL_SIZE) / 2;

// 主人公HP（モック準拠）
export const INFLUENCER_MAX_HP = 1250;

// HP段階（差分画像切り替え用しきい値）
export const HP_THRESHOLDS = {
  HAPPY: 0.66,    // 100%-66% → happy
  STRESSED: 0.33, // 66%-33%  → stressed
  // それ以下 → broken
};

// コスト
export const COST_START = 30;
export const COST_MAX = 100;
export const COST_REGEN_PER_SEC = 1;
export const TL_REFRESH_COST = 10;

// 敵の話しかけ攻撃: 主人公への接近時のダメージ単位
// （遠隔から「話しかけ」られて主人公が傷つく演出）
export const ENEMY_TALK_RANGE = CELL_SIZE * 2.5; // この距離まで近づいたら発言開始
export const ENEMY_TALK_INTERVAL_MS = 900;       // 攻撃レンジ内で発言する間隔 (短いほど誹謗中傷スパムが激しい)

// ==== 擬似3D 透視変換 ====
// グリッド上段 = 奥、下段 = 手前。横幅を奥ほど絞り、エンティティを奥ほど小さく描画する。
const BACK_WIDTH_SCALE = 0.78;   // 最奥列の横幅倍率
const FRONT_WIDTH_SCALE = 1.14;  // 最前列の横幅倍率
const BACK_ENTITY_SCALE = 0.78;  // 最奥のキャラ表示倍率
const FRONT_ENTITY_SCALE = 1.12; // 最前のキャラ表示倍率

function clamp01(t) { return t < 0 ? 0 : t > 1 ? 1 : t; }

// 行 r ( 0..GRID_ROWS の連続値) における横方向スケール
export function widthScaleAtRow(r) {
  const t = clamp01(r / GRID_ROWS);
  return BACK_WIDTH_SCALE + (FRONT_WIDTH_SCALE - BACK_WIDTH_SCALE) * t;
}

// 行 r におけるエンティティ表示倍率
export function entityScaleAtRow(r) {
  const t = clamp01(r / GRID_ROWS);
  return BACK_ENTITY_SCALE + (FRONT_ENTITY_SCALE - BACK_ENTITY_SCALE) * t;
}

// 画面 Y → 行
export function rowAtY(y) {
  return (y - FIELD_Y) / CELL_SIZE;
}

// 論理 X (グリッド基準) を、行 r の透視に合わせた画面 X に変換
export function perspectiveX(logicalX, r) {
  const fieldWidth = GRID_COLS * CELL_SIZE;
  const centerX = FIELD_X + fieldWidth / 2;
  return centerX + (logicalX - centerX) * widthScaleAtRow(r);
}

// 画面 Y から行を算出して透視 X を返す（敵の移動中などに使用）
export function perspectiveXAtY(logicalX, y) {
  return perspectiveX(logicalX, rowAtY(y));
}
