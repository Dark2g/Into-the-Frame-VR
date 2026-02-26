// Componente para crear barreras invisibles en la plataforma inicial
AFRAME.registerComponent('seguridad-plataforma', {
  tick: function () {
    var pos = this.el.getAttribute('position');
    
    // Si estamos en la zona de la plataforma (Z > 1.5)
    if (pos.z > 1.5) {
      // Barrera Izquierda (X < -13.5) - Ampliado para llegar al borde (ancho 6 baldosas)
      if (pos.x < -13.5) pos.x = -13.5;
      // Barrera Derecha (X > 13.5) - Ampliado para llegar al borde (ancho 6 baldosas)
      if (pos.x > 13.5) pos.x = 13.5;
      // Barrera Trasera (Z > 7.8) - Ampliado para cubrir todo el spawn
      if (pos.z > 7.8) pos.z = 7.8;
      
      this.el.setAttribute('position', pos);
    }
  }
});

// Componente personalizado para detectar cuando se PISA la baldosa
AFRAME.registerComponent('baldosa-interactiva', {
  init: function () {
    this.falling = false;
    this.velocity = 0;
  },

  // Función para activar la baldosa manualmente desde el script de gravedad
  trigger: function () {
    if (this.falling) return;
    
    var el = this.el;

    // Mostrar qué baldosa pisamos en el HUD izquierdo
    var coords = el.getAttribute('data-coords');
    var panelInfo = document.querySelector('#hud-info');
    if (panelInfo) panelInfo.innerText = 'Pisando: ' + coords;

    // Comprobar si la baldosa es segura
    var isSafe = el.getAttribute('data-safe') === 'true';

    // Solo cae si NO es segura
    if (!isSafe) {
      el.setAttribute('opacity', '0.5');
      el.setAttribute('data-falling', 'true'); // Marcamos que está cayendo
      this.falling = true;
    }
  },

  tick: function (time, timeDelta) {
    if (this.falling) {
      var dt = timeDelta / 1000;
      var pos = this.el.getAttribute('position');
      
      // Caída sincronizada con el jugador (9.8) para que bajen juntos
      this.velocity -= 9.8 * dt; 
      pos.y += this.velocity * dt;
      
      this.el.setAttribute('position', pos);
    }
  }
});

// Componente de Gravedad Simple para la Cámara
AFRAME.registerComponent('gravedad-camara', {
  init: function() {
    this.velocity = 0;
    this.onGround = false;
    this.isDead = false; // Estado para controlar el jumpscare
    // Usamos un Raycaster manual de Three.js para que NO rote con la cámara
    this.raycaster = new THREE.Raycaster();
    this.raycaster.ray.direction.set(0, -1, 0); // Siempre hacia abajo
    this.raycaster.far = 2.0; // Altura ojos (1.6) + margen

    // Array de frases tipo acertijo por fila (0 a 17)
    this.frases = [
      "El camino comienza con un solo paso...", // Fila 0
      "No todo lo que brilla es suelo firme.", // Fila 1
      "Izquierda o derecha, tu destino eliges.", // Fila 2
      "El vacío observa tus pies...", // Fila 3
      "Sigue el latido de tu intuición.", // Fila 4
      "La mitad del camino, no te rindas.", // Fila 5
      "Cuidado con la ambición.", // Fila 6
      "Un paso en falso y todo termina.", // Fila 7
      "¿Confías en tus ojos?", // Fila 8
      "Ya casi huelo tu miedo.", // Fila 9
      "La gravedad es una ley cruel.", // Fila 10
      "Solo los valientes llegan aquí.", // Fila 11
      "No mires abajo...", // Fila 12
      "El final está cerca.", // Fila 13
      "Un último esfuerzo.", // Fila 14
      "La gloria te espera.", // Fila 15
      "¡Cuidado con el último salto!", // Fila 16
      "¡La meta está frente a ti!" // Fila 17
    ];
  },
  tick: function (time, timeDelta) {
    var el = this.el;
    var pos = el.getAttribute('position');
    
    // Actualizamos el origen del rayo a la posición actual de la cámara
    this.raycaster.ray.origin.copy(el.object3D.position);
    
    // Recopilamos objetos con los que chocar (Suelo inicial y Baldosas)
    var objects = [];
    var suelo = document.querySelector('.suelo');
    var grid = document.querySelector('#grid-container');
    
    if (suelo) objects.push(suelo.object3D);
    if (grid) objects.push(grid.object3D);

    // Comprobamos intersecciones (recursive: true para ver hijos del grid)
    var intersections = this.raycaster.intersectObjects(objects, true);
    var isTouchingGround = false;

    if (intersections.length > 0) {
      // Detectar si lo que pisamos es una baldosa interactiva
      var hitObj = intersections[0].object;
      // Subir por la jerarquía hasta encontrar la entidad de A-Frame (.el)
      while (hitObj && !hitObj.el) {
        hitObj = hitObj.parent;
      }

      var hitEl = hitObj ? hitObj.el : null;

      // Si pisamos la imagen (hija), subimos a la baldosa (padre) para interactuar
      if (hitEl && hitEl.tagName === 'A-IMAGE' && hitEl.parentEl) {
        hitEl = hitEl.parentEl;
      }
      
      // Si es suelo firme (no está cayendo), activamos la bandera de suelo
      if (hitEl && hitEl.getAttribute('data-falling') === 'true') {
        isTouchingGround = false; // Si cae, nos soltamos para caer con gravedad real
        // Desactivar movimiento horizontal para "pegarse" a la baldosa y no poder escapar
        this.el.setAttribute('wasd-controls', 'acceleration', 0);
      } else {
        isTouchingGround = true;
        // Restaurar movimiento normal (60) si estamos en suelo seguro
        this.el.setAttribute('wasd-controls', 'acceleration', 60);
      }

      // Si tiene el componente baldosa-interactiva, lo activamos
      if (hitEl && hitEl.components['baldosa-interactiva']) {
        hitEl.components['baldosa-interactiva'].trigger();
      }
    }
    
    var dt = timeDelta / 1000; // Delta en segundos

    // Solo paramos la gravedad si tocamos suelo Y no estamos subiendo (saltando)
    if (isTouchingGround && this.velocity <= 0) {
      this.velocity = 0;
      this.onGround = true;
    } else {
      this.onGround = false;
      // Aplicar gravedad (9.8 m/s^2)
      this.velocity -= 9.8 * dt;
      pos.y += this.velocity * dt;
    }

    // --- DETECCIÓN DE CAÍDA (JUMPSCARE) ---
    // Si bajamos de Y=10 (el suelo está en 11.5), asumimos que ha caído
    if (pos.y < 10 && !this.isDead) {
      this.isDead = true;
      var hudImg = document.querySelector('#hud-img');
      if (hudImg) {
        hudImg.style.width = '800px'; // Reducido para evitar problemas de visualización
        hudImg.style.height = '800px';
        // Cambiar la imagen al morir (Jumpscare). Pon aquí tu imagen de susto.
        hudImg.setAttribute('src', 'Pngs/reinaenfadada.png');
      }

      // Aumentar drásticamente el tamaño del texto y ponerlo rojo
      var hudText = document.querySelector('#row-display');
      if (hudText && hudText.parentElement) {
        hudText.parentElement.style.fontSize = '80px';
        hudText.parentElement.style.color = 'red';
        hudText.parentElement.style.borderColor = 'red';
      }
    }

    // Reiniciar si caes al vacío (Y < -5)
    if (pos.y < -5) {
      pos.x = 0; pos.y = 13.6; pos.z = 4.5;
      this.velocity = 0;
      this.isDead = false; // Resetear estado
      // Restaurar controles al respawnear
      this.el.setAttribute('wasd-controls', 'acceleration', 60);
      // Restaurar imagen
      var hudImg = document.querySelector('#hud-img');
      if (hudImg) {
        hudImg.style.width = '300px';
        hudImg.style.height = '300px';
        hudImg.setAttribute('src', 'Pngs/reinaminiatura.png'); // Restaurar imagen original
      }

      // Restaurar estilo del texto
      var hudText = document.querySelector('#row-display');
      if (hudText && hudText.parentElement) {
        hudText.parentElement.style.fontSize = '35px';
        hudText.parentElement.style.color = 'black';
        hudText.parentElement.style.borderColor = 'black';
      }
    }

    // --- ACTUALIZAR HUD DE FILA ---
    // Las filas están en Z negativo, separadas por 4.6m.
    // Math.round(-pos.z / 4.6) nos da el índice aproximado (0, 1, 2...)
    var currentRow = Math.round(-pos.z / 4.6);
    var hudText = document.querySelector('#row-display');
    
    if (hudText) {
      if (this.isDead) {
        hudText.innerText = "YO NO DIJE ESO";
      } else if (currentRow < 0) {
        hudText.innerText = "Prepárate para cruzar.";
      } else if (currentRow < this.frases.length) {
        // Muestra la frase correspondiente a la fila del array
        hudText.innerText = this.frases[currentRow];
      } else {
        hudText.innerText = "¡Has llegado!";
      }
    }
    // ------------------------------

    el.setAttribute('position', pos);
  }
});

// Script para generar el Grid 4x4 automáticamente
// Usamos DOMContentLoaded para asegurarnos de que la escena existe antes de añadir cajas
document.addEventListener('DOMContentLoaded', function() {
  var container = document.querySelector('#grid-container');
  var colors = ['#EF2D5E', '#4CC3D9', '#FFC65D', '#7BC8A4']; // Colores variados
  // Nombres de las imágenes
  var tileImages = ['Pngs/ImagesBaldosas/Corazon.png', 'Pngs/ImagesBaldosas/Piqueta.png', 'Pngs/ImagesBaldosas/Rombo.png', 'Pngs/ImagesBaldosas/Trebol.png'];

  // 1. Generar el camino seguro (adyacente y ortogonal, sin diagonales)
  var safeTiles = new Set(); // Usamos un Set para guardar coordenadas "z,x"
  var currentX = Math.floor(Math.random() * 6);
  
  for (var z = 0; z < 18; z++) {
    // Decidimos hasta dónde nos movemos lateralmente en esta fila
    // Limitamos el movimiento lateral a +/- 2 para que no sea tan caótico
    var min = Math.max(0, currentX - 2);
    var max = Math.min(5, currentX + 2);
    var nextX = Math.floor(Math.random() * (max - min + 1)) + min;
    
    // Añadimos el camino lateral desde currentX hasta nextX
    var step = (currentX < nextX) ? 1 : -1;
    if (currentX === nextX) step = 0;
    
    var tempX = currentX;
    // Recorremos lateralmente
    while (tempX !== nextX) {
      safeTiles.add(z + ',' + tempX);
      tempX += step;
    }
    // Añadimos el destino (que conecta con la siguiente fila Z+1)
    safeTiles.add(z + ',' + nextX);
    
    currentX = nextX; // La siguiente fila empieza donde terminó esta
  }

  // 2. Mostrar el código en el HUD de la DERECHA (Chuleta)
  var panelCheat = document.querySelector('#hud-cheat');
  if (panelCheat) {
    var codeText = "RUTA SEGURA:\n";
    for (var z = 0; z < 18; z++) {
      for (var x = 0; x < 6; x++) {
        if (safeTiles.has(z + ',' + x)) {
          codeText += "[" + z + "," + x + "] ";
        }
      }
    }
    panelCheat.innerText = codeText;
  }

  if (container) {
    // Aumentamos a 18 filas para crear un camino largo hacia el fondo
    for (var z = 0; z < 18; z++) {
      for (var x = 0; x < 6; x++) {
        var box = document.createElement('a-box');
        
        // Calcular posición: X centrado, Z avanzando hacia el fondo (negativo)
        var posX = (x - 2.5) * 4.6;
        var posZ = -z * 4.6; // Empieza en 0 y va hacia el fondo (-4.6, -9.2, etc.)
        
        // Hacemos las baldosas más gruesas (1m) y bajamos su centro (-0.5) para que la superficie quede en 0
        box.setAttribute('position', {x: posX, y: -0.5, z: posZ});
        box.setAttribute('width', 4.6);
        box.setAttribute('height', 1.0); 
        box.setAttribute('depth', 4.6);
        
        // Asignar color cíclico
        box.setAttribute('color', colors[(x + z) % 4]);

        // --- AÑADIR IMAGEN ALEATORIA ---
        var imgEl = document.createElement('a-image');
        var randomImg = tileImages[Math.floor(Math.random() * tileImages.length)];
        imgEl.setAttribute('src', randomImg);
        imgEl.setAttribute('rotation', '-90 0 0'); // Acostada sobre la baldosa
        imgEl.setAttribute('width', 4.4);  // Un poco más pequeña que la caja (4.6) para ver borde
        imgEl.setAttribute('height', 4.4);
        imgEl.setAttribute('position', '0 0.51 0'); // Ligeramente por encima de la superficie (0.5)
        box.appendChild(imgEl);
        // -------------------------------
        
        // Asignar clase 'baldosa' para que el raycaster de la cámara la detecte
        box.setAttribute('class', 'baldosa');
        
        // Guardar coordenadas y añadir el componente de interacción
        box.setAttribute('data-coords', '[' + z + ',' + x + ']');
        box.setAttribute('baldosa-interactiva', '');

        // 3. Marcar la baldosa como segura si está en el Set de baldosas seguras
        if (safeTiles.has(z + ',' + x)) {
          box.setAttribute('data-safe', 'true');
        } else {
          box.setAttribute('data-safe', 'false');
        }

        // Añadir cuerpo estático para poder caminar sobre ellas
        box.setAttribute('static-body', '');
        
        container.appendChild(box);
      }
    }
  }
});