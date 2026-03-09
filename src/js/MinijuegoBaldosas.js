/**
 * Componente: mejora-textura
 * Mejora la nitidez de las texturas cuando se ven desde ángulos oblicuos.
 */
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

/**
 * Componente: baldosa-interactiva
 * Gestiona el comportamiento de una baldosa individual cuando el jugador la pisa.
 */
AFRAME.registerComponent('baldosa-interactiva', {
  init: function () {
    this.falling = false;
    this.velocity = 0;
  },
  trigger: function () {
    if (this.falling) return;
    
    var el = this.el;
    var isSafe = el.getAttribute('data-safe') === 'true';

    // Si la baldosa NO es segura...
    if (!isSafe) {
      el.setAttribute('opacity', '0.5'); 
      // ¡EL TRUCO DE AMMO!: Quitamos las físicas a la baldosa para que el jugador se caiga de verdad por el hueco
      el.removeAttribute('ammo-body');
      el.removeAttribute('ammo-shape');
      this.falling = true; 
    }
  },
  tick: function (time, timeDelta) {
    if (this.falling) {
      var dt = timeDelta / 1000;
      var pos = this.el.getAttribute('position');
      this.velocity -= 9.8 * dt; 
      pos.y += this.velocity * dt;
      this.el.setAttribute('position', pos);
    }
  }
});

/**
 * Componente: baldosa-sensor (Antiguo gravedad-camara)
 * Es el cerebro que lanza un rayo hacia abajo para saber qué pisas
 * y actualiza el HUD y las frases.
 */
AFRAME.registerComponent('baldosa-sensor', {
  init: function() {
    this.raycaster = new THREE.Raycaster();
    this.raycaster.ray.direction.set(0, -1, 0);
    this.raycaster.far = 3.0; // Solo escanea lo que hay justo bajo los pies

    this.frases = []; 
    this.coordenadasRuta = [];
    this.lastCoords = null; 
    this.isDead = false;
  },
  tick: function () {
    var el = this.el;
    if(!el.object3D) return;
    var pos = el.object3D.position;
    
    this.raycaster.ray.origin.copy(pos);
    
    var objects = [];
    var grid = document.querySelector('#grid-container');
    if (grid) objects.push(grid.object3D);

    var intersections = this.raycaster.intersectObjects(objects, true);

    if (intersections.length > 0) {
      var hitObj = intersections[0].object;
      while (hitObj && !hitObj.el) { hitObj = hitObj.parent; }
      var hitEl = hitObj ? hitObj.el : null;

      if (hitEl && hitEl.tagName === 'A-IMAGE' && hitEl.parentEl) {
        hitEl = hitEl.parentEl;
      }
      
      // --- LÓGICA DE DETECCIÓN Y HUD ---
      if (hitEl && hitEl.classList.contains('baldosa')) {
        var coords = hitEl.getAttribute('data-coords');
        
        if (coords && coords !== this.lastCoords) {
          this.lastCoords = coords;
          var isSafe = hitEl.getAttribute('data-safe') === 'true';
          
          if (isSafe && this.coordenadasRuta.length > 0) {
            var stepIndex = this.coordenadasRuta.indexOf(coords);
            var hudText = document.querySelector('#row-display');
            if (hudText && !this.isDead) {
              if (stepIndex !== -1 && stepIndex + 1 < this.frases.length) {
                hudText.innerText = this.frases[stepIndex + 1];
              } else if (stepIndex === this.coordenadasRuta.length - 1) {
                hudText.innerText = "Hecho. Has cruzado mi dominio.";
              }
            }
          }
        }

        // --- DISPARAR CAÍDA SI PISA MAL ---
        if (hitEl.components['baldosa-interactiva']) {
          hitEl.components['baldosa-interactiva'].trigger();
        }
      }
    }
    
    // --- DETECCIÓN DE CAÍDA Y JUMPSCARE ---
    if (pos.y < 8 && !this.isDead) {
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

    // --- RESTAURAR HUD AL REAPARECER ---
    if (pos.y > 11 && this.isDead) {
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

/**
 * Script principal que genera la cuadrícula y las rutas.
 */
document.addEventListener('DOMContentLoaded', function() {
  var container = document.querySelector('#grid-container');

  var rutasPosibles = [
    {
      nombre: "Ruta 1", // RUTA AZUL (way-1) - 32 pasos
      coordenadas: [
        '[0,2]', '[1,2]', '[2,2]', '[2,1]', '[2,0]', '[3,0]', '[4,0]', '[4,1]', '[5,1]', 
        '[6,1]', '[6,0]', '[7,0]', '[8,0]', '[8,1]', '[8,2]', '[9,2]', '[10,2]', '[10,3]', 
        '[10,4]', '[11,4]', '[11,3]', '[11,2]', '[11,1]', '[12,1]', '[13,1]', '[13,2]', 
        '[14,2]', '[15,2]', '[15,1]', '[16,1]', '[16,2]', '[17,2]'
      ],
      frases: [
        "Un buen sombrero impone respeto… incluso cuando no hay cabeza debajo en el centro.", // 0: Sombrero
        "Las flores del jardín saben encogerse cuando paso.", // 1: Flor
        "La pica no es un símbolo; es una advertencia.", // 2: Pica
        "Mi gato sonríe incluso cuando el resto del reino tiembla.", // 3: Gato
        "Una taza para pensar, otra para decidir… y la tercera para condenar.", // 4: Tazas
        "A las cinco en punto tomo decisiones irrevocables.", // 5: Reloj
        "Mi retrato en la carta no sonríe… porque no lo necesita.", // 6: Carta
        "Una cucharada de gelatina y el castillo me queda pequeño.", // 7: Gelatina
        "Hay secretos que sólo le susurro a un felino con demasiados dientes.", // 8: Gato
        "Las puertas cerradas son sólo invitaciones para mi llave.", // 9: Llave
        "Las cinco… ¿de la mañana o de la tarde? Sólo yo conozco la diferencia.", // 10: Reloj
        "Cuando la Q de picas aparece, el destino ya ha sido sellado.", // 11: Carta
        "Tomar tres tazas de té. Ni dos, ni cuatro. El equilibrio del imperio depende de ello.", // 12: Tazas
        "Si ves una sonrisa flotando en la oscuridad, probablemente ya has sido juzgado.", // 13: Gato
        "Todo en este reino termina bajo mi marca.", // 14: Pica
        "Cambio de sombrerero según mi humor; el reino nunca sabe cuando nos quedaremos sin uno.", // 15: Sombrero
        "Arranco pétalos cuando necesito que el mundo se haga más pequeño.", // 16: Flor
        "No hay espejo más bello que mi propio rostro en la baraja.", // 17: Carta
        "La grandeza puede ser tan inestable como un postre tembloroso.", // 18: Gelatina
        "Mi gato sonríe incluso cuando el resto del reino tiembla.", // 19: Gato
        "El té sabe mejor cuando se bebe desde lo más alto.", // 20: Tazas
        "Donde clavo la pica, florece la obediencia.", // 21: Pica
        "Hay secretos que sólo le susurro a un felino con demasiados dientes.", // 22: Gato
        "Me divierte observar quién se atreve a mirar por la cerradura.", // 23: Llave
        "Crecer sin medida es fácil… mantener la dignidad, no tanto.", // 24: Gelatina
        "Cada pétalo que cae de la flor, es una promesa más que no pienso cumplir.", // 25: Flor
        "La pica no es un símbolo; es una advertencia.", // 26: Pica
        "Bajo un sombrero guardo ideas peligrosamente elegantes.", // 27: Sombrero
        "Tengo llaves para todas las puertas… excepto para la paciencia.", // 28: Llave
        "Una cucharada de gelatina y el castillo me queda pequeño.", // 29: Gelatina
        "Las flores del jardín saben encogerse cuando paso.", // 30: Flor
        "Todo en este reino termina bajo mi marca." // 31: Pica
      ]
    },
    {
      nombre: "Ruta 2", // RUTA ROJA (way-2) - 30 pasos
      coordenadas: [
        '[0,0]', '[0,1]', '[1,1]', '[2,1]', '[2,2]', '[3,2]', '[4,2]', '[4,3]', '[4,4]', 
        '[5,4]', '[5,3]', '[6,3]', '[6,2]', '[6,1]', '[7,1]', '[8,1]', '[8,0]', '[9,0]', 
        '[10,0]', '[10,1]', '[11,1]', '[11,2]', '[12,2]', '[13,2]', '[13,3]', '[14,3]', 
        '[15,3]', '[15,4]', '[16,4]', '[17,4]'
      ],
      frases: [
        "A las cinco en punto tomo decisiones irrevocables en mi lado más izquierdo.", // 0: Reloj
        "Las puertas cerradas son sólo invitaciones para mi llave.", // 1: Llave
        "Una cucharada de gelatina y el castillo me queda pequeño.", // 2: Gelatina
        "Mi gato sonríe incluso cuando el resto del reino tiembla.", // 3: Gato
        "La pica no es un símbolo; es una advertencia.", // 4: Pica
        "Un buen sombrero impone respeto… incluso cuando no hay cabeza debajo.", // 5: Sombrero
        "Arranco pétalos cuando necesito que el mundo se haga más pequeño.", // 6: Flor
        "No hay espejo más bello que mi propio rostro en la baraja.", // 7: Carta
        "La grandeza puede ser tan inestable como un postre tembloroso.", // 8: Gelatina
        "Hay secretos que sólo le susurro a un felino con demasiados dientes.", // 9: Gato
        "Tomar tres tazas de té. Ni dos, ni cuatro. El equilibrio del imperio depende de ello.", // 10: Tazas
        "Las cinco… ¿de la mañana o de la tarde? Sólo yo conozco la diferencia.", // 11: Reloj
        "Cambio de sombrerero según mi humor; el reino nunca sabe cuando nos quedaremos sin uno.", // 12: Sombrero
        "Me divierte observar quién se atreve a mirar por la cerradura.", // 13: Llave
        "Crecer sin medida es fácil… mantener la dignidad, no tanto.", // 14: Gelatina
        "Si ves una sonrisa flotando en la oscuridad, probablemente ya has sido juzgado.", // 15: Gato
        "El té sabe mejor cuando se bebe desde lo más alto.", // 16: Tazas
        "Cuando el reloj señala las cinco, alguien pierde la cabeza… ya sea por mi encanto o por mi determinación.", // 17: Reloj
        "Cuando la Q de picas aparece, el destino ya ha sido sellado.", // 18: Carta
        "Una cucharada de gelatina y el castillo me queda pequeño.", // 19: Gelatina
        "Mi gato sonríe incluso cuando el resto del reino tiembla.", // 20: Gato
        "Todo en este reino termina bajo mi marca.", // 21: Pica
        "Bajo un sombrero guardo ideas peligrosamente elegantes.", // 22: Sombrero
        "Cada pétalo que cae de la flor, es una promesa más que no pienso cumplir.", // 23: Flor
        "Mi retrato en la carta no sonríe… porque no lo necesita.", // 24: Carta
        "Una taza para pensar, otra para decidir… y la tercera para condenar.", // 25: Tazas
        "A las cinco en punto tomo decisiones irrevocables.", // 26: Reloj
        "Tengo llaves para todas las puertas… excepto para la paciencia.", // 27: Llave
        "La grandeza puede ser tan inestable como un postre tembloroso.", // 28: Gelatina
        "Hay secretos que sólo le susurro a un felino con demasiados dientes." // 29: Gato
      ]
    },
    {
      nombre: "Ruta 3", // RUTA VERDE (way-3) - 30 pasos
      coordenadas: [
        '[0,4]', '[1,4]', '[2,4]', '[2,3]', '[3,3]', '[4,3]', '[4,4]', '[5,4]', '[6,4]', 
        '[7,4]', '[7,3]', '[7,2]', '[8,2]', '[8,1]', '[8,0]', '[9,0]', '[9,1]', '[9,2]', 
        '[10,2]', '[11,2]', '[12,2]', '[12,3]', '[12,4]', '[12,5]', '[13,5]', '[14,5]', 
        '[15,5]', '[15,4]', '[16,4]', '[17,4]'
      ],
      frases: [
        "Las puertas cerradas son sólo invitaciones para mi llave en el bolsillo derecho.", // 0: Llave
        "Una cucharada de gelatina y el castillo me queda pequeño.", // 1: Gelatina
        "Mi gato sonríe incluso cuando el resto del reino tiembla.", // 2: Gato
        "Tomar tres tazas de té. Ni dos, ni cuatro. El equilibrio del imperio depende de ello.", // 3: Tazas
        "A las cinco en punto tomo decisiones irrevocables.", // 4: Reloj
        "No hay espejo más bello que mi propio rostro en la baraja.", // 5: Carta
        "La grandeza puede ser tan inestable como un postre tembloroso.", // 6: Gelatina
        "Hay secretos que sólo le susurro a un felino con demasiados dientes.", // 7: Gato
        "Me divierte observar quién se atreve a mirar por la cerradura.", // 8: Llave
        "Crecer sin medida es fácil… mantener la dignidad, no tanto.", // 9: Gelatina
        "Cuando la Q de picas aparece, el destino ya ha sido sellado.", // 10: Carta
        "Arranco pétalos cuando necesito que el mundo se haga más pequeño.", // 11: Flor
        "La pica no es un símbolo; es una advertencia.", // 12: Pica
        "Si ves una sonrisa flotando en la oscuridad, probablemente ya has sido juzgado.", // 13: Gato
        "El té sabe mejor cuando se bebe desde lo más alto.", // 14: Tazas
        "Las cinco… ¿de la mañana o de la tarde? Sólo yo conozco la diferencia.", // 15: Reloj
        "Tengo llaves para todas las puertas… excepto para la paciencia.", // 16: Llave
        "Un buen sombrero impone respeto… incluso cuando no hay cabeza debajo.", // 17: Sombrero
        "Cada pétalo que cae de la flor, es una promesa más que no pienso cumplir.", // 18: Flor
        "Todo en este reino termina bajo mi marca.", // 19: Pica
        "Cambio de sombrerero según mi humor; el reino nunca sabe cuando nos quedaremos sin uno.", // 20: Sombrero
        "Cuando el reloj señala las cinco, alguien pierde la cabeza… ya sea por mi encanto o por mi determinación.", // 21: Reloj
        "Las puertas cerradas son sólo invitaciones para mi llave.", // 22: Llave
        "Bajo un sombrero guardo ideas peligrosamente elegantes.", // 23: Sombrero
        "Las flores del jardín saben encogerse cuando paso.", // 24: Flor
        "Donde clavo la pica, florece la obediencia.", // 25: Pica
        "Un buen sombrero impone respeto… incluso cuando no hay cabeza debajo.", // 26: Sombrero
        "Me divierte observar quién se atreve a mirar por la cerradura.", // 27: Llave
        "Una cucharada de gelatina y el castillo me queda pequeño.", // 28: Gelatina
        "Mi gato sonríe incluso cuando el resto del reino tiembla." // 29: Gato
      ]
    }
  ];

  var rutaElegida = rutasPosibles[Math.floor(Math.random() * rutasPosibles.length)];
  console.log("Ruta seleccionada:", rutaElegida.nombre);

  var patternImages = [ 
    ['../assets/2d/Individual symbols/Clock.png', '../assets/2d/Individual symbols/Hole and Key.png', '../assets/2d/Individual symbols/Hat.png', '../assets/2d/Individual symbols/Clock.png', '../assets/2d/Individual symbols/Hole and Key.png', '../assets/2d/Individual symbols/Hat.png'],
    ['../assets/2d/Individual symbols/Card.png', '../assets/2d/Individual symbols/Jelly.png', '../assets/2d/Individual symbols/Flower.png', '../assets/2d/Individual symbols/Card.png', '../assets/2d/Individual symbols/Jelly.png', '../assets/2d/Individual symbols/Flower.png'],
    ['../assets/2d/Individual symbols/Cups.png', '../assets/2d/Individual symbols/Chessire.png', '../assets/2d/Individual symbols/Spade.png', '../assets/2d/Individual symbols/Cups.png', '../assets/2d/Individual symbols/Chessire.png', '../assets/2d/Individual symbols/Spade.png']
  ];

  if (container) {
    for (var z = 0; z < 18; z++) {
      for (var x = 0; x < 6; x++) {
        var box = document.createElement('a-box');
        
        // ¡Magia! Baldosas de 10x10 metros para cubrir toda la sala
        var posX = (x - 2.5) * 10;
        var posZ = -z * 10; 
        
        box.setAttribute('position', {x: posX, y: -0.5, z: posZ});
        box.setAttribute('width', 9.8);
        box.setAttribute('height', 1.0); 
        box.setAttribute('depth', 9.8);
        box.setAttribute('color', '#EEEEEE');

        var imgEl = document.createElement('a-image');
        var rowPattern = patternImages[z % 3]; 
        var symbol = rowPattern[x];
        
        imgEl.setAttribute('src', symbol);
        imgEl.setAttribute('rotation', '-90 0 0');
        imgEl.setAttribute('width', 9.4);  
        imgEl.setAttribute('height', 9.4);
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

        // ¡SISTEMA AMMO.JS PARA LAS COLISIONES DE LAS BALDOSAS!
        box.setAttribute('ammo-body', 'type: static');
        box.setAttribute('ammo-shape', 'type: box');
        container.appendChild(box);
      }
    }
  }

  // Asignamos las frases al sensor que hemos creado
  var camaraEl = document.querySelector('[baldosa-sensor]');
  if (camaraEl) {
    var asignarFrases = function() {
      if (camaraEl.components['baldosa-sensor']) {
        camaraEl.components['baldosa-sensor'].frases = rutaElegida.frases;
        camaraEl.components['baldosa-sensor'].coordenadasRuta = rutaElegida.coordenadas;
        
        var hudText = document.querySelector('#row-display');
        if (hudText && rutaElegida.frases.length > 0) {
           hudText.innerText = rutaElegida.frases[0];
        }
      }
    };
    if (camaraEl.hasLoaded) asignarFrases();
    else camaraEl.addEventListener('loaded', asignarFrases);
  }
});