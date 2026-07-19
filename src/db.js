// =========================================================
// FE Y ESPERANZA — ACCESO A DATOS (Cloudflare D1)
// =========================================================

// Condición SQL reutilizable: un contenido está "visible" en el sitio
// público si está publicado, o si está programado y su fecha ya llegó.
// Esto permite programar publicaciones sin necesitar un cron obligatorio.
export const VISIBLE_SQL = `(estado = 'publicado' OR (estado = 'programado' AND fecha_publicacion <= datetime('now')))`;

export async function listVisible(env, tipo, { limit = 200 } = {}) {
  const { results } = await env.DB.prepare(
    `SELECT c.*, cat.nombre AS categoria_nombre, cat.slug AS categoria_slug
     FROM contenidos c
     LEFT JOIN categorias cat ON cat.id = c.categoria_id
     WHERE c.tipo = ? AND ${VISIBLE_SQL}
     ORDER BY COALESCE(c.fecha_publicacion, c.creado_en) DESC, c.id DESC
     LIMIT ?`
  ).bind(tipo, limit).all();
  return results;
}

export async function getVisibleBySlug(env, tipo, slug) {
  return env.DB.prepare(
    `SELECT c.*, cat.nombre AS categoria_nombre, cat.slug AS categoria_slug
     FROM contenidos c
     LEFT JOIN categorias cat ON cat.id = c.categoria_id
     WHERE c.tipo = ? AND c.slug = ? AND ${VISIBLE_SQL}
     LIMIT 1`
  ).bind(tipo, slug).first();
}

// ---------- Administración (todas las entradas, sin filtrar por estado) ----------

export async function adminList(env, { tipo, estado, page = 1, pageSize = 20 } = {}) {
  const conditions = [];
  const binds = [];
  if (tipo) { conditions.push('c.tipo = ?'); binds.push(tipo); }
  if (estado) { conditions.push('c.estado = ?'); binds.push(estado); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (page - 1) * pageSize;

  const { results } = await env.DB.prepare(
    `SELECT c.*, cat.nombre AS categoria_nombre, cat.slug AS categoria_slug
     FROM contenidos c
     LEFT JOIN categorias cat ON cat.id = c.categoria_id
     ${where}
     ORDER BY c.actualizado_en DESC, c.id DESC
     LIMIT ? OFFSET ?`
  ).bind(...binds, pageSize, offset).all();

  const totalRow = await env.DB.prepare(
    `SELECT COUNT(*) AS total FROM contenidos c ${where}`
  ).bind(...binds).first();

  return { items: results, total: totalRow?.total ?? 0, page, pageSize };
}

export async function adminGet(env, id) {
  return env.DB.prepare(`SELECT * FROM contenidos WHERE id = ?`).bind(id).first();
}

const CAMPOS = [
  'tipo', 'titulo', 'slug', 'resumen', 'contenido', 'referencia',
  'categoria_id', 'imagen_url', 'seo_titulo', 'seo_descripcion',
  'estado', 'fecha_publicacion', 'fecha_especial', 'orden'
];

function slugify(text) {
  return (text || '')
    .toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function adminCreate(env, data) {
  if (!data.slug && data.titulo) data.slug = slugify(data.titulo) + '-' + Date.now().toString(36);
  const cols = CAMPOS.filter(c => data[c] !== undefined);
  const placeholders = cols.map(() => '?').join(', ');
  const values = cols.map(c => data[c]);
  const res = await env.DB.prepare(
    `INSERT INTO contenidos (${cols.join(', ')}, creado_en, actualizado_en)
     VALUES (${placeholders}, datetime('now'), datetime('now'))`
  ).bind(...values).run();
  return res.meta.last_row_id;
}

export async function adminUpdate(env, id, data) {
  const cols = CAMPOS.filter(c => data[c] !== undefined);
  if (!cols.length) return;
  const setClause = cols.map(c => `${c} = ?`).join(', ');
  const values = cols.map(c => data[c]);
  await env.DB.prepare(
    `UPDATE contenidos SET ${setClause}, actualizado_en = datetime('now') WHERE id = ?`
  ).bind(...values, id).run();
}

export async function adminDelete(env, id) {
  await env.DB.prepare(`DELETE FROM contenidos WHERE id = ?`).bind(id).run();
}

export async function publishDueScheduled(env) {
  await env.DB.prepare(
    `UPDATE contenidos SET estado = 'publicado', actualizado_en = datetime('now')
     WHERE estado = 'programado' AND fecha_publicacion <= datetime('now')`
  ).run();
}

// ---------- Categorías ----------

export async function listCategorias(env, tipo) {
  if (tipo) {
    const { results } = await env.DB.prepare(`SELECT * FROM categorias WHERE tipo = ? ORDER BY nombre`).bind(tipo).all();
    return results;
  }
  const { results } = await env.DB.prepare(`SELECT * FROM categorias ORDER BY tipo, nombre`).all();
  return results;
}

export async function createCategoria(env, { tipo, nombre, slug }) {
  const finalSlug = slug ? slugify(slug) : slugify(nombre);
  const res = await env.DB.prepare(
    `INSERT INTO categorias (tipo, nombre, slug) VALUES (?, ?, ?)`
  ).bind(tipo, nombre, finalSlug).run();
  return res.meta.last_row_id;
}

export async function deleteCategoria(env, id) {
  await env.DB.prepare(`DELETE FROM categorias WHERE id = ?`).bind(id).run();
}

export { slugify };
