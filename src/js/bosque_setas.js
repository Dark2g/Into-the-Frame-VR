//crear cargar la base de datos y la tabla
const db = new Dexie("JuegoDB");

// version 1 → solo inventario (schema original)
db.version(1).stores({
    inventario: "id, tipo"
});
// version 2 → añade tabla hitos
db.version(2).stores({
    inventario: "id, tipo",
    hitos: "id"
});
let mushroomSpawns = [];

//registro componente gestor patron 
AFRAME.registerComponent('puzzle_patron-manager', {
    init() {
        this.order = [0, 1, 2, 3];
        this.step = 0;

        this.el.sceneEl.addEventListener('puzzle-patron-press', (e) => {
            this.check(e.detail.id);
        });
    },

    async check(id) {
        if (id === this.order[this.step]) {
            this.step++;

            if (this.step === this.order.length) {
                try {
                    await db.hitos.put({ id: "reto_patrones_completado" });
                } catch (e) {
                    console.warn('[DB] Error guardando hito:', e);
                }
                this.openDoor();
            }
        } else {
            this.reset();
        }
    },

    openDoor() {

        const left = document.querySelector('#door-left-pivot');
        const right = document.querySelector('#door-right-pivot');

        if (!left || !right) return;

        const leftDoor = document.querySelector('#door-left');
        const rightDoor = document.querySelector('#door-right');

        // quitar collider al abrir
        if (leftDoor) leftDoor.removeAttribute("ammo-body");
        if (rightDoor) rightDoor.removeAttribute("ammo-body");

        left.setAttribute('animation__open', {
            property: 'rotation',
            to: '0 -90 0',
            dur: 1200,
            easing: 'easeOutQuad'
        });

        right.setAttribute('animation__open', {
            property: 'rotation',
            to: '0 90 0',
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
//recogida de llave
AFRAME.registerComponent("llave", {
    schema: {
        id: { type: "string" }
    },

    init() {
        this.el.addEventListener("click", async () => {
            await db.inventario.put({
                id: this.data.id,
                tipo: "llave"
            });

            console.log("[LLAVE] Guardada:", this.data.id);

            this.el.remove(); // desaparece del mundo
        });
    }
});

AFRAME.registerComponent("candado", {
    schema: {
        llave: { type: "string" }
    },

    init() {
        this.el.addEventListener("click", async () => {
            const tieneLlave = await db.inventario.get(this.data.llave);

            if (!tieneLlave) {
                console.log(" Candado cerrado. Falta la llave");
                return;
            }

            // Consumir llave
            await db.inventario.delete(this.data.llave);
            await db.hitos.put({ id: "reto_setas_completado" })
            console.log(" Candado abierto");

            // detener contador
            gameState.isActive = false;

            if (gameState.timerInterval) {
                clearInterval(gameState.timerInterval);
                gameState.timerInterval = null;
            }

            if (uiElements.container) {
                uiElements.container.remove();
            }
            removeFog();
            const left = document.querySelector("#door2-left-pivot");
            const right = document.querySelector("#door2-right-pivot");
            const leftDoor = document.querySelector('#door2-left');
            const rightDoor = document.querySelector('#door2-right');

            // quitar collider al abrir
            if (leftDoor) leftDoor.removeAttribute("ammo-body");
            if (rightDoor) rightDoor.removeAttribute("ammo-body");
            left.setAttribute("animation__open", {
                property: "rotation",
                to: "0 -51 0",
                dur: 1200,
                easing: "easeOutQuad"
            });

            right.setAttribute("animation__open", {
                property: "rotation",
                to: "0 51 0",
                dur: 1200,
                easing: "easeOutQuad"
            });

            setTimeout(() => this.el.remove(), 300);
        });
    }
});


// CONTADOR DE SETAS

let gameState = {
    startPosition: null,
    timeRemaining: 30, // Segundos restantes
    isActive: false, // Si el juego está en marcha
    mushroomsCollected: 0, // Cantidad de setas normales recogidas
    collectedSet: new Set(), // Set para evitar recoger setas duplicadas
    timerInterval: null // Referencia al intervalo del timer
};

let uiElements = {
    container: null,
    timer: null
};

document.addEventListener('DOMContentLoaded', async function () {
    const scene = document.querySelector('a-scene');

    if (scene.hasLoaded) {
        initGame();
    } else {
        scene.addEventListener('loaded', function () {
            initGame();
        });
    }
});

async function initGame() {
    // Restaurar estado guardado en Dexie (llave/candado)
    try {
        if (await db.hitos.get("reto_setas_completado")) {

            const candadoEl = document.querySelector("[candado]");
            if (candadoEl) candadoEl.remove();

            const left = document.querySelector("#door2-left-pivot");
            const right = document.querySelector("#door2-right-pivot");

            const leftDoor = document.querySelector("#door2-left");
            const rightDoor = document.querySelector("#door2-right");

            if (leftDoor) leftDoor.removeAttribute("ammo-body");
            if (rightDoor) rightDoor.removeAttribute("ammo-body");

            const open = () => {

                if (leftDoor) leftDoor.removeAttribute("ammo-body");
                if (rightDoor) rightDoor.removeAttribute("ammo-body");

                left.setAttribute("rotation", "0 -51 0");
                right.setAttribute("rotation", "0 51 0");

            };

            if (leftDoor && leftDoor.hasLoaded) {
                open();
            } else if (leftDoor) {
                leftDoor.addEventListener("model-loaded", open);
            }

            const el = document.querySelector("[llave]");
            if (el) el.remove();
        }
        if (await db.inventario.get("llave_roja") || await db.hitos.get("reto_setas_completado")) {
            const el = document.querySelector("[llave]");
            if (el) el.remove();
        }
        if (await db.hitos.get("reto_patrones_completado")) {

            const left = document.querySelector('#door-left-pivot');
            const right = document.querySelector('#door-right-pivot');

            const leftDoor = document.querySelector('#door-left');
            const rightDoor = document.querySelector('#door-right');

            const open = () => {

                if (leftDoor) leftDoor.removeAttribute("ammo-body");
                if (rightDoor) rightDoor.removeAttribute("ammo-body");

                left.setAttribute('rotation', '0 -90 0');
                right.setAttribute('rotation', '0 90 0');

            };

            // esperar a que cargue el modelo
            if (leftDoor.hasLoaded) {
                open();
            } else {
                leftDoor.addEventListener("model-loaded", open);
            }

        }
    } catch (err) {
        console.warn('[GAME] Error al restaurar estado de Dexie:', err);
    }



    gameState.isActive = true;
    console.log('[GAME] Juego iniciado');
}

function createUI() {
    // Contenedor principal
    uiElements.container = document.createElement('div');
    uiElements.container.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        font-family: Arial, sans-serif;
        z-index: 1000;
        text-align: center;
    `;

    // Timer
    uiElements.timer = document.createElement('div');
    uiElements.timer.style.cssText = `
        font-size: 32px;
        color: #333;
        background: rgba(255, 255, 255, 0.9);
        padding: 15px 30px;
        border-radius: 10px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    `;
    uiElements.timer.textContent = 'Tiempo: 30s';

    uiElements.container.appendChild(uiElements.timer);
    document.body.appendChild(uiElements.container);
}

function startTimer() {

    // evitar múltiples timers
    if (gameState.timerInterval) return;

    gameState.timerInterval = setInterval(function () {

        if (!gameState.isActive) {
            clearInterval(gameState.timerInterval);
            gameState.timerInterval = null;
            return;
        }

        gameState.timeRemaining--;

        if (uiElements.timer) {
            uiElements.timer.textContent = 'Tiempo: ' + gameState.timeRemaining + 's';

            if (gameState.timeRemaining <= 10) {
                uiElements.timer.style.color = '#E74C3C';
            } else {
                uiElements.timer.style.color = '#333';
            }
        }

        if (gameState.timeRemaining <= 0) {

            console.log('[TIMER] Tiempo agotado');

            gameState.isActive = false;

            clearInterval(gameState.timerInterval);
            gameState.timerInterval = null;

            resetChallenge();
        }

    }, 1000);
}
/**
 * SISTEMA DE DETECCIÓN DE PROXIMIDAD
 * Revisa constantemente la distancia del jugador a las setas
 * Usa distancia horizontal (XZ) ignorando la altura (Y)
 */
function startProximityCheck() {
    const camera = document.querySelector('#cam');
    const mushrooms = document.querySelectorAll('.mushroom');

    // guardar posiciones solo la primera vez
    if (mushroomSpawns.length === 0) {

        mushrooms.forEach(m => {

            const pos = m.getAttribute("position");

            mushroomSpawns.push({
                type: m.getAttribute("data-mushroom-type"),
                position: { x: pos.x, y: pos.y, z: pos.z }
            });

        });

    }

    if (!camera) {
        console.error('[ERROR] No se encontró la cámara');
        return;
    }

    const COLLECT_DISTANCE = 1.5;  // Metros de distancia para recoger

    // Vectores para cálculos de posición 3D
    const playerWorldPos = new THREE.Vector3();
    const mushroomWorldPos = new THREE.Vector3();

    /**
     * LOOP PRINCIPAL DE DETECCIÓN
     * Se ejecuta cada frame (60 veces por segundo)
     */
    const checkProximity = function () {
        // Obtener posición actual del jugador en el mundo 3D
        camera.object3D.getWorldPosition(playerWorldPos);

        // Revisar cada seta del juego
        mushrooms.forEach((mushroom) => {
            // Saltar si ya fue recogida
            if (gameState.collectedSet.has(mushroom)) return;

            // Obtener posición de la seta
            mushroom.object3D.getWorldPosition(mushroomWorldPos);

            // Calcular distancia HORIZONTAL (ignorando altura Y)
            const dx = playerWorldPos.x - mushroomWorldPos.x;
            const dz = playerWorldPos.z - mushroomWorldPos.z;
            const horizontalDistance = Math.sqrt(dx * dx + dz * dz);

            // Si está suficientemente cerca, recogerla
            if (horizontalDistance < COLLECT_DISTANCE) {
                collectMushroom(mushroom);
            }
        });

        // Continuar el loop
        requestAnimationFrame(checkProximity);
    };

    // Iniciar el loop
    requestAnimationFrame(checkProximity);
}

/**
 * RECOGER SETA
 * Maneja la lógica cuando el jugador recoge una seta
 * - Seta normal: incrementa contador
 * - Seta especial: resetea el timer a 30 segundos
 */
function collectMushroom(mushroomEl) {
    // Evitar recoger dos veces la misma seta
    if (gameState.collectedSet.has(mushroomEl)) return;

    const mushroomType = mushroomEl.getAttribute('data-mushroom-type');

    console.log('[COLLECT] Seta recogida -', mushroomType);

    // Marcar como recogida
    gameState.collectedSet.add(mushroomEl);

    if (mushroomType === 'special') {
        // SETA ESPECIAL: resetear timer a 30 segundos
        console.log('[COLLECT] ¡Seta especial! Timer reseteado a 30s');

        // Resetear tiempo a 30
        gameState.timeRemaining = 30;

        // Actualizar UI inmediatamente
        if (uiElements.timer) {
            uiElements.timer.textContent = 'Tiempo: 30s';
            uiElements.timer.style.color = '#333'; // Volver a color normal
        }

    } else {
        // SETA NORMAL: incrementar contador
        gameState.mushroomsCollected++;
        console.log('[COLLECT] Setas normales recogidas:', gameState.mushroomsCollected);
    }

    // Animar y eliminar la seta del mundo
    animateAndRemoveMushroom(mushroomEl);
}

/**
 * ANIMAR Y ELIMINAR SETA
 * Aplica animaciones de desaparición y luego elimina del DOM
 */
function animateAndRemoveMushroom(mushroomEl) {
    // Animación de encogimiento
    mushroomEl.setAttribute('animation', {
        property: 'scale',
        to: '0 0 0',
        dur: 300,
        easing: 'easeInQuad'
    });

    // Animación de rotación
    mushroomEl.setAttribute('animation__rotate', {
        property: 'rotation',
        to: '0 360 0',
        dur: 300,
        easing: 'easeInQuad'
    });

    // Eliminar del DOM después de la animación
    setTimeout(() => {
        if (mushroomEl.parentNode) {
            mushroomEl.parentNode.removeChild(mushroomEl);
        }
    }, 300);
}

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

// AFRAME.registerComponent('player-move', {
//     init() {
//         this.keys = {};
//         window.addEventListener('keydown', e => this.keys[e.code] = true);
//         window.addEventListener('keyup', e => this.keys[e.code] = false);
//     },
//     tick() {
//         const body = this.el.body;
//         if (!body) return; // Espera a que nazca el cuerpo físico

//         const cam = document.querySelector('#cam');
//         if (!cam) return;

//         // Calculamos hacia dónde mira la cámara
//         const dir = new THREE.Vector3();
//         cam.object3D.getWorldDirection(dir);
//         dir.y = 0;
//         dir.normalize();

//         const right = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize();

//         const speed = 4; // Velocidad del jugador
//         let vx = 0, vz = 0;

//         // Controles WASD
//         if (this.keys.KeyS) { vx += dir.x; vz += dir.z; }
//         if (this.keys.KeyW) { vx -= dir.x; vz -= dir.z; }
//         if (this.keys.KeyA) { vx += right.x; vz += right.z; }
//         if (this.keys.KeyD) { vx -= right.x; vz -= right.z; }

//         // Aplicamos la velocidad usando Ammo.js
//         const vel = body.getLinearVelocity();
//         body.setLinearVelocity(new Ammo.btVector3(vx * speed, vel.y(), vz * speed));

//         // Magia negra de Ammo para evitar que el jugador se "duerma" (kinematic flag)
//         body.setCollisionFlags(body.getCollisionFlags() & ~2);
//         body.activate();
//     }
// });
//inicializar timer cuando pases de cierta zona
AFRAME.registerComponent('timer-trigger', {
    schema: {
        minX: { type: 'number' },
        maxX: { type: 'number' },
        minZ: { type: 'number' },
        maxZ: { type: 'number' },
        hito: { type: 'string' }
    },

    init() {
        this.player = document.querySelector('#player');
        this.playerPos = new THREE.Vector3();
        this.triggered = false;

        // Comprobar el hito UNA sola vez al inicio, no en cada tick
        db.hitos.get(this.data.hito)
            .then(done => { if (done) this.triggered = true; })
            .catch(() => {});
    },

    tick() {
        if (this.triggered || !this.player) return;

        this.player.object3D.getWorldPosition(this.playerPos);

        const x = this.playerPos.x;
        const z = this.playerPos.z;
        if (
            x >= this.data.minX &&
            x <= this.data.maxX &&
            z >= this.data.minZ &&
            z <= this.data.maxZ
        ) {
            this.triggered = true;

            console.log("[TRIGGER] Zona del minijuego alcanzada");

            gameState.startPosition = {
                x: this.playerPos.x,
                y: this.playerPos.y,
                z: this.playerPos.z
            };
            startChallenge();
        }
    }

}

)
function startChallenge() {
    gameState.collectedSet.clear();
    gameState.timeRemaining = 30;
    gameState.isActive = true;
    gameState.mushroomsCollected = 0;
    gameState.collectedSet.clear();

    if (!uiElements.container) {
        createUI();
    }
    activateFog();
    uiElements.timer.textContent = "Tiempo: 30s";
    uiElements.timer.style.color = "#333";

    startTimer();
    startProximityCheck();

};
function resetChallenge() {

    console.log("[GAME] Reiniciando reto");

    const player = document.querySelector("#player");

    if (player && gameState.startPosition) {

        player.body.setLinearVelocity(new Ammo.btVector3(0, 0, 0));

        const transform = new Ammo.btTransform();
        transform.setIdentity();

        transform.setOrigin(
            new Ammo.btVector3(
                gameState.startPosition.x,
                gameState.startPosition.y,
                gameState.startPosition.z
            )
        );
        removeFog();
        player.body.setWorldTransform(transform);
        player.body.getMotionState().setWorldTransform(transform);

    }

    respawnMushrooms();
    startChallenge();
}
function respawnMushrooms() {

    // eliminar setas actuales
    document.querySelectorAll(".mushroom").forEach(m => m.remove());

    mushroomSpawns.forEach(data => {

        const mushroom = document.createElement("a-entity");

        mushroom.classList.add("mushroom");


        mushroom.setAttribute("data-mushroom-type", data.type);
        mushroom.setAttribute(
            "position",
            `${data.position.x} ${data.position.y} ${data.position.z}`
        );

        // modelo interno (offset corregido)
        const model = document.createElement("a-entity");

        model.setAttribute("gltf-model", "#mushroomModel");
        model.setAttribute("position", "2.517 -4.564 11.264");
        model.setAttribute("scale", "0.35 0.35 0.35");

        mushroom.appendChild(model);

        document.querySelector("a-scene").appendChild(mushroom);

    });

}
function activateFog() {

    const scene = document.querySelector("a-scene");

    scene.setAttribute("fog", {
        type: "exponential",
        color: "#4B1E6E",
        density: 0.5
    });

}

function removeFog() {

    const scene = document.querySelector("a-scene");

    scene.removeAttribute("fog");

}