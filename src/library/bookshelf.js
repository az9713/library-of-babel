import * as THREE from 'three';
import { shelfMaterial, charredShelfMaterial, BOOK_COLORS } from './materials.js';
import { R, ROOM_HEIGHT, HEX_VERTICES, BOOKSHELF_WALLS } from './room.js';

const SHELF_HEIGHTS = [0.3, 0.85, 1.4, 1.95, 2.5];
const SHELF_DEPTH = 0.25;
const SHELF_THICKNESS = 0.02;
const BOOKS_PER_SHELF = 32;

function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/**
 * Add shelf planks + instanced book mesh to a room group
 * @param {THREE.Group} group - Room group to add to
 * @param {bigint} hexId - Hexagon ID (for seeded randomness)
 * @param {string} roomType - "normal", "purified", or "crimson"
 * @returns {{ bookMesh: THREE.InstancedMesh, bookMap: Array }}
 */
export function addBookshelves(group, hexId, roomType = 'normal') {
  const sMat = roomType === 'purified' ? charredShelfMaterial : shelfMaterial;

  // Add shelf planks
  for (const wallIdx of BOOKSHELF_WALLS) {
    const va = HEX_VERTICES[wallIdx];
    const vb = HEX_VERTICES[(wallIdx + 1) % 6];
    const wallCenter = new THREE.Vector3((va.x + vb.x) / 2, 0, (va.z + vb.z) / 2);
    const inwardDir = new THREE.Vector3(-wallCenter.x, 0, -wallCenter.z).normalize();

    for (let s = 0; s < SHELF_HEIGHTS.length; s++) {
      const shelfGeom = new THREE.BoxGeometry(R - 0.1, SHELF_THICKNESS, SHELF_DEPTH);
      const shelfMesh = new THREE.Mesh(shelfGeom, sMat);

      const shelfPos = wallCenter.clone().add(
        inwardDir.clone().multiplyScalar(SHELF_DEPTH / 2 + 0.02)
      );
      shelfPos.y = SHELF_HEIGHTS[s];
      shelfMesh.position.copy(shelfPos);
      shelfMesh.rotation.y = Math.atan2(-wallCenter.x, -wallCenter.z);
      group.add(shelfMesh);
    }
  }

  // Create books as instanced mesh (640 books = 4 walls * 5 shelves * 32 books)
  const totalBooks = BOOKSHELF_WALLS.length * SHELF_HEIGHTS.length * BOOKS_PER_SHELF;
  const bookGeom = new THREE.BoxGeometry(0.07, 0.20, 0.18);
  const bookMat = new THREE.MeshStandardMaterial({ roughness: 0.6, metalness: 0.05 });
  const bookMesh = new THREE.InstancedMesh(bookGeom, bookMat, totalBooks);

  const bookMap = [];
  let instanceId = 0;
  const matrix = new THREE.Matrix4();
  const color = new THREE.Color();

  // Determine which books to remove in purified rooms
  const isPurified = roomType === 'purified';
  const hexSeed = Number(hexId % 10000n);

  for (let w = 0; w < BOOKSHELF_WALLS.length; w++) {
    const wallIdx = BOOKSHELF_WALLS[w];
    const va = HEX_VERTICES[wallIdx];
    const vb = HEX_VERTICES[(wallIdx + 1) % 6];
    const wallCenter = new THREE.Vector3((va.x + vb.x) / 2, 0, (va.z + vb.z) / 2);
    const wallDir = new THREE.Vector3().subVectors(vb, va).normalize();
    const inwardDir = new THREE.Vector3(-wallCenter.x, 0, -wallCenter.z).normalize();
    const wallAngle = Math.atan2(-wallCenter.x, -wallCenter.z);

    for (let s = 0; s < SHELF_HEIGHTS.length; s++) {
      for (let v = 0; v < BOOKS_PER_SHELF; v++) {
        const slot = v - BOOKS_PER_SHELF / 2;
        const slotWidth = (R - 0.2) / BOOKS_PER_SHELF;

        const bookPos = wallCenter.clone()
          .add(wallDir.clone().multiplyScalar(slot * slotWidth))
          .add(inwardDir.clone().multiplyScalar(0.18));

        const seed = hexSeed + instanceId;
        const bookHeight = 0.18 + seededRandom(seed) * 0.06;
        bookPos.y = SHELF_HEIGHTS[s] + SHELF_THICKNESS / 2 + bookHeight / 2;

        // In purified rooms, 15-30% of books are "destroyed" (scale to 0)
        const destroyed = isPurified && seededRandom(seed + 5000) < (0.15 + seededRandom(seed + 6000) * 0.15);

        matrix.identity();
        matrix.makeRotationY(wallAngle);
        matrix.setPosition(bookPos);
        if (destroyed) {
          matrix.scale(new THREE.Vector3(0, 0, 0));
        } else {
          matrix.scale(new THREE.Vector3(1, bookHeight / 0.20, 1));
        }
        bookMesh.setMatrixAt(instanceId, matrix);

        // Book color
        const colorIndex = Math.floor(seededRandom(seed + 1000) * BOOK_COLORS.length);
        if (isPurified && !destroyed) {
          // Darken surviving books in purified rooms
          color.setHex(BOOK_COLORS[colorIndex]);
          color.multiplyScalar(0.5);
        } else if (roomType === 'crimson') {
          // Crimson tinted books
          color.setHex(BOOK_COLORS[colorIndex]);
          color.r = Math.min(1, color.r * 1.4);
          color.g *= 0.6;
          color.b *= 0.6;
        } else {
          color.setHex(BOOK_COLORS[colorIndex]);
        }
        bookMesh.setColorAt(instanceId, color);

        bookMap.push({ wall: wallIdx, shelf: s, vol: v });
        instanceId++;
      }
    }
  }

  bookMesh.instanceMatrix.needsUpdate = true;
  bookMesh.instanceColor.needsUpdate = true;
  group.add(bookMesh);

  return { bookMesh, bookMap };
}
