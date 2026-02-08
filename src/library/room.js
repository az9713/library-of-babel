import * as THREE from 'three';
import {
  wallMaterial, floorMaterial, ceilingMaterial, shelfMaterial, columnMaterial,
  shaftMaterial, rimMaterial, lampMaterial,
  charredWallMaterial, crimsonWallMaterial, crimsonFloorMaterial,
} from './materials.js';

// Room geometry constants
export const R = 3;
export const ROOM_HEIGHT = 3.2;
export const CORRIDOR_LENGTH = 2.5;
export const ROOM_DEPTH = R * Math.sqrt(3) + CORRIDOR_LENGTH;

// Hex vertex positions
export const HEX_VERTICES = [];
for (let i = 0; i < 6; i++) {
  const angle = (Math.PI / 3) * i;
  HEX_VERTICES.push(new THREE.Vector3(R * Math.cos(angle), 0, R * Math.sin(angle)));
}

// Wall indices: 4 bookshelf walls, 2 passage walls
export const BOOKSHELF_WALLS = [0, 2, 3, 5];
export const PASSAGE_WALLS = [1, 4];

/**
 * Create the hexagonal room shell (floor, ceiling, walls, shaft, lamps)
 * @param {string} roomType - "normal", "purified", or "crimson"
 * @returns {{ group: THREE.Group, lights: THREE.PointLight[] }}
 */
export function createRoomShell(roomType = 'normal') {
  const group = new THREE.Group();

  // Select materials based on room type
  const wMat = roomType === 'purified' ? charredWallMaterial
    : roomType === 'crimson' ? crimsonWallMaterial
    : wallMaterial;
  const fMat = roomType === 'crimson' ? crimsonFloorMaterial : floorMaterial;
  const cMat = ceilingMaterial;

  // Floor
  const floorShape = new THREE.Shape();
  for (let i = 0; i <= 6; i++) {
    const angle = (Math.PI / 3) * (i % 6);
    const x = R * Math.cos(angle);
    const z = R * Math.sin(angle);
    if (i === 0) floorShape.moveTo(x, z);
    else floorShape.lineTo(x, z);
  }
  const floorGeom = new THREE.ShapeGeometry(floorShape);
  floorGeom.rotateX(-Math.PI / 2);
  group.add(new THREE.Mesh(floorGeom, fMat));

  // Ceiling
  const ceilGeom = floorGeom.clone();
  const ceilMesh = new THREE.Mesh(ceilGeom, cMat);
  ceilMesh.position.y = ROOM_HEIGHT;
  ceilMesh.rotation.x = Math.PI;
  group.add(ceilMesh);

  // Bookshelf walls (solid planes facing inward)
  for (const wallIdx of BOOKSHELF_WALLS) {
    const va = HEX_VERTICES[wallIdx];
    const vb = HEX_VERTICES[(wallIdx + 1) % 6];
    const wallLen = va.distanceTo(vb);
    const wallGeom = new THREE.PlaneGeometry(wallLen, ROOM_HEIGHT);
    const wallMesh = new THREE.Mesh(wallGeom, wMat);

    const midpoint = new THREE.Vector3(
      (va.x + vb.x) / 2, ROOM_HEIGHT / 2, (va.z + vb.z) / 2
    );
    wallMesh.position.copy(midpoint);

    const center = new THREE.Vector3((va.x + vb.x) / 2, 0, (va.z + vb.z) / 2);
    wallMesh.rotation.y = Math.atan2(-center.x, -center.z);
    group.add(wallMesh);
  }

  // Passage archways (top beams + side columns)
  for (const passIdx of PASSAGE_WALLS) {
    const va = HEX_VERTICES[passIdx];
    const vb = HEX_VERTICES[(passIdx + 1) % 6];
    const center = new THREE.Vector3((va.x + vb.x) / 2, 0, (va.z + vb.z) / 2);
    const passAngle = Math.atan2(-center.x, -center.z);

    // Top beam
    const beamGeom = new THREE.BoxGeometry(R, 0.15, 0.2);
    const beamMesh = new THREE.Mesh(beamGeom, shelfMaterial);
    beamMesh.position.set(center.x, ROOM_HEIGHT - 0.075, center.z);
    beamMesh.rotation.y = passAngle;
    group.add(beamMesh);

    // Side columns
    const colGeom = new THREE.BoxGeometry(0.15, ROOM_HEIGHT, 0.2);
    const col1 = new THREE.Mesh(colGeom, columnMaterial);
    col1.position.set(va.x, ROOM_HEIGHT / 2, va.z);
    col1.rotation.y = passAngle;
    group.add(col1);
    const col2 = new THREE.Mesh(colGeom, columnMaterial);
    col2.position.set(vb.x, ROOM_HEIGHT / 2, vb.z);
    col2.rotation.y = passAngle;
    group.add(col2);
  }

  // Central ventilation shaft
  const shaftRadius = 0.3;
  const floorShaftGeom = new THREE.CylinderGeometry(shaftRadius, shaftRadius, 0.1, 12);
  const floorShaft = new THREE.Mesh(floorShaftGeom, shaftMaterial);
  floorShaft.position.set(0, 0.05, 0);
  group.add(floorShaft);

  const floorRimGeom = new THREE.TorusGeometry(shaftRadius, 0.02, 8, 12);
  const floorRim = new THREE.Mesh(floorRimGeom, rimMaterial);
  floorRim.rotation.x = Math.PI / 2;
  floorRim.position.set(0, 0.1, 0);
  group.add(floorRim);

  const ceilShaftGeom = new THREE.CylinderGeometry(shaftRadius, shaftRadius, 0.1, 12);
  const ceilShaft = new THREE.Mesh(ceilShaftGeom, shaftMaterial);
  ceilShaft.position.set(0, ROOM_HEIGHT - 0.05, 0);
  group.add(ceilShaft);

  const ceilRim = new THREE.Mesh(floorRimGeom.clone(), rimMaterial);
  ceilRim.rotation.x = Math.PI / 2;
  ceilRim.position.set(0, ROOM_HEIGHT - 0.1, 0);
  group.add(ceilRim);

  // Lamps — "spherical fruit" (Borges)
  const lampGeom = new THREE.SphereGeometry(0.12, 16, 16);
  const lamp1 = new THREE.Mesh(lampGeom, lampMaterial);
  lamp1.position.set(0.8, ROOM_HEIGHT - 0.2, 0);
  group.add(lamp1);
  const lamp2 = new THREE.Mesh(lampGeom, lampMaterial);
  lamp2.position.set(-0.8, ROOM_HEIGHT - 0.2, 0);
  group.add(lamp2);

  // Point lights — warm amber, brighter than reference (2.5 vs 2.0)
  const lightColor = roomType === 'crimson' ? 0xFF6040 : 0xFFD280;
  const lightIntensity = roomType === 'purified' ? 1.5 : 2.5;

  const light1 = new THREE.PointLight(lightColor, lightIntensity, 10, 1.2);
  light1.position.copy(lamp1.position);
  group.add(light1);
  const light2 = new THREE.PointLight(lightColor, lightIntensity, 10, 1.2);
  light2.position.copy(lamp2.position);
  group.add(light2);

  return { group, lights: [light1, light2] };
}
