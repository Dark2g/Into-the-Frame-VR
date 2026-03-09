AFRAME.registerComponent("play-on-approach", {
  schema: {
    distance: { type: "number", default: 3 }, // Distancia en metros a la que se activa el sonido
  },

  init: function () {
    // Buscamos la cámara (el jugador) en la escena
    this.cameraEl = document.querySelector("[camera]");

    // Optimizamos el chequeo de distancia para que no se ejecute en cada frame, sino cada 500ms
    this.tick = AFRAME.utils.throttleTick(this.checkDistance, 500, this);

    this.isPlaying = false;
  },

  checkDistance: function () {
    // Asegurarnos de que exista la cámara y el componente de sonido de A-Frame en esta entidad
    if (!this.cameraEl || !this.el.components.sound) return;

    // Calculamos la distancia entre el jugador (cámara) y este objeto
    var distance = this.cameraEl.object3D.position.distanceTo(
      this.el.object3D.position,
    );

    // Si la distancia es menor o igual a la configurada
    if (distance <= this.data.distance) {
      if (!this.isPlaying) {
        // Reproducir el sonido usando la API nativa del componente sound de A-Frame
        this.el.components.sound.playSound();
        this.isPlaying = true;
      }
    } else {
      // Si nos alejamos y estaba sonando, lo pausamos
      if (this.isPlaying) {
        this.el.components.sound.pauseSound();
        this.isPlaying = false;
      }
    }
  },
});
