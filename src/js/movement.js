  /* ── Componente que va en cada mando VR ── */
  AFRAME.registerComponent('vr-thumbstick', {
    init: function () {
      this.el.addEventListener('thumbstickmoved', function (evt) {
        var player = document.querySelector('[player-move]');
        if (player && player.components['player-move']) {
          player.components['player-move'].thumbstick.x = evt.detail.x;
          player.components['player-move'].thumbstick.y = evt.detail.y;
        }
      });
      this.el.addEventListener('trackpadmoved', function (evt) {
        var player = document.querySelector('[player-move]');
        if (player && player.components['player-move']) {
          player.components['player-move'].thumbstick.x = evt.detail.x;
          player.components['player-move'].thumbstick.y = evt.detail.y;
        }
      });
    }
  });

  AFRAME.registerComponent('player-move', {
      init() {
        this.keys = {};
        this.thumbstick = { x: 0, y: 0 };
        window.addEventListener('keydown', e => this.keys[e.code] = true);
        window.addEventListener('keyup', e => this.keys[e.code] = false);
      },
        tick(t, dt) {
            var cam = document.querySelector('#cam');
            if (!cam) return;

            var dir = new THREE.Vector3();
            cam.object3D.getWorldDirection(dir);
            dir.y = 0;
            dir.normalize();

            var right = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize();

            var speed = 5;
            var vx = 0, vz = 0;

            if (this.keys.KeyS) { vx += dir.x; vz += dir.z; }
            if (this.keys.KeyW) { vx -= dir.x; vz -= dir.z; }
            if (this.keys.KeyA) { vx += right.x; vz += right.z; }
            if (this.keys.KeyD) { vx -= right.x; vz -= right.z; }

            // VR thumbstick
            var tx = this.thumbstick.x;
            var ty = this.thumbstick.y;
            if (Math.abs(tx) > 0.1 || Math.abs(ty) > 0.1) {
              vx += -dir.x * ty + -right.x * tx;
              vz += -dir.z * ty + -right.z * tx;
            }

            if (vx === 0 && vz === 0) return;

            // intenta physics, si no, mueve directamente
            var body = this.el.body;
            if (body) {
              var vel = body.getLinearVelocity();
              body.setLinearVelocity(new Ammo.btVector3(vx * speed, vel.y(), vz * speed));
              body.setCollisionFlags(body.getCollisionFlags() & ~2);
              body.activate();
            } else {
              // Fallback: mover posición directamente
              var delta = (dt || 16) / 1000;
              var pos = this.el.object3D.position;
              pos.x += vx * speed * delta;
              pos.z += vz * speed * delta;
            }
        }

    });