import { uiState } from './state.js';
import { generatePage } from '../cipher/library-math.js';
import { PAGES_PER_VOL } from '../cipher/constants.js';
import { scanForVindications, recordVindications, highlightVindications } from '../lore/vindications.js';
import { isCatalogBook, getCatalogLines } from '../lore/catalog.js';
import { updateHUD } from './hud.js';

let currentBook = null;
let unlockFn = null;

export function initReader(unlock) {
  unlockFn = unlock;
}

export function openBook(hexId, wall, shelf, vol, page = 0) {
  currentBook = { hexId, wall, shelf, vol, page };

  // Check if this is the catalog book
  let lines;
  if (isCatalogBook(hexId, wall, shelf, vol, page)) {
    lines = getCatalogLines();
  } else {
    lines = generatePage(hexId, wall, shelf, vol, page);
  }

  // Vindication scan
  const vindications = scanForVindications(lines);
  if (vindications.length > 0) {
    recordVindications(vindications, { hexId, wall, shelf, vol, page });
    updateHUD();
  }

  // Update reader UI
  document.getElementById('reader-title').textContent = `Volume ${vol + 1} of 32`;

  const hexStr = hexId.toString(36).toUpperCase();
  const displayHex = hexStr.length > 16
    ? hexStr.substring(0, 8) + '...' + hexStr.substring(hexStr.length - 8)
    : hexStr;
  document.getElementById('reader-coords').textContent =
    `Hex ${displayHex} \u00B7 Wall ${wall + 1} \u00B7 Shelf ${shelf + 1}`;

  document.getElementById('reader-page-num').textContent =
    `Page ${page + 1} of ${PAGES_PER_VOL}`;

  // Render content with vindication highlights
  const contentEl = document.getElementById('reader-content');
  if (vindications.length > 0) {
    contentEl.innerHTML = highlightVindications(lines, vindications);
  } else {
    contentEl.textContent = lines.join('\n');
  }

  // Room type indicator
  const roomIndicator = document.getElementById('reader-room-type');
  if (roomIndicator) {
    roomIndicator.textContent = '';
  }

  document.getElementById('reader').classList.add('visible');
  document.getElementById('prev-page-btn').disabled = (page === 0);
  document.getElementById('next-page-btn').disabled = (page === PAGES_PER_VOL - 1);

  uiState.readerOpen = true;
}

export function closeBook() {
  document.getElementById('reader').classList.remove('visible');
  uiState.readerOpen = false;
  currentBook = null;
}

export function nextPage() {
  if (!currentBook) return;
  if (currentBook.page < PAGES_PER_VOL - 1) {
    currentBook.page++;
    openBook(currentBook.hexId, currentBook.wall, currentBook.shelf, currentBook.vol, currentBook.page);
  }
}

export function prevPage() {
  if (!currentBook) return;
  if (currentBook.page > 0) {
    currentBook.page--;
    openBook(currentBook.hexId, currentBook.wall, currentBook.shelf, currentBook.vol, currentBook.page);
  }
}

export function getCurrentBook() {
  return currentBook;
}
