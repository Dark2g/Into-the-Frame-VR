# Sistema de Diálogos para A-Frame

Sistema de diálogos genérico que crea overlays HTML que se superponen sobre la escena 3D de A-Frame, sin ser objetos 3D.

## 📁 Archivos

- **`js/dialog.js`** - Lógica del sistema de diálogos
- **`css/dialog.css`** - Estilos del overlay
- **`ejemplo_dialog.html`** - Ejemplo completo de uso

## 🚀 Instalación

1. Incluye los archivos en tu HTML:

```html
<script src="js/dialog.js"></script>
<link rel="stylesheet" href="css/dialog.css" />
```

2. Asegúrate de que A-Frame esté cargado antes de `dialog.js`

## 💡 Uso Básico

### Método 1: Desde JavaScript

```javascript
// Diálogo simple
window.dialogManager.show({
  title: "Mi Título",
  content: "Contenido del diálogo",
  buttons: [
    {
      text: "OK",
      callback: () => {
        console.log("Botón presionado");
      },
    },
  ],
});
```

### Método 2: Componente A-Frame

```html
<a-box
  dialog-trigger="title: ¡Hola!; content: Este es un diálogo; buttonText: Cerrar"
>
</a-box>
```

## 📚 API Completa

### DialogManager.show(options)

Muestra un diálogo personalizado.

**Parámetros:**

```javascript
{
  title: "Título del diálogo",           // String
  content: "Contenido (puede ser HTML)", // String (acepta HTML)
  buttons: [                              // Array de objetos
    {
      text: "Texto del botón",            // String
      callback: function() {},            // Function (opcional)
      secondary: false,                   // Boolean (estilo secundario)
      closeOnClick: true                  // Boolean (cerrar al hacer clic)
    }
  ],
  showCloseButton: true,                  // Boolean (mostrar X)
  onClose: function() {},                 // Function (callback al cerrar)

  // NUEVAS OPCIONES ESTILO VIDEOJUEGO
  gameStyle: false,                       // Boolean (estilo videojuego en parte inferior)
  darkBackground: true,                   // Boolean (fondo oscuro opcional)
  characterName: null,                    // String (nombre del personaje)
  characterAvatar: null,                  // String (emoji o texto para avatar)
  showContinueIndicator: false            // Boolean (indicador "presiona para continuar")
}
```

**Retorna:** Elemento DOM del overlay

### DialogManager.confirm(message, onConfirm, onCancel)

Diálogo de confirmación con botones Aceptar/Cancelar.

```javascript
window.dialogManager.confirm(
  "¿Estás seguro?",
  () => console.log("Confirmado"),
  () => console.log("Cancelado"),
);
```

### DialogManager.alert(message, onClose)

Diálogo de alerta simple con un botón OK.

```javascript
window.dialogManager.alert("¡Operación completada!", () =>
  console.log("Alerta cerrada"),
);
```

### DialogManager.hide()

Cierra el diálogo actual.

```javascript
window.dialogManager.hide();
```

## 🎨 Componente A-Frame: dialog-trigger

Muestra un diálogo cuando ocurre un evento en una entidad.

**Propiedades:**

- `title` (string): Título del diálogo (default: "Diálogo")
- `content` (string): Contenido del diálogo (default: "Contenido del diálogo")
- `event` (string): Evento que dispara el diálogo (default: "click")
- `buttonText` (string): Texto del botón (default: "OK")

**Ejemplo:**

```html
<a-sphere
  dialog-trigger="
    title: Esfera Interactiva;
    content: Has hecho clic en la esfera;
    event: click;
    buttonText: Entendido
  "
>
</a-sphere>
```

**Evento emitido:**

El componente emite el evento `dialog-closed` cuando se cierra el diálogo:

```javascript
sphere.addEventListener("dialog-closed", () => {
  console.log("El diálogo se cerró");
});
```

## 🎯 Ejemplos de Uso

### Ejemplo 1: Diálogo Simple

```javascript
window.dialogManager.show({
  title: "Bienvenido",
  content: "Este es un mensaje de bienvenida",
  buttons: [{ text: "OK" }],
});
```

### Ejemplo 2: Diálogo con Múltiples Botones

```javascript
window.dialogManager.show({
  title: "Selecciona una opción",
  content: "¿Qué deseas hacer?",
  buttons: [
    {
      text: "Opción 1",
      callback: () => console.log("Opción 1"),
    },
    {
      text: "Opción 2",
      callback: () => console.log("Opción 2"),
    },
    {
      text: "Cancelar",
      secondary: true,
    },
  ],
});
```

### Ejemplo 3: Diálogo con HTML

```javascript
window.dialogManager.show({
  title: "Información Detallada",
  content: `
    <strong>Características:</strong><br>
    • Soporte para HTML<br>
    • Múltiples botones<br>
    • Animaciones suaves<br>
    <br>
    <em>¡Disfruta del sistema!</em>
  `,
  buttons: [{ text: "Genial" }],
});
```

### Ejemplo 4: Diálogo desde Evento A-Frame

```javascript
document.querySelector("#miCaja").addEventListener("click", () => {
  window.dialogManager.show({
    title: "Caja Clickeada",
    content: "Has interactuado con la caja",
    buttons: [
      {
        text: "Ver más",
        callback: () => {
          window.dialogManager.alert("Más información aquí");
        },
      },
      {
        text: "Cerrar",
        secondary: true,
      },
    ],
  });
});
```

### Ejemplo 5: Diálogo sin Botón de Cerrar

```javascript
window.dialogManager.show({
  title: "Acción Requerida",
  content: "Debes seleccionar una opción",
  showCloseButton: false, // Sin botón X
  buttons: [{ text: "Sí" }, { text: "No" }],
});
```

### Ejemplo 6: Callback al Cerrar

```javascript
window.dialogManager.show({
  title: "Diálogo con Callback",
  content: "Cierra este diálogo de cualquier forma",
  buttons: [{ text: "OK" }],
  onClose: () => {
    console.log("El diálogo se cerró (con X, clic fuera, o botón)");
  },
});
```

### Ejemplo 7: Diálogo Estilo Videojuego Básico

```javascript
window.dialogManager.show({
  gameStyle: true,
  title: "Bienvenido Aventurero",
  content:
    "Este diálogo aparece en la parte inferior como en los RPGs clásicos.",
  buttons: [{ text: "Continuar" }],
});
```

### Ejemplo 8: Diálogo con Personaje (Estilo RPG)

```javascript
window.dialogManager.show({
  gameStyle: true,
  characterName: "Guardián del Bosque",
  characterAvatar: "🧙",
  title: "Mensaje Importante",
  content: "Saludos, valiente aventurero. Las fuerzas oscuras se acercan...",
  buttons: [
    {
      text: "¿Qué debo hacer?",
      callback: () => {
        // Mostrar siguiente diálogo
        window.dialogManager.show({
          gameStyle: true,
          characterName: "Guardián del Bosque",
          characterAvatar: "🧙",
          content: "Debes encontrar las tres gemas sagradas.",
          buttons: [{ text: "Acepto la misión" }],
        });
      },
    },
    { text: "Adiós", secondary: true },
  ],
});
```

### Ejemplo 9: Diálogo Sin Fondo Oscuro

```javascript
window.dialogManager.show({
  gameStyle: true,
  darkBackground: false, // La escena 3D permanece visible
  characterName: "Narrador",
  content: "Este diálogo no oscurece el fondo. Puedes ver la escena completa.",
  buttons: [{ text: "Entendido" }],
});
```

### Ejemplo 10: Diálogo con Indicador de Continuar

```javascript
window.dialogManager.show({
  gameStyle: true,
  characterAvatar: "⚔️",
  content: "Has encontrado un cofre del tesoro. ¿Quieres abrirlo?",
  showContinueIndicator: true,
  buttons: [{ text: "Abrir" }, { text: "Dejar", secondary: true }],
});
```

### Ejemplo 11: Sistema de Diálogo Interactivo (NPC)

```javascript
// Diálogo con comerciante
document.querySelector("#npc-merchant").addEventListener("click", () => {
  window.dialogManager.show({
    gameStyle: true,
    characterName: "Comerciante",
    characterAvatar: "💰",
    title: "¡Bienvenido a mi tienda!",
    content: "Tengo los mejores artículos del reino. ¿Qué te interesa?",
    buttons: [
      {
        text: "Ver armas",
        callback: () => {
          window.dialogManager.show({
            gameStyle: true,
            characterAvatar: "💰",
            content:
              "Espada de hierro (200 oro) - Daño +10<br>Espada de acero (500 oro) - Daño +25",
            buttons: [
              { text: "Comprar hierro" },
              { text: "Comprar acero" },
              { text: "Volver", secondary: true },
            ],
          });
        },
      },
      { text: "Salir", secondary: true },
    ],
  });
});
```

## 🎨 Personalización de Estilos

Puedes modificar `css/dialog.css` para cambiar:

- Colores del gradiente (`.dialog-box`)
- Tamaño y fuente (`.dialog-title`, `.dialog-content`)
- Estilos de botones (`.dialog-button`)
- Animaciones (`@keyframes dialogSlideIn`)
- Fondo del overlay (`.dialog-overlay`)

### Ejemplo de Personalización

```css
/* Cambiar el gradiente del diálogo */
.dialog-box {
  background: linear-gradient(135deg, #ff6b6b 0%, #ffe66d 100%);
}

/* Cambiar el color de los botones */
.dialog-button {
  background-color: #ff6b6b;
  color: white;
}
```

## 🔧 Características

✅ Overlay HTML (no es un objeto 3D)  
✅ Se superpone sobre la escena A-Frame  
✅ Animaciones suaves de entrada/salida  
✅ Múltiples botones personalizables  
✅ Soporte para HTML en el contenido  
✅ Botón de cerrar (X) opcional  
✅ Cerrar al hacer clic fuera del diálogo  
✅ Callbacks personalizados  
✅ Componente A-Frame para uso fácil  
✅ Métodos de conveniencia (alert, confirm)  
✅ Diseño responsive y moderno  
✅ **NUEVO:** Estilo videojuego (parte inferior de pantalla)  
✅ **NUEVO:** Fondo oscuro opcional  
✅ **NUEVO:** Avatares de personajes  
✅ **NUEVO:** Nombres de personajes  
✅ **NUEVO:** Indicador de "presiona para continuar"

## 📝 Notas

- Solo puede haber un diálogo visible a la vez
- El diálogo se cierra automáticamente al hacer clic en un botón (a menos que `closeOnClick: false`)
- El diálogo se puede cerrar haciendo clic fuera de él o en el botón X
- El z-index del overlay es 9999 para asegurar que esté sobre todo

## 🐛 Solución de Problemas

**El diálogo no aparece:**

- Verifica que `dialog.js` y `dialog.css` estén cargados
- Asegúrate de que A-Frame esté cargado primero
- Revisa la consola del navegador por errores

**El diálogo aparece detrás de la escena:**

- Verifica que el CSS esté cargado correctamente
- El z-index debe ser 9999

**Los estilos no se aplican:**

- Asegúrate de que `dialog.css` esté vinculado en el HTML
- Verifica que no haya conflictos de CSS con otros estilos
