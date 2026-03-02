# Into-the-Frame-VR — Informe Técnico

**Alicia en el País de las Maravillas — Versión Marca Blanca**

Juego WebVR/WebXR construido con [A-Frame](https://aframe.io/) que recrea escenas inspiradas en *Alicia en el País de las Maravillas*. El proyecto se compone de varias escenas independientes (minijuegos y puzles) conectadas temáticamente, cada una con su propia lógica de juego.

---

## Índice

1. [Tecnologías y Dependencias](#1-tecnologías-y-dependencias)
2. [Estructura del Proyecto](#2-estructura-del-proyecto)
3. [Arquitectura General](#3-arquitectura-general)
4. [Escenas del Juego](#4-escenas-del-juego)
   - 4.0 [Hub Central — Sala de Puertas (`index.html`)](#40-hub-central--sala-de-puertas)
   - 4.1 [Bosque de Setas (`bosque_setas.html`)](#41-bosque-de-setas)
   - 4.2 [Mesa de Té (`MesaTe.html`)](#42-mesa-de-té)
   - 4.3 [Ajedrez (`Ajedrez.html`)](#43-ajedrez)
   - 4.4 [Puzzle de Baldosas (`PuzzleBaldosas/`)](#44-puzzle-de-baldosas)
5. [Sistemas Reutilizables](#5-sistemas-reutilizables)
   - 5.1 [Sistema de Diálogos (`dialog.js` + `dialog.css`)](#51-sistema-de-diálogos)
   - 5.2 [ResizeManager (`resizeManager.js`)](#52-resizemanager)
   - 5.3 [Movimiento del Jugador (`movement.js`)](#53-movimiento-del-jugador)
6. [Guías para Desarrolladores](#6-guías-para-desarrolladores)
   - 6.1 [Cómo añadir una nueva escena](#61-cómo-añadir-una-nueva-escena)
   - 6.2 [Cómo añadir un nuevo power-up / coleccionable](#62-cómo-añadir-un-nuevo-power-up--coleccionable)
   - 6.3 [Cómo añadir un nuevo puzle tipo patrón](#63-cómo-añadir-un-nuevo-puzle-tipo-patrón)
   - 6.4 [Cómo añadir un nuevo animal al minijuego de la Mesa de Té](#64-cómo-añadir-un-nuevo-animal-al-minijuego-de-la-mesa-de-té)
   - 6.5 [Cómo añadir una nueva pieza o nivel de Ajedrez](#65-cómo-añadir-una-nueva-pieza-o-nivel-de-ajedrez)
   - 6.6 [Cómo añadir un nuevo tamaño al ResizeManager](#66-cómo-añadir-un-nuevo-tamaño-al-resizemanager)
   - 6.7 [Cómo personalizar diálogos con colores temáticos](#67-cómo-personalizar-diálogos-con-colores-temáticos)
   - 6.8 [Cómo añadir persistencia con Dexie (IndexedDB)](#68-cómo-añadir-persistencia-con-dexie-indexeddb)
7. [Ficheros de Test y Demo](#7-ficheros-de-test-y-demo)
8. [Assets y Modelos 3D](#8-assets-y-modelos-3d)
9. [Convenciones de Código](#9-convenciones-de-código)
10. [Problemas Conocidos y TODOs](#10-problemas-conocidos-y-todos)

---

## 1. Tecnologías y Dependencias

| Tecnología | Versión | Uso |
|---|---|---|
| **A-Frame** | 1.7.0 (escenas principales) / 1.5.0–1.6.0 (ajedrez / baldosas) | Framework WebVR/WebXR |
| **Ammo.js** (WASM) | `8bbc0ea` | Motor de físicas (driver Ammo para `aframe-physics-system`) |
| **aframe-physics-system** | v4.2.1 / v4.2.2 | Componentes de física para A-Frame (`ammo-body`, `ammo-shape`, `static-body`) |
| **chess.js** | 0.12.1 | Motor de lógica de ajedrez (validación de movimientos, FEN, jaque mate) |
| **Dexie.js** | 3.x | Wrapper sobre IndexedDB para persistencia local (inventario, hitos) |
| **Three.js** | Incluido con A-Frame | Motor de renderizado 3D subyacente |

Todas las dependencias se cargan vía CDN; no se requiere `npm install`.

---

## 2. Estructura del Proyecto

```
Into-the-Frame-VR/
├── README.md                          ← Este documento
├── assets/
│   ├── 2d/                            ← Sprites e iconos 2D
│   │   └── Individual symbols/
│   ├── models/                        ← Modelos 3D (.glb, .blend)
│   │   ├── Gabi/                      ← Modelos de la Mesa de Té (laberinto, mesa, sillas, tarta, pipa, vela)
│   │   │   └── Mapa/                  ← Blender sources + materiales PBR
│   │   ├── Lajara/                    ← Modelos del Ajedrez (piezas, tablero, castillo)
│   │   │   ├── GLB/                   ← Modelos exportados (.glb) listos para uso
│   │   │   └── PixelCardsByAndrox_free/  ← Assets de cartas pixel art
│   │   └── Mario/                     ← Modelos del Bosque de Setas
│   │       └── gbl/                   ← Claro_de_Setas.glb
│   ├── scenes/                        ← (Reservado para futuras escenas)
│   └── sounds/                        ← (Reservado para audio)
├── src/
│   ├── index.html                     ← Hub central: sala 3D con 4 puertas (punto de entrada)
│   ├── Ajedrez.html                   ← Escena: Minijuego de Ajedrez
│   ├── bosque_setas.html              ← Escena: Bosque de Setas (escena principal)
│   ├── MesaTe.html                    ← Escena: Mesa de Té (con modelos 3D)
│   ├── MesaTe_Test.html               ← Test simplificado de la Mesa de Té
│   ├── Resize_Test.html               ← Test del sistema de cambio de tamaño
│   ├── ResizeManager_Demo.html         ← Demo completa del ResizeManager
│   ├── ejemplo_dialog.html            ← Demo del sistema de diálogos (estilo normal)
│   ├── ejemplo_dialog_game.html       ← Demo del sistema de diálogos (estilo videojuego)
│   ├── css/
│   │   ├── bosque_setas.css           ← Estilos de la escena del bosque
│   │   └── dialog.css                 ← Estilos del sistema de diálogos (normal + game)
│   ├── js/
│   │   ├── bosque_setas.js            ← Lógica: Setas, puzle patrón, llave/candado, timer, físicas
│   │   ├── chess.js                   ← Lógica: Tablero de ajedrez con chess.js
│   │   ├── dialog.js                  ← Sistema reutilizable: DialogManager
│   │   ├── movement.js                ← Sistema reutilizable: Movimiento FPS con Ammo.js
│   │   └── resizeManager.js           ← Sistema reutilizable: Cambio de escala del jugador
│   ├── PuzzleBaldosas/
│   │   ├── MinijuegoBaldosas.html     ← Escena: Puzzle de baldosas tipo "camino seguro"
│   │   ├── MinijuegoBaldosas.js       ← Lógica: Generación procedural, gravedad, jumpscare
│   │   └── Pngs/                      ← Imágenes de las baldosas y personaje
│   ├── DIALOG_README.md               ← Documentación del sistema de diálogos
│   ├── DIALOG_QUICKSTART.md           ← Guía rápida del sistema de diálogos
│   └── DIALOG_COLORS.md              ← Guía de personalización de colores
```

---

## 3. Arquitectura General

El proyecto sigue una arquitectura basada en **componentes de A-Frame** (`AFRAME.registerComponent`). Cada funcionalidad de juego se encapsula como un componente reutilizable que se adjunta a entidades HTML de la escena.

### Patrón de diseño

```
[HTML Escena]  →  define entidades con componentes
       ↓
[Componente A-Frame]  →  lógica encapsulada (init, tick, eventos)
       ↓
[Sistemas globales]  →  DialogManager, ResizeManager, Dexie DB
```

### Flujo de una escena típica

1. El navegador carga el HTML de la escena.
2. A-Frame inicializa la escena 3D (`<a-scene>`).
3. Los scripts JS registran componentes personalizados (`AFRAME.registerComponent`).
4. Los componentes se adjuntan a entidades via atributos HTML (ej: `puzzle_patron-button="id:0"`).
5. El evento `DOMContentLoaded` o `loaded` de la escena dispara la inicialización del juego.
6. Los componentes gestionan su estado internamente y se comunican vía **eventos personalizados** (`emit` / `addEventListener`).

### Comunicación entre componentes

- **Eventos A-Frame**: `this.el.sceneEl.emit('nombre-evento', {datos})` para comunicar entre componentes sin acoplamiento.
- **Variables globales**: `window.animalActivo`, `window.dialogManager`, `window.resizeManager` para estado compartido.
- **Dexie (IndexedDB)**: Persistencia local para inventario y progreso entre recargas.

---

## 4. Escenas del Juego

### 4.0 Hub Central — Sala de Puertas

#### Realizado por: Enrique Sequí Hernández

**Archivo**: `src/index.html`

#### Descripción

Punto de entrada del juego. El jugador aparece en el centro de una sala oscura con niebla y puede moverse libremente con WASD + ratón. La sala contiene **4 puertas** orientadas a los puntos cardinales, cada una conduciendo a una escena diferente. Al cruzar una puerta, se navega automáticamente a la escena correspondiente.

#### Distribución de las puertas

| Dirección | Color | Escena destino | Archivo |
|---|---|---|---|
| Norte | Verde | Bosque de Setas | `bosque_setas.html` |
| Este | Púrpura | Mesa de Té | `MesaTe.html` |
| Sur | Rosa | Partida de Ajedrez | `Ajedrez.html` |
| Oeste | Azul | Puzzle de Baldosas | `PuzzleBaldosas/MinijuegoBaldosas.html` |

#### Elementos de la escena

- **Plano de suelo** (40×40) con físicas Ammo.js estáticas y textura de cuadrícula.
- **Anillo luminoso central** dorado como referencia visual.
- **4 portales**: cada uno con marco de cajas (`<a-box>`), plano translúcido con brillo pulsante (`animation` en `emissiveIntensity`), cartel con nombre de la escena (`<a-text>`), y una **zona de paso invisible** (`door-trigger`) para detección de proximidad.
- **Iluminación**: luz ambiental tenue + luz puntual dorada central + 4 luces puntuales de color en cada puerta.
- **Pilares decorativos** en las 4 esquinas.
- **Partículas 3D flotantes**: 40 esferas pequeñas con animación de movimiento suave.
- **Niebla exponencial** para efecto de profundidad.

#### Componentes A-Frame registrados

| Componente | Adjunto a | Función |
|---|---|---|
| `player-move` | `#player` | Movimiento FPS con Ammo.js (velocidad 4 m/s) |
| `door-portal` | Cada puerta | Almacena `scene` (URL destino) y `label` (nombre visible) |
| `door-detector` | `#player` | Cada frame calcula la distancia a las 4 puertas. Si < 6m muestra indicador HUD; si < 1.8m navega a la escena |

#### HUD (overlays HTML)

- **Título de bienvenida** (`#hud-title`): "Into the Frame VR" con animación fade-in/fade-out de 6 segundos.
- **Indicador de puerta** (`#hud-door`): aparece al acercarse a < 6m de una puerta, muestra el nombre de la escena.
- **Pantalla de carga** (`#loading-screen`): se activa al cruzar una puerta, muestra el nombre de la escena + spinner antes de navegar (`window.location.href`).

#### Flujo de navegación

```
Jugador se mueve por la sala
       ↓
Se acerca a una puerta (< 6m)
       ↓
HUD muestra: "[ Bosque de Setas ] — Acercate para entrar"
       ↓
Cruza la puerta (< 1.8m)
       ↓
Pantalla de carga (0.8s) → window.location.href = "bosque_setas.html"
```

#### Botón de vuelta al hub

Todas las escenas incluyen un botón fijo **"← Menú"** en la esquina superior izquierda (`#btn-hub`) que navega de vuelta a `index.html`. En la escena de Baldosas la ruta es `../index.html` (por estar en subdirectorio). El estilo es consistente en todas las escenas: fondo semitransparente oscuro, borde dorado, `backdrop-filter: blur`.

---

### 4.1 Bosque de Setas

**Archivo**: `src/bosque_setas.html` + `src/js/bosque_setas.js` + `src/css/bosque_setas.css`

#### Descripción

Escena de exploración en primera persona donde el jugador se mueve por un bosque de setas con físicas reales (Ammo.js). La escena contiene múltiples mecánicas independientes:

#### Mecánicas implementadas

##### A) Sistema de recogida de setas con temporizador

- **10 setas normales** (clase `.mushroom`, `data-mushroom-type="normal"`) repartidas por el mapa.
- **1 seta especial** (clase `.mushroom.special`, `data-mushroom-type="special"`) que resetea el temporizador a 30s. Representada mediante el modelo 3D `assets/models/Mario/gbl/Colmenilla.glb` con animación de rotación continua (`animation__rotate`).
- **Temporizador descendente** de 30 segundos mostrado como overlay HTML (`createUI()`).
- **Detección por proximidad**: un loop en `requestAnimationFrame` calcula la distancia horizontal (XZ) entre el jugador y cada seta. Si la distancia < 1.5m, se recoge.
- Al recogerse, la seta se anima (encogimiento + rotación) y se elimina del DOM.

**Estado del juego** (objeto `gameState`):
```javascript
{
    timeRemaining: 30,          // Segundos restantes
    isActive: false,            // Si el juego está activo
    mushroomsCollected: 0,      // Setas normales recogidas
    collectedSet: new Set(),    // Evita duplicados
    timerInterval: null         // Referencia al setInterval
}
```

##### B) Puzle de patrón de colores

- Cuatro botones de colores (rojo, azul, verde, amarillo) gestionados por `puzzle_patron-button`.
- Un gestor (`puzzle_patron-manager`) define la secuencia correcta `[0, 1, 2, 3]`.
- Al acertar la secuencia completa, la puerta (`#door`) se abre con una animación hacia arriba.
- Si se falla, se resetea el progreso.

**Componentes involucrados**:
| Componente | Función |
|---|---|
| `puzzle_patron-manager` | Controla la secuencia esperada y valida cada pulsación |
| `puzzle_patron-button` | Emite evento `puzzle-patron-press` con su `id` al hacer clic |

##### C) Sistema llave-candado con persistencia

- Una **llave dorada** (`llave="id: llave_roja"`) que se guarda en Dexie al recogerla.
- Un **candado** (`candado="llave: llave_roja"`) en una segunda puerta que comprueba el inventario.
- Al usar la llave, la puerta baja y el candado desaparece.
- El estado se persiste: si recargas la página, la puerta sigue abierta (usando la tabla `hitos` de Dexie).

**Tablas Dexie**:
```javascript
db.version(1).stores({
    inventario: "id, tipo",   // Objetos recogidos (llave_roja, etc.)
    hitos: "id"               // Progreso (puerta_roja_abierta, etc.)
});
```

##### D) Jugador con físicas Ammo.js

- Cilindro dinámico (`ammo-body="type: dynamic"`) con masa 5.
- Movimiento WASD relativo a la dirección de la cámara.
- Gravedad 9.8 m/s², amortiguación lineal 0.9, rotación bloqueada (angularFactor: 0 0 0).
- La cámra está anidada dentro del cilindro del jugador.

##### E) Colisión de mapa

- Componente `colision-ammo`: espera a que el modelo GLTF cargue y aplica `ammo-body: static` + `ammo-shape: mesh`.

---

### 4.2 Mesa de Té

**Archivo**: `src/MesaTe.html` (versión con modelos) + `src/MesaTe_Test.html` (versión simplificada de test)

#### Descripción

Escena de puzle ambientada en la Mesa de Té del Sombrerero Loco. El jugador debe colocar seis animales en sus asientos correctos dentro de un laberinto.

#### Mecánica principal: Puzle de animales en asientos

**Flujo del puzle**:
1. Seis animales están dispersos por el laberinto (representados como `<a-box>` con colores).
2. Al hacer clic en un animal en estado `idle`, se teletransporta a un **slot central** predefinido.
3. Al hacer clic de nuevo en el animal (estado `at-center`), se abre un **diálogo** preguntando si quieres cogerlo.
4. Si confirmas, el animal pasa a estado `holdable` y sigue la cámara del jugador (se "pega" a la vista).
5. Al hacer clic en un **asiento** (`<a-entity asiento>`), el animal se deposita en la posición del `seat-point`.
6. Cuando todos los animales están colocados, se valida si cada animal está en su asiento correcto (`asiento.data.tipo === tipoAnimal`).
7. Si hay algún error, **todos los animales se resetean** al centro.

**Componentes involucrados**:

| Componente | Schema | Función |
|---|---|---|
| `animal-interactive` | `tipo: string, slotIndex: int` | Gestiona los 3 estados del animal (idle → at-center → holdable) |
| `asiento` | `tipo: string` | Recibe animales y verifica la asignación correcta |

**Estados del animal**:
```
idle  →  (clic)  →  at-center  →  (clic + diálogo)  →  holdable  →  (clic en asiento)  →  placed
                                                                              ↓
                                                              (si incorrecto) → resetToCenter()
```

**Animales y sus asientos** (configuración actual):
| Animal | Asiento esperado |
|---|---|
| Conejo | Conejo |
| Buho | Buho |
| Gato | Gato |
| Perro | Perro |
| Cerdo | Cerdo |
| Gallina | Gallina |

**Variable global**: `window.animalActivo` — referencia al animal que el jugador lleva en la mano (`null` si lleva las manos vacías).

**Slots centrales** (posiciones donde se agrupan los animales antes de cogerlos):
```javascript
const centroSlots = [
    new THREE.Vector3(-4, 0.5, -3),
    new THREE.Vector3(-2, 0.5, -3),
    new THREE.Vector3(0, 0.5, -3),
    new THREE.Vector3(2, 0.5, -3),
    new THREE.Vector3(4, 0.5, -3),
    new THREE.Vector3(6, 0.5, -3),
];
```

**Modelos 3D utilizados** (versión `MesaTe.html`):
- `Gabi/laberinto.glb` — Estructura del laberinto
- `Gabi/Mesa.glb` — Mesa
- `Gabi/Silla.glb` — Sillas (instanciadas múltiples veces con diferente posición/rotación)
- `Gabi/Pipa.glb`, `Gabi/Tarta.glb`, `Gabi/Vela.glb` — Elementos decorativos

---

### 4.3 Ajedrez

**Archivo**: `src/Ajedrez.html` + `src/js/chess.js`

#### Descripción

Minijuego de ajedrez en 3D donde el jugador debe resolver un puzle de jaque mate. El tablero es un modelo GLTF; las piezas se renderizan dinámicamente desde el motor `chess.js`.

#### Mecánica

- Se configura un tablero personalizado (no la posición inicial estándar) usando `game.clear()` y `game.put()`.
- El jugador selecciona piezas haciendo clic y las mueve a casillas destino.
- `chess.js` valida todos los movimientos legalmente.
- Si se logra jaque (`game.in_check()`), se muestra alerta de victoria.
- Si el movimiento no resulta en jaque, el tablero se resetea al estado inicial del puzle.

**Posición inicial del puzle**:
```
Negras: Rey en g1, Torre en f1, Peones en g2, f2, h3
Blancas: Dama en g7, Torre en g8, Rey en d7
```
El jugador juega con blancas y debe dar jaque mate.

**Mapeo de modelos** (`MODEL_MAP`):
```javascript
const MODEL_MAP = {
    p: { w: '#pawn-w',   b: '#pawn-b'   },
    r: { w: '#rook-w',   b: '#rook-b'   },
    n: { w: '#knight-w', b: '#knight-b' },
    b: { w: '#bishop-w', b: '#bishop-b' },
    q: { w: '#queen-w',  b: '#queen-b'  },
    k: { w: '#king-w',   b: '#king-b'   }
};
```

**Modelos GLTF** (en `assets/models/Lajara/GLB/`):
- `PeonBlanco.glb` / `PeonNegro.glb`
- `TorreBlanco.glb` / `TorreNegro.glb`
- `CaballoBlanco.glb` / `CaballoNegro.glb`
- `AlfilBlanco.glb` / `AlfilNegro.glb`
- `ReinaBlanco.glb` / `ReinaNegro.glb`
- `ReyBlanco.glb` / `ReyNegro.glb`
- `Tablero.glb`

**Flujo de selección de pieza**:
1. Clic en pieza → si es tu turno, se selecciona (`selectedSquare = pieceSquare`).
2. Clic en otra casilla/pieza → se intenta mover.
3. Si el movimiento es legal, se ejecuta; se re-renderizan las piezas.
4. Se comprueba si hay jaque mate.

**Funciones principales**:
| Función | Descripción |
|---|---|
| `renderPieces()` | Limpia el contenedor `#pieces` y recrea todas las piezas desde `game.board()` |
| `toChessSquare(x, z)` | Convierte coordenadas (x, z) → notación algebraica ("a1", "h8", etc.) |
| `checkGameState()` | Verifica jaque; si no hay jaque, resetea el puzle |
| `EliminarPiezas()` | Limpia todas las piezas del DOM |

---

### 4.4 Puzzle de Baldosas

**Archivo**: `src/PuzzleBaldosas/MinijuegoBaldosas.html` + `src/PuzzleBaldosas/MinijuegoBaldosas.js`

#### Descripción

Minijuego de plataformas donde el jugador camina sobre una cuadrícula de baldosas (18 filas × 6 columnas). Solo un camino es seguro; pisar una baldosa insegura hace que caiga junto con el jugador.

#### Mecánicas

##### A) Generación procedural del camino seguro

- Al cargar la página, se genera un camino aleatorio de baldosas seguras usando un algoritmo de recorrido lateral.
- Desde una posición X aleatoria, en cada fila se extiende lateralmente (max ±2 columnas) generando un camino ortogonal (sin diagonales).
- Las baldosas seguras se marcan con `data-safe="true"`.
- La ruta se muestra en un panel "chuleta" (`#hud-cheat`) a la derecha de la pantalla.

##### B) Sistema de gravedad personalizado

- Componente `gravedad-camara`: simula gravedad (9.8 m/s²) en la cámara usando un `THREE.Raycaster` manual apuntando hacia abajo.
- Si el rayo toca suelo firme, la velocidad se resetea a 0.
- Si la baldosa pisada está cayendo (`data-falling="true"`), el jugador cae con ella.
- Al caer debajo de Y=10, se activa un **jumpscare** (imagen de un personaje enfadado que se agranda).
- Al caer debajo de Y=-5, se produce un **respawn** en la posición inicial.

##### C) Sistema de baldosas interactivas

- Componente `baldosa-interactiva`: al ser activada (pisada), si `data-safe="false"`, la baldosa entra en caída libre.
- Componente `seguridad-plataforma`: barreras invisibles para que el jugador no salga de la plataforma de inicio.

##### D) HUD narrativo

- Panel izquierdo: muestra coordenadas de la baldosa pisada.
- Panel central: personaje animado (imagen con animación CSS `hablar`) con bocadillo de texto.
- Por cada fila hay una **frase/acertijo** distinta que se muestra al avanzar:
  ```
  Fila 0: "El camino comienza con un solo paso..."
  Fila 5: "La mitad del camino, no te rindas."
  Fila 12: "No mires abajo..."
  Fila 17: "¡La meta está frente a ti!"
  ```

**Imágenes de baldosas** (en `Pngs/ImagesBaldosas/`):
- `Corazon.png`, `Piqueta.png`, `Rombo.png`, `Trebol.png` — se asignan aleatoriamente a cada baldosa.

---

## 5. Sistemas Reutilizables

### 5.1 Sistema de Diálogos

**Archivos**: `src/js/dialog.js` + `src/css/dialog.css`
**Documentación detallada**: `DIALOG_README.md`, `DIALOG_QUICKSTART.md`, `DIALOG_COLORS.md`

#### Clase `DialogManager`

Se instancia automáticamente como `window.dialogManager`. Gestiona diálogos HTML que se superponen sobre la escena 3D.

**Dos estilos disponibles**:

| Estilo | Activación | Ubicación |
|---|---|---|
| Normal (centrado) | Por defecto | Centro de la pantalla |
| Videojuego (RPG) | `gameStyle: true` | Parte inferior de la pantalla |

**API principal**:

```javascript
// Diálogo completo
window.dialogManager.show({
    title: "Título",
    content: "Contenido HTML",
    buttons: [
        { text: "Aceptar", callback: () => {}, secondary: false, closeOnClick: true }
    ],
    showCloseButton: true,
    onClose: () => {},
    gameStyle: false,
    darkBackground: true,
    characterName: null,
    // Personalización de colores
    backgroundColor: null,
    textColor: null,
    primaryColor: null,      // Color de acento (borde, nombre, botones)
    secondaryColor: null      // Color complementario (gradientes)
});

// Atajos
window.dialogManager.confirm("¿Seguro?", onConfirm, onCancel);
window.dialogManager.alert("Mensaje", onClose);
```

**Componente A-Frame** `dialog-trigger`:
```html
<a-box dialog-trigger="title: ¡Hola!; content: Texto; buttonText: OK"></a-box>
```

**Paletas de colores sugeridas** (modo estético con `primaryColor` / `secondaryColor`):

| Tema | Primary | Secondary | Text |
|---|---|---|---|
| Fuego | `#ff4444` | `#cc0000` | `white` |
| Hielo | `#00ffff` | `#0099cc` | `#e0ffff` |
| Naturaleza | `#00cc66` | `#006633` | `white` |
| Oro | `#ffd700` | `#ff8c00` | `#333333` |
| Tecnología | `#00ff9d` | `#00ccff` | `#ccffef` |

---

### 5.2 ResizeManager

**Archivo**: `src/js/resizeManager.js`

Clase que permite cambiar la escala del jugador (rig) con animación suave. Se instancia como `window.resizeManager`.

**Requisito**: el rig del jugador debe tener el id `player-rig`:
```html
<a-entity id="player-rig" position="0 0 0">
    <a-entity camera look-controls wasd-controls position="0 1.6 0"></a-entity>
</a-entity>
```

**Tamaños predefinidos**:
| Nombre | Escala | Descripción |
|---|---|---|
| `small` | 0.2 | Tamaño ratón (20%) |
| `normal` | 1 | Tamaño humano (100%) |
| `giant` | 3 | Tamaño gigante (300%) |

**API**:
```javascript
// Cambiar tamaño con animación (duración en ms)
window.resizeManager.setPlayerSize('small', 1000);
window.resizeManager.setPlayerSize('normal');
window.resizeManager.setPlayerSize('giant', 2000);

// Añadir tamaños personalizados
window.resizeManager.setSizes({
    tiny: 0.05,
    titan: 10
});
```

**Lógica interna**: al cambiar de tamaño, la clase reposiciona el rig a la posición mundial de la cámara para evitar desplazamientos bruscos, y luego aplica una animación de escala suave usando `easeInOutQuad`.

---

### 5.3 Movimiento del Jugador

**Archivo**: `src/js/movement.js`

Componente A-Frame `player-move` que implementa movimiento en primera persona usando el motor de físicas Ammo.js.

**Controles**:
| Tecla | Acción |
|---|---|
| W | Avanzar (dirección de la cámara) |
| S | Retroceder |
| A | Izquierda (strafe) |
| D | Derecha (strafe) |

**Funcionamiento técnico**:
1. Obtiene la dirección de la cámara (`cam.object3D.getWorldDirection`).
2. Elimina el componente Y (movimiento solo horizontal).
3. Calcula el vector perpendicular (derecha) con `crossVectors`.
4. Aplica velocidad directamente al cuerpo de físicas Ammo vía `body.setLinearVelocity`.
5. Elimina el flag cinemático y reactiva el cuerpo cada frame para evitar "dormido".

**Velocidad**: 3 m/s (en `movement.js`) o 4 m/s (en `bosque_setas.js`, que tiene su propia copia del componente).

**Uso en HTML**:
```html
<a-cylinder id="player" radius="0.3" height="1.6"
            ammo-body="type: dynamic; mass: 5; linearDamping: 0.9; angularFactor: 0 0 0"
            ammo-shape="type: cylinder"
            player-move>
    <a-camera id="cam" position="0 0.6 0" wasd-controls="enabled: false"></a-camera>
</a-cylinder>
```

> **Importante**: Desactivar `wasd-controls` en la cámara para que no compita con el movimiento por físicas.

---

## 6. Guías para Desarrolladores

### 6.1 Cómo añadir una nueva escena

1. **Crear el HTML** en `src/`:
   ```html
   <!DOCTYPE html>
   <html lang="es">
   <head>
       <meta charset="utf-8">
       <title>Mi Nueva Escena</title>
       <!-- Dependencias base -->
       <script src="https://aframe.io/releases/1.7.0/aframe.min.js"></script>
       <!-- Físicas (solo si las necesitas) -->
       <script src="https://cdn.jsdelivr.net/gh/MozillaReality/ammo.js@8bbc0ea/builds/ammo.wasm.js"></script>
       <script src="https://cdn.jsdelivr.net/gh/c-frame/aframe-physics-system@v4.2.2/dist/aframe-physics-system.min.js"></script>
       <!-- Sistemas reutilizables (según necesites) -->
       <script src="js/dialog.js"></script>
       <link rel="stylesheet" href="css/dialog.css">
       <script src="js/resizeManager.js"></script>
       <!-- Tu script -->
       <script src="js/mi_escena.js"></script>
   </head>
   <body>
       <a-scene cursor="rayOrigin: mouse" physics="driver: ammo; gravity: 0 -9.8 0">
           <!-- Jugador -->
           <a-entity>
               <a-cylinder id="player" radius="0.3" height="1.6"
                           ammo-body="type: dynamic; mass: 5; linearDamping: 0.9; angularFactor: 0 0 0"
                           ammo-shape="type: cylinder"
                           player-move>
                   <a-camera id="cam" position="0 0.6 0" wasd-controls="enabled: false"></a-camera>
               </a-cylinder>
           </a-entity>
           <!-- Luces -->
           <a-light type="ambient" intensity="0.6"></a-light>
           <a-light type="directional" position="1 3 2"></a-light>
           <!-- Tu contenido aquí -->
       </a-scene>
   </body>
   </html>
   ```

2. **Crear el JS** en `src/js/mi_escena.js` registrando tus componentes:
   ```javascript
   AFRAME.registerComponent('mi-componente', {
       schema: { /* propiedades */ },
       init() { /* inicialización */ },
       tick(time, delta) { /* loop por frame */ },
       remove() { /* limpieza */ }
   });
   ```

3. **Añadir modelos 3D** en `assets/models/TuNombre/` con los archivos `.glb` exportados desde Blender.

---

### 6.2 Cómo añadir un nuevo power-up / coleccionable

#### Ejemplo: Seta que da velocidad extra

**Paso 1** — Definir el tipo en el HTML:
```html
<a-box class="mushroom"
       data-mushroom-type="speed"
       position="5 0.75 -10"
       width="0.8" height="0.8" depth="0.8"
       color="#00BFFF"
       animation__pulse="property: scale; to: 1.3 1.3 1.3; dur: 800; dir: alternate; loop: true">
</a-box>
```

**Paso 2** — Manejar el nuevo tipo en `collectMushroom()` dentro de `bosque_setas.js`:
```javascript
function collectMushroom(mushroomEl) {
    if (gameState.collectedSet.has(mushroomEl)) return;

    const mushroomType = mushroomEl.getAttribute('data-mushroom-type');
    gameState.collectedSet.add(mushroomEl);

    switch (mushroomType) {
        case 'normal':
            gameState.mushroomsCollected++;
            break;
        case 'special':
            gameState.timeRemaining = 30;
            if (uiElements.timer) {
                uiElements.timer.textContent = 'Tiempo: 30s';
                uiElements.timer.style.color = '#333';
            }
            break;

        // ---- NUEVO POWER-UP ----
        case 'speed':
            console.log('[POWER-UP] ¡Velocidad aumentada!');
            // Aumentar velocidad temporalmente
            const playerEl = document.querySelector('#player');
            const originalSpeed = 4;
            const boostedSpeed = 8;

            // Temporalmente parchear el componente player-move
            playerEl.components['player-move'].speed = boostedSpeed;

            // Restaurar después de 5 segundos
            setTimeout(() => {
                playerEl.components['player-move'].speed = originalSpeed;
                console.log('[POWER-UP] Velocidad restaurada');
            }, 5000);
            break;
    }

    animateAndRemoveMushroom(mushroomEl);
}
```

**Paso 3** (opcional) — Si quieres que `player-move` use una variable de velocidad dinámica, modifica el componente:
```javascript
AFRAME.registerComponent('player-move', {
    init() {
        this.keys = {};
        this.speed = 4; // Ahora es propiedad de instancia
        window.addEventListener('keydown', e => this.keys[e.code] = true);
        window.addEventListener('keyup', e => this.keys[e.code] = false);
    },
    tick() {
        // ... usar this.speed en vez de la constante
    }
});
```

#### Tipos de power-ups posibles

| Tipo | `data-mushroom-type` | Efecto sugerido |
|---|---|---|
| Velocidad | `speed` | Duplica velocidad 5s |
| Inmunidad | `shield` | Ignora errores en puzles 10s |
| Tiempo extra | `time-bonus` | Añade +15s al timer |
| Tamaño | `shrink` / `grow` | Usa `window.resizeManager.setPlayerSize()` |
| Teletransporte | `teleport` | Cambia posición del jugador |

---

### 6.3 Cómo añadir un nuevo puzle tipo patrón

1. **Definir la secuencia** en el manager: modifica el array `this.order` en `puzzle_patron-manager`:
   ```javascript
   // Secuencia más larga y difícil
   this.order = [2, 0, 3, 1, 2, 3, 0, 1];
   ```

2. **Añadir más botones** en el HTML:
   ```html
   <a-box color="purple" position="2.5 1 1" width="0.4" height="0.4" depth="0.2"
          puzzle_patron-button="id:4"></a-box>
   ```

3. **Añadir feedback visual**: modifica el componente del botón para que cambie de color al pulsarlo:
   ```javascript
   AFRAME.registerComponent('puzzle_patron-button', {
       schema: { id: { type: 'int' } },
       init() {
           this.originalColor = this.el.getAttribute('color');
           this.el.addEventListener('click', () => {
               // Flash blanco al pulsar
               this.el.setAttribute('color', 'white');
               setTimeout(() => {
                   this.el.setAttribute('color', this.originalColor);
               }, 200);
               this.el.sceneEl.emit('puzzle-patron-press', { id: this.data.id });
           });
       }
   });
   ```

---

### 6.4 Cómo añadir un nuevo animal al minijuego de la Mesa de Té

1. **Añadir el animal** en el HTML:
   ```html
   <a-box color="orange"
          position="-8 0.5 0"
          animal-interactive="tipo: Zorro; slotIndex: 6"></a-box>
   ```

2. **Añadir un slot central** extra en el array `centroSlots`:
   ```javascript
   const centroSlots = [
       // ... slots existentes ...
       new THREE.Vector3(8, 0.5, -3),   // Slot #6 para el Zorro
   ];
   ```

3. **Añadir el asiento correspondiente**:
   ```html
   <a-entity gltf-model="url(../assets/models/Gabi/Silla.glb)"
             position="0 0 12"
             class="asiento"
             asiento="tipo: Zorro">
       <a-entity class="seat-point" position="7.2 3 2.2"></a-entity>
   </a-entity>
   ```

> **Regla**: El `tipo` del `animal-interactive` debe coincidir exactamente con el `tipo` del `asiento` para que la validación sea correcta.

---

### 6.5 Cómo añadir una nueva pieza o nivel de Ajedrez

#### Cambiar la posición del puzle

Modifica la configuración en `chess.js`:
```javascript
game.clear();

// Tu nueva posición
game.put({ type: 'k', color: 'b' }, 'e8');   // Rey negro
game.put({ type: 'q', color: 'w' }, 'd1');   // Dama blanca
// ... añade las piezas que quieras

game.load(game.fen());  // Importante: recargar el FEN
```

#### Tipos de pieza (`type`)
| Código | Pieza |
|---|---|
| `k` | Rey (King) |
| `q` | Dama (Queen) |
| `r` | Torre (Rook) |
| `b` | Alfil (Bishop) |
| `n` | Caballo (Knight) |
| `p` | Peón (Pawn) |

#### Colores (`color`)
- `w` — Blancas
- `b` — Negras

#### Añadir un nuevo modelo de pieza

1. Exporta el modelo como `.glb` y colócalo en `assets/models/Lajara/GLB/`.
2. Regístralo en `<a-assets>`:
   ```html
   <a-asset-item id="mi-pieza-w" src="../assets/models/Lajara/GLB/MiPiezaBlanco.glb"></a-asset-item>
   ```
3. Añádelo al `MODEL_MAP` en `chess.js`:
   ```javascript
   const MODEL_MAP = {
       // ... existentes ...
       x: { w: '#mi-pieza-w', b: '#mi-pieza-b' }  // 'x' = tu tipo custom
   };
   ```

---

### 6.6 Cómo añadir un nuevo tamaño al ResizeManager

```javascript
// En tu script, después de que cargue la página:
window.onload = () => {
    window.resizeManager.setSizes({
        tiny: 0.05,       // Tamaño insecto
        titan: 10,        // 10x humano
        alicia: 0.5       // Mitad de tamaño (como en la historia)
    });
};

// Usarlo:
window.resizeManager.setPlayerSize('alicia', 1500); // 1.5 segundos de animación
```

También puedes cambiar el selector del rig si tu entidad no se llama `#player-rig`:
```javascript
window.resizeManager = new ResizeManager('#mi-rig-personalizado');
```

---

### 6.7 Cómo personalizar diálogos con colores temáticos

```javascript
// Diálogo con temática de fuego
window.dialogManager.show({
    gameStyle: true,
    characterName: "Reina de Corazones",
    title: "¡Que le corten la cabeza!",
    content: "Has entrado en mi territorio...",
    primaryColor: "#ff4444",
    secondaryColor: "#cc0000",
    textColor: "white",
    buttons: [
        { text: "Huir" },
        { text: "Quedarse", secondary: true }
    ]
});
```

**Cómo afectan los colores**:
- `primaryColor` → borde superior, nombre del personaje, botones primarios, borde de botones secundarios.
- `secondaryColor` → gradiente de botones, matiz en el fondo.
- `backgroundColor` → sobrescribe completamente el fondo del diálogo.
- `textColor` → color base del texto y botones.

---

### 6.8 Cómo añadir persistencia con Dexie (IndexedDB)

El proyecto usa Dexie para guardar progreso entre sesiones. Se incluye vía CDN:
```html
<script src="https://unpkg.com/dexie@3/dist/dexie.js"></script>
```

#### Crear una nueva tabla

```javascript
const db = new Dexie("JuegoDB");
db.version(2).stores({           // Incrementar versión al añadir tablas
    inventario: "id, tipo",
    hitos: "id",
    puntuaciones: "id, escena"   // Nueva tabla
});
```

#### Guardar un dato

```javascript
await db.puntuaciones.put({ id: "bosque_nivel1", escena: "bosque", puntos: 150 });
```

#### Leer un dato

```javascript
const record = await db.puntuaciones.get("bosque_nivel1");
if (record) {
    console.log("Puntos:", record.puntos);
}
```

#### Borrar un dato

```javascript
await db.inventario.delete("llave_roja");
```

#### Patrón típico de restauración al cargar escena

```javascript
async function initGame() {
    try {
        if (await db.hitos.get("puerta_roja_abierta")) {
            // Restaurar estado visual (eliminar puerta del DOM, etc.)
        }
    } catch (err) {
        console.warn('Error restaurando estado:', err);
    }
}
```

---

## 7. Ficheros de Test y Demo

| Archivo | Propósito |
|---|---|
| `MesaTe_Test.html` | Versión simplificada de la Mesa de Té con geometrías primitivas en lugar de modelos GLTF. Útil para depurar la lógica sin esperar cargas de modelos. |
| `Resize_Test.html` | Test básico del ResizeManager con botones para alternar entre pequeño, normal y gigante. |
| `ResizeManager_Demo.html` | Demo completa con entorno de referencia (mesa, puerta, objetos) para apreciar el cambio de escala. Incluye ejemplo de tamaño personalizado `titan`. |
| `ejemplo_dialog.html` | Demo del sistema de diálogos en estilo normal: simple, confirmación, alerta, personalizado. Incluye componente `dialog-trigger` en entidades 3D. |
| `ejemplo_dialog_game.html` | Demo extensiva del sistema de diálogos en estilo videojuego: con personajes, NPCs interactivos, paletas de colores personalizadas. |

---

## 8. Assets y Modelos 3D

### Organización por escena

| Carpeta | Escena | Contenido |
|---|---|---|
| `assets/models/Mario/gbl/` | Bosque de Setas | `Claro_de_Setas.glb` |
| `assets/models/Gabi/` | Mesa de Té | Laberinto, mesa, sillas, tarta, pipa, vela |
| `assets/models/Lajara/GLB/` | Ajedrez | Piezas (peón, torre, caballo, alfil, reina, rey) + tablero |
| `assets/models/Lajara/Empress/` | (Reservado) | — |
| `assets/2d/` | General | Sprites e iconos 2D |
| `src/PuzzleBaldosas/Pngs/` | Baldosas | Imágenes de las baldosas + personaje HUD |

### Formatos utilizados

- **GLTF/GLB**: Formato principal para modelos 3D (cargados con `gltf-model`).
- **Blender (.blend / .blend1)**: Archivos fuente en `assets/models/*/Mapa/` y raíz de cada carpeta de artista.
- **PNG**: Texturas, imágenes de HUD, iconos de baldosas.

### Cómo exportar modelos desde Blender

1. Abrir el archivo `.blend` correspondiente.
2. `File > Export > glTF 2.0 (.glb/.gltf)`.
3. Configuración recomendada:
   - Format: `glTF Binary (.glb)`
   - Include: Selected Objects (si solo necesitas una parte)
   - Transform: +Y Up
   - Mesh > Apply Modifiers: activado
4. Guardar en la carpeta `GLB/` o `gbl/` correspondiente.
5. Referenciar en HTML:
   ```html
   <!-- Via a-assets (precarga) -->
   <a-asset-item id="mi-modelo" src="../assets/models/Carpeta/MiModelo.glb"></a-asset-item>
   <a-entity gltf-model="#mi-modelo"></a-entity>

   <!-- Via URL directa -->
   <a-entity gltf-model="url(../assets/models/Carpeta/MiModelo.glb)"></a-entity>
   ```

---

## 9. Convenciones de Código

### Componentes A-Frame

- Nombrar con **kebab-case** y prefijo semántico: `puzzle_patron-manager`, `animal-interactive`, `player-move`, `colision-ammo`.
- Usar `schema` para propiedades configurables desde HTML.
- Usar `init()` para setup inicial, `tick()` para lógica por frame, `remove()` para limpieza.
- Comunicar entre componentes usando **eventos personalizados** sobre `this.el.sceneEl`.

### JavaScript

- Variables de estado global en objetos (`gameState`, `uiElements`).
- Funciones asíncronas (`async/await`) para operaciones con Dexie.
- `console.log` con prefijos para depuración: `[GAME]`, `[TIMER]`, `[COLLECT]`, `[LLAVE]`, `[AMMO]`.

### HTML / A-Frame

- Cada entidad interactiva usa `data-*` attributes para pasar datos (ej: `data-mushroom-type`, `data-coords`, `data-safe`).
- Raycasting configurado con `cursor="rayOrigin: mouse"` en `<a-scene>`.
- Entidades clickeables marcadas con `data-raycastable` cuando se usa raycaster selectivo.

---

## 10. Problemas Conocidos y TODOs

| Issue | Escena | Descripción |
|---|---|---|
| Velocidad inconsistente | Bosque / MesaTe | `player-move` define `speed = 3` en `movement.js` y `speed = 4` en `bosque_setas.js`. Unificar en una única fuente. |
| IDs duplicados | MesaTe | Múltiples sillas usan `id="silla"`. Los IDs deben ser únicos en el DOM. |
| Componente duplicado `player-move` | Bosque | `bosque_setas.js` redefine `player-move` que ya existe en `movement.js`. Puede causar conflictos si ambos scripts se cargan. |
| Validación de asientos | MesaTe | TODO marcado en código: comprobar que solo un animal puede sentarse en cada asiento. |
| `checkGameState` en Ajedrez | Ajedrez | Usa `game.in_check()` (jaque) en lugar de `game.in_checkmate()` (jaque mate). El mensaje dice "JAQUE MATE" pero la condición es solo "jaque". |
| Carácter corrupto | movement.js | Contiene un carácter no-UTF8 en un comentario (`kinem�tico`). |
| A-Frame inconsistente | Ajedrez vs Bosque | Ajedrez usa A-Frame 1.5.0; el resto usa 1.7.0. Puede haber incompatibilidades. |
| Variable `a` suelta | MesaTe_Test | Hay una `a;` suelta (línea ~273 de MesaTe_Test.html) que provocará un `ReferenceError`. |
| ~~Sin sistema de navegación entre escenas~~ | ~~General~~ | ~~Resuelto: `index.html` actúa como hub central con 4 puertas que navegan a cada escena.~~ |

---

*Documento generado para el equipo de desarrollo de Into-the-Frame-VR.*
