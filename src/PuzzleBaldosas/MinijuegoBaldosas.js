// Componente para crear barreras invisibles en la plataforma inicial
AFRAME.registerComponent('seguridad-plataforma', {
  tick: function () {
    var pos = this.el.getAttribute('position');
    
    // Si estamos en la zona de la plataforma (Z > 1.5)
    if (pos.z > 1.5) {
      // Barrera Izquierda (X < -2.5)
      if (pos.x < -2.5) pos.x = -2.5;
      // Barrera Derecha (X > 2.5)
      if (pos.x > 2.5) pos.x = 2.5;
      // Barrera Trasera (Z > 7.0)
      if (pos.z > 7.0) pos.z = 7.0;
      
      this.el.setAttribute('position', pos);
    }
  }
});

// Componente personalizado para detectar cuando se PISA la baldosa
AFRAME.registerComponent('baldosa-interactiva', {
  init: function () {
    var el = this.el;
    
    // Se activa cuando el raycaster (los pies) toca la baldosa
    el.addEventListener('raycaster-intersected', function () {
      var coords = el.getAttribute('data-coords');
      var panel = document.querySelector('#hud-info');
      
      if (panel) panel.innerText = 'Estás pisando la baldosa: ' + coords;
      
      // Efecto visual: se vuelve semitransparente al pisar
      el.setAttribute('opacity', '0.5');
    });

    // Se activa cuando dejas de pisar la baldosa
    el.addEventListener('raycaster-intersected-cleared', function () {
      el.setAttribute('opacity', '1');
    });
  }
});

// Script para generar el Grid 4x4 automáticamente
// Usamos DOMContentLoaded para asegurarnos de que la escena existe antes de añadir cajas
document.addEventListener('DOMContentLoaded', function() {
  var container = document.querySelector('#grid-container');
  var colors = ['#EF2D5E', '#4CC3D9', '#FFC65D', '#7BC8A4']; // Colores variados

  if (container) {
    for (var x = 0; x < 4; x++) {
      // Aumentamos a 20 filas para crear un camino largo hacia el fondo
      for (var z = 0; z < 20; z++) {
        var box = document.createElement('a-box');
        
        // Calcular posición: X centrado, Z avanzando hacia el fondo (negativo)
        var posX = (x - 1.5) * 3.0;
        var posZ = -z * 3.0; // Empieza en 0 y va hacia el fondo (-3, -6, etc.)
        
        box.setAttribute('position', {x: posX, y: 0, z: posZ});
        box.setAttribute('width', 2.9);
        box.setAttribute('height', 0.1); // Altura baja para parecer baldosa
        box.setAttribute('depth', 2.9);
        
        // Asignar color cíclico
        box.setAttribute('color', colors[(x + z) % 4]);
        
        // Asignar clase 'baldosa' para que el raycaster de la cámara la detecte
        box.setAttribute('class', 'baldosa');
        
        // Guardar coordenadas y añadir el componente de interacción
        box.setAttribute('data-coords', '[' + x + ',' + z + ']');
        box.setAttribute('baldosa-interactiva', '');
        
        container.appendChild(box);
      }
    }
  }
});