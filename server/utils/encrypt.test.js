/**
 * Unit tests for encryption util. Run from repo root: node server/utils/encrypt.test.js
 */
process.env.OPENAI_KEY_ENC_SECRET = '0'.repeat(64);

import { encrypt, decrypt } from './encrypt.js';

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const plain = 'sk-test-secret-key';
const cipher = encrypt(plain);
assert(typeof cipher === 'string', 'encrypt returns string');
assert(cipher.includes(':'), 'cipher has iv:tag:body format');
assert(cipher !== plain, 'cipher is not plaintext');

const dec = decrypt(cipher);
assert(dec === plain, 'decrypt(encrypt(x)) === x');

assert(decrypt('bad') === null, 'invalid cipher returns null');
// Tamper ciphertext so auth verification fails
const parts = cipher.split(':');
assert(parts.length === 3, 'cipher has 3 parts');
const tamperedBody = parts[2].length > 2 ? parts[2].slice(0, -2) + 'XX' : 'XX';
const tampered = `${parts[0]}:${parts[1]}:${tamperedBody}`;
assert(decrypt(tampered) === null, 'tampered cipher returns null');

// Different plaintext -> different cipher (IV is random)
const cipher2 = encrypt(plain);
assert(decrypt(cipher2) === plain, 'second encrypt round-trips');
assert(cipher !== cipher2, 'two encrypts differ (random IV)');

console.log('encrypt.test.js: all assertions passed');
process.exit(0);
