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

// Componente de Gravedad y Control de HUD
AFRAME.registerComponent('gravedad-camara', {
  init: function() {
    this.velocity = 0;
    this.onGround = false;
    this.isDead = false;
    this.raycaster = new THREE.Raycaster();
    this.raycaster.ray.direction.set(0, -1, 0);
    this.raycaster.far = 3.0;

    // Variables para diálogos
    this.frases = []; 
    this.fraseInicial = "";
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
        hudImg.style.width = '800px'; 
        hudImg.style.height = '800px';
        hudImg.setAttribute('src', 'Pngs/reinaenfadada.png');
      }

      var hudText = document.querySelector('#row-display');
      if (hudText && hudText.parentElement) {
        hudText.parentElement.style.fontSize = '80px';
        hudText.parentElement.style.color = 'red';
        hudText.parentElement.style.borderColor = 'red';
      }
    }

    if (pos.y < -5) {
      pos.x = 0; pos.y = 15.0; pos.z = 4.5;
      this.velocity = 0;
      this.isDead = false;
      this.el.setAttribute('wasd-controls', 'acceleration', 60);
      
      var hudImg = document.querySelector('#hud-img');
      if (hudImg) {
        hudImg.style.width = '300px';
        hudImg.style.height = '300px';
        hudImg.setAttribute('src', 'Pngs/reinaminiatura.png'); 
      }

      var hudText = document.querySelector('#row-display');
      if (hudText && hudText.parentElement) {
        hudText.parentElement.style.fontSize = '35px';
        hudText.parentElement.style.color = 'black';
        hudText.parentElement.style.borderColor = 'black';
      }
    }

    // --- ACTUALIZAR HUD DE FILA (MODIFICADO) ---
    var currentRow = Math.round(-pos.z / 4.6);
    var hudText = document.querySelector('#row-display');
    
    if (hudText) {
      if (this.isDead) {
        hudText.innerText = "¡TE EQUIVOCASTE!";
      } else if (currentRow < 0) {
        // Muestra la primera pista cuando el jugador está en la plataforma inicial
        hudText.innerText = this.fraseInicial || "Elige tu camino sabiamente.";
      } else if (this.frases && currentRow < this.frases.length) {
        // Muestra qué hacer en la fila actual para ir a la siguiente
        hudText.innerText = this.frases[currentRow];
      } else {
        hudText.innerText = "¡Has llegado!";
      }
    }

    el.setAttribute('position', pos);
  }
});

// Script principal: Generar Grid y seleccionar Ruta
document.addEventListener('DOMContentLoaded', function() {
  var container = document.querySelector('#grid-container');

  // --- OBJETOS DE RUTAS ---
  // Los textos ahora dan instrucciones de CÓMO MOVERSE desde la fila actual.
  var rutasPosibles = [
    {
      nombre: "Ruta Azul",
      coordenadas: [
        '[0,2]', '[1,2]', '[2,2]', '[2,1]', '[2,0]', '[3,0]', '[4,0]', '[4,1]', '[5,1]', 
        '[6,1]', '[6,0]', '[7,0]', '[8,0]', '[8,1]', '[8,2]', '[9,2]', '[10,2]', '[10,3]', 
        '[10,4]', '[11,4]', '[11,3]', '[11,2]', '[11,1]', '[12,1]', '[13,1]', '[13,2]', 
        '[14,2]', '[15,2]', '[15,1]', '[16,1]', '[16,2]', '[17,2]'
      ],
      fraseInicial: "Para empezar, pisa el sombrero del centro-izquierdo.",
      frases: [
        "Sigue recto hacia la flor.", // Fila 0
        "Sube a la pica.", // Fila 1
        "Muévete a la izquierda hasta las tazas, y sube al reloj.", // Fila 2
        "Sube a la carta.", // Fila 3
        "Da un paso a la derecha al flan y sube al gato.", // Fila 4
        "Sube a la llave.", // Fila 5
        "Ve a la izquierda al reloj y sube a la carta.", // Fila 6
        "Sube a las tazas.", // Fila 7
        "Cruza a la derecha hasta la pica central y sube al sombrero.", // Fila 8
        "Sube a la flor.", // Fila 9
        "Ve a la derecha hasta el flan y sube al gato.", // Fila 10
        "Cruza a la izquierda hasta el gato del otro lado, y sube a la llave.", // Fila 11
        "Sube al flan.", // Fila 12
        "Ve a la derecha a la flor y sube a la pica.", // Fila 13
        "Sube al sombrero.", // Fila 14
        "Da un paso a la izquierda a la llave y sube al flan.", // Fila 15
        "Da un paso a la derecha a la flor y salta a la pica.", // Fila 16
        "¡Misión cumplida! Camina hacia adelante para salir." // Fila 17
      ]
    },
    {
      nombre: "Ruta Roja",
      coordenadas: [
        '[0,0]', '[0,1]', '[1,1]', '[2,1]', '[2,2]', '[3,2]', '[4,2]', '[4,3]', '[4,4]', 
        '[5,4]', '[5,3]', '[6,3]', '[6,2]', '[6,1]', '[7,1]', '[8,1]', '[8,0]', '[9,0]', 
        '[10,0]', '[10,1]', '[11,1]', '[11,2]', '[12,2]', '[13,2]', '[13,3]', '[14,3]', 
        '[15,3]', '[15,4]', '[16,4]', '[17,4]'
      ],
      fraseInicial: "Comienza tu camino en el reloj del extremo izquierdo.",
      frases: [
        "Ve a la llave de la derecha y sube al flan.", // Fila 0
        "Sube al gato.", // Fila 1
        "Da un paso a la derecha a la pica y sube al sombrero.", // Fila 2
        "Sube a la flor.", // Fila 3
        "Cruza a la derecha hasta el flan y sube al gato.", // Fila 4
        "Ve a la izquierda a las tazas y sube al reloj.", // Fila 5
        "Ve a la izquierda a la primera llave y sube al flan.", // Fila 6
        "Sube al gato.", // Fila 7
        "Salta a las tazas del borde izquierdo y sube al reloj.", // Fila 8
        "Sube a la carta.", // Fila 9
        "Da un paso a la derecha al flan y sube al gato.", // Fila 10
        "Da un paso a la derecha a la pica y sube al sombrero.", // Fila 11
        "Sube a la flor.", // Fila 12
        "Da un paso a la derecha a la carta y sube a las tazas.", // Fila 13
        "Sube al reloj.", // Fila 14
        "Da un paso a la derecha a la llave y sube al flan.", // Fila 15
        "Sube al gato final.", // Fila 16
        "¡Has superado mi camino! Sal del tablero." // Fila 17
      ]
    },
    {
      nombre: "Ruta Verde",
      coordenadas: [
        '[0,4]', '[1,4]', '[2,4]', '[2,3]', '[3,3]', '[4,3]', '[4,4]', '[5,4]', '[6,4]', 
        '[7,4]', '[7,3]', '[7,2]', '[8,2]', '[8,1]', '[8,0]', '[9,0]', '[9,1]', '[9,2]', 
        '[10,2]', '[11,2]', '[12,2]', '[12,3]', '[12,4]', '[12,5]', '[13,5]', '[14,5]', 
        '[15,5]', '[15,4]', '[16,4]', '[17,4]'
      ],
      fraseInicial: "Tu primer paso es en la llave de la derecha.",
      frases: [
        "Sube recto hacia el flan.", // Fila 0
        "Sube al gato.", // Fila 1
        "Ve a la izquierda a las tazas y sube al reloj.", // Fila 2
        "Sube a la carta.", // Fila 3
        "Ve a la derecha al flan y sube al gato.", // Fila 4
        "Sube a la llave.", // Fila 5
        "Sube al flan.", // Fila 6
        "Ve a la izquierda a la flor y sube a la pica.", // Fila 7
        "Cruza a la izquierda hasta las tazas y sube al reloj.", // Fila 8
        "Ve a la derecha al sombrero central y sube a la flor.", // Fila 9
        "Sube a la pica.", // Fila 10
        "Sube al sombrero.", // Fila 11
        "Cruza todo a la derecha al otro sombrero, y sube a la flor.", // Fila 12
        "Sube a la pica.", // Fila 13
        "Sube al sombrero.", // Fila 14
        "Da un paso a la izquierda a la llave y sube al flan.", // Fila 15
        "Sube al gato final.", // Fila 16
        "¡Excelente, no me has defraudado! Sal del tablero." // Fila 17
      ]
    }
  ];

  // SELECCIONAR RUTA AL AZAR
  var rutaElegida = rutasPosibles[Math.floor(Math.random() * rutasPosibles.length)];
  console.log("Ruta seleccionada:", rutaElegida.nombre);

  // --- MATRIZ DE PATRONES VISUALES ---
  var patternImages = [
    // Fila 0 (Abajo)
    ['../../assets/2d/Individual symbols/Clock.png', '../../assets/2d/Individual symbols/Hole and Key.png', '../../assets/2d/Individual symbols/Hat.png', '../../assets/2d/Individual symbols/Clock.png', '../../assets/2d/Individual symbols/Hole and Key.png', '../../assets/2d/Individual symbols/Hat.png'],
    // Fila 1 (Medio)
    ['../../assets/2d/Individual symbols/Card.png', '../../assets/2d/Individual symbols/Jelly.png', '../../assets/2d/Individual symbols/Flower.png', '../../assets/2d/Individual symbols/Card.png', '../../assets/2d/Individual symbols/Jelly.png', '../../assets/2d/Individual symbols/Flower.png'],
    // Fila 2 (Arriba antes de repetir)
    ['../../assets/2d/Individual symbols/Cups.png', '../../assets/2d/Individual symbols/Chessire.png', '../../assets/2d/Individual symbols/Spade.png', '../../assets/2d/Individual symbols/Cups.png', '../../assets/2d/Individual symbols/Chessire.png', '../../assets/2d/Individual symbols/Spade.png']
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

        // Imagen
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
        
        // Coordenadas actuales en formato string '[z,x]'
        var coordStr = '[' + z + ',' + x + ']';
        box.setAttribute('data-coords', coordStr);
        box.setAttribute('baldosa-interactiva', '');

        // --- COMPROBAR SI ES PARTE DE LA RUTA ELEGIDA ---
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

  // Inyectar las frases en la cámara asegurando que tiene los atributos nuevos
  var camaraEl = document.querySelector('[gravedad-camara]');
  if (camaraEl) {
    var asignarFrases = function() {
      if (camaraEl.components['gravedad-camara']) {
        camaraEl.components['gravedad-camara'].frases = rutaElegida.frases;
        camaraEl.components['gravedad-camara'].fraseInicial = rutaElegida.fraseInicial;
      }
    };

    if (camaraEl.hasLoaded) asignarFrases();
    else camaraEl.addEventListener('loaded', asignarFrases);
  }
});