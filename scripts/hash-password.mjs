// Genera ADMIN_PASS_SALT y ADMIN_PASS_HASH para configurar como secrets del Worker.
// Uso:  node scripts/hash-password.mjs "tu-contraseña-segura"
import { webcrypto } from 'node:crypto';

const password = process.argv[2];
if (!password) {
  console.error('Uso: node scripts/hash-password.mjs "tu-contraseña"');
  process.exit(1);
}

function bufToHex(buf) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

const saltBytes = webcrypto.getRandomValues(new Uint8Array(16));
const saltHex = bufToHex(saltBytes.buffer);

const enc = new TextEncoder();
const keyMaterial = await webcrypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
const bits = await webcrypto.subtle.deriveBits(
  { name: 'PBKDF2', salt: saltBytes, iterations: 100000, hash: 'SHA-256' },
  keyMaterial,
  256
);
const hashHex = bufToHex(bits);

console.log('\nGuarda estos dos valores como secrets de tu Worker:\n');
console.log(`ADMIN_PASS_SALT = ${saltHex}`);
console.log(`ADMIN_PASS_HASH = ${hashHex}`);
console.log('\nComandos:');
console.log(`  wrangler secret put ADMIN_PASS_SALT   (pega: ${saltHex})`);
console.log(`  wrangler secret put ADMIN_PASS_HASH   (pega: ${hashHex})`);
