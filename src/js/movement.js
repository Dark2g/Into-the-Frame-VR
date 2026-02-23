  AFRAME.registerComponent('player-move', {
      init() {
        this.keys = {};
        window.addEventListener('keydown', e => this.keys[e.code] = true);
        window.addEventListener('keyup', e => this.keys[e.code] = false);
      },
        tick() {
            const body = this.el.body;
            if (!body) return; // espera hasta que el cuerpo exista

            const cam = document.querySelector('#cam');
            if (!cam) return;

            const dir = new THREE.Vector3();
            cam.object3D.getWorldDirection(dir);
            dir.y = 0;
            dir.normalize();

            const right = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize();

            const speed = 3;
            let vx = 0, vz = 0;

            if (this.keys.KeyS) { vx += dir.x; vz += dir.z; }
            if (this.keys.KeyW) { vx -= dir.x; vz -= dir.z; }
            if (this.keys.KeyA) { vx += right.x; vz += right.z; }
            if (this.keys.KeyD) { vx -= right.x; vz -= right.z; }

            const vel = body.getLinearVelocity();
            body.setLinearVelocity(new Ammo.btVector3(vx * speed, vel.y(), vz * speed));
            body.setCollisionFlags(body.getCollisionFlags() & ~2); // elimina el flag kinem�tico
            body.activate(); // reactivar cuerpo
        }

    });