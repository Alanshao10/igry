/* Три кота — пицца по заказу. Для Тимура, 5 лет. */
(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const catEl = $('cat'), wantEl = $('want'), pizzaEl = $('pizza'), topsEl = $('toppings');
  const shelfEl = $('shelf'), lvlEl = $('lvl'), doneEl = $('doneCount'), needEl = $('needCount');
  const ov = $('ov'), soundBtn = $('sound'), homeBtn = $('home');

  /* ---------- ингредиенты ---------- */
  const ING = {
    tomato: {
      name: 'помидор', color: '#E4572E',
      svg: `<svg viewBox="0 0 100 100"><circle cx="50" cy="54" r="36" fill="#E4572E"/><circle cx="40" cy="42" r="10" fill="#F07A55" opacity=".7"/><path d="M50 18 q-10 -8 -22 -4 q10 12 22 10 q12 2 22 -10 q-12 -4 -22 4z" fill="#4E9B45"/></svg>`,
      spots: [[30, 32], [68, 34], [50, 64], [24, 62], [74, 62]],
    },
    mushroom: {
      name: 'грибы', color: '#D9C29A',
      svg: `<svg viewBox="0 0 100 100"><path d="M14 54 a36 30 0 0 1 72 0 z" fill="#E8D6B4"/><path d="M14 54 a36 30 0 0 1 72 0" fill="none" stroke="#C9B189" stroke-width="6"/><rect x="38" y="54" width="24" height="30" rx="9" fill="#F7EEDC"/><circle cx="38" cy="42" r="7" fill="#C9B189" opacity=".55"/><circle cx="62" cy="36" r="5" fill="#C9B189" opacity=".55"/></svg>`,
      spots: [[36, 24], [62, 42], [30, 50], [70, 56], [48, 72]],
    },
    olive: {
      name: 'оливки', color: '#3B3B4A',
      svg: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="34" fill="#3B3B4A"/><circle cx="50" cy="50" r="14" fill="#7A5A48"/><circle cx="50" cy="50" r="14" fill="none" stroke="#2A2A36" stroke-width="4"/><circle cx="38" cy="36" r="7" fill="#6E6E80" opacity=".5"/></svg>`,
      spots: [[26, 42], [52, 30], [74, 44], [44, 56], [62, 68]],
    },
    pepperoni: {
      name: 'колбаса', color: '#D64545',
      svg: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="36" fill="#D64545"/><circle cx="50" cy="50" r="36" fill="none" stroke="#B23434" stroke-width="5"/><circle cx="36" cy="42" r="5" fill="#A52C2C"/><circle cx="62" cy="38" r="4" fill="#A52C2C"/><circle cx="56" cy="62" r="5" fill="#A52C2C"/><circle cx="40" cy="62" r="3.5" fill="#A52C2C"/></svg>`,
      spots: [[42, 28], [70, 48], [30, 58], [56, 60], [80, 32]],
    },
    pepper: {
      name: 'перец', color: '#5FAF4C',
      svg: `<svg viewBox="0 0 100 100"><path d="M20 58 q18 -30 42 -22 q26 8 18 30 q-8 22 -34 14 q-24 -8 -26 -22z" fill="#5FAF4C"/><path d="M28 56 q16 -18 34 -12" stroke="#7ECB68" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M50 34 q2 -14 12 -18" stroke="#3E8B32" stroke-width="7" fill="none" stroke-linecap="round"/></svg>`,
      spots: [[34, 44], [60, 30], [48, 50], [72, 66], [26, 66]],
    },
  };
  const ORDER_POOL = ['tomato', 'mushroom', 'olive', 'pepperoni', 'pepper'];

  const ORDERS = [
    ['tomato', 'mushroom'],
    ['olive', 'pepperoni'],
    ['tomato', 'pepper', 'olive'],
    ['mushroom', 'pepperoni', 'pepper'],
    ['tomato', 'mushroom', 'olive', 'pepper'],
  ];

  /* ---------- котик ---------- */
  function catFace(happy) {
    return `<svg viewBox="0 0 200 200" aria-hidden="true">
      <path d="M40 72 L26 14 L88 44 Z" fill="#F59A3C"/>
      <path d="M160 72 L174 14 L112 44 Z" fill="#F59A3C"/>
      <path d="M50 64 L42 30 L78 48 Z" fill="#F6B3C6"/>
      <path d="M150 64 L158 30 L122 48 Z" fill="#F6B3C6"/>
      <circle cx="100" cy="112" r="66" fill="#F59A3C"/>
      <path d="M82 56 q6 16 0 30 M100 50 q6 16 0 34 M118 56 q-6 16 0 30" stroke="#D97C22" stroke-width="7" fill="none" stroke-linecap="round"/>
      ${happy
        ? `<path d="M62 106 q14 -16 28 0 M110 106 q14 -16 28 0" stroke="#21313C" stroke-width="6" fill="none" stroke-linecap="round"/>
           <path d="M100 128 q-16 22 -30 4 M100 128 q16 22 30 4" stroke="#21313C" stroke-width="5" fill="none" stroke-linecap="round"/>
           <ellipse cx="100" cy="136" rx="9" ry="6" fill="#E86A8A"/>`
        : `<ellipse cx="76" cy="104" rx="16" ry="18" fill="#FFFFFF"/><ellipse cx="124" cy="104" rx="16" ry="18" fill="#FFFFFF"/>
           <circle cx="78" cy="107" r="7.5" fill="#21313C"/><circle cx="122" cy="107" r="7.5" fill="#21313C"/>
           <circle cx="80.5" cy="103.5" r="2.6" fill="#FFFFFF"/><circle cx="124.5" cy="103.5" r="2.6" fill="#FFFFFF"/>
           <ellipse cx="100" cy="130" rx="8" ry="6" fill="#E86A8A"/>
           <path d="M100 136 v6 M100 142 q-8 8 -15 1 M100 142 q8 8 15 1" stroke="#21313C" stroke-width="3.4" fill="none" stroke-linecap="round"/>`}
      <circle cx="62" cy="126" r="9" fill="#F58FA8" opacity=".35"/>
      <circle cx="138" cy="126" r="9" fill="#F58FA8" opacity=".35"/>
    </svg>`;
  }

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
      g.gain.exponentialRampToValueAtTime(gain || 0.12, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + 0.05);
    },
    put() { this.tone(520, 0.12, 'triangle', 0.11); this.tone(780, 0.16, 'sine', 0.06, 0.04); },
    nope() { this.tone(180, 0.15, 'sine', 0.07); },
    ready() { [659, 784, 988, 1319].forEach((f, i) => this.tone(f, 0.3, 'triangle', 0.11, i * 0.09)); },
  };

  /* ---------- состояние ---------- */
  const S = { level: 1, mode: 'start', order: [], added: [], done: 0 };

  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function buildShelf() {
    shelfEl.innerHTML = '';
    ORDER_POOL.forEach((type) => {
      const b = document.createElement('button');
      b.className = 'ing';
      b.type = 'button';
      b.dataset.type = type;
      b.setAttribute('aria-label', ING[type].name);
      b.innerHTML = `<span class="ing-art">${ING[type].svg}</span><span class="ing-puff"></span>`;
      shelfEl.appendChild(b);
    });
  }

  function buildOrder(level) {
    const idx = (level - 1) % ORDERS.length;
    const want = ORDERS[idx].slice();
    S.level = level;
    S.order = want;
    S.added = [];
    S.done = 0;
    lvlEl.textContent = level;
    doneEl.textContent = '0';
    needEl.textContent = want.length;
    catEl.innerHTML = catFace(false);
    catEl.classList.remove('happy');

    wantEl.innerHTML = want.map((t, i) => `
      <span class="want-item" data-type="${t}" style="--i:${i}">
        <span class="want-art">${ING[t].svg}</span>
        <span class="want-tick">✓</span>
      </span>`).join('');

    topsEl.innerHTML = '';
    pizzaEl.classList.remove('ready');
  }

  function toppingEl(type, spot) {
    const s = document.createElement('span');
    s.className = 'top';
    s.style.left = spot[0] + '%';
    s.style.top = spot[1] + '%';
    s.style.transform = `translate(-50%,-50%) rotate(${Math.round(Math.random() * 60 - 30)}deg)`;
    s.innerHTML = ING[type].svg;
    return s;
  }

  function addTopping(type) {
    S.added.push(type);
    S.done = S.added.length;
    doneEl.textContent = S.done;
    const spot = ING[type].spots[S.added.filter((t) => t === type).length - 1] || [50, 50];
    topsEl.appendChild(toppingEl(type, spot));
    const wantItem = wantEl.querySelector(`.want-item[data-type="${type}"]`);
    if (wantItem) wantItem.classList.add('got');
    audio.put();
    if (S.added.length >= S.order.length) pizzaReady();
  }

  function pizzaReady() {
    S.mode = 'done';
    pizzaEl.classList.add('ready');
    catEl.innerHTML = catFace(true);
    catEl.classList.add('happy');
    audio.ready();
    hearts();
    setTimeout(showWin, 1150);
  }

  function hearts() {
    const box = document.createElement('div');
    box.className = 'hearts';
    for (let i = 0; i < 10; i++) {
      const h = document.createElement('i');
      h.textContent = '♥';
      h.style.left = (10 + Math.random() * 80) + '%';
      h.style.animationDelay = (Math.random() * 0.5) + 's';
      h.style.fontSize = (14 + Math.random() * 20) + 'px';
      box.appendChild(h);
    }
    document.body.appendChild(box);
    setTimeout(() => box.remove(), 2200);
  }

  function showWin() {
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
    buildOrder(1);
    hideOverlay();
  }
  function next() {
    S.mode = 'play';
    buildOrder(S.level + 1);
    hideOverlay();
  }

  ov.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    audio.init(); audio.resume();
    if (S.mode === 'start') start();
    else if (S.mode === 'done') next();
  });

  shelfEl.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    const btn = e.target.closest('.ing');
    if (!btn || S.mode !== 'play') return;
    audio.init(); audio.resume();
    const type = btn.dataset.type;
    if (S.order.indexOf(type) >= 0 && S.added.indexOf(type) < 0) {
      addTopping(type);
    } else {
      btn.classList.remove('shake');
      void btn.offsetWidth;
      btn.classList.add('shake');
      audio.nope();
      const puff = btn.querySelector('.ing-puff');
      if (puff) {
        puff.classList.remove('go');
        void puff.offsetWidth;
        puff.classList.add('go');
      }
    }
  });

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

  const dbg = { mode: 'start', level: 1, order: 0, added: 0 };
  window.__dbg = dbg;
  setInterval(() => {
    dbg.mode = S.mode; dbg.level = S.level; dbg.order = S.order.length; dbg.added = S.added.length;
  }, 100);

  buildShelf();
  buildOrder(1);
  showStart();
})();
