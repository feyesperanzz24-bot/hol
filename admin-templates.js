// =========================================================
// FE Y ESPERANZA — PLANTILLAS DEL PANEL DE ADMINISTRACIÓN
// =========================================================
// Estas páginas ahora las genera el propio Worker (en vez de ser archivos
// estáticos en /public/admin/). Esto garantiza que SIEMPRE pasen por
// nuestro código, sin importar la configuración de assets/run_worker_first.
// El CSS y el JS del panel sí siguen siendo archivos estáticos normales
// (public/admin/admin.css y public/admin/admin.js): no contienen nada
// sensible, así que no necesitan pasar por el Worker.

export function loginPageHtml(error = '') {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Iniciar sesión | Panel Fe y Esperanza</title>
<meta name="robots" content="noindex, nofollow">
<link rel="icon" type="image/png" href="/assets/favicon-32.png">
<link rel="stylesheet" href="/admin/admin.css">
</head>
<body>
  <div class="login-wrap">
    <form class="login-card" id="loginForm" method="post" action="/admin/api/login">
      <img src="/assets/logo.png" alt="Fe y Esperanza">
      <h1>Panel de Administración</h1>
      <p class="sub">Fe y Esperanza</p>

      <label for="usuario">Usuario</label>
      <input type="text" id="usuario" name="usuario" autocomplete="username" required autofocus>

      <label for="password">Contraseña</label>
      <input type="password" id="password" name="password" autocomplete="current-password" required>

      <button type="submit" class="login-btn">Iniciar sesión</button>
      <p class="login-error" id="loginError">${error ? escapeHtml(error) : ''}</p>
    </form>
  </div>

  <script>
    const form = document.getElementById('loginForm');
    const errorEl = document.getElementById('loginError');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorEl.textContent = '';
      const usuario = document.getElementById('usuario').value.trim();
      const password = document.getElementById('password').value;

      try {
        const res = await fetch('/admin/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ usuario, password }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          errorEl.textContent = data.error || 'Usuario o contraseña incorrectos.';
          return;
        }
        window.location.href = '/admin';
      } catch (err) {
        errorEl.textContent = 'Error de conexión. Intenta de nuevo.';
      }
    });
  </script>
</body>
</html>`;
}

export function adminShellHtml(usuario) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Panel de Administración | Fe y Esperanza</title>
<meta name="robots" content="noindex, nofollow">
<link rel="icon" type="image/png" href="/assets/favicon-32.png">
<link rel="stylesheet" href="/admin/admin.css">
</head>
<body>
  <div class="admin-shell">
    <aside class="admin-sidebar">
      <div class="brand">
        <img src="/assets/logo.png" alt="Fe y Esperanza">
        <span>Fe &amp; Esperanza</span>
      </div>
      <ul class="admin-nav" id="adminNav"></ul>
      <button class="logout-btn" id="logoutBtn">Cerrar sesión</button>
    </aside>
    <main class="admin-main">
      <div class="admin-topbar">
        <span class="user-pill" id="userPill">Sesión: ${escapeHtml(usuario)}</span>
      </div>
      <div id="adminContent">Cargando panel…</div>
    </main>
  </div>

  <script src="/admin/admin.js"></script>
</body>
</html>`;
}

function escapeHtml(str) {
  return (str ?? '').toString()
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
