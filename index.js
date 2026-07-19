// =========================================================
// FE Y ESPERANZA — WORKER PRINCIPAL (v2)
// =========================================================
import { Hono } from 'hono';
import {
  verifyCredentials, createSession, destroySession, getSession, secretsFaltantes,
  debugCredentials,
} from './auth.js';
import {
  listVisible, getVisibleBySlug, adminList, adminGet, adminCreate, adminUpdate,
  adminDelete, publishDueScheduled, listCategorias, createCategoria, deleteCategoria,
} from './db.js';
import { oracionesDataJs, frasesDataJs, indexDataJs } from './data-scripts.js';
import { devocionalPage, devocionalesListPage, sitemapXml } from './templates.js';
import { loginPageHtml, adminShellHtml } from './admin-templates.js';

const app = new Hono();

// ---------------------------------------------------------
// RUTAS PÚBLICAS DINÁMICAS
// ---------------------------------------------------------

app.get('/data/oraciones-data.js', (c) => oracionesDataJs(c.env));
app.get('/data/frases-data.js', (c) => frasesDataJs(c.env));
app.get('/data/index-data.js', (c) => indexDataJs(c.env));

app.get('/sitemap.xml', async (c) => {
  const devocionales = await listVisible(c.env, 'devocional', { limit: 5000 });
  return c.body(sitemapXml(devocionales), 200, { 'content-type': 'application/xml; charset=utf-8' });
});

app.get('/devocionales', async (c) => {
  const items = await listVisible(c.env, 'devocional', { limit: 200 });
  return c.html(devocionalesListPage(items));
});

app.get('/devocional/:slug', async (c) => {
  const item = await getVisibleBySlug(c.env, 'devocional', c.req.param('slug'));
  if (!item) return c.notFound();
  return c.html(devocionalPage(item));
});

// Imágenes subidas desde el panel (Cloudflare R2)
app.get('/imagenes/:key{.+}', async (c) => {
  const key = c.req.param('key');
  const obj = await c.env.IMAGENES.get(key);
  if (!obj) return c.notFound();
  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set('etag', obj.httpEtag);
  headers.set('cache-control', 'public, max-age=31536000, immutable');
  return new Response(obj.body, { headers });
});

// ---------------------------------------------------------
// PANEL DE ADMINISTRACIÓN — páginas HTML
// ---------------------------------------------------------
// IMPORTANTE: estas páginas las genera el Worker directamente (no son
// archivos estáticos), así siempre pueden comprobar la sesión.

app.get('/admin', async (c) => {
  const session = await getSession(c);
  if (!session) return c.html(loginPageHtml());
  return c.html(adminShellHtml(session.u));
});
// Alias por compatibilidad con enlaces antiguos.
app.get('/admin/index.html', (c) => c.redirect('/admin', 302));
app.get('/admin/login', (c) => c.html(loginPageHtml()));
app.get('/admin/login.html', (c) => c.redirect('/admin/login', 302));

// Diagnóstico público (no expone secretos, solo si faltan o no).
app.get('/admin/api/estado', (c) => {
  const faltantes = secretsFaltantes(c.env);
  return c.json({ configuradoCorrectamente: faltantes.length === 0, secretsFaltantes: faltantes });
});

app.post('/admin/api/login', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { usuario, password } = body || {};
  if (!usuario || !password) return c.json({ error: 'Usuario y contraseña son obligatorios.' }, 400);
  try {
    const ok = await verifyCredentials(c.env, usuario, password);
    if (!ok) return c.json({ error: 'Usuario o contraseña incorrectos.' }, 401);
    await createSession(c, usuario);
    return c.json({ ok: true, usuario });
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

// ---------------------------------------------------------------------
// ENDPOINT TEMPORAL DE DIAGNÓSTICO — borrar en cuanto el login funcione.
// No expone la contraseña ni los valores completos de hash/salt, solo
// booleanos y los primeros 8 caracteres para comparar a simple vista.
// ---------------------------------------------------------------------
app.post('/admin/api/debug-login', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { usuario, password } = body || {};
  if (!usuario || !password) return c.json({ error: 'Usuario y contraseña son obligatorios.' }, 400);
  const resultado = await debugCredentials(c.env, usuario, password);
  return c.json(resultado);
});

app.post('/admin/api/logout', (c) => {
  destroySession(c);
  return c.json({ ok: true });
});

app.get('/admin/api/me', async (c) => {
  const session = await getSession(c);
  if (!session) return c.json({ authenticated: false }, 401);
  return c.json({ authenticated: true, usuario: session.u });
});

// Middleware: protege el resto de la API de administración. Se registra
// antes que las rutas siguientes para garantizar que se ejecuta primero.
app.use('/admin/api/*', async (c, next) => {
  const path = c.req.path;
  if (path === '/admin/api/login' || path === '/admin/api/estado' || path === '/admin/api/debug-login') return next();
  const session = await getSession(c);
  if (!session) return c.json({ error: 'No autenticado.' }, 401);
  c.set('session', session);
  await next();
});

// ---------------------------------------------------------
// API DE CONTENIDOS (oraciones, frases, reflexiones, devocionales, versículos)
// ---------------------------------------------------------

app.get('/admin/api/contenidos', async (c) => {
  const { tipo, estado, page } = c.req.query();
  const data = await adminList(c.env, { tipo, estado, page: Number(page) || 1, pageSize: 20 });
  return c.json(data);
});

app.get('/admin/api/contenidos/:id', async (c) => {
  const item = await adminGet(c.env, c.req.param('id'));
  if (!item) return c.json({ error: 'No encontrado.' }, 404);
  return c.json(item);
});

app.post('/admin/api/contenidos', async (c) => {
  const data = await c.req.json();
  if (!data.tipo) return c.json({ error: 'El campo "tipo" es obligatorio.' }, 400);
  const id = await adminCreate(c.env, data);
  return c.json({ ok: true, id });
});

app.put('/admin/api/contenidos/:id', async (c) => {
  const data = await c.req.json();
  await adminUpdate(c.env, c.req.param('id'), data);
  return c.json({ ok: true });
});

app.delete('/admin/api/contenidos/:id', async (c) => {
  await adminDelete(c.env, c.req.param('id'));
  return c.json({ ok: true });
});

// ---------------------------------------------------------
// API DE CATEGORÍAS
// ---------------------------------------------------------

app.get('/admin/api/categorias', async (c) => {
  const { tipo } = c.req.query();
  return c.json(await listCategorias(c.env, tipo));
});

app.post('/admin/api/categorias', async (c) => {
  const data = await c.req.json();
  if (!data.tipo || !data.nombre) return c.json({ error: 'tipo y nombre son obligatorios.' }, 400);
  const id = await createCategoria(c.env, data);
  return c.json({ ok: true, id });
});

app.delete('/admin/api/categorias/:id', async (c) => {
  await deleteCategoria(c.env, c.req.param('id'));
  return c.json({ ok: true });
});

// ---------------------------------------------------------
// SUBIDA DE IMÁGENES (Cloudflare R2)
// ---------------------------------------------------------

app.post('/admin/api/upload', async (c) => {
  const form = await c.req.formData();
  const file = form.get('imagen');
  if (!file || typeof file === 'string') return c.json({ error: 'No se recibió ninguna imagen.' }, 400);
  if (!file.type || !file.type.startsWith('image/')) return c.json({ error: 'El archivo debe ser una imagen.' }, 400);
  if (file.size > 8 * 1024 * 1024) return c.json({ error: 'La imagen no puede superar 8 MB.' }, 400);

  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
  const key = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  await c.env.IMAGENES.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });
  return c.json({ ok: true, url: `/imagenes/${key}` });
});

// ---------------------------------------------------------
// TODO LO DEMÁS: sitio estático (HTML, CSS, JS, imágenes originales)
// ---------------------------------------------------------

app.all('*', (c) => c.env.ASSETS.fetch(c.req.raw));

export default {
  fetch: app.fetch,
  async scheduled(event, env, ctx) {
    ctx.waitUntil(publishDueScheduled(env));
  },
};
