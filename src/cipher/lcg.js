import { SYMBOLS, BASE, LINE_LEN, TOTAL, LCG_ROUNDS, DIGIT_PERM, DIGIT_PERM_INV } from './constants.js';

/**
 * Proper modular arithmetic that handles negative values
 * @param {bigint} a - The value to reduce
 * @param {bigint} m - The modulus
 * @returns {bigint} Result in range [0, m)
 */
export function bigMod(a, m) {
  const result = a % m;
  return result < 0n ? result + m : result;
}

/**
 * Extended Euclidean algorithm for BigInt
 * Returns { gcd, x, y } where gcd = a*x + b*y
 * @param {bigint} a
 * @param {bigint} b
 * @returns {{ gcd: bigint, x: bigint, y: bigint }}
 */
export function extendedGcd(a, b) {
  if (b === 0n) {
    return { gcd: a, x: 1n, y: 0n };
  }

  const { gcd, x: x1, y: y1 } = extendedGcd(b, a % b);
  const x = y1;
  const y = x1 - (a / b) * y1;

  return { gcd, x, y };
}

/**
 * Modular multiplicative inverse using extended GCD
 * @param {bigint} a - The value to invert
 * @param {bigint} m - The modulus
 * @returns {bigint} The inverse of a modulo m
 */
export function modInverse(a, m) {
  const { gcd, x } = extendedGcd(a, m);

  if (gcd !== 1n) {
    throw new Error('Modular inverse does not exist');
  }

  return bigMod(x, m);
}

/**
 * Convert BigInt to 80 base-29 digits, apply permutation, convert back
 * @param {bigint} num - Input number
 * @returns {bigint} Shuffled number
 */
export function shuffleDigits(num) {
  // Convert to 80 base-29 digits
  const digits = new Array(80);
  let temp = num;

  for (let i = 79; i >= 0; i--) {
    digits[i] = Number(temp % BASE);
    temp = temp / BASE;
  }

  // Apply permutation
  const shuffled = new Array(80);
  for (let i = 0; i < 80; i++) {
    shuffled[DIGIT_PERM[i]] = digits[i];
  }

  // Convert back to BigInt
  let result = 0n;
  for (let i = 0; i < 80; i++) {
    result = result * BASE + BigInt(shuffled[i]);
  }

  return result;
}

/**
 * Convert BigInt to 80 base-29 digits, apply inverse permutation, convert back
 * @param {bigint} num - Input number
 * @returns {bigint} Unshuffled number
 */
export function unshuffleDigits(num) {
  // Convert to 80 base-29 digits
  const digits = new Array(80);
  let temp = num;

  for (let i = 79; i >= 0; i--) {
    digits[i] = Number(temp % BASE);
    temp = temp / BASE;
  }

  // Apply inverse permutation
  const unshuffled = new Array(80);
  for (let i = 0; i < 80; i++) {
    unshuffled[DIGIT_PERM_INV[i]] = digits[i];
  }

  // Convert back to BigInt
  let result = 0n;
  for (let i = 0; i < 80; i++) {
    result = result * BASE + BigInt(unshuffled[i]);
  }

  return result;
}

/**
 * Encrypt: address → content
 * 4 rounds of: LCG step, then digit shuffle
 * @param {bigint} address - Line address
 * @returns {bigint} Content number
 */
export function encrypt(address) {
  let x = address;

  for (let round = 0; round < 4; round++) {
    const { a, b } = LCG_ROUNDS[round];

    // LCG step: x = (a * x + b) mod TOTAL
    x = bigMod(a * x + b, TOTAL);

    // Digit shuffle
    x = shuffleDigits(x);
  }

  return x;
}

/**
 * Decrypt: content → address
 * 4 rounds (reversed): unshuffle, then inverse LCG
 * @param {bigint} content - Content number
 * @returns {bigint} Line address
 */
export function decrypt(content) {
  let x = content;

  // Process rounds in reverse order
  for (let round = 3; round >= 0; round--) {
    const { a, b } = LCG_ROUNDS[round];

    // Inverse digit shuffle
    x = unshuffleDigits(x);

    // Inverse LCG: x_prev = modInverse(a, TOTAL) * (x - b) mod TOTAL
    const aInv = modInverse(a, TOTAL);
    x = bigMod(aInv * (x - b), TOTAL);
  }

  return x;
}

/**
 * Convert BigInt to character string using base-29 encoding
 * @param {bigint} num - Number to convert
 * @param {number} len - Desired string length
 * @returns {string} Character string
 */
export function bigintToChars(num, len) {
  const chars = new Array(len);
  for (let i = len - 1; i >= 0; i--) {
    chars[i] = SYMBOLS[Number(num % BASE)];
    num = num / BASE;
  }
  return chars.join('');
}

/**
 * Convert character string to BigInt using base-29 encoding
 * @param {string} str - Character string
 * @returns {bigint} Resulting number
 */
export function charsToBigint(str) {
  let num = 0n;
  for (let i = 0; i < str.length; i++) {
    const idx = SYMBOLS.indexOf(str[i]);
    if (idx === -1) continue;
    num = num * BASE + BigInt(idx);
  }
  return num;
}
