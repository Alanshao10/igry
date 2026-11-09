/* Три кота — найди пару. Для Тимура, 5 лет. */
(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const board = $('board'), lvlEl = $('lvl'), foundEl = $('found'), totalEl = $('total');
  const ov = $('ov'), soundBtn = $('sound'), homeBtn = $('home');

  /* ---------- персонажи ---------- */
  function catSVG(o) {
    const fur = o.fur, dark = o.dark || o.fur;
    return `<svg viewBox="0 0 200 200" aria-hidden="true">
      <path d="M40 72 L26 14 L88 44 Z" fill="${fur}"/>
      <path d="M160 72 L174 14 L112 44 Z" fill="${fur}"/>
      <path d="M50 64 L42 30 L78 48 Z" fill="#F6B3C6"/>
      <path d="M150 64 L158 30 L122 48 Z" fill="#F6B3C6"/>
      <circle cx="100" cy="112" r="66" fill="${fur}"/>
      ${o.stripe ? `<path d="M82 56 q6 16 0 30 M100 50 q6 16 0 34 M118 56 q-6 16 0 30" stroke="${dark}" stroke-width="7" fill="none" stroke-linecap="round"/>` : ''}
      <ellipse cx="76" cy="104" rx="16" ry="18" fill="#FFFFFF"/>
      <ellipse cx="124" cy="104" rx="16" ry="18" fill="#FFFFFF"/>
      <circle cx="78" cy="107" r="7.5" fill="#21313C"/>
      <circle cx="122" cy="107" r="7.5" fill="#21313C"/>
      <circle cx="80.5" cy="103.5" r="2.6" fill="#FFFFFF"/>
      <circle cx="124.5" cy="103.5" r="2.6" fill="#FFFFFF"/>
      <ellipse cx="100" cy="130" rx="8" ry="6" fill="#E86A8A"/>
      <path d="M100 136 v6 M100 142 q-8 8 -15 1 M100 142 q8 8 15 1" stroke="#21313C" stroke-width="3.4" fill="none" stroke-linecap="round"/>
      <path d="M56 118 h-18 M56 128 h-16 M144 118 h18 M144 128 h16" stroke="${dark}" stroke-width="3" stroke-linecap="round" opacity=".5"/>
      <circle cx="62" cy="126" r="8" fill="#F58FA8" opacity=".3"/>
      <circle cx="138" cy="126" r="8" fill="#F58FA8" opacity=".3"/>
      ${o.bow ? `<g transform="translate(146 34)">
        <path d="M0 0 q-22 -14 -16 -24 q7 -10 20 4 q13 -14 20 -4 q6 10 -16 24 q-4 3 -8 0z" fill="#E8709A"/>
        <circle cx="2" cy="-10" r="5" fill="#C9527A"/>
      </g>` : ''}
    </svg>`;
  }

  function fishSVG() {
    return `<svg viewBox="0 0 200 200" aria-hidden="true">
      <path d="M150 100 L188 70 L188 130 Z" fill="#E0782A"/>
      <ellipse cx="98" cy="100" rx="58" ry="40" fill="#F2A03C"/>
      <path d="M70 80 q20 12 0 40" stroke="#E0782A" stroke-width="6" fill="none" stroke-linecap="round"/>
      <circle cx="66" cy="90" r="10" fill="#FFFFFF"/>
      <circle cx="64" cy="91" r="5" fill="#21313C"/>
      <path d="M62 116 q16 10 34 4" stroke="#C96A22" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M104 66 q14 -10 24 0" stroke="#E0782A" stroke-width="5" fill="none" stroke-linecap="round"/>
    </svg>`;
  }

  function milkSVG() {
    return `<svg viewBox="0 0 200 200" aria-hidden="true">
      <path d="M66 54 h68 l-8 106 a12 12 0 0 1 -12 11 h-28 a12 12 0 0 1 -12 -11 z" fill="#DCEEFB" stroke="#B6D4E6" stroke-width="6"/>
      <path d="M74 96 h52 l-5 62 a8 8 0 0 1 -8 7 h-26 a8 8 0 0 1 -8 -7 z" fill="#FFFFFF"/>
      <rect x="86" y="16" width="13" height="52" rx="6" fill="#F26B6B" transform="rotate(9 86 16)"/>
      <path d="M92 74 l8 8" stroke="#D24D4D" stroke-width="4" stroke-linecap="round"/>
    </svg>`;
  }

  function pizzaSVG() {
    return `<svg viewBox="0 0 200 200" aria-hidden="true">
      <circle cx="100" cy="104" r="66" fill="#EFC173"/>
      <circle cx="100" cy="104" r="56" fill="#FFD966"/>
      <g fill="#E4572E"><circle cx="80" cy="84" r="9"/><circle cx="122" cy="92" r="9"/><circle cx="94" cy="126" r="9"/><circle cx="126" cy="126" r="7"/></g>
      <g fill="#F7E7C6"><circle cx="102" cy="66" r="7"/><circle cx="64" cy="112" r="7"/><circle cx="140" cy="110" r="7"/></g>
      <g fill="#7FBF5A"><ellipse cx="104" cy="108" rx="8" ry="5"/><ellipse cx="74" cy="94" rx="6" ry="4"/></g>
    </svg>`;
  }

  function cakeSVG() {
    return `<svg viewBox="0 0 200 200" aria-hidden="true">
      <path d="M60 104 h80 v58 a10 10 0 0 1 -10 10 h-60 a10 10 0 0 1 -10 -10 z" fill="#F6C6A0"/>
      <path d="M60 104 q20 16 40 0 q20 16 40 0 v-10 q-20 16 -40 0 q-20 16 -40 0 z" fill="#FFE1E9"/>
      <rect x="60" y="92" width="80" height="16" rx="8" fill="#FFF0F4"/>
      <path d="M60 148 h80" stroke="#E8A87C" stroke-width="5"/>
      <circle cx="100" cy="82" r="12" fill="#E4572E"/>
      <path d="M100 70 q4 -14 14 -16" stroke="#4E9B45" stroke-width="5" fill="none" stroke-linecap="round"/>
    </svg>`;
  }

  function ballSVG() {
    return `<svg viewBox="0 0 200 200" aria-hidden="true">
      <circle cx="100" cy="102" r="68" fill="#7ED0EC"/>
      <path d="M100 34 a68 68 0 0 1 0 136 a68 68 0 0 1 0 -136z" fill="#FFD166" opacity=".35"/>
      <path d="M100 34 q38 68 0 136 q-38 -68 0 -136z" fill="#F26B6B"/>
      <path d="M32 102 h136" stroke="#FFFFFF" stroke-width="7" opacity=".85"/>
      <circle cx="74" cy="78" r="14" fill="#FFFFFF" opacity=".5"/>
    </svg>`;
  }

  const PAIRS = [
    { id: 'korg', tint: '#FFE7CC', svg: catSVG({ fur: '#F59A3C', dark: '#D97C22', stripe: true }) },
    { id: 'karamel', tint: '#FFDCE6', svg: catSVG({ fur: '#F6A9C0', dark: '#DE87A2', bow: true }) },
    { id: 'kompot', tint: '#DCE9F5', svg: catSVG({ fur: '#93A6BC', dark: '#6F809A', stripe: true }) },
    { id: 'papa', tint: '#E4F0E0', svg: catSVG({ fur: '#B8C4CE', dark: '#8E9BA8' }) },
    { id: 'mama', tint: '#F3E6FF', svg: catSVG({ fur: '#F4EAE0', dark: '#C9B7A6' }) },
    { id: 'fish', tint: '#E3F4FF', svg: fishSVG() },
    { id: 'milk', tint: '#F0F7FF', svg: milkSVG() },
    { id: 'pizza', tint: '#FFF0D2', svg: pizzaSVG() },
    { id: 'cake', tint: '#FFE8F0', svg: cakeSVG() },
    { id: 'ball', tint: '#E8F7E0', svg: ballSVG() },
  ];

  const LEVELS = [
    { pairs: 3, cols: 3 },
    { pairs: 6, cols: 3 },
    { pairs: 8, cols: 4 },
    { pairs: 10, cols: 4 },
  ];

  const PAW = `<svg viewBox="0 0 100 100" aria-hidden="true"><g fill="currentColor"><ellipse cx="50" cy="66" rx="23" ry="19"/><ellipse cx="24" cy="38" rx="9" ry="11"/><ellipse cx="40" cy="25" rx="9" ry="12"/><ellipse cx="60" cy="25" rx="9" ry="12"/><ellipse cx="76" cy="38" rx="9" ry="11"/></g></svg>`;

  /* ---------- звук ---------- */
  const audio = {
    ctx: null, master: null, on: true,
    init() {
      if (this.ctx) return;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      try {
        this.ctx = new AC();
        const m = this.ctx.createGain(); m.gain.value = 0.9; m.connect(this.ctx.destination);
        this.master = m;
      } catch (e) { this.ctx = null; }
    },
    resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); },
    mute(v) { if (this.master) this.master.gain.setTargetAtTime(v ? 0 : 0.9, this.ctx.currentTime, 0.05); },
    tone(f, dur, type, gain, delay) {
      if (!this.ctx || !this.on) return;
      const t = this.ctx.currentTime + (delay || 0);
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = type || 'sine'; o.frequency.setValueAtTime(f, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(gain || 0.12, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + 0.04);
    },
    flip() { this.tone(620, 0.1, 'triangle', 0.08); },
    match() { this.tone(784, 0.16, 'triangle', 0.12); this.tone(1175, 0.26, 'sine', 0.09, 0.08); },
    miss() { this.tone(240, 0.18, 'sine', 0.07); },
    win() { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.32, 'triangle', 0.11, i * 0.11)); },
  };

  /* ---------- состояние ---------- */
  const S = { level: 1, mode: 'start', open: [], lock: false, matched: 0, total: 3, moves: 0 };

  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function buildLevel(n) {
    const cfg = LEVELS[(n - 1) % LEVELS.length];
    const pairs = PAIRS.slice(0, cfg.pairs);
    S.level = n; S.total = cfg.pairs; S.matched = 0; S.open = []; S.lock = false;
    lvlEl.textContent = n;
    foundEl.textContent = '0';
    totalEl.textContent = cfg.pairs;

    let cols = cfg.cols;
    const count = cfg.pairs * 2;
    if (window.innerWidth > window.innerHeight && Math.ceil(count / cols) > cols) cols += 1;
    S.cols = cols;
    board.style.setProperty('--cols', cols);
    board.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
    fitBoard(cols, count);

    const deck = shuffle(pairs.concat(pairs).map((p, i) => ({ p, i })));
    board.innerHTML = '';
    deck.forEach((card, idx) => {
      const btn = document.createElement('button');
      btn.className = 'card';
      btn.type = 'button';
      btn.dataset.pair = card.p.id;
      btn.setAttribute('aria-label', 'Карточка');
      btn.style.animationDelay = (idx * 0.02) + 's';
      btn.innerHTML = `
        <span class="card-inner">
          <span class="face back">${PAW}</span>
          <span class="face front" style="background:${card.p.tint}">${card.p.svg}<span class="inner-glow"></span></span>
        </span>`;
      board.appendChild(btn);
    });
    fitBoard();
  }

  function fitBoard(cols, count) {
    const colsN = cols || S.cols || 3;
    const cards = count || (S.total * 2);
    const rows = Math.ceil(cards / colsN);
    const w = window.innerWidth, h = window.innerHeight;
    const gap = clamp(Math.min(w, h) * 0.016, 8, 18);
    const padX = Math.min(44, w * 0.05);
    const availW = w - padX * 2;
    const availH = h - (86 + 78) - gap;
    const cw = (availW - gap * (colsN - 1)) / colsN;
    const ch = (availH - gap * (rows - 1)) / rows;
    const ratio = 0.78;
    let cardW = Math.min(cw, ch * ratio);
    let cardH = cardW / ratio;
    if (cardH > ch) { cardH = ch; cardW = ch * ratio; }
    board.style.gap = gap + 'px';
    board.style.gridTemplateColumns = `repeat(${colsN}, ${Math.round(cardW)}px)`;
    board.style.gridAutoRows = Math.round(cardH) + 'px';
  }

  window.addEventListener('resize', () => { fitBoard(); });

  function onCard(e) {
    const btn = e.target.closest('.card');
    if (!btn || S.mode !== 'play' || S.lock) return;
    if (btn.classList.contains('flip') || btn.classList.contains('done')) return;
    audio.init(); audio.resume();
    btn.classList.add('flip');
    audio.flip();
    S.open.push(btn);
    if (S.open.length < 2) return;

    const [a, b] = S.open;
    S.moves++;
    if (a.dataset.pair === b.dataset.pair) {
      a.classList.add('done'); b.classList.add('done');
      S.matched++;
      foundEl.textContent = S.matched;
      audio.match();
      pop(foundEl.parentElement);
      S.open = [];
      if (S.matched >= S.total) setTimeout(finishLevel, 420);
    } else {
      S.lock = true;
      audio.miss();
      setTimeout(() => {
        a.classList.remove('flip');
        b.classList.remove('flip');
        S.open = [];
        S.lock = false;
      }, 820);
    }
  }

  function pop(el) {
    if (!el) return;
    el.classList.remove('pop');
    void el.offsetWidth;
    el.classList.add('pop');
  }

  function finishLevel() {
    S.mode = 'done';
    audio.win();
    const next = S.level + 1;
    ov.innerHTML = `
      <div class="panel">
        <div class="stars3"><i>★</i><i>★</i><i>★</i></div>
        <div class="levelnum">${next}</div>
        <button class="big" id="go" aria-label="Дальше">
          <svg viewBox="0 0 100 100"><path d="M37 24 L79 50 L37 76 Z"/></svg>
        </button>
      </div>`;
    ov.classList.add('on');
  }

  function showStart() {
    ov.innerHTML = `
      <div class="panel">
        <div class="stars3"><i>★</i><i>★</i><i>★</i></div>
        <button class="big" id="go" aria-label="Играть">
          <svg viewBox="0 0 100 100"><path d="M37 24 L79 50 L37 76 Z"/></svg>
        </button>
      </div>`;
    ov.classList.add('on');
  }

  function hideOverlay() { ov.classList.remove('on'); ov.innerHTML = ''; }

  function start() {
    audio.init(); audio.resume();
    S.mode = 'play';
    buildLevel(1);
    hideOverlay();
  }

  function next() {
    S.mode = 'play';
    buildLevel(S.level + 1);
    hideOverlay();
  }

  ov.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    audio.init(); audio.resume();
    if (S.mode === 'start') start();
    else if (S.mode === 'done') next();
  });

  board.addEventListener('click', onCard);

  soundBtn.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    audio.init(); audio.resume();
    audio.on = !audio.on;
    audio.mute(!audio.on);
    soundBtn.classList.toggle('off', !audio.on);
  });
  homeBtn.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    location.href = '../index.html';
  });

  const dbg = { mode: 'start', level: 1, matched: 0, total: 3, open: 0, cards: 0 };
  window.__dbg = dbg;
  setInterval(() => {
    dbg.mode = S.mode; dbg.level = S.level; dbg.matched = S.matched;
    dbg.total = S.total; dbg.open = S.open.length;
    dbg.cards = board.children.length;
  }, 100);

  buildLevel(1);
  showStart();
})();
