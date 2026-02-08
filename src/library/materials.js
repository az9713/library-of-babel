import * as THREE from 'three';

// =============================================
// SHARED MATERIALS — Warmer & brighter than reference
// Wall color #3d2e1f (vs reference #2a1f15)
// Ambient multiplier ~0.6 (vs 0.4)
// =============================================

export const wallMaterial = new THREE.MeshStandardMaterial({
  color: 0x3d2e1f,
  roughness: 0.88,
  metalness: 0.0,
});

export const floorMaterial = new THREE.MeshStandardMaterial({
  color: 0x241a0e,
  roughness: 0.93,
});

export const ceilingMaterial = new THREE.MeshStandardMaterial({
  color: 0x2a2115,
  roughness: 0.9,
});

export const shelfMaterial = new THREE.MeshStandardMaterial({
  color: 0x5a3014,
  roughness: 0.65,
  metalness: 0.02,
});

export const columnMaterial = new THREE.MeshStandardMaterial({
  color: 0x3d2e1f,
  roughness: 0.82,
});

export const goldAccentMaterial = new THREE.MeshStandardMaterial({
  color: 0xd4a03a,
  roughness: 0.4,
  metalness: 0.6,
});

// Charred materials for purified rooms
export const charredWallMaterial = new THREE.MeshStandardMaterial({
  color: 0x1a1510,
  roughness: 0.95,
  metalness: 0.0,
});

export const charredShelfMaterial = new THREE.MeshStandardMaterial({
  color: 0x1f1208,
  roughness: 0.9,
});

// Crimson Hexagon materials
export const crimsonWallMaterial = new THREE.MeshStandardMaterial({
  color: 0x4a0a0a,
  roughness: 0.85,
  metalness: 0.05,
});

export const crimsonFloorMaterial = new THREE.MeshStandardMaterial({
  color: 0x2a0808,
  roughness: 0.9,
});

// Book colors — richer palette
export const BOOK_COLORS = [
  0x8B1A1A, 0x1A3C5A, 0x2B5329, 0x4A3728, 0x3A2E4D,
  0x5C4033, 0x2D4A2D, 0x4A1A2A, 0x1A4A4A, 0x5A4A32,
  0x3D2B1F, 0x2B3D5A, 0x6B3A2A, 0x2A4A3D, 0x4D3A5A,
  0x5A3A28, 0x283A5A, 0x3A5A28, 0x5A2838, 0x38285A,
];

// Shaft material
export const shaftMaterial = new THREE.MeshStandardMaterial({
  color: 0x050403,
  emissive: 0x0a0a15,
  emissiveIntensity: 0.05,
  roughness: 0.95,
});

export const rimMaterial = new THREE.MeshStandardMaterial({
  color: 0x4a3014,
  roughness: 0.75,
});

export const darkMaterial = new THREE.MeshStandardMaterial({
  color: 0x0a0806,
  roughness: 1.0,
});

export const mirrorMaterial = new THREE.MeshStandardMaterial({
  color: 0x888899,
  metalness: 0.95,
  roughness: 0.05,
});

export const lampMaterial = new THREE.MeshBasicMaterial({
  color: 0xFFE8B0,
});

// Track shared materials so we don't dispose them when removing rooms
export const sharedMaterials = new Set([
  wallMaterial, floorMaterial, ceilingMaterial, shelfMaterial, columnMaterial,
  goldAccentMaterial, charredWallMaterial, charredShelfMaterial,
  crimsonWallMaterial, crimsonFloorMaterial,
  shaftMaterial, rimMaterial, darkMaterial, mirrorMaterial, lampMaterial,
]);
