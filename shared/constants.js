/**
 * Constants - Constantes globais
 * Constantes compartilhadas entre background e popup
 */

export const STORAGE_KEY = 'diix_requests';
export const MAX_REQUESTS = 1000;
export const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hora
export const MAX_DATA_AGE_MS = 24 * 60 * 60 * 1000; // 24 horas

export const MONITORED_TYPES = [
    'main_frame',
    'sub_frame',
    'xmlhttprequest',
    'fetch'
];