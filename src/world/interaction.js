import * as THREE from 'three';

// Wall index → logical wall (0-3) for the four bookshelf walls
const WALL_MAPPING = { 0: 0, 2: 1, 3: 2, 5: 3 };

export class Interaction {
  constructor(camera, worldManager) {
    this.camera = camera;
    this.world = worldManager;
    this.raycaster = new THREE.Raycaster();
    this.raycaster.far = 3;

    this.hoveredBook = null;
    this.tempColor = new THREE.Color();

    this.onBookClick = null; // callback: (hexId, wall, shelf, vol) => void

    this._onClick = this._onClick.bind(this);
    document.addEventListener('click', this._onClick);
  }

  _onClick() {
    if (!this.world || !this.isLocked) return;

    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);

    for (const [, room] of this.world.rooms) {
      const intersects = this.raycaster.intersectObject(room.bookMesh);
      if (intersects.length > 0) {
        const instanceId = intersects[0].instanceId;
        const bookInfo = room.bookMap[instanceId];
        const logicalWall = WALL_MAPPING[bookInfo.wall];

        if (this.onBookClick) {
          this.onBookClick(room.hexId, logicalWall, bookInfo.shelf, bookInfo.vol);
        }
        return;
      }
    }
  }

  /** Update hover highlight each frame */
  updateHover() {
    if (!this.isLocked) return;

    // Reset previous hover
    if (this.hoveredBook) {
      this.hoveredBook.mesh.setColorAt(
        this.hoveredBook.instanceId,
        this.hoveredBook.originalColor
      );
      this.hoveredBook.mesh.instanceColor.needsUpdate = true;
      this.hoveredBook = null;

      const crosshair = document.getElementById('crosshair');
      if (crosshair) crosshair.style.borderColor = 'rgba(212, 197, 160, 0.5)';
    }

    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);

    for (const [, room] of this.world.rooms) {
      const intersects = this.raycaster.intersectObject(room.bookMesh);
      if (intersects.length > 0) {
        const instanceId = intersects[0].instanceId;
        room.bookMesh.getColorAt(instanceId, this.tempColor);

        this.hoveredBook = {
          mesh: room.bookMesh,
          instanceId,
          originalColor: this.tempColor.clone(),
        };

        // Brighten on hover
        this.tempColor.multiplyScalar(1.5);
        room.bookMesh.setColorAt(instanceId, this.tempColor);
        room.bookMesh.instanceColor.needsUpdate = true;

        const crosshair = document.getElementById('crosshair');
        if (crosshair) crosshair.style.borderColor = 'rgba(212, 160, 58, 0.9)';
        break;
      }
    }
  }

  set isLocked(val) {
    this._isLocked = val;
  }

  get isLocked() {
    return this._isLocked;
  }
}
