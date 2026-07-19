/* =========================================================
   FE Y ESPERANZA — PANEL DE ADMINISTRACIÓN (lógica de la SPA)
   ========================================================= */

const TIPOS = {
  oracion: {
    label: 'Oraciones', icono: '🙏', categoriaTipo: 'oracion',
    campos: ['contenido', 'referencia', 'categoria_id', 'fecha_especial', 'estado', 'fecha_publicacion'],
    columnas: ['contenido', 'categoria_nombre', 'fecha_especial', 'estado'],
  },
  frase: {
    label: 'Frases Diarias', icono: '💬', categoriaTipo: 'frase',
    campos: ['contenido', 'categoria_id', 'estado', 'fecha_publicacion'],
    columnas: ['contenido', 'categoria_nombre', 'fecha_publicacion', 'estado'],
  },
  reflexion: {
    label: 'Reflexiones', icono: '🕊️', categoriaTipo: null,
    campos: ['titulo', 'referencia', 'contenido', 'estado', 'fecha_publicacion'],
    columnas: ['titulo', 'referencia', 'fecha_publicacion', 'estado'],
  },
  devocional: {
    label: 'Devocionales / Artículos', icono: '📖', categoriaTipo: 'devocional',
    campos: ['titulo', 'slug', 'resumen', 'contenido', 'categoria_id', 'imagen_url', 'seo_titulo', 'seo_descripcion', 'estado', 'fecha_publicacion'],
    columnas: ['titulo', 'categoria_nombre', 'fecha_publicacion', 'estado'],
  },
  versiculo: {
    label: 'Versículos', icono: '✝️', categoriaTipo: null,
    campos: ['contenido', 'referencia', 'estado', 'fecha_publicacion'],
    columnas: ['contenido', 'referencia', 'fecha_publicacion', 'estado'],
  },
};

const CAMPO_LABELS = {
  titulo: 'Título', slug: 'URL amigable (slug) — se genera sola si la dejas vacía',
  resumen: 'Resumen breve (para la tarjeta)', contenido: 'Texto / Contenido completo',
  referencia: 'Referencia bíblica o etiqueta', categoria_id: 'Categoría',
  imagen_url: 'Imagen', seo_titulo: 'Título SEO (opcional)', seo_descripcion: 'Descripción SEO (opcional)',
  estado: 'Estado', fecha_publicacion: 'Fecha / hora de publicación',
  fecha_especial: 'Fecha especial del calendario (MM-DD, opcional)',
};

let state = { tipoActivo: 'oracion', pagina: 1, filtroEstado: '', categoriasCache: {}, editandoId: null };

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

async function api(path, options = {}) {
  const isFormData = options.body instanceof FormData;
  const headers = isFormData ? { ...(options.headers || {}) } : { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(path, { ...options, headers });
  if (res.status === 401) {
    window.location.href = '/admin/login';
    throw new Error('No autenticado');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Ocurrió un error.');
  return data;
}

function toast(msg, isError = false) {
  const el = document.createElement('div');
  el.className = 'toast' + (isError ? ' error' : '');
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

/* ---------- Navegación entre pestañas ---------- */

function renderNav() {
  const nav = $('#adminNav');
  nav.innerHTML = Object.entries(TIPOS).map(([key, t]) => `
    <li><button data-tipo="${key}" class="${state.tipoActivo === key ? 'is-active' : ''}">${t.icono} ${t.label}</button></li>
  `).join('') + `<li><button data-tipo="categorias" class="${state.tipoActivo === 'categorias' ? 'is-active' : ''}">🏷️ Categorías</button></li>`;

  nav.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      state.tipoActivo = btn.dataset.tipo;
      state.pagina = 1;
      state.filtroEstado = '';
      renderNav();
      state.tipoActivo === 'categorias' ? renderCategorias() : renderLista();
    });
  });
}

/* ---------- Listado de contenidos ---------- */

async function renderLista() {
  const tipo = state.tipoActivo;
  const cfg = TIPOS[tipo];
  const main = $('#adminContent');
  main.innerHTML = `
    <div class="admin-topbar">
      <h2>${cfg.icono} ${cfg.label}</h2>
      <button class="btn btn-gold" id="btnNuevo">+ Nueva entrada</button>
    </div>
    <div class="toolbar">
      <select id="filtroEstado">
        <option value="">Todos los estados</option>
        <option value="borrador">Borrador</option>
        <option value="programado">Programado</option>
        <option value="publicado">Publicado</option>
      </select>
    </div>
    <div class="data-table-wrap"><div class="empty-state">Cargando…</div></div>
  `;
  $('#btnNuevo').addEventListener('click', () => abrirFormulario(tipo, null));
  $('#filtroEstado').value = state.filtroEstado;
  $('#filtroEstado').addEventListener('change', (e) => {
    state.filtroEstado = e.target.value;
    state.pagina = 1;
    cargarLista();
  });

  await cargarLista();
}

async function cargarLista() {
  const tipo = state.tipoActivo;
  const cfg = TIPOS[tipo];
  const qs = new URLSearchParams({ tipo, page: state.pagina });
  if (state.filtroEstado) qs.set('estado', state.filtroEstado);
  const data = await api(`/admin/api/contenidos?${qs.toString()}`);
  const wrap = $('.data-table-wrap');

  if (!data.items.length) {
    wrap.innerHTML = `<div class="empty-state">Todavía no hay entradas. Crea la primera con “+ Nueva entrada”.</div>`;
    return;
  }

  const headerLabels = { titulo: 'Título', contenido: 'Texto', categoria_nombre: 'Categoría', referencia: 'Referencia', fecha_especial: 'Fecha especial', fecha_publicacion: 'Publicación', estado: 'Estado' };

  wrap.innerHTML = `
    <table class="data-table">
      <thead><tr>${cfg.columnas.map(c => `<th>${headerLabels[c] || c}</th>`).join('')}<th>Acciones</th></tr></thead>
      <tbody>
        ${data.items.map(item => `
          <tr>
            ${cfg.columnas.map(c => `<td>${formatCelda(c, item[c])}</td>`).join('')}
            <td class="acciones">
              <button class="btn btn-outline btn-sm" data-editar="${item.id}">Editar</button>
              <button class="btn btn-danger btn-sm" data-eliminar="${item.id}">Eliminar</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  wrap.querySelectorAll('[data-editar]').forEach(btn => btn.addEventListener('click', () => abrirFormulario(tipo, btn.dataset.editar)));
  wrap.querySelectorAll('[data-eliminar]').forEach(btn => btn.addEventListener('click', () => eliminarEntrada(btn.dataset.eliminar)));
}

function formatCelda(campo, valor) {
  if (campo === 'estado') return `<span class="badge badge-${valor}">${valor}</span>`;
  if (campo === 'contenido' || campo === 'titulo') return escapeHtml((valor || '').slice(0, 90)) + ((valor || '').length > 90 ? '…' : '');
  if (campo === 'fecha_publicacion') return valor ? valor.replace('T', ' ').slice(0, 16) : '<span class="hint">sin fecha</span>';
  return escapeHtml(valor || '—');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

async function eliminarEntrada(id) {
  if (!confirm('¿Eliminar esta entrada de forma permanente?')) return;
  try {
    await api(`/admin/api/contenidos/${id}`, { method: 'DELETE' });
    toast('Entrada eliminada.');
    cargarLista();
  } catch (e) {
    toast(e.message, true);
  }
}

/* ---------- Formulario crear / editar ---------- */

async function abrirFormulario(tipo, id) {
  const cfg = TIPOS[tipo];
  state.editandoId = id;
  let item = { estado: 'borrador' };
  if (id) item = await api(`/admin/api/contenidos/${id}`);

  let categorias = [];
  if (cfg.categoriaTipo) {
    categorias = await cargarCategorias(cfg.categoriaTipo);
  }

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-card">
      <div class="modal-header">
        <h3>${id ? 'Editar' : 'Nueva'} ${cfg.label.replace(/s$/, '')}</h3>
        <button class="modal-close" id="cerrarModal">&times;</button>
      </div>
      <form id="formEntrada">
        <div class="modal-body">
          ${cfg.campos.map(campo => renderCampo(campo, item, categorias, cfg)).join('')}
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline" id="cerrarModal2">Cancelar</button>
          <button type="submit" name="accion" value="borrador" class="btn btn-outline">Guardar borrador</button>
          <button type="submit" name="accion" value="programar" class="btn btn-outline" id="btnProgramar">Programar</button>
          <button type="submit" name="accion" value="publicar" class="btn btn-gold">Publicar</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.querySelector('#cerrarModal').addEventListener('click', () => overlay.remove());
  overlay.querySelector('#cerrarModal2').addEventListener('click', () => overlay.remove());

  const uploadBox = overlay.querySelector('.upload-box');
  if (uploadBox) {
    const input = overlay.querySelector('#inputImagen');
    uploadBox.addEventListener('click', () => input.click());
    input.addEventListener('change', () => subirImagen(input, uploadBox, overlay));
  }

  overlay.querySelector('#formEntrada').addEventListener('submit', (e) => guardarEntrada(e, tipo, id, overlay));
}

function renderCampo(campo, item, categorias, cfg) {
  const label = CAMPO_LABELS[campo] || campo;
  const valor = item[campo] ?? '';

  if (campo === 'categoria_id') {
    return `
      <div class="field">
        <label>${label}</label>
        <select name="categoria_id">
          <option value="">Sin categoría</option>
          ${categorias.map(c => `<option value="${c.id}" ${Number(valor) === c.id ? 'selected' : ''}>${escapeHtml(c.nombre)}</option>`).join('')}
        </select>
      </div>`;
  }
  if (campo === 'estado') {
    return `
      <div class="field">
        <label>${label}</label>
        <select name="estado">
          <option value="borrador" ${valor === 'borrador' ? 'selected' : ''}>Borrador</option>
          <option value="programado" ${valor === 'programado' ? 'selected' : ''}>Programado</option>
          <option value="publicado" ${valor === 'publicado' ? 'selected' : ''}>Publicado</option>
        </select>
      </div>`;
  }
  if (campo === 'fecha_publicacion') {
    let dt = '';
    if (valor) {
      const d = new Date(valor.replace(' ', 'T') + 'Z'); // el valor guardado está en UTC
      if (!isNaN(d)) {
        const pad = (n) => String(n).padStart(2, '0');
        dt = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      }
    }
    return `
      <div class="field">
        <label>${label}</label>
        <input type="datetime-local" name="fecha_publicacion" value="${dt}">
        <p class="hint">Déjalo vacío para publicar sin fecha (por ejemplo, un versículo o frase de uso general). Para programar, elige una fecha futura y pulsa “Programar”.</p>
      </div>`;
  }
  if (campo === 'fecha_especial') {
    return `
      <div class="field">
        <label>${label}</label>
        <input type="text" name="fecha_especial" placeholder="12-25" pattern="\\d{2}-\\d{2}" value="${escapeHtml(valor)}">
        <p class="hint">Formato MM-DD. Si lo llenas, esta oración aparecerá siempre ese día del año (ej. Navidad).</p>
      </div>`;
  }
  if (campo === 'contenido' || campo === 'resumen' || campo === 'seo_descripcion') {
    return `
      <div class="field">
        <label>${label}</label>
        <textarea name="${campo}">${escapeHtml(valor)}</textarea>
      </div>`;
  }
  if (campo === 'imagen_url') {
    return `
      <div class="field">
        <label>${label}</label>
        <input type="file" id="inputImagen" accept="image/*" hidden>
        <div class="upload-box" id="uploadBox">
          📷 Haz clic para subir una imagen desde tu computador
          <input type="hidden" name="imagen_url" value="${escapeHtml(valor)}">
          ${valor ? `<img src="${escapeHtml(valor)}" alt="">` : ''}
        </div>
      </div>`;
  }
  return `
    <div class="field">
      <label>${label}</label>
      <input type="text" name="${campo}" value="${escapeHtml(valor)}">
    </div>`;
}

async function subirImagen(input, uploadBox, overlay) {
  const file = input.files[0];
  if (!file) return;
  const form = new FormData();
  form.append('imagen', file);
  uploadBox.innerHTML = '📤 Subiendo imagen…';
  try {
    const data = await api('/admin/api/upload', { method: 'POST', body: form });
    overlay.querySelector('input[name="imagen_url"]').value = data.url;
    uploadBox.innerHTML = `📷 Haz clic para cambiar la imagen<img src="${data.url}" alt=""><input type="hidden" name="imagen_url" value="${data.url}">`;
    const newInput = document.createElement('input');
    newInput.type = 'file'; newInput.id = 'inputImagen'; newInput.accept = 'image/*'; newInput.hidden = true;
    overlay.querySelector('.modal-body').appendChild(newInput);
    uploadBox.addEventListener('click', () => newInput.click());
    newInput.addEventListener('change', () => subirImagen(newInput, uploadBox, overlay));
    toast('Imagen subida correctamente.');
  } catch (e) {
    toast(e.message, true);
    uploadBox.innerHTML = '📷 Haz clic para subir una imagen desde tu computador<input type="hidden" name="imagen_url" value="">';
  }
}

async function guardarEntrada(e, tipo, id, overlay) {
  e.preventDefault();
  const accion = e.submitter?.value || 'borrador';
  const form = new FormData(e.target);
  const data = { tipo };
  for (const [key, value] of form.entries()) data[key] = value;

  if (accion === 'publicar') { data.estado = 'publicado'; }
  else if (accion === 'programar') {
    if (!data.fecha_publicacion) { toast('Elige una fecha para programar la publicación.', true); return; }
    data.estado = 'programado';
  } else { data.estado = 'borrador'; }

  if (data.fecha_publicacion) {
    // El input datetime-local entrega la hora en el huso horario del navegador;
    // la convertimos a UTC porque D1 compara con datetime('now') en UTC.
    const local = new Date(data.fecha_publicacion);
    data.fecha_publicacion = local.toISOString().slice(0, 19).replace('T', ' ');
  }
  if (data.categoria_id === '') data.categoria_id = null;

  try {
    if (id) await api(`/admin/api/contenidos/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    else await api('/admin/api/contenidos', { method: 'POST', body: JSON.stringify(data) });
    toast('Guardado correctamente.');
    overlay.remove();
    cargarLista();
  } catch (err) {
    toast(err.message, true);
  }
}

/* ---------- Categorías ---------- */

async function cargarCategorias(tipo) {
  if (!state.categoriasCache[tipo]) {
    state.categoriasCache[tipo] = await api(`/admin/api/categorias?tipo=${tipo}`);
  }
  return state.categoriasCache[tipo];
}

async function renderCategorias() {
  const main = $('#adminContent');
  main.innerHTML = `
    <div class="admin-topbar"><h2>🏷️ Categorías</h2></div>
    <div class="toolbar">
      <select id="catTipo">
        ${Object.entries(TIPOS).filter(([, c]) => c.categoriaTipo).map(([key, c]) => `<option value="${c.categoriaTipo}">${c.label}</option>`).join('')}
      </select>
      <input type="text" id="catNombre" placeholder="Nombre de la nueva categoría">
      <button class="btn btn-gold btn-sm" id="btnCrearCat">+ Crear</button>
    </div>
    <div class="data-table-wrap"><div class="empty-state">Cargando…</div></div>
  `;

  async function cargar() {
    const tipo = $('#catTipo').value;
    const cats = await api(`/admin/api/categorias?tipo=${tipo}`);
    state.categoriasCache[tipo] = cats;
    const wrap = $('.data-table-wrap');
    wrap.innerHTML = cats.length ? `
      <table class="data-table">
        <thead><tr><th>Nombre</th><th>Slug</th><th>Acciones</th></tr></thead>
        <tbody>${cats.map(c => `
          <tr><td>${escapeHtml(c.nombre)}</td><td>${escapeHtml(c.slug)}</td>
          <td><button class="btn btn-danger btn-sm" data-cat-del="${c.id}">Eliminar</button></td></tr>`).join('')}
        </tbody>
      </table>` : `<div class="empty-state">No hay categorías para este tipo de contenido.</div>`;

    wrap.querySelectorAll('[data-cat-del]').forEach(btn => btn.addEventListener('click', async () => {
      if (!confirm('¿Eliminar esta categoría?')) return;
      await api(`/admin/api/categorias/${btn.dataset.catDel}`, { method: 'DELETE' });
      cargar();
    }));
  }

  $('#catTipo').addEventListener('change', cargar);
  $('#btnCrearCat').addEventListener('click', async () => {
    const tipo = $('#catTipo').value;
    const nombre = $('#catNombre').value.trim();
    if (!nombre) return;
    try {
      await api('/admin/api/categorias', { method: 'POST', body: JSON.stringify({ tipo, nombre }) });
      $('#catNombre').value = '';
      toast('Categoría creada.');
      cargar();
    } catch (e) { toast(e.message, true); }
  });

  cargar();
}

/* ---------- Arranque ---------- */

async function init() {
  try {
    const me = await api('/admin/api/me');
    $('#userPill').textContent = `Sesión: ${me.usuario}`;
  } catch {
    return;
  }
  $('#logoutBtn').addEventListener('click', async () => {
    await api('/admin/api/logout', { method: 'POST' });
    window.location.href = '/admin/login';
  });
  renderNav();
  renderLista();
}

document.addEventListener('DOMContentLoaded', init);
