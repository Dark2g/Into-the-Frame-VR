AFRAME.registerComponent('door-portal', {
      schema: {
        scene: { type: 'string' },
        label: { type: 'string', default: '' }
      }
    });

    /* ─────────────────────────────────────────────
       Componente: door-detector (en el jugador)
       Detecta proximidad y cruce de puertas
       ───────────────────────────────────────────── */
    AFRAME.registerComponent('door-detector', {
      init() {
        this.doorEntities = [];
        this.hudDoor = document.getElementById('hud-door');
        this.loadingScreen = document.getElementById('loading-screen');
        this.isTransitioning = false;
        this.playerPos = new THREE.Vector3();
        this.doorPos   = new THREE.Vector3();

        // Collect doors after scene loads
        this.el.sceneEl.addEventListener('loaded', () => {
          this.doorEntities = Array.from(document.querySelectorAll('[door-portal]'));
        });
      },

      tick() {
        if (this.isTransitioning) return;
        if (this.doorEntities.length === 0) return;

        this.el.object3D.getWorldPosition(this.playerPos);

        let closestDoor = null;
        let closestDist = Infinity;

        for (const doorEl of this.doorEntities) {
          doorEl.object3D.getWorldPosition(this.doorPos);

          const dx = this.playerPos.x - this.doorPos.x;
          const dz = this.playerPos.z - this.doorPos.z;
          const dist = Math.sqrt(dx * dx + dz * dz);

          if (dist < closestDist) {
            closestDist = dist;
            closestDoor = doorEl;
          }
        }

        // Show label when close (< 6m)
        if (closestDoor && closestDist < 6) {
          const data = closestDoor.getAttribute('door-portal');
          if(data.label!=""){
            this.hudDoor.textContent = '[ ' + data.label + ' ] — Acercate para entrar';
          this.hudDoor.classList.add('visible');
          }
          
        } else {
          this.hudDoor.classList.remove('visible');
        }

        // Cross threshold (< 1.8m) → navigate
        if (closestDoor && closestDist < 1.8) {
          this.enterDoor(closestDoor);
        }
      },

      enterDoor(doorEl) {
        this.isTransitioning = true;
        const data = doorEl.getAttribute('door-portal');

        // Show loading screen
        this.loadingScreen.querySelector('h2').textContent = data.label;
        this.loadingScreen.classList.add('active');
        this.hudDoor.classList.remove('visible');

        // Navigate after brief transition
        setTimeout(() => {
          window.location.href = data.scene;
        }, 800);
      }
    });
