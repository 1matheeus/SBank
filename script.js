// Borda da navegação aparece só quando há conteúdo por baixo
const nav = document.getElementById('nav');
addEventListener('scroll', () => nav.classList.toggle('is-scrolled', scrollY > 8), { passive: true });

// Elementos entram suavemente quando aparecem na tela
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add('is-in');
    io.unobserve(e.target);
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.reveal, .rise').forEach((el) => {
  // pequeno escalonamento entre irmãos para a leitura seguir a ordem
  const siblings = [...el.parentElement.children].filter((c) => c.classList.contains('reveal'));
  const idx = siblings.indexOf(el);
  if (idx > 0) el.style.transitionDelay = `${Math.min(idx, 4) * 70}ms`;
  io.observe(el);
});

// Modo claro / escuro (mesma preferência do app)
const root = document.documentElement;
const darkMQ = matchMedia('(prefers-color-scheme: dark)');
const isDark = () => (root.dataset.theme ? root.dataset.theme === 'dark' : darkMQ.matches);
function syncTheme() {
  const dark = isDark();
  document.querySelector('.icon-moon').hidden = dark;
  document.querySelector('.icon-sun').hidden = !dark;
  document.querySelectorAll('[data-dark]').forEach((img) => (img.src = dark ? img.dataset.dark : img.dataset.light));
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => {
    m.content = root.dataset.theme ? (dark ? '#0B0B0C' : '#FBFBF9') : m.media.includes('dark') ? '#0B0B0C' : '#FBFBF9';
  });
}
document.getElementById('themeBtn').addEventListener('click', () => {
  const next = isDark() ? 'light' : 'dark';
  const swap = () => {
    root.dataset.theme = next;
    try { localStorage.setItem('sbank:theme', next); } catch {}
    syncTheme();
  };
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) swap();
  else if (document.startViewTransition) document.startViewTransition(swap);
  else { root.classList.add('theme-fade'); swap(); setTimeout(() => root.classList.remove('theme-fade'), 420); }
});
darkMQ.addEventListener('change', syncTheme);
syncTheme();

document.getElementById('year').textContent = new Date().getFullYear();
