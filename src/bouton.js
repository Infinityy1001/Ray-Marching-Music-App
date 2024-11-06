export default class Button {
    constructor(id, secondText) {
        this.element = document.getElementById(id);
    }

    // Ajouter un gestionnaire de clic
    addClickListener(callback, cancelCallback) {
        this.element.addEventListener('click', callback);
    }

    // Modifier le texte du bouton
    setText(text) {
        this.element.innerHTML = text;
    }

    // Activer le bouton
    enable() {
        this.element.removeAttribute('disabled');
    }

    // Désactiver le bouton
    disable() {
        this.element.setAttribute('disabled', 'true');
    }
}
