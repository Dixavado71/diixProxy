/**
 * Diix Proxy - Popup Controller
 * Interface profissional para monitoramento de rede
 * Versão: 2.0.0
 */

class DiixProxyUI {
    constructor() {
        this.allRequests = [];
        this.filteredRequests = [];
        this.selectedRequest = null;
        
        this.initElements();
        this.initEventListeners();
        this.loadRequests();
        this.initStorageListener();
    }

    initElements() {
        this.elements = {
            requestList: document.getElementById('requestList'),
            filterInput: document.getElementById('filterInput'),
            methodFilter: document.getElementById('methodFilter'),
            statusFilter: document.getElementById('statusFilter'),
            detailsPanel: document.getElementById('detailsPanel'),
            emptyState: document.getElementById('emptyState'),
            closeDetails: document.getElementById('closeDetails'),
            btnExport: document.getElementById('btnExport'),
            btnClear: document.getElementById('btnClear'),
            totalRequests: document.getElementById('totalRequests'),
            successRequests: document.getElementById('successRequests'),
            errorRequests: document.getElementById('errorRequests'),
            pendingRequests: document.getElementById('pendingRequests'),
            storageUsed: document.getElementById('storageUsed'),
            detailUrl: document.getElementById('detailUrl'),
            detailMethod: document.getElementById('detailMethod'),
            detailStatusCode: document.getElementById('detailStatusCode'),
            detailType: document.getElementById('detailType'),
            detailDuration: document.getElementById('detailDuration'),
            detailDomain: document.getElementById('detailDomain'),
            detailTime: document.getElementById('detailTime'),
            detailStatus: document.getElementById('detailStatus'),
            requestHeaders: document.getElementById('requestHeaders'),
            requestPayload: document.getElementById('requestPayload'),
            responseHeaders: document.getElementById('responseHeaders'),
            curlCommand: document.getElementById('curlCommand')
        };
    }

    initEventListeners() {
        // Filtros
        this.elements.filterInput.addEventListener('input', this.debounce(() => this.filterRequests(), 300));
        this.elements.methodFilter.addEventListener('change', () => this.filterRequests());
        this.elements.statusFilter.addEventListener('change', () => this.filterRequests());

        // Detalhes
        this.elements.closeDetails.addEventListener('click', () => this.hideDetails());

        // Ações
        this.elements.btnExport.addEventListener('click', () => this.exportData());
        this.elements.btnClear.addEventListener('click', () => this.clearRequests());

        // Tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Copy buttons
        document.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.copyToClipboard(e));
        });
    }

    /**
     * Listener REATIVO para mudanças no storage (substitui setInterval!)
     */
    initStorageListener() {
        chrome.storage.onChanged.addListener((changes, area) => {
            if (area === 'local' && changes.diix_requests) {
                this.allRequests = changes.diix_requests.newValue || [];
                this.filterRequests();
                this.updateStats();
            }
        });
    }

    /**
     * Carrega requisições do storage
     */
    async loadRequests() {
        try {
            const data = await chrome.storage.local.get('diix_requests');
            this.allRequests = data.diix_requests || [];
            this.filterRequests();
            this.updateStats();
            this.updateStorageUsage();
        } catch (error) {
            console.error('[DiixProxy] Erro ao carregar:', error);
        }
    }

    /**
     * Filtra requisições baseado nos critérios
     */
    filterRequests() {
        const searchText = this.elements.filterInput.value.toLowerCase();
        const methodFilter = this.elements.methodFilter.value;
        const statusFilter = this.elements.statusFilter.value;

        this.filteredRequests = this.allRequests.filter(req => {
            // Filtro de texto
            if (searchText) {
                const matchesUrl = req.url.toLowerCase().includes(searchText);
                const matchesMethod = req.method.toLowerCase().includes(searchText);
                const matchesDomain = (req.domain || '').toLowerCase().includes(searchText);
                if (!matchesUrl && !matchesMethod && !matchesDomain) return false;
            }

            // Filtro de método
            if (methodFilter && req.method !== methodFilter) return false;

            // Filtro de status
            if (statusFilter) {
                const status = req.statusCode || 0;
                if (statusFilter === '2xx' && !(status >= 200 && status < 300)) return false;
                if (statusFilter === '3xx' && !(status >= 300 && status < 400)) return false;
                if (statusFilter === '4xx' && !(status >= 400 && status < 500)) return false;
                if (statusFilter === '5xx' && !(status >= 500 && status < 600)) return false;
                if (statusFilter === '0' && status !== 0) return false;
            }

            return true;
        });

        this.renderRequests();
    }

    /**
     * Renderiza a lista de requisições
     */
    renderRequests() {
        const list = this.elements.requestList;
        list.innerHTML = '';

        if (this.filteredRequests.length === 0) {
            this.elements.emptyState.style.display = 'flex';
            list.style.display = 'none';
            return;
        }

        this.elements.emptyState.style.display = 'none';
        list.style.display = 'block';

        // Renderizar apenas os últimos 100 para performance
        const toRender = this.filteredRequests.slice(-100).reverse();

        const fragment = document.createDocumentFragment();
        
        toRender.forEach(req => {
            const li = document.createElement('li');
            li.className = `request-item ${this.getStatusClass(req.statusCode)}`;
            
            if (this.selectedRequest && this.selectedRequest.id === req.id) {
                li.classList.add('selected');
            }

            li.innerHTML = `
                <div class="request-method ${this.getMethodClass(req.method)}">${req.method}</div>
                <div class="request-info">
                    <div class="request-url" title="${this.escapeHtml(req.url)}">${this.escapeHtml(this.truncateUrl(req.url))}</div>
                    <div class="request-meta">
                        <span class="request-domain">${req.domain || '...'}</span>
                        <span class="request-time">${req.time}</span>
                    </div>
                </div>
                <div class="request-status ${this.getStatusClass(req.statusCode)}">
                    ${req.statusCode || '...'}
                </div>
                ${req.duration ? `<div class="request-duration">${req.duration}ms</div>` : ''}
            `;

            li.addEventListener('click', () => this.selectRequest(req));
            fragment.appendChild(li);
        });

        list.appendChild(fragment);
    }

    /**
     * Seleciona uma requisição e mostra detalhes
     */
    selectRequest(req) {
        this.selectedRequest = req;
        this.renderRequests();
        this.showDetails(req);
    }

    /**
     * Mostra painel de detalhes
     */
    showDetails(req) {
        this.elements.detailsPanel.style.display = 'flex';
        
        // Status badge
        const statusClass = this.getStatusClass(req.statusCode);
        const statusText = req.error ? `❌ ${req.error}` : 
                          req.statusCode ? `${req.statusCode} ${this.getStatusText(req.statusCode)}` : 
                          '⏳ Pendente';
        
        this.elements.detailStatus.innerHTML = `<span class="status-badge-large ${statusClass}">${statusText}</span>`;

        // Info
        this.elements.detailUrl.textContent = req.url;
        this.elements.detailMethod.textContent = req.method;
        this.elements.detailMethod.className = `request-method ${this.getMethodClass(req.method)}`;
        
        this.elements.detailStatusCode.textContent = req.statusCode || 'Pendente';
        this.elements.detailStatusCode.className = `request-status ${statusClass}`;
        
        this.elements.detailType.textContent = req.type || '-';
        this.elements.detailDuration.textContent = req.duration ? `${req.duration}ms` : '-';
        this.elements.detailDomain.textContent = req.domain || '-';
        this.elements.detailTime.textContent = `${req.date || ''} ${req.time}`;

        // Headers
        if (req.requestHeaders && req.requestHeaders.length > 0) {
            const headersObj = {};
            req.requestHeaders.forEach(h => { headersObj[h.name] = h.value; });
            this.elements.requestHeaders.textContent = JSON.stringify(headersObj, null, 2);
        } else {
            this.elements.requestHeaders.textContent = 'Nenhum header capturado';
        }

        // Payload
        this.elements.requestPayload.textContent = this.formatPayload(req.requestBody);

        // Response Headers
        if (req.responseHeaders && req.responseHeaders.length > 0) {
            const respObj = {};
            req.responseHeaders.forEach(h => { respObj[h.name] = h.value; });
            this.elements.responseHeaders.textContent = JSON.stringify(respObj, null, 2);
        } else {
            this.elements.responseHeaders.textContent = 'Nenhum header de resposta capturado';
        }

        // cURL command
        this.elements.curlCommand.textContent = this.generateCurl(req);
    }

    hideDetails() {
        this.elements.detailsPanel.style.display = 'none';
        this.selectedRequest = null;
        this.renderRequests();
    }

    switchTab(tabName) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.toggle('active', pane.id === `tab-${tabName}`);
        });
    }

    /**
     * Atualiza estatísticas
     */
    updateStats() {
        const total = this.allRequests.length;
        const success = this.allRequests.filter(r => r.statusCode >= 200 && r.statusCode < 400).length;
        const errors = this.allRequests.filter(r => r.statusCode >= 400 || r.statusCode === 0).length;
        const pending = this.allRequests.filter(r => !r.statusCode).length;

        this.elements.totalRequests.textContent = total;
        this.elements.successRequests.textContent = success;
        this.elements.errorRequests.textContent = errors;
        this.elements.pendingRequests.textContent = pending;
    }

    /**
     * Atualiza uso de storage
     */
    async updateStorageUsage() {
        try {
            const bytesInUse = await chrome.storage.local.getBytesInUse();
            const kb = (bytesInUse / 1024).toFixed(1);
            this.elements.storageUsed.textContent = `${kb} KB em uso`;
        } catch (e) {
            this.elements.storageUsed.textContent = 'N/A';
        }
    }

    /**
     * Exporta dados como JSON
     */
    async exportData() {
        try {
            const data = JSON.stringify(this.allRequests, null, 2);
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `diix-proxy-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            
            URL.revokeObjectURL(url);
            this.showToast('Exportado com sucesso! ✅');
        } catch (error) {
            console.error('[DiixProxy] Erro ao exportar:', error);
            this.showToast('Erro ao exportar ❌');
        }
    }

    /**
     * Limpa todas as requisições
     */
    async clearRequests() {
        if (!confirm('Tem certeza que deseja limpar todas as requisições?')) return;
        
        try {
            await chrome.runtime.sendMessage({ action: 'clearRequests' });
            this.allRequests = [];
            this.filteredRequests = [];
            this.selectedRequest = null;
            this.hideDetails();
            this.renderRequests();
            this.updateStats();
            this.showToast('Requisições limpas! 🗑️');
        } catch (error) {
            console.error('[DiixProxy] Erro ao limpar:', error);
        }
    }

    /**
     * Copia conteúdo para clipboard
     */
    async copyToClipboard(event) {
        const targetId = event.currentTarget.dataset.target;
        const element = document.getElementById(targetId);
        const text = element.textContent;

        try {
            await navigator.clipboard.writeText(text);
            this.showToast('Copiado! ✅');
        } catch (err) {
            this.showToast('Erro ao copiar ❌');
        }
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }

    // === UTILITÁRIOS ===

    generateCurl(req) {
        let curl = `curl -X ${req.method} '${req.url}'`;
        
        if (req.requestHeaders) {
            req.requestHeaders.forEach(h => {
                curl += ` \\\n  -H '${h.name}: ${h.value}'`;
            });
        }

        if (req.requestBody) {
            const payload = this.formatPayload(req.requestBody);
            if (payload !== 'N/A') {
                curl += ` \\\n  -d '${payload.replace(/'/g, "'\\''")}'`;
            }
        }

        return curl;
    }

    formatPayload(requestBody) {
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

    getStatusClass(statusCode) {
        if (!statusCode) return 'status-pending';
        if (statusCode >= 200 && statusCode < 300) return 'status-success';
        if (statusCode >= 300 && statusCode < 400) return 'status-redirect';
        if (statusCode >= 400 && statusCode < 500) return 'status-client-error';
        if (statusCode >= 500) return 'status-server-error';
        if (statusCode === 0) return 'status-failed';
        return 'status-pending';
    }

    getStatusText(statusCode) {
        const texts = {
            200: 'OK', 201: 'Created', 204: 'No Content',
            301: 'Moved', 302: 'Found', 304: 'Not Modified',
            400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden',
            404: 'Not Found', 429: 'Too Many Requests',
            500: 'Server Error', 502: 'Bad Gateway', 503: 'Unavailable'
        };
        return texts[statusCode] || '';
    }

    getMethodClass(method) {
        const classes = {
            'GET': 'method-get',
            'POST': 'method-post',
            'PUT': 'method-put',
            'DELETE': 'method-delete',
            'PATCH': 'method-patch'
        };
        return classes[method] || 'method-other';
    }

    truncateUrl(url) {
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

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), wait);
        };
    }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    new DiixProxyUI();
});