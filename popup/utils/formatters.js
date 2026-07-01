/**
 * Formatters - Funções de formatação
 * Responsável por formatar dados para exibição
 */

export function formatUrl(url) {
    if (url.length <= 60) return url;
    
    try {
        const parsed = new URL(url);
        const path = parsed.pathname + parsed.search;
        
        if (path.length > 40) {
            return parsed.origin + path.substring(0, 37) + '...';
        }
        
        return parsed.origin + path;
    } catch {
        return url.substring(0, 57) + '...';
    }
}

export function getStatusClass(statusCode) {
    if (!statusCode) return 'status-pending';
    if (statusCode >= 200 && statusCode < 300) return 'status-success';
    if (statusCode >= 300 && statusCode < 400) return 'status-redirect';
    if (statusCode >= 400 && statusCode < 500) return 'status-client-error';
    if (statusCode >= 500) return 'status-server-error';
    if (statusCode === 0) return 'status-failed';
    return 'status-pending';
}

export function getMethodClass(method) {
    const classes = {
        'GET': 'method-get',
        'POST': 'method-post',
        'PUT': 'method-put',
        'DELETE': 'method-delete',
        'PATCH': 'method-patch'
    };
    return classes[method] || 'method-other';
}

export function getStatusText(statusCode) {
    const texts = {
        200: 'OK', 201: 'Created', 204: 'No Content',
        301: 'Moved', 302: 'Found', 304: 'Not Modified',
        400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden',
        404: 'Not Found', 429: 'Too Many Requests',
        500: 'Server Error', 502: 'Bad Gateway', 503: 'Unavailable'
    };
    return texts[statusCode] || '';
}

export function formatPayload(requestBody) {
    if (!requestBody) return 'N/A';

    if (requestBody.formData) {
        return JSON.stringify(requestBody.formData, null, 2);
    }

    if (requestBody.raw && requestBody.raw.length > 0) {
        try {
            const bytes = new Uint8Array(requestBody.raw[0].bytes || []);
            const decoded = new TextDecoder('utf-8').decode(bytes);
            
            try {
                return JSON.stringify(JSON.parse(decoded), null, 2);
            } catch {
                return decoded || 'Dados binários';
            }
        } catch {
            return 'Dados raw (não decodificado)';
        }
    }

    return 'N/A';
}

export function generateCurl(request) {
    let curl = `curl -X ${request.method} '${request.url}'`;

    if (request.requestHeaders) {
        request.requestHeaders.forEach(h => {
            curl += ` \\\n  -H '${h.name}: ${h.value}'`;
        });
    }

    if (request.requestBody) {
        const payload = formatPayload(request.requestBody);
        if (payload !== 'N/A') {
            curl += ` \\\n  -d '${payload.replace(/'/g, "'\\''")}'`;
        }
    }

    return curl;
}