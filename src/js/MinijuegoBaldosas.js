/**
 * Componente: mejora-textura
 * Mejora la nitidez de las texturas cuando se ven desde ángulos oblicuos.
 * Utiliza el filtrado anisotrópico, una técnica de renderizado avanzada.
 */
AFRAME.registerComponent('mejora-textura', {
  init: function () {
    // Escucha el evento 'materialtextureloaded', que se dispara cuando la textura de un material ha cargado.
    this.el.addEventListener('materialtextureloaded', (e) => {
      var texture = e.detail.texture;
      if (texture) {
        var maxAnisotropy = this.el.sceneEl.renderer.capabilities.getMaxAnisotropy(); // Obtiene el nivel máximo de anisotropía que soporta la GPU.
        texture.anisotropy = maxAnisotropy;
        texture.needsUpdate = true;
      }
    });
  }
});

/**
 * Componente: seguridad-plataforma
 * Crea barreras invisibles para evitar que el jugador se caiga de la plataforma
 * o se salga de los límites laterales del área de juego.
 */
AFRAME.registerComponent('seguridad-plataforma', {
  tick: function () {
    // Se ejecuta en cada frame.
    var pos = this.el.getAttribute('position');
    
    // Limita la posición en el eje X para crear paredes invisibles a los lados.
    if (pos.x < -55) pos.x = -55;
    if (pos.x > 55) pos.x = 55;
    
    // Limita la posición en el eje Z para evitar que el jugador se caiga por detrás de la plataforma inicial.
    if (pos.z > 55) pos.z = 55;
    
    // Aplica la nueva posición corregida.
    this.el.setAttribute('position', pos);
  }
});

/**
 * Componente: baldosa-interactiva
 * Gestiona el comportamiento de una baldosa individual cuando el jugador la pisa.
 */
AFRAME.registerComponent('baldosa-interactiva', {
  init: function () {
    // Inicializa el estado de la baldosa.
    this.falling = false;
    this.velocity = 0;
  },
  // Esta función es llamada desde 'gravedad-camara' cuando el jugador pisa la baldosa.
  trigger: function () {
    // Si ya está cayendo, no hace nada.
    if (this.falling) return;
    
    var el = this.el;
    // Comprueba si la baldosa es segura leyendo su atributo 'data-safe'.
    var isSafe = el.getAttribute('data-safe') === 'true';

    // Si la baldosa NO es segura...
    if (!isSafe) {
      el.setAttribute('opacity', '0.5'); // La hace semitransparente.
      el.setAttribute('data-falling', 'true'); // Marca que está cayendo para que la gravedad del jugador la ignore.
      this.falling = true; // Activa la lógica de caída en el 'tick'.
    }
  },
  tick: function (time, timeDelta) {
    // Si la baldosa está en estado de caída.
    if (this.falling) {
      var dt = timeDelta / 1000;
      var pos = this.el.getAttribute('position');
      // Aplica una simulación de gravedad simple a la baldosa.
      this.velocity -= 9.8 * dt; 
      pos.y += this.velocity * dt;
      this.el.setAttribute('position', pos);
    }
  }
});

/**
 * Componente: gravedad-camara
 * Es el cerebro del minijuego. Gestiona:
 * 1. La gravedad personalizada del jugador.
 * 2. La altura fija de la cámara.
 * 3. La detección de qué baldosa se está pisando.
 * 4. La lógica del HUD narrativo (mostrar frases).
 * 5. La detección de caída (muerte) y el respawn.
 */
AFRAME.registerComponent('gravedad-camara', {
  init: function() {
    // Variables para la física de la cámara.
    this.velocity = 0;
    this.onGround = false;
    // Altura Y absoluta y fija a la que se mantendrá la cámara.<------------------------ TOCAR PARA AJUSTAR AL ALTURA DE LA CAMARA -----------------------
    this.absoluteHeight = 20.0; 
    this.isDead = false;

    // Configuración del Raycaster: un "rayo" que se lanza hacia abajo para detectar el suelo.
    this.raycaster = new THREE.Raycaster();
    this.raycaster.ray.direction.set(0, -1, 0);
    this.raycaster.far = 100.0; // Distancia máxima del rayo, suficientemente grande.

    // Variables para el sistema de frases y rutas. Se llenarán al final del script.
    this.frases = []; 
    this.coordenadasRuta = [];
    this.lastCoords = null; // Almacena las coordenadas de la última baldosa pisada para no repetir lógica.
  },
  tick: function (time, timeDelta) {
    var el = this.el;
    var pos = el.getAttribute('position');
    
    // El rayo se origina desde la posición actual de la cámara.
    this.raycaster.ray.origin.copy(el.object3D.position);
    
    // Lista de objetos con los que el rayo puede colisionar.
    var objects = [];
    var suelo = document.querySelector('.suelo');
    var sueloFinal = document.querySelector('.suelo-final');
    var grid = document.querySelector('#grid-container');
    if (suelo) objects.push(suelo.object3D);
    if (sueloFinal) objects.push(sueloFinal.object3D);
    if (grid) objects.push(grid.object3D);

    // Lanza el rayo y obtiene las intersecciones.
    var intersections = this.raycaster.intersectObjects(objects, true);
    var isTouchingGround = false;
    var groundY = -Infinity;

    // Si el rayo ha chocado con algo...
    if (intersections.length > 0) {
      groundY = intersections[0].point.y;
      var hitObj = intersections[0].object;
      // A-Frame anida objetos, así que subimos en la jerarquía hasta encontrar la entidad principal (<a-box>, <a-image>).
      while (hitObj && !hitObj.el) { hitObj = hitObj.parent; }
      var hitEl = hitObj ? hitObj.el : null;

      // Caso especial: si chocamos con la imagen, nos interesa su padre (la baldosa).
      if (hitEl && hitEl.tagName === 'A-IMAGE' && hitEl.parentEl) {
        hitEl = hitEl.parentEl;
      }
      
      // --- LÓGICA DEL HUD NARRATIVO ---
      if (hitEl) {
        var coords = hitEl.getAttribute('data-coords');
        var isSuelo = hitEl.classList.contains('suelo');

        // Si estamos en la plataforma de inicio y no lo estábamos antes.
        if (isSuelo && this.lastCoords !== 'suelo') {
          this.lastCoords = 'suelo';
          var hudText = document.querySelector('#row-display');
          if (hudText && !this.isDead && this.frases.length > 0) {
            hudText.innerText = this.frases[0]; // Muestra la frase/pista para el primer paso.
          }
        } 
        // Si pisamos una baldosa de la cuadrícula que es diferente a la anterior.
        else if (coords && coords !== this.lastCoords) {
          this.lastCoords = coords;
          var isSafe = hitEl.getAttribute('data-safe') === 'true';
          
          // Si la baldosa es segura, actualizamos el HUD.
          if (isSafe && this.coordenadasRuta.length > 0) {
            var stepIndex = this.coordenadasRuta.indexOf(coords);
            var hudText = document.querySelector('#row-display');
            
            if (hudText && !this.isDead) {
              // Si no es la última casilla, muestra la frase de la SIGUIENTE casilla como pista.
              if (stepIndex !== -1 && stepIndex + 1 < this.frases.length) {
                hudText.innerText = this.frases[stepIndex + 1];
              } 
              // Si es la última casilla de la ruta, muestra el mensaje de victoria.
              else if (stepIndex === this.coordenadasRuta.length - 1) {
                hudText.innerText = "Hecho. Has cruzado mi dominio.";
              }
            }
          }
        }
      }
      // --- FIN LÓGICA DEL HUD ---

      // Si la baldosa pisada está marcada como 'cayendo', consideramos que el jugador está en el aire.
      if (hitEl && hitEl.getAttribute('data-falling') === 'true') {
        isTouchingGround = false; 
        this.el.setAttribute('wasd-controls', 'acceleration', 0); // Desactivamos el movimiento.
      } else {
        isTouchingGround = true;
        this.el.setAttribute('wasd-controls', 'acceleration', 60); // Activamos el movimiento.
      }

      // Si la baldosa tiene el componente 'baldosa-interactiva', llamamos a su función 'trigger'.
      if (hitEl && hitEl.components['baldosa-interactiva']) {
        hitEl.components['baldosa-interactiva'].trigger();
      }
    }
    
    // --- LÓGICA DE GRAVEDAD DE LA CÁMARA ---
    var dt = timeDelta / 1000;

    // Si estamos tocando el suelo...
    if (isTouchingGround) {
      this.velocity = 0; // La velocidad vertical es cero.
      this.onGround = true;
      pos.y = this.absoluteHeight; // Forzamos la cámara a la altura fija definida.
    } else {
      // Si estamos en el aire...
      this.onGround = false;
      this.velocity -= 9.8 * dt; // Aplicamos la gravedad a la velocidad.
      pos.y += this.velocity * dt; // Actualizamos la posición Y.
    }

    // --- DETECCIÓN DE CAÍDA Y JUMPSCARE ---
    // Si la cámara baja de Y=10 y no estamos ya "muertos".
    if (pos.y < 10 && !this.isDead) {
      this.isDead = true;
      var hudImg = document.querySelector('#hud-img');
      if (hudImg) {
        // Cambiamos el tamaño de la imagen de la reina para que sea grande (jumpscare).
        // 'clamp' asegura que el tamaño sea responsive pero dentro de unos límites.
        hudImg.style.width = 'clamp(250px, 50vw, 800px)'; 
        hudImg.style.height = 'clamp(250px, 50vw, 800px)';
        hudImg.setAttribute('src', '../assets/2D/reinaenfadada.png');
      }

      // Cambiamos el texto del HUD a un mensaje de error en rojo.
      var hudText = document.querySelector('#row-display');
      if (hudText && hudText.parentElement) {
        hudText.innerText = "¡TE EQUIVOCASTE!";
        hudText.parentElement.style.fontSize = 'clamp(30px, 4vw, 80px)';
        hudText.parentElement.style.color = 'red';
        hudText.parentElement.style.borderColor = 'red';
      }
    }

    // --- LÓGICA DE RESPAWN ---
    // Si la cámara baja de Y=-5, el jugador ha caído lo suficiente.
    if (pos.y < -5) {
      // Reseteamos la posición del jugador al punto de inicio.
      pos.x = 0; pos.y = 20.0; pos.z = 50;
      this.velocity = 0;
      this.isDead = false;
      this.lastCoords = 'suelo'; // Reseteamos la última coordenada para que la lógica del HUD se reinicie.
      this.el.setAttribute('wasd-controls', 'acceleration', 60); // Reactivamos el movimiento.
      
      // Restauramos la imagen del HUD a su estado normal.
      var hudImg = document.querySelector('#hud-img');
      if (hudImg) {
        hudImg.style.width = 'clamp(120px, 15vw, 300px)';
        hudImg.style.height = 'clamp(120px, 15vw, 300px)';
        hudImg.setAttribute('src', '../assets/2D/reinaminiatura.png'); 
      }

      // Restauramos el texto del HUD a su estado normal.
      var hudText = document.querySelector('#row-display');
      if (hudText && hudText.parentElement) {
        if (this.frases.length > 0) hudText.innerText = this.frases[0];
        hudText.parentElement.style.fontSize = 'clamp(16px, 1.8vw, 35px)';
        hudText.parentElement.style.color = 'black';
        hudText.parentElement.style.borderColor = 'black';
      }
    }

    // Finalmente, aplicamos la posición calculada (ya sea por gravedad o por altura fija) a la entidad de la cámara.
    el.setAttribute('position', pos);
  }
});

/**
 * Script principal que se ejecuta cuando el DOM está completamente cargado.
 * Se encarga de:
 * 1. Definir las rutas seguras y sus frases.
 * 2. Elegir una ruta al azar.
 * 3. Generar dinámicamente la cuadrícula de baldosas en la escena.
 * 4. Asignar a cada baldosa si es segura o no.
 * 5. Inyectar la información de la ruta elegida en el componente 'gravedad-camara'.
 */
document.addEventListener('DOMContentLoaded', function() {
  var container = document.querySelector('#grid-container');

  // --- DEFINICIÓN DE LAS RUTAS POSIBLES ---
  // Cada objeto representa un camino seguro. Contiene el nombre, un array de coordenadas [fila,columna]
  // y un array de frases. Cada frase corresponde a una coordenada.
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

  // Elige una de las rutas definidas de forma aleatoria.
  var rutaElegida = rutasPosibles[Math.floor(Math.random() * rutasPosibles.length)];
  console.log("Ruta seleccionada:", rutaElegida.nombre);

  // Define el patrón de imágenes que se repetirá en la cuadrícula.
  var patternImages = [ // 3 filas de patrones que se repiten.
    ['../assets/2d/Individual symbols/Clock.png', '../assets/2d/Individual symbols/Hole and Key.png', '../assets/2d/Individual symbols/Hat.png', '../assets/2d/Individual symbols/Clock.png', '../assets/2d/Individual symbols/Hole and Key.png', '../assets/2d/Individual symbols/Hat.png'],
    ['../assets/2d/Individual symbols/Card.png', '../assets/2d/Individual symbols/Jelly.png', '../assets/2d/Individual symbols/Flower.png', '../assets/2d/Individual symbols/Card.png', '../assets/2d/Individual symbols/Jelly.png', '../assets/2d/Individual symbols/Flower.png'],
    ['../assets/2d/Individual symbols/Cups.png', '../assets/2d/Individual symbols/Chessire.png', '../assets/2d/Individual symbols/Spade.png', '../assets/2d/Individual symbols/Cups.png', '../assets/2d/Individual symbols/Chessire.png', '../assets/2d/Individual symbols/Spade.png']
  ];

  if (container) {
    for (var z = 0; z < 18; z++) {
      // Bucle para las filas (eje Z).
      for (var x = 0; x < 6; x++) {
        // Bucle para las columnas (eje X).
        var box = document.createElement('a-box');
        
        // Calcula la posición 3D de la baldosa.
        var posX = (x - 2.5) * 4.6;
        var posZ = -z * 4.6; 
        
        box.setAttribute('position', {x: posX, y: -0.5, z: posZ});
        box.setAttribute('width', 4.6);
        box.setAttribute('height', 1.0); 
        box.setAttribute('depth', 4.6);
        box.setAttribute('color', '#EEEEEE');

        // Crea la imagen del símbolo que va sobre la baldosa.
        var imgEl = document.createElement('a-image');
        var rowPattern = patternImages[z % 3]; // Elige el patrón de la fila usando el módulo 3.
        var symbol = rowPattern[x];
        
        imgEl.setAttribute('src', symbol);
        imgEl.setAttribute('rotation', '-90 0 0');
        imgEl.setAttribute('width', 4.4);  
        imgEl.setAttribute('height', 4.4);
        imgEl.setAttribute('position', '0 0.51 0'); // La pone ligeramente por encima de la baldosa para evitar z-fighting.
        imgEl.setAttribute('mejora-textura', ''); // Añade el componente para mejorar la nitidez.
        box.appendChild(imgEl);
        
        box.setAttribute('class', 'baldosa');
        
        // Guarda las coordenadas de la baldosa en un atributo para identificarla fácilmente.
        var coordStr = '[' + z + ',' + x + ']';
        box.setAttribute('data-coords', coordStr);
        box.setAttribute('baldosa-interactiva', '');

        // Comprueba si esta coordenada está en la lista de la ruta segura elegida.
        if (rutaElegida.coordenadas.includes(coordStr)) {
          box.setAttribute('data-safe', 'true'); // Si está, la marca como segura.
        } else {
          box.setAttribute('data-safe', 'false'); // Si no, la marca como no segura.
        }

        // Añade un cuerpo estático para que el raycaster pueda colisionar con ella.
        box.setAttribute('static-body', '');
        container.appendChild(box);
      }
    }
  }

  // --- INYECCIÓN DE DATOS DE LA RUTA EN EL COMPONENTE DE LA CÁMARA ---
  var camaraEl = document.querySelector('[gravedad-camara]');
  if (camaraEl) {
    // Función para asignar los datos de la ruta al componente.
    var asignarFrases = function() {
      if (camaraEl.components['gravedad-camara']) {
        // Pasa los arrays de frases y coordenadas al componente.
        camaraEl.components['gravedad-camara'].frases = rutaElegida.frases;
        camaraEl.components['gravedad-camara'].coordenadasRuta = rutaElegida.coordenadas;
        
        // Actualiza el HUD con la primera frase de la ruta, para que el jugador sepa por dónde empezar.
        var hudText = document.querySelector('#row-display');
        if (hudText && rutaElegida.frases.length > 0) {
           hudText.innerText = rutaElegida.frases[0];
        }
      }
    };

    // A-Frame carga los componentes de forma asíncrona. Nos aseguramos de asignar los datos cuando el componente ya esté listo.
    if (camaraEl.hasLoaded) asignarFrases();
    else camaraEl.addEventListener('loaded', asignarFrases);
  }
});