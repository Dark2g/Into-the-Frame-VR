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
   - 4.3 [Castillo (`Castillo.html`)](#43-castillo)
5. [Sistemas Reutilizables](#5-sistemas-reutilizables)
   - 5.1 [Sistema de Diálogos (`dialog.js` + `dialog.css`)](#51-sistema-de-diálogos)
   - 5.2 [ResizeManager (`resizeManager.js`)](#52-resizemanager)
   - 5.3 [Movimiento del Jugador (`movement.js`)](#53-movimiento-del-jugador)
   - 5.4 [Colisión de Modelos GLTF (`Castillos.js`)](#54-colisión-de-modelos-gltf)
   - 5.5 [Sistema de Puertas/Portales (`door_funtions.js`)](#55-sistema-de-puertasportales)
   - 5.6 [Audio: Inicio por Clic (`startAudioOnClick.js`)](#56-audio-inicio-por-clic)
   - 5.7 [Audio: Reproducción por Proximidad (`playOnApproach.js`)](#57-audio-reproducción-por-proximidad)
   - 5.8 [Audio: Bucle con Retraso (`soundLoopDelay.js`)](#58-audio-bucle-con-retraso)
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
| **A-Frame** | 1.7.0 (escenas principales) / 1.5.0 (ajedrez standalone) | Framework WebVR/WebXR |
| **Ammo.js** (WASM) | `8bbc0ea` | Motor de físicas (driver Ammo para `aframe-physics-system`) |
| **aframe-physics-system** | v4.2.1 (MesaTe) / v4.2.2 (resto) | Componentes de física para A-Frame (`ammo-body`, `ammo-shape`, `static-body`) |
| **aframe-environment-component** | 1.5.x | Entornos procedurales (preset `moon` en Castillo.html) |
| **aframe-extras** | 6.1.1 | Componentes adicionales (`animation-mixer` para modelo Reina en Castillo.html) |
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
│   │   ├── Individual symbols/        ← Símbolos individuales para baldosas (Clock, Card, Cups…)
│   │   ├── Empress-tiles.png / .ai    ← Tileset de la Reina (fuente + rasterizado)
│   │   ├── reinaminiatura.png         ← Retrato HUD de la Reina (normal)
│   │   ├── reinaenfadada.png          ← Retrato HUD de la Reina (enfadada / jumpscare)
│   │   └── way-1.png, way-2.png, way-3.png ← Mapas de referencia de las 3 rutas
│   ├── Addons Anarquistas/            ← Addons de Blender (Node Preview v1.21)
│   ├── models/                        ← Modelos 3D (.glb, .blend)
│   │   ├── Gabi/                      ← Modelos de la Mesa de Té (laberinto, mesa, sillas, tarta, pipa, vela)
│   │   │   ├── Mapa/                  ← Blender sources + materiales PBR
│   │   │   └── Personajes/            ← Modelos GLTF de animales (Conejo, Buho, Perro, Gato, Cerdo, Pollo)
│   │   ├── Lajara/                    ← Modelos del Ajedrez y Castillo (piezas, tablero, castillo, puerta, reina, llave)
│   │   │   ├── GLB/                   ← Modelos exportados (.glb) listos para uso
│   │   │   ├── Ajedrez.blend          ← Fuente Blender del tablero/piezas
│   │   │   ├── CastilloAlicia4-2.blend ← Fuente Blender del castillo
│   │   │   ├── Cartas.blend           ← Fuente Blender de las cartas
│   │   │   └── PixelCardsByAndrox_free/  ← Assets de cartas pixel art
│   │   └── Mario/                     ← Modelos del Bosque de Setas
│   │       ├── gbl/                   ← GLB exportados (Claro_de_Setas, Colmenilla, Candado, Llave, Puertas, Setas patrón)
│   │       └── .BLENDS/               ← Fuentes Blender (Amanita, Cardo, Colmenilla, Parasol…)
│   │           └── Fbx/               ← Exportaciones FBX alternativas
│   ├── scenes/                        ← (Reservado para futuras escenas)
│   └── sounds/                        ← Efectos de audio (Chicken, cat, dog, owl, pig, RabbitEat, Llave…)
├── src/
│   ├── index.html                     ← Hub central: sala 3D con 3 puertas + tablón de equipos (punto de entrada)
│   ├── Ajedrez.html                   ← Escena: Minijuego de Ajedrez (standalone)
│   ├── Castillo.html                  ← Escena: Castillo (Baldosas + Ajedrez combinados)
│   ├── bosque_setas.html              ← Escena: Bosque de Setas (escena principal)
│   ├── MesaTe.html                    ← Escena: Mesa de Té (con modelos 3D)
│   ├── MinijuegoBaldosas.html         ← Escena: Puzzle de baldosas tipo "camino seguro" (standalone, integrada en Castillo)
│   ├── Frases por casilla.txt         ← Guión de frases por casilla (referencia de diseño)
│   ├── MesaTe_Test.html               ← Test simplificado de la Mesa de Té
│   ├── Resize_Test.html               ← Test del sistema de cambio de tamaño
│   ├── ResizeManager_Demo.html         ← Demo completa del ResizeManager
│   ├── ejemplo_dialog.html            ← Demo del sistema de diálogos (estilo normal)
│   ├── ejemplo_dialog_game.html       ← Demo del sistema de diálogos (estilo videojuego)
│   ├── css/
│   │   ├── bosque_setas.css           ← Estilos de la escena del bosque
│   │   ├── dialog.css                 ← Estilos del sistema de diálogos (normal + game)
│   │   └── door-funtions.css          ← Estilos del sistema de puertas/portales HUD
│   ├── js/
│   │   ├── bosque_setas.js            ← Lógica: Setas, puzle patrón, llave/candado, timer, físicas
│   │   ├── Castillos.js               ← Componente colision-ammo: aplica físicas estáticas a modelos GLTF
│   │   ├── chess.js                   ← Lógica: Tablero de ajedrez con chess.js
│   │   ├── dialog.js                  ← Sistema reutilizable: DialogManager
│   │   ├── door_funtions.js           ← Componentes: door-portal y door-detector (navegación entre escenas)
│   │   ├── MinijuegoBaldosas.js       ← Lógica: Rutas predefinidas, gravedad, jumpscare, HUD narrativo
│   │   ├── movement.js                ← Sistema reutilizable: Movimiento FPS con Ammo.js
│   │   ├── playOnApproach.js          ← Componente: play-on-approach (audio por proximidad)
│   │   ├── resizeManager.js           ← Sistema reutilizable: Cambio de escala del jugador
│   │   ├── soundLoopDelay.js          ← Componente: sound-loop-delay (bucle de audio con retraso)
│   │   └── startAudioOnClick.js       ← Componente: start-audio-on-click (política de audio del navegador)
│   ├── PuzzleBaldosas/
│   │   └── Frases por casilla.txt     ← Borrador original de frases (archivo de referencia)
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

Punto de entrada del juego. El jugador aparece en el centro de una sala oscura con niebla y puede moverse libremente con WASD + ratón. La sala contiene **3 puertas** orientadas a los puntos cardinales (Norte, Este, Sur), cada una conduciendo a una escena diferente. En el lado Oeste se encuentra un **tablón de equipos** con los nombres de los miembros de cada grupo. Al cruzar una puerta, se navega automáticamente a la escena correspondiente.

#### Distribución de las puertas

| Dirección | Color | Escena destino | Archivo |
|---|---|---|---|
| Norte | Verde | Bosque de Setas | `bosque_setas.html` |
| Este | Púrpura | Mesa de Té | `MesaTe.html` |
| Sur | Rosa | Castillo | `Castillo.html` |

#### Elementos de la escena

- **Plano de suelo** (40×40) con físicas Ammo.js estáticas y textura de cuadrícula.
- **Anillo luminoso central** dorado como referencia visual.
- **3 portales**: cada uno con marco de cajas (`<a-box>`), plano translúcido con brillo pulsante (`animation` en `emissiveIntensity`), cartel con nombre de la escena (`<a-text>`), y una **zona de paso invisible** (`door-trigger`) para detección de proximidad.
- **Tablón de equipos** (`#tablon-equipos`): panel de madera en el lado Oeste con los nombres de los miembros de cada grupo (Bosque de Setas, Mesa de Té, Castillo), con luz puntual dorada propia.
- **Iluminación**: luz ambiental tenue + luz puntual dorada central + 3 luces puntuales de color en cada puerta + luz del tablón.
- **Pilares decorativos** en las 4 esquinas.
- **Partículas 3D flotantes**: 40 esferas pequeñas con animación de movimiento suave.
- **Niebla exponencial** para efecto de profundidad.

#### Componentes A-Frame registrados

| Componente | Adjunto a | Función |
|---|---|---|
| `player-move` | `#player` | Movimiento FPS con Ammo.js (velocidad 5 m/s) |
| `door-portal` | Cada puerta | Almacena `scene` (URL destino) y `label` (nombre visible) |
| `door-detector` | `#player` | Cada frame calcula la distancia a las 3 puertas. Si < 6m muestra indicador HUD; si < 1.8m navega a la escena |

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

Todas las escenas incluyen un botón fijo **"← Menú"** en la esquina superior izquierda (`#btn-hub`) que navega de vuelta a `index.html`. El estilo es consistente en todas las escenas: fondo semitransparente oscuro, borde dorado, `backdrop-filter: blur`.

---

### 4.1 Bosque de Setas

**Archivo**: `src/bosque_setas.html` + `src/js/bosque_setas.js` + `src/css/bosque_setas.css`

#### Descripción

Escena de exploración en primera persona donde el jugador se mueve por un bosque de setas con físicas reales (Ammo.js). La escena contiene múltiples mecánicas independientes:

#### Mecánicas implementadas

##### A) Sistema de recogida de setas con temporizador

- **3 setas especiales** (clase `.mushroom`, `data-mushroom-type="special"`) representadas mediante el modelo 3D `assets/models/Mario/gbl/Colmenilla.glb` con animación de rotación continua.
- Al recoger una seta especial, el temporizador se resetea a 30s.
- **Temporizador descendente** de 30 segundos mostrado como overlay HTML (`createUI()`).
- **Detección por proximidad**: un loop en `requestAnimationFrame` calcula la distancia horizontal (XZ) entre el jugador y cada seta. Si la distancia < 1.5m, se recoge.
- Al recogerse, la seta se anima (encogimiento + rotación) y se elimina del DOM.

**Estado del juego** (objeto `gameState`):
```javascript
{
    timeRemaining: 30,          // Segundos restantes
    isActive: false,            // Si el juego está activo
    collectedSet: new Set(),    // Evita duplicados
    timerInterval: null         // Referencia al setInterval
}
```

##### B) Puzle de patrón de colores

- Cuatro botones de colores (rojo, azul, verde, amarillo) gestionados por `puzzle_patron-button`, representados con modelos GLTF (`Seta_Roja_Patron.glb`, `Seta_Azul_Patron.glb`, `Seta_Amarilla_Patron.glb`, `Seta_Verde_Patron.glb`).
- Un gestor (`puzzle_patron-manager`) define la secuencia correcta `[2, 1, 0, 3]`.
- Al acertar la secuencia completa, la puerta (`#door`) se abre con una **animación de rotación** (cada hoja gira ±90° sobre su pivote, como puertas batientes).
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
- Movimiento WASD relativo a la dirección de la cámara (usa `movement.js`).
- Gravedad 9.8 m/s², amortiguación lineal 0.9, rotación bloqueada (angularFactor: 0 0 0).
- La cámara está anidada dentro del cilindro del jugador.

##### E) Colisión de mapa

- Componente `colision-ammo` (de `Castillos.js`): espera a que el modelo GLTF cargue y aplica `ammo-body: static` + `ammo-shape: mesh`.

##### F) Sistema de niebla

- Funciones `activateFog()` y `removeFog()` que modifican la propiedad `fog` de la escena A-Frame.
- Se activa al entrar en ciertas zonas para crear ambiente.

##### G) Portal de vuelta al lobby

- Usa los componentes `door-portal` y `door-detector` (de `door_funtions.js`).
- Una entidad con `door-portal="scene: index.html; label: Lobby"` permite volver al hub central.
- El jugador lleva el componente `door-detector` que detecta proximidad a las puertas.

**Modelos GLTF utilizados** (en `assets/models/Mario/gbl/`):
- `Claro_de_Setas.glb` — Mapa del bosque
- `Colmenilla.glb` — Modelo de seta recolectable
- `Candado.glb` — Modelo del candado
- `Llave.glb` — Modelo de la llave
- `Puerta_Drch.glb`, `Puerta_Izq.glb` — Hojas de puerta (derecha e izquierda)
- `Seta_Roja_Patron.glb`, `Seta_Azul_Patron.glb`, `Seta_Amarilla_Patron.glb`, `Seta_Verde_Patron.glb` — Botones del puzle de patrón

---

### 4.2 Mesa de Té

**Archivo**: `src/MesaTe.html` (versión con modelos) + `src/MesaTe_Test.html` (versión simplificada de test)

#### Descripción

Escena de puzle ambientada en la Mesa de Té del Sombrerero Loco. El jugador debe colocar seis animales en sus asientos correctos dentro de un laberinto. Incluye sistema de cambio de tamaño (enano/normal) y audio posicional para cada animal.

#### Mecánica principal: Puzle de animales en asientos

**Flujo del puzle**:
1. Seis animales están dispersos por el laberinto (representados como **modelos GLTF** en `assets/models/Gabi/Personajes/`). Cada animal tiene **audio posicional** que suena al acercarse.
2. Al hacer clic en un animal en estado `idle`, se teletransporta a un **slot central** predefinido y su sonido se pausa.
3. Al hacer clic de nuevo en el animal (estado `at-center`), se abre un **diálogo** (vía `DialogManager`) preguntando si quieres cogerlo, mostrando su `texto` (frase del animal).
4. Si confirmas, el animal pasa a estado `holdable` y sigue la cámara del jugador (se "pega" a la vista).
5. Al hacer clic en un **asiento** (`<a-entity asiento>`), el animal se deposita en la posición del `seat-point`.
6. Cuando todos los animales están colocados, se valida si cada animal está en su asiento correcto (`asiento.data.tipo === tipoAnimal`).
7. Si hay algún error, **todos los animales se resetean** al centro.

**Componentes involucrados**:

| Componente | Schema | Función |
|---|---|---|
| `animal-interactive` | `tipo: string, slotIndex: int, texto: string` | Gestiona los 3 estados del animal (idle → at-center → holdable). `texto` contiene la frase que el animal dice al interactuar. |
| `asiento` | `tipo: string` | Recibe animales y verifica la asignación correcta |
| `start-audio-on-click` | `textId: string` | Inicia el audio de la escena en el primer clic (política de navegadores) |

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
    new THREE.Vector3(10, -0.5, -16),
    new THREE.Vector3(8, -0.5, -16),
    new THREE.Vector3(12, -0.5, -16),
    new THREE.Vector3(14, -0.5, -16),
    new THREE.Vector3(16, -0.5, -16),
    new THREE.Vector3(18, -0.5, -16),
];
```

**Modelos 3D utilizados** (versión `MesaTe.html`):
- `Gabi/laberinto.glb` — Estructura del laberinto
- `Gabi/Mesa.glb` — Mesa
- `Gabi/Silla.glb` — Sillas (instanciadas múltiples veces con diferente posición/rotación)
- `Gabi/Pipa.glb`, `Gabi/Tarta.glb`, `Gabi/Vela.glb` — Elementos decorativos
- `Gabi/Personajes/Conejo.glb` — Conejo
- `Gabi/Personajes/Buho.glb` — Búho
- `Gabi/Personajes/Perro.glb` — Perro
- `Gabi/Personajes/Gato.glb` — Gato
- `Gabi/Personajes/Cerdo.glb` — Cerdo
- `Gabi/Personajes/Pollo.glb` — Gallina (Pollo)

**Audio posicional por animal**:
| Animal | Archivo de sonido |
|---|---|
| Conejo | `sounds/RabbitEat.wav` |
| Búho | `sounds/owl.wav` |
| Perro | `sounds/dog2.wav` |
| Gato | `sounds/cat.wav` |
| Cerdo | `sounds/pig.wav` |
| Gallina | `sounds/Chicken.wav` |

**Asientos**: Hay **8 sillas** en total. 6 tienen un `tipo` asignado (uno por animal), y **2 tienen `tipo: null`** (asientos vacíos que actúan como distractores).

**Sistema de cambio de tamaño**: La escena define un `setPlayerState` inline (no usa `ResizeManager`) con dos estados:
| Estado | Escala rig | Altura | Descripción |
|---|---|---|---|
| `enano` | 1 | 0.2 | Tamaño miniatura |
| `normal` | 1 | 10 | Tamaño estándar |

**Versión de físicas**: `aframe-physics-system v4.2.1` (a diferencia de otras escenas que usan v4.2.2).

---

### 4.3 Castillo

**Archivo**: `src/Castillo.html` + `src/js/chess.js` + `src/js/MinijuegoBaldosas.js` + `src/js/Castillos.js` + `src/js/movement.js` + `src/js/resizeManager.js` + `src/js/startAudioOnClick.js`

#### Descripción

Escena combinada que integra múltiples mecánicas dentro de un castillo modelado en 3D. El jugador comienza en una sala interior, resuelve el puzle de ajedrez para obtener una llave, abre la puerta del castillo (revelando a la Reina con `animation-mixer`), y cruza la zona de baldosas. Incluye cambio de tamaño (enano/normal), sistema de respawn, y coordenadas en el HUD.

#### Dependencias adicionales (no usadas en otras escenas)

- `aframe-environment-component@1.5.x` — Genera entorno procedural (preset `moon`)
- `aframe-extras@6.1.1` — Proporciona `animation-mixer` para la animación Idle de la Reina

#### Mecánicas integradas

##### A) Ajedrez

Minijuego de ajedrez en 3D donde el jugador debe resolver un puzle de jaque mate. El tablero es un modelo GLTF; las piezas se renderizan dinámicamente desde el motor `chess.js`.

- Se configura un tablero personalizado (no la posición inicial estándar) usando `game.clear()` y `game.put()`.
- El jugador selecciona piezas haciendo clic y las mueve a casillas destino.
- `chess.js` valida todos los movimientos legalmente.
- Si se logra jaque (`game.in_check()`), se ejecuta `spawnKey()` que genera una llave GLTF en la sala de ajedrez.
- Si el movimiento no resulta en jaque, el tablero se resetea al estado inicial del puzle.

**Posición inicial del puzle**:
```
Negras: Rey en g1, Torre en f1, Peones en g2, f2, h3
Blancas: Dama en g7, Torre en g8, Rey en d7
```

##### B) Sistema de llave y puerta

- Al resolver el ajedrez, `spawnKey()` crea una entidad con el modelo `Llave.glb` y el componente `key-pickup`.
- **`key-pickup`**: Al hacer clic en la llave, reproduce el sonido `Llave.wav`, establece `window.playerHasKey = true`, muestra un icono 🔑 en el HUD, y oculta la llave.
- **`locked-door`**: Al hacer clic en la puerta frontal del castillo con la llave, emite el evento `open-doors` y oculta el colisionador.
- **`door-rotator`**: Busca los nodos `PuertaFrontal` y `PuertaFrontal.001` dentro del modelo GLTF `PuertaAlicia.glb` y los rota ±90° con animación animada por A-Frame.
- Al abrirse la puerta, se muestra la **Reina** (`Reina.glb` con `animation-mixer="clip: Idle"`) y se activa el HUD narrativo de baldosas.

##### C) Baldosas (integración de MinijuegoBaldosas.js)

- Cuadrícula de 18×6 baldosas generada en `#grid-container` posicionado a `0 12 -45`.
- Comparte la misma lógica de rutas predefinidas, frases narrativas, e imágenes de símbolos que la versión standalone.
- Usa el componente `baldosa-sensor` (raycast desde el jugador hacia abajo) en lugar de `gravedad-camara` de la versión standalone.

##### D) Sistema de cambio de tamaño personalizado

Define un `setPlayerState` inline (no usa `ResizeManager`):
| Estado | Escala rig | Altura | Cámara Y | Descripción |
|---|---|---|---|---|
| `enano` | 1 | 0.2 | -0.05 | Miniatura (~20cm), para pasar por agujeros |
| `normal` | 5 | 1.6 | 0.6 | Tamaño estándar del castillo |

Al cambiar de tamaño se recrea `ammo-shape` para actualizar el colisionador.

##### E) Respawn automático

- **`respawn-on-fall`**: Si el jugador cae por debajo de Y=-5, se teletransporta a un punto de respawn. Usa dos puntos distintos según la zona:
  - `mainRespawn: 1 16 20` — respawn en la zona del castillo
  - `tilesRespawn: 1 16 -38` — respawn al inicio de las baldosas
  - La frontera se determina por `tilesZBoundary: -40`

##### F) HUD de coordenadas

- **`coords-tracker`**: Muestra las coordenadas mundiales (X, Y, Z) del jugador en el HUD (esquina superior derecha).

#### Componentes A-Frame registrados en esta escena

| Componente | Adjunto a | Función |
|---|---|---|
| `player-move` | `#player` | Movimiento FPS con Ammo.js (velocidad 5 m/s) |
| `respawn-on-fall` | `#player` | Teletransporta al jugador si cae bajo el umbral Y |
| `coords-tracker` | `#player` | Muestra coordenadas mundiales en overlay HTML |
| `baldosa-sensor` | `#player` | Raycaster hacia abajo para detectar baldosas pisadas |
| `door-rotator` | `#Puerta` | Rota nodos GLTF de las puertas del castillo |
| `key-pickup` | Llave (generada) | Gestiona la recogida de la llave |
| `locked-door` | `#front-door` | Abre la puerta al hacer clic con llave |
| `colision-ammo` | — | Aplica físicas estáticas a modelos GLTF cargados |
| `start-audio-on-click` | `<a-scene>` | Inicia audio en primer clic |

#### Assets GLTF (en `assets/models/Lajara/GLB/`)

- Piezas de ajedrez: `PeonBlanco.glb`, `PeonNegro.glb`, `TorreBlanco.glb`, `TorreNegro.glb`, `CaballoBlanco.glb`, `CaballoNegro.glb`, `AlfilBlanco.glb`, `AlfilNegro.glb`, `ReinaBlanco.glb`, `ReinaNegro.glb`, `ReyBlanco.glb`, `ReyNegro.glb`
- `Tablero.glb` — Tablero de ajedrez
- `CastilloAlicia4-2.glb` — Modelo del castillo completo
- `PuertaAlicia.glb` — Puerta frontal del castillo (con nodos animables)
- `Reina.glb` — Modelo de la Reina de Corazones (con animación Idle)
- `Llave.glb` — Modelo de llave (generado dinámicamente al resolver el ajedrez)

#### Audio

- `sounds/Llave.wav` — Sonido al recoger la llave

---

### 4.4 Puzzle de Baldosas (standalone)

**Archivo**: `src/MinijuegoBaldosas.html` + `src/js/MinijuegoBaldosas.js`

> **Nota**: Esta escena ya no tiene puerta propia en el hub. Se mantiene como página standalone y su lógica está integrada dentro de `Castillo.html` (sección 4.3.C).

#### Descripción

Minijuego de plataformas donde el jugador camina sobre una cuadrícula de baldosas (18 filas × 6 columnas). Solo un camino es seguro; pisar una baldosa insegura hace que caiga junto con el jugador.

#### Mecánicas

##### A) Sistema de rutas predefinidas con frases narrativas

- Al cargar la página, se selecciona aleatoriamente una de **3 rutas predefinidas** (Ruta 1 «Azul», Ruta 2 «Roja», Ruta 3 «Verde»), cada una con coordenadas exactas y una frase temática por casilla.
- Cada ruta tiene entre 30–32 pasos; las coordenadas se expresan como `[fila,columna]`.
- Las baldosas seguras se marcan con `data-safe="true"`.
- Las frases las pronuncia la Reina de Corazones y aluden a símbolos del universo de Alicia (sombreros, gatos, picas, tazas de té, relojes, llaves, gelatina, flores, cartas).

**Estructura de cada ruta** (objeto `rutasPosibles`):
```javascript
{
    nombre: "Ruta 1",                  // Identificador
    coordenadas: ['[0,2]', '[1,2]', ...], // Casillas seguras (fila,columna)
    frases: [                          // Una frase por casilla (mismo índice)
        "Un buen sombrero impone respeto…",
        "Las flores del jardín saben encogerse cuando paso.",
        // ...
    ]
}
```

##### B) Texturas de símbolos individuales en baldosas

- Cada baldosa muestra un símbolo de `assets/2d/Individual symbols/` como overlay (`<a-image>` sobre `<a-box>`).
- Se asignan en patrón cíclico de 3 filas × 6 columnas:
  | Fila mod 3 | Símbolos |
  |---|---|
  | 0 | Clock, Hole and Key, Hat (×2) |
  | 1 | Card, Jelly, Flower (×2) |
  | 2 | Cups, Chessire, Spade (×2) |
- El componente `mejora-textura` aplica filtrado anisotrópico máximo (`texture.anisotropy`) para nitidez.

##### C) Sistema de gravedad personalizado

- Componente `gravedad-camara`: simula gravedad (9.8 m/s²) en la cámara usando un `THREE.Raycaster` manual apuntando hacia abajo.
- Si el rayo toca suelo firme, la velocidad se resetea a 0.
- Si la baldosa pisada está cayendo (`data-falling="true"`), el jugador cae con ella.
- Al caer debajo de Y=10, se activa un **jumpscare**: el retrato HUD de la reina cambia a `reinaenfadada.png` y se agranda, con texto "¡TE EQUIVOCASTE!" en rojo.
- Al caer debajo de Y=-5, se produce un **respawn** en la posición inicial, restaurando el HUD.

##### D) Sistema de baldosas interactivas

- Componente `baldosa-interactiva`: al ser activada (pisada), si `data-safe="false"`, la baldosa entra en caída libre.
- Componente `seguridad-plataforma`: barreras invisibles para que el jugador no salga de la plataforma de inicio.

##### E) HUD narrativo con seguimiento por casilla

- Panel superior central: personaje animado (`reinaminiatura.png` con animación CSS `hablar`) con bocadillo de texto.
- El componente `gravedad-camara` rastrea las coordenadas de la última baldosa pisada (`this.lastCoords`).
- Al pisar una baldosa segura distinta a la anterior, se muestra la frase de la **siguiente** casilla a pisar (look-ahead).
- Al pisar la última casilla de la ruta, se muestra: *"Hecho. Has cruzado mi dominio."*

**Imágenes HUD utilizadas**:
- `assets/2d/reinaminiatura.png` — Retrato normal de la Reina (estado por defecto).
- `assets/2d/reinaenfadada.png` — Retrato enfadado (jumpscare al caer).

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

**Velocidad**: 5 m/s (definida en `movement.js`). La copia de `player-move` en `bosque_setas.js` está actualmente **comentada**, usándose `movement.js` en su lugar.

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

### 5.4 Colisión de Modelos GLTF

**Archivo**: `src/js/Castillos.js`

Componente `colision-ammo` que espera al evento `model-loaded` de un modelo GLTF y le aplica automáticamente `ammo-body: static` + `ammo-shape: type: mesh; fit: all; includeInvisible: true`. Usado para dar colisión a los mapas del Bosque y del Castillo.

---

### 5.5 Sistema de Puertas/Portales

**Archivo**: `src/js/door_funtions.js` + `src/css/door-funtions.css`

Dos componentes que implementan la navegación entre escenas:

| Componente | Schema | Función |
|---|---|---|
| `door-portal` | `scene: string, label: string` | Almacena la URL destino y el nombre visible del portal |
| `door-detector` | — | Cada frame calcula distancia a todas las entidades `[door-portal]`. Si < 6m muestra etiqueta en HUD; si < 1.8m navega a la escena con pantalla de carga |

Usado en `index.html` (hub central) y en `bosque_setas.html` (portal de vuelta al lobby).

---

### 5.6 Audio: Inicio por Clic

**Archivo**: `src/js/startAudioOnClick.js`

Componente `start-audio-on-click` que soluciona la restricción de los navegadores modernos de no reproducir audio sin interacción del usuario. En el primer clic, busca todas las entidades con el componente `sound` y ejecuta `playSound()`. Opcionalmente, oculta un texto de introducción (configurable con `textId`).

**Uso**: `<a-scene start-audio-on-click>`

---

### 5.7 Audio: Reproducción por Proximidad

**Archivo**: `src/js/playOnApproach.js`

Componente `play-on-approach` que reproduce el sonido de una entidad cuando el jugador (cámara) se acerca a una distancia configurable. Usa `throttleTick` (cada 500ms) para optimizar el cálculo de distancia.

**Schema**:
| Propiedad | Tipo | Default | Descripción |
|---|---|---|---|
| `distance` | number | 3 | Distancia en metros para activar el audio |

---

### 5.8 Audio: Bucle con Retraso

**Archivo**: `src/js/soundLoopDelay.js`

Componente `sound-loop-delay` que escucha el evento `sound-ended` y vuelve a reproducir el sonido tras un retraso configurable. Útil para sonidos ambientales que no deben sonar en bucle continuo.

**Schema**:
| Propiedad | Tipo | Default | Descripción |
|---|---|---|---|
| `delay` | number | 3000 | Retraso en milisegundos antes de volver a reproducir |

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
            const originalSpeed = 5;
            const boostedSpeed = 10;

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
        this.speed = 5; // Ahora es propiedad de instancia
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
| `assets/models/Mario/gbl/` | Bosque de Setas | `Claro_de_Setas.glb`, `Colmenilla.glb`, `Candado.glb`, `Llave.glb`, `Puerta_Drch.glb`, `Puerta_Izq.glb`, `Seta_Roja_Patron.glb`, `Seta_Azul_Patron.glb`, `Seta_Amarilla_Patron.glb`, `Seta_Verde_Patron.glb` |
| `assets/models/Mario/.BLENDS/` | Bosque de Setas | Fuentes Blender (Amanita, Cardo, Colmenilla, Parasol, Claro_de_Setas) |
| `assets/models/Mario/.BLENDS/Fbx/` | Bosque de Setas | Exportaciones FBX (Amanita, Cardo, Colmenilla, Parasol) |
| `assets/models/Gabi/` | Mesa de Té | Laberinto, mesa, sillas, tarta, pipa, vela |
| `assets/models/Gabi/Personajes/` | Mesa de Té | `Conejo.glb`, `Buho.glb`, `Perro.glb`, `Gato.glb`, `Cerdo.glb`, `Pollo.glb` |
| `assets/models/Lajara/GLB/` | Castillo (Ajedrez + Baldosas) | Piezas de ajedrez + tablero + `CastilloAlicia4-2.glb`, `PuertaAlicia.glb`, `Reina.glb`, `Llave.glb` |
| `assets/models/Lajara/` | Castillo | Fuentes Blender (`Ajedrez.blend`, `Cartas.blend`, `CastilloAlicia4-2.blend`, `Reina.blend`) |
| `assets/models/Lajara/Empress/` | (Reservado) | — |
| `assets/2d/` | General | Sprites HUD (reina), tilesets, mapas de rutas |
| `assets/2d/Individual symbols/` | Baldosas | 9 símbolos de baldosas (Clock, Card, Cups, Chessire, Flower, Hat, Hole and Key, Jelly, Spade) |
| `assets/sounds/` | General | Audio de animales (Chicken, RabbitEat, cat, dog1–3, owl, pig) + `Llave.wav` |
| `assets/Addons Anarquistas/` | Herramientas | Addon de Blender (Node Preview v1.21) |

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
| IDs duplicados | MesaTe | Múltiples sillas usan `id="silla"`. Los IDs deben ser únicos en el DOM. |
| Componente `player-move` comentado | Bosque | `bosque_setas.js` contiene una copia de `player-move` actualmente **comentada**. Se usa `movement.js` en su lugar. El código comentado debería eliminarse para evitar confusión. |
| Validación de asientos | MesaTe | TODO marcado en código: comprobar que solo un animal puede sentarse en cada asiento. |
| `checkGameState` en Ajedrez | Castillo | Usa `game.in_check()` (jaque) en lugar de `game.in_checkmate()` (jaque mate). El efecto es que se activa la victoria con jaque simple, no con jaque mate. |
| Carácter corrupto | movement.js | Contiene un carácter no-UTF8 en un comentario (`kinem�tico`). |
| A-Frame inconsistente | Ajedrez | `Ajedrez.html` (standalone) usa A-Frame 1.5.0; el resto de escenas usan 1.7.0. `Castillo.html` usa 1.7.0 correctamente. |
| Variable `a` suelta | MesaTe_Test | Hay una `a;` suelta (línea ~273 de MesaTe_Test.html) que provocará un `ReferenceError`. |
| Físicas inconsistentes | MesaTe vs resto | `MesaTe.html` usa `aframe-physics-system v4.2.1`; las demás escenas usan `v4.2.2`. |
| ~~Sin sistema de navegación entre escenas~~ | ~~General~~ | ~~Resuelto: `index.html` actúa como hub central con 4 puertas que navegan a cada escena.~~ |

---

*Documento generado para el equipo de desarrollo de Into-the-Frame-VR.*
