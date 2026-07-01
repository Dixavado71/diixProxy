/**
 * CleanupService - Serviço de limpeza automática
 * Responsável por remover dados antigos periodicamente
 */

import { CLEANUP_INTERVAL_MS, MAX_DATA_AGE_MS } from '../shared/constants.js';

export class CleanupService {
    constructor(storageManager) {
        this.storageManager = storageManager;
        this.intervalId = null;
    }

    initialize() {
        // Executar limpeza a cada intervalo
        this.intervalId = setInterval(() => {
            this.cleanup();
        }, CLEANUP_INTERVAL_MS);

        // Executar limpeza inicial após 1 minuto
        setTimeout(() => this.cleanup(), 60000);
    }

    async cleanup() {
        try {
            await this.storageManager.removeOlderThan(MAX_DATA_AGE_MS);
        } catch (error) {
            console.error('[CleanupService] Erro na limpeza:', error);
        }
    }

    destroy() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }
}