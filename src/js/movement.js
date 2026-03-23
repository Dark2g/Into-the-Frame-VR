  AFRAME.registerComponent('player-move', {
      init() {
        this.keys = {};
        this.dir = new THREE.Vector3();
        this.right = new THREE.Vector3();
        this.up = new THREE.Vector3(0, 1, 0);
        this.camEl = null;
        this._onKeyDown = (e) => { this.keys[e.code] = true; };
        this._onKeyUp = (e) => { this.keys[e.code] = false; };
        window.addEventListener('keydown', this._onKeyDown);
        window.addEventListener('keyup', this._onKeyUp);
      },
      tick() {
        const body = this.el.body;
        if (!body) return;

        if (!this.camEl) this.camEl = document.getElementById('cam');
        if (!this.camEl) return;

        this.camEl.object3D.getWorldDirection(this.dir);
        this.dir.y = 0;
        this.dir.normalize();

        this.right.crossVectors(this.dir, this.up).normalize();

        const speed = 5;
        let vx = 0, vz = 0;

        if (this.keys.KeyS) { vx += this.dir.x; vz += this.dir.z; }
        if (this.keys.KeyW) { vx -= this.dir.x; vz -= this.dir.z; }
        if (this.keys.KeyA) { vx += this.right.x; vz += this.right.z; }
        if (this.keys.KeyD) { vx -= this.right.x; vz -= this.right.z; }

        const vel = body.getLinearVelocity();
        body.setLinearVelocity(new Ammo.btVector3(vx * speed, vel.y(), vz * speed));
        body.setCollisionFlags(body.getCollisionFlags() & ~2);
        body.activate();
      },
      remove() {
        window.removeEventListener('keydown', this._onKeyDown);
        window.removeEventListener('keyup', this._onKeyUp);
      }
    });