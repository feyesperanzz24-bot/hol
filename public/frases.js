/* =========================================================
   FE Y ESPERANZA — LÓGICA DE LA PÁGINA "FRASES DIARIAS"
   Lee el contenido desde data/frases-data.js.
   No es necesario editar este archivo para agregar frases:
   todo el contenido se administra en data/frases-data.js
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

  const CATEGORY_LABELS = {
    fe: 'Fe',
    esperanza: 'Esperanza',
    amor: 'Amor de Dios',
    reflexion: 'Reflexión',
    motivacion: 'Motivación'
  };

  const heroDate = document.getElementById('phraseHeroDate');
  const heroTag = document.getElementById('phraseHeroTag');
  const heroText = document.getElementById('phraseHeroText');
  const grid = document.getElementById('phrasesGrid');
  const filterBar = document.getElementById('phraseFilters');
  const searchInput = document.getElementById('phraseSearch');
  const noResults = document.getElementById('phraseNoResults');

  if (!grid || !window.FRASES) return; // Esta página no está presente en este documento

  function pad(n) { return String(n).padStart(2, '0'); }
  function todayISO() {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
  function formatDateEs(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return `${d} de ${MESES[m - 1]} de ${y}`;
  }
  function dayOfYear(date) {
    const start = new Date(date.getFullYear(), 0, 0);
    return Math.floor((date - start) / 86400000);
  }

  /* ---------- Frase del día ---------- */
  function getFraseDelDia() {
    const today = todayISO();
    const exact = window.FRASES.find(f => f.fecha === today);
    if (exact) return exact;

    const bank = window.FRASES_BANCO || [];
    if (!bank.length) return null;
    const idx = dayOfYear(new Date()) % bank.length;
    return { ...bank[idx], fecha: today };
  }

  const fraseDelDia = getFraseDelDia();
  if (fraseDelDia) {
    if (heroDate) heroDate.textContent = formatDateEs(fraseDelDia.fecha);
    if (heroTag) heroTag.textContent = CATEGORY_LABELS[fraseDelDia.categoria] || fraseDelDia.categoria;
    if (heroText) heroText.textContent = fraseDelDia.texto;
  }

  /* ---------- Listado completo ---------- */
  const ordenadas = [...window.FRASES].sort((a, b) => (a.fecha < b.fecha ? 1 : -1));

  function renderGrid(list) {
    grid.innerHTML = list.map(f => `
      <article class="phrase-card" data-categoria="${f.categoria}">
        <span class="phrase-date">${formatDateEs(f.fecha)}</span>
        <blockquote>${f.texto}</blockquote>
        <span class="article-tag">${CATEGORY_LABELS[f.categoria] || f.categoria}</span>
      </article>
    `).join('');
    if (noResults) noResults.hidden = list.length !== 0;
  }

  renderGrid(ordenadas);

  /* ---------- Filtro por categoría ---------- */
  let activeCategory = 'todas';
  let activeQuery = '';

  function applyFilters() {
    const filtered = ordenadas.filter(f => {
      const matchesCategory = activeCategory === 'todas' || f.categoria === activeCategory;
      const matchesQuery = !activeQuery || f.texto.toLowerCase().includes(activeQuery);
      return matchesCategory && matchesQuery;
    });
    renderGrid(filtered);
  }

  if (filterBar) {
    filterBar.querySelectorAll('.phrase-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        filterBar.querySelectorAll('.phrase-filter-btn').forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        activeCategory = btn.dataset.categoria;
        applyFilters();
      });
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      activeQuery = searchInput.value.trim().toLowerCase();
      applyFilters();
    });
  }
});
