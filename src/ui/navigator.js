import { uiState } from './state.js';
import { openBook } from './reader.js';

let worldManager = null;
let unlockFn = null;

export function initNavigator(world, unlock) {
  worldManager = world;
  unlockFn = unlock;
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

export function openNav() {
  document.getElementById('nav-panel').classList.add('visible');
  uiState.navOpen = true;
  if (unlockFn) unlockFn();
}

export function closeNav() {
  document.getElementById('nav-panel').classList.remove('visible');
  uiState.navOpen = false;
}

export function navigateToCoords() {
  const hexStr = document.getElementById('nav-hex').value.trim() || '0';
  const wall = parseInt(document.getElementById('nav-wall').value) - 1;
  const shelf = parseInt(document.getElementById('nav-shelf').value) - 1;
  const vol = parseInt(document.getElementById('nav-vol').value) - 1;
  const page = parseInt(document.getElementById('nav-page').value) - 1;

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
  worldManager.teleportTo(hexId, () => {
    openBook(hexId, wall, shelf, vol, page);
  });
}
