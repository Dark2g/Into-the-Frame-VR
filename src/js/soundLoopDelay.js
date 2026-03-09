AFRAME.registerComponent('sound-loop-delay', {
  schema: {
    delay: { type: 'number', default: 3000 } // Retraso en milisegundos
  },
  init: function () {
    this.onSoundEnded = this.onSoundEnded.bind(this);
    this.el.addEventListener('sound-ended', this.onSoundEnded);
  },
  onSoundEnded: function () {
    setTimeout(() => {
      if (this.el.components.sound) {
        this.el.components.sound.playSound();
      }
    }, this.data.delay);
  },
  remove: function () {
    this.el.removeEventListener('sound-ended', this.onSoundEnded);
  }
});
