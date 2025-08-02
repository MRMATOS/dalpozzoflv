import { useEffect, useCallback } from 'react';

interface KeyboardShortcuts {
  [key: string]: () => void;
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcuts, enabled: boolean = true) => {
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // Ignorar se o usuário estiver digitando em um input
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
      return;
    }

    // Construir a string da combinação de teclas
    const keyCombo = [
      event.ctrlKey && 'ctrl',
      event.altKey && 'alt', 
      event.shiftKey && 'shift',
      event.key.toLowerCase()
    ].filter(Boolean).join('+');

    // Verificar se existe um atalho para esta combinação
    if (shortcuts[keyCombo]) {
      event.preventDefault();
      shortcuts[keyCombo]();
    }
  }, [shortcuts, enabled]);

  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyPress);
      return () => document.removeEventListener('keydown', handleKeyPress);
    }
  }, [handleKeyPress, enabled]);
};

// Hook específico para cotação
export const useCotacaoShortcuts = (actions: {
  onSalvarRascunho?: () => void;
  onRestaurarCotacao?: () => void;
  onNovaCotacao?: () => void;
  onAdicionarProduto?: () => void;
  onVerResumo?: () => void;
  onProcessarMensagem?: () => void;
}) => {
  const shortcuts: KeyboardShortcuts = {
    'ctrl+s': () => actions.onSalvarRascunho?.(),
    'ctrl+r': () => actions.onRestaurarCotacao?.(),
    'ctrl+n': () => actions.onNovaCotacao?.(),
    'ctrl+plus': () => actions.onAdicionarProduto?.(),
    'ctrl+enter': () => actions.onVerResumo?.(),
    'f2': () => actions.onProcessarMensagem?.(),
  };

  useKeyboardShortcuts(shortcuts, true);

  // Retornar ajuda para exibir ao usuário
  return {
    shortcuts: [
      { key: 'Ctrl + S', description: 'Salvar rascunho' },
      { key: 'Ctrl + R', description: 'Restaurar cotação' },
      { key: 'Ctrl + N', description: 'Nova cotação' },
      { key: 'Ctrl + +', description: 'Adicionar produto' },
      { key: 'Ctrl + Enter', description: 'Ver resumo' },
      { key: 'F2', description: 'Processar mensagem' }
    ]
  };
};