/**
 * MessageHandler - Gerenciador de mensagens do popup
 * Responsável por processar mensagens da interface
 */

export class MessageHandler {
    constructor(storageManager) {
        this.storageManager = storageManager;
    }

    initialize() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.handleMessage(message, sender, sendResponse);
            return true; // Manter canal aberto para resposta assíncrona
        });
    }

    async handleMessage(message, sender, sendResponse) {
        try {
            switch (message.action) {
                case 'getRequests':
                    sendResponse({ 
                        success: true, 
                        requests: this.storageManager.getAllRequests() 
                    });
                    break;

                case 'clearRequests':
                    await this.storageManager.clearAll();
                    sendResponse({ success: true });
                    break;

                case 'exportRequests':
                    const data = JSON.stringify(this.storageManager.getAllRequests(), null, 2);
                    sendResponse({ success: true, data });
                    break;

                default:
                    sendResponse({ 
                        success: false, 
                        error: 'Ação desconhecida' 
                    });
            }
        } catch (error) {
            console.error('[MessageHandler] Erro ao processar mensagem:', error);
            sendResponse({ 
                success: false, 
                error: error.message 
            });
        }
    }
}