/* ============================================================
   UI wiring — control panel buttons
   ============================================================ */
(() => {
  const L = window.Lab;
  const B = window.LabBubbles;
  const Lk = window.LabLikes;
  const F = window.LabFlame;
  const Bn = window.LabBonus;

  // Section definitions
  const SECTIONS = [
    {
      id: 'BUBBLES',
      title: '吹き出し罵言',
      desc: '敵から飛んでくる中傷コメント。主人公の頭上にポップ。',
      effects: [
        { id: 'A', name: 'X風ポップ', hint: 'pop · 1-3個',  cls: B.BubblePop },
        { id: 'B', name: 'リプ欄ストーム', hint: 'replyStorm · 7件', cls: B.ReplyStorm },
        { id: 'C', name: '赤フラッシュスパム', hint: 'spamWave · 14発', cls: B.SpamWave },
      ],
    },
    {
      id: 'LIKES',
      title: 'いいね♡演出',
      desc: 'バズり時/反応時の♡カウンター演出。',
      effects: [
        { id: 'A', name: 'ハートポップ', hint: 'heartPop · +247',  cls: Lk.HeartPop },
        { id: 'B', name: 'バズり降臨',   hint: 'buzzRain · +12k',  cls: Lk.BuzzRain },
        { id: 'C', name: '炎上リアクション', hint: 'angryReact · 通報', cls: Lk.AngryReact },
      ],
    },
    {
      id: 'FLAME',
      title: '炎上エフェクト',
      desc: '主人公HP低下時／WAVE終盤の演出。',
      effects: [
        { id: 'A', name: '画面端ヴィネット', hint: 'vignette · 継続4s',  cls: F.VignetteFlames },
        { id: 'B', name: 'キャラ本体炎',     hint: 'bodyFire · 継続3.5s', cls: F.BodyFire },
        { id: 'C', name: '画面警告バナー',   hint: 'fullAlert · 一発',     cls: F.FullScreenAlert },
      ],
    },
    {
      id: 'DAMAGE',
      title: 'ダメージ表示',
      desc: '敵コメントが主人公にヒットした時。',
      effects: [
        { id: 'A', name: '数字ポップ', hint: 'numberPop · クリ有', cls: Bn.NumberPop },
        { id: 'B', name: '赤♡で出血',  hint: 'reactionHit',         cls: Bn.ReactionHit },
        { id: 'C', name: '引用RTで晒し', hint: 'quoteRT · カード',   cls: Bn.QuoteRT },
      ],
    },
    {
      id: 'DEFEAT',
      title: '敵撃破リアクション',
      desc: '味方の弾で敵が落ちた時の SNS リアクション。',
      effects: [
        { id: 'A', name: 'アカウント凍結スタンプ', hint: 'bannedTag',   cls: Bn.BannedTag },
        { id: 'B', name: '通報されました',         hint: 'reportedX',   cls: Bn.ReportedX },
        { id: 'C', name: 'バズって成仏',           hint: 'viralBurst', cls: Bn.ViralBurst },
      ],
    },
  ];

  // Render panel
  const container = document.getElementById('sections');
  for (const sec of SECTIONS) {
    const wrap = document.createElement('div');
    wrap.className = 'section';
    wrap.innerHTML = `
      <div class="section-head">
        <div class="section-title">${sec.title}</div>
        <div class="section-id">${sec.id}</div>
      </div>
      <div class="section-desc">${sec.desc}</div>
      <div class="btn-row"></div>
    `;
    const row = wrap.querySelector('.btn-row');
    for (const eff of sec.effects) {
      const btn = document.createElement('button');
      btn.className = 'fx-btn';
      btn.innerHTML = `
        <span class="var-id">${eff.id}</span>
        <span class="var-name">${eff.name}</span>
        <span class="var-hint">${eff.hint}</span>
      `;
      btn.addEventListener('click', () => {
        L.add(new eff.cls());
      });
      row.appendChild(btn);
    }
    container.appendChild(wrap);
  }

  // Sound toggle
  const sndBtn = document.getElementById('soundToggle');
  sndBtn.addEventListener('click', () => {
    const on = !L.isSoundOn();
    L.setSoundOn(on);
    sndBtn.classList.toggle('on', on);
    sndBtn.textContent = on ? '🔊 SOUND' : '🔇 MUTE';
  });

  // Clear
  document.getElementById('clearBtn').addEventListener('click', () => L.clearAll());

  // Auto demo — fire random effects every ~900ms
  let autoTimer = null;
  const autoBtn = document.getElementById('autoBtn');
  autoBtn.addEventListener('click', () => {
    if (autoTimer) {
      clearInterval(autoTimer);
      autoTimer = null;
      autoBtn.classList.remove('on');
    } else {
      autoBtn.classList.add('on');
      autoTimer = setInterval(() => {
        const sec = SECTIONS[Math.floor(Math.random() * SECTIONS.length)];
        const eff = sec.effects[Math.floor(Math.random() * sec.effects.length)];
        L.add(new eff.cls());
      }, 900);
    }
  });

  // Scene background toggle
  document.querySelectorAll('.scene-toggle button').forEach(b => {
    b.addEventListener('click', () => {
      document.querySelectorAll('.scene-toggle button').forEach(bb => bb.classList.remove('on'));
      b.classList.add('on');
      L.setBgMode(b.dataset.scene);
    });
  });
})();
