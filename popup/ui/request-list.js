/**
 * RequestList - Componente de lista de requisições
 * Responsável por renderizar a lista de requisições
 */

import { formatUrl, getStatusClass, getMethodClass } from '../utils/formatters.js';
import { escapeHtml } from '../utils/helpers.js';

export class RequestList {
    constructor(onSelect) {
        this.onSelect = onSelect;
        this.listElement = document.getElementById('requestList');
        this.emptyState = document.getElementById('emptyState');
        this.selectedRequest = null;
    }

    render(requests) {
        this.listElement.innerHTML = '';

        if (requests.length === 0) {
            this.showEmptyState();
            return;
        }

        this.hideEmptyState();

        // Renderizar apenas os últimos 100 para performance
        const toRender = requests.slice(-100).reverse();
        const fragment = document.createDocumentFragment();

        toRender.forEach(request => {
            const item = this.createRequestItem(request);
            fragment.appendChild(item);
        });

        this.listElement.appendChild(fragment);
    }

    createRequestItem(request) {
        const li = document.createElement('li');
        li.className = `request-item ${getStatusClass(request.statusCode)}`;

        if (this.selectedRequest && this.selectedRequest.id === request.id) {
            li.classList.add('selected');
        }

        li.innerHTML = `
            <div class="request-method ${getMethodClass(request.method)}">${request.method}</div>
            <div class="request-info">
                <div class="request-url" title="${escapeHtml(request.url)}">
                    ${escapeHtml(formatUrl(request.url))}
                </div>
                <div class="request-meta">
                    <span class="request-domain">${request.domain || '...'}</span>
                    <span class="request-time">${request.time}</span>
                </div>
            </div>
            <div class="request-status ${getStatusClass(request.statusCode)}">
                ${request.statusCode || '...'}
            </div>
            ${request.duration ? `<div class="request-duration">${request.duration}ms</div>` : ''}
        `;

        li.addEventListener('click', () => this.selectRequest(request));

        return li;
    }

    selectRequest(request) {
        this.selectedRequest = request;
        this.onSelect(request);
        
        // Re-render para atualizar seleção visual
        const items = this.listElement.querySelectorAll('.request-item');
        items.forEach(item => item.classList.remove('selected'));
        
        const index = Array.from(items).findIndex(item => 
            item.querySelector('.request-url')?.title === request.url
        );
        
        if (index >= 0) {
            items[index].classList.add('selected');
        }
    }

    showEmptyState() {
        this.emptyState.style.display = 'flex';
        this.listElement.style.display = 'none';
    }

    hideEmptyState() {
        this.emptyState.style.display = 'none';
        this.listElement.style.display = 'block';
    }
}