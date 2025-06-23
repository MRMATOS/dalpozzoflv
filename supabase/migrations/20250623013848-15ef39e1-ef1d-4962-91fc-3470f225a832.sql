
-- Criar tabela para logs de auditoria das transferências
CREATE TABLE public.transferencias_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transferencia_id UUID REFERENCES public.transferencias(id) ON DELETE CASCADE,
  status_anterior TEXT,
  status_novo TEXT NOT NULL,
  usuario_id UUID REFERENCES auth.users(id),
  observacoes TEXT,
  quantidade_anterior NUMERIC,
  quantidade_nova NUMERIC,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar índices para performance
CREATE INDEX idx_transferencias_logs_transferencia_id ON public.transferencias_logs(transferencia_id);
CREATE INDEX idx_transferencias_logs_criado_em ON public.transferencias_logs(criado_em);

-- Criar tabela para divergências identificadas
CREATE TABLE public.divergencias_transferencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transferencia_id UUID REFERENCES public.transferencias(id) ON DELETE CASCADE,
  tipo_divergencia TEXT NOT NULL, -- 'quantidade', 'prazo', 'produto'
  descricao TEXT NOT NULL,
  quantidade_esperada NUMERIC,
  quantidade_real NUMERIC,
  resolvido BOOLEAN DEFAULT false,
  resolvido_por UUID REFERENCES auth.users(id),
  resolvido_em TIMESTAMP WITH TIME ZONE,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar índices para divergências
CREATE INDEX idx_divergencias_transferencia_id ON public.divergencias_transferencias(transferencia_id);
CREATE INDEX idx_divergencias_resolvido ON public.divergencias_transferencias(resolvido);

-- Criar função para registrar logs automaticamente
CREATE OR REPLACE FUNCTION public.log_transferencia_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Registrar mudança de status
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.transferencias_logs (
      transferencia_id,
      status_anterior,
      status_novo,
      usuario_id,
      observacoes
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      NEW.transferido_por,
      CASE 
        WHEN NEW.status = 'separado' THEN 'Produtos separados no CD'
        WHEN NEW.status = 'transferido' THEN 'Transferência enviada para loja'
        WHEN NEW.status = 'recebido' THEN 'Recebimento confirmado pela loja'
        ELSE 'Status atualizado'
      END
    );
  END IF;

  -- Registrar mudança de quantidade
  IF OLD.quantidade_transferida IS DISTINCT FROM NEW.quantidade_transferida THEN
    INSERT INTO public.transferencias_logs (
      transferencia_id,
      status_anterior,
      status_novo,
      usuario_id,
      quantidade_anterior,
      quantidade_nova,
      observacoes
    ) VALUES (
      NEW.id,
      NEW.status,
      NEW.status,
      NEW.transferido_por,
      OLD.quantidade_transferida,
      NEW.quantidade_transferida,
      'Quantidade ajustada'
    );
    
    -- Verificar divergência de quantidade
    IF OLD.quantidade_transferida != NEW.quantidade_transferida AND OLD.quantidade_transferida > 0 THEN
      INSERT INTO public.divergencias_transferencias (
        transferencia_id,
        tipo_divergencia,
        descricao,
        quantidade_esperada,
        quantidade_real
      ) VALUES (
        NEW.id,
        'quantidade',
        'Divergência entre quantidade requisitada e transferida',
        NEW.quantidade_requisitada,
        NEW.quantidade_transferida
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para logs automáticos
CREATE TRIGGER trigger_log_transferencia_change
  AFTER UPDATE ON public.transferencias
  FOR EACH ROW
  EXECUTE FUNCTION public.log_transferencia_change();

-- Função para buscar histórico completo de uma transferência
CREATE OR REPLACE FUNCTION public.get_transferencia_historico(transferencia_uuid UUID)
RETURNS TABLE (
  id UUID,
  tipo TEXT,
  descricao TEXT,
  status_anterior TEXT,
  status_novo TEXT,
  quantidade_anterior NUMERIC,
  quantidade_nova NUMERIC,
  usuario_nome TEXT,
  criado_em TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tl.id,
    'log' as tipo,
    COALESCE(tl.observacoes, 'Atualização de status') as descricao,
    tl.status_anterior,
    tl.status_novo,
    tl.quantidade_anterior,
    tl.quantidade_nova,
    COALESCE(p.nome, 'Sistema') as usuario_nome,
    tl.criado_em
  FROM public.transferencias_logs tl
  LEFT JOIN public.profiles p ON p.id = tl.usuario_id
  WHERE tl.transferencia_id = transferencia_uuid
  
  UNION ALL
  
  SELECT 
    dt.id,
    'divergencia' as tipo,
    dt.descricao,
    NULL as status_anterior,
    NULL as status_novo,
    dt.quantidade_esperada,
    dt.quantidade_real,
    COALESCE(p.nome, 'Sistema') as usuario_nome,
    dt.criado_em
  FROM public.divergencias_transferencias dt
  LEFT JOIN public.profiles p ON p.id = dt.resolvido_por
  WHERE dt.transferencia_id = transferencia_uuid
  
  ORDER BY criado_em DESC;
END;
$$ LANGUAGE plpgsql;

-- Atualizar constraint do status para incluir todos os estados
ALTER TABLE public.transferencias DROP CONSTRAINT IF EXISTS transferencias_status_check;
ALTER TABLE public.transferencias ADD CONSTRAINT transferencias_status_check 
  CHECK (status IN ('pendente', 'separado', 'transferido', 'recebido', 'cancelado'));
