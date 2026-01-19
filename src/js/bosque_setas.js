//registro componente gestor patron
AFRAME.registerComponent('puzzle_patron-manager', {
  init() {
    this.order = [0, 1, 2, 3];
    this.step = 0;

    this.el.sceneEl.addEventListener('puzzle-patron-press', (e) => {
      this.check(e.detail.id);
    });
  },

  check(id) {
    if (id === this.order[this.step]) {
      this.step++;

      if (this.step === this.order.length) {
        this.openDoor();
      }
    } else {
      this.reset();
    }
  },

  openDoor() {
    const door = document.querySelector('#door');
    door.setAttribute('animation__open', {
      property: 'position',
      to: '0 3 0',
      dur: 1200,
      easing: 'easeOutQuad'
    });
  },

  reset() {
    this.step = 0;
    document.querySelectorAll('[puzzle_patron-button]').forEach(btn => {
      btn.setAttribute('scale', '1 1 1');
    });
  }
});

//registro boton
AFRAME.registerComponent('puzzle_patron-button', {
  schema: {
    id: { type: 'int' }
  },

  init() {
    this.el.addEventListener('click', () => {
      this.el.sceneEl.emit('puzzle-patron-press', {
        id: this.data.id
      });
    });
  }
});
