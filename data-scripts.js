// =========================================================
// FE Y ESPERANZA — GENERACIÓN DINÁMICA DE data/*.js
// =========================================================
// Estos archivos reemplazan a los antiguos data/oraciones-data.js y
// data/frases-data.js. Se generan al vuelo desde D1 con EXACTAMENTE
// el mismo formato que usaban los originales, así oraciones.js,
// frases.js y script.js siguen funcionando sin ningún cambio.

import { listVisible } from './db.js';

const JS_HEADERS = { 'content-type': 'application/javascript; charset=utf-8', 'cache-control': 'public, max-age=300' };

export async function oracionesDataJs(env) {
  const rows = await listVisible(env, 'oracion', { limit: 2000 });

  const especiales = {};
  const banco = { manana: [], noche: [], familia: [], agradecimiento: [], sanidad: [], dificil: [] };

  for (const r of rows) {
    const cat = r.categoria_slug;
    if (r.fecha_especial) {
      especiales[r.fecha_especial] = especiales[r.fecha_especial] || {};
      if (cat) especiales[r.fecha_especial][cat] = r.contenido;
      if (r.referencia) especiales[r.fecha_especial].versiculo = r.referencia;
    } else if (cat && banco[cat]) {
      banco[cat].push({ texto: r.contenido, versiculo: r.referencia || '' });
    }
  }

  const body = `window.ORACIONES_ESPECIALES = ${JSON.stringify(especiales)};\nwindow.ORACIONES_BANCO = ${JSON.stringify(banco)};\n`;
  return new Response(body, { headers: JS_HEADERS });
}

export async function frasesDataJs(env) {
  const rows = await listVisible(env, 'frase', { limit: 2000 });

  const frases = [];
  const bancoPorCategoria = {};

  for (const r of rows) {
    const cat = r.categoria_slug || 'reflexion';
    if (r.fecha_publicacion) {
      frases.push({ fecha: r.fecha_publicacion.slice(0, 10), categoria: cat, texto: r.contenido });
    } else {
      bancoPorCategoria[cat] = bancoPorCategoria[cat] || [];
      bancoPorCategoria[cat].push({ categoria: cat, texto: r.contenido });
    }
  }

  const banco = Object.values(bancoPorCategoria).flat();

  const body = `window.FRASES = ${JSON.stringify(frases)};\nwindow.FRASES_BANCO = ${JSON.stringify(banco)};\n`;
  return new Response(body, { headers: JS_HEADERS });
}

export async function indexDataJs(env) {
  const [versiculos, reflexiones, articulos] = await Promise.all([
    listVisible(env, 'versiculo', { limit: 100 }),
    listVisible(env, 'reflexion', { limit: 30 }),
    listVisible(env, 'devocional', { limit: 9 }),
  ]);

  const data = {
    versiculos: versiculos.map(v => ({ text: v.contenido, ref: v.referencia || '' })),
    reflexiones: reflexiones.map(r => ({
      fecha: r.referencia || '',
      titulo: r.titulo || '',
      texto: r.contenido || '',
    })),
    articulos: articulos.map(a => ({
      categoria: a.categoria_slug || '',
      categoriaNombre: a.categoria_nombre || 'Devocional',
      titulo: a.titulo || '',
      resumen: a.resumen || '',
      slug: a.slug || '',
    })),
  };

  const body = `window.SITE_DATA = ${JSON.stringify(data)};\n`;
  return new Response(body, { headers: JS_HEADERS });
}
