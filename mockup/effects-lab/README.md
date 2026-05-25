# Effects Lab — エフェクト検証ページ

SNS × タワーディフェンス向けの演出・エフェクトを試すためのスタンドアロンHTMLページです。
本体ゲームとは独立しており、`index.html` をブラウザで開くだけで動作します。

## 開き方

リポジトリルートでローカルサーバを起動して、
`http://localhost:8080/mockup/effects-lab/` を開いてください。

```bash
python3 -m http.server 8080
```

> 主人公画像 (`happy.png`) を `assets/influencer/` から読み込むため、ローカルサーバ経由で開いてください（`file://` だと画像が表示されない場合があります）。

## 収録エフェクト（5カテゴリ × 3案 = 15種）

| カテゴリ | A | B | C |
|---|---|---|---|
| 吹き出し罵言 | X風ポップ | リプ欄ストーム | 赤フラッシュスパム |
| いいね♡演出 | ハートポップ | バズり降臨 | 炎上リアクション |
| 炎上エフェクト | 画面端ヴィネット | キャラ本体炎 | 全画面警告バナー |
| ダメージ表示 | 数字ポップ | 赤♡で出血 | 引用RTで晒し |
| 敵撃破リアクション | 凍結スタンプ | 通報されました | バズって成仏 |

## 操作

- **エフェクト名のボタン** — クリックで発火
- **🔊 SOUND** — 通知音 ON/OFF（Web Audio APIで合成）
- **CLEAR** — 飛んでるエフェクトを全消し
- **AUTO** — 900msごとにランダム発火（連打耐性チェック用）
- **GAME / PLAIN** — 背景の切替

## ファイル構成

```
mockup/effects-lab/
├── index.html              # ページ本体
├── README.md
└── lab/
    ├── core.js             # エンジン / ループ / 音声合成
    ├── effects-bubbles.js  # 吹き出し罵言 3案
    ├── effects-likes.js    # いいね♡演出 3案
    ├── effects-flame.js    # 炎上エフェクト 3案
    ├── effects-bonus.js    # ダメージ / 敵撃破 6案
    └── ui.js               # コントロールパネル配線
```

## Phaserへの移植について

各エフェクトは **`update(dt)` / `draw(ctx)` を持つクラス** に統一しています。
Phaser本体への移植は以下の置き換えで対応可能：

- `update(dt)` → Phaser Sceneの `update(time, delta)` から呼ぶ
- `draw(ctx)` → 中身を `scene.add.graphics()` / `scene.add.text()` に置き換える
- `L.startShake/startFlash` → `scene.cameras.main.shake/flash`
- `L.SFX.*` → Phaserの `scene.sound` に差し替え or Web Audio をそのまま流用

採用したい案を選んで `src/effects/` 配下にPhaser GameObjectとして書き直す想定です。
