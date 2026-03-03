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

// Componente para crear barreras invisibles en la plataforma inicial
AFRAME.registerComponent('seguridad-plataforma', {
  tick: function () {
    var pos = this.el.getAttribute('position');
    
    // Límites laterales (paredes invisibles) en todo el recorrido
    if (pos.x < -13.5) pos.x = -13.5;
    if (pos.x > 13.5) pos.x = 13.5;
    
    // Límite trasero (solo para no caerse hacia atrás en el spawn)
    if (pos.z > 7.8) pos.z = 7.8;
    
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
    
    var el = this.el;
    var isSafe = el.getAttribute('data-safe') === 'true';

    if (!isSafe) {
      el.setAttribute('opacity', '0.5');
      el.setAttribute('data-falling', 'true');
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

// Componente de Gravedad y Control de HUD ACTUALIZADO (Paso a Paso)
AFRAME.registerComponent('gravedad-camara', {
  init: function() {
    this.velocity = 0;
    this.onGround = false;
    this.isDead = false;
    this.raycaster = new THREE.Raycaster();
    this.raycaster.ray.direction.set(0, -1, 0);
    this.raycaster.far = 3.0;

    // Nuevas variables para rastreo perfecto de pasos
    this.frases = []; 
    this.coordenadasRuta = [];
    this.lastCoords = null;
  },
  tick: function (time, timeDelta) {
    var el = this.el;
    var pos = el.getAttribute('position');
    
    this.raycaster.ray.origin.copy(el.object3D.position);
    
    var objects = [];
    var suelo = document.querySelector('.suelo');
    var sueloFinal = document.querySelector('.suelo-final');
    var grid = document.querySelector('#grid-container');
    
    if (suelo) objects.push(suelo.object3D);
    if (sueloFinal) objects.push(sueloFinal.object3D);
    if (grid) objects.push(grid.object3D);

    var intersections = this.raycaster.intersectObjects(objects, true);
    var isTouchingGround = false;

    if (intersections.length > 0) {
      var hitObj = intersections[0].object;
      while (hitObj && !hitObj.el) { hitObj = hitObj.parent; }
      var hitEl = hitObj ? hitObj.el : null;

      if (hitEl && hitEl.tagName === 'A-IMAGE' && hitEl.parentEl) {
        hitEl = hitEl.parentEl;
      }
      
      // --- NUEVO SISTEMA DE HUD (CASILLA POR CASILLA) ---
      if (hitEl) {
        var coords = hitEl.getAttribute('data-coords');
        var isSuelo = hitEl.classList.contains('suelo');

        // Si estamos en la plataforma de inicio
        if (isSuelo && this.lastCoords !== 'suelo') {
          this.lastCoords = 'suelo';
          var hudText = document.querySelector('#row-display');
          if (hudText && !this.isDead && this.frases.length > 0) {
            hudText.innerText = this.frases[0]; // Muestra pista del 1er paso
          }
        } 
        // Si pisamos una baldosa diferente a la anterior
        else if (coords && coords !== this.lastCoords) {
          this.lastCoords = coords;
          var isSafe = hitEl.getAttribute('data-safe') === 'true';
          
          if (isSafe && this.coordenadasRuta.length > 0) {
            var stepIndex = this.coordenadasRuta.indexOf(coords);
            var hudText = document.querySelector('#row-display');
            
            if (hudText && !this.isDead) {
              // Mostrar la frase de la SIGUIENTE casilla a pisar
              if (stepIndex !== -1 && stepIndex + 1 < this.frases.length) {
                hudText.innerText = this.frases[stepIndex + 1];
              } 
              // Si pisamos la última casilla
              else if (stepIndex === this.coordenadasRuta.length - 1) {
                hudText.innerText = "Hecho. Has cruzado mi dominio.";
              }
            }
          }
        }
      }
      // ------------------------------------------------

      if (hitEl && hitEl.getAttribute('data-falling') === 'true') {
        isTouchingGround = false; 
        this.el.setAttribute('wasd-controls', 'acceleration', 0);
      } else {
        isTouchingGround = true;
        this.el.setAttribute('wasd-controls', 'acceleration', 60);
      }

      if (hitEl && hitEl.components['baldosa-interactiva']) {
        hitEl.components['baldosa-interactiva'].trigger();
      }
    }
    
    var dt = timeDelta / 1000;

    if (isTouchingGround && this.velocity <= 0) {
      this.velocity = 0;
      this.onGround = true;
    } else {
      this.onGround = false;
      this.velocity -= 9.8 * dt;
      pos.y += this.velocity * dt;
    }

// --- DETECCIÓN DE CAÍDA ---
    if (pos.y < 10 && !this.isDead) {
      this.isDead = true;
      var hudImg = document.querySelector('#hud-img');
      if (hudImg) {
        // Hacemos el susto adaptativo
        hudImg.style.width = 'clamp(250px, 50vw, 800px)'; 
        hudImg.style.height = 'clamp(250px, 50vw, 800px)';
        hudImg.setAttribute('src', '../assets/2D/reinaenfadada.png');
      }

      var hudText = document.querySelector('#row-display');
      if (hudText && hudText.parentElement) {
        hudText.innerText = "¡TE EQUIVOCASTE!";
        // Texto de error también adaptativo
        hudText.parentElement.style.fontSize = 'clamp(30px, 4vw, 80px)';
        hudText.parentElement.style.color = 'red';
        hudText.parentElement.style.borderColor = 'red';
      }
    }

    // --- RESPAWN ---
    if (pos.y < -5) {
      pos.x = 0; pos.y = 15.0; pos.z = 4.5;
      this.velocity = 0;
      this.isDead = false;
      this.lastCoords = 'suelo'; // Forzamos reseteo del lastCoords
      this.el.setAttribute('wasd-controls', 'acceleration', 60);
      
      var hudImg = document.querySelector('#hud-img');
      if (hudImg) {
        // Restauramos a tamaños adaptativos base
        hudImg.style.width = 'clamp(120px, 15vw, 300px)';
        hudImg.style.height = 'clamp(120px, 15vw, 300px)';
        hudImg.setAttribute('src', '../assets/2D/reinaminiatura.png'); 
      }

      var hudText = document.querySelector('#row-display');
      if (hudText && hudText.parentElement) {
        if (this.frases.length > 0) hudText.innerText = this.frases[0];
        // Restauramos texto base
        hudText.parentElement.style.fontSize = 'clamp(16px, 1.8vw, 35px)';
        hudText.parentElement.style.color = 'black';
        hudText.parentElement.style.borderColor = 'black';
      }
    }

    el.setAttribute('position', pos);
  }
});

// Script principal: Generar Grid y seleccionar Ruta
document.addEventListener('DOMContentLoaded', function() {
  var container = document.querySelector('#grid-container');

  // --- OBJETOS DE RUTAS CON SUS FRASES INDIVIDUALES ---
  // Cada ruta tiene exactamente una frase por coordenada.
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
        
        var posX = (x - 2.5) * 4.6;
        var posZ = -z * 4.6; 
        
        box.setAttribute('position', {x: posX, y: -0.5, z: posZ});
        box.setAttribute('width', 4.6);
        box.setAttribute('height', 1.0); 
        box.setAttribute('depth', 4.6);
        box.setAttribute('color', '#EEEEEE');

        var imgEl = document.createElement('a-image');
        var rowPattern = patternImages[z % 3];
        var symbol = rowPattern[x];
        
        imgEl.setAttribute('src', symbol);
        imgEl.setAttribute('rotation', '-90 0 0');
        imgEl.setAttribute('width', 4.4);  
        imgEl.setAttribute('height', 4.4);
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

        box.setAttribute('static-body', '');
        container.appendChild(box);
      }
    }
  }

  // --- INYECTAR DATOS DE RUTA A LA CÁMARA (NUEVO SISTEMA) ---
  var camaraEl = document.querySelector('[gravedad-camara]');
  if (camaraEl) {
    var asignarFrases = function() {
      if (camaraEl.components['gravedad-camara']) {
        camaraEl.components['gravedad-camara'].frases = rutaElegida.frases;
        camaraEl.components['gravedad-camara'].coordenadasRuta = rutaElegida.coordenadas;
        
        // Forzar actualización inicial del HUD estando en la plataforma
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