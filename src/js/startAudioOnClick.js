// startAudioOnClick.js
// Componente reutilizable para iniciar el audio en A-Frame (requerido por navegadores modernos)

AFRAME.registerComponent("start-audio-on-click", {
  schema: {
    // Permite configurar opcionalmente el ID de un texto o elemento a ocultar
    textId: { type: "string", default: "#intro-text" },
  },

  init: function () {
    var self = this;

    window.addEventListener(
      "click",
      function () {
        // Buscamos todas las entidades con el componente de sonido y lo iniciamos
        var audios = document.querySelectorAll("[sound]");
        audios.forEach(function (audioEl) {
          if (audioEl.components.sound) {
            audioEl.components.sound.playSound();
          }
        });

        // Ocultamos el cartel de instrucciones si existe
        if (self.data.textId) {
          var introText = document.querySelector(self.data.textId);
          if (introText) {
            introText.setAttribute("visible", false);
          }
        }
      },
      { once: true }, // Solo se ejecuta en el primer clic
    );
  },
});
