/**
 * Per-room light flicker system
 * Borges: "The light they emit is insufficient, incessant."
 */

export function updateLightFlicker(rooms, elapsedTime) {
  for (const [idx, room] of rooms) {
    if (!room.lights) continue;

    const seed1 = Number(room.hexId % 1000n) + idx * 7;
    const seed2 = Number(room.hexId % 1000n) + idx * 11;

    if (room.roomType === 'purified') {
      // Purified rooms: dimmer, more erratic flicker
      const flicker1 = Math.sin(elapsedTime * 3.7 + seed1) * 0.2
        + Math.sin(elapsedTime * 7.3 + seed1 * 2) * 0.15;
      const flicker2 = Math.sin(elapsedTime * 4.1 + seed2) * 0.2
        + Math.sin(elapsedTime * 6.9 + seed2 * 2) * 0.15;
      room.lights[0].intensity = 1.5 + flicker1;
      room.lights[1].intensity = 1.5 + flicker2;
    } else if (room.roomType === 'crimson') {
      // Crimson rooms: steady, pulsing red
      const pulse = Math.sin(elapsedTime * 1.2 + seed1) * 0.3;
      room.lights[0].intensity = 2.5 + pulse;
      room.lights[1].intensity = 2.5 + pulse;
    } else {
      // Normal rooms: gentle sinusoidal flicker
      const flicker1 = Math.sin(elapsedTime * 2.3 + seed1) * 0.1
        + Math.sin(elapsedTime * 4.7 + seed1 * 2) * 0.06;
      const flicker2 = Math.sin(elapsedTime * 2.1 + seed2) * 0.1
        + Math.sin(elapsedTime * 5.1 + seed2 * 2) * 0.06;
      room.lights[0].intensity = 2.5 + flicker1;
      room.lights[1].intensity = 2.5 + flicker2;
    }
  }
}
