# Sistema de Personalización de Diálogos

Este sistema permite personalizar la apariencia de los diálogos de dos formas: **Modo Color Sólido** (básico) y **Modo Estético** (avanzado con temas).

## 1. Modo Básico (Control Total)

Ideal para colores sólidos simples o cuando quieres definir manualmente el CSS del fondo.

- **`backgroundColor`**: Define el `background` CSS completo de la caja.
- **`textColor`**: Define el color del texto base.

Ejemplo:

```javascript
window.dialogManager.show({
  title: "Aviso Simple",
  content: "Fondo rojo sólido",
  backgroundColor: "red",
  textColor: "white",
});
```

## 2. Modo Estético (Recomendado)

Ideal para diálogos de videojuegos con un look "premium". Genera automáticamente gradientes, bordes brillantes y estilos de botones.

- **`primaryColor`**: Color de acento principal.
  - Genera el borde superior brillante.
  - Colorea el nombre del personaje.
  - Define el color principal de los botones.
  - Define el color del borde en botones secundarios.
- **`secondaryColor`**: Color complementario.
  - Se mezcla con el primario para crear gradientes en los botones.
  - Genera un matiz sutil en el fondo oscuro del diálogo.

Ejemplo:

```javascript
window.dialogManager.show({
  gameStyle: true,
  characterName: "Héroe",
  content: "¡Mira estos botones con gradiente!",
  primaryColor: "#00ffff", // Cian brillante
  secondaryColor: "#0088ff", // Azul profundo
  textColor: "#e0ffff",
});
```

---

## Paletas de Colores Sugeridas (Modo Estético)

| Tema                | Primary Color | Secondary Color | Text Color |
| ------------------- | ------------- | --------------- | ---------- |
| **Fuego / Combate** | `#ff4444`     | `#cc0000`       | `white`    |
| **Hielo / Magia**   | `#00ffff`     | `#0099cc`       | `#e0ffff`  |
| **Naturaleza**      | `#00cc66`     | `#006633`       | `white`    |
| **Tesoro / Oro**    | `#ffd700`     | `#ff8c00`       | `#333333`  |
| **Oscuridad**       | `#be29ec`     | `#7000af`       | `white`    |
| **Tecnología**      | `#00ff9d`     | `#00ccff`       | `#ccffef`  |

---

## Notas de Estilo

1. **Prioridad**: Si defines `backgroundColor`, este sobrescribirá el fondo generado por el Modo Estético, pero los botones seguirán usando `primaryColor`/`secondaryColor`.
2. **Botones**:
   - Los botones **primarios** tendrán un gradiente diagonal de `primary` a `secondary`.
   - Los botones **secundarios** serán transparentes con un borde del color `primary`.
3. **Game Style**: El Modo Estético luce mejor con `gameStyle: true`.
