import * as THREE from 'three';
import { R, ROOM_HEIGHT, CORRIDOR_LENGTH, HEX_VERTICES, BOOKSHELF_WALLS } from '../library/room.js';

const passageEdgeZ = R * Math.sqrt(3) / 2;
const corridorHalfW = 0.9; // corridorWidth / 2
const corridorEnd = passageEdgeZ + CORRIDOR_LENGTH / 2;

// Pre-computed corridor collision segments [startX, startZ, endX, endZ]
const CORRIDOR_WALLS = [
  [corridorHalfW, passageEdgeZ, corridorHalfW, corridorEnd],
  [-corridorHalfW, passageEdgeZ, -corridorHalfW, corridorEnd],
  [-corridorHalfW, -passageEdgeZ, -corridorHalfW, -corridorEnd],
  [corridorHalfW, -passageEdgeZ, corridorHalfW, -corridorEnd],
  // Infill walls
  [corridorHalfW, passageEdgeZ, R / 2, passageEdgeZ],
  [-corridorHalfW, passageEdgeZ, -R / 2, passageEdgeZ],
  [corridorHalfW, -passageEdgeZ, R / 2, -passageEdgeZ],
  [-corridorHalfW, -passageEdgeZ, -R / 2, -passageEdgeZ],
];

function checkSegmentCollision(pos, ax, az, bx, bz, minDist) {
  const dx = bx - ax, dz = bz - az;
  const len = Math.sqrt(dx * dx + dz * dz);
  if (len < 0.001) return;
  const nx = dx / len, nz = dz / len;
  const toCamX = pos.x - ax, toCamZ = pos.z - az;
  const proj = Math.max(0, Math.min(len, toCamX * nx + toCamZ * nz));
  const closeX = ax + nx * proj, closeZ = az + nz * proj;
  const dist = Math.sqrt((pos.x - closeX) ** 2 + (pos.z - closeZ) ** 2);
  if (dist < minDist && dist > 0.001) {
    const px = (pos.x - closeX) / dist, pz = (pos.z - closeZ) / dist;
    pos.x = closeX + px * minDist;
    pos.z = closeZ + pz * minDist;
  }
}

export class Navigation {
  constructor(camera, worldManager) {
    this.camera = camera;
    this.world = worldManager;
    this.moveSpeed = 3.0;
    this.keys = { forward: false, backward: false, left: false, right: false };
    this.isLocked = false;

    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);

    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
  }

  _onKeyDown(e) {
    switch (e.code) {
      case 'KeyW': this.keys.forward = true; break;
      case 'KeyA': this.keys.left = true; break;
      case 'KeyS':
        if (this.isLocked) this.keys.backward = true;
        break;
      case 'KeyD': this.keys.right = true; break;
      case 'KeyQ':
        if (this.isLocked) {
          e.preventDefault();
          this.world.checkStaircaseTraversal(-1);
        }
        break;
      case 'KeyE':
        if (this.isLocked) {
          e.preventDefault();
          this.world.checkStaircaseTraversal(1);
        }
        break;
    }
  }

  _onKeyUp(e) {
    switch (e.code) {
      case 'KeyW': this.keys.forward = false; break;
      case 'KeyA': this.keys.left = false; break;
      case 'KeyS': this.keys.backward = false; break;
      case 'KeyD': this.keys.right = false; break;
    }
  }

  /** Apply movement and collision for this frame */
  update(delta) {
    if (!this.isLocked) return;

    const direction = new THREE.Vector3();
    if (this.keys.forward) direction.z -= 1;
    if (this.keys.backward) direction.z += 1;
    if (this.keys.left) direction.x -= 1;
    if (this.keys.right) direction.x += 1;

    if (direction.length() > 0) {
      direction.normalize();
      const moveDir = direction.clone();
      moveDir.applyQuaternion(this.camera.quaternion);
      moveDir.y = 0;
      moveDir.normalize();

      this.camera.position.add(moveDir.multiplyScalar(this.moveSpeed * delta));
      this.applyCollision();
      this.world.checkRoomTransition();
    }
  }

  applyCollision() {
    const pos = this.camera.position;
    const minDist = 0.35;

    // Bookshelf walls
    for (const wallIdx of BOOKSHELF_WALLS) {
      const va = HEX_VERTICES[wallIdx];
      const vb = HEX_VERTICES[(wallIdx + 1) % 6];
      checkSegmentCollision(pos, va.x, va.z, vb.x, vb.z, minDist);
    }

    // Corridor walls
    for (const seg of CORRIDOR_WALLS) {
      checkSegmentCollision(pos, seg[0], seg[1], seg[2], seg[3], minDist);
    }
  }
}
