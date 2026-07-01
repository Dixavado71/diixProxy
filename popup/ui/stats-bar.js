/**
 * StatsBar - Componente de estatísticas
 * Exibe estatísticas em tempo real das requisições
 */

export class StatsBar {
    constructor() {
        this.totalEl = document.getElementById('totalRequests');
        this.successEl = document.getElementById('successRequests');
        this.errorEl = document.getElementById('errorRequests');
        this.pendingEl = document.getElementById('pendingRequests');
    }

    update(requests) {
        const total = requests.length;
        const success = requests.filter(r => r.statusCode >= 200 && r.statusCode < 400).length;
        const errors = requests.filter(r => r.statusCode >= 400 || r.statusCode === 0).length;
        const pending = requests.filter(r => !r.statusCode).length;

        this.totalEl.textContent = total;
        this.successEl.textContent = success;
        this.errorEl.textContent = errors;
        this.pendingEl.textContent = pending;
    }
}