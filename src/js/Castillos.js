// Añadir colision por nombre de objeto en el modelo


AFRAME.registerComponent('colision-ammo', {
    init: function () {
        this.el.addEventListener('model-loaded', () => {
            // Esperar un frame para que Three.js aplique las matrices de transformación
            setTimeout(() => {
                this.el.setAttribute('ammo-body', 'type: static');
                this.el.setAttribute('ammo-shape', 'type: mesh; fit: all; includeInvisible: true');
                console.log("✅ [AMMO] Físicas del mapa cargadas correctamente.");
            }, 100);
        });
    }
});