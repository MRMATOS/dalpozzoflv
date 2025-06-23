
export interface TransferenciaLog {
  id: string;
  transferencia_id: string;
  status_anterior: string | null;
  status_novo: string;
  usuario_id: string | null;
  observacoes: string | null;
  quantidade_anterior: number | null;
  quantidade_nova: number | null;
  criado_em: string;
  usuario_nome?: string;
}

export interface DivergenciaTransferencia {
  id: string;
  transferencia_id: string;
  tipo_divergencia: 'quantidade' | 'prazo' | 'produto';
  descricao: string;
  quantidade_esperada: number | null;
  quantidade_real: number | null;
  resolvido: boolean;
  resolvido_por: string | null;
  resolvido_em: string | null;
  criado_em: string;
}

export interface HistoricoItem {
  id: string;
  tipo: 'log' | 'divergencia';
  descricao: string;
  status_anterior: string | null;
  status_novo: string | null;
  quantidade_anterior: number | null;
  quantidade_nova: number | null;
  usuario_nome: string;
  criado_em: string;
}

export type StatusTransferencia = 'pendente' | 'separado' | 'transferido' | 'recebido' | 'cancelado';
