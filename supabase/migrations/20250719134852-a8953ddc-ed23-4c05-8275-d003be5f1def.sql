
-- FASE 1: Atualização do banco de dados para suportar Data Prevista
-- Adicionar novos campos à tabela pedidos_simples

ALTER TABLE public.pedidos_simples 
ADD COLUMN IF NOT EXISTS data_prevista date;

ALTER TABLE public.pedidos_simples 
ADD COLUMN IF NOT EXISTS data_recebimento timestamp with time zone;

ALTER TABLE public.pedidos_simples 
ADD COLUMN IF NOT EXISTS status_entrega text DEFAULT 'pendente';

-- Criar índices para otimizar consultas por data prevista
CREATE INDEX IF NOT EXISTS idx_pedidos_simples_data_prevista 
ON public.pedidos_simples(data_prevista);

CREATE INDEX IF NOT EXISTS idx_pedidos_simples_status_entrega 
ON public.pedidos_simples(status_entrega);

-- Criar função para calcular status de entrega automaticamente
CREATE OR REPLACE FUNCTION public.calcular_status_entrega(
  data_prev date,
  data_receb timestamp with time zone
) RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Se não foi recebido ainda
  IF data_receb IS NULL THEN
    IF data_prev < CURRENT_DATE THEN
      RETURN 'atrasado';
    ELSE
      RETURN 'pendente';
    END IF;
  END IF;
  
  -- Se foi recebido
  IF DATE(data_receb) < data_prev THEN
    RETURN 'adiantado';
  ELSIF DATE(data_receb) = data_prev THEN
    RETURN 'pontual';
  ELSE
    RETURN 'atrasado';
  END IF;
END;
$$;

-- Trigger para atualizar status automaticamente
CREATE OR REPLACE FUNCTION public.atualizar_status_entrega_pedido_simples()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Atualizar status baseado nas datas
  IF NEW.data_prevista IS NOT NULL THEN
    NEW.status_entrega := calcular_status_entrega(NEW.data_prevista, NEW.data_recebimento);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_atualizar_status_entrega ON public.pedidos_simples;
CREATE TRIGGER trigger_atualizar_status_entrega
  BEFORE INSERT OR UPDATE ON public.pedidos_simples
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_status_entrega_pedido_simples();

-- Migração de dados existentes: definir data_prevista como data_pedido para pedidos antigos
UPDATE public.pedidos_simples 
SET data_prevista = data_pedido 
WHERE data_prevista IS NULL AND data_pedido IS NOT NULL;
