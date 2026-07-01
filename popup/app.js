/**
 * App - Controller principal da aplicação
 * Orquestra todos os módulos da UI
 */

import { StorageService } from './services/storage-service.js';
import { RequestList } from './ui/request-list.js';
import { DetailsPanel } from './ui/details-panel.js';
import { StatsBar } from './ui/stats-bar.js';
import { Filters } from './ui/filters.js';
import { ExportService } from './services/export-service.js';

export class App {
    constructor() {
        this.storageService = new StorageService();
        this.requestList = null;
        this.detailsPanel = null;
        this.statsBar = null;
        this.filters = null;
        this.exportService = new ExportService();
    }

    async initialize() {
        try {
            console.log('[App] Inicializando aplicação...');

            // Inicializar serviços
            await this.storageService.initialize();

            // Inicializar componentes UI
            this.statsBar = new StatsBar();
            this.filters = new Filters(this.onFilterChange.bind(this));
            this.requestList = new RequestList(this.onRequestSelect.bind(this));
            this.detailsPanel = new DetailsPanel();

            // Configurar event listeners
            this.setupEventListeners();

            // Carregar dados iniciais
            await this.loadInitialData();

            // Configurar listener de mudanças no storage
            this.setupStorageListener();

            console.log('[App] Aplicação inicializada com sucesso');
        } catch (error) {
            console.error('[App] Erro ao inicializar:', error);
        }
    }

    setupEventListeners() {
        // Botões do header
        document.getElementById('btnExport').addEventListener('click', () => this.exportData());
        document.getElementById('btnClear').addEventListener('click', () => this.clearRequests());
    }

    async loadInitialData() {
        const requests = await this.storageService.getAllRequests();
        this.updateUI(requests);
    }

    setupStorageListener() {
        chrome.storage.onChanged.addListener((changes, area) => {
            if (area === 'local' && changes.diix_requests) {
                const requests = changes.diix_requests.newValue || [];
                this.updateUI(requests);
            }
        });
    }

    updateUI(requests) {
        const filteredRequests = this.filters.apply(requests);
        
        this.requestList.render(filteredRequests);
        this.statsBar.update(requests);
    }

    onFilterChange() {
        const requests = this.storageService.getAllRequests();
        this.updateUI(requests);
    }

    onRequestSelect(request) {
        this.detailsPanel.show(request);
    }

    async exportData() {
        try {
            const requests = this.storageService.getAllRequests();
            await this.exportService.exportAsJSON(requests);
        } catch (error) {
            console.error('[App] Erro ao exportar:', error);
        }
    }

    async clearRequests() {
        if (!confirm('Tem certeza que deseja limpar todas as requisições?')) return;

        try {
            await this.storageService.clearAll();
            this.updateUI([]);
            this.detailsPanel.hide();
        } catch (error) {
            console.error('[App] Erro ao limpar:', error);
        }
    }
}