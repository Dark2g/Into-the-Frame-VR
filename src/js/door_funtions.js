AFRAME.registerComponent('door-portal', {
      schema: {
        scene: { type: 'string' },
        label: { type: 'string', default: '' }
      }
    });

    AFRAME.registerComponent('door-detector', {
      init() {
        this.doorEntities = [];
        this.hudDoor = document.getElementById('hud-door');
        this.loadingScreen = document.getElementById('loading-screen');
        this.isTransitioning = false;
        this.playerPos = new THREE.Vector3();
        this.doorPos   = new THREE.Vector3();

        this.el.sceneEl.addEventListener('loaded', () => {
          this.doorEntities = Array.from(document.querySelectorAll('[door-portal]'));
        });
      },

      tick() {
        if (this.isTransitioning || this.doorEntities.length === 0) return;

        this.el.object3D.getWorldPosition(this.playerPos);

        let closestDoor = null;
        let closestDist = Infinity;

        for (let i = 0, len = this.doorEntities.length; i < len; i++) {
          const doorEl = this.doorEntities[i];
          doorEl.object3D.getWorldPosition(this.doorPos);

          const dx = this.playerPos.x - this.doorPos.x;
          const dz = this.playerPos.z - this.doorPos.z;
          const distSq = dx * dx + dz * dz;

          if (distSq < closestDist) {
            closestDist = distSq;
            closestDoor = doorEl;
          }
        }

        // Show label when close (< 6m → 36 squared)
        if (closestDoor && closestDist < 36) {
          const data = closestDoor.getAttribute('door-portal');
          if (data.label !== '') {
            this.hudDoor.textContent = '[ ' + data.label + ' ] — Acercate para entrar';
            this.hudDoor.classList.add('visible');
          }
        } else {
          this.hudDoor.classList.remove('visible');
        }

        // Cross threshold (< 1.8m → 3.24 squared)
        if (closestDoor && closestDist < 3.24) {
          this.enterDoor(closestDoor);
        }
      },

      enterDoor(doorEl) {
        this.isTransitioning = true;
        const data = doorEl.getAttribute('door-portal');

        this.loadingScreen.querySelector('h2').textContent = data.label;
        this.loadingScreen.classList.add('active');
        this.hudDoor.classList.remove('visible');

        setTimeout(() => {
          window.location.href = data.scene;
        }, 800);
      }
    });
