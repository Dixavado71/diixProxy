/**
 * RequestInterceptor - Módulo de interceptação de requisições
 * Responsável por capturar e processar todas as requisições HTTP
 */

import { MONITORED_TYPES, MAX_REQUESTS } from '../shared/constants.js';
import { generateId, extractDomain } from '../shared/utils.js';

export class RequestInterceptor {
    constructor(storageManager) {
        this.storageManager = storageManager;
        this.listeners = [];
    }

    initialize() {
        this.setupOnBeforeRequest();
        this.setupOnBeforeSendHeaders();
        this.setupOnHeadersReceived();
        this.setupOnCompleted();
        this.setupOnErrorOccurred();
    }

    /**
     * Captura requisições antes do envio
     */
    setupOnBeforeRequest() {
        const listener = (details) => {
            if (!MONITORED_TYPES.includes(details.type)) return;

            const request = this.createRequestObject(details);
            this.storageManager.addRequest(request);
        };

        chrome.webRequest.onBeforeRequest.addListener(
            listener,
            { urls: ["<all_urls>"] },
            ["requestBody"]
        );

        this.listeners.push({ event: 'onBeforeRequest', listener });
    }

    /**
     * Captura headers de requisição
     */
    setupOnBeforeSendHeaders() {
        const listener = (details) => {
            this.storageManager.updateRequest(
                details.tabId,
                details.url,
                details.method,
                { requestHeaders: details.requestHeaders || [] }
            );
        };

        chrome.webRequest.onBeforeSendHeaders.addListener(
            listener,
            { urls: ["<all_urls>"] },
            ["requestHeaders"]
        );

        this.listeners.push({ event: 'onBeforeSendHeaders', listener });
    }

    /**
     * Captura headers de resposta e status code
     */
    setupOnHeadersReceived() {
        const listener = (details) => {
            this.storageManager.updateRequest(
                details.tabId,
                details.url,
                details.method,
                {
                    statusCode: details.statusCode,
                    responseHeaders: details.responseHeaders || [],
                    ip: details.ip || null
                }
            );
        };

        chrome.webRequest.onHeadersReceived.addListener(
            listener,
            { urls: ["<all_urls>"] },
            ["responseHeaders"]
        );

        this.listeners.push({ event: 'onHeadersReceived', listener });
    }

    /**
     * Captura conclusão da requisição
     */
    setupOnCompleted() {
        const listener = (details) => {
            this.storageManager.updateRequest(
                details.tabId,
                details.url,
                details.method,
                {
                    statusCode: details.statusCode,
                    duration: Date.now() - this.storageManager.getRequestTimestamp(details)
                }
            );
        };

        chrome.webRequest.onCompleted.addListener(
            listener,
            { urls: ["<all_urls>"] }
        );

        this.listeners.push({ event: 'onCompleted', listener });
    }

    /**
     * Captura erros de rede
     */
    setupOnErrorOccurred() {
        const listener = (details) => {
            this.storageManager.updateRequest(
                details.tabId,
                details.url,
                details.method,
                {
                    error: details.error,
                    statusCode: 0,
                    duration: Date.now() - this.storageManager.getRequestTimestamp(details)
                }
            );
        };

        chrome.webRequest.onErrorOccurred.addListener(
            listener,
            { urls: ["<all_urls>"] }
        );

        this.listeners.push({ event: 'onErrorOccurred', listener });
    }

    /**
     * Cria objeto de requisição completo
     */
    createRequestObject(details) {
        const now = Date.now();
        const date = new Date(now);

        return {
            id: generateId(),
            tabId: details.tabId,
            url: details.url,
            method: details.method,
            type: details.type,
            timestamp: now,
            time: date.toLocaleTimeString('pt-BR', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            }),
            date: date.toLocaleDateString('pt-BR'),
            domain: extractDomain(details.url),
            requestBody: details.requestBody || null,
            requestHeaders: null,
            statusCode: null,
            responseHeaders: null,
            duration: null,
            ip: null,
            error: null
        };
    }

    /**
     * Remove todos os listeners (para cleanup)
     */
    destroy() {
        this.listeners.forEach(({ event, listener }) => {
            chrome.webRequest[event].removeListener(listener);
        });
        this.listeners = [];
    }
}