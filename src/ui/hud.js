import { getVindicationCount } from '../lore/vindications.js';

let worldManager = null;

export function initHUD(world) {
  worldManager = world;
}

export function updateHUD() {
  if (!worldManager) return;

  const hexStr = worldManager.currentHexId.toString(36).toUpperCase();
  const displayHex = hexStr.length > 24
    ? hexStr.substring(0, 12) + '...' + hexStr.substring(hexStr.length - 12)
    : hexStr;

  const coordsEl = document.getElementById('hud-coords');
  if (coordsEl) {
    coordsEl.textContent = `Hexagon ${displayHex} \u00B7 Floor ${worldManager.currentFloor}`;
  }

  const vindEl = document.getElementById('hud-vindications');
  if (vindEl) {
    const count = getVindicationCount();
    vindEl.textContent = count > 0 ? `Vindications: ${count}` : '';
  }
}
