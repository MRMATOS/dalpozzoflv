-- PASSO 1: Adicionar campo status_tipo na tabela fornecedores (compatível com dados existentes)
ALTER TABLE public.fornecedores 
ADD COLUMN status_tipo TEXT DEFAULT 'Cotação e Pedido';

-- Comentário na coluna para documentação
COMMENT ON COLUMN public.fornecedores.status_tipo IS 'Define onde o fornecedor aparece: Cotação, Pedido Simples, Cotação e Pedido, ou Desativado';

-- Criar tabela para pedidos simples
CREATE TABLE public.pedidos_simples (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fornecedor_id UUID REFERENCES public.fornecedores(id) ON DELETE SET NULL,
  fornecedor_nome TEXT NOT NULL,
  produto_id UUID REFERENCES public.produtos(id) ON DELETE SET NULL,
  produto_nome TEXT NOT NULL,
  unidade TEXT NOT NULL DEFAULT 'Caixa',
  tipo TEXT,
  quantidade NUMERIC NOT NULL,
  valor_unitario NUMERIC NOT NULL,
  valor_total_estimado NUMERIC NOT NULL,
  data_pedido DATE NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  criado_por UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
  observacoes TEXT
);

-- Habilitar RLS na tabela pedidos_simples
ALTER TABLE public.pedidos_simples ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para pedidos_simples
CREATE POLICY "Users can view own pedidos_simples" 
ON public.pedidos_simples 
FOR SELECT 
USING (user_id = auth.uid() OR is_user_master());

CREATE POLICY "Users can create own pedidos_simples" 
ON public.pedidos_simples 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own pedidos_simples" 
ON public.pedidos_simples 
FOR UPDATE 
USING (user_id = auth.uid() OR is_user_master());

CREATE POLICY "Masters can delete pedidos_simples" 
ON public.pedidos_simples 
FOR DELETE 
USING (is_user_master());

-- Comentário na tabela
COMMENT ON TABLE public.pedidos_simples IS 'Tabela para registrar pedidos simples feitos diretamente com fornecedores';