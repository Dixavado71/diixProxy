/**
 * ClipboardService - Serviço de clipboard
 * Gerencia cópia de texto para clipboard
 */

export class ClipboardService {
    async copy(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showToast('Copiado! ✅');
        } catch (error) {
            console.error('[ClipboardService] Erro ao copiar:', error);
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
}