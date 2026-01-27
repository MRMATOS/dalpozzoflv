import { useState, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STORAGE_KEY = 'system_announcement_dismissed_at';
const HOUR_IN_MS = 60 * 60 * 1000; // 1 hora em milissegundos

const SystemAnnouncement = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const checkVisibility = () => {
      const dismissedAt = localStorage.getItem(STORAGE_KEY);
      
      if (!dismissedAt) {
        setIsVisible(true);
        return;
      }

      const dismissedTime = parseInt(dismissedAt, 10);
      const now = Date.now();
      
      // Se passou mais de 1 hora desde que foi fechado, mostrar novamente
      if (now - dismissedTime >= HOUR_IN_MS) {
        setIsVisible(true);
      }
    };

    // Verificar na montagem
    checkVisibility();

    // Verificar a cada minuto se deve mostrar o aviso novamente
    const interval = setInterval(checkVisibility, 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="bg-amber-500 text-white px-3 py-2 sm:px-4 sm:py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
          <p className="text-xs sm:text-sm font-medium truncate sm:whitespace-normal">
            <span className="hidden sm:inline">⚠️ Aviso Importante: </span>
            Amanhã o sistema será desativado para manutenção.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="h-6 w-6 p-0 hover:bg-amber-600 text-white flex-shrink-0"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Fechar aviso</span>
        </Button>
      </div>
    </div>
  );
};

export default SystemAnnouncement;
