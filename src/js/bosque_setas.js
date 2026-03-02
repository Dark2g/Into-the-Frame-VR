//crear cargar la base de datos y la tabla
const db = new Dexie("JuegoDB");

db.version(1).stores({
    inventario: "id, tipo",
    hitos:"id"
});


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
            await db.hitos.put({id:"puerta_roja_abierta"})
            console.log(" Candado abierto");
            const door = this.el.closest("#door2").querySelector("a-box");
            door.setAttribute("animation__open", {
                property: "position",
                to: "0 -3 0",
                dur: 1200,
                easing: "easeOutQuad"
            });

            this.el.setAttribute("animation__break", {
                property: "scale",
                to: "0 0 0",
                dur: 300,
                easing: "easeInQuad"
            });

            setTimeout(() => this.el.remove(), 300);
        });
    }
});


// CONTADOR DE SETAS

let gameState = {
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

document.addEventListener('DOMContentLoaded', function () {
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
        if (await db.hitos.get("puerta_roja_abierta")) {
            const candadoEl = document.querySelector("[candado]");
            if (candadoEl) candadoEl.remove();
            const puerta = document.querySelector("#door2");
            if (puerta) {
                const pos = puerta.getAttribute("position");
                puerta.setAttribute("position", {
                    x: pos.x,
                    y: pos.y - 3,
                    z: pos.z
                });
            }
            const el = document.querySelector("[llave]");
            if (el) el.remove();
        }
        if (await db.inventario.get("llave_roja")) {
            const el = document.querySelector("[llave]");
            if (el) el.remove();
        }
    } catch (err) {
        console.warn('[GAME] Error al restaurar estado de Dexie:', err);
    }

    // Siempre iniciar el contador y el sistema de recogida de setas
    createUI();
    startTimer();
    startProximityCheck();

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
    gameState.timerInterval = setInterval(function () {
        if (!gameState.isActive) {
            clearInterval(gameState.timerInterval);
            return;
        }

        gameState.timeRemaining--;

        // Actualizar UI del timer
        if (uiElements.timer) {
            uiElements.timer.textContent = 'Tiempo: ' + gameState.timeRemaining + 's';

            // Cambiar a rojo cuando quedan 10 segundos
            if (gameState.timeRemaining <= 10) {
                uiElements.timer.style.color = '#E74C3C';
            } else {
                uiElements.timer.style.color = '#333';
            }
        }

        console.log('[TIMER] Tiempo restante:', gameState.timeRemaining);

        // Cuando llega a 0, se detiene sin mensaje
        if (gameState.timeRemaining <= 0) {
            console.log('[TIMER] Tiempo agotado');
            gameState.isActive = false;
            clearInterval(gameState.timerInterval);
        }
    }, 1000);
}

/**
 * SISTEMA DE DETECCIÓN DE PROXIMIDAD
 * Revisa constantemente la distancia del jugador a las setas
 * Usa distancia horizontal (XZ) ignorando la altura (Y)
 */
function startProximityCheck() {
    const camera = document.querySelector('a-camera');
    const mushrooms = document.querySelectorAll('.mushroom');

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
            // Ammo.js lee el modelo complejo y le aplica la física estática en 1 segundo
            this.el.setAttribute('ammo-body', 'type: static');
            this.el.setAttribute('ammo-shape', 'type: mesh');
            console.log("✅ [AMMO] Físicas del mapa cargadas correctamente.");
        });
    }
});

AFRAME.registerComponent('player-move', {
    init() {
        this.keys = {};
        window.addEventListener('keydown', e => this.keys[e.code] = true);
        window.addEventListener('keyup', e => this.keys[e.code] = false);
    },
    tick() {
        const body = this.el.body;
        if (!body) return; // Espera a que nazca el cuerpo físico

        const cam = document.querySelector('#cam');
        if (!cam) return;

        // Calculamos hacia dónde mira la cámara
        const dir = new THREE.Vector3();
        cam.object3D.getWorldDirection(dir);
        dir.y = 0;
        dir.normalize();

        const right = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize();

        const speed = 4; // Velocidad del jugador
        let vx = 0, vz = 0;

        // Controles WASD
        if (this.keys.KeyS) { vx += dir.x; vz += dir.z; }
        if (this.keys.KeyW) { vx -= dir.x; vz -= dir.z; }
        if (this.keys.KeyA) { vx += right.x; vz += right.z; }
        if (this.keys.KeyD) { vx -= right.x; vz -= right.z; }

        // Aplicamos la velocidad usando Ammo.js
        const vel = body.getLinearVelocity();
        body.setLinearVelocity(new Ammo.btVector3(vx * speed, vel.y(), vz * speed));
        
        // Magia negra de Ammo para evitar que el jugador se "duerma" (kinematic flag)
        body.setCollisionFlags(body.getCollisionFlags() & ~2); 
        body.activate(); 
    }
});