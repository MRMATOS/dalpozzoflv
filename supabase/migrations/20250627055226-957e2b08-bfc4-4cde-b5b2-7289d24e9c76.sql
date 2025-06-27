
-- Criar tabela para tipos de caixas/embalagens com tara padrão
CREATE TABLE public.tipos_caixas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  tara_kg NUMERIC NOT NULL DEFAULT 0,
  descricao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inserir alguns tipos de caixas padrão
INSERT INTO public.tipos_caixas (nome, tara_kg, descricao) VALUES
('Caixa Plástica Pequena', 2.0, 'Caixa plástica padrão pequena'),
('Caixa Plástica Grande', 3.5, 'Caixa plástica padrão grande'),
('Gaiola Metálica', 15.0, 'Gaiola metálica para transporte'),
('Caixa de Papelão', 0.5, 'Caixa de papelão descartável'),
('Bandeja Plástica', 1.2, 'Bandeja plástica reutilizável');

-- Criar tabela para recebimentos
CREATE TABLE public.recebimentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'iniciado' CHECK (status IN ('iniciado', 'finalizado', 'cancelado')),
  fornecedor TEXT,
  origem TEXT,
  observacoes TEXT,
  iniciado_por UUID,
  finalizado_por UUID,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  finalizado_em TIMESTAMP WITH TIME ZONE,
  total_peso_bruto NUMERIC DEFAULT 0,
  total_peso_liquido NUMERIC DEFAULT 0,
  total_produtos INTEGER DEFAULT 0
);

-- Criar tabela para registro dos pallets por recebimento
CREATE TABLE public.recebimentos_pallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recebimento_id UUID NOT NULL REFERENCES public.recebimentos(id) ON DELETE CASCADE,
  ordem INTEGER NOT NULL,
  peso_kg NUMERIC NOT NULL,
  observacoes TEXT,
  registrado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(recebimento_id, ordem)
);

-- Criar tabela para produtos recebidos
CREATE TABLE public.recebimentos_produtos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recebimento_id UUID NOT NULL REFERENCES public.recebimentos(id) ON DELETE CASCADE,
  produto_id UUID REFERENCES public.produtos(id),
  produto_nome TEXT NOT NULL,
  peso_bruto_kg NUMERIC NOT NULL,
  peso_liquido_kg NUMERIC NOT NULL,
  quantidade_caixas INTEGER DEFAULT 0,
  tipo_caixa_id UUID REFERENCES public.tipos_caixas(id),
  tipo_caixa_nome TEXT,
  tara_caixas_kg NUMERIC DEFAULT 0,
  tara_pallets_kg NUMERIC DEFAULT 0,
  pallets_utilizados INTEGER[] DEFAULT '{}',
  loja_destino TEXT NOT NULL,
  registrado_por UUID,
  registrado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  estoque_atualizado BOOLEAN DEFAULT false
);

-- Criar função para calcular tara total dos pallets utilizados
CREATE OR REPLACE FUNCTION public.calcular_tara_pallets(
  _recebimento_id UUID,
  _pallets_utilizados INTEGER[]
) RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
DECLARE
  total_tara NUMERIC := 0;
  pallet_ordem INTEGER;
BEGIN
  -- Somar o peso dos pallets utilizados
  FOREACH pallet_ordem IN ARRAY _pallets_utilizados
  LOOP
    SELECT COALESCE(peso_kg, 0) INTO total_tara FROM public.recebimentos_pallets 
    WHERE recebimento_id = _recebimento_id AND ordem = pallet_ordem;
    
    total_tara := total_tara + COALESCE(total_tara, 0);
  END LOOP;
  
  RETURN total_tara;
END;
$$;

-- Criar função para atualizar estoque após recebimento
CREATE OR REPLACE FUNCTION public.atualizar_estoque_recebimento()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Atualizar estoque atual se ainda não foi atualizado
  IF NEW.estoque_atualizado = true AND OLD.estoque_atualizado = false THEN
    -- Converter peso líquido para caixas usando média por caixa do produto
    INSERT INTO public.estoque_atual (produto_id, loja, quantidade, atualizado_em)
    SELECT 
      NEW.produto_id,
      NEW.loja_destino,
      CASE 
        WHEN p.media_por_caixa > 0 THEN ROUND(NEW.peso_liquido_kg / p.media_por_caixa, 2)
        ELSE NEW.peso_liquido_kg
      END,
      now()
    FROM public.produtos p 
    WHERE p.id = NEW.produto_id
    ON CONFLICT (produto_id, loja) 
    DO UPDATE SET 
      quantidade = estoque_atual.quantidade + EXCLUDED.quantidade,
      atualizado_em = EXCLUDED.atualizado_em;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para atualizar estoque
CREATE TRIGGER trigger_atualizar_estoque_recebimento
  AFTER UPDATE ON public.recebimentos_produtos
  FOR EACH ROW
  EXECUTE FUNCTION public.atualizar_estoque_recebimento();

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.tipos_caixas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recebimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recebimentos_pallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recebimentos_produtos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (permissivas para usuários autenticados por enquanto)
CREATE POLICY "Usuarios autenticados podem ver tipos de caixas" ON public.tipos_caixas FOR SELECT USING (true);
CREATE POLICY "Usuarios autenticados podem ver recebimentos" ON public.recebimentos FOR ALL USING (true);
CREATE POLICY "Usuarios autenticados podem gerenciar pallets" ON public.recebimentos_pallets FOR ALL USING (true);
CREATE POLICY "Usuarios autenticados podem gerenciar produtos recebidos" ON public.recebimentos_produtos FOR ALL USING (true);
