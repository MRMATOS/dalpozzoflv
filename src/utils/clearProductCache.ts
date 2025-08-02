// Utilitário para limpar cache de produtos e forçar recarregamento
import { clearProductCache } from './productExtraction/productUtils';

export const forceProductCacheReload = () => {
  console.log('🔄 Limpando cache de produtos...');
  clearProductCache();
  
  // Limpar também outros caches relacionados
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => {
        if (name.includes('product') || name.includes('extraction')) {
          caches.delete(name);
        }
      });
    });
  }
  
  console.log('✅ Cache de produtos limpo - próxima extração recarregará dados atualizados');
};

// Executar limpeza automática ao carregar este módulo
forceProductCacheReload();