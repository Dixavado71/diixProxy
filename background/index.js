/**
 * Diix Proxy - Background Service Worker Entry Point
 * Módulo principal que inicializa todos os serviços
 */

import { RequestInterceptor } from './request-interceptor.js';
import { StorageManager } from './storage-manager.js';
import { MessageHandler } from './message-handler.js';
import { CleanupService } from './cleanup-service.js';

class DiixProxyBackground {
    constructor() {
        this.storageManager = new StorageManager();
        this.requestInterceptor = new RequestInterceptor(this.storageManager);
        this.messageHandler = new MessageHandler(this.storageManager);
        this.cleanupService = new CleanupService(this.storageManager);
    }

    async initialize() {
        try {
            console.log('[DiixProxy] Inicializando background service...');
            
            // Inicializar storage
            await this.storageManager.initialize();
            
            // Inicializar interceptador
            this.requestInterceptor.initialize();
            
            // Inicializar handler de mensagens
            this.messageHandler.initialize();
            
            // Inicializar serviço de limpeza
            this.cleanupService.initialize();
            
            console.log('[DiixProxy] Background service inicializado com sucesso');
        } catch (error) {
            console.error('[DiixProxy] Erro ao inicializar background:', error);
        }
    }
}

// Inicializar quando o service worker carregar
const background = new DiixProxyBackground();
background.initialize();

// Listener de instalação/atualização
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('[DiixProxy] Extensão instalada com sucesso!');
    } else if (details.reason === 'update') {
        console.log(`[DiixProxy] Atualizada para v${chrome.runtime.getManifest().version}`);
    }
});