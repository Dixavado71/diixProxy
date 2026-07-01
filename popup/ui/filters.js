/**
 * Filters - Sistema de filtros
 * Gerencia filtros de texto, método e status
 */

export class Filters {
    constructor(onChange) {
        this.onChange = onChange;
        this.searchInput = document.getElementById('filterInput');
        this.methodSelect = document.getElementById('methodFilter');
        this.statusSelect = document.getElementById('statusFilter');
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.searchInput.addEventListener('input', this.debounce(() => this.onChange(), 300));
        this.methodSelect.addEventListener('change', () => this.onChange());
        this.statusSelect.addEventListener('change', () => this.onChange());
    }

    apply(requests) {
        const searchText = this.searchInput.value.toLowerCase();
        const methodFilter = this.methodSelect.value;
        const statusFilter = this.statusSelect.value;

        return requests.filter(req => {
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
    }

    debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), wait);
        };
    }
}