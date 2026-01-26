class DialogManager {
  constructor() {
    this.currentDialog = null;
    this.dialogCounter = 0;
  }

  show(options) {
    if (this.currentDialog) {
      this.hide();
    }

    const {
      title = "Diálogo",
      content = "",
      buttons = [{ text: "OK", callback: null }],
      showCloseButton = true,
      onClose = null,
      gameStyle = false,
      darkBackground = true,
      characterName = null,
      backgroundColor = null,
      textColor = null,
      primaryColor = null,
      secondaryColor = null,
    } = options;

    const overlay = document.createElement("div");
    overlay.className = "dialog-overlay";
    overlay.id = `dialog-${this.dialogCounter++}`;

    if (!darkBackground) {
      overlay.classList.add("no-background");
    }

    const dialogBox = document.createElement("div");
    dialogBox.className = "dialog-box";

    if (backgroundColor) {
      dialogBox.style.background = backgroundColor;
    }
    if (textColor) {
      dialogBox.style.color = textColor;
    }

    if (gameStyle) {
      dialogBox.classList.add("game-style");

      if (primaryColor) {
        dialogBox.style.borderTop = `4px solid ${primaryColor}`;

        if (secondaryColor) {
          dialogBox.style.background = `linear-gradient(180deg, 
                rgba(20, 20, 35, 0.95) 0%, 
                rgba(10, 10, 20, 0.98) 100%)`;
          dialogBox.style.boxShadow = `0 -5px 20px ${primaryColor}20`;
        }
      }

      if (backgroundColor) {
        dialogBox.style.background = backgroundColor;
      }

      if (textColor) {
        dialogBox.style.color = textColor;
      }

      const dialogInner = document.createElement("div");
      dialogInner.className = "dialog-inner";

      if (characterName) {
        const nameEl = document.createElement("div");
        nameEl.className = "dialog-character-name";
        nameEl.textContent = characterName;

        if (primaryColor) {
          nameEl.style.color = primaryColor;
          nameEl.style.textShadow = `0 0 10px ${primaryColor}40`;
        }

        dialogInner.appendChild(nameEl);
      }

      if (title) {
        const titleEl = document.createElement("div");
        titleEl.className = "dialog-title";
        titleEl.textContent = title;
        dialogInner.appendChild(titleEl);
      }

      const contentEl = document.createElement("div");
      contentEl.className = "dialog-content";
      contentEl.innerHTML = content;
      dialogInner.appendChild(contentEl);

      const buttonsContainer = document.createElement("div");
      buttonsContainer.className = "dialog-buttons";

      buttons.forEach((btn) => {
        const button = document.createElement("button");
        button.className = "dialog-button";

        if (primaryColor && secondaryColor) {
          if (btn.secondary) {
            button.style.borderColor = primaryColor;
            button.style.color = textColor || "white";
            button.style.background = "transparent";
            button.onmouseenter = () =>
              (button.style.background = `${primaryColor}20`);
            button.onmouseleave = () =>
              (button.style.background = "transparent");
          } else {
            button.style.background = `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`;
            button.style.border = "none";
            button.style.color = "white";
            button.style.boxShadow = `0 4px 15px ${primaryColor}60`;
          }
        }

        if (btn.secondary) {
          button.classList.add("secondary");
        }

        button.textContent = btn.text;

        button.onclick = () => {
          if (btn.callback) {
            btn.callback();
          }
          if (btn.closeOnClick !== false) {
            this.hide();
          }
        };

        buttonsContainer.appendChild(button);
      });

      dialogInner.appendChild(buttonsContainer);

      if (showCloseButton) {
        const closeBtn = document.createElement("button");
        closeBtn.className = "dialog-close";
        closeBtn.innerHTML = "×";
        closeBtn.onclick = () => {
          this.hide();
          if (onClose) onClose();
        };
        dialogBox.appendChild(closeBtn);
      }

      dialogBox.appendChild(dialogInner);
    } else {
      if (showCloseButton) {
        const closeBtn = document.createElement("button");
        closeBtn.className = "dialog-close";
        closeBtn.innerHTML = "×";
        closeBtn.onclick = () => {
          this.hide();
          if (onClose) onClose();
        };
        dialogBox.appendChild(closeBtn);
      }

      const titleEl = document.createElement("div");
      titleEl.className = "dialog-title";
      titleEl.textContent = title;
      dialogBox.appendChild(titleEl);

      const contentEl = document.createElement("div");
      contentEl.className = "dialog-content";
      contentEl.innerHTML = content;
      dialogBox.appendChild(contentEl);

      const buttonsContainer = document.createElement("div");
      buttonsContainer.className = "dialog-buttons";

      buttons.forEach((btn) => {
        const button = document.createElement("button");
        button.className = "dialog-button";
        if (btn.secondary) {
          button.classList.add("secondary");
        }
        button.textContent = btn.text;
        button.onclick = () => {
          if (btn.callback) {
            btn.callback();
          }
          if (btn.closeOnClick !== false) {
            this.hide();
          }
        };
        buttonsContainer.appendChild(button);
      });

      dialogBox.appendChild(buttonsContainer);
    }

    overlay.appendChild(dialogBox);
    document.body.appendChild(overlay);

    setTimeout(() => {
      overlay.classList.add("active");
    }, 10);

    this.currentDialog = overlay;

    if (darkBackground) {
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
          this.hide();
          if (onClose) onClose();
        }
      });
    }

    return overlay;
  }

  hide() {
    if (this.currentDialog) {
      this.currentDialog.classList.remove("active");
      setTimeout(() => {
        if (this.currentDialog && this.currentDialog.parentNode) {
          this.currentDialog.parentNode.removeChild(this.currentDialog);
        }
        this.currentDialog = null;
      }, 300);
    }
  }

  confirm(message, onConfirm, onCancel) {
    return this.show({
      title: "Confirmación",
      content: message,
      buttons: [
        {
          text: "Aceptar",
          callback: onConfirm,
        },
        {
          text: "Cancelar",
          callback: onCancel,
          secondary: true,
        },
      ],
    });
  }

  alert(message, onClose) {
    return this.show({
      title: "Aviso",
      content: message,
      buttons: [
        {
          text: "OK",
          callback: onClose,
        },
      ],
    });
  }
}

window.dialogManager = new DialogManager();

AFRAME.registerComponent("dialog-trigger", {
  schema: {
    title: { type: "string", default: "Diálogo" },
    content: { type: "string", default: "Contenido del diálogo" },
    event: { type: "string", default: "click" },
    buttonText: { type: "string", default: "OK" },
  },

  init() {
    this.showDialog = this.showDialog.bind(this);
    this.el.addEventListener(this.data.event, this.showDialog);
  },

  showDialog() {
    window.dialogManager.show({
      title: this.data.title,
      content: this.data.content,
      buttons: [
        {
          text: this.data.buttonText,
          callback: () => {
            this.el.emit("dialog-closed");
          },
        },
      ],
    });
  },

  remove() {
    this.el.removeEventListener(this.data.event, this.showDialog);
  },
});
