// 29 symbols: space, comma, period, a-z
export const SYMBOLS = ' ,.abcdefghijklmnopqrstuvwxyz';
export const BASE = 29n;
export const LINE_LEN = 80;
export const TOTAL = BASE ** 80n; // 29^80, the full content space

// Library structure
export const LINES_PER_PAGE = 40;
export const PAGES_PER_VOL = 410;
export const VOLS_PER_SHELF = 32;
export const SHELVES_PER_WALL = 5;
export const WALLS_PER_HEX = 4;
export const LINES_PER_VOL = PAGES_PER_VOL * LINES_PER_PAGE;      // 16,400
export const LINES_PER_SHELF = VOLS_PER_SHELF * LINES_PER_VOL;    // 524,800
export const LINES_PER_WALL = SHELVES_PER_WALL * LINES_PER_SHELF;  // 2,624,000
export const LINES_PER_HEX = WALLS_PER_HEX * LINES_PER_WALL;      // 10,496,000

// 4 LCG round keys from mathematical constants (NOT pi/e/phi like Mollick)
// Euler-Mascheroni gamma ≈ 0.5772156649...
// Catalan's constant ≈ 0.9159655941...
// Apéry's constant ζ(3) ≈ 1.2020569031...
// Khinchin's constant ≈ 2.6854520010...
export const LCG_ROUNDS = [
  { a: 577215664901532860606512090082402431042n, b: 362436069362436069362436069362436069362n },
  { a: 915965594177219015054603514932384110774n, b: 521288135003931818257312212568940493854n },
  { a: 120205690315959428539973816151144999076n, b: 694157382953428756017412963592033481532n },
  { a: 268545200106530644530971483548179569383n, b: 847203734825117396803953917486355627082n },
];

// 80-element digit permutation (for shuffling base-29 digits between LCG rounds)
// This is a fixed permutation generated from the first 80 digits of the Euler-Mascheroni constant
export const DIGIT_PERM = [
  57, 23, 71, 4, 39, 66, 12, 50, 33, 78,
  8, 45, 19, 62, 0, 35, 53, 76, 27, 41,
  15, 69, 3, 58, 31, 74, 10, 47, 22, 64,
  6, 37, 55, 79, 17, 43, 26, 60, 1, 51,
  14, 72, 36, 48, 20, 65, 9, 38, 56, 75,
  29, 44, 18, 63, 2, 34, 52, 77, 24, 40,
  13, 68, 5, 59, 30, 73, 11, 46, 21, 61,
  7, 42, 54, 70, 16, 49, 28, 67, 32, 25
];

// Inverse digit permutation (computed from DIGIT_PERM)
export const DIGIT_PERM_INV = new Array(80);
for (let i = 0; i < 80; i++) {
  DIGIT_PERM_INV[DIGIT_PERM[i]] = i;
}
