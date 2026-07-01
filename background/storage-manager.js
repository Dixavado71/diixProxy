/**
 * StorageManager - Gerenciador de storage persistente
 * Responsável por gerenciar o cache e persistência de dados
 */

import { STORAGE_KEY, MAX_REQUESTS } from '../shared/constants.js';

export class StorageManager {
    constructor() {
        this.cache = [];
        this.isInitialized = false;
        this.saveTimeout = null;
    }

    /**
     * Inicializa o cache a partir do storage
     */
    async initialize() {
        try {
            const data = await chrome.storage.local.get(STORAGE_KEY);
            this.cache = data[STORAGE_KEY] || [];
            this.isInitialized = true;
            console.log(`[StorageManager] Inicializado com ${this.cache.length} requisições`);
        } catch (error) {
            console.error('[StorageManager] Erro ao inicializar:', error);
            this.cache = [];
            this.isInitialized = true;
        }
    }

    /**
     * Adiciona uma nova requisição ao cache
     */
    addRequest(request) {
        if (!this.isInitialized) return;

        this.cache.push(request);

        // Manter limite máximo
        if (this.cache.length > MAX_REQUESTS) {
            this.cache = this.cache.slice(-MAX_REQUESTS);
        }

        this.debouncedSave();
    }

    /**
     * Atualiza uma requisição existente
     */
    updateRequest(tabId, url, method, updates) {
        if (!this.isInitialized) return;

        const request = this.findRequest(tabId, url, method);
        
        if (request) {
            Object.assign(request, updates);
            this.debouncedSave();
        }
    }

    /**
     * Busca uma requisição no cache
     */
    findRequest(tabId, url, method) {
        return this.cache.find(r =>
            r.tabId === tabId &&
            r.url === url &&
            r.method === method &&
            !r.statusCode
        );
    }

    /**
     * Obtém timestamp de uma requisição
     */
    getRequestTimestamp(details) {
        const request = this.findRequest(details.tabId, details.url, details.method);
        return request ? request.timestamp : Date.now();
    }

    /**
     * Obtém todas as requisições
     */
    getAllRequests() {
        return [...this.cache];
    }

    /**
     * Limpa todas as requisições
     */
    async clearAll() {
        this.cache = [];
        await this.save();
    }

    /**
     * Remove requisições antigas
     */
    async removeOlderThan(milliseconds) {
        const now = Date.now();
        const beforeCount = this.cache.length;
        
        this.cache = this.cache.filter(r => (now - r.timestamp) < milliseconds);
        
        if (this.cache.length !== beforeCount) {
            await this.save();
            console.log(`[StorageManager] Removidas ${beforeCount - this.cache.length} requisições antigas`);
        }
    }

    /**
     * Salva com debounce para evitar writes excessivos
     */
    debouncedSave() {
        if (this.saveTimeout) clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(() => this.save(), 300);
    }

    /**
     * Salva no storage
     */
    async save() {
        try {
            await chrome.storage.local.set({ [STORAGE_KEY]: this.cache });
        } catch (error) {
            console.error('[StorageManager] Erro ao salvar:', error);
        }
    }
}