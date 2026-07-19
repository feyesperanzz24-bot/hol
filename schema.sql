-- =========================================================
-- FE Y ESPERANZA — ESQUEMA DE BASE DE DATOS (Cloudflare D1)
-- =========================================================

CREATE TABLE IF NOT EXISTS categorias (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo TEXT NOT NULL,           -- 'oracion' | 'frase' | 'reflexion' | 'devocional' | 'versiculo'
  nombre TEXT NOT NULL,
  slug TEXT NOT NULL,
  UNIQUE(tipo, slug)
);

CREATE TABLE IF NOT EXISTS contenidos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo TEXT NOT NULL,           -- 'oracion' | 'frase' | 'reflexion' | 'devocional' | 'versiculo'
  titulo TEXT,
  slug TEXT,
  resumen TEXT,
  contenido TEXT,
  referencia TEXT,              -- referencia bíblica, o etiqueta "Día · Tema" en reflexiones
  categoria_id INTEGER REFERENCES categorias(id) ON DELETE SET NULL,
  imagen_url TEXT,
  youtube_url TEXT,
  seo_titulo TEXT,
  seo_descripcion TEXT,
  estado TEXT NOT NULL DEFAULT 'borrador',  -- 'borrador' | 'programado' | 'publicado'
  fecha_publicacion TEXT,       -- ISO datetime (para orden, "frase del día" y programación)
  fecha_especial TEXT,          -- formato MM-DD, solo para oraciones ligadas a un día del calendario
  orden INTEGER DEFAULT 0,
  creado_en TEXT DEFAULT (datetime('now')),
  actualizado_en TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_contenidos_tipo_estado ON contenidos(tipo, estado, fecha_publicacion);
CREATE INDEX IF NOT EXISTS idx_contenidos_slug ON contenidos(tipo, slug);
CREATE INDEX IF NOT EXISTS idx_contenidos_especial ON contenidos(tipo, fecha_especial);

-- ---------------------------------------------------------
-- Categorías por defecto (coinciden con el sitio original)
-- ---------------------------------------------------------
INSERT OR IGNORE INTO categorias (tipo, nombre, slug) VALUES
  ('oracion', 'Mañana', 'manana'),
  ('oracion', 'Noche', 'noche'),
  ('oracion', 'Familia', 'familia'),
  ('oracion', 'Agradecimiento', 'agradecimiento'),
  ('oracion', 'Sanidad', 'sanidad'),
  ('oracion', 'Momentos difíciles', 'dificil'),
  ('frase', 'Fe', 'fe'),
  ('frase', 'Esperanza', 'esperanza'),
  ('frase', 'Amor de Dios', 'amor'),
  ('frase', 'Reflexión', 'reflexion'),
  ('frase', 'Motivación', 'motivacion'),
  ('devocional', 'Fe', 'fe'),
  ('devocional', 'Familia', 'familia'),
  ('devocional', 'Oración', 'oracion'),
  ('devocional', 'Esperanza', 'esperanza'),
  ('devocional', 'Jóvenes', 'jovenes');
