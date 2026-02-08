/**
 * CSS-based visual effects: vignette + film grain
 * These are handled in CSS, this module just provides the brightness control
 */

export function setupBrightnessControl(renderer) {
  const slider = document.getElementById('brightness-slider');
  if (!slider) return;

  slider.addEventListener('input', (e) => {
    renderer.toneMappingExposure = e.target.value / 100;
  });
}
