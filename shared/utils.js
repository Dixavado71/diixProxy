/**
 * Utils - Utilitários compartilhados
 * Funções utilitárias usadas em múltiplos módulos
 */

export function generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function extractDomain(url) {
    try {
        return new URL(url).hostname;
    } catch {
        return 'unknown';
    }
}

export function formatDate(timestamp) {
    const date = new Date(timestamp);
    return {
        date: date.toLocaleDateString('pt-BR'),
        time: date.toLocaleTimeString('pt-BR', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        })
    };
}