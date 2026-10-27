// S Bank — app de finanças pessoais (100% no navegador)
const STORAGE_KEY = 'sbank:data:v1';
const SETTINGS_KEY = 'sbank:settings:v1';
const AI_MODEL = 'claude-opus-5-5';

// Paleta categórica validada (ordem fixa; a cor segue a categoria, nunca o ranking)
const PALETTE = {
  light: ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6', '#e34948'],
  dark: ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300', '#9085e9', '#e66767'],
};
const OTHER_COLOR = { light: '#9AA1B2', dark: '#5E6680' };
const SERIES = { income: 2, expense: 1 }; // aqua = ganhos, laranja = gastos

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

function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toast.t);
  toast.t = setTimeout(() => el.classList.remove('show'), 2600);
}

// ---------- Estado ----------
function freshData() {
  return { app: 'S Bank', version: 1, updatedAt: new Date().toISOString(), categories: structuredClone(DEFAULT_CATEGORIES), transactions: [], analyses: [] };
}
function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}
function saveJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
}

let data = normalize(loadJSON(STORAGE_KEY, null) || freshData());
const settings = loadJSON(SETTINGS_KEY, {});

function normalize(d) {
  const base = freshData();
  const out = {
    ...base,
    ...d,
    categories: Array.isArray(d.categories) && d.categories.length ? d.categories : base.categories,
    transactions: Array.isArray(d.transactions) ? d.transactions : [],
    analyses: Array.isArray(d.analyses) ? d.analyses : [],
  };
  out.transactions = out.transactions
    .filter((t) => t && t.id && (t.type === 'income' || t.type === 'expense') && Number.isFinite(+t.amount) && /^\d{4}-\d{2}-\d{2}$/.test(t.date))
    .map((t) => ({ ...t, amount: Math.round(+t.amount * 100) / 100 }));
  return out;
}
function persist() {
  data.updatedAt = new Date().toISOString();
  if (!saveJSON(STORAGE_KEY, data)) toast('Não foi possível salvar neste aparelho. Exporte seus dados.');
}
function saveSettings() { saveJSON(SETTINGS_KEY, settings); }

const state = {
  view: 'inicio',
  month: monthKey(todayISO()),
  entryType: 'expense',
  entryCategory: null,
  editingId: null,
  typeFilter: 'all',
  donutType: 'expense',
};

const catById = (id) => data.categories.find((c) => c.id === id) || { id, name: 'Sem categoria', emoji: '❔', type: 'expense', slot: null };
const catsOf = (type) => data.categories.filter((c) => c.type === type);
const catColor = (cat) => {
  const mode = isDark() ? 'dark' : 'light';
  return cat.slot == null || cat.slot > 7 ? OTHER_COLOR[mode] : PALETTE[mode][cat.slot];
};
const txOfMonth = (key) => data.transactions.filter((t) => monthKey(t.date) === key);
const sum = (list, type) => list.reduce((s, t) => s + (t.type === type ? t.amount : 0), 0);
const sortTx = (list) => [...list].sort((a, b) => b.date.localeCompare(a.date) || (b.createdAt || '').localeCompare(a.createdAt || ''));

// ---------- Navegação ----------
function setView(view) {
  state.view = view;
  $$('.view').forEach((v) => v.classList.toggle('is-active', v.id === `view-${view}`));
  $$('.tab').forEach((t) => t.classList.toggle('is-active', t.dataset.view === view));
  $('#viewTitle').textContent = $(`#view-${view}`).dataset.title;
  $('#monthNav').style.visibility = view === 'aportes' || view === 'ia' ? 'hidden' : 'visible';
  try { sessionStorage.setItem('sbank:view', view); } catch {}
  render();
  window.scrollTo({ top: 0 });
}

function render() {
  $('#monthLabel').textContent = monthName(state.month, { month: 'short', year: 'numeric' }).replace('.', '');
  if (state.view === 'inicio') renderHome();
  if (state.view === 'aportes') renderEntry();
  if (state.view === 'extrato') renderStatement();
  if (state.view === 'graficos') renderCharts();
  if (state.view === 'ia') renderAI();
}

// ---------- Componentes ----------
function txItem(t) {
  const c = catById(t.category);
  const sign = t.type === 'income' ? '+' : '−';
  const [y, m, d] = t.date.split('-');
  return `<li><button class="tx" data-edit="${t.id}">
    <span class="tx__icon">${c.emoji}</span>
    <span class="tx__body">
      <span class="tx__title">${esc(t.description || c.name)}</span>
      <span class="tx__meta">${esc(c.name)} · ${d}/${m}/${y.slice(2)}</span>
    </span>
    <span class="tx__amount ${t.type === 'income' ? 'pos' : 'neg'}">${sign} ${brl(t.amount)}</span>
  </button></li>`;
}
const emptyState = (msg, withActions = true) => `<li class="empty">${msg}${withActions ? `<br>
  <button class="btn btn--primary" data-goto="aportes">Adicionar movimentação</button>` : ''}</li>`;

// ---------- Início ----------
function renderHome() {
  const all = data.transactions;
  const month = txOfMonth(state.month);
  const inc = sum(month, 'income');
  const exp = sum(month, 'expense');
  const net = inc - exp;
  $('#totalBalance').textContent = brl(sum(all, 'income') - sum(all, 'expense'));
  $('#monthIncome').textContent = brl(inc);
  $('#monthExpense').textContent = brl(exp);
  $('#monthNet').textContent = brl(net);
  $('#monthNet').className = net >= 0 ? 'pos' : 'neg';
  $('#savingsRate').textContent = inc > 0 ? `${Math.round((net / inc) * 100)}%` : '—';

  const byCat = groupByCategory(month, 'expense');
  const max = byCat[0]?.total || 1;
  $('#topCategories').innerHTML = byCat.length
    ? byCat.slice(0, 5).map(({ cat, total }) => `
      <div class="bar-row">
        <span class="bar-row__name">${cat.emoji} ${esc(cat.name)}</span>
        <span class="bar-row__value">${brl(total)}</span>
        <span class="bar-row__track"><span class="bar-row__fill" style="width:${(total / max) * 100}%;background:${catColor(cat)}"></span></span>
      </div>`).join('')
    : '<p class="empty">Nenhum gasto neste mês.</p>';

  const recent = sortTx(all).slice(0, 6);
  $('#recentList').innerHTML = recent.length
    ? recent.map(txItem).join('')
    : `<li class="empty">Você ainda não tem movimentações.<br>
        <button class="btn btn--primary" data-goto="aportes">Adicionar a primeira</button>
        <button class="btn btn--ghost" id="demoInline" style="margin-left:6px">Ver exemplo</button></li>`;
}

function groupByCategory(list, type) {
  const map = new Map();
  list.filter((t) => t.type === type).forEach((t) => map.set(t.category, (map.get(t.category) || 0) + t.amount));
  return [...map.entries()].map(([id, total]) => ({ cat: catById(id), total })).sort((a, b) => b.total - a.total);
}

// ---------- Aportes ----------
let amountCents = 0;
function setAmount(cents) {
  amountCents = Math.max(0, Math.min(cents, 99999999999));
  $('#amount').value = brl(amountCents / 100);
}
function renderEntry() {
  $('#entryForm').dataset.type = state.entryType;
  $$('#entryForm .segmented__btn').forEach((b) => {
    const on = b.dataset.type === state.entryType;
    b.classList.toggle('is-active', on);
    b.setAttribute('aria-checked', on);
  });
  const cats = catsOf(state.entryType);
  if (!cats.some((c) => c.id === state.entryCategory)) state.entryCategory = cats[0]?.id || null;
  $('#categoryChips').innerHTML = cats.map((c) => `
    <button type="button" class="chip ${c.id === state.entryCategory ? 'is-active' : ''}" data-cat="${c.id}">
      <span class="chip__emoji">${c.emoji}</span>${esc(c.name)}
    </button>`).join('');
  const editing = !!state.editingId;
  $('#saveBtn').textContent = editing ? 'Salvar alterações' : (state.entryType === 'income' ? 'Adicionar ganho' : 'Adicionar gasto');
  $('#cancelEdit').hidden = !editing;
  $('#deleteBtn').hidden = !editing;
  $('#view-aportes').dataset.title = editing ? 'Editar' : 'Aportes';
  $('#viewTitle').textContent = $('#view-aportes').dataset.title;

  const added = [...data.transactions].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')).slice(0, 8);
  $('#addedList').innerHTML = added.length ? added.map(txItem).join('') : emptyState('Nada adicionado ainda.', false);
}
function resetEntry() {
  state.editingId = null;
  setAmount(0);
  $('#desc').value = '';
  $('#date').value = todayISO();
}
function startEdit(id) {
  const t = data.transactions.find((x) => x.id === id);
  if (!t) return;
  state.editingId = id;
  state.entryType = t.type;
  state.entryCategory = t.category;
  setAmount(Math.round(t.amount * 100));
  $('#desc').value = t.description || '';
  $('#date').value = t.date;
  setView('aportes');
}
function submitEntry(e) {
  e.preventDefault();
  if (amountCents <= 0) { toast('Informe um valor maior que zero.'); $('#amount').focus(); return; }
  const date = $('#date').value || todayISO();
  const payload = {
    type: state.entryType,
    amount: amountCents / 100,
    category: state.entryCategory,
    description: $('#desc').value.trim(),
    date,
  };
  if (state.editingId) {
    const t = data.transactions.find((x) => x.id === state.editingId);
    Object.assign(t, payload, { updatedAt: new Date().toISOString() });
    toast('Movimentação atualizada');
  } else {
    data.transactions.push({ id: uid(), ...payload, createdAt: new Date().toISOString() });
    toast(state.entryType === 'income' ? `Ganho de ${brl(payload.amount)} adicionado` : `Gasto de ${brl(payload.amount)} adicionado`);
  }
  persist();
  state.month = monthKey(date);
  const wasEditing = !!state.editingId;
  resetEntry();
  if (wasEditing) setView('extrato'); else renderEntry();
}

// ---------- Extrato ----------
function renderStatement() {
  const q = $('#search').value.trim().toLowerCase();
  const cat = $('#catFilter').value;
  const opts = data.categories.map((c) => `<option value="${c.id}" ${c.id === cat ? 'selected' : ''}>${c.emoji} ${esc(c.name)} (${c.type === 'income' ? 'ganho' : 'gasto'})</option>`).join('');
  $('#catFilter').innerHTML = `<option value="">Todas as categorias</option>${opts}`;

  let list = txOfMonth(state.month);
  if (state.typeFilter !== 'all') list = list.filter((t) => t.type === state.typeFilter);
  if (cat) list = list.filter((t) => t.category === cat);
  if (q) list = list.filter((t) => `${t.description} ${catById(t.category).name}`.toLowerCase().includes(q));

  const inc = sum(list, 'income');
  const exp = sum(list, 'expense');
  $('#statementSummary').innerHTML = `
    <div><span>Entradas</span><b class="pos">${brl(inc)}</b></div>
    <div><span>Saídas</span><b class="neg">${brl(exp)}</b></div>
    <div><span>Resultado</span><b class="${inc - exp >= 0 ? 'pos' : 'neg'}">${brl(inc - exp)}</b></div>`;

  if (!list.length) {
    $('#statement').innerHTML = `<ul class="tx-list">${emptyState(q || cat || state.typeFilter !== 'all' ? 'Nada encontrado com esses filtros.' : `Sem movimentações em ${monthName(state.month)}.`, !(q || cat))}</ul>`;
    return;
  }
  const days = new Map();
  sortTx(list).forEach((t) => { if (!days.has(t.date)) days.set(t.date, []); days.get(t.date).push(t); });
  $('#statement').innerHTML = [...days.entries()].map(([date, items]) => {
    const [y, m, d] = date.split('-').map(Number);
    const label = new Date(y, m - 1, d).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
    const net = sum(items, 'income') - sum(items, 'expense');
    return `<div class="day"><div class="day__head"><span>${label}</span><span>${net >= 0 ? '+' : '−'} ${brl(Math.abs(net))}</span></div>
      <ul class="tx-list">${items.map(txItem).join('')}</ul></div>`;
  }).join('');
}

// ---------- Gráficos ----------
const charts = {};
function chartTheme() {
  const mode = isDark() ? 'dark' : 'light';
  return {
    mode,
    text: css('--text-2'),
    grid: css('--line'),
    surface: css('--surface'),
    income: PALETTE[mode][SERIES.income],
    expense: PALETTE[mode][SERIES.expense],
  };
}
function baseOptions(th) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 400 },
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: isDark() ? '#F1F3F9' : '#0B0F1A',
        titleColor: isDark() ? '#0B0F1A' : '#FFFFFF',
        bodyColor: isDark() ? '#0B0F1A' : '#FFFFFF',
        padding: 10, cornerRadius: 10, boxPadding: 4, usePointStyle: true,
        callbacks: { label: (ctx) => ` ${ctx.dataset.label ? ctx.dataset.label + ': ' : ''}${brl(ctx.parsed.y ?? ctx.parsed)}` },
      },
    },
    scales: {
      x: { grid: { display: false }, border: { display: false }, ticks: { color: th.text, font: { size: 11 } } },
      y: {
        grid: { color: th.grid }, border: { display: false },
        ticks: { color: th.text, font: { size: 11 }, maxTicksLimit: 5, callback: (v) => compactBRL(v) },
      },
    },
  };
}
const compactBRL = (v) => (Math.abs(v) >= 1000 ? `R$ ${(v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil` : `R$ ${Math.round(v)}`);
function drawChart(key, canvas, config) {
  if (charts[key]) charts[key].destroy();
  charts[key] = new window.Chart(canvas, config);
}

function renderCharts() {
  if (!window.Chart) { setTimeout(renderCharts, 100); return; }
  window.Chart.defaults.font.family = 'Inter, -apple-system, system-ui, sans-serif';
  const th = chartTheme();
  const month = txOfMonth(state.month);

  // Rosca por categoria (cores fixas por categoria; categorias sem cor entram em "Outros")
  const type = state.donutType;
  $$('#donutType .segmented__btn').forEach((b) => b.classList.toggle('is-active', b.dataset.type === type));
  $('#donutTitle').textContent = type === 'expense' ? 'Gastos por categoria' : 'Ganhos por categoria';
  const groups = groupByCategory(month, type);
  const colored = groups.filter((g) => g.cat.slot != null && g.cat.slot <= 7);
  const otherTotal = groups.filter((g) => !(g.cat.slot != null && g.cat.slot <= 7)).reduce((s, g) => s + g.total, 0);
  const slices = colored.map((g) => ({ label: `${g.cat.emoji} ${g.cat.name}`, total: g.total, color: catColor(g.cat) }));
  if (otherTotal > 0) slices.push({ label: type === 'expense' ? '📦 Outros' : '➕ Outros', total: otherTotal, color: OTHER_COLOR[th.mode] });
  const total = slices.reduce((s, x) => s + x.total, 0);
  $('#donutTotal').textContent = brl(total, false);
  $('#donutLegend').innerHTML = slices.length
    ? slices.map((s) => `<li><i style="background:${s.color}"></i><span>${esc(s.label)}</span><b>${brl(s.total)}</b><small>${Math.round((s.total / total) * 100)}%</small></li>`).join('')
    : `<li class="empty" style="display:block;border:0">Sem ${type === 'expense' ? 'gastos' : 'ganhos'} neste mês.</li>`;
  drawChart('donut', $('#donutChart'), {
    type: 'doughnut',
    data: {
      labels: slices.length ? slices.map((s) => s.label) : ['Sem dados'],
      datasets: [{
        data: slices.length ? slices.map((s) => s.total) : [1],
        backgroundColor: slices.length ? slices.map((s) => s.color) : [css('--surface-2')],
        borderColor: th.surface, borderWidth: 2, hoverOffset: 6, borderRadius: 4,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '72%',
      plugins: {
        legend: { display: false },
        tooltip: { enabled: slices.length > 0, ...baseOptions(th).plugins.tooltip, callbacks: { label: (c) => ` ${brl(c.parsed)} (${Math.round((c.parsed / total) * 100)}%)` } },
      },
    },
  });

  // Barras: ganhos x gastos dos últimos 6 meses
  const months = Array.from({ length: 6 }, (_, i) => shiftMonth(state.month, i - 5));
  const opts = baseOptions(th);
  opts.plugins.legend = { display: true, position: 'top', align: 'end', labels: { color: th.text, usePointStyle: true, pointStyle: 'rectRounded', boxWidth: 10, boxHeight: 10 } };
  drawChart('bar', $('#barChart'), {
    type: 'bar',
    data: {
      labels: months.map((m) => monthName(m, { month: 'short' }).replace('.', '')),
      datasets: [
        { label: 'Ganhos', data: months.map((m) => sum(txOfMonth(m), 'income')), backgroundColor: th.income, borderRadius: 4, borderSkipped: 'start', maxBarThickness: 22, categoryPercentage: 0.7, barPercentage: 0.9 },
        { label: 'Gastos', data: months.map((m) => sum(txOfMonth(m), 'expense')), backgroundColor: th.expense, borderRadius: 4, borderSkipped: 'start', maxBarThickness: 22, categoryPercentage: 0.7, barPercentage: 0.9 },
      ],
    },
    options: opts,
  });

  // Linha: gasto acumulado no mês
  const [y, m] = state.month.split('-').map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const isCurrent = state.month === monthKey(todayISO());
  const lastDay = isCurrent ? new Date().getDate() : daysInMonth;
  const perDay = Array(daysInMonth).fill(0);
  month.filter((t) => t.type === 'expense').forEach((t) => { perDay[+t.date.slice(8) - 1] += t.amount; });
  let acc = 0;
  const cumulative = perDay.map((v, i) => (i < lastDay ? (acc += v) : null));
  const lineOpts = baseOptions(th);
  lineOpts.plugins.tooltip.callbacks.title = (items) => `Dia ${items[0].label}`;
  lineOpts.scales.x.ticks.maxTicksLimit = 8;
  drawChart('line', $('#lineChart'), {
    type: 'line',
    data: {
      labels: perDay.map((_, i) => String(i + 1)),
      datasets: [{
        label: 'Gasto acumulado', data: cumulative, borderColor: th.expense, borderWidth: 2,
        backgroundColor: th.expense + '22', fill: true, tension: 0.3, pointRadius: 0, pointHoverRadius: 5,
        pointHoverBackgroundColor: th.expense, pointHoverBorderColor: th.surface, pointHoverBorderWidth: 2,
      }],
    },
    options: lineOpts,
  });
}

// ---------- IA ----------
function renderAI() {
  $('#aiNoKey').hidden = !!settings.apiKey;
  const box = $('#aiResults');
  if (box.dataset.busy) return;
  box.innerHTML = data.analyses.slice(0, 10).map((a) => reportHTML(a)).join('') ||
    '<p class="empty">Escolha uma sugestão acima ou faça uma pergunta.</p>';
  data.analyses.slice(0, 10).forEach((a) => drawReportCharts(a));
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
  if (!settings.apiKey) { renderAI(); $('#aiNoKey').scrollIntoView({ behavior: 'smooth' }); toast('Adicione sua chave da API em Ajustes.'); return; }
  if (!data.transactions.length) { toast('Adicione algumas movimentações antes de pedir uma análise.'); return; }
  const box = $('#aiResults');
  box.dataset.busy = '1';
  $('#aiSend').disabled = true;
  $$('.prompt-chip').forEach((b) => (b.disabled = true));
  box.insertAdjacentHTML('afterbegin', `<div class="card ai-loading" id="aiLoading"><div class="spinner"></div><div><b>Analisando suas finanças…</b><div class="muted small">${esc(question)}</div></div></div>`);
  $('#aiLoading').scrollIntoView({ behavior: 'smooth', block: 'center' });

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

    const analysis = { id: uid(), question, createdAt: new Date().toISOString(), month: state.month, report };
    data.analyses.unshift(analysis);
    data.analyses = data.analyses.slice(0, 20);
    persist();
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
    box.insertAdjacentHTML('afterbegin', `<div class="card ai-error"><b>Não foi possível analisar.</b><p class="muted small">${esc(msg)}</p></div>`);
    return;
  } finally {
    $('#aiSend').disabled = false;
    $$('.prompt-chip').forEach((b) => (b.disabled = false));
  }
  delete box.dataset.busy;
  $('#aiQuestion').value = '';
  renderAI();
}

function reportHTML(a) {
  const r = a.report;
  const when = new Date(a.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  return `<article class="card ai-report">
    <p class="ai-report__q">“${esc(a.question)}”</p>
    <h3>${esc(r.titulo)}</h3>
    <p class="ai-report__summary">${esc(r.resumo)}</p>
    ${r.insights?.length ? `<ul class="insights">${r.insights.map((i) => `<li class="${esc(i.tipo)}"><span>${esc(i.texto)}</span></li>`).join('')}</ul>` : ''}
    ${(r.graficos || []).map((g, i) => `<div class="ai-chart"><h4>${esc(g.titulo)}</h4><p>${esc(g.descricao)}</p>
      <div class="chart-box ${g.tipo === 'rosca' ? 'chart-box--donut' : ''}"><canvas id="ai-${a.id}-${i}" role="img" aria-label="${esc(g.titulo)}"></canvas></div>
      ${g.tipo === 'rosca' ? `<ul class="legend" id="ai-${a.id}-${i}-legend"></ul>` : ''}</div>`).join('')}
    ${r.dicas?.length ? `<h4 style="margin-top:16px;font-family:Sora">O que fazer agora</h4><ol class="tips">${r.dicas.map((d) => `<li>${esc(d)}</li>`).join('')}</ol>` : ''}
    <div class="ai-report__foot"><span>${when}</span><button class="link" data-del-analysis="${a.id}">Remover</button></div>
  </article>`;
}

function drawReportCharts(a) {
  if (!window.Chart) { setTimeout(() => drawReportCharts(a), 100); return; }
  const th = chartTheme();
  const pal = PALETTE[th.mode];
  (a.report.graficos || []).forEach((g, i) => {
    const canvas = document.getElementById(`ai-${a.id}-${i}`);
    if (!canvas || !g.series?.length) return;
    const key = `ai-${a.id}-${i}`;
    if (g.tipo === 'rosca') {
      // Cor segue a categoria quando o rótulo é uma categoria conhecida
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
        data: { labels: g.rotulos, datasets: [{ data: values, backgroundColor: colors, borderColor: th.surface, borderWidth: 2, borderRadius: 4 }] },
        options: { responsive: true, maintainAspectRatio: false, cutout: '68%', plugins: { legend: { display: false }, tooltip: { ...baseOptions(th).plugins.tooltip, callbacks: { label: (c) => ` ${brl(c.parsed)}` } } } },
      });
      return;
    }
    const opts = baseOptions(th);
    const series = g.series.slice(0, 8);
    if (series.length > 1) opts.plugins.legend = { display: true, position: 'top', align: 'end', labels: { color: th.text, usePointStyle: true, pointStyle: 'rectRounded', boxWidth: 10, boxHeight: 10 } };
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
            ? { label: s.nome, data: s.valores, borderColor: color, backgroundColor: color, borderWidth: 2, tension: 0.3, pointRadius: 3, pointHoverRadius: 6 }
            : { label: s.nome, data: s.valores, backgroundColor: color, borderRadius: 4, borderSkipped: 'start', maxBarThickness: 26, categoryPercentage: 0.7, barPercentage: 0.9 };
        }),
      },
      options: opts,
    });
  });
}

// ---------- Exportar / importar ----------
function exportPayload() {
  return { ...data, exportedAt: new Date().toISOString() };
}
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
function exportJSON() {
  saveFile(`sbank-dados-${todayISO()}.json`, JSON.stringify(exportPayload(), null, 2), 'application/json');
}
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
  inc.transactions.forEach((t) => {
    const cur = tx.get(t.id);
    const stamp = (x) => x.updatedAt || x.createdAt || '';
    if (!cur || stamp(t) > stamp(cur)) tx.set(t.id, t);
  });
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
    toast('Dados enviados para o GitHub ✓');
    renderSettings();
  } catch (e) { toast(`GitHub: ${e.message}`); } finally { btn.disabled = false; }
}
async function ghPull() {
  const cfg = ghConfig(); if (!cfg) return;
  const btn = $('#ghPull'); btn.disabled = true;
  try {
    const file = await gh(`${cfg.url}?t=${Date.now()}`);
    if (!file) { toast(`Arquivo ${cfg.path} ainda não existe no repositório.`); return; }
    let text = file.content ? b64decode(file.content) : '';
    if (!text && file.download_url) text = await (await fetch(file.download_url, { headers: { Authorization: `Bearer ${settings.ghToken}` } })).text();
    mergeData(JSON.parse(text), 'merge');
    persist();
    toast('Dados do GitHub sincronizados ✓');
    refreshAll();
  } catch (e) { toast(`GitHub: ${e.message}`); } finally { btn.disabled = false; }
}

// ---------- Ajustes ----------
function renderSettings() {
  const n = data.transactions.length;
  const last = settings.lastSync ? ` · último envio ao GitHub: ${new Date(settings.lastSync).toLocaleString('pt-BR')}` : '';
  $('#dataInfo').textContent = `${n} movimentaç${n === 1 ? 'ão' : 'ões'} salvas neste aparelho${last}.`;
  $('#apiKey').value = settings.apiKey || '';
  $('#ghRepo').value = settings.ghRepo || '';
  $('#ghPath').value = settings.ghPath || '';
  $('#ghToken').value = settings.ghToken || '';
  $('#catManage').innerHTML = data.categories.map((c) => `
    <span class="cat-pill"><i style="background:${catColor(c)}"></i>${c.emoji} ${esc(c.name)}
      ${DEFAULT_CATEGORIES.some((d) => d.id === c.id) ? '' : `<button data-del-cat="${c.id}" aria-label="Remover ${esc(c.name)}"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>`}
    </span>`).join('');
}
function openSheet() {
  renderSettings();
  $('#sheet-ajustes').hidden = false;
  document.body.style.overflow = 'hidden';
}
function closeSheet() {
  $('#sheet-ajustes').hidden = true;
  document.body.style.overflow = '';
}
function addCategory(e) {
  e.preventDefault();
  const name = $('#catName').value.trim();
  const type = $('#catType').value;
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
  const rnd = (seed) => { let x = Math.sin(seed) * 10000; return x - Math.floor(x); };
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
    add(day(12), 'expense', 'assinaturas', 14.9, 'iCloud');
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

// ---------- Eventos ----------
function refreshAll() { render(); if (!$('#sheet-ajustes').hidden) renderSettings(); }

function bind() {
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-view],[data-goto],[data-edit],[data-open],[data-close],[data-cat],[data-del-cat],[data-del-analysis],[data-prompt],#demoInline');
    if (!t) return;
    if (t.dataset.view) {
      if (t.dataset.view === 'aportes' && state.view !== 'aportes') resetEntry();
      setView(t.dataset.view);
    } else if (t.dataset.goto) {
      if (t.dataset.goto === 'aportes') resetEntry();
      setView(t.dataset.goto);
    } else if (t.dataset.edit) startEdit(t.dataset.edit);
    else if (t.dataset.open) openSheet();
    else if ('close' in t.dataset) closeSheet();
    else if (t.dataset.cat) { state.entryCategory = t.dataset.cat; renderEntry(); }
    else if (t.dataset.delCat) deleteCategory(t.dataset.delCat);
    else if (t.dataset.delAnalysis) { data.analyses = data.analyses.filter((a) => a.id !== t.dataset.delAnalysis); persist(); renderAI(); }
    else if (t.dataset.prompt) askAI(t.dataset.prompt);
    else if (t.id === 'demoInline') loadDemo();
  });

  $('#prevMonth').addEventListener('click', () => { state.month = shiftMonth(state.month, -1); render(); });
  $('#nextMonth').addEventListener('click', () => { state.month = shiftMonth(state.month, 1); render(); });

  // Aportes
  $$('#entryForm .segmented__btn').forEach((b) => b.addEventListener('click', () => { state.entryType = b.dataset.type; renderEntry(); }));
  const amount = $('#amount');
  amount.addEventListener('input', () => setAmount(parseInt(amount.value.replace(/\D/g, '') || '0', 10)));
  amount.addEventListener('focus', () => setTimeout(() => amount.setSelectionRange(amount.value.length, amount.value.length), 0));
  $('#entryForm').addEventListener('submit', submitEntry);
  $('#cancelEdit').addEventListener('click', () => { resetEntry(); renderEntry(); });
  $('#deleteBtn').addEventListener('click', () => {
    if (!confirm('Excluir esta movimentação?')) return;
    data.transactions = data.transactions.filter((t) => t.id !== state.editingId);
    persist(); resetEntry(); toast('Movimentação excluída'); setView('extrato');
  });

  // Extrato
  $('#search').addEventListener('input', renderStatement);
  $('#catFilter').addEventListener('change', renderStatement);
  $$('#typeFilter .segmented__btn').forEach((b) => b.addEventListener('click', () => {
    state.typeFilter = b.dataset.filter;
    $$('#typeFilter .segmented__btn').forEach((x) => x.classList.toggle('is-active', x === b));
    renderStatement();
  }));

  // Gráficos
  $$('#donutType .segmented__btn').forEach((b) => b.addEventListener('click', () => { state.donutType = b.dataset.type; renderCharts(); }));

  // IA
  $('#aiForm').addEventListener('submit', (e) => { e.preventDefault(); const q = $('#aiQuestion').value.trim(); if (q) askAI(q); });
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
    if (!confirm('Apagar TODAS as movimentações, categorias e análises deste aparelho? Exporte antes se quiser guardar.')) return;
    data = freshData(); persist(); closeSheet(); setView('inicio'); toast('Dados apagados');
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#sheet-ajustes').hidden) closeSheet(); });

  // Recria os gráficos quando o tema do sistema muda
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => render());
}

function loadDemo() {
  data.transactions.push(...demoData());
  persist();
  closeSheet();
  state.month = monthKey(todayISO());
  setView('inicio');
  toast('Dados de exemplo carregados');
}

// ---------- Início ----------
bind();
resetEntry();
let initialView = 'inicio';
try { initialView = sessionStorage.getItem('sbank:view') || 'inicio'; } catch {}
const hashView = location.hash.slice(1);
setView(['inicio', 'extrato', 'aportes', 'graficos', 'ia'].includes(hashView) ? hashView : initialView);

// Pede ao navegador para não apagar os dados locais
navigator.storage?.persist?.().catch(() => {});

if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
