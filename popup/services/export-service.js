/**
 * ExportService - Serviço de exportação de dados
 * Responsável por exportar requisições em diferentes formatos
 */

export class ExportService {
    async exportAsJSON(requests) {
        try {
            const data = JSON.stringify(requests, null, 2);
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `diix-proxy-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();

            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('[ExportService] Erro ao exportar:', error);
            throw error;
        }
    }
}