// S Bank — app de finanças pessoais (100% no navegador)
const STORAGE_KEY = 'sbank:data:v1';
const SETTINGS_KEY = 'sbank:settings:v1';
const AI_MODEL = 'claude-opus-5-5';
const VIEWS = ['resumo', 'extrato', 'graficos', 'ia'];

// Paleta categórica validada (ordem fixa; a cor segue a categoria, nunca o ranking)
const PALETTE = {
  light: ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6', '#e34948'],
  dark: ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300', '#9085e9', '#e66767'],
};
const OTHER_COLOR = { light: '#8E8E93', dark: '#8E8E93' };
const SERIES = { income: 2, expense: 1 }; // aqua = entradas, laranja = saídas

const DEFAULT_CATEGORIES = [
  { id: 'alimentacao', name: 'Alimentação', icon: 'alimentacao', type: 'expense', slot: 0 },
  { id: 'moradia', name: 'Moradia', icon: 'moradia', type: 'expense', slot: 1 },
  { id: 'transporte', name: 'Transporte', icon: 'transporte', type: 'expense', slot: 2 },
  { id: 'assinaturas', name: 'Assinaturas', icon: 'assinaturas', type: 'expense', slot: 3 },
  { id: 'roupas', name: 'Roupas', icon: 'roupas', type: 'expense', slot: 4 },
  { id: 'saude', name: 'Saúde', icon: 'saude', type: 'expense', slot: 5 },
  { id: 'lazer', name: 'Lazer', icon: 'lazer', type: 'expense', slot: 6 },
  { id: 'educacao', name: 'Educação', icon: 'educacao', type: 'expense', slot: 7 },
  { id: 'outros-gasto', name: 'Outros', icon: 'outros-gasto', type: 'expense', slot: null },
  { id: 'salario', name: 'Salário', icon: 'salario', type: 'income', slot: 0 },
  { id: 'freelance', name: 'Freelance', icon: 'freelance', type: 'income', slot: 1 },
  { id: 'rendimentos', name: 'Rendimentos', icon: 'rendimentos', type: 'income', slot: 2 },
  { id: 'presentes', name: 'Presentes', icon: 'presentes', type: 'income', slot: 3 },
  { id: 'outros-ganho', name: 'Outros', icon: 'outros-ganho', type: 'income', slot: null },
];

const CAT_ICONS = {
  'alimentacao': '<path d="M7 3v8m-2.5-8v5a2.5 2.5 0 0 0 5 0V3M7 11v10M16.5 21V3c-2 0-3.5 2.5-3.5 6.5 0 2.5 1.2 3.5 3.5 3.5"/>',
  'moradia': '<path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zM9.5 21v-6h5v6"/>',
  'transporte': '<path d="M5 16.5V12l1.8-4.6A1.5 1.5 0 0 1 8.2 6.5h7.6a1.5 1.5 0 0 1 1.4.9L19 12v4.5zM5 12h14M5 16.5V19h2.5v-2.5m9 0V19H19v-2.5"/><circle cx="8" cy="14.2" r=".6" fill="currentColor"/><circle cx="16" cy="14.2" r=".6" fill="currentColor"/>',
  'assinaturas': '<path d="M19.5 9A8 8 0 0 0 5 7.5M4.5 4v3.5H8M4.5 15A8 8 0 0 0 19 16.5M19.5 20v-3.5H16"/>',
  'roupas': '<path d="M9 4 4.5 6.5 6 10.5l2.5-1V20h7V9.5l2.5 1 1.5-4L15 4c-.4 1.4-1.6 2.3-3 2.3S9.4 5.4 9 4z"/>',
  'saude': '<path d="M12 20.5s-7.5-4.5-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.7-7.5 10.2-7.5 10.2z"/><path d="M8 12.5h2.2l1.2-2 1.6 4 1.1-2H16"/>',
  'lazer': '<path d="M3.5 8.5V6h17v2.5a2.5 2.5 0 0 0 0 5V18h-17v-4.5a2.5 2.5 0 0 0 0-5zM14 6v2m0 3v2m0 3v2"/>',
  'educacao': '<path d="M4 5.5C6.5 4.5 9.5 4.5 12 6c2.5-1.5 5.5-1.5 8-.5V19c-2.5-1-5.5-1-8 .5-2.5-1.5-5.5-1.5-8-.5zM12 6v13.5"/>',
  'outros-gasto': '<path d="M4 7.5 12 4l8 3.5v9L12 20l-8-3.5zM4 7.5l8 3.5 8-3.5M12 11v9"/>',
  'salario': '<path d="M3.5 8h17v11.5h-17zM9 8V5.5h6V8M3.5 13h17M11 13v2h2v-2"/>',
  'freelance': '<path d="M5 5.5h14v10H5zM3 18.5h18"/>',
  'rendimentos': '<path d="M4 17.5 9.5 12l3.5 3.5L20 8.5M15 8.5h5v5"/>',
  'presentes': '<path d="M4.5 11h15v9h-15zM3.5 7.5h17V11h-17zM12 7.5V20M12 7.5C10.5 4.5 7.5 4.3 7.5 6s2.3 1.5 4.5 1.5zm0 0c1.5-3 4.5-3.2 4.5-1.5S14.2 7.5 12 7.5z"/>',
  'outros-ganho': '<circle cx="12" cy="12" r="8.5"/><path d="M12 8v8M8 12h8"/>',
  'tag': '<path d="M3.5 12.2V4.5a1 1 0 0 1 1-1h7.7l8.3 8.3a1 1 0 0 1 0 1.4l-7.3 7.3a1 1 0 0 1-1.4 0z"/><circle cx="8" cy="8" r="1.3"/>',
  'mercado': '<path d="M3 4h2.2l2.3 11h11L21 7.5H6.3"/><circle cx="9" cy="19.5" r="1.2"/><circle cx="17" cy="19.5" r="1.2"/>',
  'cafe': '<path d="M5 9h11v4.5A4.5 4.5 0 0 1 11.5 18h-2A4.5 4.5 0 0 1 5 13.5zM16 10.5h1.5a2.3 2.3 0 0 1 0 4.6H16M8.5 3.5v2.5M12 3.5v2.5M4 21h13"/>',
  'viagem': '<path d="M21 3 3.5 10.2l6.8 2.9 2.9 6.8zM10.3 13.1 21 3"/>',
  'celular': '<path d="M7.5 3h9a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM10.5 18h3"/>',
  'pet': '<path d="M12 12.5c-2.8 0-5 3.2-5 5.2 0 1.5 1.3 1.8 2.6 1.8 1 0 1.6-.4 2.4-.4s1.4.4 2.4.4c1.3 0 2.6-.3 2.6-1.8 0-2-2.2-5.2-5-5.2z"/><ellipse cx="6" cy="9.5" rx="1.5" ry="2"/><ellipse cx="18" cy="9.5" rx="1.5" ry="2"/><ellipse cx="9.5" cy="5.5" rx="1.5" ry="2"/><ellipse cx="14.5" cy="5.5" rx="1.5" ry="2"/>',
  'academia': '<path d="M6.5 7.5v9M3.5 10v4M17.5 7.5v9M20.5 10v4M6.5 12h11"/>',
  'contas': '<path d="M13 3 5.5 13.5H11l-1 7.5 7.5-10.5H12z"/>',
  'moeda': '<circle cx="12" cy="12" r="8.5"/><path d="M14.6 9.3c-.5-.9-1.5-1.4-2.6-1.4-1.5 0-2.6.8-2.6 2s1.1 1.6 2.6 2 2.6.8 2.6 2-1.1 2.1-2.6 2.1c-1.2 0-2.2-.6-2.7-1.6M12 6.5v1.4m0 8.2v1.4"/>',
  'cartao': '<path d="M3 6.5h18v11H3zM3 10h18M6.5 14.5h3.5"/>',
  'musica': '<path d="M9 17.5V6l11-2v11.5"/><circle cx="6.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="15.5" r="2.5"/>',
  'crianca': '<circle cx="12" cy="12" r="8.5"/><path d="M9 14.5c.8.9 1.8 1.4 3 1.4s2.2-.5 3-1.4"/><circle cx="9.3" cy="10.3" r=".7" fill="currentColor"/><circle cx="14.7" cy="10.3" r=".7" fill="currentColor"/>',
  'ferramenta': '<path d="M14.7 6.3a4 4 0 0 0 4.9 5L11.4 19.6a2.1 2.1 0 0 1-3-3l8.3-8.3a4 4 0 0 0-2-2z"/>',
};
// Ícones que aparecem para escolher ao criar uma categoria
const PICKABLE_ICONS = ['tag', 'mercado', 'cafe', 'viagem', 'celular', 'pet', 'academia', 'contas', 'moeda', 'cartao', 'musica', 'crianca', 'ferramenta', 'presentes', 'educacao', 'saude', 'lazer', 'moradia', 'transporte', 'roupas'];
const iconSVG = (name) => `<svg viewBox="0 0 24 24" aria-hidden="true">${CAT_ICONS[name] || CAT_ICONS.tag}</svg>`;
const catIcon = (cat) => iconSVG(cat.icon);

// ---------- Utilidades ----------
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const brl = (v, cents = true) => v.toLocaleString('pt-BR', {
  style: 'currency', currency: 'BRL',
  minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0,
});
const pad = (n) => String(n).padStart(2, '0');
const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const monthKey = (iso) => iso.slice(0, 7);
const shiftMonth = (key, delta) => {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
};
const monthName = (key, opts = { month: 'long', year: 'numeric' }) => {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('pt-BR', opts).replace(' de ', ' ');
};
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const isDark = () => {
  const t = document.documentElement.dataset.theme;
  return t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
};
const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const desktopMQ = matchMedia('(min-width: 1000px)');

// ---------- Física: molas, projeção de momento e elástico ----------
// Mola com os parâmetros da Apple: amortecimento (1 = sem ressalto) e resposta (s).
// Sempre parte do valor e da velocidade atuais, então pode ser interrompida a qualquer momento.
class Spring {
  constructor({ value = 0, damping = 1, response = 0.4, onUpdate, onRest } = {}) {
    Object.assign(this, { value, target: value, velocity: 0, damping, response, onUpdate, onRest });
    this.raf = 0;
  }
  to(target, { velocity, damping, response } = {}) {
    this.target = target;
    if (velocity != null) this.velocity = velocity;
    if (damping != null) this.damping = damping;
    if (response != null) this.response = response;
    if (reducedMotion.matches) { this.set(target); this.onRest?.(target); return; }
    if (!this.raf) { this.last = performance.now(); this.raf = requestAnimationFrame((t) => this.tick(t)); }
  }
  set(value) { this.stop(); this.value = this.target = value; this.velocity = 0; this.onUpdate?.(value); }
  stop() { cancelAnimationFrame(this.raf); this.raf = 0; }
  tick(now) {
    let dt = Math.min((now - this.last) / 1000, 0.064);
    this.last = now;
    const k = (2 * Math.PI / this.response) ** 2;
    const c = (4 * Math.PI * this.damping) / this.response;
    while (dt > 0) { // passos pequenos e estáveis
      const h = Math.min(dt, 1 / 240);
      const a = -k * (this.value - this.target) - c * this.velocity;
      this.velocity += a * h;
      this.value += this.velocity * h;
      dt -= h;
    }
    if (Math.abs(this.velocity) < 2 && Math.abs(this.value - this.target) < 0.3) {
      this.value = this.target; this.velocity = 0; this.raf = 0;
      this.onUpdate?.(this.value); this.onRest?.(this.value);
      return;
    }
    this.onUpdate?.(this.value);
    this.raf = requestAnimationFrame((t) => this.tick(t));
  }
}
// Para onde o gesto vai parar (mesma desaceleração da rolagem do iOS)
const project = (velocity, rate = 0.998) => ((velocity / 1000) * rate) / (1 - rate);
// Resistência progressiva além do limite
const rubberband = (overshoot, dimension, c = 0.55) => (overshoot * dimension * c) / (dimension + c * Math.abs(overshoot));
// Velocidade (px/s) a partir dos últimos ~100ms de movimento
function tracker() {
  let pts = [];
  return {
    add(v) { const t = performance.now(); pts.push([v, t]); pts = pts.filter(([, pt]) => t - pt < 100); },
    velocity() {
      if (pts.length < 2) return 0;
      const [v0, t0] = pts[0]; const [v1, t1] = pts[pts.length - 1];
      return t1 > t0 ? ((v1 - v0) / (t1 - t0)) * 1000 : 0;
    },
    reset() { pts = []; },
  };
}
// Toque tátil (iOS 18+ via switch nativo; Android via vibração), só em momentos importantes
function haptic() {
  try {
    if (navigator.vibrate) navigator.vibrate(8);
    else $('#hapticSwitch')?.closest('label')?.click();
  } catch {}
}

// ---------- Estado ----------
function freshData() {
  return { app: 'S Bank', version: 1, updatedAt: new Date().toISOString(), categories: structuredClone(DEFAULT_CATEGORIES), transactions: [], analyses: [], deleted: {}, daily: [] };
}
function loadJSON(key, fallback) {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
}
function saveJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
}
// Uma movimentação apagada continua apagada nos outros aparelhos, a menos que tenha sido editada (ou desfeita) depois
const txStamp = (t) => t.updatedAt || t.createdAt || '';
const isDeleted = (t, deleted) => !!deleted[t.id] && deleted[t.id] >= txStamp(t);
function normalize(d) {
  const base = freshData();
  const out = {
    ...base, ...d,
    categories: Array.isArray(d.categories) && d.categories.length ? d.categories : base.categories,
    transactions: Array.isArray(d.transactions) ? d.transactions : [],
    analyses: Array.isArray(d.analyses) ? d.analyses : [],
    deleted: d.deleted && typeof d.deleted === 'object' && !Array.isArray(d.deleted) ? d.deleted : {},
    daily: Array.isArray(d.daily) ? d.daily : [],
  };
  out.categories = out.categories.map((c) => (c.icon ? c : { ...c, icon: DEFAULT_CATEGORIES.some((d) => d.id === c.id) ? c.id : 'tag' }));
  out.transactions = out.transactions
    .filter((t) => t && t.id && (t.type === 'income' || t.type === 'expense') && Number.isFinite(+t.amount) && /^\d{4}-\d{2}-\d{2}$/.test(t.date))
    .map((t) => ({ ...t, amount: Math.round(+t.amount * 100) / 100 }))
    .filter((t) => !isDeleted(t, out.deleted));
  return out;
}
let data = normalize(loadJSON(STORAGE_KEY, null) || freshData());
const settings = loadJSON(SETTINGS_KEY, {});
function persist() {
  data.updatedAt = new Date().toISOString();
  if (!saveJSON(STORAGE_KEY, data)) toast('Não foi possível salvar neste aparelho. Exporte seus dados.');
  scheduleSync();
}
const saveSettings = () => saveJSON(SETTINGS_KEY, settings);

const state = {
  view: 'resumo',
  month: monthKey(todayISO()),
  entryType: 'expense',
  entryCategory: null,
  editingId: null,
  typeFilter: 'all',
  catFilter: '',
  donutType: 'expense',
  newCatType: 'expense',
  newCatIcon: 'tag',
  aiMode: 'daily',
};

const catById = (id) => data.categories.find((c) => c.id === id) || { id, name: 'Sem categoria', icon: 'tag', type: 'expense', slot: null };
const catsOf = (type) => data.categories.filter((c) => c.type === type);
const catColor = (cat) => {
  const mode = isDark() ? 'dark' : 'light';
  return cat.slot == null || cat.slot > 7 ? OTHER_COLOR[mode] : PALETTE[mode][cat.slot];
};
const catTint = (cat, alpha = '24') => catColor(cat) + alpha;
const txOfMonth = (key) => data.transactions.filter((t) => monthKey(t.date) === key);
const sum = (list, type) => list.reduce((s, t) => s + (t.type === type ? t.amount : 0), 0);
const sortTx = (list) => [...list].sort((a, b) => b.date.localeCompare(a.date) || (b.createdAt || '').localeCompare(a.createdAt || ''));
function groupByCategory(list, type) {
  const map = new Map();
  list.filter((t) => t.type === type).forEach((t) => map.set(t.category, (map.get(t.category) || 0) + t.amount));
  return [...map.entries()].map(([id, total]) => ({ cat: catById(id), total })).sort((a, b) => b.total - a.total);
}

// ---------- Tema claro / escuro ----------
const THEME_KEY = 'sbank:theme';
const darkMQ = matchMedia('(prefers-color-scheme: dark)');
const getTheme = () => { try { return localStorage.getItem(THEME_KEY) || 'auto'; } catch { return 'auto'; } };
function setThemeAttr(theme) {
  const root = document.documentElement;
  if (theme === 'auto') delete root.dataset.theme; else root.dataset.theme = theme;
  const dark = isDark();
  $$('meta[name="theme-color"]').forEach((m) => {
    m.content = theme === 'auto' ? (m.media.includes('dark') ? '#0B0B0C' : '#F3F4F1') : dark ? '#0B0B0C' : '#F3F4F1';
  });
  $$('.theme-icon').forEach((u) => u.setAttribute('href', dark ? '#i-sun' : '#i-moon'));
  $$('.theme-label').forEach((l) => (l.textContent = dark ? 'Modo claro' : 'Modo escuro'));
}
function applyTheme(theme, animate = true) {
  try { if (theme === 'auto') localStorage.removeItem(THEME_KEY); else localStorage.setItem(THEME_KEY, theme); } catch {}
  segments.get('themeSeg')?.set(theme);
  const swap = () => { setThemeAttr(theme); render(); };
  if (!animate || reducedMotion.matches) { swap(); return; }
  // Transição suave entre os modos, sem salto brusco de brilho
  if (document.startViewTransition) { document.startViewTransition(swap); return; }
  document.documentElement.classList.add('theme-fade');
  swap();
  setTimeout(() => document.documentElement.classList.remove('theme-fade'), 420);
}
const toggleTheme = () => applyTheme(isDark() ? 'light' : 'dark');

// ---------- Aviso flutuante (com desfazer) ----------
const toastEl = $('#toast');
const toastSpring = new Spring({ value: -140, onUpdate: (y) => (toastEl.style.transform = `translate(-50%, ${y}px)`) });
function toast(msg, action) {
  $('#toastText').textContent = msg;
  const btn = $('#toastAction');
  btn.hidden = !action;
  btn.onclick = action ? () => { action.run(); hideToast(); } : null;
  if (action) btn.textContent = action.label;
  toastSpring.to(0, { damping: 0.86, response: 0.42 });
  clearTimeout(toast.t);
  toast.t = setTimeout(hideToast, action ? 4500 : 2400);
}
function hideToast() { toastSpring.to(-140, { damping: 1, response: 0.35 }); }

// ---------- Controle segmentado (polegar desliza com mola) ----------
const segments = new Map();
function segmented(el, onChange) {
  const thumb = $('.segmented__thumb', el);
  const spring = new Spring({ onUpdate: (x) => (thumb.style.translate = `${x}px 0`) });
  const api = {
    value: null,
    set(value, animate = true) {
      api.value = value;
      const btn = $$('.segmented__btn', el).find((b) => b.dataset.value === value);
      $$('.segmented__btn', el).forEach((b) => { b.classList.toggle('is-active', b === btn); b.setAttribute('aria-selected', b === btn); });
      if (!btn || !el.offsetParent) return; // invisível: posiciona quando aparecer
      thumb.style.width = `${btn.offsetWidth}px`;
      if (animate && thumb.dataset.ready) spring.to(btn.offsetLeft, { damping: 1, response: 0.32 });
      else spring.set(btn.offsetLeft);
      thumb.dataset.ready = '1';
    },
    sync() { api.set(api.value, false); },
  };
  el.addEventListener('click', (e) => {
    const b = e.target.closest('.segmented__btn');
    if (!b || b.dataset.value === api.value) return;
    api.set(b.dataset.value);
    onChange(b.dataset.value);
  });
  segments.set(el.id, api);
  return api;
}
const syncSegments = () => segments.forEach((s) => s.sync());

// ---------- Barra de abas: toque, arraste 1:1 e solta com momento ----------
const tabPill = $('#tabPill');
const tabIndicator = $('#tabIndicator');
const tabs = $$('.tab', tabPill);
const tabSpring = new Spring({ onUpdate: (x) => (tabIndicator.style.translate = `${x}px 0`) });
const tabX = (i) => tabs[i].offsetLeft;
function placeIndicator(animate, opts = {}) {
  const i = VIEWS.indexOf(state.view);
  tabIndicator.style.width = `${tabs[0].offsetWidth}px`;
  if (animate) tabSpring.to(tabX(i), { damping: 0.82, response: 0.36, ...opts }); else tabSpring.set(tabX(i));
}
(function bindTabs() {
  const vel = tracker();
  let start = null;
  const nearest = (x) => {
    const w = tabs[0].offsetWidth;
    let best = 0;
    tabs.forEach((t, i) => { if (Math.abs(t.offsetLeft - (x - w / 2)) < Math.abs(tabs[best].offsetLeft - (x - w / 2))) best = i; });
    return best;
  };
  tabPill.addEventListener('pointerdown', (e) => {
    tabPill.setPointerCapture(e.pointerId);
    tabSpring.stop();
    const rect = tabPill.getBoundingClientRect();
    start = { x: e.clientX, from: tabSpring.value, rect, dragging: false };
    vel.reset(); vel.add(e.clientX);
    tabIndicator.classList.add('is-held');
    // resposta imediata: o destaque vai para a aba sob o dedo
    const i = nearest(e.clientX - rect.left);
    tabSpring.to(tabX(i), { damping: 1, response: 0.26 });
    start.from = tabX(i);
  });
  tabPill.addEventListener('pointermove', (e) => {
    if (!start) return;
    const dx = e.clientX - start.x;
    vel.add(e.clientX);
    if (!start.dragging && Math.abs(dx) < 8) return;
    start.dragging = true;
    const min = tabX(0), max = tabX(tabs.length - 1);
    let x = start.from + dx;
    if (x < min) x = min - rubberband(min - x, tabs[0].offsetWidth);
    if (x > max) x = max + rubberband(x - max, tabs[0].offsetWidth);
    tabSpring.set(x);
  });
  const end = (e) => {
    if (!start) return;
    tabIndicator.classList.remove('is-held');
    const v = vel.velocity();
    const w = tabs[0].offsetWidth;
    const i = start.dragging
      ? nearest(tabSpring.value + w / 2 + project(v, 0.99))
      : nearest(e.clientX - start.rect.left);
    start = null;
    if (e.type === 'pointercancel') { placeIndicator(true); return; }
    setView(VIEWS[i], { indicatorVelocity: v });
  };
  tabPill.addEventListener('pointerup', end);
  tabPill.addEventListener('pointercancel', end);
  // teclado
  tabs.forEach((t) => t.addEventListener('click', (e) => { if (e.detail === 0) setView(t.dataset.tab); }));
})();

// ---------- Painéis que sobem de baixo (arrastáveis) ----------
const appEl = $('#app');
const tabbarEl = $('#tabbar');
let openSheets = 0;
function createSheet(el, { onClose } = {}) {
  const panel = $('.sheet__panel', el);
  const scrim = $('.sheet__scrim', el);
  const body = $('.sheet__body', el);
  let H = 600;
  let isOpen = false;

  function apply(y) {
    const p = clamp(1 - y / H, 0, 1);
    if (desktopMQ.matches) {
      panel.style.transform = `translateY(${y * 0.1}px) scale(${0.95 + 0.05 * p})`;
      panel.style.opacity = p;
      scrim.style.opacity = p * 0.32;
      return;
    }
    panel.style.opacity = '';
    panel.style.transform = `translateY(${Math.max(y, -60)}px)`;
    scrim.style.opacity = p * 0.38;
    // o fundo recua, como no iOS
    appEl.style.transform = p > 0.001 ? `translateY(${p * 10}px) scale(${1 - 0.07 * p})` : '';
    appEl.style.borderRadius = p > 0.001 ? `${p * 16}px` : '';
    appEl.style.overflow = p > 0.001 ? 'hidden' : '';
    tabbarEl.style.opacity = 1 - p;
    tabbarEl.style.transform = `translateY(${p * 24}px)`;
  }
  const spring = new Spring({
    onUpdate: apply,
    onRest: (y) => { if (!isOpen && y >= H - 1) finishClose(); },
  });

  function open() {
    if (isOpen) return;
    isOpen = true; openSheets++;
    el.hidden = false;
    document.documentElement.classList.toggle('sheet-open', !desktopMQ.matches);
    appEl.style.transformOrigin = `50% ${scrollY}px`;
    H = desktopMQ.matches ? 360 : panel.offsetHeight;
    if (spring.value === 0 && !spring.raf) spring.set(H);
    spring.to(0, { damping: 1, response: 0.4 });
    syncSegments();
    setTimeout(() => $('[data-dismiss].sheet__action, .sheet__action', el)?.focus({ preventScroll: true }), 50);
  }
  function close(velocity = 0) {
    if (!isOpen) return;
    isOpen = false;
    spring.to(H, { velocity, damping: 1, response: 0.34 });
  }
  function finishClose() {
    el.hidden = true;
    if (--openSheets <= 0) {
      openSheets = 0;
      document.documentElement.classList.remove('sheet-open');
      Object.assign(appEl.style, { transform: '', borderRadius: '', overflow: '' });
      Object.assign(tabbarEl.style, { transform: '', opacity: '' });
    }
    onClose?.();
  }

  // Arrastar: segue o dedo 1:1, elástico para cima, e decide pela velocidade projetada
  const vel = tracker();
  let drag = null;
  const begin = (y) => { spring.stop(); drag = { y0: y, from: spring.value }; vel.reset(); vel.add(y); };
  const move = (y) => {
    vel.add(y);
    let off = drag.from + (y - drag.y0);
    if (off < 0) off = -rubberband(-off, H);
    spring.set(off);
  };
  const finish = () => {
    const v = vel.velocity();
    drag = null;
    const landing = spring.value + project(v);
    if (landing > H * 0.45 && v > -200) close(v);
    else spring.to(0, { velocity: v, damping: Math.abs(v) > 300 ? 0.8 : 1, response: 0.3 });
  };
  const header = $('[data-grab]', el);
  header.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button') || desktopMQ.matches) return;
    header.setPointerCapture(e.pointerId);
    begin(e.clientY);
  });
  header.addEventListener('pointermove', (e) => { if (drag) move(e.clientY); });
  header.addEventListener('pointerup', () => drag && finish());
  header.addEventListener('pointercancel', () => drag && finish());

  // Puxar para baixo pelo conteúdo quando ele já está no topo
  let touch = null;
  body.addEventListener('touchstart', (e) => {
    touch = { y: e.touches[0].clientY, x: e.touches[0].clientX, atTop: body.scrollTop <= 0, mode: null };
  }, { passive: true });
  body.addEventListener('touchmove', (e) => {
    if (!touch || desktopMQ.matches) return;
    const y = e.touches[0].clientY;
    const dy = y - touch.y;
    const dx = e.touches[0].clientX - touch.x;
    if (!touch.mode) {
      if (Math.abs(dy) < 8 && Math.abs(dx) < 8) return;
      touch.mode = touch.atTop && dy > 0 && Math.abs(dy) > Math.abs(dx) && !e.target.closest('.cat-picker') ? 'sheet' : 'scroll';
      if (touch.mode === 'sheet') begin(y);
    }
    if (touch.mode === 'sheet') { e.preventDefault(); move(y); }
  }, { passive: false });
  const touchEnd = () => { if (touch?.mode === 'sheet' && drag) finish(); touch = null; };
  body.addEventListener('touchend', touchEnd);
  body.addEventListener('touchcancel', touchEnd);

  el.addEventListener('click', (e) => { if (e.target.closest('[data-dismiss]')) close(); });
  el.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  return { open, close, get isOpen() { return isOpen; }, el };
}
const entrySheet = createSheet($('#sheet-entry'), { onClose: () => { state.editingId = null; } });
const settingsSheet = createSheet($('#sheet-settings'));

// ---------- Navegação ----------
const navbar = $('#navbar');
function setView(view, { indicatorVelocity = 0 } = {}) {
  const changed = view !== state.view;
  state.view = view;
  $$('.view').forEach((v) => v.classList.toggle('is-active', v.id === `view-${view}`));
  $$('.side-item[data-view]').forEach((t) => t.classList.toggle('is-active', t.dataset.view === view));
  tabs.forEach((t) => { const on = t.dataset.tab === view; t.classList.toggle('is-active', on); t.setAttribute('aria-current', on ? 'page' : 'false'); });
  placeIndicator(true, indicatorVelocity ? { velocity: indicatorVelocity } : {});
  const title = $(`#view-${view}`).dataset.title;
  $('#viewTitle').textContent = title;
  $('#navTitle').textContent = title;
  $('#monthNav').style.visibility = view === 'ia' ? 'hidden' : 'visible';
  try { sessionStorage.setItem('sbank:view', view); } catch {}
  if (changed) window.scrollTo({ top: 0 });
  render();
  syncSegments();
}
function render() {
  $('#monthLabel').textContent = monthName(state.month, { month: 'short', year: 'numeric' }).replace('.', '');
  if (state.view === 'resumo') renderHome();
  if (state.view === 'extrato') renderStatement();
  if (state.view === 'graficos') renderCharts();
  if (state.view === 'ia') renderAI();
}
addEventListener('scroll', () => {
  if (onScroll.raf) return;
  onScroll.raf = requestAnimationFrame(onScroll);
}, { passive: true });
function onScroll() {
  onScroll.raf = 0;
  navbar.classList.toggle('is-scrolled', scrollY > 36);
}

// ---------- Componentes ----------
function txItem(t, { swipe = false } = {}) {
  const c = catById(t.category);
  const [y, m, d] = t.date.split('-');
  return `<li class="tx-row" data-id="${t.id}">
    ${swipe ? '<div class="tx-row__delete" aria-hidden="true">Apagar</div>' : ''}
    <button class="tx" data-edit="${t.id}" ${swipe ? 'data-swipe' : ''}>
      <span class="tx__icon" style="background:${catTint(c, '1f')};color:${catColor(c)}">${catIcon(c)}</span>
      <span class="tx__body">
        <span class="tx__title">${esc(t.description || c.name)}</span>
        <span class="tx__meta">${esc(c.name)} · ${d}/${m}/${y.slice(2)}</span>
      </span>
      <span class="tx__amount ${t.type === 'income' ? 'pos' : 'is-expense'}">${t.type === 'income' ? '+' : '−'}${brl(t.amount)}</span>
    </button>
  </li>`;
}

// ---------- Resumo ----------
function renderHome() {
  const all = data.transactions;
  const month = txOfMonth(state.month);
  const inc = sum(month, 'income');
  const exp = sum(month, 'expense');
  const net = inc - exp;
  $('#totalBalance').textContent = brl(sum(all, 'income') - sum(all, 'expense'));
  $('#balanceSub').textContent = month.length
    ? `${net >= 0 ? '+' : '−'}${brl(Math.abs(net))} em ${monthName(state.month, { month: 'long' })}`
    : `Sem movimentações em ${monthName(state.month, { month: 'long' })}`;
  $('#monthIncome').textContent = brl(inc);
  $('#monthExpense').textContent = brl(exp);
  $('#monthNet').textContent = brl(net);
  $('#monthNet').className = `tile__value ${net < 0 ? 'neg' : ''}`;
  $('#savingsRate').textContent = inc > 0 ? `${Math.round((net / inc) * 100)}% guardado` : '';

  const byCat = groupByCategory(month, 'expense');
  const max = byCat[0]?.total || 1;
  $('#topCategories').innerHTML = byCat.length
    ? byCat.slice(0, 5).map(({ cat, total }, i) => `
      <div class="cat-bar">
        <span class="cat-bar__icon" style="background:${catTint(cat, '1f')};color:${catColor(cat)}">${catIcon(cat)}</span>
        <span class="cat-bar__name">${esc(cat.name)}</span>
        <span class="cat-bar__value">${brl(total)}</span>
        <span class="cat-bar__track"><span class="cat-bar__fill" style="width:${(total / max) * 100}%;background:${catColor(cat)};animation-delay:${i * 50}ms"></span></span>
      </div>`).join('')
    : '<p class="empty">Nenhuma saída neste mês.</p>';

  const recent = sortTx(all).slice(0, 5);
  $('#recentList').innerHTML = recent.length
    ? recent.map((t) => txItem(t)).join('')
    : `<li class="empty">Comece registrando o que entrou e o que saiu.<br>
        <button class="btn btn--primary pressable" data-new>Novo aporte</button>
        <br><button class="link pressable" id="demoInline" style="margin-top:12px">Ver com dados de exemplo</button></li>`;
}

// ---------- Novo aporte ----------
let amountCents = 0;
const amountEl = $('#amount');
function setAmount(cents, bump = false) {
  amountCents = clamp(cents, 0, 99999999999);
  $('#amountValue').textContent = brl(amountCents / 100);
  amountEl.classList.toggle('is-zero', amountCents === 0);
  if (bump) { amountEl.classList.remove('bump'); void amountEl.offsetWidth; amountEl.classList.add('bump'); }
}
function pressKey(key) {
  if (key === 'del') setAmount(Math.floor(amountCents / 10), true);
  else if (key === '00') setAmount(amountCents * 100, true);
  else if (amountCents < 1e10) setAmount(amountCents * 10 + Number(key), true);
}
const entryTypeSeg = segmented($('#entryType'), (v) => { state.entryType = v; renderEntry(); });
function renderEntry() {
  const form = $('#entryForm');
  form.dataset.type = state.entryType;
  entryTypeSeg.set(state.entryType);
  $('#amountSign').textContent = state.entryType === 'income' ? '+' : '−';
  const cats = catsOf(state.entryType);
  if (!cats.some((c) => c.id === state.entryCategory)) state.entryCategory = cats[0]?.id || null;
  $('#categoryChips').innerHTML = cats.map((c) => `
    <button type="button" class="cat-opt ${c.id === state.entryCategory ? 'is-active' : ''}" data-cat="${c.id}" role="radio" aria-checked="${c.id === state.entryCategory}">
      <span class="cat-opt__icon" style="background:${catTint(c, '1f')};color:${catColor(c)}">${catIcon(c)}</span>
      <span class="cat-opt__name">${esc(c.name)}</span>
    </button>`).join('');
  const editing = !!state.editingId;
  $('#entryTitle').textContent = editing ? 'Editar' : 'Novo aporte';
  $('#deleteBtn').hidden = !editing;
  $('#saveBtn').textContent = editing ? 'Salvar alterações' : state.entryType === 'income' ? 'Adicionar entrada' : 'Adicionar saída';
}
function openEntry(id = null) {
  const t = id && data.transactions.find((x) => x.id === id);
  state.editingId = t ? t.id : null;
  if (t) {
    state.entryType = t.type;
    state.entryCategory = t.category;
    setAmount(Math.round(t.amount * 100));
    $('#desc').value = t.description || '';
    $('#date').value = t.date;
  } else {
    setAmount(0);
    $('#desc').value = '';
    $('#date').value = monthKey(todayISO()) === state.month ? todayISO() : `${state.month}-01`;
  }
  renderEntry();
  entrySheet.open();
  requestAnimationFrame(() => $('.cat-opt.is-active')?.scrollIntoView({ inline: 'center', block: 'nearest' }));
}
function submitEntry(e) {
  e.preventDefault();
  if (amountCents <= 0) {
    amountEl.classList.remove('shake'); void amountEl.offsetWidth; amountEl.classList.add('shake');
    return;
  }
  const date = $('#date').value || todayISO();
  const payload = { type: state.entryType, amount: amountCents / 100, category: state.entryCategory, description: $('#desc').value.trim(), date };
  if (state.editingId) {
    Object.assign(data.transactions.find((x) => x.id === state.editingId), payload, { updatedAt: new Date().toISOString() });
    toast('Movimentação atualizada');
  } else {
    data.transactions.push({ id: uid(), ...payload, createdAt: new Date().toISOString() });
    toast(`${state.entryType === 'income' ? 'Entrada' : 'Saída'} de ${brl(payload.amount)} adicionada`);
  }
  haptic();
  persist();
  state.month = monthKey(date);
  entrySheet.close();
  render();
}

// ---------- Apagar com desfazer ----------
function removeTx(id, { animateRow } = {}) {
  const idx = data.transactions.findIndex((t) => t.id === id);
  if (idx < 0) return;
  const [removed] = data.transactions.splice(idx, 1);
  data.deleted[removed.id] = new Date().toISOString();
  persist();
  haptic();
  const done = () => render();
  if (animateRow) {
    animateRow.style.height = `${animateRow.offsetHeight}px`;
    animateRow.style.transition = 'height 280ms cubic-bezier(.22,1,.36,1), opacity 200ms ease';
    requestAnimationFrame(() => { animateRow.style.height = '0px'; animateRow.style.opacity = '0'; });
    setTimeout(done, 290);
  } else done();
  toast('Movimentação apagada', {
    label: 'Desfazer',
    run: () => {
      delete data.deleted[removed.id];
      removed.updatedAt = new Date().toISOString();
      data.transactions.splice(Math.min(idx, data.transactions.length), 0, removed);
      persist(); render();
    },
  });
}

// ---------- Extrato ----------
const typeSeg = segmented($('#typeFilter'), (v) => { state.typeFilter = v; renderStatement(); });
typeSeg.set('all', false);
function renderStatement() {
  const q = $('#search').value.trim().toLowerCase();
  const used = new Set(txOfMonth(state.month).map((t) => t.category));
  const cats = data.categories.filter((c) => used.has(c.id) && (state.typeFilter === 'all' || c.type === state.typeFilter));
  if (state.catFilter && !cats.some((c) => c.id === state.catFilter)) state.catFilter = '';
  $('#catFilter').innerHTML = `<button class="chip pressable ${state.catFilter ? '' : 'is-active'}" data-filter-cat="">Todas</button>` +
    cats.map((c) => `<button class="chip pressable ${c.id === state.catFilter ? 'is-active' : ''}" data-filter-cat="${c.id}">${esc(c.name)}</button>`).join('');

  let list = txOfMonth(state.month);
  if (state.typeFilter !== 'all') list = list.filter((t) => t.type === state.typeFilter);
  if (state.catFilter) list = list.filter((t) => t.category === state.catFilter);
  if (q) list = list.filter((t) => `${t.description} ${catById(t.category).name}`.toLowerCase().includes(q));

  const inc = sum(list, 'income');
  const exp = sum(list, 'expense');
  $('#statementSummary').innerHTML = `
    <div class="tile"><span class="tile__label">Entradas</span><strong class="tile__value pos">${brl(inc)}</strong></div>
    <div class="tile"><span class="tile__label">Saídas</span><strong class="tile__value neg">${brl(exp)}</strong></div>
    <div class="tile"><span class="tile__label">Resultado</span><strong class="tile__value ${inc - exp < 0 ? 'neg' : ''}">${brl(inc - exp)}</strong></div>`;

  $('#swipeHint').hidden = !list.length;
  if (!list.length) {
    const filtered = q || state.catFilter || state.typeFilter !== 'all';
    $('#statement').innerHTML = `<div class="group"><p class="empty">${filtered ? 'Nada encontrado com esses filtros.' : `Sem movimentações em ${monthName(state.month, { month: 'long' })}.`}
      ${filtered ? '' : '<br><button class="btn btn--primary pressable" data-new>Novo aporte</button>'}</p></div>`;
    return;
  }
  const days = new Map();
  sortTx(list).forEach((t) => { if (!days.has(t.date)) days.set(t.date, []); days.get(t.date).push(t); });
  $('#statement').innerHTML = [...days.entries()].map(([date, items]) => {
    const [y, m, d] = date.split('-').map(Number);
    const label = new Date(y, m - 1, d).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
    const net = sum(items, 'income') - sum(items, 'expense');
    return `<div class="day"><div class="day__head"><span>${label}</span><span>${net >= 0 ? '+' : '−'}${brl(Math.abs(net))}</span></div>
      <ul class="group list">${items.map((t) => txItem(t, { swipe: true })).join('')}</ul></div>`;
  }).join('');
}

// Deslizar para apagar: segue o dedo, elástico à direita, momento decide abrir/apagar
(function bindSwipe() {
  const container = $('#statement');
  const OPEN = -92;
  const springs = new WeakMap();
  let openRow = null;
  let g = null;
  const vel = tracker();
  const springFor = (btn) => {
    if (!springs.has(btn)) springs.set(btn, new Spring({ onUpdate: (x) => (btn.style.transform = x ? `translateX(${x}px)` : '') }));
    return springs.get(btn);
  };
  const closeOpen = (except) => { if (openRow && openRow !== except) { springFor(openRow).to(0, { damping: 1, response: 0.3 }); openRow = null; } };

  container.addEventListener('pointerdown', (e) => {
    const btn = e.target.closest('.tx[data-swipe]');
    if (!btn) { closeOpen(); return; }
    const s = springFor(btn);
    s.stop();
    g = { btn, x0: e.clientX, y0: e.clientY, from: s.value, mode: 'pending', id: e.pointerId };
    vel.reset(); vel.add(e.clientX);
  });
  container.addEventListener('pointermove', (e) => {
    if (!g || e.pointerId !== g.id) return;
    const dx = e.clientX - g.x0, dy = e.clientY - g.y0;
    vel.add(e.clientX);
    if (g.mode === 'pending') {
      if (Math.abs(dy) > 10) { g = null; return; }
      if (Math.abs(dx) < 10 || Math.abs(dx) < Math.abs(dy)) return;
      g.mode = 'drag';
      g.btn.setPointerCapture(e.pointerId);
      g.btn.dataset.dragged = '1';
      closeOpen(g.btn);
    }
    const w = g.btn.offsetWidth;
    let x = g.from + dx;
    if (x > 0) x = rubberband(x, w);
    if (x < -w) x = -w - rubberband(-w - x, w);
    springFor(g.btn).set(x);
  });
  const end = (e) => {
    if (!g || e.pointerId !== g.id) return;
    const { btn, mode } = g;
    g = null;
    if (mode !== 'drag') return;
    const s = springFor(btn);
    const v = vel.velocity();
    const w = btn.offsetWidth;
    const landing = s.value + project(v, 0.995);
    if (landing < -w * 0.6) {
      s.to(-w, { velocity: v, damping: 1, response: 0.25 });
      openRow = null;
      setTimeout(() => removeTx(btn.dataset.edit, { animateRow: btn.closest('.tx-row') }), 160);
    } else if (landing < OPEN / 2) {
      s.to(OPEN, { velocity: v, damping: 0.82, response: 0.32 });
      openRow = btn;
    } else {
      s.to(0, { velocity: v, damping: 1, response: 0.3 });
      if (openRow === btn) openRow = null;
    }
  };
  container.addEventListener('pointerup', end);
  container.addEventListener('pointercancel', end);
  // Toque na área vermelha apaga; toque numa linha aberta só fecha
  container.addEventListener('click', (e) => {
    const del = e.target.closest('.tx-row__delete');
    if (del) { const row = del.closest('.tx-row'); removeTx(row.dataset.id, { animateRow: row }); openRow = null; e.stopPropagation(); return; }
    const btn = e.target.closest('.tx[data-swipe]');
    if (!btn) return;
    if (btn.dataset.dragged) { delete btn.dataset.dragged; e.stopPropagation(); return; } // fim de um arraste
    if (springFor(btn).value < -1) { springFor(btn).to(0, { damping: 1, response: 0.3 }); openRow = null; e.stopPropagation(); }
  }, true);
})();

// ---------- Gráficos ----------
const charts = {};
const donutSeg = segmented($('#donutType'), (v) => { state.donutType = v; renderCharts(); });
donutSeg.set('expense', false);
function chartTheme() {
  const mode = isDark() ? 'dark' : 'light';
  return { mode, text: css('--label-2'), grid: css('--separator'), surface: css('--surface'), income: PALETTE[mode][SERIES.income], expense: PALETTE[mode][SERIES.expense] };
}
const compactBRL = (v) => (Math.abs(v) >= 1000 ? `${(v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil` : `${Math.round(v)}`);
function tooltipStyle() {
  const dark = isDark();
  return {
    backgroundColor: dark ? 'rgba(58,58,60,.96)' : 'rgba(255,255,255,.97)',
    titleColor: dark ? '#fff' : '#000', bodyColor: dark ? '#fff' : '#000',
    borderColor: dark ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.08)', borderWidth: 0.5,
    padding: 10, cornerRadius: 12, boxPadding: 4, usePointStyle: true, caretSize: 0,
    titleFont: { weight: '600' },
  };
}
function baseOptions(th) {
  return {
    responsive: true, maintainAspectRatio: false,
    animation: reducedMotion.matches ? false : { duration: 650, easing: 'easeOutQuart' },
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: { ...tooltipStyle(), callbacks: { label: (ctx) => ` ${ctx.dataset.label ? ctx.dataset.label + ': ' : ''}${brl(ctx.parsed.y ?? ctx.parsed)}` } },
    },
    scales: {
      x: { grid: { display: false }, border: { display: false }, ticks: { color: th.text, font: { size: 11 } } },
      y: { position: 'right', grid: { color: th.grid, lineWidth: 0.5 }, border: { display: false }, ticks: { color: th.text, font: { size: 11 }, maxTicksLimit: 4, callback: (v) => compactBRL(v) } },
    },
  };
}
const legendOptions = (th) => ({ display: true, position: 'top', align: 'start', labels: { color: th.text, usePointStyle: true, pointStyle: 'circle', boxWidth: 7, boxHeight: 7, padding: 14, font: { size: 12 } } });
function drawChart(key, canvas, config) {
  if (charts[key]) charts[key].destroy();
  charts[key] = new window.Chart(canvas, config);
}
function renderCharts() {
  if (!window.Chart) { setTimeout(renderCharts, 80); return; }
  window.Chart.defaults.font.family = '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif';
  const th = chartTheme();
  const month = txOfMonth(state.month);

  // Rosca por categoria (cores fixas por categoria; categorias sem cor entram em "Outros")
  const type = state.donutType;
  $('#donutTitle').textContent = type === 'expense' ? 'Saídas por categoria' : 'Entradas por categoria';
  const groups = groupByCategory(month, type);
  const colored = groups.filter((g) => g.cat.slot != null && g.cat.slot <= 7);
  const otherTotal = groups.filter((g) => !(g.cat.slot != null && g.cat.slot <= 7)).reduce((s, g) => s + g.total, 0);
  const slices = colored.map((g) => ({ label: g.cat.name, total: g.total, color: catColor(g.cat) }));
  if (otherTotal > 0) slices.push({ label: 'Outros', total: otherTotal, color: OTHER_COLOR[th.mode] });
  const total = slices.reduce((s, x) => s + x.total, 0);
  $('#donutTotal').textContent = brl(total, false);
  $('#donutLegend').innerHTML = slices.length
    ? slices.map((s) => `<li><i style="background:${s.color}"></i><span>${esc(s.label)}</span><b>${brl(s.total)}</b><small>${Math.round((s.total / total) * 100)}%</small></li>`).join('')
    : `<li class="empty" style="display:block">Sem ${type === 'expense' ? 'saídas' : 'entradas'} neste mês.</li>`;
  drawChart('donut', $('#donutChart'), {
    type: 'doughnut',
    data: {
      labels: slices.length ? slices.map((s) => s.label) : ['Sem dados'],
      datasets: [{
        data: slices.length ? slices.map((s) => s.total) : [1],
        backgroundColor: slices.length ? slices.map((s) => s.color) : [css('--fill')],
        borderColor: th.surface, borderWidth: 2.5, borderRadius: 6, hoverOffset: 5, spacing: 0,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '74%',
      animation: reducedMotion.matches ? false : { animateRotate: true, duration: 800, easing: 'easeOutQuart' },
      plugins: { legend: { display: false }, tooltip: { enabled: slices.length > 0, ...tooltipStyle(), callbacks: { label: (c) => ` ${brl(c.parsed)} (${Math.round((c.parsed / total) * 100)}%)` } } },
    },
  });

  // Barras: entradas e saídas dos últimos 6 meses
  const months = Array.from({ length: 6 }, (_, i) => shiftMonth(state.month, i - 5));
  const barOpts = baseOptions(th);
  barOpts.plugins.legend = legendOptions(th);
  const bar = (label, values, color) => ({ label, data: values, backgroundColor: color, borderRadius: 5, borderSkipped: 'start', maxBarThickness: 16, categoryPercentage: 0.62, barPercentage: 0.88 });
  drawChart('bar', $('#barChart'), {
    type: 'bar',
    data: {
      labels: months.map((m) => monthName(m, { month: 'short' }).replace('.', '')),
      datasets: [
        bar('Entradas', months.map((m) => sum(txOfMonth(m), 'income')), th.income),
        bar('Saídas', months.map((m) => sum(txOfMonth(m), 'expense')), th.expense),
      ],
    },
    options: barOpts,
  });

  // Linha: gasto acumulado no mês
  const [y, m] = state.month.split('-').map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const lastDay = state.month === monthKey(todayISO()) ? new Date().getDate() : daysInMonth;
  const perDay = Array(daysInMonth).fill(0);
  month.filter((t) => t.type === 'expense').forEach((t) => { perDay[+t.date.slice(8) - 1] += t.amount; });
  let acc = 0;
  const cumulative = perDay.map((v, i) => (i < lastDay ? (acc += v) : null));
  $('#lineSub').textContent = `${brl(acc)} até ${lastDay === daysInMonth ? 'o fim do mês' : `o dia ${lastDay}`}`;
  const lineOpts = baseOptions(th);
  lineOpts.plugins.tooltip.callbacks.title = (items) => `Dia ${items[0].label}`;
  lineOpts.scales.x.ticks.maxTicksLimit = 6;
  drawChart('line', $('#lineChart'), {
    type: 'line',
    data: {
      labels: perDay.map((_, i) => String(i + 1)),
      datasets: [{
        label: 'Acumulado', data: cumulative, borderColor: th.expense, borderWidth: 2, tension: 0.35, pointRadius: 0,
        pointHoverRadius: 5, pointHoverBackgroundColor: th.expense, pointHoverBorderColor: th.surface, pointHoverBorderWidth: 2,
        fill: true,
        backgroundColor: th.expense + '1a',
      }],
    },
    options: lineOpts,
  });
}

// ---------- Análise com IA ----------
const aiModeSeg = segmented($('#aiMode'), (v) => { state.aiMode = v; renderAI(); });
const yesterdayISO = () => { const d = new Date(); d.setDate(d.getDate() - 1); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
function dayLabel(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const txt = new Date(y, m - 1, d).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  return iso === yesterdayISO() ? `Ontem · ${txt}` : txt.charAt(0).toUpperCase() + txt.slice(1);
}
const dailyAdapter = (d) => ({ id: `d${d.date.replace(/-/g, '')}`, question: '', createdAt: d.generatedAt, report: d.report });
function renderDaily() {
  const box = $('#dailyList');
  if (!data.daily.length) {
    box.innerHTML = `<div class="group"><p class="empty">${ghReady()
      ? 'A primeira análise diária chega no próximo dia às 10h. Ela olha o dia anterior e o mês até agora.'
      : 'Conecte o GitHub em Ajustes para receber uma análise do Claude todo dia às 10h.'}</p></div>`;
    return;
  }
  box.innerHTML = data.daily.map((d, i) => `
    <details class="daily" data-date="${d.date}" ${i === 0 ? 'open' : ''}>
      <summary class="daily__head">
        <span class="daily__date">${dayLabel(d.date)}</span>
        <span class="daily__title">${esc(d.report.titulo)}</span>
      </summary>
      ${reportHTML(dailyAdapter(d), { daily: true })}
    </details>`).join('');
  const first = data.daily[0];
  if (first) drawReportCharts(dailyAdapter(first));
}
function renderAI() {
  aiModeSeg.set(state.aiMode);
  $('#aiDaily').hidden = state.aiMode !== 'daily';
  $('#aiAsk').hidden = state.aiMode !== 'ask';
  if (state.aiMode === 'daily') { renderDaily(); return; }
  $('#aiNoKey').hidden = !!settings.apiKey;
  const box = $('#aiResults');
  if (box.dataset.busy) return;
  box.innerHTML = data.analyses.slice(0, 10).map(reportHTML).join('') ||
    '<p class="empty">Toque numa sugestão ou escreva sua pergunta.</p>';
  data.analyses.slice(0, 10).forEach(drawReportCharts);
}

const REPORT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['titulo', 'resumo', 'insights', 'graficos', 'dicas'],
  properties: {
    titulo: { type: 'string', description: 'Título curto da análise' },
    resumo: { type: 'string', description: 'Resumo em 2 a 4 frases' },
    insights: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false, required: ['tipo', 'texto'],
        properties: { tipo: { type: 'string', enum: ['positivo', 'alerta', 'neutro'] }, texto: { type: 'string' } },
      },
    },
    graficos: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false, required: ['tipo', 'titulo', 'descricao', 'rotulos', 'series'],
        properties: {
          tipo: { type: 'string', enum: ['rosca', 'barras', 'linha'] },
          titulo: { type: 'string' },
          descricao: { type: 'string' },
          rotulos: { type: 'array', items: { type: 'string' } },
          series: {
            type: 'array',
            items: {
              type: 'object', additionalProperties: false, required: ['nome', 'valores'],
              properties: { nome: { type: 'string' }, valores: { type: 'array', items: { type: 'number' } } },
            },
          },
        },
      },
    },
    dicas: { type: 'array', items: { type: 'string' } },
  },
};

const SYSTEM_PROMPT = `Você é o Analista S, assistente financeiro do app S Bank. Você recebe as movimentações reais do usuário (ganhos e gastos em reais, por categoria) e responde em português do Brasil.

Como responder:
- Baseie cada número nos dados recebidos; faça as contas com cuidado. Se os dados forem insuficientes para responder, diga isso no resumo.
- Seja direto e prático, sem jargão. Valores sempre em R$.
- "insights": de 3 a 6 observações curtas e específicas (cite categorias e valores). Use "alerta" para riscos ou gastos fora do padrão, "positivo" para bons hábitos, "neutro" para fatos.
- "graficos": de 1 a 3 gráficos que ajudem a entender a resposta. "rosca" para composição (uma única série, até 8 fatias; agrupe o resto em "Outros"), "barras" para comparar categorias ou meses (até 3 séries), "linha" para evolução no tempo. Cada série deve ter exatamente um valor por rótulo. Use os nomes de categoria exatamente como aparecem nos dados.
- "dicas": de 2 a 4 ações concretas, com valores estimados quando fizer sentido.
- Não invente movimentações e não dê recomendações de investimento em produtos específicos.`;

function buildContext() {
  const months = Array.from({ length: 12 }, (_, i) => shiftMonth(state.month, i - 11));
  const resumoMensal = months.map((m) => {
    const list = txOfMonth(m);
    const porCategoria = Object.fromEntries(groupByCategory(list, 'expense').map((g) => [g.cat.name, +g.total.toFixed(2)]));
    return { mes: m, ganhos: +sum(list, 'income').toFixed(2), gastos: +sum(list, 'expense').toFixed(2), gastosPorCategoria: porCategoria };
  }).filter((r) => r.ganhos || r.gastos);
  const recentMonths = new Set(months.slice(-6));
  const tx = sortTx(data.transactions.filter((t) => recentMonths.has(monthKey(t.date))));
  const csvLines = tx.map((t) => [t.date, t.type === 'income' ? 'ganho' : 'gasto', catById(t.category).name, t.amount.toFixed(2), (t.description || '').replace(/[;\n]/g, ' ')].join(';'));
  return `Data de hoje: ${todayISO()}. Mês selecionado no app: ${state.month}.
Categorias de gasto: ${catsOf('expense').map((c) => c.name).join(', ')}.
Categorias de ganho: ${catsOf('income').map((c) => c.name).join(', ')}.
Saldo total acumulado: ${(sum(data.transactions, 'income') - sum(data.transactions, 'expense')).toFixed(2)}.

<resumo_mensal>
${JSON.stringify(resumoMensal)}
</resumo_mensal>

<movimentacoes_ultimos_6_meses formato="data;tipo;categoria;valor;descricao">
${csvLines.join('\n') || '(nenhuma)'}
</movimentacoes_ultimos_6_meses>`;
}

let anthropicModule;
async function askAI(question) {
  if (!settings.apiKey) { analyzeInClaude(question); return; }
  if (!data.transactions.length) { toast('Adicione movimentações antes de pedir uma análise.'); return; }
  const box = $('#aiResults');
  box.dataset.busy = '1';
  $('#aiSend').disabled = true;
  $$('[data-prompt]').forEach((b) => (b.disabled = true));
  if (!box.querySelector('.report')) box.innerHTML = '';
  box.insertAdjacentHTML('afterbegin', `<div class="thinking" id="aiLoading"><div class="thinking__dots"><i></i><i></i><i></i></div><div><b>Analisando suas finanças</b><span>${esc(question)}</span></div></div>`);
  $('#aiLoading').scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'center' });

  try {
    anthropicModule ||= await import('./vendor/anthropic.mjs');
    const { Anthropic } = anthropicModule;
    const client = new Anthropic({ apiKey: settings.apiKey, dangerouslyAllowBrowser: true });
    const message = await client.beta.messages.stream({
      model: AI_MODEL,
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'medium', format: { type: 'json_schema', schema: REPORT_SCHEMA } },
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `${buildContext()}\n\nPergunta do usuário: ${question}` }],
    }).finalMessage();

    if (message.stop_reason === 'refusal') throw new Error('A IA não pôde responder a esse pedido. Tente reformular a pergunta.');
    if (message.stop_reason === 'max_tokens') throw new Error('A resposta ficou longa demais. Tente uma pergunta mais específica.');
    const text = message.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
    let report;
    try { report = JSON.parse(text); } catch { throw new Error('A IA devolveu uma resposta em formato inesperado. Tente de novo.'); }

    data.analyses.unshift({ id: uid(), question, createdAt: new Date().toISOString(), month: state.month, report });
    data.analyses = data.analyses.slice(0, 20);
    persist();
    haptic();
  } catch (err) {
    console.error(err);
    const A = anthropicModule?.Anthropic;
    let msg = err.message || 'Erro desconhecido.';
    if (A && err instanceof A.AuthenticationError) msg = 'Chave da API inválida. Confira em Ajustes.';
    else if (A && err instanceof A.PermissionDeniedError) msg = 'Sua chave não tem permissão para esse modelo.';
    else if (A && err instanceof A.RateLimitError) msg = 'Limite de uso atingido. Aguarde um pouco e tente de novo.';
    else if (A && err instanceof A.APIConnectionError) msg = 'Sem conexão com a API. Verifique sua internet.';
    else if (A && err instanceof A.APIError) msg = `Erro da API (${err.status ?? '—'}): ${err.message}`;
    delete box.dataset.busy;
    renderAI();
    box.insertAdjacentHTML('afterbegin', `<div class="report report--error"><b>Não foi possível analisar</b><p class="report__q" style="margin-top:4px">${esc(msg)}</p></div>`);
    return;
  } finally {
    $('#aiSend').disabled = false;
    $$('[data-prompt]').forEach((b) => (b.disabled = false));
  }
  delete box.dataset.busy;
  $('#aiQuestion').value = '';
  autosize();
  renderAI();
}

// ---------- Analisar no app do Claude (usa o plano do Claude, sem API) ----------
const CLAUDE_APP_PROMPT = `Você é meu analista financeiro pessoal. Abaixo estão meus dados do app S Bank (valores em R$).
Responda em português do Brasil, de forma direta e prática:
- Comece com um resumo de 2 a 4 frases.
- Liste de 3 a 6 observações específicas, citando categorias e valores.
- Crie 1 a 3 gráficos que ajudem a entender a resposta.
- Termine com 2 a 4 ações concretas, com valores estimados.
Baseie cada número nos dados; não invente movimentações.`;
async function analyzeInClaude(question) {
  if (!data.transactions.length) { toast('Adicione movimentações antes de pedir uma análise.'); return; }
  const text = `${CLAUDE_APP_PROMPT}\n\n${buildContext()}\n\nMinha pergunta: ${question}`;
  const win = window.open('about:blank', '_blank'); // abre já no toque, para o navegador não bloquear
  try {
    await navigator.clipboard.writeText(text);
    toast('Copiado! Cole na conversa do Claude e envie.');
  } catch {
    toast('Não consegui copiar automaticamente. Tente de novo.');
  }
  if (win) win.location.href = 'https://claude.ai/new'; else location.href = 'https://claude.ai/new';
}

function reportHTML(a, { daily = false } = {}) {
  const r = a.report;
  const when = new Date(a.createdAt).toLocaleString('pt-BR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  return `<article class="report ${daily ? 'report--daily' : ''}">
    ${daily ? '' : `<p class="report__q">${esc(a.question)}</p>`}
    ${daily ? '' : `<h3>${esc(r.titulo)}</h3>`}
    <p class="report__summary">${esc(r.resumo)}</p>
    ${r.insights?.length ? `<ul class="insights">${r.insights.map((i) => `<li class="${esc(i.tipo)}"><span>${esc(i.texto)}</span></li>`).join('')}</ul>` : ''}
    ${(r.graficos || []).map((g, i) => `<div class="report__chart"><h4>${esc(g.titulo)}</h4><p>${esc(g.descricao)}</p>
      <div class="${g.tipo === 'rosca' ? 'donut' : 'chart'}"><canvas id="ai-${a.id}-${i}" role="img" aria-label="${esc(g.titulo)}"></canvas></div>
      ${g.tipo === 'rosca' ? `<ul class="legend" id="ai-${a.id}-${i}-legend"></ul>` : ''}</div>`).join('')}
    ${r.dicas?.length ? `<h4 class="report__tips-title">O que fazer agora</h4><ol class="tips">${r.dicas.map((d) => `<li>${esc(d)}</li>`).join('')}</ol>` : ''}
    ${daily ? `<div class="report__foot"><span>Gerada pelo Claude · ${when}</span></div>` : `<div class="report__foot"><span>${when}</span><button class="link pressable" data-del-analysis="${a.id}">Remover</button></div>`}
  </article>`;
}

function drawReportCharts(a) {
  if (!window.Chart) { setTimeout(() => drawReportCharts(a), 80); return; }
  const th = chartTheme();
  const pal = PALETTE[th.mode];
  (a.report.graficos || []).forEach((g, i) => {
    const canvas = document.getElementById(`ai-${a.id}-${i}`);
    if (!canvas || !g.series?.length) return;
    const key = `ai-${a.id}-${i}`;
    if (g.tipo === 'rosca') {
      // A cor segue a categoria quando o rótulo é uma categoria conhecida
      const values = g.series[0].valores;
      const used = new Set();
      let fallbackSlot = 0;
      const colors = g.rotulos.map((label) => {
        const cat = data.categories.find((c) => c.name.toLowerCase() === label.toLowerCase() && c.slot != null && c.slot <= 7);
        if (cat && !used.has(cat.slot)) { used.add(cat.slot); return pal[cat.slot]; }
        if (/^outros?$/i.test(label)) return OTHER_COLOR[th.mode];
        while (used.has(fallbackSlot) && fallbackSlot < 8) fallbackSlot++;
        if (fallbackSlot >= 8) return OTHER_COLOR[th.mode];
        used.add(fallbackSlot);
        return pal[fallbackSlot];
      });
      const total = values.reduce((s, v) => s + v, 0) || 1;
      const legend = document.getElementById(`${key}-legend`);
      if (legend) legend.innerHTML = g.rotulos.map((l, j) => `<li><i style="background:${colors[j]}"></i><span>${esc(l)}</span><b>${brl(values[j] || 0)}</b><small>${Math.round(((values[j] || 0) / total) * 100)}%</small></li>`).join('');
      drawChart(key, canvas, {
        type: 'doughnut',
        data: { labels: g.rotulos, datasets: [{ data: values, backgroundColor: colors, borderColor: th.surface, borderWidth: 2.5, borderRadius: 6 }] },
        options: { responsive: true, maintainAspectRatio: false, cutout: '72%', animation: reducedMotion.matches ? false : undefined, plugins: { legend: { display: false }, tooltip: { ...tooltipStyle(), callbacks: { label: (c) => ` ${brl(c.parsed)}` } } } },
      });
      return;
    }
    const opts = baseOptions(th);
    const series = g.series.slice(0, 8);
    if (series.length > 1) opts.plugins.legend = legendOptions(th);
    const seriesColor = (s, j) => {
      if (/ganho|receita|entrada/i.test(s.nome)) return th.income;
      if (/gasto|despesa|sa[ií]da/i.test(s.nome)) return th.expense;
      return pal[j];
    };
    drawChart(key, canvas, {
      type: g.tipo === 'linha' ? 'line' : 'bar',
      data: {
        labels: g.rotulos,
        datasets: series.map((s, j) => {
          const color = seriesColor(s, j);
          return g.tipo === 'linha'
            ? { label: s.nome, data: s.valores, borderColor: color, backgroundColor: color, borderWidth: 2, tension: 0.35, pointRadius: 0, pointHoverRadius: 5 }
            : { label: s.nome, data: s.valores, backgroundColor: color, borderRadius: 5, borderSkipped: 'start', maxBarThickness: 18, categoryPercentage: 0.62, barPercentage: 0.88 };
        }),
      },
      options: opts,
    });
  });
}
function autosize() {
  const ta = $('#aiQuestion');
  ta.style.height = 'auto';
  ta.style.height = `${Math.min(ta.scrollHeight, 140)}px`;
}

// ---------- Exportar / importar ----------
// As análises diárias já ficam em analises/ no repositório; não vão para o arquivo de dados
const exportPayload = () => { const { daily, ...rest } = data; return { ...rest, exportedAt: new Date().toISOString() }; };
async function saveFile(name, content, mime) {
  const blob = new Blob([content], { type: mime });
  const file = new File([blob], name, { type: mime });
  // No iPhone, a folha de compartilhamento permite "Salvar em Arquivos" direto
  if (matchMedia('(pointer: coarse)').matches && navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: name }); return; } catch (e) { if (e.name === 'AbortError') return; }
  }
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
const exportJSON = () => saveFile(`sbank-dados-${todayISO()}.json`, JSON.stringify(exportPayload(), null, 2), 'application/json');
function exportCSV() {
  const rows = [['data', 'tipo', 'categoria', 'descricao', 'valor']];
  sortTx(data.transactions).forEach((t) => rows.push([t.date, t.type === 'income' ? 'ganho' : 'gasto', catById(t.category).name, t.description || '', (t.type === 'income' ? t.amount : -t.amount).toFixed(2).replace('.', ',')]));
  const csv = '﻿' + rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n');
  saveFile(`sbank-extrato-${todayISO()}.csv`, csv, 'text/csv');
}
function mergeData(incoming, mode) {
  const inc = normalize(incoming);
  if (mode === 'replace') { data = inc; return; }
  const cats = new Map(data.categories.map((c) => [c.id, c]));
  inc.categories.forEach((c) => { if (!cats.has(c.id)) cats.set(c.id, c); });
  const tx = new Map(data.transactions.map((t) => [t.id, t]));
  inc.transactions.forEach((t) => { const cur = tx.get(t.id); if (!cur || txStamp(t) > txStamp(cur)) tx.set(t.id, t); });
  const an = new Map(data.analyses.map((a) => [a.id, a]));
  inc.analyses.forEach((a) => an.set(a.id, a));
  Object.entries(inc.deleted).forEach(([id, at]) => { if (!data.deleted[id] || at > data.deleted[id]) data.deleted[id] = at; });
  data.categories = [...cats.values()];
  data.transactions = [...tx.values()].filter((t) => !isDeleted(t, data.deleted));
  data.analyses = [...an.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 20);
}
async function importFile(file) {
  try {
    const parsed = JSON.parse(await file.text());
    if (!parsed || !Array.isArray(parsed.transactions)) throw new Error();
    const replace = data.transactions.length && confirm(`Arquivo com ${parsed.transactions.length} movimentações.\n\nOK = substituir tudo pelos dados do arquivo\nCancelar = juntar com os dados atuais`);
    mergeData(parsed, replace ? 'replace' : 'merge');
    persist();
    toast('Dados importados');
    refreshAll();
  } catch {
    toast('Arquivo inválido. Use um .json exportado pelo S Bank.');
  }
}

// ---------- Sincronização com GitHub (opcional) ----------
const b64encode = (str) => { const bytes = new TextEncoder().encode(str); let bin = ''; bytes.forEach((b) => (bin += String.fromCharCode(b))); return btoa(bin); };
const b64decode = (b64) => new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\s/g, '')), (c) => c.charCodeAt(0)));
function ghConfig() {
  const repo = (settings.ghRepo || '').trim();
  const path = (settings.ghPath || 'data/sbank-dados.json').trim().replace(/^\/+/, '');
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo) || !settings.ghToken) { toast('Preencha repositório e token do GitHub.'); return null; }
  return { url: `https://api.github.com/repos/${repo}/contents/${path.split('/').map(encodeURIComponent).join('/')}`, path };
}
async function gh(url, init = {}) {
  const res = await fetch(url, { ...init, headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${settings.ghToken}`, 'X-GitHub-Api-Version': '2022-11-28', ...(init.headers || {}) } });
  if (res.status === 404 && (!init.method || init.method === 'GET')) return null;
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(res.status === 401 ? 'Token inválido ou expirado.' : res.status === 403 ? 'O token não tem permissão de escrita nesse repositório.' : body.message || `Erro ${res.status}`);
  }
  return res.json();
}
// ---------- Sincronização automática com o GitHub ----------
// Junta o arquivo do repositório com os dados do aparelho e envia de volta, alguns segundos depois de cada mudança.
const ghReady = () => !!settings.ghToken && /^[\w.-]+\/[\w.-]+$/.test((settings.ghRepo || '').trim());
let syncTimer = 0, syncing = false, syncAgain = false;
function scheduleSync() {
  if (!ghReady()) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => syncNow(), 4000);
}
const dataSignature = (d) => JSON.stringify([
  d.categories.map((c) => [c.id, c.name, c.icon, c.type, c.slot]),
  [...d.transactions].sort((a, b) => a.id.localeCompare(b.id)).map((t) => [t.id, t.type, t.amount, t.category, t.description, t.date, txStamp(t)]),
  d.analyses.map((a) => a.id),
  Object.keys(d.deleted).sort(),
]);
async function syncNow({ manual = false } = {}) {
  if (!ghReady()) { if (manual) toast('Preencha repositório e token do GitHub.'); return; }
  if (!navigator.onLine) { if (manual) toast('Sem conexão com a internet.'); return; }
  if (syncing) { syncAgain = true; return; }
  syncing = true;
  const cfg = ghConfig();
  try {
    for (let attempt = 0; attempt < 2; attempt++) {
      const remote = await gh(`${cfg.url}?t=${Date.now()}`);
      let remoteSig = null;
      if (remote?.content) {
        const remoteData = normalize(JSON.parse(b64decode(remote.content)));
        remoteSig = dataSignature(remoteData);
        mergeData(remoteData, 'merge');
        saveJSON(STORAGE_KEY, data);
      }
      if (remoteSig === dataSignature(data)) break; // nada novo para enviar
      try {
        await gh(cfg.url, {
          method: 'PUT',
          body: JSON.stringify({
            message: `Atualiza dados do S Bank (${new Date().toLocaleString('pt-BR')})`,
            content: b64encode(JSON.stringify(exportPayload(), null, 2)),
            ...(remote?.sha ? { sha: remote.sha } : {}),
          }),
        });
        break;
      } catch (e) {
        // outro aparelho enviou no meio do caminho: busca de novo e junta
        if (attempt === 1 || !/does not match|conflict|409/i.test(e.message)) throw e;
      }
    }
    settings.lastSync = new Date().toISOString(); saveSettings();
    render();
    if (settingsSheet.isOpen) renderSettings();
    if (manual) { haptic(); toast('Sincronizado com o GitHub'); }
  } catch (e) {
    if (manual) toast(`GitHub: ${e.message}`);
  } finally {
    syncing = false;
    if (syncAgain) { syncAgain = false; scheduleSync(); }
  }
}

// ---------- Análises diárias (geradas pelo Claude Code às 10h, em analises/AAAA-MM-DD.json) ----------
async function checkDaily({ manual = false } = {}) {
  if (!ghReady() || !navigator.onLine) return;
  const base = `https://api.github.com/repos/${settings.ghRepo.trim()}/contents/analises`;
  try {
    const list = await gh(`${base}?t=${Date.now()}`);
    const have = new Set(data.daily.map((d) => d.date));
    const missing = (Array.isArray(list) ? list : [])
      .filter((f) => f.type === 'file' && /^\d{4}-\d{2}-\d{2}\.json$/.test(f.name) && !have.has(f.name.slice(0, 10)))
      .sort((a, b) => b.name.localeCompare(a.name)).slice(0, 14);
    let added = 0;
    for (const f of missing) {
      const file = await gh(`${base}/${encodeURIComponent(f.name)}`);
      try {
        const obj = JSON.parse(b64decode(file.content));
        if (!obj.titulo || !obj.resumo) continue;
        const { titulo, resumo, insights = [], graficos = [], dicas = [] } = obj;
        data.daily.push({ date: f.name.slice(0, 10), generatedAt: obj.geradoEm || new Date().toISOString(), report: { titulo, resumo, insights, graficos, dicas } });
        added++;
      } catch {}
    }
    if (!added) { if (manual) toast('Nenhuma análise diária nova'); return; }
    data.daily.sort((a, b) => b.date.localeCompare(a.date));
    data.daily = data.daily.slice(0, 90);
    saveJSON(STORAGE_KEY, data);
    if (state.view === 'ia') renderAI();
    toast(added === 1 ? 'Nova análise diária disponível' : `${added} análises diárias novas`, {
      label: 'Ver', run: () => { state.aiMode = 'daily'; setView('ia'); },
    });
  } catch (e) { if (manual) toast(`GitHub: ${e.message}`); }
}

// Ao abrir o app: compras do Apple Pay → sincroniza dados → busca análises diárias
let remoteLast = 0;
async function refreshRemote({ manual = false } = {}) {
  if (!manual && Date.now() - remoteLast < 30000) return;
  remoteLast = Date.now();
  await checkInbox({ manual });
  await syncNow({ manual });
  await checkDaily({ manual });
}

// ---------- Compras do Apple Pay (atalho do iPhone → pasta inbox/ no GitHub) ----------
// A automação "Transação" do app Atalhos grava cada compra em inbox/compra-AAAAMMDD-HHmmss.json.
// Ao abrir o app, as compras novas entram no extrato e o arquivo é apagado.
const CATEGORY_HINTS = [
  ['alimentacao', /mercad|supermerc|padaria|panific|ifood|rappi|restaur|lanch|burger|pizz|caf[eé]|a[cç]ougue|hortifr|carrefour|p[aã]o de a[cç]|assa[ií]|atacad|mcdonald|bk |subway|outback|starbucks|sorvet|doceria|bistr|food/i],
  ['transporte', /uber|\b99|posto|combust|shell|ipiranga|petrobras|estacion|metr[oô]|sem parar|veloe|conectcar|[oô]nibus|bilhete/i],
  ['assinaturas', /netflix|spotify|apple\.com|icloud|prime video|amazon prime|disney|hbo|\bmax\b|youtube|deezer|globoplay|chatgpt|openai|anthropic|paramount|crunchyroll/i],
  ['roupas', /renner|riachuelo|c&a|zara|shein|nike|adidas|centauro|hering|marisa|cea |lojas|vestu|cal[cç]ad/i],
  ['saude', /farm|drogar|droga |raia|pacheco|pague menos|hospital|cl[ií]nica|laborat|odonto|[oó]tica|academia|smart ?fit/i],
  ['lazer', /cinema|cinemark|ingresso|\bbar\b|show|steam|playstation|xbox|nintendo|teatro|museu|parque|viagem|hotel|airbnb/i],
  ['educacao', /livrar|curso|udemy|alura|escola|faculdade|papelar|kindle/i],
  ['moradia', /enel|light|sabesp|cemig|copel|condom|aluguel|g[aá]s|claro|vivo|\btim\b|internet|leroy|telhanorte|casa/i],
];
function guessCategory(merchant) {
  const key = merchant.trim().toLowerCase();
  // 1º: a categoria que você usou da última vez neste estabelecimento
  const past = sortTx(data.transactions).find((t) => t.type === 'expense' && (t.description || '').trim().toLowerCase() === key);
  if (past) return past.category;
  const hit = CATEGORY_HINTS.find(([, re]) => re.test(merchant));
  return hit && data.categories.some((c) => c.id === hit[0]) ? hit[0] : 'outros-gasto';
}
function parseAmount(v) {
  if (typeof v === 'number') return v;
  let txt = String(v || '').replace(/[^\d,.-]/g, '');
  if (txt.includes(',')) txt = txt.replace(/\./g, '').replace(',', '.'); // formato brasileiro: 1.234,56
  return Math.abs(parseFloat(txt));
}
function parseInboxFile(name, text) {
  let obj;
  try { obj = JSON.parse(text); } catch {
    const pick = (k) => (text.match(new RegExp(`"${k}"\\s*:\\s*"([^"]*)"`)) || [])[1];
    obj = { valor: pick('valor'), estabelecimento: pick('estabelecimento') };
  }
  const amount = parseAmount(obj.valor ?? obj.amount);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  const m = name.match(/(\d{4})(\d{2})(\d{2})/);
  const date = m ? `${m[1]}-${m[2]}-${m[3]}` : todayISO();
  const merchant = String(obj.estabelecimento ?? obj.merchant ?? '').trim() || 'Compra Apple Pay';
  return {
    id: `applepay-${name.replace(/\.json$/, '')}`, type: 'expense', amount: Math.round(amount * 100) / 100,
    category: guessCategory(merchant), description: merchant, date, source: 'applepay', createdAt: new Date().toISOString(),
  };
}
let inboxBusy = false;
async function checkInbox({ manual = false } = {}) {
  const repo = (settings.ghRepo || '').trim();
  if (!settings.ghToken || !/^[\w.-]+\/[\w.-]+$/.test(repo) || inboxBusy || !navigator.onLine) return;
  inboxBusy = true;
  const base = `https://api.github.com/repos/${repo}/contents/inbox`;
  try {
    const list = await gh(`${base}?t=${Date.now()}`);
    const files = (Array.isArray(list) ? list : []).filter((f) => f.type === 'file' && f.name.endsWith('.json'));
    if (!files.length) return;
    const added = [];
    for (const f of files) {
      const file = await gh(`${base}/${encodeURIComponent(f.name)}`);
      const tx = file?.content ? parseInboxFile(f.name, b64decode(file.content)) : null;
      if (tx && !data.transactions.some((t) => t.id === tx.id)) { data.transactions.push(tx); added.push(tx); }
      persist(); // salva antes de apagar o arquivo, para nunca perder uma compra
      await gh(`${base}/${encodeURIComponent(f.name)}`, { method: 'DELETE', body: JSON.stringify({ message: `Importa ${f.name} no S Bank`, sha: f.sha }) });
    }
    if (!added.length) return;
    haptic();
    render();
    if (added.length === 1) {
      const t = added[0];
      toast(`${t.description}: ${brl(t.amount)} em ${catById(t.category).name}`, { label: 'Editar', run: () => openEntry(t.id) });
    } else {
      toast(`${added.length} compras do Apple Pay adicionadas`, { label: 'Ver', run: () => setView('extrato') });
    }
  } catch (e) {
    if (manual) toast(`GitHub: ${e.message}`);
  } finally { inboxBusy = false; }
}

// ---------- Ajustes ----------
const themeSeg = segmented($('#themeSeg'), (v) => applyTheme(v));
themeSeg.set(getTheme(), false);
const catTypeSeg = segmented($('#catType'), (v) => { state.newCatType = v; });
catTypeSeg.set('expense', false);
function renderIconPicker() {
  $('#iconPick').innerHTML = PICKABLE_ICONS.map((n) => `<button type="button" class="icon-opt ${n === state.newCatIcon ? 'is-active' : ''}" data-pick-icon="${n}" role="radio" aria-checked="${n === state.newCatIcon}" aria-label="Ícone ${n}">${iconSVG(n)}</button>`).join('');
}
function renderSettings() {
  renderIconPicker();
  const n = data.transactions.length;
  const last = settings.lastSync ? ` Última sincronização: ${new Date(settings.lastSync).toLocaleString('pt-BR')}.` : '';
  $('#dataInfo').textContent = `${n} movimentaç${n === 1 ? 'ão salva' : 'ões salvas'} neste aparelho. Com o GitHub conectado, tudo é sincronizado sozinho.${last}`;
  $('#apiKey').value = settings.apiKey || '';
  $('#ghRepo').value = settings.ghRepo || '';
  $('#ghPath').value = settings.ghPath || '';
  $('#ghToken').value = settings.ghToken || '';
  $('#catManage').innerHTML = data.categories.map((c) => `
    <div class="cat-row">
      <span class="cat-row__icon" style="background:${catTint(c, '1f')};color:${catColor(c)}">${catIcon(c)}</span>
      <span class="cat-row__name">${esc(c.name)}</span>
      <span class="cat-row__type">${c.type === 'income' ? 'Entrada' : 'Saída'}</span>
      ${DEFAULT_CATEGORIES.some((d) => d.id === c.id) ? '<span style="width:8px"></span>' : `<button class="cat-row__del pressable" data-del-cat="${c.id}" aria-label="Remover ${esc(c.name)}"><svg><use href="#i-trash"/></svg></button>`}
    </div>`).join('');
}
function addCategory(e) {
  e.preventDefault();
  const name = $('#catName').value.trim();
  const type = state.newCatType;
  if (!name) return;
  if (catsOf(type).some((c) => c.name.toLowerCase() === name.toLowerCase())) { toast('Essa categoria já existe.'); return; }
  const usedSlots = new Set(catsOf(type).map((c) => c.slot).filter((s) => s != null));
  const free = [0, 1, 2, 3, 4, 5, 6, 7].find((s) => !usedSlots.has(s));
  data.categories.push({ id: `c-${uid().slice(0, 8)}`, name, icon: state.newCatIcon, type, slot: free ?? null });
  persist();
  $('#catName').value = '';
  renderSettings();
  toast(`Categoria “${name}” criada`);
}
function deleteCategory(id) {
  const c = catById(id);
  const used = data.transactions.filter((t) => t.category === id).length;
  if (!confirm(used ? `“${c.name}” tem ${used} movimentações. Elas irão para “Outros”. Continuar?` : `Remover a categoria “${c.name}”?`)) return;
  const fallback = c.type === 'income' ? 'outros-ganho' : 'outros-gasto';
  data.transactions.forEach((t) => { if (t.category === id) t.category = fallback; });
  data.categories = data.categories.filter((x) => x.id !== id);
  persist();
  renderSettings();
}

// ---------- Dados de exemplo ----------
function demoData() {
  const tx = [];
  const add = (date, type, category, amount, description) => tx.push({ id: uid(), type, category, amount, description, date, createdAt: `${date}T12:00:00.000Z` });
  const now = monthKey(todayISO());
  const rnd = (seed) => { const x = Math.sin(seed) * 10000; return x - Math.floor(x); };
  for (let i = -5; i <= 0; i++) {
    const m = shiftMonth(now, i);
    const day = (d) => `${m}-${pad(Math.min(d, i === 0 ? new Date().getDate() : 28))}`;
    const k = i + 10;
    add(day(5), 'income', 'salario', 6200, 'Salário');
    if (i % 2 === 0) add(day(18), 'income', 'freelance', 900 + Math.round(rnd(k) * 800), 'Projeto freelance');
    add(day(28), 'income', 'rendimentos', 38 + Math.round(rnd(k + 1) * 30), 'Rendimento da conta');
    add(day(6), 'expense', 'moradia', 1850, 'Aluguel');
    add(day(10), 'expense', 'moradia', 180 + Math.round(rnd(k + 2) * 60), 'Conta de luz');
    add(day(3), 'expense', 'assinaturas', 55.9, 'Netflix');
    add(day(3), 'expense', 'assinaturas', 21.9, 'Spotify');
    add(day(12), 'expense', 'assinaturas', 14.9, 'iCloud+');
    [2, 9, 16, 23].forEach((d, j) => add(day(d), 'expense', 'alimentacao', 160 + Math.round(rnd(k * 7 + j) * 180), 'Mercado'));
    [4, 8, 13, 19, 25].forEach((d, j) => add(day(d), 'expense', 'alimentacao', 30 + Math.round(rnd(k * 11 + j) * 70), j % 2 ? 'iFood' : 'Restaurante'));
    [7, 21].forEach((d, j) => add(day(d), 'expense', 'transporte', 180 + Math.round(rnd(k * 13 + j) * 90), j ? 'Uber' : 'Combustível'));
    if (rnd(k + 3) > 0.4) add(day(15), 'expense', 'roupas', 120 + Math.round(rnd(k + 4) * 380), 'Loja de roupas');
    add(day(20), 'expense', 'lazer', 80 + Math.round(rnd(k + 5) * 220), 'Cinema e bar');
    if (rnd(k + 6) > 0.5) add(day(11), 'expense', 'saude', 90 + Math.round(rnd(k + 7) * 150), 'Farmácia');
    add(day(14), 'expense', 'educacao', 89.9, 'Curso online');
  }
  return tx.filter((t) => t.date <= todayISO());
}
function loadDemo() {
  data.transactions.push(...demoData());
  persist();
  settingsSheet.close();
  state.month = monthKey(todayISO());
  setView('resumo');
  toast('Dados de exemplo carregados');
}

// ---------- Eventos ----------
function refreshAll() { render(); if (settingsSheet.isOpen) renderSettings(); }

function bind() {
  // Mantém o :active instantâneo no Safari do iPhone
  document.addEventListener('touchstart', () => {}, { passive: true });

  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-theme-toggle]')) { toggleTheme(); return; }
    const t = e.target.closest('[data-pick-icon],[data-view],[data-new],[data-settings],[data-edit],[data-cat],[data-del-cat],[data-del-analysis],[data-prompt],[data-filter-cat],[data-key],#demoInline');
    if (!t) return;
    if (t.dataset.view) setView(t.dataset.view);
    else if ('new' in t.dataset) openEntry();
    else if ('settings' in t.dataset) { renderSettings(); settingsSheet.open(); }
    else if (t.dataset.edit) openEntry(t.dataset.edit);
    else if (t.dataset.cat) {
      state.entryCategory = t.dataset.cat;
      $$('.cat-opt').forEach((o) => { const on = o.dataset.cat === t.dataset.cat; o.classList.toggle('is-active', on); o.setAttribute('aria-checked', on); });
    }
    else if (t.dataset.delCat) deleteCategory(t.dataset.delCat);
    else if (t.dataset.pickIcon) { state.newCatIcon = t.dataset.pickIcon; renderIconPicker(); }
    else if (t.dataset.delAnalysis) { data.analyses = data.analyses.filter((a) => a.id !== t.dataset.delAnalysis); persist(); renderAI(); }
    else if (t.dataset.prompt) askAI(t.dataset.prompt);
    else if ('filterCat' in t.dataset) { state.catFilter = t.dataset.filterCat; renderStatement(); }
    else if (t.dataset.key) pressKey(t.dataset.key);
    else if (t.id === 'demoInline') loadDemo();
  });

  $('#prevMonth').addEventListener('click', () => { state.month = shiftMonth(state.month, -1); render(); });
  $('#nextMonth').addEventListener('click', () => { state.month = shiftMonth(state.month, 1); render(); });

  // Novo aporte
  $('#entryForm').addEventListener('submit', submitEntry);
  $('#deleteBtn').addEventListener('click', () => { const id = state.editingId; entrySheet.close(); removeTx(id); });
  document.addEventListener('keydown', (e) => {
    if (!entrySheet.isOpen || e.target.matches('input, textarea') || e.metaKey || e.ctrlKey) return;
    if (/^[0-9]$/.test(e.key)) { pressKey(e.key); e.preventDefault(); }
    else if (e.key === 'Backspace') { pressKey('del'); e.preventDefault(); }
    else if (e.key === 'Enter') { $('#entryForm').requestSubmit(); e.preventDefault(); }
  });

  // Extrato
  $('#search').addEventListener('input', renderStatement);

  // IA
  $('#aiForm').addEventListener('submit', (e) => { e.preventDefault(); const q = $('#aiQuestion').value.trim(); if (q) askAI(q); });
  $('#aiQuestion').addEventListener('input', autosize);
  $('#openClaude').addEventListener('click', () => {
    analyzeInClaude($('#aiQuestion').value.trim() || 'Analise meus ganhos e gastos deste mês. O que se destacou e onde estou gastando demais?');
  });
  $('#dailyList').addEventListener('toggle', (e) => {
    const d = data.daily.find((x) => x.date === e.target.dataset?.date);
    if (e.target.open && d) drawReportCharts(dailyAdapter(d));
  }, true);
  $('#aiQuestion').addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && matchMedia('(pointer: fine)').matches) { e.preventDefault(); $('#aiForm').requestSubmit(); } });

  // Ajustes
  $('#exportJson').addEventListener('click', exportJSON);
  $('#exportCsv').addEventListener('click', exportCSV);
  $('#importFile').addEventListener('change', (e) => { const f = e.target.files[0]; if (f) importFile(f); e.target.value = ''; });
  const bindSetting = (id, key) => $(id).addEventListener('change', (e) => { settings[key] = e.target.value.trim(); saveSettings(); if (key === 'apiKey') toast(settings.apiKey ? 'Chave salva neste aparelho' : 'Chave removida'); });
  bindSetting('#apiKey', 'apiKey');
  bindSetting('#ghRepo', 'ghRepo');
  bindSetting('#ghPath', 'ghPath');
  bindSetting('#ghToken', 'ghToken');
  $('#ghSync').addEventListener('click', async (e) => {
    e.currentTarget.disabled = true;
    await refreshRemote({ manual: true });
    e.currentTarget.disabled = false;
  });
  $('#catAddForm').addEventListener('submit', addCategory);
  $('#loadDemo').addEventListener('click', () => { if (!data.transactions.length || confirm('Adicionar movimentações de exemplo aos seus dados?')) loadDemo(); });
  $('#wipeData').addEventListener('click', () => {
    if (!confirm('Apagar todas as movimentações, categorias e análises deste aparelho? Exporte antes se quiser guardar.')) return;
    const now = new Date().toISOString();
    const deleted = { ...data.deleted };
    data.transactions.forEach((t) => (deleted[t.id] = now));
    data = freshData(); data.deleted = deleted;
    persist(); settingsSheet.close(); setView('resumo'); toast('Dados apagados');
  });

  // Recalcula posições e cores quando a tela ou o tema mudam
  addEventListener('resize', () => { placeIndicator(false); syncSegments(); });
  darkMQ.addEventListener('change', () => { if (getTheme() === 'auto') { setThemeAttr('auto'); render(); } });
}

// ---------- Início ----------
setThemeAttr(getTheme());
bind();
let initialView = 'resumo';
try { initialView = sessionStorage.getItem('sbank:view') || 'resumo'; } catch {}
const hashView = location.hash.slice(1);
state.view = '';
setView(VIEWS.includes(hashView) ? hashView : VIEWS.includes(initialView) ? initialView : 'resumo');
placeIndicator(false);
if (location.hash === '#novo') openEntry();

navigator.storage?.persist?.().catch(() => {});
// Busca compras, sincroniza e traz análises ao abrir e sempre que o app volta para a tela
refreshRemote();
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') refreshRemote(); });
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
