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
  { id: 'alimentacao', name: 'Alimentação', emoji: '🍽️', type: 'expense', slot: 0 },
  { id: 'moradia', name: 'Moradia', emoji: '🏠', type: 'expense', slot: 1 },
  { id: 'transporte', name: 'Transporte', emoji: '🚗', type: 'expense', slot: 2 },
  { id: 'assinaturas', name: 'Assinaturas', emoji: '📺', type: 'expense', slot: 3 },
  { id: 'roupas', name: 'Roupas', emoji: '👕', type: 'expense', slot: 4 },
  { id: 'saude', name: 'Saúde', emoji: '💊', type: 'expense', slot: 5 },
  { id: 'lazer', name: 'Lazer', emoji: '🎉', type: 'expense', slot: 6 },
  { id: 'educacao', name: 'Educação', emoji: '📚', type: 'expense', slot: 7 },
  { id: 'outros-gasto', name: 'Outros', emoji: '📦', type: 'expense', slot: null },
  { id: 'salario', name: 'Salário', emoji: '💼', type: 'income', slot: 0 },
  { id: 'freelance', name: 'Freelance', emoji: '💻', type: 'income', slot: 1 },
  { id: 'rendimentos', name: 'Rendimentos', emoji: '📈', type: 'income', slot: 2 },
  { id: 'presentes', name: 'Presentes', emoji: '🎁', type: 'income', slot: 3 },
  { id: 'outros-ganho', name: 'Outros', emoji: '➕', type: 'income', slot: null },
];

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
  return { app: 'S Bank', version: 1, updatedAt: new Date().toISOString(), categories: structuredClone(DEFAULT_CATEGORIES), transactions: [], analyses: [] };
}
function loadJSON(key, fallback) {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
}
function saveJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
}
function normalize(d) {
  const base = freshData();
  const out = {
    ...base, ...d,
    categories: Array.isArray(d.categories) && d.categories.length ? d.categories : base.categories,
    transactions: Array.isArray(d.transactions) ? d.transactions : [],
    analyses: Array.isArray(d.analyses) ? d.analyses : [],
  };
  out.transactions = out.transactions
    .filter((t) => t && t.id && (t.type === 'income' || t.type === 'expense') && Number.isFinite(+t.amount) && /^\d{4}-\d{2}-\d{2}$/.test(t.date))
    .map((t) => ({ ...t, amount: Math.round(+t.amount * 100) / 100 }));
  return out;
}
let data = normalize(loadJSON(STORAGE_KEY, null) || freshData());
const settings = loadJSON(SETTINGS_KEY, {});
function persist() {
  data.updatedAt = new Date().toISOString();
  if (!saveJSON(STORAGE_KEY, data)) toast('Não foi possível salvar neste aparelho. Exporte seus dados.');
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
};

const catById = (id) => data.categories.find((c) => c.id === id) || { id, name: 'Sem categoria', emoji: '❔', type: 'expense', slot: null };
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
      <span class="tx__icon" style="background:${catTint(c)}">${c.emoji}</span>
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
        <span class="cat-bar__icon" style="background:${catTint(cat)}">${cat.emoji}</span>
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
      <span class="cat-opt__icon" style="background:${catTint(c, '2e')}">${c.emoji}</span>
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
    run: () => { data.transactions.splice(Math.min(idx, data.transactions.length), 0, removed); persist(); render(); },
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
    cats.map((c) => `<button class="chip pressable ${c.id === state.catFilter ? 'is-active' : ''}" data-filter-cat="${c.id}">${c.emoji} ${esc(c.name)}</button>`).join('');

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
  const slices = colored.map((g) => ({ label: `${g.cat.emoji} ${g.cat.name}`, total: g.total, color: catColor(g.cat) }));
  if (otherTotal > 0) slices.push({ label: type === 'expense' ? '📦 Outros' : '➕ Outros', total: otherTotal, color: OTHER_COLOR[th.mode] });
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
        backgroundColor: (ctx) => {
          const { ctx: c, chartArea } = ctx.chart;
          if (!chartArea) return th.expense + '22';
          const grad = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          grad.addColorStop(0, th.expense + '38'); grad.addColorStop(1, th.expense + '00');
          return grad;
        },
      }],
    },
    options: lineOpts,
  });
}

// ---------- Análise com IA ----------
function renderAI() {
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
  if (!settings.apiKey) { renderAI(); toast('Adicione sua chave da API em Ajustes.'); return; }
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

function reportHTML(a) {
  const r = a.report;
  const when = new Date(a.createdAt).toLocaleString('pt-BR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  return `<article class="report">
    <p class="report__q">${esc(a.question)}</p>
    <h3>${esc(r.titulo)}</h3>
    <p class="report__summary">${esc(r.resumo)}</p>
    ${r.insights?.length ? `<ul class="insights">${r.insights.map((i) => `<li class="${esc(i.tipo)}"><span>${esc(i.texto)}</span></li>`).join('')}</ul>` : ''}
    ${(r.graficos || []).map((g, i) => `<div class="report__chart"><h4>${esc(g.titulo)}</h4><p>${esc(g.descricao)}</p>
      <div class="${g.tipo === 'rosca' ? 'donut' : 'chart'}"><canvas id="ai-${a.id}-${i}" role="img" aria-label="${esc(g.titulo)}"></canvas></div>
      ${g.tipo === 'rosca' ? `<ul class="legend" id="ai-${a.id}-${i}-legend"></ul>` : ''}</div>`).join('')}
    ${r.dicas?.length ? `<h4 class="report__tips-title">O que fazer agora</h4><ol class="tips">${r.dicas.map((d) => `<li>${esc(d)}</li>`).join('')}</ol>` : ''}
    <div class="report__foot"><span>${when}</span><button class="link pressable" data-del-analysis="${a.id}">Remover</button></div>
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
const exportPayload = () => ({ ...data, exportedAt: new Date().toISOString() });
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
  const stamp = (x) => x.updatedAt || x.createdAt || '';
  inc.transactions.forEach((t) => { const cur = tx.get(t.id); if (!cur || stamp(t) > stamp(cur)) tx.set(t.id, t); });
  const an = new Map(data.analyses.map((a) => [a.id, a]));
  inc.analyses.forEach((a) => an.set(a.id, a));
  data.categories = [...cats.values()];
  data.transactions = [...tx.values()];
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
async function ghPush() {
  const cfg = ghConfig(); if (!cfg) return;
  const btn = $('#ghPush'); btn.disabled = true;
  try {
    const current = await gh(`${cfg.url}?t=${Date.now()}`);
    await gh(cfg.url, {
      method: 'PUT',
      body: JSON.stringify({
        message: `Atualiza dados do S Bank (${new Date().toLocaleString('pt-BR')})`,
        content: b64encode(JSON.stringify(exportPayload(), null, 2)),
        ...(current?.sha ? { sha: current.sha } : {}),
      }),
    });
    settings.lastSync = new Date().toISOString(); saveSettings();
    haptic();
    toast('Dados enviados para o GitHub');
    renderSettings();
  } catch (e) { toast(`GitHub: ${e.message}`); } finally { btn.disabled = false; }
}
async function ghPull() {
  const cfg = ghConfig(); if (!cfg) return;
  const btn = $('#ghPull'); btn.disabled = true;
  try {
    const file = await gh(`${cfg.url}?t=${Date.now()}`);
    if (!file) { toast(`O arquivo ${cfg.path} ainda não existe no repositório.`); return; }
    let text = file.content ? b64decode(file.content) : '';
    if (!text && file.download_url) text = await (await fetch(file.download_url, { headers: { Authorization: `Bearer ${settings.ghToken}` } })).text();
    mergeData(JSON.parse(text), 'merge');
    persist();
    toast('Dados do GitHub sincronizados');
    refreshAll();
  } catch (e) { toast(`GitHub: ${e.message}`); } finally { btn.disabled = false; }
}

// ---------- Ajustes ----------
const catTypeSeg = segmented($('#catType'), (v) => { state.newCatType = v; });
catTypeSeg.set('expense', false);
function renderSettings() {
  const n = data.transactions.length;
  const last = settings.lastSync ? ` Último envio ao GitHub: ${new Date(settings.lastSync).toLocaleString('pt-BR')}.` : '';
  $('#dataInfo').textContent = `${n} movimentaç${n === 1 ? 'ão salva' : 'ões salvas'} neste aparelho. Exporte o arquivo e envie para o seu repositório de dados.${last}`;
  $('#apiKey').value = settings.apiKey || '';
  $('#ghRepo').value = settings.ghRepo || '';
  $('#ghPath').value = settings.ghPath || '';
  $('#ghToken').value = settings.ghToken || '';
  $('#catManage').innerHTML = data.categories.map((c) => `
    <div class="cat-row">
      <span class="cat-row__icon" style="background:${catTint(c, '2e')}">${c.emoji}</span>
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
  data.categories.push({ id: `c-${uid().slice(0, 8)}`, name, emoji: $('#catEmoji').value.trim() || '🏷️', type, slot: free ?? null });
  persist();
  $('#catName').value = ''; $('#catEmoji').value = '';
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
    const t = e.target.closest('[data-view],[data-new],[data-settings],[data-edit],[data-cat],[data-del-cat],[data-del-analysis],[data-prompt],[data-filter-cat],[data-key],#demoInline');
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
  $('#ghPush').addEventListener('click', ghPush);
  $('#ghPull').addEventListener('click', ghPull);
  $('#catAddForm').addEventListener('submit', addCategory);
  $('#loadDemo').addEventListener('click', () => { if (!data.transactions.length || confirm('Adicionar movimentações de exemplo aos seus dados?')) loadDemo(); });
  $('#wipeData').addEventListener('click', () => {
    if (!confirm('Apagar todas as movimentações, categorias e análises deste aparelho? Exporte antes se quiser guardar.')) return;
    data = freshData(); persist(); settingsSheet.close(); setView('resumo'); toast('Dados apagados');
  });

  // Recalcula posições e cores quando a tela ou o tema mudam
  addEventListener('resize', () => { placeIndicator(false); syncSegments(); });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => render());
}

// ---------- Início ----------
bind();
let initialView = 'resumo';
try { initialView = sessionStorage.getItem('sbank:view') || 'resumo'; } catch {}
const hashView = location.hash.slice(1);
state.view = '';
setView(VIEWS.includes(hashView) ? hashView : VIEWS.includes(initialView) ? initialView : 'resumo');
placeIndicator(false);
if (location.hash === '#novo') openEntry();

navigator.storage?.persist?.().catch(() => {});
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
