import { uiState } from './state.js';

let unlockFn = null;

export function initAbout(unlock) {
  unlockFn = unlock;
}

export function openAbout() {
  document.getElementById('about-overlay').classList.add('visible');
  document.getElementById('about-modal').classList.add('visible');
  uiState.aboutOpen = true;
  if (unlockFn) unlockFn();
}

export function closeAbout() {
  document.getElementById('about-overlay').classList.remove('visible');
  document.getElementById('about-modal').classList.remove('visible');
  uiState.aboutOpen = false;
}
