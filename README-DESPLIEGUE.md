# Fe y Esperanza — Sitio administrable (Cloudflare Workers + D1 + R2)

## 🔑 Acceso del panel en esta versión

- **Usuario:** `admin`
- **Contraseña:** `123456`

Estas credenciales ya vienen incluidas en `wrangler.jsonc` (como `vars`, no
como `wrangler secret`), así que funcionan apenas hagas `npm install` +
`npm run deploy`, sin ningún paso manual adicional.

### ⚠️ Un paso que sí es obligatorio si ya habías configurado secrets antes

Tu endpoint `/admin/api/estado` marcaba `configuradoCorrectamente:true`
porque ya tenías los 4 secrets (`ADMIN_USER`, `ADMIN_PASS_HASH`,
`ADMIN_PASS_SALT`, `SESSION_SECRET`) puestos con `wrangler secret put` en
un intento anterior — simplemente no correspondían a la contraseña que
esperabas. Ese *no* era un bug de lógica: `verifyCredentials()` siempre
comparó bien, sencillamente contra el hash equivocado.

**Cloudflare hace que un `secret` tenga siempre prioridad sobre un `var`
con el mismo nombre.** Si no borras esos 4 secrets antiguos, seguirán
"tapando" los valores nuevos de `admin` / `123456` que puse en
`wrangler.jsonc`, y el login volvería a fallar aunque el código esté
correcto. Este es un paso de una sola vez, ejecútalo antes de desplegar:

```bash
npx wrangler secret delete ADMIN_USER
npx wrangler secret delete ADMIN_PASS_HASH
npx wrangler secret delete ADMIN_PASS_SALT
npx wrangler secret delete SESSION_SECRET
```

(Si alguno de esos comandos dice que el secret no existe, ignóralo y
continúa con el siguiente.)

### Cómo cambiar la contraseña más adelante

No hace falta volver a usar `wrangler secret put`. Simplemente:

```bash
node scripts/hash-password.mjs "TuNuevaContraseñaSegura"
```

Copia los valores `ADMIN_PASS_SALT` y `ADMIN_PASS_HASH` que imprime, y
reemplázalos dentro de `wrangler.jsonc` (sección `vars`). Luego:

```bash
npm run deploy
```

### Nota de seguridad

Guardar la contraseña como `var` en lugar de `secret` significa que queda
en texto plano dentro de `wrangler.jsonc` (visible para quien tenga acceso
al repositorio, y visible en el dashboard de Cloudflare). Es razonable
para pruebas o para un sitio de bajo riesgo, pero si este panel maneja
algo sensible, te recomiendo cambiar `123456` por una contraseña real cuanto
antes y, en algún momento, considerar volver al esquema de `wrangler secret`
(el código ya es compatible con ambos, porque `env.ADMIN_USER` etc. se leen
igual sin importar si vinieron de un `var` o de un `secret`).

## ⚠️ Aviso importante sobre esta versión (corrección del login)

Esta versión reescribe por completo el sistema de autenticación y el panel
de administración. Diagnostiqué dos causas reales por las que el login no
funcionaba:

1. **Cloudflare, por defecto, no ejecuta tu Worker en rutas que coinciden
   con un archivo estático.** Como `/admin/index.html` y `/admin/login.html`
   existían como archivos físicos en `public/admin/`, Cloudflare los servía
   directamente sin pasar por tu código — el Worker nunca llegaba a
   comprobar la sesión. La solución: ahora `wrangler.jsonc` tiene
   `"run_worker_first": true`, y las páginas del panel (login y el panel en
   sí) ya no son archivos estáticos: las genera el propio Worker.
2. **Los secrets pueden traer un salto de línea invisible** si se pegaron
   con algunos métodos de copiado (por ejemplo `echo "valor" | wrangler
   secret put ...` añade un `\n` al final). Ese carácter de más rompe la
   comparación del hash y hace que el login falle siempre, aunque la
   contraseña sea correcta. La nueva versión limpia (`trim()`) los secrets
   antes de usarlos, así que este problema ya no debería ocurrir.

**No necesitas volver a configurar tus secrets.** Siguen siendo los mismos
cuatro: `ADMIN_USER`, `ADMIN_PASS_HASH`, `ADMIN_PASS_SALT`, `SESSION_SECRET`.

Si después de desplegar esta versión el login sigue sin funcionar, visita
`https://tu-dominio.com/admin/api/estado` — te dirá si el Worker está
detectando los 4 secrets correctamente (sin revelar sus valores).

---


Este proyecto conserva exactamente el mismo diseño, SEO, páginas y rutas de tu
sitio original, y le añade un panel de administración privado desde el que
puedes publicar contenido sin volver a tocar HTML ni generar un ZIP nuevo.

## ¿Qué cambió por dentro (y qué NO cambió)?

- **No cambió:** el diseño (`style.css`), la estructura de `index.html`,
  `oraciones.html`, `frases.html`, `acerca-de-nosotros.html`,
  `politica-de-privacidad.html`, la verificación de Google Search Console,
  las etiquetas SEO/Open Graph, `robots.txt`.
- **Cambió por dentro (invisible para el visitante):** el sitio ahora corre
  como un Cloudflare Worker. Los archivos `data/oraciones-data.js` y
  `data/frases-data.js` ya no son archivos fijos: el Worker los genera al
  vuelo leyendo tu base de datos D1, con el mismo formato de siempre, así que
  `oraciones.js` y `frases.js` siguen funcionando sin cambios.
- **Nuevo:** un panel de administración en `/admin`, una base de datos D1
  (`contenidos`, `categorias`), un bucket R2 para las imágenes, páginas
  automáticas para cada devocional/artículo (`/devocional/tu-titulo`) y un
  `sitemap.xml` que se genera solo con cada publicación.

## 1. Requisitos previos

- Cuenta de Cloudflare (plan gratuito es suficiente para empezar).
- [Node.js](https://nodejs.org) 18 o superior instalado en tu computador.
- El CLI de Cloudflare, `wrangler` (se instala solo con `npm install`).

## 2. Instalar dependencias

Abre una terminal dentro de la carpeta del proyecto y ejecuta:

```bash
npm install
```

Inicia sesión con tu cuenta de Cloudflare:

```bash
npx wrangler login
```

## 3. Crear la base de datos D1

```bash
npx wrangler d1 create feyesperanza_db
```

Este comando te entrega un `database_id`. Copia ese valor y pégalo en
`wrangler.jsonc`, reemplazando `REEMPLAZA_CON_TU_DATABASE_ID`.

Luego crea las tablas (esquema + categorías por defecto):

```bash
npm run db:init
```

## 4. Crear el bucket R2 para las imágenes

```bash
npx wrangler r2 bucket create feyesperanza-imagenes
```

El nombre ya está configurado en `wrangler.jsonc` (`feyesperanza-imagenes`).
Si prefieres otro nombre, créalo con ese nombre y actualiza el archivo.

## 5. Configurar tu usuario y contraseña de administrador

Las credenciales del panel **no se guardan en la base de datos**: viven como
variables secretas del Worker, para mayor seguridad. Genera el hash de tu
contraseña:

```bash
node scripts/hash-password.mjs "TuContraseñaSegura123!"
```

El script te mostrará dos valores (`ADMIN_PASS_SALT` y `ADMIN_PASS_HASH`).
Configura los 4 secrets necesarios (te los pedirá uno por uno):

```bash
npx wrangler secret put ADMIN_USER
npx wrangler secret put ADMIN_PASS_SALT
npx wrangler secret put ADMIN_PASS_HASH
npx wrangler secret put SESSION_SECRET
```

- `ADMIN_USER`: el usuario con el que iniciarás sesión (ej. `admin`).
- `ADMIN_PASS_SALT` y `ADMIN_PASS_HASH`: los valores que te dio el script.
- `SESSION_SECRET`: cualquier texto largo y aleatorio (ej. genera uno con
  `openssl rand -hex 32`). Se usa para firmar la cookie de sesión.

> Si más adelante quieres cambiar la contraseña, vuelve a correr
> `node scripts/hash-password.mjs "NuevaContraseña"` y actualiza los secrets
> `ADMIN_PASS_SALT` y `ADMIN_PASS_HASH` con `wrangler secret put`.

## 6. Desplegar

```bash
npm run deploy
```

Wrangler te dará una URL tipo `https://fe-y-esperanza.tu-cuenta.workers.dev`.
Para usar tu dominio propio (`www.feyesperanza.com`), agrégalo desde el panel
de Cloudflare en **Workers & Pages → tu Worker → Settings → Domains & Routes**,
tal como ya lo tenías configurado.

## 7. Iniciar sesión en el panel

1. Ve a `https://tu-dominio.com/admin` (si no has iniciado sesión, verás
   directamente el formulario de acceso).
2. Ingresa el `ADMIN_USER` y la contraseña que definiste en el paso 5.
3. Verás el panel con las secciones: **Oraciones, Frases Diarias,
   Reflexiones, Devocionales/Artículos, Versículos y Categorías.**

## 8. Cómo usar el panel

### Crear contenido
1. Entra a la sección correspondiente (por ejemplo, "Devocionales").
2. Pulsa **"+ Nueva entrada"**.
3. Completa los campos. Si es un devocional, puedes subir una imagen
   haciendo clic en el recuadro de imagen y seleccionándola desde tu
   computador (se guarda automáticamente en Cloudflare R2).
4. Elige qué hacer con el botón correspondiente:
   - **Guardar borrador**: no aparece en el sitio todavía.
   - **Programar**: elige fecha/hora de publicación y no aparecerá en el
     sitio hasta que llegue ese momento (revisado cada 15 minutos).
   - **Publicar**: aparece de inmediato en el sitio, en su categoría
     correspondiente, y el `sitemap.xml` se actualiza solo.

### Categorías
Ve a la pestaña **Categorías**, elige el tipo de contenido y escribe el
nombre de la nueva categoría. Aparecerá disponible de inmediato al crear
o editar una entrada de ese tipo.

### Editar o eliminar
En cualquier listado, usa los botones **Editar** o **Eliminar** de cada fila.

### Notas por tipo de contenido
- **Oraciones**: elige una categoría (mañana, noche, familia, etc.). El
  campo "fecha especial" (MM-DD) es opcional y sirve para fechas fijas del
  calendario como Navidad o Año Nuevo — igual que en el sitio original.
- **Frases Diarias**: si defines una fecha de publicación, esa frase se
  mostrará como "frase del día" en esa fecha exacta. Si la dejas vacía, se
  suma al banco general que rota automáticamente.
- **Reflexiones**: aparecen en la sección "Reflexiones Diarias" de la
  portada (se muestran las más recientes).
- **Devocionales/Artículos**: aparecen en la sección "Artículos" de la
  portada y generan automáticamente su propia página en
  `/devocional/tu-titulo`, con SEO propio (usa los campos "Título SEO" y
  "Descripción SEO" si quieres personalizarlo).
- **Versículos**: alimentan el "Versículo del día" y el botón
  "Otro versículo" de la portada.

## 9. Preguntas frecuentes

**¿Necesito tocar HTML para publicar contenido nuevo?** No. Todo se hace
desde `/admin`.

**¿El sitemap se actualiza solo?** Sí, `/sitemap.xml` se genera en cada
solicitud a partir de lo que esté publicado en la base de datos.

**¿Se mantiene la verificación de Google Search Console?** Sí, la etiqueta
`google-site-verification` de `index.html` no se tocó.

**¿Puedo seguir editando `oraciones.html`, `frases.html`, etc. a mano?**
Podrías, pero ya no hace falta: todo su contenido ahora vive en el panel.

**¿Qué pasa con `GUIA-DE-EDICION.md`?** Ese archivo describía el flujo
manual anterior y ya no aplica; consérvalo solo como referencia histórica
si quieres, pero esta guía (`README-DESPLIEGUE.md`) es la vigente.

## 10. Desarrollo local (opcional)

```bash
npm run db:init:local
npm run dev
```

Esto levanta el sitio en `http://localhost:8787` con una base de datos D1
local de prueba (los secrets de administrador debes definirlos en un
archivo `.dev.vars` en la raíz del proyecto, con este formato):

```
ADMIN_USER=admin
ADMIN_PASS_SALT=...
ADMIN_PASS_HASH=...
SESSION_SECRET=una-clave-larga-de-prueba
```
