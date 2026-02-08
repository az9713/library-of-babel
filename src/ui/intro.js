import { uiState } from './state.js';

export function initIntro(onDismiss) {
  const intro = document.getElementById('intro');
  if (!intro) return;

  intro.addEventListener('click', () => {
    if (intro.classList.contains('hidden')) return;
    intro.classList.add('hidden');
    uiState.introHidden = true;
    setTimeout(() => {
      intro.style.display = 'none';
    }, 1500);
    if (onDismiss) onDismiss();
  });
}
