# 🎮 Sistema de Diálogos para A-Frame - Resumen Rápido

## 📦 Archivos del Sistema

```
src/
├── css/
│   └── dialog.css          ← Estilos (normal + videojuego)
├── js/
│   └── dialog.js           ← Lógica del sistema
├── ejemplo_dialog.html     ← Ejemplos estilo normal
├── ejemplo_dialog_game.html ← Ejemplos estilo videojuego
└── DIALOG_README.md        ← Documentación completa
```

## 🎯 Dos Estilos Disponibles

### 1️⃣ Estilo Normal (Centrado)

```javascript
window.dialogManager.show({
  title: "Título",
  content: "Contenido",
  buttons: [{ text: "OK" }],
});
```

- ✅ Aparece en el centro de la pantalla
- ✅ Fondo oscuro por defecto
- ✅ Diseño moderno con gradientes

### 2️⃣ Estilo Videojuego (Inferior)

```javascript
window.dialogManager.show({
  gameStyle: true, // ← Activa el estilo videojuego
  characterName: "Guardián",
  characterAvatar: "🧙",
  content: "Mensaje del personaje",
  buttons: [{ text: "Continuar" }],
});
```

- ✅ Aparece en la parte inferior (como RPGs)
- ✅ Soporte para avatares de personajes
- ✅ Nombres de personajes
- ✅ Indicador de "continuar" opcional

## 🌓 Fondo Oscuro Opcional

### Con fondo oscuro (default)

```javascript
window.dialogManager.show({
  darkBackground: true, // ← Por defecto
  content: "La escena se oscurece",
});
```

### Sin fondo oscuro

```javascript
window.dialogManager.show({
  darkBackground: false, // ← La escena permanece visible
  content: "Puedes ver la escena 3D detrás",
});
```

## 🚀 Ejemplos Rápidos

### Diálogo Simple

```javascript
window.dialogManager.alert("¡Operación completada!");
```

### Confirmación

```javascript
window.dialogManager.confirm(
  "¿Estás seguro?",
  () => console.log("Sí"),
  () => console.log("No"),
);
```

### Diálogo RPG con Personaje

```javascript
window.dialogManager.show({
  gameStyle: true,
  characterName: "Mago Sabio",
  characterAvatar: "🔮",
  title: "Bienvenido",
  content: "¿Qué deseas aprender?",
  darkBackground: true,
  buttons: [
    { text: "Magia de fuego" },
    { text: "Magia de hielo" },
    { text: "Salir", secondary: true },
  ],
});
```

### Diálogo de Videojuego Sin Fondo

```javascript
window.dialogManager.show({
  gameStyle: true,
  darkBackground: false, // ← Escena visible
  characterAvatar: "⚔️",
  content: "Has encontrado un objeto",
  showContinueIndicator: true,
  buttons: [{ text: "Recoger" }],
});
```

## 🎨 Comparación Visual

```
ESTILO NORMAL                    ESTILO VIDEOJUEGO
═══════════════                  ═══════════════

┌─────────────────┐              ┌─────────────────┐
│                 │              │                 │
│                 │              │   Escena 3D     │
│   ┌─────────┐   │              │                 │
│   │ Diálogo │   │              │                 │
│   │Centrado │   │              ├─────────────────┤
│   └─────────┘   │              │ 🧙 Guardián     │
│                 │              │ Mensaje aquí... │
│                 │              │ [Continuar]     │
└─────────────────┘              └─────────────────┘
```

## 📋 Opciones Completas

| Opción                      | Tipo        | Default         | Descripción             |
| --------------------------- | ----------- | --------------- | ----------------------- |
| `title`                     | string      | "Diálogo"       | Título del diálogo      |
| `content`                   | string      | ""              | Contenido (acepta HTML) |
| `buttons`                   | array       | `[{text:"OK"}]` | Botones personalizados  |
| `showCloseButton`           | boolean     | true            | Mostrar botón X         |
| `onClose`                   | function    | null            | Callback al cerrar      |
| **`gameStyle`**             | **boolean** | **false**       | **Estilo videojuego**   |
| **`darkBackground`**        | **boolean** | **true**        | **Fondo oscuro**        |
| **`characterName`**         | **string**  | **null**        | **Nombre personaje**    |
| **`characterAvatar`**       | **string**  | **null**        | **Avatar (emoji)**      |
| **`showContinueIndicator`** | **boolean** | **false**       | **Indicador continuar** |

## 🎮 Casos de Uso

### 🎯 Usa Estilo Normal Para:

- Alertas y confirmaciones
- Menús de opciones
- Mensajes importantes que requieren atención completa
- Formularios o inputs

### 🎮 Usa Estilo Videojuego Para:

- Diálogos con NPCs
- Narrativa y storytelling
- Tutoriales paso a paso
- Sistemas de misiones
- Conversaciones interactivas

## 📝 Notas Importantes

1. **Solo un diálogo a la vez**: Si muestras un nuevo diálogo, el anterior se cierra automáticamente
2. **Fondo oscuro y clicks**: Si `darkBackground: true`, hacer clic fuera cierra el diálogo
3. **Sin fondo oscuro**: Si `darkBackground: false`, hacer clic fuera NO cierra el diálogo
4. **HTML en contenido**: Puedes usar `<br>`, `<strong>`, `<em>`, etc.
5. **Emojis como avatares**: Usa emojis para avatares rápidos y visuales

## 🔗 Archivos de Ejemplo

- **`ejemplo_dialog.html`** - Diálogos estilo normal
- **`ejemplo_dialog_game.html`** - Diálogos estilo videojuego con NPCs

¡Abre estos archivos en tu navegador para ver todos los ejemplos en acción!
