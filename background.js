let requests = [];

async function saveRequests() {
    await chrome.storage.local.set({
        requests
    });
}

chrome.webRequest.onBeforeRequest.addListener(
    async (details) => {
        // Only process main_frame requests to avoid duplicates or excessive logging
        if (details.type === "main_frame" || details.type === "xmlhttprequest" || details.type === "sub_frame") {
            requests.push({
                id: Date.now(),
                url: details.url,
                method: details.method,
                time: new Date().toLocaleTimeString(),
                requestHeaders: details.requestHeaders || null,
                // requestBody is only available in onBeforeRequest for certain types (e.g., POST).
                // For full body content, need to use webRequest.onBeforeRequest with blocking and read body manually,
                // or onBeforeSendHeaders + onSendHeaders for headers. Simpler approach for now.
                // For webRequest.onBeforeRequest, details.requestBody is only populated if the request has a body and
                // the 'requestBody' extraInfoSpec is specified (which requires 'webRequestBlocking').
                // However, directly accessing the raw body content in a non-blocking listener is not straightforward.
                // We'll capture what's available.
                requestBody: details.requestBody || null
            });

            if (requests.length > 500) {
                requests.shift();
            }

            await saveRequests();
        }
    },
    {
        urls: ["<all_urls>"]
    },
    ["requestBody"]
);

// Adiciona um listener para onBeforeSendHeaders para capturar headers de requisição com mais detalhes.
// Nota: onBeforeSendHeaders é mais adequado para capturar headers antes de serem enviados.
// Para capturar o corpo da requisição POST, é mais complexo e pode exigir o uso de webRequest.onBeforeRequest
// com a opção 'blocking' e a leitura manual do corpo (o que não é diretamente suportado para todos os casos em MV3).
// Por enquanto, o 'requestBody' em onBeforeRequest já captura o que é possível.
chrome.webRequest.onBeforeSendHeaders.addListener(
    (details) => {
        const reqIndex = requests.findIndex(r => r.id === details.tabId && r.url === details.url && r.method === details.method);
        if (reqIndex !== -1) {
            requests[reqIndex].requestHeaders = details.requestHeaders;
            saveRequests();
        }
    },
    {
        urls: ["<all_urls>"]
    },
    ["requestHeaders", "blocking"]
);
