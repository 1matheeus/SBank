const brl = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

// Nav: borda ao rolar + menu mobile
const nav = document.querySelector('.nav');
const toggle = document.querySelector('.nav__toggle');
addEventListener('scroll', () => nav.classList.toggle('scrolled', scrollY > 8), { passive: true });
toggle.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  toggle.setAttribute('aria-expanded', open);
});
document.querySelectorAll('.nav__links a').forEach((a) =>
  a.addEventListener('click', () => nav.classList.remove('open'))
);

// Revelar seções e animar contadores ao entrar na tela
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add('visible');
    e.target.querySelectorAll('[data-count]').forEach(countUp);
    io.unobserve(e.target);
  });
}, { threshold: 0.15 });
document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

function countUp(el) {
  const target = parseFloat(el.dataset.count);
  const decimals = el.dataset.count.includes('.') ? 1 : 0;
  const start = performance.now();
  const step = (now) => {
    const p = Math.min((now - start) / 1400, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = (target * eased).toFixed(decimals).replace('.', ',') + el.dataset.suffix;
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// Cartão 3D acompanha o mouse
const card = document.querySelector('.card-3d');
const visual = document.querySelector('.hero__visual');
if (matchMedia('(hover: hover)').matches) {
  visual.addEventListener('mousemove', (e) => {
    const r = visual.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    card.style.transform = `rotateY(${x * 24}deg) rotateX(${-y * 18}deg) rotateZ(-4deg)`;
  });
  visual.addEventListener('mouseleave', () => (card.style.transform = ''));
}

// Simulador de investimento (juros compostos mensais)
const aporte = document.getElementById('aporte');
const prazo = document.getElementById('prazo');
function simulate() {
  const pmt = +aporte.value;
  const months = +prazo.value * 12;
  const i = Math.pow(1.11, 1 / 12) - 1;
  const total = pmt * ((Math.pow(1 + i, months) - 1) / i);
  const invested = pmt * months;
  document.getElementById('aporteOut').textContent = brl(pmt);
  document.getElementById('prazoOut').textContent = `${prazo.value} ${prazo.value === '1' ? 'ano' : 'anos'}`;
  document.getElementById('simTotal').textContent = brl(total);
  document.getElementById('simInvest').textContent = brl(invested);
  document.getElementById('simGain').textContent = brl(total - invested);
}
aporte.addEventListener('input', simulate);
prazo.addEventListener('input', simulate);
simulate();

// Formulário do topo leva ao app
document.getElementById('abrir-conta').addEventListener('submit', (e) => {
  e.preventDefault();
  location.href = 'app/';
});

document.getElementById('year').textContent = new Date().getFullYear();
