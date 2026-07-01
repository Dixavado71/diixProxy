/**
 * Types - Definições de tipos
 * Documentação de tipos de dados (JSDoc)
 */

/**
 * @typedef {Object} Request
 * @property {string} id - ID único da requisição
 * @property {number} tabId - ID da aba
 * @property {string} url - URL completa
 * @property {string} method - Método HTTP (GET, POST, etc)
 * @property {string} type - Tipo de requisição
 * @property {number} timestamp - Timestamp em ms
 * @property {string} time - Hora formatada
 * @property {string} date - Data formatada
 * @property {string} domain - Domínio extraído
 * @property {Object|null} requestBody - Corpo da requisição
 * @property {Array|null} requestHeaders - Headers da requisição
 * @property {number|null} statusCode - Código de status HTTP
 * @property {Array|null} responseHeaders - Headers da resposta
 * @property {number|null} duration - Duração em ms
 * @property {string|null} ip - IP do servidor
 * @property {string|null} error - Mensagem de erro
 */

/**
 * @typedef {Object} Message
 * @property {string} action - Ação a ser executada
 * @property {*} [data] - Dados opcionais
 */

/**
 * @typedef {Object} MessageResponse
 * @property {boolean} success - Se a operação foi bem-sucedida
 * @property {*} [data] - Dados de resposta
 * @property {string} [error] - Mensagem de erro
 */