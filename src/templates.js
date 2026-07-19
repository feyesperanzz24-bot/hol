// =========================================================
// FE Y ESPERANZA — PLANTILLAS HTML GENERADAS POR EL WORKER
// =========================================================
// Reutilizan exactamente las mismas clases CSS y estructura visual
// que el resto del sitio (style.css, script.js) para que el diseño
// sea idéntico también en las páginas generadas dinámicamente.

const SITE_URL = 'https://www.feyesperanza.com';

function esc(str) {
  return (str ?? '').toString()
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function headerHtml() {
  return `
  <a class="skip-link" href="#contenido-principal">Saltar al contenido principal</a>
  <header class="site-header" id="siteHeader">
    <div class="container header-inner">
      <a href="/index.html" class="logo" aria-label="Fe y Esperanza - Inicio">
        <img src="/assets/logo.png" alt="Fe y Esperanza" class="logo-badge" width="44" height="44">
        <span class="logo-text">Fe <em>&amp;</em> Esperanza</span>
      </a>
      <nav class="main-nav" id="mainNav" aria-label="Navegación principal">
        <ul>
          <li><a href="/index.html#inicio">Inicio</a></li>
          <li><a href="/index.html#versiculo">Versículo</a></li>
          <li><a href="/index.html#reflexiones">Reflexiones</a></li>
          <li><a href="/index.html#articulos">Artículos</a></li>
          <li><a href="/oraciones.html">Oraciones</a></li>
          <li><a href="/frases.html">Frases Diarias</a></li>
          <li><a href="/acerca-de-nosotros.html">Nosotros</a></li>
          <li><a href="/index.html#contacto">Contacto</a></li>
        </ul>
      </nav>
      <div class="header-actions">
        <button class="theme-toggle" id="themeToggle" type="button" aria-label="Cambiar a modo oscuro" aria-pressed="false">
          <svg class="icon-sun" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/></svg>
          <svg class="icon-moon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/></svg>
        </button>
        <button class="hamburger" id="hamburger" type="button" aria-label="Abrir menú" aria-expanded="false" aria-controls="mainNav">
          <span></span><span></span><span></span>
        </button>
      </div>
    </div>
  </header>`;
}

function footerHtml() {
  return `
  <footer class="site-footer">
    <div class="container footer-grid">
      <div class="footer-brand">
        <a href="/index.html" class="logo logo-footer">
          <img src="/assets/logo.png" alt="Fe y Esperanza" class="logo-badge logo-badge-footer" width="36" height="36">
          <span class="logo-text">Fe <em>&amp;</em> Esperanza</span>
        </a>
        <p>Un espacio cristiano dedicado a compartir fe, esperanza y amor a través de artículos, reflexiones y la Palabra de Dios.</p>
      </div>
      <div class="footer-col">
        <h4>Explorar</h4>
        <ul>
          <li><a href="/index.html#inicio">Inicio</a></li>
          <li><a href="/index.html#articulos">Artículos</a></li>
          <li><a href="/index.html#reflexiones">Reflexiones</a></li>
          <li><a href="/oraciones.html">Oraciones</a></li>
          <li><a href="/frases.html">Frases Diarias</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>Sitio</h4>
        <ul>
          <li><a href="/acerca-de-nosotros.html">Acerca de Nosotros</a></li>
          <li><a href="/politica-de-privacidad.html">Política de Privacidad</a></li>
          <li><a href="/index.html#contacto">Contacto</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <div class="container footer-bottom-inner">
        <p>&copy; <span id="currentYear"></span> Fe y Esperanza. Todos los derechos reservados.</p>
        <p>Hecho con fe, para bendecir vidas.</p>
      </div>
    </div>
  </footer>
  <button id="backToTop" class="back-to-top" aria-label="Volver arriba" type="button">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 15l-6-6-6 6"/></svg>
  </button>
  <script src="/script.js"></script>`;
}

export function devocionalPage(item) {
  const titulo = esc(item.seo_titulo || item.titulo);
  const descripcion = esc(item.seo_descripcion || item.resumen || '');
  const url = `${SITE_URL}/devocional/${encodeURIComponent(item.slug)}`;
  const imagen = item.imagen_url ? (item.imagen_url.startsWith('http') ? item.imagen_url : `${SITE_URL}${item.imagen_url}`) : `${SITE_URL}/assets/og-image.jpg`;
  const cuerpo = (item.contenido || '').split(/\n{2,}/).map(p => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('\n');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${titulo} | Fe y Esperanza</title>
  <meta name="description" content="${descripcion}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${url}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${url}">
  <meta property="og:title" content="${titulo}">
  <meta property="og:description" content="${descripcion}">
  <meta property="og:image" content="${imagen}">
  <link rel="icon" type="image/png" href="/assets/favicon-32.png" sizes="32x32">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/style.css">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": ${JSON.stringify(item.titulo)},
    "description": ${JSON.stringify(item.resumen || '')},
    "image": ${JSON.stringify(imagen)},
    "datePublished": ${JSON.stringify(item.fecha_publicacion || item.creado_en)},
    "publisher": { "@type": "Organization", "name": "Fe y Esperanza" }
  }
  </script>
</head>
<body>
  ${headerHtml()}
  <main id="contenido-principal">
    <section class="section articles-section">
      <div class="container container-narrow">
        <p class="eyebrow">${esc(item.categoria_nombre || 'Devocional')}</p>
        <h1>${esc(item.titulo)}</h1>
        ${item.imagen_url ? `<img src="${esc(item.imagen_url)}" alt="${titulo}" style="width:100%;border-radius:16px;margin:1.5rem 0;">` : ''}
        <div class="devocional-body">
          ${cuerpo}
        </div>
        <p style="margin-top:2rem;"><a class="btn btn-outline-gold" href="/index.html#articulos">&larr; Volver a Artículos</a></p>
      </div>
    </section>
  </main>
  ${footerHtml()}
</body>
</html>`;
}

export function devocionalesListPage(items) {
  const cards = items.map(it => `
      <article class="article-card reveal" data-category="${esc(it.categoria_slug || '')}">
        <span class="article-tag">${esc(it.categoria_nombre || 'Devocional')}</span>
        <h3>${esc(it.titulo)}</h3>
        <p>${esc(it.resumen || '')}</p>
        <a href="/devocional/${encodeURIComponent(it.slug)}" class="article-link">Leer más &rarr;</a>
      </article>`).join('\n');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Todos los Artículos y Devocionales | Fe y Esperanza</title>
  <meta name="description" content="Explora todos los artículos cristianos y devocionales de Fe y Esperanza.">
  <link rel="canonical" href="${SITE_URL}/devocionales">
  <link rel="icon" type="image/png" href="/assets/favicon-32.png" sizes="32x32">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  ${headerHtml()}
  <main id="contenido-principal">
    <section class="section articles-section">
      <div class="container">
        <div class="section-head reveal">
          <p class="eyebrow">Biblioteca</p>
          <h2>Todos los Artículos y Devocionales</h2>
        </div>
        <div class="articles-grid">
          ${cards || '<p>Todavía no hay artículos publicados.</p>'}
        </div>
      </div>
    </section>
  </main>
  ${footerHtml()}
</body>
</html>`;
}

export function sitemapXml(devocionales) {
  const staticUrls = [
    { loc: '/', freq: 'daily', priority: '1.0' },
    { loc: '/oraciones.html', freq: 'daily', priority: '0.9' },
    { loc: '/frases.html', freq: 'daily', priority: '0.9' },
    { loc: '/devocionales', freq: 'daily', priority: '0.8' },
    { loc: '/acerca-de-nosotros.html', freq: 'monthly', priority: '0.6' },
    { loc: '/politica-de-privacidad.html', freq: 'yearly', priority: '0.3' },
  ];

  const dynamicUrls = devocionales.map(d => ({
    loc: `/devocional/${encodeURIComponent(d.slug)}`,
    freq: 'weekly',
    priority: '0.7',
    lastmod: (d.actualizado_en || '').replace(' ', 'T'),
  }));

  const all = [...staticUrls, ...dynamicUrls];
  const body = all.map(u => `  <url>
    <loc>${SITE_URL}${u.loc}</loc>
    ${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}
    <changefreq>${u.freq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>`;
}
