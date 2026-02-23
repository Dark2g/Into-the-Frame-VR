//Importante poner en player id="player-rig"
class ResizeManager {
  constructor(rigSelector = "#player-rig") {
    this.rigSelector = rigSelector;
    this.sizes = {
      small: 0.2, // 20% del tamaño (como un ratón)
      normal: 1, // 100% del tamaño (humano)
      giant: 3, // 300% del tamaño (gigante)
    };
  }

  setSizes(customSizes) {
    this.sizes = { ...this.sizes, ...customSizes };
  }

  setPlayerSize(sizeName, duration = 1000) {
    const rig = document.querySelector(this.rigSelector);
    if (!rig) {
      console.warn(
        `ResizeManager: No se encontró el rig con el selector "${this.rigSelector}"`,
      );
      return;
    }

    const targetScale = this.sizes[sizeName];
    if (targetScale === undefined) {
      console.warn(
        `ResizeManager: El tamaño "${sizeName}" no está definido en los tamaños permitidos.`,
      );
      return;
    }

    const cameraEl = rig.querySelector("[camera]");
    if (cameraEl) {
      const rig3D = rig.object3D;
      const cam3D = cameraEl.object3D;

      const camLocalY = cam3D.position.y;

      const camWorldPos = new THREE.Vector3();
      cam3D.getWorldPosition(camWorldPos);

      rig.setAttribute("position", {
        x: camWorldPos.x,
        y: rig3D.position.y,
        z: camWorldPos.z,
      });

      cameraEl.setAttribute("position", {
        x: 0,
        y: camLocalY,
        z: 0,
      });
    }

    rig.removeAttribute("animation");

    rig.setAttribute("animation", {
      property: "scale",
      to: `${targetScale} ${targetScale} ${targetScale}`,
      dur: duration,
      easing: "easeInOutQuad",
    });
  }
}

window.resizeManager = new ResizeManager();
