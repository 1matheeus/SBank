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

document.getElementById('year').textContent = new Date().getFullYear();
