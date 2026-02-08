/**
 * The Man of the Book — Easter egg quest
 *
 * "On some shelf in some hexagon, men reasoned, there must exist a book
 * which is the formula and perfect compendium of all the rest: some
 * librarian has gone through it and he is analogous to a god."
 *
 * Three clues are scattered across the library, triggered by specific
 * line addresses. Finding all three reveals the location of a special
 * book that contains a meta-description of the Library itself.
 */

const CLUE_TRIGGERS = [
  777777n,   // Clue 1
  1234567n,  // Clue 2
  7777777n,  // Clue 3
];

const CLUE_TEXTS = [
  'the catalog of catalogs speaks from hexagon two seven one eight two eight',
  'seek the book of the man who has read all books on wall three shelf two',
  'volume seventeen page one reveals what the library knows of itself',
];

const CATALOG_HEX = 271828182845n;
const CATALOG_WALL = 2;
const CATALOG_SHELF = 1;
const CATALOG_VOL = 16;
const CATALOG_PAGE = 0;

const CATALOG_DESCRIPTION = [
  'this volume contains the index of indices. it is the',
  'compendium that the librarians sought for centuries.',
  'within these pages the library describes itself, its',
  'structure, its infinite hexagonal galleries, the',
  'twenty nine symbols, the four hundred ten pages of',
  'each volume, the thirty two volumes on each shelf,',
  'the five shelves on each wall, the four walls of',
  'books, and the two passages that connect each room',
  'to its neighbors. the ventilation shaft that barely',
  'suffices, the spiral staircase that plunges into',
  'the abyss and rises to distant heights. the mirror',
  'that faithfully duplicates appearances. the library',
  'is a sphere whose exact center is any hexagon and',
  'whose circumference is inaccessible. you who read',
  'these words, you are that librarian, analogous to',
  'a god.',
];

const QUEST_KEY = 'babel_catalog_clues';

export function getFoundClues() {
  try {
    const data = localStorage.getItem(QUEST_KEY);
    return data ? JSON.parse(data) : [false, false, false];
  } catch {
    return [false, false, false];
  }
}

function saveClues(clues) {
  try {
    localStorage.setItem(QUEST_KEY, JSON.stringify(clues));
  } catch { /* ignore */ }
}

/**
 * Check if a line address matches any clue trigger
 * @param {bigint} lineAddress
 * @returns {{ clueIndex: number, text: string } | null}
 */
export function checkForClue(lineAddress) {
  const remainder = lineAddress % 100000n;
  for (let i = 0; i < CLUE_TRIGGERS.length; i++) {
    // Clue triggers: lineAddress that ends with the trigger value
    if (lineAddress > 0n && lineAddress % (CLUE_TRIGGERS[i] * 100n) < 100n) {
      const clues = getFoundClues();
      if (!clues[i]) {
        clues[i] = true;
        saveClues(clues);
        return { clueIndex: i, text: CLUE_TEXTS[i] };
      }
    }
  }
  return null;
}

/**
 * Check if the currently viewed book is the Catalog
 */
export function isCatalogBook(hexId, wall, shelf, vol, page) {
  return hexId === CATALOG_HEX
    && wall === CATALOG_WALL
    && shelf === CATALOG_SHELF
    && vol === CATALOG_VOL
    && page === CATALOG_PAGE;
}

/**
 * Get the catalog page lines (overrides cipher output for display)
 */
export function getCatalogLines() {
  // Pad to 40 lines
  const lines = [...CATALOG_DESCRIPTION];
  while (lines.length < 40) {
    lines.push(' '.repeat(80));
  }
  return lines.map(l => l.padEnd(80, ' ').substring(0, 80));
}

export function getAllCluesFound() {
  return getFoundClues().every(c => c);
}
