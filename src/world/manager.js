import * as THREE from 'three';
import { sharedMaterials } from '../library/materials.js';
import { createRoomShell, ROOM_DEPTH } from '../library/room.js';
import { addBookshelves } from '../library/bookshelf.js';
import { addCorridors } from '../library/corridor.js';
import { addStaircase } from '../library/staircase.js';
import { addArchitecturalDetails } from '../library/architecture.js';
import { isPurifiedRoom } from '../lore/purifiers.js';
import { isCrimsonRoom } from '../lore/crimson.js';

export const FLOOR_OFFSET = 1000000007n;

export class WorldManager {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.rooms = new Map();
    this.currentRoomIndex = 0;
    this.currentHexId = 314159265n;
    this.currentFloor = 0;
    this.staircasePositions = [];
    this.onRoomChange = null; // callback for HUD update
  }

  /** Determine room type from hexId */
  getRoomType(hexId) {
    if (isCrimsonRoom(hexId)) return 'crimson';
    if (isPurifiedRoom(hexId)) return 'purified';
    return 'normal';
  }

  /** Build a complete room at the given hexId and z-offset */
  createFullRoom(hexId, offsetZ) {
    const roomType = this.getRoomType(hexId);

    const { group, lights } = createRoomShell(roomType);
    group.position.z = offsetZ;

    const { bookMesh, bookMap } = addBookshelves(group, hexId, roomType);
    const { staircasePositions } = addCorridors(group);
    for (const pos of staircasePositions) {
      addStaircase(group, pos);
    }
    addArchitecturalDetails(group, hexId);

    return {
      group, bookMesh, bookMap, lights, staircasePositions,
      hexId, roomType,
    };
  }

  /** Dispose a room (geometry + non-shared materials) */
  disposeRoom(room) {
    this.scene.remove(room.group);
    room.group.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(mat => {
            if (!sharedMaterials.has(mat)) mat.dispose();
          });
        } else if (!sharedMaterials.has(obj.material)) {
          obj.material.dispose();
        }
      }
    });
  }

  /** Remove all loaded rooms */
  clearAllRooms() {
    for (const [, room] of this.rooms) {
      this.disposeRoom(room);
    }
    this.rooms.clear();
  }

  /** Load/unload rooms to keep 5 centered on currentRoomIndex */
  updateRooms() {
    const needed = new Set();
    for (let offset = -2; offset <= 2; offset++) {
      needed.add(this.currentRoomIndex + offset);
    }

    // Remove unneeded rooms
    for (const [idx, room] of this.rooms) {
      if (!needed.has(idx)) {
        this.disposeRoom(room);
        this.rooms.delete(idx);
      }
    }

    // Clear and rebuild staircase positions
    this.staircasePositions.length = 0;

    // Add needed rooms
    for (const idx of needed) {
      if (!this.rooms.has(idx)) {
        const hexId = this.currentHexId + BigInt(idx - this.currentRoomIndex);
        const offsetZ = (idx - this.currentRoomIndex) * ROOM_DEPTH;
        const roomData = this.createFullRoom(hexId, offsetZ);
        this.scene.add(roomData.group);
        this.rooms.set(idx, roomData);
      }

      const room = this.rooms.get(idx);
      if (room && room.staircasePositions) {
        for (const stair of room.staircasePositions) {
          this.staircasePositions.push({
            x: stair.x,
            z: stair.z + room.group.position.z,
          });
        }
      }
    }
  }

  /** Check if camera has moved to the next/previous room */
  checkRoomTransition() {
    const localZ = this.camera.position.z;
    const halfDepth = ROOM_DEPTH / 2;

    if (localZ > halfDepth) {
      this.currentRoomIndex++;
      this.currentHexId++;
      this.camera.position.z -= ROOM_DEPTH;
      for (const [, room] of this.rooms) {
        room.group.position.z -= ROOM_DEPTH;
      }
      this.updateRooms();
      if (this.onRoomChange) this.onRoomChange();
    } else if (localZ < -halfDepth) {
      this.currentRoomIndex--;
      this.currentHexId--;
      this.camera.position.z += ROOM_DEPTH;
      for (const [, room] of this.rooms) {
        room.group.position.z += ROOM_DEPTH;
      }
      this.updateRooms();
      if (this.onRoomChange) this.onRoomChange();
    }
  }

  /** Teleport to a specific hexId with fade transition */
  teleportTo(hexId, callback) {
    const fade = document.getElementById('transition-fade');
    fade.classList.add('active');

    setTimeout(() => {
      this.currentHexId = hexId;
      this.camera.position.set(0, 1.6, 0);
      this.clearAllRooms();
      this.currentRoomIndex = 0;
      this.updateRooms();
      if (this.onRoomChange) this.onRoomChange();

      setTimeout(() => {
        fade.classList.remove('active');
        if (callback) callback();
      }, 100);
    }, 300);
  }

  /** Check if player is near a staircase and change floors */
  checkStaircaseTraversal(direction) {
    const pos = this.camera.position;
    let nearStaircase = null;

    for (const stair of this.staircasePositions) {
      const dx = pos.x - stair.x;
      const dz = pos.z - stair.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 0.8) {
        nearStaircase = stair;
        break;
      }
    }

    if (!nearStaircase) return;

    this.currentFloor += direction;
    const newHexId = this.currentHexId + BigInt(this.currentFloor) * FLOOR_OFFSET;

    this.teleportTo(newHexId, () => {
      if (this.staircasePositions.length > 0) {
        const newStair = this.staircasePositions[0];
        this.camera.position.x = newStair.x;
        this.camera.position.z = newStair.z;
      }
    });
  }

  /** Get the current room (the one at currentRoomIndex) */
  getCurrentRoom() {
    return this.rooms.get(this.currentRoomIndex);
  }

  /** Random room teleport */
  randomRoom() {
    const bytes = new Uint8Array(40);
    crypto.getRandomValues(bytes);
    let hexId = 0n;
    for (const b of bytes) {
      hexId = hexId * 256n + BigInt(b);
    }
    // Modulo to keep within reasonable range
    const MAX_HEX = 29n ** 80n / 10496000n;
    hexId = hexId % MAX_HEX;
    this.teleportTo(hexId);
  }
}
