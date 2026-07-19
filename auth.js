// =========================================================
// FE Y ESPERANZA — AUTENTICACIÓN DEL PANEL (v2, reescrita)
// =========================================================
// Cambios clave respecto a la versión anterior:
//  - Usa los helpers oficiales de Hono para cookies (getCookie/setCookie/
//    deleteCookie) en lugar de parseo manual de encabezados.
//  - Expone verifyCredentials() con mensajes de error explícitos para
//    diagnosticar rápido si faltan secrets o si el hash no coincide.
//  - La sesión sigue sin tocar D1: es una cookie firmada con HMAC-SHA256,
//    usando SESSION_SECRET. Las credenciales del admin siguen viviendo
//    como secrets del Worker (ADMIN_USER, ADMIN_PASS_HASH, ADMIN_PASS_SALT),
//    tal como ya las tienes configuradas.

import { getCookie, setCookie, deleteCookie } from 'hono/cookie';

export const COOKIE_NAME = 'fe_admin_session';
const SESSION_HOURS = 12;

function bufToHex(buf) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function hexToBuf(hex) {
  const clean = (hex || '').trim();
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(clean.substr(i * 2, 2), 16);
  return bytes.buffer;
}

function b64urlEncode(str) {
  return btoa(unescape(encodeURIComponent(str))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(str) {
  let s = str.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return decodeURIComponent(escape(atob(s)));
}

export async function hashPassword(password, saltHex) {
  const enc = new TextEncoder();
  const saltBuf = hexToBuf(saltHex);
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: saltBuf, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  return bufToHex(bits);
}

function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function hmac(secret, data) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return bufToHex(sig);
}

// Comprueba que los 4 secrets necesarios existan. Devuelve una lista de
// los que faltan (vacía si todo está bien) para poder dar un error claro.
export function secretsFaltantes(env) {
  const requeridos = ['ADMIN_USER', 'ADMIN_PASS_HASH', 'ADMIN_PASS_SALT', 'SESSION_SECRET'];
  return requeridos.filter((k) => !env[k] || String(env[k]).trim() === '');
}

export async function verifyCredentials(env, usuario, password) {
  const faltantes = secretsFaltantes(env);
  if (faltantes.length) {
    throw new Error(`Faltan estos secrets en el Worker: ${faltantes.join(', ')}. Configúralos con "wrangler secret put".`);
  }
  if ((usuario || '').trim() !== env.ADMIN_USER.trim()) return false;
  const computed = await hashPassword(password, env.ADMIN_PASS_SALT);
  return timingSafeEqual(computed, env.ADMIN_PASS_HASH.trim().toLowerCase());
}

// Diagnóstico temporal: compara usuario/hash/salt SIN exponer valores
// completos ni la contraseña recibida. Pensado para borrarse en cuanto
// se identifique el problema (ver /admin/api/debug-login en index.js).
export async function debugCredentials(env, usuario, password) {
  const faltantes = secretsFaltantes(env);
  if (faltantes.length) {
    return { error: `Faltan secrets: ${faltantes.join(', ')}` };
  }

  const usuarioCoincide = (usuario || '').trim() === env.ADMIN_USER.trim();

  const saltHex = (env.ADMIN_PASS_SALT || '').trim();
  const saltValido = /^[0-9a-fA-F]+$/.test(saltHex) && saltHex.length > 0 && saltHex.length % 2 === 0;

  let hashCalculado = '';
  let hashCoincide = false;
  if (saltValido) {
    hashCalculado = await hashPassword(password, saltHex);
    const hashGuardadoFull = (env.ADMIN_PASS_HASH || '').trim().toLowerCase();
    hashCoincide = timingSafeEqual(hashCalculado, hashGuardadoFull);
  }

  const hashGuardado = (env.ADMIN_PASS_HASH || '').trim().toLowerCase();

  return {
    usuarioCoincide,
    saltValido,
    hashCoincide,
    hashCalculado: hashCalculado ? hashCalculado.slice(0, 8) : null,
    hashGuardado: hashGuardado ? hashGuardado.slice(0, 8) : null,
    // Pistas extra, sin exponer valores completos:
    longitudSaltGuardado: saltHex.length,
    longitudHashGuardado: hashGuardado.length,
  };
}

export async function createSession(c, usuario) {
  const payload = JSON.stringify({ u: usuario, exp: Date.now() + SESSION_HOURS * 3600 * 1000 });
  const payloadB64 = b64urlEncode(payload);
  const sig = await hmac(c.env.SESSION_SECRET, payloadB64);
  const value = `${payloadB64}.${sig}`;

  setCookie(c, COOKIE_NAME, value, {
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    maxAge: SESSION_HOURS * 3600,
  });
}

export function destroySession(c) {
  deleteCookie(c, COOKIE_NAME, { path: '/' });
}

export async function getSession(c) {
  const raw = getCookie(c, COOKIE_NAME);
  if (!raw) return null;
  const [payloadB64, sig] = raw.split('.');
  if (!payloadB64 || !sig) return null;

  if (!c.env.SESSION_SECRET) return null;
  const expectedSig = await hmac(c.env.SESSION_SECRET, payloadB64);
  if (!timingSafeEqual(sig, expectedSig)) return null;

  try {
    const payload = JSON.parse(b64urlDecode(payloadB64));
    if (!payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}
