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
              vx += dir.x * ty + -right.x * tx;
              vz += dir.z * ty + -right.z * tx;
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

  /* ───────────────────────────────────────────────
     VR Menu: crea botones 3D que replican la UI HTML
     Solo visible dentro de VR inmersivo
     ─────────────────────────────────────────────── */
  (function () {
    var created = false;

    function buildVRMenu() {
      if (created) return;
      created = true;

      var scene = document.querySelector('a-scene');
      if (!scene) return;

      // Detectar qué botones HTML existen
      var btns = [];
      if (document.getElementById('btn-hub')) {
        btns.push({ label: '\u2190 Menu', bg: '#1a1a2e', fg: '#f0e6d3',
          click: function () { window.location.href = 'index.html'; } });
      }
      if (document.querySelector('.btn-enano')) {
        btns.push({ label: 'Modo enano', bg: '#2ecc71', fg: '#111111',
          click: function () { if (window.setPlayerState) window.setPlayerState('enano'); } });
      }
      if (document.querySelector('.btn-normal')) {
        btns.push({ label: 'Modo normal', bg: '#60abdd', fg: '#ffffff',
          click: function () { if (window.setPlayerState) window.setPlayerState('normal'); } });
      }
      if (btns.length === 0) return;

      // Contenedor: hijo de la cámara, abajo-centro del campo de visión
      var menu = document.createElement('a-entity');
      menu.setAttribute('id', 'vr-menu');
      menu.setAttribute('position', '0 -0.4 -0.8');
      menu.setAttribute('rotation', '-25 0 0');
      menu.setAttribute('visible', false);

      btns.forEach(function (b, i) {
        var plane = document.createElement('a-plane');
        plane.setAttribute('width', 0.4);
        plane.setAttribute('height', 0.1);
        plane.setAttribute('color', b.bg);
        plane.setAttribute('opacity', 0.9);
        plane.setAttribute('position', ((i - (btns.length - 1) / 2) * 0.45) + ' 0 0');
        plane.classList.add('clickable');

        var txt = document.createElement('a-text');
        txt.setAttribute('value', b.label);
        txt.setAttribute('align', 'center');
        txt.setAttribute('color', b.fg);
        txt.setAttribute('width', 1.2);
        txt.setAttribute('position', '0 0 0.01');
        plane.appendChild(txt);

        // Hover
        plane.addEventListener('mouseenter', function () {
          plane.setAttribute('opacity', 1);
          plane.object3D.scale.set(1.1, 1.1, 1.1);
        });
        plane.addEventListener('mouseleave', function () {
          plane.setAttribute('opacity', 0.9);
          plane.object3D.scale.set(1, 1, 1);
        });
        plane.addEventListener('click', b.click);

        menu.appendChild(plane);
      });

      // Anclar a la cámara
      var cam = document.querySelector('#cam');
      if (cam) { cam.appendChild(menu); }
      else { scene.appendChild(menu); }

      // Mostrar solo en VR
      scene.addEventListener('enter-vr', function () {
        menu.setAttribute('visible', true);
      });
      scene.addEventListener('exit-vr', function () {
        menu.setAttribute('visible', false);
      });
    }

    // Esperar a que la escena esté lista
    function waitScene() {
      var s = document.querySelector('a-scene');
      if (s) { s.addEventListener('loaded', buildVRMenu); }
      else { window.addEventListener('DOMContentLoaded', function () {
        document.querySelector('a-scene').addEventListener('loaded', buildVRMenu);
      }); }
    }
    waitScene();
  })();