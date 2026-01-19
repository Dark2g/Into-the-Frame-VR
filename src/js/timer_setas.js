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

document.addEventListener('DOMContentLoaded', function() {
    const scene = document.querySelector('a-scene');
    
    if (scene.hasLoaded) {
        initGame();
    } else {
        scene.addEventListener('loaded', function() {
            initGame();
        });
    }
});

function initGame() {
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
    gameState.timerInterval = setInterval(function() {
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
    const checkProximity = function() {
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
