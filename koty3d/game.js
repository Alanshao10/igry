import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

/* ================= камера, свет, сцена ================= */
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, 16 / 9, 0.1, 400);

const steps = new Uint8Array([80, 130, 180, 225, 255]);
const gradientMap = new THREE.DataTexture(steps, steps.length, 1, THREE.RedFormat);
gradientMap.minFilter = THREE.NearestFilter;
gradientMap.magFilter = THREE.NearestFilter;
gradientMap.needsUpdate = true;
const toon = (color, extra = {}) => new THREE.MeshToonMaterial({ color, gradientMap, ...extra });

const outlineMat = new THREE.MeshBasicMaterial({ color: 0x26332C, side: THREE.BackSide });
function ink(mesh, k = 1.05) {
  const o = new THREE.Mesh(mesh.geometry, outlineMat);
  o.scale.setScalar(k);
  o.castShadow = false;
  o.receiveShadow = false;
  mesh.add(o);
  return mesh;
}
const rbox = (w, h, d, r = 0.12, s = 3) => new RoundedBoxGeometry(w, h, d, s, r);

/* ================= палитры ================= */
const PALETTES = [
  { sky: ['#8FD8F0', '#CFEFF6', '#FFF3D8'], hemiSky: 0xD8F1FF, hemiI: 1.05, sunC: 0xFFF1CE, sunI: 2.2, fog: 0xE3F3EC, night: false },
  { sky: ['#5FC2E8', '#B7E7F2', '#EDF8DA'], hemiSky: 0xDFF5FF, hemiI: 1.2, sunC: 0xFFF8E0, sunI: 2.5, fog: 0xEAF7E9, night: false },
  { sky: ['#FF9E6B', '#FFC98F', '#FFE9C4'], hemiSky: 0xFFD8B0, hemiI: 0.95, sunC: 0xFFB573, sunI: 2.1, fog: 0xF7DDBB, night: false },
  { sky: ['#26365C', '#47568A', '#9C9EC4'], hemiSky: 0x93A9DA, hemiI: 0.5, sunC: 0xC3CEFF, sunI: 0.65, fog: 0x404E70, night: true },
];

const hemi = new THREE.HemisphereLight(0xD8F1FF, 0x6FAE5A, 1.05);
scene.add(hemi);
const amb = new THREE.AmbientLight(0xFFFFFF, 0.22);
scene.add(amb);

const sun = new THREE.DirectionalLight(0xFFF1CE, 2.2);
sun.position.set(-9, 16, 8);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -14;
sun.shadow.camera.right = 14;
sun.shadow.camera.top = 16;
sun.shadow.camera.bottom = -16;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 60;
sun.shadow.bias = -0.0008;
sun.shadow.normalBias = 0.03;
scene.add(sun);

const rim = new THREE.DirectionalLight(0xFFD9A0, 0.5);
rim.position.set(10, 8, -10);
scene.add(rim);

scene.fog = new THREE.Fog(0xE3F3EC, 60, 190);

/* ================= небо ================= */
let skyTex = null;
function buildSky(pal) {
  const c = document.createElement('canvas');
  c.width = 16; c.height = 512;
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, pal.sky[0]);
  g.addColorStop(0.55, pal.sky[1]);
  g.addColorStop(1, pal.sky[2]);
  x.fillStyle = g;
  x.fillRect(0, 0, 16, 512);

  if (pal.night) {
    for (let i = 0; i < 90; i++) {
      x.fillStyle = `rgba(255,250,220,${0.35 + Math.random() * 0.6})`;
      const r = Math.random() * 1.6 + 0.5;
      x.beginPath();
      x.arc(Math.random() * 16, Math.random() * 300, r, 0, 7);
      x.fill();
    }
  } else {
    const sx = 16 * 0.72, sy = 512 * 0.13, r = 46;
    const sg = x.createRadialGradient(sx, sy, 2, sx, sy, r * 2.4);
    sg.addColorStop(0, 'rgba(255,252,225,1)');
    sg.addColorStop(0.3, 'rgba(255,246,190,.85)');
    sg.addColorStop(1, 'rgba(255,240,170,0)');
    x.fillStyle = sg;
    x.beginPath(); x.arc(sx, sy, r * 2.4, 0, 7); x.fill();
  }

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (skyTex) skyTex.dispose();
  skyTex = t;
  scene.background = t;
}
buildSky(PALETTES[0]);

/* ================= земля и дорожка ================= */
function grassTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const x = c.getContext('2d');
  x.fillStyle = '#74CB62';
  x.fillRect(0, 0, 256, 256);
  x.fillStyle = '#69C057';
  for (let i = -256; i < 512; i += 92) {
    x.beginPath();
    x.moveTo(i, 0); x.lineTo(i + 30, 0); x.lineTo(i + 30 + 256, 256); x.lineTo(i + 256, 256);
    x.closePath(); x.fill();
  }
  for (let i = 0; i < 420; i++) {
    x.fillStyle = Math.random() < 0.5 ? 'rgba(255,255,255,.07)' : 'rgba(0,70,0,.06)';
    x.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(34, 34);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function pathTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const x = c.getContext('2d');
  x.fillStyle = '#E3C489';
  x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 320; i++) {
    const r = Math.random() * 4 + 1.2;
    x.fillStyle = Math.random() < 0.5 ? 'rgba(196,160,105,.30)' : 'rgba(246,228,188,.42)';
    x.beginPath();
    x.ellipse(Math.random() * 256, Math.random() * 256, r, r * 0.7, Math.random() * 3, 0, 7);
    x.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1.4, 26);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const grassTex = grassTexture();
const ground = new THREE.Mesh(new THREE.CircleGeometry(320, 48), toon(0xFFFFFF, { map: grassTex }));
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const pathTex = pathTexture();
const pathMesh = new THREE.Mesh(new THREE.PlaneGeometry(8, 190), toon(0xFFFFFF, { map: pathTex }));
pathMesh.rotation.x = -Math.PI / 2;
pathMesh.position.set(0, 0.02, -70);
pathMesh.receiveShadow = true;
scene.add(pathMesh);

// бортики дорожки
for (const sx of [-4.05, 4.05]) {
  const edge = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.16, 190), toon(0xC9A96C));
  edge.position.set(sx, 0.08, -70);
  edge.receiveShadow = true;
  scene.add(edge);
}

/* ================= дальние холмы ================= */
{
  const hillMat = toon(0x9BD3AA);
  for (const [x, z, sx, sy, sz] of [[-60, -150, 50, 12, 30], [10, -170, 60, 15, 34], [70, -155, 52, 11, 30]]) {
    const h = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), hillMat);
    h.position.set(x, -1, z);
    h.scale.set(sx, sy, sz);
    scene.add(h);
  }
}

/* ================= деревья и кусты ================= */
const barkMat = toon(0x8A5A34);
const leafA = toon(0x3FA45F);
const leafB = toon(0x55BD72);

function makeTree(s = 1) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 1.7, 9), barkMat);
  trunk.position.y = 0.85;
  trunk.castShadow = true;
  ink(trunk, 1.06);
  g.add(trunk);
  for (const [cx, cy, cz, r, m] of [
    [0, 2.5, 0, 1.35, leafA],
    [-0.8, 2.1, 0.25, 0.95, leafB],
    [0.75, 2.2, -0.2, 1.0, leafB],
    [0.1, 3.3, 0.05, 0.85, leafA],
  ]) {
    const b = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), m);
    b.position.set(cx, cy, cz);
    b.castShadow = true;
    ink(b, 1.05);
    g.add(b);
  }
  g.scale.setScalar(s);
  return g;
}

function makeBush() {
  const g = new THREE.Group();
  for (const [x, y, z, r] of [[0, 0.5, 0, 0.75], [-0.6, 0.4, 0.2, 0.55], [0.6, 0.45, -0.1, 0.6]]) {
    const b = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), leafB);
    b.position.set(x, y, z);
    b.castShadow = true;
    ink(b, 1.06);
    g.add(b);
  }
  return g;
}

const props = [];
function addProp(mesh, x, z) {
  mesh.position.set(x, 0, z);
  scene.add(mesh);
  props.push({ mesh, x, z });
}

for (let i = 0; i < 26; i++) {
  const side = i % 2 === 0 ? -1 : 1;
  addProp(makeTree(0.8 + Math.random() * 0.6), side * (6.2 + Math.random() * 8), 12 - i * 6 - Math.random() * 4);
}
for (let i = 0; i < 16; i++) {
  const side = i % 2 === 0 ? -1 : 1;
  addProp(makeBush(), side * (4.9 + Math.random() * 1.4), 8 - i * 8 - Math.random() * 5);
}

/* фонарики */
const lampGlows = [];
function makeLamp() {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 3.2, 8), toon(0x3B4652));
  pole.position.y = 1.6;
  pole.castShadow = true;
  g.add(pole);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 14, 10), new THREE.MeshBasicMaterial({ color: 0xFFF7DF }));
  head.position.y = 3.3;
  g.add(head);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTexture(), transparent: true, opacity: 0.9, depthWrite: false,
  }));
  glow.position.y = 3.3;
  glow.scale.set(2.6, 2.6, 1);
  g.add(glow);
  lampGlows.push(glow);
  return g;
}

function glowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(64, 64, 2, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,246,190,1)');
  g.addColorStop(0.35, 'rgba(255,232,140,.55)');
  g.addColorStop(1, 'rgba(255,225,120,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

for (let i = 0; i < 7; i++) {
  addProp(makeLamp(), -4.6, -6 - i * 22);
}

/* цветы */
const flowerColors = [0xFF8FB0, 0xFFD166, 0xFFFFFF, 0xFF7A5C];
for (let i = 0; i < 60; i++) {
  const g = new THREE.Group();
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.3, 4), toon(0x3E9B4E));
  stem.position.y = 0.15;
  g.add(stem);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), toon(flowerColors[(Math.random() * 4) | 0]));
  head.position.y = 0.34;
  g.add(head);
  const side = Math.random() < 0.5 ? -1 : 1;
  addProp(g, side * (4.4 + Math.random() * 7), 12 - Math.random() * 130);
}

/* ================= котики ================= */
function makeCat(cfg) {
  const g = new THREE.Group();
  const fur = toon(cfg.fur);
  const belly = toon(cfg.belly);
  const pink = toon(0xF08CA8);
  const white = toon(0xFFFFFF);
  const black = toon(0x1B2430);

  const body = new THREE.Mesh(new THREE.SphereGeometry(0.5, 18, 14), fur);
  body.scale.set(1.05, 0.95, 1.4);
  body.position.y = 0.8;
  body.castShadow = true;
  ink(body, 1.035);
  g.add(body);

  const chest = new THREE.Mesh(new THREE.SphereGeometry(0.42, 14, 12), belly);
  chest.scale.set(0.78, 0.8, 0.7);
  chest.position.set(0, 0.74, 0.42);
  g.add(chest);

  // голова
  const head = new THREE.Group();
  head.position.set(0, 1.42, 0.26);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.42, 20, 16), fur);
  skull.scale.set(1.05, 1, 0.95);
  skull.castShadow = true;
  ink(skull, 1.04);
  head.add(skull);

  for (const sx of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.42, 8), fur);
    ear.position.set(sx * 0.26, 0.42, 0.0);
    ear.rotation.z = sx * 0.22;
    ear.castShadow = true;
    ink(ear, 1.06);
    head.add(ear);
    const inner = new THREE.Mesh(new THREE.ConeGeometry(0.095, 0.24, 8), pink);
    inner.position.set(sx * 0.26, 0.39, 0.05);
    inner.rotation.z = sx * 0.22;
    head.add(inner);
  }

  const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.19, 12, 10), belly);
  muzzle.scale.set(1.1, 0.8, 0.85);
  muzzle.position.set(0, -0.1, 0.34);
  head.add(muzzle);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), pink);
  nose.position.set(0, -0.04, 0.47);
  head.add(nose);

  // улыбка
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.014, 6, 16, Math.PI), toon(0x9B5F70));
  smile.position.set(0, -0.2, 0.4);
  smile.rotation.z = Math.PI;
  head.add(smile);

  // усы
  const whiskerMat = new THREE.MeshBasicMaterial({ color: 0xF7EADF });
  for (const sx of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.005, 0.34, 4), whiskerMat);
      w.position.set(sx * 0.27, -0.07 + i * 0.055, 0.33);
      w.rotation.z = Math.PI / 2 - sx * 0.1;
      w.rotation.y = sx * 0.4;
      head.add(w);
    }
  }

  for (const sx of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.115, 14, 10), white);
    eye.position.set(sx * 0.16, 0.04, 0.33);
    head.add(eye);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.058, 10, 8), black);
    pupil.position.set(sx * 0.16, 0.04, 0.42);
    head.add(pupil);
    const glint = new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 6), new THREE.MeshBasicMaterial({ color: 0xFFFFFF }));
    glint.position.set(sx * 0.16 + 0.02, 0.075, 0.47);
    head.add(glint);
  }
  g.add(head);

  // полоски / бантик
  if (cfg.stripes) {
    for (let i = 0; i < 3; i++) {
      const s = new THREE.Mesh(rbox(0.5, 0.05, 0.1, 0.02, 2), toon(cfg.stripe));
      s.position.set(0, 1.02 - i * 0.12, -0.34 + i * 0.03);
      g.add(s);
    }
  }
  if (cfg.bow) {
    for (const sx of [-1, 1]) {
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), toon(0xE8709A));
      b.scale.set(1.2, 0.85, 0.6);
      b.position.set(-0.3 + sx * 0.12, 1.78, 0.18);
      g.add(b);
    }
  }

  // лапы
  const legs = [];
  for (const [lx, lz] of [[-0.3, 0.42], [0.3, 0.42], [-0.3, -0.42], [0.3, -0.42]]) {
    const pivot = new THREE.Group();
    pivot.position.set(lx, 0.56, lz);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.1, 0.5, 8), fur);
    leg.position.y = -0.25;
    leg.castShadow = true;
    ink(leg, 1.07);
    pivot.add(leg);
    const foot = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), belly);
    foot.position.y = -0.5;
    foot.scale.set(1, 0.8, 1.25);
    pivot.add(foot);
    g.add(pivot);
    legs.push(pivot);
  }

  // хвост
  const tail = new THREE.Group();
  tail.position.set(0, 0.92, -0.66);
  const tailParts = [[0, 0, 0, 0.1], [0, 0.2, -0.12, 0.09], [0, 0.42, -0.2, 0.08], [0, 0.6, -0.22, 0.07]];
  for (const [tx, ty, tz, r] of tailParts) {
    const part = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), fur);
    part.position.set(tx, ty, tz);
    part.castShadow = true;
    tail.add(part);
  }
  if (cfg.tip) {
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), toon(cfg.tip));
    tip.position.set(0, 0.62, -0.24);
    tail.add(tip);
  }
  g.add(tail);

  return { g, head, legs, tail, body };
}

const team = new THREE.Group();
scene.add(team);

const catCfg = [
  { fur: 0xF59A3C, belly: 0xFFDDB0, tip: 0xFFE9C8 },
  { fur: 0xF6A9C0, belly: 0xFFE3EC, bow: true, tip: 0xFFF0F5 },
  { fur: 0x93A6BC, belly: 0xDCE6F0, stripes: true, stripe: 0x6F809A, tip: 0xC9D6E4 },
];
const cats = [];
const formation = [[0, 0, -0.15, 0], [-1.05, 0, 0.85, 0.1], [1.0, 0, 0.82, -0.1]];
catCfg.forEach((cfg, i) => {
  const cat = makeCat(cfg);
  cat.g.position.set(formation[i][0], 0, formation[i][2]);
  cat.g.rotation.y = formation[i][3];
  cat.phase = i * 1.7;
  team.add(cat.g);
  cats.push(cat);
});

/* ================= вкусняшки ================= */
const fishes = [];
const fishMat = toon(0xE4703F);
const fishLight = toon(0xFFB37A);
const milkMat = toon(0xF7FBFF);
const milkBlue = toon(0x5EA8E0);
const cakeMat = toon(0xFFD9A8);
const cakeTop = toon(0xFF8FB0);

function makeFish() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 10), fishMat);
  body.scale.set(0.78, 0.95, 1.3);
  body.castShadow = true;
  ink(body, 1.05);
  g.add(body);
  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), fishLight);
  belly.scale.set(0.8, 0.62, 1.15);
  belly.position.set(0, -0.09, 0.04);
  g.add(belly);
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.3, 6), fishMat);
  tail.rotation.x = Math.PI / 2;
  tail.position.set(0, 0, -0.42);
  g.add(tail);
  const fin = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.18, 5), fishLight);
  fin.rotation.x = -Math.PI / 2;
  fin.position.set(0, 0.2, 0.02);
  g.add(fin);
  for (const sx of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshBasicMaterial({ color: 0x1B2430 }));
    eye.position.set(sx * 0.11, 0.07, 0.27);
    g.add(eye);
  }
  return g;
}

function makeMilk() {
  const g = new THREE.Group();
  const box = new THREE.Mesh(rbox(0.36, 0.5, 0.36, 0.05, 2), milkMat);
  box.castShadow = true;
  ink(box, 1.05);
  g.add(box);
  const stripe = new THREE.Mesh(rbox(0.38, 0.14, 0.38, 0.04, 2), milkBlue);
  stripe.position.y = 0.04;
  g.add(stripe);
  return g;
}

function makeCake() {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.26, 0.24, 14), cakeMat);
  base.castShadow = true;
  ink(base, 1.05);
  g.add(base);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.1, 14), cakeTop);
  top.position.y = 0.16;
  g.add(top);
  const cherry = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), toon(0xE0453A));
  cherry.position.y = 0.26;
  g.add(cherry);
  return g;
}

const ITEM_FACTORY = [makeFish, makeFish, makeFish, makeMilk, makeCake];

function spawnItem() {
  const kind = ITEM_FACTORY[(Math.random() * ITEM_FACTORY.length) | 0];
  const g = kind();
  const x = (Math.random() * 2 - 1) * 2.5;
  g.position.set(x, 0.62, -70);
  g.userData = { x, t: Math.random() * 6 };
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTexture(), transparent: true, opacity: 0.55, depthWrite: false,
  }));
  glow.scale.set(1.5, 1.5, 1);
  glow.position.y = 0.05;
  g.add(glow);
  scene.add(g);
  fishes.push(g);
}

/* ================= состояние ================= */
const G = { mode: 'start', level: 1, got: 0, need: 6, speed: 9, catX: 0, targetX: 0, t: 0, spawnT: 1.2, hop: 0 };

const $ = (id) => document.getElementById(id);
const countEl = $('count'), needEl = $('need'), lvlEl = $('lvl');
const ov = $('ov'), soundBtn = $('sound'), homeBtn = $('home');

const audio = {
  ctx: null, master: null, on: true,
  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      this.ctx = new AC();
      const m = this.ctx.createGain(); m.gain.value = 0.85; m.connect(this.ctx.destination);
      this.master = m;
    } catch (e) { this.ctx = null; }
  },
  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); },
  mute(v) { if (this.master) this.master.gain.setTargetAtTime(v ? 0 : 0.85, this.ctx.currentTime, 0.05); },
  tone(f, dur, type, gain, delay) {
    if (!this.ctx || !this.on) return;
    const t = this.ctx.currentTime + (delay || 0);
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain || 0.12, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.master);
    o.start(t); o.stop(t + dur + 0.05);
  },
  pick(n) {
    const base = [659, 740, 831, 880, 988][n % 5];
    this.tone(base, 0.14, 'triangle', 0.14);
    this.tone(base * 1.5, 0.2, 'sine', 0.07, 0.05);
  },
  win() { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.3, 'triangle', 0.11, i * 0.1)); },
};

/* ================= оверлеи ================= */
function overlayStart() {
  ov.innerHTML = `
    <div class="panel">
      <div class="stars3"><i>★</i><i>★</i><i>★</i></div>
      <button class="big" id="go" aria-label="Играть">
        <svg viewBox="0 0 100 100"><path d="M37 24 L79 50 L37 76 Z"/></svg>
      </button>
    </div>`;
  ov.classList.add('on');
}
function overlayNext() {
  ov.innerHTML = `
    <div class="panel">
      <div class="stars3"><i>★</i><i>★</i><i>★</i></div>
      <div class="levelnum">${G.level + 1}</div>
      <button class="big" id="go" aria-label="Дальше">
        <svg viewBox="0 0 100 100"><path d="M37 24 L79 50 L37 76 Z"/></svg>
      </button>
    </div>`;
  ov.classList.add('on');
}
function hideOverlay() { ov.classList.remove('on'); ov.innerHTML = ''; }

ov.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  audio.init(); audio.resume();
  if (G.mode === 'start') startGame();
  else if (G.mode === 'done') nextLevel();
});

function startGame() {
  G.mode = 'play';
  G.level = 1; G.got = 0; G.need = 6; G.speed = 9;
  setLevelVisual();
  hideOverlay();
}
function nextLevel() {
  G.level++;
  G.got = 0;
  G.need = 4 + G.level * 2;
  G.speed += 1.4;
  G.mode = 'play';
  setLevelVisual();
  hideOverlay();
  audio.win();
}
function setLevelVisual() {
  const pal = PALETTES[(G.level - 1) % PALETTES.length];
  buildSky(pal);
  hemi.color.setHex(pal.hemiSky);
  hemi.intensity = pal.hemiI;
  sun.color.setHex(pal.sunC);
  sun.intensity = pal.sunI;
  scene.fog.color.set(pal.sky[2]);
  for (const gl of lampGlows) gl.visible = pal.night;
  lvlEl.textContent = G.level;
  needEl.textContent = G.need;
  countEl.textContent = '0';
}

function levelDone() {
  G.mode = 'done';
  audio.win();
  overlayNext();
}

/* ================= ввод ================= */
let pointerActive = false;
function onDown(e) {
  if (G.mode !== 'play') return;
  pointerActive = true;
  G.targetX = clampX(e.clientX);
  audio.resume();
}
function onMove(e) {
  if (!pointerActive || G.mode !== 'play') return;
  G.targetX = clampX(e.clientX);
}
function onUp() { pointerActive = false; }
function clampX(clientX) {
  const w = window.innerWidth;
  return Math.max(-3.1, Math.min(3.1, ((clientX / w) - 0.5) * 7.6));
}
canvas.addEventListener('pointerdown', onDown);
window.addEventListener('pointermove', onMove);
window.addEventListener('pointerup', onUp);
window.addEventListener('pointercancel', onUp);
document.addEventListener('gesturestart', (e) => e.preventDefault());

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

/* ================= размер ================= */
function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  camera.aspect = w / h;
  camera.fov = h > w ? 54 : 45;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

/* ================= камера ================= */
const camPos = new THREE.Vector3();
const camLook = new THREE.Vector3();
const tmpPos = new THREE.Vector3();
const tmpLook = new THREE.Vector3();

function updateCamera(dt, t) {
  const photo = G.mode !== 'play';
  const portrait = window.innerHeight > window.innerWidth;
  if (photo) {
    tmpPos.set(G.catX * (portrait ? 0.85 : 0.55) + 1.5, portrait ? 2.2 : 1.9, portrait ? 5.2 : 4.4);
    tmpLook.set(G.catX * (portrait ? 0.85 : 0.55), 1.2, 0.2);
  } else {
    tmpPos.set(G.catX * (portrait ? 0.88 : 0.5), portrait ? 3.4 : 3.1, portrait ? 7.6 : 6.2);
    tmpLook.set(G.catX * (portrait ? 0.8 : 0.32), 1.2, -4.5);
  }
  const k = 1 - Math.exp(-dt * (photo ? 2.6 : 3.4));
  camPos.lerp(tmpPos, k);
  camLook.lerp(tmpLook, k);
  camera.position.copy(camPos);
  camera.lookAt(camLook);

  if (photo) {
    // лёгкое дыхание камеры
    camera.position.y += Math.sin(t * 0.8) * 0.03;
  }
}
camPos.set(1.5, 1.9, 4.4);
camLook.set(0, 1.2, 0.2);

/* ================= цикл ================= */
const clock = new THREE.Clock();

function step(dt) {
  const t = clock.elapsedTime;
  const playing = G.mode === 'play';

  if (playing) {
    G.speed = Math.min(16, G.speed + dt * 0.12);
    G.catX += (G.targetX - G.catX) * (1 - Math.exp(-dt * 9));
  }
  team.position.x = G.catX;
  G.hop = Math.max(0, G.hop - dt * 2.4);

  // котики бегут
  for (const cat of cats) {
    const sp = playing ? 1 : 0.35;
    const ph = t * 11 * sp + cat.phase;
    cat.legs[0].rotation.x = Math.sin(ph) * 0.75;
    cat.legs[1].rotation.x = Math.sin(ph + Math.PI) * 0.75;
    cat.legs[2].rotation.x = Math.sin(ph + Math.PI) * 0.75;
    cat.legs[3].rotation.x = Math.sin(ph) * 0.75;
    cat.body.position.y = 0.78 + Math.abs(Math.sin(ph)) * 0.05;
    cat.head.position.y = 1.42 + Math.abs(Math.sin(ph + 0.6)) * 0.045;
    cat.tail.rotation.z = Math.sin(t * 3 + cat.phase) * 0.18;
    cat.tail.rotation.x = 0.1 + Math.sin(t * 2.4 + cat.phase) * 0.12;
    cat.g.position.y = G.hop * 0.25;
    cat.g.rotation.z = Math.sin(ph * 0.5) * 0.02;
  }

  if (playing) {
    G.t += dt;
    const move = G.speed * dt;

    pathTex.offset.y -= move * 0.055;
    grassTex.offset.y -= move * 0.012;

    for (const p of props) {
      p.mesh.position.z += move;
      if (p.mesh.position.z > 16) {
        p.mesh.position.z -= 150;
        if (p.mesh.position.x > 0) p.mesh.position.x = 4.9 + Math.random() * 9;
        else p.mesh.position.x = -(4.9 + Math.random() * 9);
      }
    }

    G.spawnT -= dt;
    if (G.spawnT <= 0) {
      spawnItem();
      G.spawnT = Math.max(0.55, 0.95 - G.level * 0.05) * (0.85 + Math.random() * 0.3);
    }

    for (let i = fishes.length - 1; i >= 0; i--) {
      const f = fishes[i];
      f.position.z += move;
      f.position.y = 0.62 + Math.sin(t * 3 + f.userData.t) * 0.1;
      f.rotation.y = Math.PI / 2 + Math.sin(t * 1.2 + f.userData.t) * 0.3;
      f.rotation.z = Math.sin(t * 2.4 + f.userData.t) * 0.08;

      if (f.position.z > -1.3 && f.position.z < 2.2 && Math.abs(f.position.x - G.catX) < 1.25) {
        scene.remove(f);
        fishes.splice(i, 1);
        G.got++;
        G.hop = 1;
        countEl.textContent = G.got;
        audio.pick(G.got);
        if (G.got >= G.need) { levelDone(); break; }
        continue;
      }
      if (f.position.z > 8) {
        scene.remove(f);
        fishes.splice(i, 1);
      }
    }
  }

  updateCamera(dt, t);
}

function loop() {
  requestAnimationFrame(loop);
  const dt = Math.min(clock.getDelta(), 0.05);
  step(dt);
  renderer.render(scene, camera);
}

window.__dbg = {
  get mode() { return G.mode; },
  get level() { return G.level; },
  get got() { return G.got; },
  get need() { return G.need; },
  get items() { return fishes.length; },
  get catX() { return G.catX; },
};
window.__spawnTest = (x, z = -4) => {
  const g = makeFish();
  g.position.set(x, 0.55, z);
  g.userData = { x, t: 0 };
  scene.add(g);
  fishes.push(g);
};

setLevelVisual();
overlayStart();
loop();
