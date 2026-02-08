import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

import { WorldManager } from './world/manager.js';
import { Navigation } from './world/navigation.js';
import { Interaction } from './world/interaction.js';

import { generatePage, searchText, coordsToLineAddress } from './cipher/library-math.js';
import { PAGES_PER_VOL } from './cipher/constants.js';

import { updateLightFlicker } from './atmosphere/lighting.js';
import { ParticleSystem } from './atmosphere/particles.js';
import { AmbientAudio } from './atmosphere/audio.js';

import {
  scanForVindications,
  recordVindications,
  highlightVindications,
  getVindicationCount,
  getVindicationLog,
} from './lore/vindications.js';
import { isCatalogBook, getCatalogLines, getFoundClues, getAllCluesFound, checkForClue } from './lore/catalog.js';
import { isPurifiedRoom } from './lore/purifiers.js';

// ============================================
// RENDERER SETUP
// ============================================

const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0; // Brighter than reference (0.8)

const camera = new THREE.PerspectiveCamera(
  70, window.innerWidth / window.innerHeight, 0.1, 50
);
camera.position.set(0, 1.6, 0);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x12100a);
scene.fog = new THREE.FogExp2(0x12100a, 0.07);

// Ambient light — brighter (0.6 vs reference 0.4)
const ambientLight = new THREE.AmbientLight(0x2a1f12, 0.6);
scene.add(ambientLight);

// ============================================
// WORLD + NAVIGATION + INTERACTION
// ============================================

const world = new WorldManager(scene, camera);
const nav = new Navigation(camera, world);
const interaction = new Interaction(camera, world);

// ============================================
// POINTER LOCK CONTROLS
// ============================================

const controls = new PointerLockControls(camera, document.body);

controls.addEventListener('lock', () => {
  const ch = document.getElementById('crosshair');
  if (ch) ch.style.display = 'block';
  nav.isLocked = true;
  interaction.isLocked = true;
});

controls.addEventListener('unlock', () => {
  const ch = document.getElementById('crosshair');
  if (ch) ch.style.display = 'none';
  nav.isLocked = false;
  interaction.isLocked = false;
});

// ============================================
// ATMOSPHERE
// ============================================

const particles = new ParticleSystem(scene, camera);
const audio = new AmbientAudio();

// Brightness control
const brightnessSlider = document.getElementById('brightness-slider');
if (brightnessSlider) {
  brightnessSlider.addEventListener('input', (e) => {
    renderer.toneMappingExposure = parseFloat(e.target.value);
  });
}

// Audio toggle
const audioToggle = document.getElementById('audio-toggle');
if (audioToggle) {
  audioToggle.addEventListener('click', () => {
    const enabled = audio.toggle();
    audioToggle.textContent = enabled ? '🔊' : '🔇';
    audioToggle.classList.toggle('active', enabled);
  });
}

// ============================================
// STATE
// ============================================

let introHidden = false;
let readerOpen = false;
let searchPanelOpen = false;
let navPanelOpen = false;
let vindicationsPanelOpen = false;
let catalogPanelOpen = false;
let aboutOpen = false;
let currentBook = null;

function isAnyPanelOpen() {
  return readerOpen || searchPanelOpen || navPanelOpen || vindicationsPanelOpen || catalogPanelOpen || aboutOpen;
}

// ============================================
// HUD UPDATE
// ============================================

function updateHUD() {
  const hexStr = world.currentHexId.toString(36).toUpperCase();
  const displayHex = hexStr.length > 24
    ? hexStr.substring(0, 12) + '...' + hexStr.substring(hexStr.length - 12)
    : hexStr;

  const coordsEl = document.getElementById('hex-coords');
  if (coordsEl) coordsEl.textContent = `Hex: ${displayHex}`;

  const floorEl = document.getElementById('floor-number');
  if (floorEl) floorEl.textContent = `Floor: ${world.currentFloor}`;

  const vindEl = document.getElementById('vindication-counter');
  if (vindEl) {
    const count = getVindicationCount();
    vindEl.textContent = `Vindications: ${count}`;
  }

  // Update particles based on current room type
  const currentRoom = world.getCurrentRoom();
  if (currentRoom) {
    particles.setRoomType(currentRoom.roomType);
  }
}

world.onRoomChange = updateHUD;

// ============================================
// INTRO
// ============================================

const introScreen = document.getElementById('intro-screen');
if (introScreen) {
  introScreen.addEventListener('click', () => {
    introScreen.classList.add('hidden');
    introHidden = true;
    setTimeout(() => {
      introScreen.style.display = 'none';
    }, 1500);
  });
}

// ============================================
// CANVAS CLICK → POINTER LOCK
// ============================================

canvas.addEventListener('click', () => {
  if (!readerOpen && !searchPanelOpen && !navPanelOpen && !vindicationsPanelOpen && !catalogPanelOpen && !aboutOpen && introHidden) {
    controls.lock();
  }
});

// ============================================
// BOOK READER
// ============================================

function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function openBook(hexId, wall, shelf, vol, page = 0) {
  currentBook = { hexId, wall, shelf, vol, page };

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

  // Man of the Book clue check
  const lineAddr = coordsToLineAddress(hexId, wall, shelf, vol, page, 0);
  const clue = checkForClue(lineAddr);
  if (clue) {
    setTimeout(() => {
      const clueNotice = document.createElement('div');
      clueNotice.className = 'clue-notice';
      clueNotice.innerHTML = `<p>You found Clue ${clue.clueIndex + 1}!</p><p class="clue-text">"${escapeHtml(clue.text)}"</p>`;
      document.body.appendChild(clueNotice);
      setTimeout(() => clueNotice.remove(), 6000);
    }, 500);
  }

  const titleEl = document.getElementById('book-title');
  if (titleEl) titleEl.textContent = `Volume ${vol + 1} of 32`;

  const hexStr = hexId.toString(36).toUpperCase();
  const displayHex = hexStr.length > 16
    ? hexStr.substring(0, 8) + '...' + hexStr.substring(hexStr.length - 8)
    : hexStr;
  const coordsEl = document.getElementById('book-coords');
  if (coordsEl) coordsEl.textContent = `Hex ${displayHex} · Wall ${wall + 1} · Shelf ${shelf + 1}`;

  const pageEl = document.getElementById('page-indicator');
  if (pageEl) pageEl.textContent = `Page ${page + 1} / ${PAGES_PER_VOL}`;

  const contentEl = document.getElementById('book-content');
  if (contentEl) {
    if (vindications.length > 0) {
      contentEl.innerHTML = highlightVindications(lines, vindications);
    } else {
      contentEl.textContent = lines.join('\n');
    }
  }

  const reader = document.getElementById('book-reader');
  if (reader) reader.classList.remove('hidden');

  const prevBtn = document.getElementById('prev-page');
  const nextBtn = document.getElementById('next-page');
  if (prevBtn) prevBtn.disabled = (page === 0);
  if (nextBtn) nextBtn.disabled = (page === PAGES_PER_VOL - 1);

  readerOpen = true;
  controls.unlock();
}

function closeReader() {
  const reader = document.getElementById('book-reader');
  if (reader) reader.classList.add('hidden');
  readerOpen = false;
  currentBook = null;
}

function nextPage() {
  if (!currentBook || currentBook.page >= PAGES_PER_VOL - 1) return;
  currentBook.page++;
  openBook(currentBook.hexId, currentBook.wall, currentBook.shelf, currentBook.vol, currentBook.page);
}

function prevPage() {
  if (!currentBook || currentBook.page <= 0) return;
  currentBook.page--;
  openBook(currentBook.hexId, currentBook.wall, currentBook.shelf, currentBook.vol, currentBook.page);
}

// Reader button handlers
document.getElementById('close-reader')?.addEventListener('click', closeReader);
document.getElementById('prev-page')?.addEventListener('click', prevPage);
document.getElementById('next-page')?.addEventListener('click', nextPage);

// Book click from interaction system
interaction.onBookClick = (hexId, wall, shelf, vol) => {
  openBook(hexId, wall, shelf, vol, 0);
};

// ============================================
// SEARCH PANEL
// ============================================

let lastSearchResult = null;

function openSearch() {
  const panel = document.getElementById('search-panel');
  if (panel) panel.classList.add('active');
  searchPanelOpen = true;
  controls.unlock();
  setTimeout(() => document.getElementById('search-input')?.focus(), 300);
}

function closeSearch() {
  const panel = document.getElementById('search-panel');
  if (panel) panel.classList.remove('active');
  searchPanelOpen = false;
}

function performSearch() {
  const input = document.getElementById('search-input');
  if (!input || !input.value.trim()) return;

  const resultEl = document.getElementById('search-result');
  if (resultEl) {
    resultEl.classList.remove('hidden');
    resultEl.innerHTML = '<p style="color:#8b7355;font-style:italic;">Locating text in the Library...</p>';
  }

  setTimeout(() => {
    const result = searchText(input.value);
    lastSearchResult = result;

    const hexStr = result.hexId.toString(36).toUpperCase();
    const displayHex = hexStr.length > 20
      ? hexStr.substring(0, 10) + '...' + hexStr.substring(hexStr.length - 10)
      : hexStr;

    if (resultEl) {
      resultEl.innerHTML = `
        <h4>This text exists in the Library.</h4>
        <div class="result-coords">
          <div>Hexagon: ${displayHex}</div>
          <div>Wall: ${result.wall + 1} · Shelf: ${result.shelf + 1} · Volume: ${result.vol + 1}</div>
          <div>Page: ${result.page + 1} · Line: ${result.line + 1}</div>
        </div>
        <button id="go-to-search" class="primary-btn">Go There</button>
        <p style="font-size:0.85rem;color:#5a4a32;margin-top:12px;font-style:italic;">It has always been here.</p>
      `;
      document.getElementById('go-to-search')?.addEventListener('click', goToSearchResult);
    }
  }, 400);
}

function goToSearchResult() {
  if (!lastSearchResult) return;
  const r = lastSearchResult;
  closeSearch();

  world.teleportTo(r.hexId, () => {
    openBook(r.hexId, r.wall, r.shelf, r.vol, r.page);
    setTimeout(() => {
      const content = document.getElementById('book-content');
      if (content) {
        const lines = content.textContent.split('\n');
        content.innerHTML = lines.map((line, i) =>
          i === r.line
            ? `<span class="highlight">${escapeHtml(line)}</span>`
            : escapeHtml(line)
        ).join('\n');
      }
    }, 50);
  });
}

// Char counter
const searchInput = document.getElementById('search-input');
const charCounter = document.getElementById('char-counter');
if (searchInput && charCounter) {
  searchInput.addEventListener('input', () => {
    const len = searchInput.value.length;
    charCounter.textContent = `${len} / 80`;
    charCounter.style.color = len > 80 ? '#d4a03a' : '#8b7355';
  });
}

document.getElementById('search-btn')?.addEventListener('click', performSearch);

// ============================================
// NAVIGATOR PANEL
// ============================================

function openNav() {
  const panel = document.getElementById('navigator-panel');
  if (panel) panel.classList.add('active');
  navPanelOpen = true;
  controls.unlock();
}

function closeNav() {
  const panel = document.getElementById('navigator-panel');
  if (panel) panel.classList.remove('active');
  navPanelOpen = false;
}

function base36ToBigInt(str) {
  str = str.toLowerCase();
  let result = 0n;
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    let digit;
    if (char >= '0' && char <= '9') {
      digit = char.charCodeAt(0) - 48;
    } else if (char >= 'a' && char <= 'z') {
      digit = char.charCodeAt(0) - 87;
    } else {
      return null;
    }
    result = result * 36n + BigInt(digit);
  }
  return result;
}

function navigateToCoords() {
  const hexStr = document.getElementById('nav-hex')?.value.trim() || '0';
  const wall = parseInt(document.getElementById('nav-wall')?.value) - 1;
  const shelf = parseInt(document.getElementById('nav-shelf')?.value) - 1;
  const vol = parseInt(document.getElementById('nav-volume')?.value) - 1;
  const page = parseInt(document.getElementById('nav-page')?.value) - 1;

  let hexId;
  try {
    hexId = BigInt('0x' + hexStr);
  } catch {
    hexId = base36ToBigInt(hexStr);
    if (hexId === null) return;
  }

  if (wall < 0 || wall >= 4 || shelf < 0 || shelf >= 5 ||
    vol < 0 || vol >= 32 || page < 0 || page >= 410) {
    return;
  }

  closeNav();
  world.teleportTo(hexId, () => {
    openBook(hexId, wall, shelf, vol, page);
  });
}

document.getElementById('navigate-btn')?.addEventListener('click', navigateToCoords);

// ============================================
// VINDICATIONS PANEL
// ============================================

function openVindications() {
  const panel = document.getElementById('vindications-panel');
  if (panel) panel.classList.add('active');
  vindicationsPanelOpen = true;
  controls.unlock();
  updateVindicationsList();
}

function closeVindications() {
  const panel = document.getElementById('vindications-panel');
  if (panel) panel.classList.remove('active');
  vindicationsPanelOpen = false;
}

function updateVindicationsList() {
  const listEl = document.getElementById('vindications-list');
  if (!listEl) return;

  const log = getVindicationLog();
  if (log.length === 0) {
    listEl.innerHTML = '<p class="empty-state">No vindications found yet. Open books to discover words.</p>';
    return;
  }

  // Show last 50 (most recent first)
  const recent = log.slice(-50).reverse();
  listEl.innerHTML = recent.map(v => {
    const hexStr = v.hexId.toString(36).toUpperCase();
    const displayHex = hexStr.length > 12 ? hexStr.substring(0, 6) + '...' : hexStr;
    return `<div class="vindication-item">
      <span class="vindication-word">${escapeHtml(v.word)}</span>
      <span class="vindication-coords">Hex ${displayHex} · W${v.wall + 1} · S${v.shelf + 1} · V${v.vol + 1} · P${v.page + 1}</span>
    </div>`;
  }).join('');
}

// ============================================
// PURIFIERS — teleport to a random purified room
// ============================================

function goToPurifiedRoom() {
  // Generate a random hexId that satisfies isPurifiedRoom (hexId % 100003n < 5000n)
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  let base = 0n;
  for (const b of bytes) base = base * 256n + BigInt(b);
  // Align to a purified room: base * 100003n + small offset
  const offset = base % 5000n;
  const hexId = (base / 5000n) * 100003n + offset;
  world.teleportTo(hexId);
}

// ============================================
// CRIMSON HEXAGON — teleport to the crimson room
// ============================================

function goToCrimsonHexagon() {
  world.teleportTo(18990824n);
}

// ============================================
// MAN OF THE BOOK — quest panel
// ============================================

const CLUE_TEXTS = [
  'the catalog of catalogs speaks from hexagon two seven one eight two eight',
  'seek the book of the man who has read all books on wall three shelf two',
  'volume seventeen page one reveals what the library knows of itself',
];

function openCatalog() {
  const panel = document.getElementById('catalog-panel');
  if (panel) panel.classList.add('active');
  catalogPanelOpen = true;
  controls.unlock();
  updateCatalogPanel();
}

function closeCatalog() {
  const panel = document.getElementById('catalog-panel');
  if (panel) panel.classList.remove('active');
  catalogPanelOpen = false;
}

function updateCatalogPanel() {
  const clues = getFoundClues();
  const foundCount = clues.filter(c => c).length;

  const countEl = document.getElementById('clue-count');
  if (countEl) countEl.textContent = foundCount;

  const listEl = document.getElementById('clue-list');
  if (listEl) {
    if (foundCount === 0) {
      listEl.innerHTML = '<p class="empty-state">No clues found yet. Read books to discover them.</p>';
    } else {
      listEl.innerHTML = clues.map((found, i) => {
        if (found) {
          return `<div class="clue-item found">
            <div class="clue-number">Clue ${i + 1}</div>
            <div class="clue-text">"${escapeHtml(CLUE_TEXTS[i])}"</div>
          </div>`;
        } else {
          return `<div class="clue-item undiscovered">
            <div class="clue-number">Clue ${i + 1}</div>
            <div class="clue-text">Not yet discovered...</div>
          </div>`;
        }
      }).join('');
    }
  }

  const destEl = document.getElementById('catalog-destination');
  if (destEl) {
    if (getAllCluesFound()) {
      destEl.classList.remove('hidden');
    } else {
      destEl.classList.add('hidden');
    }
  }
}

document.getElementById('go-to-catalog')?.addEventListener('click', () => {
  closeCatalog();
  world.teleportTo(271828182845n, () => {
    openBook(271828182845n, 2, 1, 16, 0);
  });
});

// ============================================
// ABOUT MODAL
// ============================================

function openAbout() {
  const modal = document.getElementById('about-modal');
  if (modal) modal.classList.remove('hidden');
  aboutOpen = true;
  controls.unlock();
}

function closeAbout() {
  const modal = document.getElementById('about-modal');
  if (modal) modal.classList.add('hidden');
  aboutOpen = false;
}

document.querySelector('.close-modal')?.addEventListener('click', closeAbout);
document.querySelector('.modal-overlay')?.addEventListener('click', closeAbout);

// ============================================
// TOOLBAR BUTTONS
// ============================================

document.querySelectorAll('.toolbar-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const action = btn.dataset.action;
    switch (action) {
      case 'search': openSearch(); break;
      case 'navigate': openNav(); break;
      case 'random': world.randomRoom(); break;
      case 'vindications': openVindications(); break;
      case 'purifiers': goToPurifiedRoom(); break;
      case 'crimson': goToCrimsonHexagon(); break;
      case 'catalog': openCatalog(); break;
      case 'about': openAbout(); break;
    }
  });
});

// Close panel buttons
document.querySelectorAll('.close-panel').forEach(btn => {
  btn.addEventListener('click', () => {
    const panel = btn.dataset.panel;
    switch (panel) {
      case 'search': closeSearch(); break;
      case 'navigator': closeNav(); break;
      case 'vindications': closeVindications(); break;
      case 'catalog': closeCatalog(); break;
    }
  });
});

// ============================================
// KEYBOARD SHORTCUTS
// ============================================

window.addEventListener('keydown', (e) => {
  if (readerOpen) {
    if (e.code === 'ArrowRight' || e.code === 'ArrowDown') { e.preventDefault(); nextPage(); }
    if (e.code === 'ArrowLeft' || e.code === 'ArrowUp') { e.preventDefault(); prevPage(); }
    if (e.code === 'Escape') closeReader();
  } else if (searchPanelOpen) {
    if (e.code === 'Escape') closeSearch();
    if (e.code === 'Enter' && !e.shiftKey && e.target.id === 'search-input') {
      e.preventDefault();
      performSearch();
    }
  } else if (navPanelOpen) {
    if (e.code === 'Escape') closeNav();
  } else if (vindicationsPanelOpen) {
    if (e.code === 'Escape') closeVindications();
  } else if (catalogPanelOpen) {
    if (e.code === 'Escape') closeCatalog();
  } else if (aboutOpen) {
    if (e.code === 'Escape') closeAbout();
  } else if (!controls.isLocked && introHidden) {
    if (e.code === 'KeyS') { e.preventDefault(); openSearch(); }
    if (e.code === 'KeyN') { e.preventDefault(); openNav(); }
    if (e.code === 'KeyR') { e.preventDefault(); world.randomRoom(); }
  }
});

// ============================================
// WINDOW RESIZE
// ============================================

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ============================================
// ANIMATION LOOP
// ============================================

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  const elapsed = clock.getElapsedTime();

  // Movement
  nav.update(delta);

  // Book hover highlight
  if (controls.isLocked) {
    interaction.updateHover();
  }

  // Light flicker
  updateLightFlicker(world.rooms, elapsed);

  // Particles
  particles.update(delta);

  renderer.render(scene, camera);
}

// ============================================
// INITIALIZATION
// ============================================

world.updateRooms();
updateHUD();
animate();
