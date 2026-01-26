// Componente para crear barreras invisibles en la plataforma inicial
AFRAME.registerComponent('seguridad-plataforma', {
  tick: function () {
    var pos = this.el.getAttribute('position');
    
    // Si estamos en la zona de la plataforma (Z > 1.5)
    if (pos.z > 1.5) {
      // Barrera Izquierda (X < -2.8) - Ampliado para llegar al borde
      if (pos.x < -2.8) pos.x = -2.8;
      // Barrera Derecha (X > 2.8) - Ampliado para llegar al borde
      if (pos.x > 2.8) pos.x = 2.8;
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
    // Usamos un Raycaster manual de Three.js para que NO rote con la cámara
    this.raycaster = new THREE.Raycaster();
    this.raycaster.ray.direction.set(0, -1, 0); // Siempre hacia abajo
    this.raycaster.far = 2.0; // Altura ojos (1.6) + margen

    // Escuchar la tecla Espacio para saltar
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && this.onGround) {
        this.velocity = 5; // Fuerza de salto (ajustable)
      }
    });
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
      
      // Si es suelo firme (no está cayendo), activamos la bandera de suelo
      if (hitObj && hitObj.el && hitObj.el.getAttribute('data-falling') === 'true') {
        isTouchingGround = false; // Si cae, nos soltamos para caer con gravedad real
        // Desactivar movimiento horizontal para "pegarse" a la baldosa y no poder escapar
        this.el.setAttribute('wasd-controls', 'acceleration', 0);
      } else {
        isTouchingGround = true;
        // Restaurar movimiento normal (60) si estamos en suelo seguro
        this.el.setAttribute('wasd-controls', 'acceleration', 60);
      }

      // Si tiene el componente baldosa-interactiva, lo activamos
      if (hitObj && hitObj.el && hitObj.el.components['baldosa-interactiva']) {
        hitObj.el.components['baldosa-interactiva'].trigger();
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

    // Reiniciar si caes al vacío (Y < -5)
    if (pos.y < -5) {
      pos.x = 0; pos.y = 13.6; pos.z = 4.5;
      this.velocity = 0;
      // Restaurar controles al respawnear
      this.el.setAttribute('wasd-controls', 'acceleration', 60);
    }

    el.setAttribute('position', pos);
  }
});

// Script para generar el Grid 4x4 automáticamente
// Usamos DOMContentLoaded para asegurarnos de que la escena existe antes de añadir cajas
document.addEventListener('DOMContentLoaded', function() {
  var container = document.querySelector('#grid-container');
  var colors = ['#EF2D5E', '#4CC3D9', '#FFC65D', '#7BC8A4']; // Colores variados

  // 1. Generar el camino seguro aleatorio (un X correcto por cada fila Z)
  var safePath = [];
  for (var i = 0; i < 20; i++) {
    safePath.push(Math.floor(Math.random() * 4));
  }

  // 2. Mostrar el código en el HUD de la DERECHA (Chuleta)
  var panelCheat = document.querySelector('#hud-cheat');
  if (panelCheat) {
    var codeText = "RUTA SEGURA [FILA,COL]:\n";
    for (var i = 0; i < safePath.length; i++) {
      codeText += "[" + i + "," + safePath[i] + "] ";
    }
    panelCheat.innerText = codeText;
  }

  if (container) {
    // Aumentamos a 20 filas para crear un camino largo hacia el fondo
    for (var z = 0; z < 20; z++) {
      for (var x = 0; x < 4; x++) {
        var box = document.createElement('a-box');
        
        // Calcular posición: X centrado, Z avanzando hacia el fondo (negativo)
        var posX = (x - 1.5) * 4.6;
        var posZ = -z * 4.6; // Empieza en 0 y va hacia el fondo (-4.6, -9.2, etc.)
        
        // Hacemos las baldosas más gruesas (1m) y bajamos su centro (-0.5) para que la superficie quede en 0
        box.setAttribute('position', {x: posX, y: -0.5, z: posZ});
        box.setAttribute('width', 4.4);
        box.setAttribute('height', 1.0); 
        box.setAttribute('depth', 4.4);
        
        // Asignar color cíclico
        box.setAttribute('color', colors[(x + z) % 4]);
        
        // Asignar clase 'baldosa' para que el raycaster de la cámara la detecte
        box.setAttribute('class', 'baldosa');
        
        // Guardar coordenadas y añadir el componente de interacción
        box.setAttribute('data-coords', '[' + z + ',' + x + ']');
        box.setAttribute('baldosa-interactiva', '');

        // 3. Marcar la baldosa como segura si coincide con el camino generado
        if (safePath[z] === x) {
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