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
export const ENEMY_TALK_INTERVAL_MS = 1500;
