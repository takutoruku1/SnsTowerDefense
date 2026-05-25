// テストプレイ自動録画スクリプト
// - 静的ファイルサーバを立ち上げて Playwright で開く
// - Phaser CDN/Google Fonts はオフラインなのでローカル差し替え
// - タイトル画面 → 自動プレイ
// - Playwright 内蔵の recordVideo (WebM) で録画
// - 仕上げに ffmpeg で mp4 化
//
// 出力:
//   output/testplay.webm  (Playwright がそのまま吐く)
//   output/testplay.mp4   (ffmpeg で変換)

import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';
import url from 'url';
import { spawn } from 'child_process';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(ROOT, 'output');
// 動画変換: システム ffmpeg (libx264) を優先、なければ Playwright 同梱 (webm のみ対応で mp4 化は不可)
const FFMPEG = fs.existsSync('/usr/bin/ffmpeg') ? '/usr/bin/ffmpeg' : '/opt/pw-browsers/ffmpeg-1011/ffmpeg-linux';

const PORT = 8765;
const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;
const TOTAL_PLAY_SEC = 55;

const log = (...a) => console.log(`[${new Date().toISOString().slice(11,19)}]`, ...a);

// ============================================================
// 静的ファイルサーバ
// ============================================================
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.mjs':  'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg':  'image/svg+xml',
  '.mp3':  'audio/mpeg',
  '.wav':  'audio/wav',
  '.ico':  'image/x-icon',
};

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let p = decodeURIComponent(req.url.split('?')[0]);
      if (p === '/') p = '/index.html';
      const filePath = path.join(ROOT, p);
      if (!filePath.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }
      fs.readFile(filePath, (err, data) => {
        if (err) { res.writeHead(404); res.end('not found'); return; }
        res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream' });
        res.end(data);
      });
    });
    server.listen(PORT, '127.0.0.1', () => resolve(server));
  });
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ============================================================
// ゲーム座標 (config.js と一致)
// ============================================================
const FIELD_X = 30;
const FIELD_Y = 100;
const CELL_SIZE = 96;
const PANEL_X = GAME_WIDTH * 0.72; // 921.6

const cellCenter = (col, row) => ({
  x: FIELD_X + col * CELL_SIZE + CELL_SIZE / 2,
  y: FIELD_Y + row * CELL_SIZE + CELL_SIZE / 2,
});

// 味方カード中心 (2x3 グリッド)
// MVP_ALLIES = ['ZAMAA','NETA','DARE','YOUGO','SHINJA','ITSUMO']
function cardCenter(i) {
  const panelW = GAME_WIDTH - PANEL_X;
  const cardW = (panelW - 14 * 2 - 8) / 2;
  const cardH = 140;
  const col = i % 2;
  const row = Math.floor(i / 2);
  return {
    x: PANEL_X + 14 + col * (cardW + 8) + cardW / 2,
    y: 100 + row * (cardH + 10) + cardH / 2,
  };
}

// ============================================================
// メイン
// ============================================================
async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  log('static server 起動...');
  const server = await startServer();
  log(`  → http://127.0.0.1:${PORT}`);

  log('Chromium 起動...');
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--autoplay-policy=no-user-gesture-required',
      '--mute-audio',
      '--hide-scrollbars',
    ],
  });

  // recordVideo を有効化
  const context = await browser.newContext({
    viewport: { width: GAME_WIDTH, height: GAME_HEIGHT },
    deviceScaleFactor: 1,
    recordVideo: {
      dir: OUTPUT_DIR,
      size: { width: GAME_WIDTH, height: GAME_HEIGHT },
    },
  });
  const page = await context.newPage();
  page.on('pageerror', e => log('[pageerror]', e.message));
  page.on('console', msg => {
    if (msg.type() === 'error') log('[console.error]', msg.text());
  });

  // オフラインなので CDN/フォントを差し替え
  const phaserBuf = fs.readFileSync(path.join(ROOT, 'node_modules/phaser/dist/phaser.min.js'));
  await page.route('**/cdn.jsdelivr.net/**/phaser.min.js', route => {
    route.fulfill({ status: 200, contentType: 'application/javascript; charset=utf-8', body: phaserBuf });
  });
  await page.route('**/fonts.googleapis.com/**', r => r.fulfill({ status: 204, body: '' }));
  await page.route('**/fonts.gstatic.com/**', r => r.fulfill({ status: 204, body: '' }));

  log('ゲームページを開く...');
  await page.goto(`http://127.0.0.1:${PORT}/index.html`);

  await page.waitForFunction(() => {
    const c = document.querySelector('canvas');
    return c && c.width >= 1280;
  }, { timeout: 30000 });
  log('Phaser 初期化 OK');
  await sleep(2000); // アセット読み込み

  // canvas の DOM 上のオフセット
  const offset = await page.evaluate(() => {
    const c = document.querySelector('canvas');
    const r = c.getBoundingClientRect();
    return { x: r.left, y: r.top, w: r.width, h: r.height };
  });
  const scaleX = offset.w / GAME_WIDTH;
  const scaleY = offset.h / GAME_HEIGHT;
  const click = async (gameX, gameY) => {
    await page.mouse.click(offset.x + gameX * scaleX, offset.y + gameY * scaleY);
  };

  // ============================================================
  // ゲーム自動操作
  // ============================================================
  log('自動プレイ開始');
  const playStart = Date.now();

  // タイトル: 開始ボタン
  await click(GAME_WIDTH / 2, GAME_HEIGHT - 110);
  await sleep(700);

  // 配置ヘルパ
  const place = async (cardIdx, col, row) => {
    const card = cardCenter(cardIdx);
    await click(card.x, card.y);
    await sleep(140);
    const cell = cellCenter(col, row);
    await click(cell.x, cell.y);
    await sleep(180);
  };

  // フェーズ1: WAVE1 準備〜序盤 (0〜10s)
  // 安価 ZAMAA を主人公寄り (col=4) に5レーン分
  await place(0, 4, 2); // 中央
  await place(0, 4, 0);
  await place(0, 4, 4);
  log(`+3 ZAMAA (${((Date.now()-playStart)/1000).toFixed(1)}s)`);
  await sleep(4500); // コスト回復 + 敵を見る
  await place(0, 4, 1);
  await place(0, 4, 3);
  log(`+2 ZAMAA (${((Date.now()-playStart)/1000).toFixed(1)}s)`);
  await sleep(3000);

  // フェーズ2: 中堅 DARE / YOUGO で前線形成
  await place(2, 3, 2); // DARE 前列中央
  await sleep(1800);
  await place(3, 5, 2); // YOUGO 後列タンク
  await sleep(2200);
  await place(2, 3, 1); // DARE
  await sleep(2200);
  await place(2, 3, 3); // DARE
  log(`mid-line (${((Date.now()-playStart)/1000).toFixed(1)}s)`);
  await sleep(2500);

  // フェーズ3: 高級 SHINJA / ITSUMO 投入
  await place(4, 2, 2); // SHINJA 前列高威力
  await sleep(2500);
  await place(5, 5, 1); // ITSUMO 後列タンク
  await sleep(2200);
  await place(5, 5, 3); // ITSUMO 後列タンク
  log(`elite-line (${((Date.now()-playStart)/1000).toFixed(1)}s)`);
  await sleep(2200);

  // フェーズ4: 残レーン補強
  await place(2, 3, 0);
  await sleep(1800);
  await place(2, 3, 4);
  await sleep(1800);
  await place(4, 2, 1);
  await sleep(1800);
  await place(4, 2, 3);
  log(`reinforce (${((Date.now()-playStart)/1000).toFixed(1)}s)`);

  // 残り時間は観戦
  const elapsed = (Date.now() - playStart) / 1000;
  const remaining = Math.max(2, TOTAL_PLAY_SEC - elapsed);
  log(`観戦 ${remaining.toFixed(1)}s ...`);
  await sleep(remaining * 1000);

  log('録画停止');
  // ページのビデオパスを取得してから closeすると確定する
  const video = page.video();
  await page.close();
  await context.close();
  await browser.close();
  server.close();

  const rawPath = await video.path();
  log(`raw webm: ${rawPath}`);

  // 名前を固定
  const webmOut = path.join(OUTPUT_DIR, 'testplay.webm');
  fs.renameSync(rawPath, webmOut);
  log(`renamed: ${webmOut}`);

  // mp4 に変換
  log('mp4 変換中...');
  const mp4Out = path.join(OUTPUT_DIR, 'testplay.mp4');
  await new Promise((resolve, reject) => {
    const ff = spawn(FFMPEG, [
      '-y',
      '-i', webmOut,
      '-c:v', 'libx264',
      '-preset', 'veryfast',
      '-crf', '23',
      '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart',
      mp4Out,
    ]);
    let stderr = '';
    ff.stderr.on('data', d => { stderr += d.toString(); });
    ff.on('exit', code => {
      if (code === 0) resolve();
      else { console.error(stderr.slice(-2000)); reject(new Error(`ffmpeg exit ${code}`)); }
    });
  });

  const w = fs.statSync(webmOut);
  const m = fs.statSync(mp4Out);
  console.log(`\n✅ webm: ${webmOut} (${(w.size / 1024 / 1024).toFixed(2)} MB)`);
  console.log(`✅ mp4 : ${mp4Out} (${(m.size / 1024 / 1024).toFixed(2)} MB)`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
