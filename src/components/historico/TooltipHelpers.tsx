import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { HelpCircle, Info, TrendingUp, Calendar, Filter, Download } from 'lucide-react';

interface TooltipHelperProps {
  children: React.ReactNode;
  content: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
}

export const TooltipHelper: React.FC<TooltipHelperProps> = ({ 
  children, 
  content, 
  side = 'top' 
}) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        {children}
      </TooltipTrigger>
      <TooltipContent side={side} className="max-w-xs">
        <p className="text-sm">{content}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export const MetricasTooltips = {
  TotalPedidos: () => (
    <TooltipHelper content="Número total de pedidos no período selecionado">
      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
    </TooltipHelper>
  ),
  
  ValorTotal: () => (
    <TooltipHelper content="Soma de todos os valores dos pedidos realizados">
      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
    </TooltipHelper>
  ),
  
  MediaPorPedido: () => (
    <TooltipHelper content="Valor médio calculado dividindo o valor total pelo número de pedidos">
      <TrendingUp className="h-4 w-4 text-muted-foreground cursor-help" />
    </TooltipHelper>
  ),
  
  TopFornecedores: () => (
    <TooltipHelper content="Fornecedores classificados por número de pedidos e valor total">
      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
    </TooltipHelper>
  )
};

export const FiltrosTooltips = {
  FiltroRapido: () => (
    <TooltipHelper content="Filtros predefinidos para acessar dados rapidamente. Use Ctrl+1-4 para acesso rápido">
      <Filter className="h-4 w-4 text-muted-foreground cursor-help" />
    </TooltipHelper>
  ),
  
  PeriodoCustom: () => (
    <TooltipHelper content="Selecione um período específico para análise detalhada dos dados">
      <Calendar className="h-4 w-4 text-muted-foreground cursor-help" />
    </TooltipHelper>
  ),
  
  ExportarDados: () => (
    <TooltipHelper content="Exporte os dados filtrados em CSV, JSON ou texto simples. Use Ctrl+E para acesso rápido">
      <Download className="h-4 w-4 text-muted-foreground cursor-help" />
    </TooltipHelper>
  )
};

export const CalendarioTooltips = {
  NavegacaoMes: () => (
    <TooltipHelper content="Use as setas ou Ctrl+← e Ctrl+→ para navegar entre meses">
      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
    </TooltipHelper>
  ),
  
  DetalhesEvento: () => (
    <TooltipHelper content="Clique em um dia com eventos para ver detalhes dos pedidos">
      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
    </TooltipHelper>
  )
};

export const AtalhosTeclado = () => (
  <TooltipHelper 
    content={`Atalhos disponíveis:
• Ctrl+1-4: Filtros rápidos
• Ctrl+E: Exportar dados
• Ctrl+F: Buscar
• Ctrl+←/→: Navegar calendário
• Esc: Fechar modais`}
    side="left"
  >
    <div className="fixed bottom-4 right-4 p-2 bg-muted rounded-full shadow-lg hover:bg-accent transition-colors cursor-help">
      <HelpCircle className="h-5 w-5" />
    </div>
  </TooltipHelper>
);