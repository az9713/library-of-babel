import * as THREE from 'three';
import {
  wallMaterial, floorMaterial, ceilingMaterial, shelfMaterial,
  darkMaterial, mirrorMaterial,
} from './materials.js';
import { R, ROOM_HEIGHT, CORRIDOR_LENGTH, HEX_VERTICES, PASSAGE_WALLS } from './room.js';

/**
 * Add vestibule corridors, mirrors, and alcoves to a room
 * @param {THREE.Group} group
 * @returns {{ staircasePositions: Array<{x: number, z: number}> }}
 */
export function addCorridors(group) {
  const corridorWidth = 1.8;
  const corridorDepth = CORRIDOR_LENGTH / 2;
  const passageEdgeZ = R * Math.sqrt(3) / 2;
  const staircasePositions = [];

  for (const passIdx of PASSAGE_WALLS) {
    const va = HEX_VERTICES[passIdx];
    const vb = HEX_VERTICES[(passIdx + 1) % 6];
    const center = new THREE.Vector3((va.x + vb.x) / 2, 0, (va.z + vb.z) / 2);
    const passAngle = Math.atan2(-center.x, -center.z);
    const outwardDir = new THREE.Vector3(center.x, 0, center.z).normalize();
    const rightDir = new THREE.Vector3(-outwardDir.z, 0, outwardDir.x);

    const corridorCenter = center.clone().normalize()
      .multiplyScalar(passageEdgeZ + corridorDepth / 2);

    // Corridor floor
    const corridorFloorGeom = new THREE.PlaneGeometry(corridorWidth, corridorDepth);
    const corridorFloor = new THREE.Mesh(corridorFloorGeom, floorMaterial);
    corridorFloor.rotation.x = -Math.PI / 2;
    corridorFloor.position.copy(corridorCenter);
    corridorFloor.position.y = 0;
    group.add(corridorFloor);

    // Corridor ceiling
    const corridorCeiling = new THREE.Mesh(
      corridorFloorGeom.clone(), ceilingMaterial
    );
    corridorCeiling.rotation.x = Math.PI / 2;
    corridorCeiling.position.copy(corridorCenter);
    corridorCeiling.position.y = ROOM_HEIGHT;
    group.add(corridorCeiling);

    // Corridor side walls
    const corridorWallGeom = new THREE.PlaneGeometry(corridorDepth, ROOM_HEIGHT);

    const leftWallPos = corridorCenter.clone()
      .add(rightDir.clone().multiplyScalar(-corridorWidth / 2));
    const leftWall = new THREE.Mesh(corridorWallGeom, wallMaterial);
    leftWall.position.copy(leftWallPos);
    leftWall.position.y = ROOM_HEIGHT / 2;
    leftWall.rotation.y = passAngle + Math.PI / 2;
    group.add(leftWall);

    const rightWallPos = corridorCenter.clone()
      .add(rightDir.clone().multiplyScalar(corridorWidth / 2));
    const rightWall = new THREE.Mesh(corridorWallGeom, wallMaterial);
    rightWall.position.copy(rightWallPos);
    rightWall.position.y = ROOM_HEIGHT / 2;
    rightWall.rotation.y = passAngle - Math.PI / 2;
    group.add(rightWall);

    // Infill walls (close gap between hex opening and corridor)
    const gapPerSide = (R - corridorWidth) / 2;
    if (gapPerSide > 0.01) {
      const infillGeom = new THREE.PlaneGeometry(gapPerSide, ROOM_HEIGHT);

      const leftInfill = new THREE.Mesh(infillGeom, wallMaterial);
      const leftInfillPos = center.clone()
        .add(rightDir.clone().multiplyScalar(-(corridorWidth / 2 + gapPerSide / 2)));
      leftInfill.position.copy(leftInfillPos);
      leftInfill.position.y = ROOM_HEIGHT / 2;
      leftInfill.rotation.y = passAngle;
      group.add(leftInfill);

      const rightInfill = new THREE.Mesh(infillGeom, wallMaterial);
      const rightInfillPos = center.clone()
        .add(rightDir.clone().multiplyScalar(corridorWidth / 2 + gapPerSide / 2));
      rightInfill.position.copy(rightInfillPos);
      rightInfill.position.y = ROOM_HEIGHT / 2;
      rightInfill.rotation.y = passAngle;
      group.add(rightInfill);
    }

    // Mirror — "a mirror which faithfully duplicates all appearances"
    const mirrorWidth = 0.6;
    const mirrorHeight = 1.0;

    const mirrorPos = leftWallPos.clone().add(rightDir.clone().multiplyScalar(0.02));
    const mirrorPlane = new THREE.PlaneGeometry(mirrorWidth, mirrorHeight);
    const mirror = new THREE.Mesh(mirrorPlane, mirrorMaterial);
    mirror.position.copy(mirrorPos);
    mirror.position.y = 1.6;
    mirror.rotation.y = passAngle + Math.PI / 2;
    group.add(mirror);

    // Mirror frame
    const frameThickness = 0.04;
    const frameDepth = 0.06;
    const frameTop = new THREE.BoxGeometry(
      mirrorWidth + frameThickness * 2, frameThickness, frameDepth
    );
    const frameSide = new THREE.BoxGeometry(frameThickness, mirrorHeight, frameDepth);

    const topFrame = new THREE.Mesh(frameTop, shelfMaterial);
    topFrame.position.copy(mirror.position);
    topFrame.position.y += mirrorHeight / 2 + frameThickness / 2;
    topFrame.rotation.y = mirror.rotation.y;
    group.add(topFrame);

    const bottomFrame = new THREE.Mesh(frameTop, shelfMaterial);
    bottomFrame.position.copy(mirror.position);
    bottomFrame.position.y -= mirrorHeight / 2 + frameThickness / 2;
    bottomFrame.rotation.y = mirror.rotation.y;
    group.add(bottomFrame);

    const leftFrame = new THREE.Mesh(frameSide, shelfMaterial);
    leftFrame.position.copy(mirror.position);
    const frameLeftDir = new THREE.Vector3(
      Math.cos(passAngle + Math.PI / 2), 0, Math.sin(passAngle + Math.PI / 2)
    );
    leftFrame.position.add(
      frameLeftDir.multiplyScalar(mirrorWidth / 2 + frameThickness / 2)
    );
    leftFrame.rotation.y = mirror.rotation.y;
    group.add(leftFrame);

    const rightFrame = new THREE.Mesh(frameSide, shelfMaterial);
    rightFrame.position.copy(mirror.position);
    const frameRightDir = new THREE.Vector3(
      Math.cos(passAngle - Math.PI / 2), 0, Math.sin(passAngle - Math.PI / 2)
    );
    rightFrame.position.add(
      frameRightDir.multiplyScalar(mirrorWidth / 2 + frameThickness / 2)
    );
    rightFrame.rotation.y = mirror.rotation.y;
    group.add(rightFrame);

    // Two small alcove recesses (sleeping and sanitary closets)
    const alcoveWidth = 0.5;
    const alcoveHeight = 1.8;
    const alcoveDepth = 0.3;
    const alcoveGeom = new THREE.BoxGeometry(alcoveWidth, alcoveHeight, alcoveDepth);

    const leftAlcovePos = leftWallPos.clone()
      .add(rightDir.clone().multiplyScalar(0.01));
    const leftAlcove = new THREE.Mesh(alcoveGeom, darkMaterial);
    leftAlcove.position.copy(leftAlcovePos);
    leftAlcove.position.y = alcoveHeight / 2 + 0.2;
    leftAlcove.rotation.y = passAngle + Math.PI / 2;
    group.add(leftAlcove);

    const rightAlcovePos = rightWallPos.clone()
      .add(rightDir.clone().multiplyScalar(-0.01));
    const rightAlcove = new THREE.Mesh(alcoveGeom, darkMaterial);
    rightAlcove.position.copy(rightAlcovePos);
    rightAlcove.position.y = alcoveHeight / 2 + 0.2;
    rightAlcove.rotation.y = passAngle - Math.PI / 2;
    group.add(rightAlcove);

    // Record staircase anchor position for +Z passage only (passIdx === 1)
    if (passIdx === 1) {
      const stairOffset = rightDir.clone().multiplyScalar(0.55);
      const stairCenter = corridorCenter.clone().add(stairOffset);
      staircasePositions.push({ x: stairCenter.x, z: stairCenter.z });
    }
  }

  return { staircasePositions };
}
