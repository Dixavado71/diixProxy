/**
 * DetailsPanel - Painel de detalhes da requisição
 * Exibe informações detalhadas sobre uma requisição selecionada
 */

import { formatPayload, generateCurl } from '../utils/formatters.js';
import { getStatusClass, getMethodClass, getStatusText } from '../utils/formatters.js';
import { ClipboardService } from '../services/clipboard.js';

export class DetailsPanel {
    constructor() {
        this.panel = document.getElementById('detailsPanel');
        this.closeButton = document.getElementById('closeDetails');
        this.clipboard = new ClipboardService();
        
        this.setupEventListeners();
        this.setupTabs();
    }

    setupEventListeners() {
        this.closeButton.addEventListener('click', () => this.hide());

        // Copy buttons
        document.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetId = e.currentTarget.dataset.target;
                const element = document.getElementById(targetId);
                this.clipboard.copy(element.textContent);
            });
        });
    }

    setupTabs() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });
    }

    show(request) {
        this.panel.style.display = 'flex';
        this.populateDetails(request);
    }

    hide() {
        this.panel.style.display = 'none';
    }

    populateDetails(request) {
        // Status badge
        const statusClass = getStatusClass(request.statusCode);
        const statusText = request.error ? `❌ ${request.error}` :
                          request.statusCode ? `${request.statusCode} ${getStatusText(request.statusCode)}` :
                          '⏳ Pendente';

        document.getElementById('detailStatus').innerHTML = 
            `<span class="status-badge-large ${statusClass}">${statusText}</span>`;

        // Info grid
        document.getElementById('detailUrl').textContent = request.url;
        
        const methodEl = document.getElementById('detailMethod');
        methodEl.textContent = request.method;
        methodEl.className = `request-method ${getMethodClass(request.method)}`;
        
        const statusEl = document.getElementById('detailStatusCode');
        statusEl.textContent = request.statusCode || 'Pendente';
        statusEl.className = `request-status ${statusClass}`;
        
        document.getElementById('detailType').textContent = request.type || '-';
        document.getElementById('detailDuration').textContent = request.duration ? `${request.duration}ms` : '-';
        document.getElementById('detailDomain').textContent = request.domain || '-';
        document.getElementById('detailTime').textContent = `${request.date || ''} ${request.time}`;

        // Headers
        const requestHeaders = this.formatHeaders(request.requestHeaders);
        document.getElementById('requestHeaders').textContent = requestHeaders;

        // Payload
        document.getElementById('requestPayload').textContent = formatPayload(request.requestBody);

        // Response headers
        const responseHeaders = this.formatHeaders(request.responseHeaders);
        document.getElementById('responseHeaders').textContent = responseHeaders;

        // cURL
        document.getElementById('curlCommand').textContent = generateCurl(request);
    }

    formatHeaders(headers) {
        if (!headers || headers.length === 0) {
            return 'Nenhum header capturado';
        }

        const headersObj = {};
        headers.forEach(h => {
            headersObj[h.name] = h.value;
        });

        return JSON.stringify(headersObj, null, 2);
    }

    switchTab(tabName) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.toggle('active', pane.id === `tab-${tabName}`);
        });
    }
}