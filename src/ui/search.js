import { uiState } from './state.js';
import { searchText } from '../cipher/library-math.js';
import { openBook } from './reader.js';

let lastSearchResult = null;
let worldManager = null;
let unlockFn = null;

export function initSearch(world, unlock) {
  worldManager = world;
  unlockFn = unlock;

  const input = document.getElementById('search-input');
  if (input) {
    input.addEventListener('input', updateCharCounter);
  }
}

function updateCharCounter() {
  const input = document.getElementById('search-input');
  const counter = document.getElementById('char-counter');
  if (!input || !counter) return;

  const len = input.value.length;
  counter.textContent = `(${len}/80 characters)`;
  counter.style.color = len > 80 ? '#d4a03a' : '#5a4a32';
}

export function openSearch() {
  document.getElementById('search-panel').classList.add('visible');
  uiState.searchOpen = true;
  if (unlockFn) unlockFn();

  setTimeout(() => {
    const input = document.getElementById('search-input');
    if (input) {
      input.focus();
      updateCharCounter();
    }
  }, 300);
}

export function closeSearch() {
  document.getElementById('search-panel').classList.remove('visible');
  uiState.searchOpen = false;
}

export function performSearch() {
  const input = document.getElementById('search-input');
  if (!input || !input.value.trim()) return;

  const resultEl = document.getElementById('search-result');
  resultEl.innerHTML = '<p style="color:#8b7355;font-style:italic;">Locating text in the Library...</p>';

  setTimeout(() => {
    const result = searchText(input.value);
    lastSearchResult = result;

    const hexStr = result.hexId.toString(36).toUpperCase();
    const displayHex = hexStr.length > 20
      ? hexStr.substring(0, 10) + '...' + hexStr.substring(hexStr.length - 10)
      : hexStr;

    resultEl.innerHTML = `
      <div class="result-found">
        <p>This text exists in the Library.</p>
        <div class="result-coords">
          <div>Hexagon: ${displayHex}</div>
          <div>Wall: ${result.wall + 1} &middot; Shelf: ${result.shelf + 1} &middot; Volume: ${result.vol + 1}</div>
          <div>Page: ${result.page + 1} &middot; Line: ${result.line + 1}</div>
        </div>
        <button id="go-to-search-result">Go There</button>
        <p style="font-size:12px;color:#5a4a32;margin-top:12px;font-style:italic;">It has always been here.</p>
      </div>
    `;

    document.getElementById('go-to-search-result').addEventListener('click', goToSearchResult);
  }, 400);
}

function goToSearchResult() {
  if (!lastSearchResult || !worldManager) return;
  const r = lastSearchResult;
  closeSearch();

  worldManager.teleportTo(r.hexId, () => {
    openBook(r.hexId, r.wall, r.shelf, r.vol, r.page);

    // Highlight the search line
    setTimeout(() => {
      const content = document.getElementById('reader-content');
      const lines = content.textContent.split('\n');
      content.innerHTML = lines.map((line, i) =>
        i === r.line
          ? `<span class="highlight">${escapeHtml(line)}</span>`
          : escapeHtml(line)
      ).join('\n');
    }, 50);
  });
}

function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
