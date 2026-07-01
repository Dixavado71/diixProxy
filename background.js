/**
 * Diix Proxy - Background Service Worker
 * Monitor profissional de requisições HTTP(S)
 * Versão: 2.0.0
 */

// Constantes
const STORAGE_KEY = 'diix_requests';
const MAX_REQUESTS = 1000;

// Estado em memória (cache)
let requestsCache = [];
let isInitialized = false;
let saveTimeout = null;

/**
 * Inicializa o cache a partir do storage
 * CRÍTICO: No MV3, o service worker pode ser encerrado a qualquer momento
 */
async function initializeCache() {
    try {
        const data = await chrome.storage.local.get(STORAGE_KEY);
        requestsCache = data[STORAGE_KEY] || [];
        isInitialized = true;
        console.log(`[DiixProxy] Inicializado com ${requestsCache.length} requisições`);
    } catch (error) {
        console.error('[DiixProxy] Erro ao inicializar:', error);
        requestsCache = [];
        isInitialized = true;
    }
}

/**
 * Salva requisições no storage com debounce (evita writes excessivos)
 */
async function saveRequests() {
    try {
        await chrome.storage.local.set({ [STORAGE_KEY]: requestsCache });
    } catch (error) {
        console.error('[DiixProxy] Erro ao salvar:', error);
    }
}

/**
 * Debounce para salvar - evita sobrecarregar o storage
 */
function debouncedSave() {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        saveRequests();
    }, 300);
}

/**
 * Gera ID único para cada requisição
 */
function generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Extrai domínio de uma URL
 */
function extractDomain(url) {
    try {
        return new URL(url).hostname;
    } catch {
        return 'unknown';
    }
}

/**
 * Listener: Captura requisições antes do envio
 */
chrome.webRequest.onBeforeRequest.addListener(
    (details) => {
        if (!isInitialized) return;

        // Filtrar apenas tipos relevantes
        const monitoredTypes = ['main_frame', 'sub_frame', 'xmlhttprequest', 'fetch'];
        if (!monitoredTypes.includes(details.type)) return;

        const request = {
            id: generateId(),
            tabId: details.tabId,
            url: details.url,
            method: details.method,
            type: details.type,
            timestamp: Date.now(),
            time: new Date().toLocaleTimeString('pt-BR', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            }),
            date: new Date().toLocaleDateString('pt-BR'),
            domain: extractDomain(details.url),
            requestBody: details.requestBody || null,
            requestHeaders: null,
            statusCode: null,
            responseHeaders: null,
            duration: null,
            ip: null,
            error: null
        };

        requestsCache.push(request);

        // Manter limite máximo
        if (requestsCache.length > MAX_REQUESTS) {
            requestsCache = requestsCache.slice(-MAX_REQUESTS);
        }

        debouncedSave();
    },
    { urls: ["<all_urls>"] },
    ["requestBody"]
);

/**
 * Listener: Captura headers de requisição
 */
chrome.webRequest.onBeforeSendHeaders.addListener(
    (details) => {
        if (!isInitialized) return;

        // CORREÇÃO CRÍTICA: Buscar por tabId, url e method (não por id!)
        const request = requestsCache.find(r =>
            r.tabId === details.tabId &&
            r.url === details.url &&
            r.method === details.method &&
            !r.requestHeaders
        );

        if (request) {
            request.requestHeaders = details.requestHeaders || [];
            debouncedSave();
        }
    },
    { urls: ["<all_urls>"] },
    ["requestHeaders"]
);

/**
 * Listener: Captura headers de resposta e status code
 */
chrome.webRequest.onHeadersReceived.addListener(
    (details) => {
        if (!isInitialized) return;

        const request = requestsCache.find(r =>
            r.tabId === details.tabId &&
            r.url === details.url &&
            !r.statusCode
        );

        if (request) {
            request.statusCode = details.statusCode;
            request.responseHeaders = details.responseHeaders || [];
            request.ip = details.ip || null;
            debouncedSave();
        }
    },
    { urls: ["<all_urls>"] },
    ["responseHeaders"]
);

/**
 * Listener: Captura conclusão da requisição (tempo de resposta)
 */
chrome.webRequest.onCompleted.addListener(
    (details) => {
        if (!isInitialized) return;

        const request = requestsCache.find(r =>
            r.tabId === details.tabId &&
            r.url === details.url &&
            !r.duration
        );

        if (request) {
            request.statusCode = details.statusCode || request.statusCode;
            request.duration = Date.now() - request.timestamp;
            debouncedSave();
        }
    },
    { urls: ["<all_urls>"] }
);

/**
 * Listener: Captura erros de rede
 */
chrome.webRequest.onErrorOccurred.addListener(
    (details) => {
        if (!isInitialized) return;

        const request = requestsCache.find(r =>
            r.tabId === details.tabId &&
            r.url === details.url
        );

        if (request) {
            request.error = details.error;
            request.statusCode = 0;
            request.duration = Date.now() - request.timestamp;
            debouncedSave();
        }
    },
    { urls: ["<all_urls>"] }
);

/**
 * Listener: Mensagens do popup
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'clearRequests') {
        requestsCache = [];
        saveRequests().then(() => sendResponse({ success: true }));
        return true;
    }

    if (message.action === 'getRequests') {
        sendResponse({ requests: requestsCache });
        return true;
    }

    if (message.action === 'exportRequests') {
        sendResponse({ data: JSON.stringify(requestsCache, null, 2) });
        return true;
    }
});

/**
 * Limpeza periódica de dados antigos (>24h)
 */
async function cleanupOldData() {
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    const now = Date.now();

    const beforeCount = requestsCache.length;
    requestsCache = requestsCache.filter(r => (now - r.timestamp) < ONE_DAY_MS);

    if (requestsCache.length !== beforeCount) {
        await saveRequests();
        console.log(`[DiixProxy] Limpeza: removidas ${beforeCount - requestsCache.length} requisições antigas`);
    }
}

/**
 * Listener: Instalação/Atualização da extensão
 */
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('[DiixProxy] Extensão instalada com sucesso!');
    } else if (details.reason === 'update') {
        console.log(`[DiixProxy] Atualizada para v${chrome.runtime.getManifest().version}`);
    }
});

// === INICIALIZAÇÃO ===
initializeCache();

// Limpeza periódica (a cada hora)
setInterval(cleanupOldData, 60 * 60 * 1000);

console.log('[DiixProxy] Service Worker carregado');