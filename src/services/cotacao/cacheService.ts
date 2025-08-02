/**
 * Cache Service - Sistema de cache multinível para produtos e aprendizados
 * Implementa cache em memória + IndexedDB para performance otimizada
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
}

interface CacheStats {
  totalEntries: number;
  memoryUsage: number;
  hitRate: number;
  missRate: number;
}

interface PreloadStrategy {
  fornecedor: string;
  priority: number;
  lastUsed: number;
}

class CacheService {
  private memoryCache = new Map<string, CacheEntry<any>>();
  private hitCount = 0;
  private missCount = 0;
  private readonly maxMemoryEntries = 1000;
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutos
  private dbName = 'cotacao_cache';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  constructor() {
    this.initIndexedDB();
  }

  private async initIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Store para produtos
        if (!db.objectStoreNames.contains('produtos')) {
          const produtoStore = db.createObjectStore('produtos', { keyPath: 'key' });
          produtoStore.createIndex('fornecedor', 'fornecedor', { unique: false });
          produtoStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
        
        // Store para aprendizados
        if (!db.objectStoreNames.contains('aprendizados')) {
          const aprendizadoStore = db.createObjectStore('aprendizados', { keyPath: 'key' });
          aprendizadoStore.createIndex('fornecedor', 'fornecedor', { unique: false });
        }
        
        // Store para extrações
        if (!db.objectStoreNames.contains('extracoes')) {
          const extracaoStore = db.createObjectStore('extracoes', { keyPath: 'key' });
          extracaoStore.createIndex('hash', 'hash', { unique: true });
        }
      };
    });
  }

  /**
   * Cache inteligente com TTL baseado no fornecedor
   */
  private getTTLForSupplier(fornecedor: string): number {
    // Fornecedores frequentes têm TTL menor para dados mais frescos
    const frequentSuppliers = ['Ceagesp', 'Mercado Central', 'Fornecedor A'];
    return frequentSuppliers.includes(fornecedor) 
      ? 2 * 60 * 1000  // 2 minutos
      : this.defaultTTL; // 5 minutos
  }

  /**
   * Set com preload inteligente
   */
  async set<T>(key: string, data: T, customTTL?: number, fornecedor?: string): Promise<void> {
    const ttl = customTTL || (fornecedor ? this.getTTLForSupplier(fornecedor) : this.defaultTTL);
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      hits: 0
    };

    // Memory cache
    this.memoryCache.set(key, entry);
    this.cleanupMemoryCache();

    // IndexedDB para persistência
    if (this.db) {
      try {
        const transaction = this.db.transaction(['produtos'], 'readwrite');
        const store = transaction.objectStore('produtos');
        await store.put({
          key,
          data,
          timestamp: entry.timestamp,
          ttl,
          fornecedor: fornecedor || 'unknown'
        });
      } catch (error) {
        console.warn('Erro ao salvar no IndexedDB:', error);
      }
    }
  }

  /**
   * Get com fallback para IndexedDB
   */
  async get<T>(key: string): Promise<T | null> {
    // Tentar memory cache primeiro
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && this.isValidEntry(memoryEntry)) {
      memoryEntry.hits++;
      this.hitCount++;
      return memoryEntry.data as T;
    }

    // Fallback para IndexedDB
    if (this.db) {
      try {
        const transaction = this.db.transaction(['produtos'], 'readonly');
        const store = transaction.objectStore('produtos');
        const request = store.get(key);
        
        return new Promise((resolve) => {
          request.onsuccess = () => {
            const result = request.result;
            if (result && this.isValidTimestamp(result.timestamp, result.ttl)) {
              // Promover para memory cache
              this.memoryCache.set(key, {
                data: result.data,
                timestamp: result.timestamp,
                ttl: result.ttl,
                hits: 1
              });
              this.hitCount++;
              resolve(result.data);
            } else {
              this.missCount++;
              resolve(null);
            }
          };
          request.onerror = () => {
            this.missCount++;
            resolve(null);
          };
        });
      } catch (error) {
        console.warn('Erro ao buscar no IndexedDB:', error);
      }
    }

    this.missCount++;
    return null;
  }

  /**
   * Cache de resultados de extração com hash
   */
  async cacheExtraction(message: string, fornecedor: string, result: any): Promise<void> {
    const hash = this.hashMessage(message);
    const key = `extraction_${fornecedor}_${hash}`;
    await this.set(key, result, this.getTTLForSupplier(fornecedor), fornecedor);
  }

  async getCachedExtraction(message: string, fornecedor: string): Promise<any | null> {
    const hash = this.hashMessage(message);
    const key = `extraction_${fornecedor}_${hash}`;
    return this.get(key);
  }

  /**
   * Preload inteligente de produtos mais utilizados
   */
  async preloadFrequentProducts(): Promise<void> {
    if (!this.db) return;

    try {
      const transaction = this.db.transaction(['produtos'], 'readonly');
      const store = transaction.objectStore('produtos');
      const index = store.index('timestamp');
      
      // Buscar produtos mais recentes
      const request = index.openCursor(null, 'prev');
      const frequentProducts: string[] = [];
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor && frequentProducts.length < 50) {
          const entry = this.memoryCache.get(cursor.key as string);
          if (entry) {
            entry.hits++; // Simular uso para prioridade
          }
          frequentProducts.push(cursor.key as string);
          cursor.continue();
        }
      };
    } catch (error) {
      console.warn('Erro no preload:', error);
    }
  }

  /**
   * Invalidação seletiva por fornecedor
   */
  async invalidateSupplier(fornecedor: string): Promise<void> {
    // Limpar memory cache
    for (const [key, entry] of this.memoryCache.entries()) {
      if (key.includes(fornecedor)) {
        this.memoryCache.delete(key);
      }
    }

    // Limpar IndexedDB
    if (this.db) {
      try {
        const transaction = this.db.transaction(['produtos'], 'readwrite');
        const store = transaction.objectStore('produtos');
        const index = store.index('fornecedor');
        const request = index.openCursor(IDBKeyRange.only(fornecedor));
        
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            cursor.delete();
            cursor.continue();
          }
        };
      } catch (error) {
        console.warn('Erro ao invalidar fornecedor no IndexedDB:', error);
      }
    }
  }

  /**
   * Limpeza automática do memory cache
   */
  private cleanupMemoryCache(): void {
    if (this.memoryCache.size <= this.maxMemoryEntries) return;

    // Remover entradas expiradas primeiro
    const now = Date.now();
    for (const [key, entry] of this.memoryCache.entries()) {
      if (!this.isValidEntry(entry)) {
        this.memoryCache.delete(key);
      }
    }

    // Se ainda tiver muitas entradas, remover as menos usadas
    if (this.memoryCache.size > this.maxMemoryEntries) {
      const entries = Array.from(this.memoryCache.entries())
        .sort(([,a], [,b]) => a.hits - b.hits);
      
      const toRemove = entries.slice(0, Math.floor(this.maxMemoryEntries * 0.1));
      toRemove.forEach(([key]) => this.memoryCache.delete(key));
    }
  }

  private isValidEntry(entry: CacheEntry<any>): boolean {
    return this.isValidTimestamp(entry.timestamp, entry.ttl);
  }

  private isValidTimestamp(timestamp: number, ttl: number): boolean {
    return Date.now() - timestamp < ttl;
  }

  private hashMessage(message: string): string {
    let hash = 0;
    for (let i = 0; i < message.length; i++) {
      const char = message.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Estatísticas do cache
   */
  getStats(): CacheStats {
    const totalRequests = this.hitCount + this.missCount;
    return {
      totalEntries: this.memoryCache.size,
      memoryUsage: this.memoryCache.size * 1024, // Estimativa
      hitRate: totalRequests > 0 ? this.hitCount / totalRequests : 0,
      missRate: totalRequests > 0 ? this.missCount / totalRequests : 0
    };
  }

  /**
   * Limpeza completa
   */
  async clearAll(): Promise<void> {
    this.memoryCache.clear();
    this.hitCount = 0;
    this.missCount = 0;

    if (this.db) {
      try {
        const transaction = this.db.transaction(['produtos', 'aprendizados', 'extracoes'], 'readwrite');
        await Promise.all([
          transaction.objectStore('produtos').clear(),
          transaction.objectStore('aprendizados').clear(),
          transaction.objectStore('extracoes').clear()
        ]);
      } catch (error) {
        console.warn('Erro ao limpar IndexedDB:', error);
      }
    }
  }
}

export const cacheService = new CacheService();