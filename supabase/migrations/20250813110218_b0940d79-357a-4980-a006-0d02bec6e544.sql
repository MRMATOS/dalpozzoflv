-- Limpeza de fornecedores duplicados
-- Primeiro, identificar e consolidar fornecedores duplicados

-- Atualizar pedidos_simples para usar fornecedores consolidados
UPDATE public.pedidos_simples 
SET fornecedor_nome = 'AGENOR'
WHERE fornecedor_nome IN ('Agenor', 'agenor');

UPDATE public.pedidos_simples 
SET fornecedor_nome = 'BERTI'
WHERE fornecedor_nome IN ('Berti', 'berti');

UPDATE public.pedidos_simples 
SET fornecedor_nome = 'NEY'
WHERE fornecedor_nome IN ('Ney', 'ney');

-- Remover fornecedores duplicados da tabela fornecedores
-- Manter apenas versões em maiúsculo
DELETE FROM public.fornecedores 
WHERE nome IN ('Agenor', 'agenor', 'Berti', 'berti', 'Ney', 'ney');

-- Garantir que os fornecedores principais existam
INSERT INTO public.fornecedores (nome, status_tipo) 
VALUES 
  ('AGENOR', 'Pedido Simples'),
  ('BERTI', 'Pedido Simples'), 
  ('NEY', 'Pedido Simples')
ON CONFLICT (nome) DO NOTHING;