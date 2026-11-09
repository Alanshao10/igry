/* Синий трактор — поле, урожай, уровни. Для Тимура, 5 лет. */
(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const canvas = $('stage');
  const ctx = canvas.getContext('2d', { alpha: false });
  const lvlEl = $('lvl'), gotEl = $('got'), needEl = $('need');
  const lvlPill = $('lvlPill'), goalPill = $('goalPill');
  const ov = $('ov'), soundBtn = $('sound'), homeBtn = $('home');

  const GOALS = [8, 10, 12, 14, 16];
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = (a) => a[(Math.random() * a.length) | 0];

  const G = { w: 1, h: 1, dpr: 1, sc: 1 };
  const S = {
    mode: 'start', level: 1, got: 0, need: GOALS[0], total: 0,
    scroll: 0, speed: 200, tractX: 0, targetX: null, lean: 0, prevX: 0,
    items: [], props: [], puddles: [], parts: [], fireflies: [], deco: [],
    itemTimer: 0.6, propTimer: 0, puddleTimer: 3, smokeTimer: 0,
    slow: 0, shake: 0, t: 0, night: 0, started: false,
  };

  /* ---------- палитры ---------- */
  const PAL = [
    { base: '#7FCB63', row: '#74C25A', furrow: 'rgba(30,80,20,.07)', tree: '#2F8A5A', tree2: '#3FA96E', night: false, tint: null },
    { base: '#83CC5F', row: '#78C254', furrow: 'rgba(30,80,20,.07)', tree: '#2C8556', tree2: '#3DA368', night: false, tint: null },
    { base: '#C9A05C', row: '#BE9452', furrow: 'rgba(90,50,10,.10)', tree: '#8A6B3A', tree2: '#A07E45', night: false, tint: 'rgba(255,150,60,.10)' },
    { base: '#426E58', row: '#3A624E', furrow: 'rgba(0,0,0,.14)', tree: '#1E4A38', tree2: '#2A5C46', night: true, tint: 'rgba(120,170,230,.10)' },
    { base: '#7FD37A', row: '#74C86E', furrow: 'rgba(30,80,20,.06)', tree: '#3FA96E', tree2: '#57BE80', night: false, tint: 'rgba(255,220,120,.08)' },
  ];
  const pal = () => PAL[(S.level - 1) % PAL.length];

  const ITEM_SETS = [
    ['carrot', 'apple'],
    ['carrot', 'apple', 'pumpkin'],
    ['apple', 'pumpkin', 'corn'],
    ['pumpkin', 'corn', 'apple'],
    ['carrot', 'apple', 'pumpkin', 'corn'],
  ];
  const ITEM_COLORS = { carrot: '#F2802B', apple: '#E0453A', pumpkin: '#F08A2A', corn: '#F7C948' };

  /* ---------- звук ---------- */
  const audio = {
    ctx: null, master: null, engGain: null, osc1: null, osc2: null, lp: null, on: true,
    init() {
      if (this.ctx) return;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      try {
        const ac = new AC();
        this.ctx = ac;
        const master = ac.createGain(); master.gain.value = this.on ? 0.9 : 0;
        master.connect(ac.destination); this.master = master;

        const eg = ac.createGain(); eg.gain.value = 0;
        const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 320; lp.Q.value = 1.6;
        const o1 = ac.createOscillator(); o1.type = 'sawtooth'; o1.frequency.value = 46;
        const o2 = ac.createOscillator(); o2.type = 'square'; o2.frequency.value = 69;
        const g2 = ac.createGain(); g2.gain.value = 0.24;
        o1.connect(lp); o2.connect(g2); g2.connect(lp);
        lp.connect(eg); eg.connect(master);
        o1.start(); o2.start();
        this.osc1 = o1; this.osc2 = o2; this.lp = lp; this.engGain = eg;

        const lfo = ac.createOscillator(); lfo.frequency.value = 7.5;
        const lfoG = ac.createGain(); lfoG.gain.value = 0.012;
        lfo.connect(lfoG); lfoG.connect(eg.gain); lfo.start();
      } catch (e) { this.ctx = null; }
    },
    resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); },
    engine(on) {
      if (!this.ctx) return;
      this.engGain.gain.setTargetAtTime(on ? 0.05 : 0, this.ctx.currentTime, 0.25);
    },
    update(sp) {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      this.osc1.frequency.setTargetAtTime(40 + sp * 0.09, t, 0.1);
      this.osc2.frequency.setTargetAtTime(60 + sp * 0.12, t, 0.1);
      this.lp.frequency.setTargetAtTime(240 + sp * 1.2, t, 0.1);
    },
    mute(v) { if (this.master) this.master.gain.setTargetAtTime(v ? 0 : 0.9, this.ctx.currentTime, 0.05); },
    tone(freq, dur, type, gain, delay) {
      if (!this.ctx || !this.on) return;
      const t = this.ctx.currentTime + (delay || 0);
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = type || 'sine';
      o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(gain || 0.12, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(this.master);
      o.start(t); o.stop(t + dur + 0.05);
    },
    collect(n) {
      const base = [523, 587, 659, 784, 880][Math.min(4, n % 5)];
      this.tone(base, 0.16, 'triangle', 0.14);
      this.tone(base * 1.5, 0.22, 'sine', 0.08, 0.05);
    },
    splash() {
      if (!this.ctx || !this.on) return;
      const t = this.ctx.currentTime;
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(320, t);
      o.frequency.exponentialRampToValueAtTime(90, t + 0.25);
      g.gain.setValueAtTime(0.1, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
      o.connect(g); g.connect(this.master); o.start(t); o.stop(t + 0.32);
    },
    jingle() { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.3, 'triangle', 0.12, i * 0.11)); },
  };

  /* ---------- свечение ---------- */
  let glowSpr = null;
  function buildGlow() {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(64, 64, 4, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,250,205,.95)');
    g.addColorStop(0.4, 'rgba(255,238,150,.42)');
    g.addColorStop(1, 'rgba(255,230,120,0)');
    x.fillStyle = g; x.beginPath(); x.arc(64, 64, 64, 0, 7); x.fill();
    glowSpr = c;
  }

  /* ---------- раскладка ---------- */
  function layout() {
    const w = Math.max(320, window.innerWidth);
    const h = Math.max(320, window.innerHeight);
    G.w = w; G.h = h;
    G.dpr = clamp(window.devicePixelRatio || 1, 1, 2);
    canvas.width = Math.round(w * G.dpr);
    canvas.height = Math.round(h * G.dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(G.dpr, 0, 0, G.dpr, 0, 0);
    G.sc = clamp(Math.min(w, h) / 820, 0.8, 1.32);
    if (!S.started) S.tractX = w * 0.5;
    S.deco = [];
    for (let i = 0; i < 46; i++) {
      S.deco.push({
        x: rnd(0, w), y: rnd(0, h),
        kind: ['grass', 'grass', 'flower', 'stone'][(Math.random() * 4) | 0],
        s: rnd(9, 16),
        phase: rnd(0, 6),
      });
    }
    S.fireflies = [];
    for (let i = 0; i < 16; i++) {
      S.fireflies.push({ x: rnd(0, w), y: rnd(0, h), vx: rnd(-14, 14), vy: rnd(-12, 12), p: rnd(0, 6) });
    }
  }

  const tractorY = () => G.h * 0.76;
  const sc = () => G.sc;

  /* ---------- поле ---------- */
  function drawField() {
    const p = pal();
    ctx.fillStyle = p.base;
    ctx.fillRect(0, 0, G.w, G.h);

    // вертикальные грядки
    const rowW = Math.max(76, 104 * sc());
    ctx.fillStyle = p.row;
    for (let x = 0; x < G.w + rowW; x += rowW * 2) {
      ctx.fillRect(x, 0, rowW, G.h);
    }

    // поперечные борозды, бегут вниз
    ctx.strokeStyle = p.furrow;
    ctx.lineWidth = Math.max(1, 2 * sc());
    const gap = 132 * sc();
    const off = S.scroll % gap;
    for (let y = -gap + off; y < G.h + gap; y += gap) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(G.w, y);
      ctx.stroke();
    }

    // травинки у краёв
    ctx.strokeStyle = 'rgba(40,110,40,.16)';
    ctx.lineWidth = Math.max(1, 2 * sc());
    const off2 = (S.scroll * 1.0) % (74 * sc());
    for (let y = -74 * sc() + off2; y < G.h + 74 * sc(); y += 74 * sc()) {
      for (const side of [0, 1]) {
        const x = side ? G.w - 26 * sc() : 22 * sc();
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + (side ? -6 : 6) * sc(), y - 10 * sc());
        ctx.stroke();
      }
    }
  }

  function drawDeco() {
    const s0 = sc();
    for (const d of S.deco) {
      const x = d.x, y = d.y, s = d.s * s0;
      if (d.kind === 'grass') {
        ctx.strokeStyle = 'rgba(38,110,45,.22)';
        ctx.lineWidth = Math.max(1, 1.8 * s0);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x, y); ctx.lineTo(x - s * 0.35, y - s * 0.8);
        ctx.moveTo(x, y); ctx.lineTo(x, y - s * 1.0);
        ctx.moveTo(x, y); ctx.lineTo(x + s * 0.35, y - s * 0.7);
        ctx.stroke();
      } else if (d.kind === 'flower') {
        const sway = Math.sin(d.phase + S.t * 1.6) * s * 0.12;
        ctx.fillStyle = 'rgba(255,255,255,.85)';
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2;
          ctx.beginPath();
          ctx.arc(x + Math.cos(a) * s * 0.34 + sway, y - s * 0.7 + Math.sin(a) * s * 0.34, s * 0.26, 0, 7);
          ctx.fill();
        }
        ctx.fillStyle = '#FFC93C';
        ctx.beginPath(); ctx.arc(x + sway, y - s * 0.7, s * 0.24, 0, 7); ctx.fill();
      } else {
        ctx.fillStyle = 'rgba(150,165,170,.5)';
        ctx.beginPath(); ctx.ellipse(x, y, s * 0.34, s * 0.24, 0.4, 0, 7); ctx.fill();
      }
    }
  }

  /* ---------- предметы ---------- */
  function drawItem(type, x, y, s, phase) {
    const bob = Math.sin(phase) * s * 0.05;
    ctx.save();
    ctx.translate(x, y + bob);

    ctx.globalAlpha = 0.2;
    ctx.fillStyle = '#14361C';
    ctx.beginPath();
    ctx.ellipse(0, s * 0.42, s * 0.5, s * 0.16, 0, 0, 7);
    ctx.fill();
    ctx.globalAlpha = 1;

    if (glowSpr) {
      ctx.globalAlpha = 0.42;
      ctx.drawImage(glowSpr, -s, -s * 1.1, s * 2, s * 2);
      ctx.globalAlpha = 1;
    }

    const w = s * 0.9, h = s * 1.0;

    if (type === 'carrot') {
      ctx.fillStyle = '#F2802B';
      ctx.beginPath();
      ctx.moveTo(-w * 0.26, h * 0.36);
      ctx.quadraticCurveTo(w * 0.3, h * 0.24, 0, -h * 0.2);
      ctx.quadraticCurveTo(-w * 0.3, h * 0.24, -w * 0.26, h * 0.36);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(200,90,20,.5)';
      ctx.lineWidth = Math.max(1, s * 0.045);
      ctx.beginPath();
      ctx.moveTo(-w * 0.13, h * 0.2); ctx.lineTo(-w * 0.04, -h * 0.05);
      ctx.moveTo(w * 0.12, h * 0.22); ctx.lineTo(w * 0.03, -h * 0.02);
      ctx.stroke();
      ctx.fillStyle = '#4EA84C';
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.ellipse(i * w * 0.16, -h * 0.34, w * 0.11, h * 0.2, i * 0.55, 0, 7);
        ctx.fill();
      }
    } else if (type === 'apple') {
      ctx.fillStyle = '#E0453A';
      ctx.beginPath(); ctx.arc(0, h * 0.02, w * 0.46, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.3)';
      ctx.beginPath(); ctx.ellipse(-w * 0.16, -h * 0.12, w * 0.13, h * 0.09, -0.5, 0, 7); ctx.fill();
      ctx.strokeStyle = '#6B4A2A'; ctx.lineWidth = Math.max(1.4, s * 0.06); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(0, -h * 0.42); ctx.lineTo(w * 0.03, -h * 0.5); ctx.stroke();
      ctx.fillStyle = '#4EA84C';
      ctx.beginPath(); ctx.ellipse(w * 0.15, -h * 0.46, w * 0.15, h * 0.06, -0.5, 0, 7); ctx.fill();
    } else if (type === 'pumpkin') {
      ctx.fillStyle = '#F08A2A';
      ctx.beginPath(); ctx.ellipse(0, h * 0.04, w * 0.5, h * 0.4, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(190,100,20,.45)';
      ctx.lineWidth = Math.max(1, s * 0.045);
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.ellipse(i * w * 0.19, h * 0.04, w * 0.1, h * 0.38, 0, 0, 7);
        ctx.stroke();
      }
      ctx.fillStyle = '#4E7B32';
      ctx.fillRect(-w * 0.05, -h * 0.4, w * 0.1, h * 0.14);
    } else {
      ctx.fillStyle = '#F7C948';
      ctx.beginPath(); ctx.ellipse(0, h * 0.02, w * 0.3, h * 0.42, 0, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(214,158,30,.55)';
      for (let i = 0; i < 8; i++) {
        const px = rnd(-w * 0.18, w * 0.18), py = rnd(-h * 0.3, h * 0.28);
        ctx.beginPath(); ctx.arc(px, py, Math.max(0.8, s * 0.035), 0, 7); ctx.fill();
      }
      ctx.fillStyle = '#4E9B45';
      ctx.beginPath();
      ctx.moveTo(-w * 0.05, h * 0.44);
      ctx.quadraticCurveTo(-w * 0.55, h * 0.1, -w * 0.32, -h * 0.24);
      ctx.quadraticCurveTo(-w * 0.1, h * 0.1, -w * 0.05, h * 0.44);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(w * 0.05, h * 0.44);
      ctx.quadraticCurveTo(w * 0.55, h * 0.1, w * 0.32, -h * 0.24);
      ctx.quadraticCurveTo(w * 0.1, h * 0.1, w * 0.05, h * 0.44);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawPuddle(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.globalAlpha = 0.75;
    ctx.fillStyle = '#4E7F94';
    ctx.beginPath(); ctx.ellipse(0, 0, p.rx, p.ry, 0, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(190,235,250,.6)';
    ctx.beginPath(); ctx.ellipse(-p.rx * 0.2, -p.ry * 0.24, p.rx * 0.35, p.ry * 0.3, -0.2, 0, 7); ctx.fill();
    ctx.restore();
  }

  function drawProp(p) {
    const s = p.s * sc();
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = '#12351E';
    ctx.beginPath(); ctx.ellipse(0, s * 0.2, s * 0.9, s * 0.32, 0, 0, 7); ctx.fill();
    ctx.globalAlpha = 1;

    const q = pal();
    if (p.kind === 'tree') {
      ctx.fillStyle = q.tree;
      ctx.beginPath(); ctx.arc(0, 0, s, 0, 7); ctx.fill();
      ctx.fillStyle = q.tree2;
      ctx.beginPath(); ctx.arc(-s * 0.3, -s * 0.22, s * 0.62, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(s * 0.38, -s * 0.1, s * 0.5, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,.12)';
      ctx.beginPath(); ctx.arc(s * 0.3, s * 0.34, s * 0.4, 0, 7); ctx.fill();
    } else if (p.kind === 'bush') {
      ctx.fillStyle = q.tree;
      ctx.beginPath(); ctx.arc(-s * 0.3, 0, s * 0.6, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(s * 0.34, s * 0.06, s * 0.55, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(0, -s * 0.26, s * 0.52, 0, 7); ctx.fill();
    } else {
      ctx.fillStyle = '#E8C25E';
      ctx.save();
      ctx.rotate(0.35);
      rr(-s * 0.8, -s * 0.55, s * 1.6, s * 1.1, s * 0.28);
      ctx.fill();
      ctx.strokeStyle = 'rgba(160,115,40,.45)';
      ctx.lineWidth = Math.max(1, s * 0.09);
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(-s * 0.6, i * s * 0.3);
        ctx.lineTo(s * 0.6, i * s * 0.3);
        ctx.stroke();
      }
      ctx.restore();
    }
    ctx.restore();
  }

  /* ---------- трактор ---------- */
  let gradBody = null, gradGlass = null;
  function buildTractorGrads() {
    if (gradBody) return;
    gradBody = ctx.createLinearGradient(0, -130, 0, -20);
    gradBody.addColorStop(0, '#5B9BF0');
    gradBody.addColorStop(0.55, '#3B7BE6');
    gradBody.addColorStop(1, '#2456B4');
    gradGlass = ctx.createLinearGradient(0, -118, 0, -74);
    gradGlass.addColorStop(0, '#DDF4FE');
    gradGlass.addColorStop(0.55, '#9FD4EA');
    gradGlass.addColorStop(1, '#5C93B4');
  }

  function rr(x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function drawTrailer(x, y, s, count) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = '#0B2A1A';
    ctx.beginPath(); ctx.ellipse(0, 6, 84, 16, 0, 0, 7); ctx.fill();
    ctx.globalAlpha = 1;

    ctx.fillStyle = '#232B36';
    ctx.beginPath(); ctx.arc(-58, -6, 15, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(58, -6, 15, 0, 7); ctx.fill();
    ctx.fillStyle = '#FFC93C';
    ctx.beginPath(); ctx.arc(-58, -6, 5.5, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(58, -6, 5.5, 0, 7); ctx.fill();

    ctx.fillStyle = '#B7783F';
    rr(-72, -66, 144, 52, 10); ctx.fill();
    ctx.fillStyle = '#9A6231';
    for (let i = -60; i <= 60; i += 24) ctx.fillRect(i, -64, 4, 48);
    ctx.fillStyle = '#8A5528';
    rr(-76, -70, 152, 9, 4); ctx.fill();

    const n = Math.min(10, count);
    const cols = ['#F2802B', '#E0453A', '#F08A2A', '#F7C948'];
    for (let i = 0; i < n; i++) {
      const cx = -58 + (i % 5) * 29;
      const cy = -50 + Math.floor(i / 5) * -12;
      ctx.fillStyle = cols[i % 4];
      ctx.beginPath(); ctx.arc(cx, cy, 11, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.35)';
      ctx.beginPath(); ctx.arc(cx - 3, cy - 3, 3.2, 0, 7); ctx.fill();
    }
    ctx.restore();
  }

  function drawTractor(x, y, s, bounce) {
    const p = pal();
    ctx.save();
    ctx.translate(x, y + bounce);
    ctx.scale(s, s);

    ctx.globalAlpha = 0.22;
    ctx.fillStyle = '#0B2A1A';
    ctx.beginPath(); ctx.ellipse(0, 2, 104, 22, 0, 0, 7); ctx.fill();
    ctx.globalAlpha = 1;

    ctx.fillStyle = '#232B36';
    rr(-92, -78, 36, 74, 14); ctx.fill();
    rr(56, -78, 36, 74, 14); ctx.fill();
    ctx.save();
    ctx.strokeStyle = '#39414E'; ctx.lineWidth = 4;
    for (let i = 0; i < 5; i++) {
      const yy = -68 + i * 14;
      ctx.beginPath(); ctx.moveTo(-90, yy); ctx.lineTo(-58, yy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(58, yy); ctx.lineTo(90, yy); ctx.stroke();
    }
    ctx.restore();
    ctx.fillStyle = '#FFC93C';
    ctx.beginPath(); ctx.arc(-74, -40, 12, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(74, -40, 12, 0, 7); ctx.fill();
    ctx.fillStyle = '#C68A18';
    ctx.beginPath(); ctx.arc(-74, -40, 5, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(74, -40, 5, 0, 7); ctx.fill();

    ctx.fillStyle = '#2A5CB8';
    rr(-94, -92, 40, 24, 10); ctx.fill();
    rr(54, -92, 40, 24, 10); ctx.fill();

    ctx.fillStyle = gradBody;
    rr(-62, -128, 124, 88, 18); ctx.fill();

    ctx.fillStyle = gradGlass;
    rr(-44, -120, 88, 46, 12); ctx.fill();
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(-36, -116); ctx.lineTo(-8, -116); ctx.lineTo(-30, -82); ctx.lineTo(-38, -96);
    ctx.closePath(); ctx.fill();
    ctx.restore();

    ctx.fillStyle = '#FF8A3D';
    rr(-68, -140, 136, 16, 8); ctx.fill();
    ctx.fillStyle = '#E0722A';
    rr(-68, -132, 136, 5, 2.5); ctx.fill();

    if (p.night) {
      const blink = Math.sin(S.t * 5) > 0;
      ctx.fillStyle = blink ? '#FFE066' : '#B8862A';
      ctx.beginPath(); ctx.arc(0, -150, 8, 0, 7); ctx.fill();
      if (blink) {
        ctx.globalAlpha = 0.35;
        ctx.beginPath(); ctx.arc(0, -150, 20, 0, 7); ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    ctx.fillStyle = '#8C97A6';
    rr(44, -168, 12, 34, 5); ctx.fill();
    ctx.fillStyle = '#6E7A8A';
    rr(40, -172, 20, 8, 4); ctx.fill();

    ctx.fillStyle = '#E4572E';
    rr(-56, -64, 18, 10, 5); ctx.fill();
    rr(38, -64, 18, 10, 5); ctx.fill();

    ctx.fillStyle = '#FFF3D0';
    rr(-16, -44, 32, 14, 4); ctx.fill();
    ctx.fillStyle = '#21313C';
    ctx.font = '700 10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Т-25', 0, -33);

    ctx.restore();
  }

  /* ---------- частицы ---------- */
  function addParticle(p) { if (S.parts.length < 240) S.parts.push(p); }

  function burst(x, y, color, n, power) {
    for (let i = 0; i < n; i++) {
      const a = rnd(0, Math.PI * 2), sp = rnd(40, 190) * (power || 1);
      addParticle({
        x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 60,
        g: 420, life: rnd(0.4, 0.8), max: 0.8, size: rnd(2, 5.5), color, kind: 'dot',
      });
    }
  }

  function splash(x, y) {
    for (let i = 0; i < 12; i++) {
      addParticle({
        x: x + rnd(-14, 14), y, vx: rnd(-90, 90), vy: rnd(-180, -60),
        g: 520, life: rnd(0.3, 0.6), max: 0.6, size: rnd(2, 5), color: '#BFE6F2', kind: 'dot',
      });
    }
  }

  function flyToBasket(it) {
    const rect = goalPill.getBoundingClientRect();
    addParticle({
      x: it.x, y: it.y,
      tx: rect.left + rect.width * 0.32, ty: rect.top + rect.height * 0.5,
      t: 0, dur: 0.55, size: 26 * sc(), color: ITEM_COLORS[it.type], kind: 'fly',
    });
  }

  /* ---------- уровни ---------- */
  function setLevel(n) {
    S.level = n;
    S.need = n <= GOALS.length ? GOALS[n - 1] : 16 + (n - GOALS.length) * 2;
    S.got = 0;
    S.items.length = 0;
    S.puddles.length = 0;
    S.itemTimer = 1.1;
    S.puddleTimer = 3.5;
    lvlEl.textContent = n;
    needEl.textContent = S.need;
    gotEl.textContent = '0';
  }

  function pop(el) {
    if (!el) return;
    el.classList.remove('pop');
    void el.offsetWidth;
    el.classList.add('pop');
  }

  function collect(it) {
    S.got++;
    S.total++;
    gotEl.textContent = S.got;
    pop(goalPill);
    audio.collect(S.got);
    flyToBasket(it);
    burst(it.x, it.y, ITEM_COLORS[it.type], 8, 0.8);
    if (S.got >= S.need) finishLevel();
  }

  function finishLevel() {
    S.mode = 'done';
    audio.jingle();
    audio.engine(false);
    for (let i = 0; i < 3; i++) {
      setTimeout(() => burst(G.w * rnd(0.2, 0.8), G.h * rnd(0.25, 0.5), pick(['#FFC93C', '#FF8A3D', '#7ED0EC']), 18, 1.2), i * 160);
    }
    showOverlay();
  }

  /* ---------- оверлей ---------- */
  function showOverlay() {
    if (S.mode === 'start') {
      ov.innerHTML = `
        <div class="panel">
          <div class="stars3"><i>★</i><i>★</i><i>★</i></div>
          <button class="big" id="go" aria-label="Играть">
            <svg viewBox="0 0 100 100"><path d="M37 24 L79 50 L37 76 Z"/></svg>
          </button>
        </div>`;
    } else {
      const next = S.level + 1;
      ov.innerHTML = `
        <div class="panel">
          <div class="stars3"><i>★</i><i>★</i><i>★</i></div>
          <div class="levelnum">${next}</div>
          <button class="big" id="go" aria-label="Дальше">
            <svg viewBox="0 0 100 100"><path d="M37 24 L79 50 L37 76 Z"/></svg>
          </button>
        </div>`;
    }
    ov.classList.add('on');
  }

  function hideOverlay() { ov.classList.remove('on'); ov.innerHTML = ''; }

  function startGame() {
    audio.init();
    audio.resume();
    audio.engine(true);
    S.mode = 'play';
    S.started = true;
    S.t = 0;
    S.total = 0;
    S.scroll = 0;
    S.tractX = G.w * 0.5;
    S.targetX = null;
    setLevel(1);
    hideOverlay();
  }

  function nextLevel() {
    audio.jingle();
    audio.engine(true);
    S.mode = 'play';
    setLevel(S.level + 1);
    hideOverlay();
  }

  ov.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (S.mode === 'start') startGame();
    else if (S.mode === 'done') nextLevel();
  });

  /* ---------- управление ---------- */
  let activePointer = null;
  function onDown(e) {
    if (S.mode !== 'play') return;
    activePointer = e.pointerId;
    S.targetX = e.clientX;
    audio.resume();
  }
  function onMove(e) {
    if (S.mode !== 'play' || e.pointerId !== activePointer) return;
    S.targetX = e.clientX;
  }
  function onUp(e) {
    if (e.pointerId === activePointer) activePointer = null;
  }
  canvas.addEventListener('pointerdown', onDown, { passive: true });
  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerup', onUp, { passive: true });
  window.addEventListener('pointercancel', onUp, { passive: true });
  document.addEventListener('gesturestart', (e) => e.preventDefault());

  /* ---------- шаг ---------- */
  function spawnItem() {
    const types = ITEM_SETS[(S.level - 1) % ITEM_SETS.length];
    const size = 60 * sc();
    S.items.push({
      x: rnd(size, G.w - size),
      y: -70 * sc(),
      type: pick(types),
      phase: rnd(0, 6),
      s: size,
    });
  }

  function spawnProp() {
    const side = Math.random() < 0.5 ? -1 : 1;
    const kind = Math.random() < 0.55 ? 'tree' : (Math.random() < 0.5 ? 'bush' : 'hay');
    const s = (kind === 'tree' ? rnd(46, 62) : kind === 'hay' ? rnd(30, 38) : rnd(26, 34)) * sc();
    const x = side < 0 ? rnd(-10, 90 * sc()) : rnd(G.w - 90 * sc(), G.w + 10);
    S.props.push({ x, y: -110 * sc(), kind, s });
  }

  function step(dt) {
    S.t += dt;
    const playing = S.mode === 'play';

    const base = 170 + Math.min(90, (S.level - 1) * 22);
    const target = playing ? base * (S.slow > 0 ? 0.42 : 1) : 40;
    S.speed += (target - S.speed) * Math.min(1, dt * 3);
    S.scroll += S.speed * dt;
    if (S.slow > 0) S.slow -= dt;

    if (playing) {
      if (S.targetX != null) S.tractX += (S.targetX - S.tractX) * (1 - Math.exp(-dt * 11));
      S.tractX = clamp(S.tractX, G.w * 0.11, G.w * 0.89);
    }
    const vx = (S.tractX - S.prevX) / Math.max(dt, 0.001);
    S.prevX = S.tractX;
    S.lean += (clamp(vx / 2400, -1, 1) - S.lean) * Math.min(1, dt * 6);

    const ty = tractorY();

    for (const it of S.items) {
      it.y += S.speed * dt;
      it.phase += dt * 3.2;
    }
    for (const p of S.props) p.y += S.speed * dt;
    for (const pd of S.puddles) pd.y += S.speed * dt;
    for (const d of S.deco) {
      d.y += S.speed * dt;
      if (d.y > G.h + 26) { d.y = -26; d.x = rnd(0, G.w); d.kind = ['grass', 'grass', 'flower', 'stone'][(Math.random() * 4) | 0]; }
    }

    if (playing) {
      for (const it of S.items) {
        if (it.taken) continue;
        if (it.y > ty - 74 * sc() && it.y < ty + 26 * sc() && Math.abs(it.x - S.tractX) < 74 * sc()) {
          it.taken = true;
          collect(it);
        }
      }
      for (const pd of S.puddles) {
        if (pd.hit) continue;
        if (Math.abs(pd.y - ty) < 46 * sc() && Math.abs(pd.x - S.tractX) < pd.rx * 0.85) {
          pd.hit = true;
          S.slow = 0.8;
          splash(pd.x, ty + 20 * sc());
          audio.splash();
          S.shake = 6;
        }
      }
    }

    S.items = S.items.filter((it) => !it.taken && it.y < G.h + 100 * sc());
    S.puddles = S.puddles.filter((p) => !p.hit && p.y < G.h + 120 * sc());
    S.props = S.props.filter((p) => p.y < G.h + 160 * sc());

    if (playing) {
      S.itemTimer -= dt;
      if (S.itemTimer <= 0) {
        spawnItem();
        S.itemTimer = Math.max(0.62, 0.98 - S.level * 0.03) * rnd(0.85, 1.15);
      }
      S.puddleTimer -= dt;
      if (S.puddleTimer <= 0) {
        const rx = rnd(48, 84) * sc();
        S.puddles.push({ x: rnd(rx + 20, G.w - rx - 20), y: -90 * sc(), rx, ry: rx * 0.62 });
        S.puddleTimer = rnd(3.4, 5.6);
      }
    }
    S.propTimer -= dt;
    if (S.propTimer <= 0) {
      spawnProp();
      if (Math.random() < 0.45) spawnProp();
      S.propTimer = rnd(0.24, 0.5);
    }

    S.smokeTimer -= dt;
    if (S.smokeTimer <= 0 && playing) {
      S.smokeTimer = 0.22;
      addParticle({
        x: S.tractX + 50 * sc(), y: ty - 168 * sc(),
        vx: rnd(-14, 8), vy: rnd(-52, -30), g: -6,
        life: 0.85, max: 0.85, size: rnd(5, 9) * sc(), color: 'rgba(238,243,248,.5)', kind: 'puff',
      });
    }

    for (const p of S.parts) {
      if (p.kind === 'fly') {
        p.t += dt;
        const k = clamp(p.t / p.dur, 0, 1);
        p.x += (p.tx - p.x) * Math.min(1, dt * (3 + k * 14));
        p.y += (p.ty - p.y) * Math.min(1, dt * (3 + k * 14));
        p.life = 1 - k;
      } else {
        p.life -= dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += (p.g || 0) * dt;
      }
    }
    S.parts = S.parts.filter((p) => p.life > 0);

    S.shake *= Math.exp(-dt * 7);
    S.night += ((pal().night ? 1 : 0) - S.night) * Math.min(1, dt * 2.5);

    for (const f of S.fireflies) {
      f.x += f.vx * dt; f.y += f.vy * dt; f.p += dt * 2;
      if (f.x < -20) f.x = G.w + 20;
      if (f.x > G.w + 20) f.x = -20;
      if (f.y < -20) f.y = G.h + 20;
      if (f.y > G.h + 20) f.y = -20;
    }

    audio.update(S.speed);
  }

  /* ---------- рисование ---------- */
  function draw() {
    ctx.setTransform(G.dpr, 0, 0, G.dpr, 0, 0);
    ctx.save();
    if (S.shake > 0.3) ctx.translate(rnd(-1, 1) * S.shake, rnd(-1, 1) * S.shake * 0.6);

    drawField();

    // тени-пятна на поле
    const p = pal();
    if (p.tint) {
      ctx.fillStyle = p.tint;
      ctx.fillRect(0, 0, G.w, G.h);
    }

    drawDeco();

    // лужи
    for (const pd of S.puddles) drawPuddle(pd);

    // декор
    const props = S.props.slice().sort((a, b) => a.y - b.y);
    for (const pr of props) drawProp(pr);

    // предметы
    for (const it of S.items) {
      if (it.y < -60 * sc() || it.y > G.h + 60 * sc()) continue;
      drawItem(it.type, it.x, it.y, it.s, it.phase);
    }

    // трактор с прицепом
    const s = sc();
    const ty = tractorY();
    const bounce = Math.sin(S.t * 9) * 2.2 * s;
    drawTrailer(S.tractX, ty + 84 * s, s, S.got);
    drawTractor(S.tractX, ty, s, bounce);

    // частицы
    for (const pt of S.parts) {
      const a = clamp(pt.life / (pt.max || 1), 0, 1);
      ctx.globalAlpha = a;
      if (pt.kind === 'puff') {
        ctx.fillStyle = pt.color;
        ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.size * (1.7 - a * 0.7), 0, 7); ctx.fill();
      } else if (pt.kind === 'fly') {
        ctx.fillStyle = pt.color;
        ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.size * 0.4 * a + 3, 0, 7); ctx.fill();
      } else {
        ctx.fillStyle = pt.color;
        ctx.beginPath(); ctx.arc(pt.x, pt.y, Math.max(0.8, pt.size * a), 0, 7); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    // ночь
    if (S.night > 0.02) {
      ctx.save();
      ctx.globalAlpha = 0.55 * S.night;
      ctx.fillStyle = '#0B1B33';
      ctx.fillRect(0, 0, G.w, G.h);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(S.tractX, ty - 40 * s, 20, S.tractX, ty - 40 * s, 360 * s);
      g.addColorStop(0, `rgba(255,236,170,${0.30 * S.night})`);
      g.addColorStop(0.5, `rgba(255,220,140,${0.10 * S.night})`);
      g.addColorStop(1, 'rgba(255,220,140,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(S.tractX, ty - 40 * s, 360 * s, 0, 7); ctx.fill();

      ctx.globalAlpha = 0.9 * S.night;
      ctx.fillStyle = '#FFF2A8';
      for (const f of S.fireflies) {
        const k = 0.5 + Math.sin(f.p) * 0.5;
        ctx.beginPath(); ctx.arc(f.x, f.y, 2.2 * k + 1, 0, 7); ctx.fill();
      }
      ctx.restore();
    }

    ctx.restore();
  }

  /* ---------- цикл ---------- */
  const dbg = { fps: 0, mode: 'start', level: 1, got: 0, need: 8, items: 0, speed: 0, w: 0, h: 0 };
  window.__dbg = dbg;

  let last = 0, acc = 0, frames = 0;
  function frame(ts) {
    requestAnimationFrame(frame);
    if (!last) last = ts;
    let dt = (ts - last) / 1000;
    last = ts;
    dt = Math.min(dt, 0.05);
    if (document.hidden) return;
    step(dt);
    draw();

    acc += dt; frames++;
    if (acc >= 1) { dbg.fps = Math.round(frames / acc); acc = 0; frames = 0; }
    dbg.mode = S.mode; dbg.level = S.level; dbg.got = S.got; dbg.need = S.need;
    dbg.items = S.items.length; dbg.speed = Math.round(S.speed); dbg.w = G.w; dbg.h = G.h;
    dbg.itemList = S.items.slice(0, 8).map((it) => ({ x: Math.round(it.x), y: Math.round(it.y) }));
  }

  /* ---------- кнопки ---------- */
  soundBtn.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    audio.on = !audio.on;
    audio.mute(!audio.on);
    soundBtn.classList.toggle('off', !audio.on);
  });
  homeBtn.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    location.href = '../index.html';
  });

  window.addEventListener('resize', layout);
  window.addEventListener('orientationchange', () => setTimeout(layout, 350));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) audio.engine(false);
    else if (S.mode === 'play') audio.engine(true);
    last = 0;
  });

  buildGlow();
  buildTractorGrads();
  layout();
  showOverlay();
  requestAnimationFrame(frame);
})();
