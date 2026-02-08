import * as THREE from 'three';
import { ROOM_HEIGHT } from '../library/room.js';

const DUST_COUNT = 400;
const ASH_COUNT = 100;

export class ParticleSystem {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;

    // Dust motes — warm amber, floating
    this.dustPositions = new Float32Array(DUST_COUNT * 3);
    this.dustVelocities = [];

    for (let i = 0; i < DUST_COUNT; i++) {
      this.dustPositions[i * 3] = (Math.random() - 0.5) * 24;
      this.dustPositions[i * 3 + 1] = Math.random() * ROOM_HEIGHT;
      this.dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 24;
      this.dustVelocities.push(
        (Math.random() - 0.5) * 0.015,
        (Math.random() - 0.5) * 0.008,
        (Math.random() - 0.5) * 0.015
      );
    }

    const dustGeom = new THREE.BufferGeometry();
    dustGeom.setAttribute('position', new THREE.BufferAttribute(this.dustPositions, 3));
    const dustMat = new THREE.PointsMaterial({
      color: 0xFFD280,
      size: 0.018,
      transparent: true,
      opacity: 0.3,
      sizeAttenuation: true,
    });
    this.dustParticles = new THREE.Points(dustGeom, dustMat);
    scene.add(this.dustParticles);

    // Ash particles (for purified rooms) — darker, downward drift
    this.ashPositions = new Float32Array(ASH_COUNT * 3);
    this.ashVelocities = [];

    for (let i = 0; i < ASH_COUNT; i++) {
      this.ashPositions[i * 3] = (Math.random() - 0.5) * 12;
      this.ashPositions[i * 3 + 1] = Math.random() * ROOM_HEIGHT;
      this.ashPositions[i * 3 + 2] = (Math.random() - 0.5) * 12;
      this.ashVelocities.push(
        (Math.random() - 0.5) * 0.008,
        -0.005 - Math.random() * 0.01, // downward drift
        (Math.random() - 0.5) * 0.008
      );
    }

    const ashGeom = new THREE.BufferGeometry();
    ashGeom.setAttribute('position', new THREE.BufferAttribute(this.ashPositions, 3));
    const ashMat = new THREE.PointsMaterial({
      color: 0x444038,
      size: 0.022,
      transparent: true,
      opacity: 0.25,
      sizeAttenuation: true,
    });
    this.ashParticles = new THREE.Points(ashGeom, ashMat);
    this.ashParticles.visible = false;
    scene.add(this.ashParticles);
  }

  /** Show/hide ash particles based on current room type */
  setRoomType(roomType) {
    this.ashParticles.visible = roomType === 'purified';
  }

  update(delta) {
    const cam = this.camera.position;

    // Update dust
    const dPos = this.dustParticles.geometry.attributes.position.array;
    for (let i = 0; i < DUST_COUNT; i++) {
      dPos[i * 3] += this.dustVelocities[i * 3] * delta * 60;
      dPos[i * 3 + 1] += this.dustVelocities[i * 3 + 1] * delta * 60;
      dPos[i * 3 + 2] += this.dustVelocities[i * 3 + 2] * delta * 60;

      // Wrap around camera
      if (Math.abs(dPos[i * 3] - cam.x) > 12) dPos[i * 3] = cam.x + (Math.random() - 0.5) * 20;
      if (Math.abs(dPos[i * 3 + 2] - cam.z) > 12) dPos[i * 3 + 2] = cam.z + (Math.random() - 0.5) * 20;
      if (dPos[i * 3 + 1] > ROOM_HEIGHT) dPos[i * 3 + 1] = 0;
      if (dPos[i * 3 + 1] < 0) dPos[i * 3 + 1] = ROOM_HEIGHT;
    }
    this.dustParticles.geometry.attributes.position.needsUpdate = true;

    // Update ash (if visible)
    if (this.ashParticles.visible) {
      const aPos = this.ashParticles.geometry.attributes.position.array;
      for (let i = 0; i < ASH_COUNT; i++) {
        aPos[i * 3] += this.ashVelocities[i * 3] * delta * 60;
        aPos[i * 3 + 1] += this.ashVelocities[i * 3 + 1] * delta * 60;
        aPos[i * 3 + 2] += this.ashVelocities[i * 3 + 2] * delta * 60;

        if (Math.abs(aPos[i * 3] - cam.x) > 6) aPos[i * 3] = cam.x + (Math.random() - 0.5) * 10;
        if (Math.abs(aPos[i * 3 + 2] - cam.z) > 6) aPos[i * 3 + 2] = cam.z + (Math.random() - 0.5) * 10;
        if (aPos[i * 3 + 1] < 0) aPos[i * 3 + 1] = ROOM_HEIGHT;
      }
      this.ashParticles.geometry.attributes.position.needsUpdate = true;
    }
  }
}
