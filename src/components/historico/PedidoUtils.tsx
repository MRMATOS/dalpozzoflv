
import React from 'react';
import { Badge } from '@/components/ui/badge';

export interface StatusEntrega {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  color?: string;
}

export const formatarDataBrasil = (dataStr?: string | null): string => {
  if (!dataStr) return '';
  
  try {
    const data = new Date(dataStr);
    if (isNaN(data.getTime())) return '';
    
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });
  } catch {
    return '';
  }
};

export const formatarDataHoraBrasil = (dataStr?: string | null): string => {
  if (!dataStr) return '';
  
  try {
    const data = new Date(dataStr);
    if (isNaN(data.getTime())) return '';
    
    return data.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return '';
  }
};

export const getStatusEntregaInfo = (status?: string): StatusEntrega => {
  switch (status) {
    case 'pontual':
      return { label: 'Pontual', variant: 'default', color: 'text-green-600' };
    case 'adiantado':
      return { label: 'Adiantado', variant: 'secondary', color: 'text-blue-600' };
    case 'atrasado':
      return { label: 'Atrasado', variant: 'destructive', color: 'text-red-600' };
    case 'pendente':
    default:
      return { label: 'Pendente', variant: 'outline', color: 'text-yellow-600' };
  }
};

export const StatusBadge: React.FC<{ status?: string; className?: string }> = ({ status, className }) => {
  const statusInfo = getStatusEntregaInfo(status);
  
  return (
    <Badge variant={statusInfo.variant} className={className}>
      {statusInfo.label}
    </Badge>
  );
};

export const calcularStatusVisual = (dataPrevista?: string, dataRecebimento?: string): string => {
  if (!dataPrevista) return 'pendente';
  
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  
  const dataPrev = new Date(dataPrevista);
  dataPrev.setHours(0, 0, 0, 0);
  
  if (!dataRecebimento) {
    // Ainda não foi recebido
    if (dataPrev < hoje) {
      return 'atrasado';
    } else {
      return 'pendente';
    }
  }
  
  // Foi recebido
  const dataReceb = new Date(dataRecebimento);
  dataReceb.setHours(0, 0, 0, 0);
  
  if (dataReceb < dataPrev) {
    return 'adiantado';
  } else if (dataReceb.getTime() === dataPrev.getTime()) {
    return 'pontual';
  } else {
    return 'atrasado';
  }
};
