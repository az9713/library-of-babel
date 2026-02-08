import {
  TOTAL,
  LINES_PER_HEX,
  LINES_PER_WALL,
  LINES_PER_SHELF,
  LINES_PER_VOL,
  LINES_PER_PAGE,
  PAGES_PER_VOL,
  VOLS_PER_SHELF,
  SHELVES_PER_WALL,
  WALLS_PER_HEX,
  LINE_LEN,
  SYMBOLS
} from './constants.js';
import { encrypt, decrypt, bigintToChars, charsToBigint, bigMod } from './lcg.js';

/**
 * Convert library coordinates to a line address
 * @param {bigint} hexId - Hexagon identifier
 * @param {number} wall - Wall number (0-3)
 * @param {number} shelf - Shelf number (0-4)
 * @param {number} vol - Volume number (0-31)
 * @param {number} page - Page number (0-409)
 * @param {number} line - Line number (0-39)
 * @returns {bigint} Line address
 */
export function coordsToLineAddress(hexId, wall, shelf, vol, page, line) {
  return bigMod(
    hexId * BigInt(LINES_PER_HEX)
    + BigInt(wall * LINES_PER_WALL + shelf * LINES_PER_SHELF
    + vol * LINES_PER_VOL + page * LINES_PER_PAGE + line),
    TOTAL
  );
}

/**
 * Convert line address to library coordinates
 * @param {bigint} addr - Line address
 * @returns {{ hexId: bigint, wall: number, shelf: number, vol: number, page: number, line: number }}
 */
export function lineAddressToCoords(addr) {
  const localBig = addr % BigInt(LINES_PER_HEX);
  const hexId = addr / BigInt(LINES_PER_HEX);
  let local = Number(localBig);

  const line = local % LINES_PER_PAGE;
  local = Math.floor(local / LINES_PER_PAGE);

  const page = local % PAGES_PER_VOL;
  local = Math.floor(local / PAGES_PER_VOL);

  const vol = local % VOLS_PER_SHELF;
  local = Math.floor(local / VOLS_PER_SHELF);

  const shelf = local % SHELVES_PER_WALL;
  local = Math.floor(local / SHELVES_PER_WALL);

  const wall = local % WALLS_PER_HEX;

  return { hexId, wall, shelf, vol, page, line };
}

/**
 * Generate a full page of content (40 lines)
 * @param {bigint} hexId - Hexagon identifier
 * @param {number} wall - Wall number (0-3)
 * @param {number} shelf - Shelf number (0-4)
 * @param {number} vol - Volume number (0-31)
 * @param {number} page - Page number (0-409)
 * @returns {string[]} Array of 40 lines of text
 */
export function generatePage(hexId, wall, shelf, vol, page) {
  const lines = [];
  for (let l = 0; l < LINES_PER_PAGE; l++) {
    const addr = coordsToLineAddress(hexId, wall, shelf, vol, page, l);
    const contentNum = encrypt(addr);
    lines.push(bigintToChars(contentNum, LINE_LEN));
  }
  return lines;
}

/**
 * Search for text and return the coordinates where it appears
 * @param {string} text - Text to search for
 * @returns {{ hexId: bigint, wall: number, shelf: number, vol: number, page: number, line: number }}
 */
export function searchText(text) {
  // Normalize text: lowercase and filter to valid symbols
  text = text.toLowerCase().replace(/[^a-z ,.]/g, '');

  // Pad or truncate to exactly 80 characters
  text = text.padEnd(LINE_LEN, ' ').substring(0, LINE_LEN);

  // Convert to content number
  const contentNum = charsToBigint(text);

  // Decrypt to find address
  const addr = decrypt(contentNum);

  // Convert to coordinates
  return lineAddressToCoords(addr);
}
