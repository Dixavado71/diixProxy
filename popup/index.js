/**
 * Diix Proxy - Popup Entry Point
 * Inicializa a aplicação quando o DOM está pronto
 */

import { App } from './app.js';

document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.initialize();
});