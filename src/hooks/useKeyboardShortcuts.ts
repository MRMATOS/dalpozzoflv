import { useEffect, useCallback } from 'react';

interface KeyboardShortcuts {
  onFilterQuick?: (index: number) => void;
  onExport?: () => void;
  onSearch?: () => void;
  onNavigateCalendar?: (direction: 'prev' | 'next') => void;
  onEscape?: () => void;
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcuts) => {
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    // Ignorar se o usuário estiver digitando em um input
    if (event.target instanceof HTMLInputElement || 
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement) {
      return;
    }

    // Ctrl + números 1-4 para filtros rápidos
    if (event.ctrlKey && !event.shiftKey && !event.altKey) {
      const number = parseInt(event.key);
      if (number >= 1 && number <= 4 && shortcuts.onFilterQuick) {
        event.preventDefault();
        shortcuts.onFilterQuick(number - 1);
        return;
      }

      // Ctrl + E para exportar
      if (event.key.toLowerCase() === 'e' && shortcuts.onExport) {
        event.preventDefault();
        shortcuts.onExport();
        return;
      }

      // Ctrl + F para buscar
      if (event.key.toLowerCase() === 'f' && shortcuts.onSearch) {
        event.preventDefault();
        shortcuts.onSearch();
        return;
      }

      // Ctrl + setas para navegar calendário
      if (event.key === 'ArrowLeft' && shortcuts.onNavigateCalendar) {
        event.preventDefault();
        shortcuts.onNavigateCalendar('prev');
        return;
      }

      if (event.key === 'ArrowRight' && shortcuts.onNavigateCalendar) {
        event.preventDefault();
        shortcuts.onNavigateCalendar('next');
        return;
      }
    }

    // Esc para fechar modais
    if (event.key === 'Escape' && shortcuts.onEscape) {
      event.preventDefault();
      shortcuts.onEscape();
    }
  }, [shortcuts]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);
};

// Hook específico para componentes que precisam de atalhos simples
export const useSimpleShortcuts = () => {
  const shortcuts = {
    filtroRapido: (callback: (index: number) => void) => 
      useKeyboardShortcuts({ onFilterQuick: callback }),
    
    exportar: (callback: () => void) => 
      useKeyboardShortcuts({ onExport: callback }),
    
    buscar: (callback: () => void) => 
      useKeyboardShortcuts({ onSearch: callback }),
    
    navegarCalendario: (callback: (direction: 'prev' | 'next') => void) => 
      useKeyboardShortcuts({ onNavigateCalendar: callback }),
    
    escape: (callback: () => void) => 
      useKeyboardShortcuts({ onEscape: callback })
  };

  return shortcuts;
};