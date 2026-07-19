/* =========================================================
   FE Y ESPERANZA — SCRIPT PRINCIPAL
   Funcionalidades: menú móvil, modo oscuro, versículo del día,
   animaciones al hacer scroll, búsqueda de artículos,
   comentarios, formulario de contacto, botón "volver arriba".
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Año actual en el footer ---------- */
  const yearEl = document.getElementById('currentYear');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Menú móvil (hamburguesa) ---------- */
  const hamburger = document.getElementById('hamburger');
  const mainNav = document.getElementById('mainNav');

  if (hamburger && mainNav) {
    hamburger.addEventListener('click', () => {
      const isOpen = mainNav.classList.toggle('is-open');
      hamburger.classList.toggle('is-open', isOpen);
      hamburger.setAttribute('aria-expanded', String(isOpen));
      hamburger.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');
    });

    // Cierra el menú al seleccionar un enlace (útil en móvil)
    mainNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mainNav.classList.remove('is-open');
        hamburger.classList.remove('is-open');
        hamburger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- Modo oscuro ---------- */
  const themeToggle = document.getElementById('themeToggle');
  const root = document.documentElement;
  const savedTheme = localStorage.getItem('fe-esperanza-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  // Aplica el tema guardado o la preferencia del sistema al cargar
  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    root.setAttribute('data-theme', 'dark');
    if (themeToggle) themeToggle.setAttribute('aria-pressed', 'true');
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const isDark = root.getAttribute('data-theme') === 'dark';
      if (isDark) {
        root.removeAttribute('data-theme');
        localStorage.setItem('fe-esperanza-theme', 'light');
        themeToggle.setAttribute('aria-pressed', 'false');
        themeToggle.setAttribute('aria-label', 'Cambiar a modo oscuro');
      } else {
        root.setAttribute('data-theme', 'dark');
        localStorage.setItem('fe-esperanza-theme', 'dark');
        themeToggle.setAttribute('aria-pressed', 'true');
        themeToggle.setAttribute('aria-label', 'Cambiar a modo claro');
      }
    });
  }

  /* ---------- Animaciones al hacer scroll (IntersectionObserver) ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          // pequeño desfase entre elementos para un efecto en cascada suave
          setTimeout(() => entry.target.classList.add('is-visible'), i % 4 * 80);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    revealEls.forEach(el => observer.observe(el));
  } else {
    // Sin soporte: mostrar todo directamente
    revealEls.forEach(el => el.classList.add('is-visible'));
  }

  /* ---------- Contenido dinámico desde el panel de administración ---------- */
  /* Si existe window.SITE_DATA (generado por el Worker desde D1), se usa para
     poblar el versículo, las reflexiones y los artículos/devocionales. Si no
     existe o viene vacío, el sitio conserva el contenido de ejemplo original. */
  function escapeHTMLBasic(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  const reflectionsGrid = document.getElementById('reflectionsGrid');
  if (window.SITE_DATA && Array.isArray(window.SITE_DATA.reflexiones) && window.SITE_DATA.reflexiones.length && reflectionsGrid) {
    reflectionsGrid.innerHTML = window.SITE_DATA.reflexiones.map(r => `
      <article class="reflection-card reveal is-visible">
        <p class="reflection-date">${escapeHTMLBasic(r.fecha)}</p>
        <h3>${escapeHTMLBasic(r.titulo)}</h3>
        <p>${escapeHTMLBasic(r.texto)}</p>
      </article>
    `).join('');
  }

  const articlesGridDynamic = document.getElementById('articlesGrid');
  if (window.SITE_DATA && Array.isArray(window.SITE_DATA.articulos) && window.SITE_DATA.articulos.length && articlesGridDynamic) {
    articlesGridDynamic.innerHTML = window.SITE_DATA.articulos.map(a => `
      <article class="article-card reveal is-visible" data-category="${escapeHTMLBasic(a.categoria)}">
        <span class="article-tag">${escapeHTMLBasic(a.categoriaNombre)}</span>
        <h3>${escapeHTMLBasic(a.titulo)}</h3>
        <p>${escapeHTMLBasic(a.resumen)}</p>
        <a href="devocional/${encodeURIComponent(a.slug)}" class="article-link">Leer más &rarr;</a>
      </article>
    `).join('');
  }

  /* ---------- Versículo del día (banco rotativo) ---------- */
  const verses = (window.SITE_DATA && Array.isArray(window.SITE_DATA.versiculos) && window.SITE_DATA.versiculos.length)
    ? window.SITE_DATA.versiculos
    : [
      { text: 'Encomienda al Señor tus afanes, y él te sostendrá; no dejará jamás caído al justo.', ref: 'Salmo 55:22' },
      { text: 'Porque yo sé los planes que tengo para ustedes —afirma el Señor—, planes de bienestar y no de calamidad, a fin de darles un futuro y una esperanza.', ref: 'Jeremías 29:11' },
      { text: 'Todo lo puedo en Cristo que me fortalece.', ref: 'Filipenses 4:13' },
      { text: 'El Señor es mi pastor, nada me faltará.', ref: 'Salmo 23:1' },
      { text: 'No temas, porque yo estoy contigo; no desmayes, porque yo soy tu Dios.', ref: 'Isaías 41:10' },
      { text: 'Y sabemos que a los que aman a Dios, todas las cosas les ayudan a bien.', ref: 'Romanos 8:28' },
      { text: 'Vengan a mí todos los que están cansados y agobiados, y yo les daré descanso.', ref: 'Mateo 11:28' }
    ];

  const verseText = document.getElementById('verseText');
  const verseRef = document.getElementById('verseRef');
  const newVerseBtn = document.getElementById('newVerseBtn');
  let lastVerseIndex = 0;

  if (window.SITE_DATA && Array.isArray(window.SITE_DATA.versiculos) && window.SITE_DATA.versiculos.length && verseText && verseRef) {
    verseText.textContent = verses[0].text;
    verseRef.textContent = verses[0].ref;
  }

  function showRandomVerse() {
    let index;
    do {
      index = Math.floor(Math.random() * verses.length);
    } while (index === lastVerseIndex && verses.length > 1);
    lastVerseIndex = index;

    if (verseText && verseRef) {
      verseText.style.opacity = 0;
      verseRef.style.opacity = 0;
      setTimeout(() => {
        verseText.textContent = verses[index].text;
        verseRef.textContent = verses[index].ref;
        verseText.style.transition = 'opacity .4s ease';
        verseRef.style.transition = 'opacity .4s ease';
        verseText.style.opacity = 1;
        verseRef.style.opacity = 1;
      }, 200);
    }
  }

  if (newVerseBtn) newVerseBtn.addEventListener('click', showRandomVerse);

  /* ---------- Buscador de artículos ---------- */
  const searchInput = document.getElementById('articleSearch');
  const articleCards = document.querySelectorAll('.article-card');
  const noResults = document.getElementById('noResults');

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const query = searchInput.value.trim().toLowerCase();
      let visibleCount = 0;

      articleCards.forEach(card => {
        const title = card.querySelector('h3')?.textContent.toLowerCase() || '';
        const text = card.querySelector('p')?.textContent.toLowerCase() || '';
        const category = card.dataset.category || '';
        const matches = title.includes(query) || text.includes(query) || category.includes(query);

        card.hidden = !matches;
        if (matches) visibleCount++;
      });

      if (noResults) noResults.hidden = visibleCount !== 0;
    });
  }

  /* ---------- Comentarios (guardados en el navegador) ---------- */
  const commentForm = document.getElementById('commentForm');
  const commentsList = document.getElementById('commentsList');
  const COMMENTS_KEY = 'fe-esperanza-comments';

  const defaultComments = [
    { name: 'María G.', date: 'hace 2 días', text: 'Esta reflexión llegó justo cuando más la necesitaba. Gracias por compartir la Palabra con tanto amor.' },
    { name: 'Carlos R.', date: 'hace 5 días', text: 'El versículo del día se ha vuelto parte de mi rutina de oración cada mañana. ¡Dios los bendiga!' }
  ];

  function loadComments() {
    const saved = JSON.parse(localStorage.getItem(COMMENTS_KEY) || 'null');
    return saved || defaultComments;
  }

  function saveComments(comments) {
    localStorage.setItem(COMMENTS_KEY, JSON.stringify(comments));
  }

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function renderComments() {
    if (!commentsList) return;
    const comments = loadComments();
    commentsList.innerHTML = comments.map(c => `
      <li class="comment-item">
        <span class="comment-author">${escapeHTML(c.name)}<span class="comment-date">${escapeHTML(c.date)}</span></span>
        <p>${escapeHTML(c.text)}</p>
      </li>
    `).join('');
  }

  renderComments();

  if (commentForm) {
    commentForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const nameInput = document.getElementById('commentName');
      const textInput = document.getElementById('commentText');
      const name = nameInput.value.trim();
      const text = textInput.value.trim();
      if (!name || !text) return;

      const comments = loadComments();
      comments.unshift({ name, date: 'justo ahora', text });
      saveComments(comments);
      renderComments();
      commentForm.reset();
      nameInput.focus();
    });
  }

  /* ---------- Formulario de contacto ---------- */
  const contactForm = document.getElementById('contactForm');
  const contactStatus = document.getElementById('contactStatus');

  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('contactName').value.trim();
      const email = document.getElementById('contactEmail').value.trim();
      const message = document.getElementById('contactMessage').value.trim();
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!name || !message || !emailPattern.test(email)) {
        contactStatus.textContent = 'Por favor completa todos los campos con un correo válido.';
        contactStatus.style.color = '#c0392b';
        return;
      }

      // NOTA: aquí se debe conectar un backend o servicio de formularios
      // (por ejemplo Formspree, EmailJS o un endpoint propio) para el envío real.
      contactStatus.style.color = 'var(--gold)';
      contactStatus.textContent = `Gracias, ${name}. Tu mensaje ha sido recibido y te responderemos pronto.`;
      contactForm.reset();
    });
  }

  /* ---------- Botón "volver arriba" ---------- */
  const backToTop = document.getElementById('backToTop');
  if (backToTop) {
    window.addEventListener('scroll', () => {
      backToTop.classList.toggle('is-visible', window.scrollY > 500);
    });
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------- Sombra dinámica en el encabezado al hacer scroll ---------- */
  const header = document.getElementById('siteHeader');
  if (header) {
    window.addEventListener('scroll', () => {
      header.style.boxShadow = window.scrollY > 10 ? '0 6px 20px -10px rgba(11,31,58,0.25)' : 'none';
    });
  }

});
