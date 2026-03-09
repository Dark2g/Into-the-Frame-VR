// Componente para mejorar la nitidez de las texturas (Filtrado Anisotrópico)
AFRAME.registerComponent('mejora-textura', {
  init: function () {
    this.el.addEventListener('materialtextureloaded', (e) => {
      var texture = e.detail.texture;
      if (texture) {
        var maxAnisotropy = this.el.sceneEl.renderer.capabilities.getMaxAnisotropy();
        texture.anisotropy = maxAnisotropy;
        texture.needsUpdate = true;
      }
    });
  }
});

// Componente para crear barreras invisibles (ADAPTADO AL CASTILLO)
AFRAME.registerComponent('seguridad-plataforma', {
  tick: function () {
    var pos = this.el.getAttribute('position');

    // Límites laterales para no caerse por los bordes antes de empezar
    if (pos.x < -28.5) pos.x = -28.5;
    if (pos.x > 29.5) pos.x = 29.5;

    // Límite trasero (evita que te caigas por la espalda del spawn)
    if (pos.z > 33) pos.z = 33;

    this.el.setAttribute('position', pos);
  }
});

// Componente para detectar cuando se PISA la baldosa
AFRAME.registerComponent('baldosa-interactiva', {
  init: function () {
    this.falling = false;
    this.velocity = 0;
  },
  trigger: function () {
    if (this.falling) return;

    var isSafe = this.el.getAttribute('data-safe') === 'true';

    if (!isSafe) {
      this.el.setAttribute('opacity', '0.5');
      this.el.setAttribute('data-falling', 'true');
      this.falling = true;

      // ELIMINAR FÍSICAS DE AMMO PARA QUE EL JUGADOR CAIGA NATURALMENTE
      this.el.removeAttribute('ammo-body');
      this.el.removeAttribute('ammo-shape');
    }
  },
  tick: function (time, timeDelta) {
    if (this.falling) {
      // Animación visual de la baldosa cayendo hacia el abismo
      var dt = timeDelta / 1000;
      var pos = this.el.getAttribute('position');
      this.velocity -= 9.8 * dt;
      pos.y += this.velocity * dt;
      this.el.setAttribute('position', pos);
    }
  }
});

// Componente de sensor de baldosas 100% nativo para Ammo.js
AFRAME.registerComponent('baldosa-sensor', {
  init: function () {
    this.raycaster = new THREE.Raycaster();
    this.raycaster.ray.direction.set(0, -1, 0); // Rayo apuntando hacia abajo
    this.raycaster.far = 6.0; // El rig tiene scale 5 → jugador a y≈16, baldosas a y≈12, distancia ≈ 4

    this.frases = [];
    this.coordenadasRuta = [];
    this.lastCoords = null;
    this.isDead = false;
    this.hudShown = false;
  },
  tick: function () {
    var playerPos = new THREE.Vector3();
    this.el.object3D.getWorldPosition(playerPos);

    // Disparar rayo desde el jugador hacia el suelo
    this.raycaster.ray.origin.copy(playerPos);

    var grid = document.querySelector('#grid-container');

    if (grid && grid.object3D) {
      var intersections = this.raycaster.intersectObject(grid.object3D, true);

      if (intersections.length > 0) {
        var hitObj = intersections[0].object;

        // Buscar la entidad A-Frame
        var hitEl = hitObj.el;
        while (!hitEl && hitObj.parent) {
          hitObj = hitObj.parent;
          hitEl = hitObj.el;
        }

        // Si la imagen fue golpeada, subir a la caja
        if (hitEl && hitEl.tagName === 'A-IMAGE' && hitEl.parentEl) {
          hitEl = hitEl.parentEl;
        }

        // --- SISTEMA DE DIÁLOGOS (PASO A PASO) ---
        if (hitEl && hitEl.classList.contains('baldosa')) {
          // Mostrar HUD de pistas la primera vez que pisamos una baldosa
          if (!this.hudShown) {
            this.hudShown = true;
            var hudLevel = document.querySelector('#hud-level');
            if (hudLevel) hudLevel.style.display = 'flex';
          }

          var coords = hitEl.getAttribute('data-coords');

          if (coords !== this.lastCoords) {
            this.lastCoords = coords;
            var isSafe = hitEl.getAttribute('data-safe') === 'true';

            // Actualizar HUD
            if (isSafe && this.coordenadasRuta.length > 0) {
              var stepIndex = this.coordenadasRuta.indexOf(coords);
              var hudText = document.querySelector('#row-display');

              if (hudText && !this.isDead) {
                if (stepIndex !== -1 && stepIndex + 1 < this.frases.length) {
                  hudText.innerText = this.frases[stepIndex + 1];
                } else if (stepIndex === this.coordenadasRuta.length - 1) {
                  hudText.innerText = "Hecho. Has cruzado mi dominio.";
                  // Añadir timer y cargar index.html
                  // esperar 5 segundos
                  setTimeout(() => {
                    window.location.href = "index.html";
                  }, 5000);
                }
              }
            }

            // Activar caída
            if (hitEl.components['baldosa-interactiva']) {
              hitEl.components['baldosa-interactiva'].trigger();
            }
          }
        }
      }
    }

    // --- DETECCIÓN DE CAÍDA (JUMPSCARE ADAPTATIVO) ---
    if (playerPos.y < 10 && !this.isDead) {
      this.isDead = true;
      var hudImg = document.querySelector('#hud-img');
      if (hudImg) {
        hudImg.style.width = 'clamp(250px, 50vw, 800px)';
        hudImg.style.height = 'clamp(250px, 50vw, 800px)';
        hudImg.setAttribute('src', '../assets/2D/reinaenfadada.png');
      }

      var hudText = document.querySelector('#row-display');


      if (hudText && hudText.parentElement) {
        hudText.innerText = "¡TE EQUIVOCASTE!";
        hudText.parentElement.style.fontSize = 'clamp(30px, 4vw, 80px)';
        hudText.parentElement.style.color = 'red';
        hudText.parentElement.style.borderColor = 'red';
      }
    }

    // --- RESET CUANDO EL SISTEMA DEL CASTILLO TE TELETRANSPORTA ARRIBA ---
    if (playerPos.y > 11.5 && this.isDead) {
      this.isDead = false;
      this.lastCoords = null;

      var hudImg = document.querySelector('#hud-img');
      if (hudImg) {
        hudImg.style.width = 'clamp(120px, 15vw, 300px)';
        hudImg.style.height = 'clamp(120px, 15vw, 300px)';
        hudImg.setAttribute('src', '../assets/2D/reinaminiatura.png');
      }

      var hudText = document.querySelector('#row-display');
      if (hudText && hudText.parentElement) {
        if (this.frases.length > 0) hudText.innerText = this.frases[0];
        hudText.parentElement.style.fontSize = 'clamp(16px, 1.8vw, 35px)';
        hudText.parentElement.style.color = 'black';
        hudText.parentElement.style.borderColor = 'black';
      }
    }
  }
});

// Script principal: Generar Grid
document.addEventListener('DOMContentLoaded', function () {
  var container = document.querySelector('#grid-container');
  if (!container) return;

  // REAJUSTE PERFECTO: Forzamos la escala real (1) y colocamos el inicio 
  // exactamente donde acaba el suelo de tu castillo (Z=-40).
  container.setAttribute('scale', '1 1 1');
  container.setAttribute('position', '0 12 -40');

  var rutasPosibles = [
    {
      nombre: "Ruta 1",
      coordenadas: [
        '[0,2]', '[1,2]', '[2,2]', '[2,1]', '[2,0]', '[3,0]', '[4,0]', '[4,1]', '[5,1]',
        '[6,1]', '[6,0]', '[7,0]', '[8,0]', '[8,1]', '[8,2]', '[9,2]', '[10,2]', '[10,3]',
        '[10,4]', '[11,4]', '[11,3]', '[11,2]', '[11,1]', '[12,1]', '[13,1]', '[13,2]',
        '[14,2]', '[15,2]', '[15,1]', '[16,1]', '[16,2]', '[17,2]'
      ],
      frases: [
        "Un buen sombrero impone respeto… incluso cuando no hay cabeza debajo en el centro.",
        "Las flores del jardín saben encogerse cuando paso.",
        "La pica no es un símbolo; es una advertencia.",
        "Mi gato sonríe incluso cuando el resto del reino tiembla.",
        "Una taza para pensar, otra para decidir… y la tercera para condenar.",
        "A las cinco en punto tomo decisiones irrevocables.",
        "Mi retrato en la carta no sonríe… porque no lo necesita.",
        "Una cucharada de gelatina y el castillo me queda pequeño.",
        "Hay secretos que sólo le susurro a un felino con demasiados dientes.",
        "Las puertas cerradas son sólo invitaciones para mi llave.",
        "Las cinco… ¿de la mañana o de la tarde? Sólo yo conozco la diferencia.",
        "Cuando la Q de picas aparece, el destino ya ha sido sellado.",
        "Tomar tres tazas de té. Ni dos, ni cuatro. El equilibrio del imperio depende de ello.",
        "Si ves una sonrisa flotando en la oscuridad, probablemente ya has sido juzgado.",
        "Todo en este reino termina bajo mi marca.",
        "Cambio de sombrerero según mi humor; el reino nunca sabe cuando nos quedaremos sin uno.",
        "Arranco pétalos cuando necesito que el mundo se haga más pequeño.",
        "No hay espejo más bello que mi propio rostro en la baraja.",
        "La grandeza puede ser tan inestable como un postre tembloroso.",
        "Mi gato sonríe incluso cuando el resto del reino tiembla.",
        "El té sabe mejor cuando se bebe desde lo más alto.",
        "Donde clavo la pica, florece la obediencia.",
        "Hay secretos que sólo le susurro a un felino con demasiados dientes.",
        "Me divierte observar quién se atreve a mirar por la cerradura.",
        "Crecer sin medida es fácil… mantener la dignidad, no tanto.",
        "Cada pétalo que cae de la flor, es una promesa más que no pienso cumplir.",
        "La pica no es un símbolo; es una advertencia.",
        "Bajo un sombrero guardo ideas peligrosamente elegantes.",
        "Tengo llaves para todas las puertas… excepto para la paciencia.",
        "Una cucharada de gelatina y el castillo me queda pequeño.",
        "Las flores del jardín saben encogerse cuando paso.",
        "Todo en este reino termina bajo mi marca."
      ]
    },
    {
      nombre: "Ruta 2",
      coordenadas: [
        '[0,0]', '[0,1]', '[1,1]', '[2,1]', '[2,2]', '[3,2]', '[4,2]', '[4,3]', '[4,4]',
        '[5,4]', '[5,3]', '[6,3]', '[6,2]', '[6,1]', '[7,1]', '[8,1]', '[8,0]', '[9,0]',
        '[10,0]', '[10,1]', '[11,1]', '[11,2]', '[12,2]', '[13,2]', '[13,3]', '[14,3]',
        '[15,3]', '[15,4]', '[16,4]', '[17,4]'
      ],
      frases: [
        "A las cinco en punto tomo decisiones irrevocables hacia la izquierda.",
        "Las puertas cerradas son sólo invitaciones para mi llave.",
        "Una cucharada de gelatina y el castillo me queda pequeño.",
        "Mi gato sonríe incluso cuando el resto del reino tiembla.",
        "La pica no es un símbolo; es una advertencia.",
        "Un buen sombrero impone respeto… incluso cuando no hay cabeza debajo.",
        "Arranco pétalos cuando necesito que el mundo se haga más pequeño.",
        "No hay espejo más bello que mi propio rostro en la baraja.",
        "La grandeza puede ser tan inestable como un postre tembloroso.",
        "Hay secretos que sólo le susurro a un felino con demasiados dientes.",
        "Tomar tres tazas de té. Ni dos, ni cuatro. El equilibrio del imperio depende de ello.",
        "Las cinco… ¿de la mañana o de la tarde? Sólo yo conozco la diferencia.",
        "Cambio de sombrerero según mi humor; el reino nunca sabe cuando nos quedaremos sin uno.",
        "Me divierte observar quién se atreve a mirar por la cerradura.",
        "Crecer sin medida es fácil… mantener la dignidad, no tanto.",
        "Si ves una sonrisa flotando en la oscuridad, probablemente ya has sido juzgado.",
        "El té sabe mejor cuando se bebe desde lo más alto.",
        "Cuando el reloj señala las cinco, alguien pierde la cabeza… ya sea por mi encanto o por mi determinación.",
        "Cuando la Q de picas aparece, el destino ya ha sido sellado.",
        "Una cucharada de gelatina y el castillo me queda pequeño.",
        "Mi gato sonríe incluso cuando el resto del reino tiembla.",
        "Todo en este reino termina bajo mi marca.",
        "Bajo un sombrero guardo ideas peligrosamente elegantes.",
        "Cada pétalo que cae de la flor, es una promesa más que no pienso cumplir.",
        "Mi retrato en la carta no sonríe… porque no lo necesita.",
        "Una taza para pensar, otra para decidir… y la tercera para condenar.",
        "A las cinco en punto tomo decisiones irrevocables.",
        "Tengo llaves para todas las puertas… excepto para la paciencia.",
        "La grandeza puede ser tan inestable como un postre tembloroso.",
        "Hay secretos que sólo le susurro a un felino con demasiados dientes."
      ]
    },
    {
      nombre: "Ruta 3",
      coordenadas: [
        '[0,4]', '[1,4]', '[2,4]', '[2,3]', '[3,3]', '[4,3]', '[4,4]', '[5,4]', '[6,4]',
        '[7,4]', '[7,3]', '[7,2]', '[8,2]', '[8,1]', '[8,0]', '[9,0]', '[9,1]', '[9,2]',
        '[10,2]', '[11,2]', '[12,2]', '[12,3]', '[12,4]', '[12,5]', '[13,5]', '[14,5]',
        '[15,5]', '[15,4]', '[16,4]', '[17,4]'
      ],
      frases: [
        "Las puertas cerradas son sólo invitaciones para mi llave de la derecha.",
        "Una cucharada de gelatina y el castillo me queda pequeño.",
        "Mi gato sonríe incluso cuando el resto del reino tiembla.",
        "Tomar tres tazas de té. Ni dos, ni cuatro. El equilibrio del imperio depende de ello.",
        "A las cinco en punto tomo decisiones irrevocables.",
        "No hay espejo más bello que mi propio rostro en la baraja.",
        "La grandeza puede ser tan inestable como un postre tembloroso.",
        "Hay secretos que sólo le susurro a un felino con demasiados dientes.",
        "Me divierte observar quién se atreve a mirar por la cerradura.",
        "Crecer sin medida es fácil… mantener la dignidad, no tanto.",
        "Cuando la Q de picas aparece, el destino ya ha sido sellado.",
        "Arranco pétalos cuando necesito que el mundo se haga más pequeño.",
        "La pica no es un símbolo; es una advertencia.",
        "Si ves una sonrisa flotando en la oscuridad, probablemente ya has sido juzgado.",
        "El té sabe mejor cuando se bebe desde lo más alto.",
        "Las cinco… ¿de la mañana o de la tarde? Sólo yo conozco la diferencia.",
        "Tengo llaves para todas las puertas… excepto para la paciencia.",
        "Un buen sombrero impone respeto… incluso cuando no hay cabeza debajo.",
        "Cada pétalo que cae de la flor, es una promesa más que no pienso cumplir.",
        "Todo en este reino termina bajo mi marca.",
        "Cambio de sombrerero según mi humor; el reino nunca sabe cuando nos quedaremos sin uno.",
        "Cuando el reloj señala las cinco, alguien pierde la cabeza… ya sea por mi encanto o por mi determinación.",
        "Las puertas cerradas son sólo invitaciones para mi llave.",
        "Bajo un sombrero guardo ideas peligrosamente elegantes.",
        "Las flores del jardín saben encogerse cuando paso.",
        "Donde clavo la pica, florece la obediencia.",
        "Un buen sombrero impone respeto… incluso cuando no hay cabeza debajo.",
        "Me divierte observar quién se atreve a mirar por la cerradura.",
        "Una cucharada de gelatina y el castillo me queda pequeño.",
        "Mi gato sonríe incluso cuando el resto del reino tiembla."
      ]
    }
  ];

  var rutaElegida = rutasPosibles[Math.floor(Math.random() * rutasPosibles.length)];
  console.log("Ruta seleccionada:", rutaElegida.nombre);

  var patternImages = [
    ['../assets/2d/Symbols/Individual symbols/Clock.png', '../assets/2d/Symbols/Individual symbols/Hole and Key.png', '../assets/2d/Symbols/Individual symbols/Hat.png', '../assets/2d/Symbols/Individual symbols/Clock.png', '../assets/2d/Symbols/Individual symbols/Hole and Key.png', '../assets/2d/Symbols/Individual symbols/Hat.png'],
    ['../assets/2d/Symbols/Individual symbols/Card.png', '../assets/2d/Symbols/Individual symbols/Jelly.png', '../assets/2d/Symbols/Individual symbols/Flower.png', '../assets/2d/Symbols/Individual symbols/Card.png', '../assets/2d/Symbols/Individual symbols/Jelly.png', '../assets/2d/Symbols/Individual symbols/Flower.png'],
    ['../assets/2d/Symbols/Individual symbols/Cups.png', '../assets/2d/Symbols/Individual symbols/Chessire.png', '../assets/2d/Symbols/Individual symbols/Spade.png', '../assets/2d/Symbols/Individual symbols/Cups.png', '../assets/2d/Symbols/Individual symbols/Chessire.png', '../assets/2d/Symbols/Individual symbols/Spade.png']
  ];

  // --- MATEMÁTICAS EXACTAS PARA EL HUECO DE 75 METROS ---
  var tileWidth = 9.6;           // 6x9.6 = 57.6m (Perfecto para la plataforma que mide ~58m)
  var tileDepth = 85.0 / 18.0;   // ~4.166m para que 18 filas midan exactamente 75 metros

  var baldosasArray = [];

  for (var z = 0; z < 18; z++) {
    for (var x = 0; x < 6; x++) {
      var box = document.createElement('a-entity');

      var posX = (x - 2.5) * tileWidth;
      // Posición local Z: se desplaza media baldosa para que empiece justo en el borde 0
      var posZ = -z * tileDepth - (tileDepth / 2);

      box.setAttribute('geometry', `primitive: box; width: ${tileWidth}; height: 1.0; depth: ${tileDepth}`);
      box.setAttribute('material', 'color: #EEEEEE');
      box.setAttribute('position', { x: posX, y: -0.5, z: posZ });

      var imgEl = document.createElement('a-image');
      var rowPattern = patternImages[z % 3];
      var symbol = rowPattern[x];

      imgEl.setAttribute('src', symbol);
      imgEl.setAttribute('rotation', '-90 0 0');
      imgEl.setAttribute('width', tileWidth - 0.4);
      imgEl.setAttribute('height', tileDepth - 0.1);
      imgEl.setAttribute('position', '0 0.51 0');
      imgEl.setAttribute('mejora-textura', '');
      box.appendChild(imgEl);

      box.setAttribute('class', 'baldosa');

      var coordStr = '[' + z + ',' + x + ']';
      box.setAttribute('data-coords', coordStr);
      box.setAttribute('baldosa-interactiva', '');

      if (rutaElegida.coordenadas.includes(coordStr)) {
        box.setAttribute('data-safe', 'true');
      } else {
        box.setAttribute('data-safe', 'false');
      }

      container.appendChild(box);
      baldosasArray.push(box);
    }
  }

  // --- FÍSICAS RECALCULADAS CON EXACTITUD ---
  var sceneEl = document.querySelector('a-scene');
  var addPhysicsToTiles = function () {
    container.object3D.updateMatrixWorld(true);

    setTimeout(function () {
      // Dimensiones de la forma física exactas a la nueva medida (la mitad del total)
      var halfX = tileWidth / 2;
      var halfZ = tileDepth / 2;

      baldosasArray.forEach(function (baldosa) {
        if (baldosa.getAttribute('data-falling') === 'true') return;
        baldosa.setAttribute('ammo-body', 'type: static');
        baldosa.setAttribute('ammo-shape', `type: box; halfExtents: ${halfX} 0.5 ${halfZ}`);
      });
      console.log("✅ Físicas de baldosas milimétricas cargadas.");
    }, 800);
  };

  if (sceneEl.hasLoaded) {
    addPhysicsToTiles();
  } else {
    sceneEl.addEventListener('loaded', addPhysicsToTiles);
  }

  // --- INYECTAR DATOS AL SENSOR AL CARGAR ---
  var tryAssign = setInterval(function () {
    var sensorEl = document.querySelector('[baldosa-sensor]');
    if (sensorEl && sensorEl.components['baldosa-sensor']) {
      sensorEl.components['baldosa-sensor'].frases = rutaElegida.frases;
      sensorEl.components['baldosa-sensor'].coordenadasRuta = rutaElegida.coordenadas;

      var hudText = document.querySelector('#row-display');

      if (hudText && rutaElegida.frases.length > 0) {
        hudText.innerText = rutaElegida.frases[0];
      }
      clearInterval(tryAssign);
    }
  }, 100);
});