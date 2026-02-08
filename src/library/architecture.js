import * as THREE from 'three';
import { columnMaterial, goldAccentMaterial, rimMaterial } from './materials.js';
import { R, ROOM_HEIGHT, HEX_VERTICES, BOOKSHELF_WALLS } from './room.js';

function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/**
 * Add architectural details: column capitals, floor tile lines, ceiling coffers, wall cracks
 * @param {THREE.Group} group
 * @param {bigint} hexId - For seeded crack generation
 */
export function addArchitecturalDetails(group, hexId) {
  const hexSeed = Number(hexId % 100000n);

  // Column capitals at passage columns (decorative tops)
  for (let i = 0; i < 6; i++) {
    const v = HEX_VERTICES[i];
    // Small capital on top of each hex vertex pillar
    const capitalGeom = new THREE.BoxGeometry(0.25, 0.06, 0.25);
    const capital = new THREE.Mesh(capitalGeom, columnMaterial);
    capital.position.set(v.x * 0.98, ROOM_HEIGHT - 0.03, v.z * 0.98);
    group.add(capital);
  }

  // Floor tile lines (subtle grid pattern)
  const tileLineMat = new THREE.LineBasicMaterial({
    color: 0x2a2015,
    transparent: true,
    opacity: 0.3,
  });

  // Radial lines from center
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i + Math.PI / 6;
    const points = [
      new THREE.Vector3(0, 0.01, 0),
      new THREE.Vector3(
        Math.cos(angle) * (R * 0.8),
        0.01,
        Math.sin(angle) * (R * 0.8)
      ),
    ];
    const lineGeom = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(lineGeom, tileLineMat);
    group.add(line);
  }

  // Concentric hex ring on floor
  const ringPoints = [];
  const ringR = R * 0.5;
  for (let i = 0; i <= 6; i++) {
    const angle = (Math.PI / 3) * (i % 6);
    ringPoints.push(new THREE.Vector3(
      ringR * Math.cos(angle), 0.01, ringR * Math.sin(angle)
    ));
  }
  const ringGeom = new THREE.BufferGeometry().setFromPoints(ringPoints);
  group.add(new THREE.Line(ringGeom, tileLineMat));

  // Ceiling coffers (recessed panels)
  const cofferMat = new THREE.MeshStandardMaterial({
    color: 0x241a10,
    roughness: 0.95,
  });
  // Three small rectangular coffers near ceiling center
  for (let i = 0; i < 3; i++) {
    const angle = (Math.PI * 2 / 3) * i;
    const cofferGeom = new THREE.BoxGeometry(0.8, 0.04, 0.4);
    const coffer = new THREE.Mesh(cofferGeom, cofferMat);
    coffer.position.set(
      Math.cos(angle) * 1.2,
      ROOM_HEIGHT - 0.02,
      Math.sin(angle) * 1.2
    );
    coffer.rotation.y = angle;
    group.add(coffer);
  }

  // Wall cracks (seeded by hexId for deterministic variety)
  const crackMat = new THREE.LineBasicMaterial({
    color: 0x1a1208,
    transparent: true,
    opacity: 0.4,
  });

  const numCracks = 2 + Math.floor(seededRandom(hexSeed + 77) * 4);
  for (let c = 0; c < numCracks; c++) {
    const wallIdx = BOOKSHELF_WALLS[Math.floor(seededRandom(hexSeed + c * 13) * 4)];
    const va = HEX_VERTICES[wallIdx];
    const vb = HEX_VERTICES[(wallIdx + 1) % 6];
    const wallCenter = new THREE.Vector3(
      (va.x + vb.x) / 2, 0, (va.z + vb.z) / 2
    );
    const inwardDir = new THREE.Vector3(-wallCenter.x, 0, -wallCenter.z).normalize();
    const wallDir = new THREE.Vector3().subVectors(vb, va).normalize();

    // Crack starting point on wall
    const startLateral = (seededRandom(hexSeed + c * 31) - 0.5) * R * 0.6;
    const startY = 0.5 + seededRandom(hexSeed + c * 47) * (ROOM_HEIGHT - 1);
    const crackPoints = [];
    const segments = 3 + Math.floor(seededRandom(hexSeed + c * 19) * 3);

    let cx = startLateral;
    let cy = startY;
    crackPoints.push(
      wallCenter.clone()
        .add(wallDir.clone().multiplyScalar(cx))
        .add(inwardDir.clone().multiplyScalar(0.01))
        .setY(cy)
    );

    for (let s = 0; s < segments; s++) {
      cx += (seededRandom(hexSeed + c * 53 + s * 7) - 0.5) * 0.3;
      cy += (seededRandom(hexSeed + c * 59 + s * 11) - 0.5) * 0.4;
      cy = Math.max(0.1, Math.min(ROOM_HEIGHT - 0.1, cy));
      crackPoints.push(
        wallCenter.clone()
          .add(wallDir.clone().multiplyScalar(cx))
          .add(inwardDir.clone().multiplyScalar(0.01))
          .setY(cy)
      );
    }

    const crackGeom = new THREE.BufferGeometry().setFromPoints(crackPoints);
    group.add(new THREE.Line(crackGeom, crackMat));
  }

  // Gold accent trim on one shelf (subtle detail)
  if (seededRandom(hexSeed + 999) > 0.7) {
    const wallIdx = BOOKSHELF_WALLS[Math.floor(seededRandom(hexSeed + 1001) * 4)];
    const va = HEX_VERTICES[wallIdx];
    const vb = HEX_VERTICES[(wallIdx + 1) % 6];
    const wallCenter = new THREE.Vector3(
      (va.x + vb.x) / 2, 0, (va.z + vb.z) / 2
    );
    const inwardDir = new THREE.Vector3(-wallCenter.x, 0, -wallCenter.z).normalize();
    const wallAngle = Math.atan2(-wallCenter.x, -wallCenter.z);

    const trimGeom = new THREE.BoxGeometry(R * 0.6, 0.008, 0.01);
    const trim = new THREE.Mesh(trimGeom, goldAccentMaterial);
    const trimPos = wallCenter.clone()
      .add(inwardDir.clone().multiplyScalar(0.26));
    trimPos.y = 2.5 + 0.02;
    trim.position.copy(trimPos);
    trim.rotation.y = wallAngle;
    group.add(trim);
  }
}
