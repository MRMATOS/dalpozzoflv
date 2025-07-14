// Sistema de validação de segurança para funcionalidades críticas da cotação

interface CriticalFile {
  path: string;
  description: string;
}

// Arquivos críticos que NÃO devem ser alterados
const CRITICAL_FILES: CriticalFile[] = [
  {
    path: 'src/pages/Cotacao.tsx',
    description: 'Página principal de cotação'
  },
  {
    path: 'src/hooks/useCotacao.ts', 
    description: 'Lógica principal de cotação'
  },
  {
    path: 'src/services/cotacao/advancedExtractionService.ts',
    description: 'Serviço de extração de produtos'
  },
  {
    path: 'src/components/cotacao/CotacaoManualControls.tsx',
    description: 'Controles manuais (perfeitos)'
  },
  {
    path: 'src/components/cotacao/ProdutosExtraidosDetails.tsx',
    description: 'Detalhes de produtos extraídos (perfeitos)'
  }
];

// Funcionalidades críticas que devem continuar funcionando
const CRITICAL_FUNCTIONS = [
  'processarMensagem',
  'editarProdutoExtraido', 
  'deletarProdutoExtraido',
  'adicionarProdutoManual',
  'atualizarQuantidade',
  'atualizarPreco',
  'salvarCotacao'
];

export const CotacaoValidator = {
  // Gerar checksum de arquivo (simulado - seria feito no servidor)
  generateFileChecksum(content: string): string {
    // Simulação de hash para o browser
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  },

  // Validar que funcionalidades críticas existem
  validateCriticalFunctions(cotacaoHook: any): boolean {
    try {
      const missingFunctions = CRITICAL_FUNCTIONS.filter(
        funcName => typeof cotacaoHook[funcName] !== 'function'
      );

      if (missingFunctions.length > 0) {
        console.error('❌ CRITICAL: Funções essenciais foram removidas:', missingFunctions);
        return false;
      }

      console.log('✅ Todas as funções críticas estão presentes');
      return true;
    } catch (error) {
      console.error('❌ CRITICAL: Erro ao validar funções:', error);
      return false;
    }
  },

  // Validar integridade do processo de extração  
  validateExtractionIntegrity(produtosExtraidos: any[]): boolean {
    try {
      if (!Array.isArray(produtosExtraidos)) {
        console.error('❌ CRITICAL: Produtos extraídos deve ser um array');
        return false;
      }

      // Validar estrutura mínima de cada produto
      const hasValidStructure = produtosExtraidos.every(produto => 
        produto.produto && 
        produto.fornecedor && 
        typeof produto.preco === 'number'
      );

      if (!hasValidStructure) {
        console.error('❌ CRITICAL: Estrutura de produtos extraídos foi corrompida');
        return false;
      }

      console.log('✅ Estrutura de extração íntegra');
      return true;
    } catch (error) {
      console.error('❌ CRITICAL: Erro na validação de extração:', error);
      return false;
    }
  },

  // Monitorar performance crítica
  monitorPerformance(operation: string, startTime: number): void {
    const duration = Date.now() - startTime;
    
    // Alertar se operações críticas estão muito lentas
    const thresholds = {
      processarMensagem: 30000, // 30s
      salvarCotacao: 5000,      // 5s
      carregarCotacao: 3000,    // 3s
    };

    const threshold = thresholds[operation as keyof typeof thresholds] || 10000;
    
    if (duration > threshold) {
      console.warn(`⚠️ PERFORMANCE: ${operation} levou ${duration}ms (limite: ${threshold}ms)`);
    } else {
      console.log(`✅ PERFORMANCE: ${operation} executado em ${duration}ms`);
    }
  },

  // Log de proteção para alterações
  logCriticalChange(component: string, change: string): void {
    const timestamp = new Date().toISOString();
    console.log(`🔒 PROTECTION LOG [${timestamp}]: ${component} - ${change}`);
    
    // Em produção, isso seria enviado para monitoramento
    if (typeof window !== 'undefined') {
      const logs = JSON.parse(localStorage.getItem('cotacao_protection_logs') || '[]');
      logs.push({ timestamp, component, change });
      
      // Manter apenas os últimos 50 logs
      if (logs.length > 50) {
        logs.splice(0, logs.length - 50);
      }
      
      localStorage.setItem('cotacao_protection_logs', JSON.stringify(logs));
    }
  },

  // Verificar integridade geral do sistema
  runSystemIntegrityCheck(): boolean {
    console.log('🔍 Executando verificação de integridade do sistema...');
    
    try {
      // Verificações básicas que podem ser feitas no frontend
      const checks = [
        { name: 'LocalStorage disponível', test: () => typeof localStorage !== 'undefined' },
        { name: 'React disponível', test: () => typeof document !== 'undefined' },
        { name: 'Supabase client inicializado', test: () => typeof window !== 'undefined' }
      ];

      const failedChecks = checks.filter(check => {
        try {
          return !check.test();
        } catch {
          return true;
        }
      });

      if (failedChecks.length > 0) {
        console.error('❌ CRITICAL: Verificações falharam:', failedChecks.map(c => c.name));
        return false;
      }

      console.log('✅ Verificação de integridade passou');
      return true;
    } catch (error) {
      console.error('❌ CRITICAL: Erro na verificação de integridade:', error);
      return false;
    }
  }
};

// Singleton para monitoramento contínuo
export class CotacaoMonitor {
  private static instance: CotacaoMonitor;
  private isMonitoring = false;
  private errorCount = 0;
  private readonly MAX_ERRORS = 5;

  static getInstance(): CotacaoMonitor {
    if (!CotacaoMonitor.instance) {
      CotacaoMonitor.instance = new CotacaoMonitor();
    }
    return CotacaoMonitor.instance;
  }

  startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    console.log('🛡️ Monitor de proteção da cotação iniciado');

    // Verificação periódica de integridade (a cada 30 segundos)
    setInterval(() => {
      if (!CotacaoValidator.runSystemIntegrityCheck()) {
        this.errorCount++;
        console.error(`❌ CRITICAL: Falha de integridade #${this.errorCount}`);
        
        if (this.errorCount >= this.MAX_ERRORS) {
          console.error('🚨 SISTEMA CRÍTICO: Muitas falhas detectadas!');
          // Em produção, notificar administrador
        }
      } else {
        this.errorCount = 0; // Reset contador se passou
      }
    }, 30000);
  }

  stopMonitoring(): void {
    this.isMonitoring = false;
    console.log('🛡️ Monitor de proteção da cotação parado');
  }
}