import * as THREE from 'three';
import { shelfMaterial } from './materials.js';
import { ROOM_HEIGHT } from './room.js';

/**
 * Add a spiral staircase at the given position
 * @param {THREE.Group} group
 * @param {{ x: number, z: number }} pos
 */
export function addStaircase(group, pos) {
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x1a1208, roughness: 0.8 });
  const poleGeom = new THREE.CylinderGeometry(0.06, 0.06, ROOM_HEIGHT * 3, 12);
  const pole = new THREE.Mesh(poleGeom, poleMat);
  pole.position.set(pos.x, ROOM_HEIGHT / 2, pos.z);
  group.add(pole);

  const stepGeom = new THREE.BoxGeometry(0.35, 0.03, 0.15);
  const numSteps = 16;
  const heightPerStep = (ROOM_HEIGHT * 3) / numSteps;
  const anglePerStep = (Math.PI * 2.5) / numSteps;

  for (let i = 0; i < numSteps; i++) {
    const step = new THREE.Mesh(stepGeom, shelfMaterial);
    const stepAngle = anglePerStep * i;
    const stepRadius = 0.2;
    step.position.set(
      pos.x + Math.cos(stepAngle) * stepRadius,
      -ROOM_HEIGHT * 0.8 + heightPerStep * i,
      pos.z + Math.sin(stepAngle) * stepRadius
    );
    step.rotation.y = stepAngle + Math.PI / 2;
    group.add(step);
  }
}
