/**
 * StorageService - Serviço de comunicação com storage
 * Interface para comunicação com o background
 */

import { STORAGE_KEY } from '../../shared/constants.js';

export class StorageService {
    async initialize() {
        // Storage é gerenciado pelo background
    }

    async getAllRequests() {
        try {
            const data = await chrome.storage.local.get(STORAGE_KEY);
            return data[STORAGE_KEY] || [];
        } catch (error) {
            console.error('[StorageService] Erro ao carregar:', error);
            return [];
        }
    }

    async clearAll() {
        try {
            await chrome.runtime.sendMessage({ action: 'clearRequests' });
        } catch (error) {
            console.error('[StorageService] Erro ao limpar:', error);
            throw error;
        }
    }
}