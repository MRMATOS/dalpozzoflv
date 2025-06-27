
-- Limpar dados órfãos e inconsistentes (versão corrigida)
-- 1. Primeiro remover cotações relacionadas a requisições órfãs
DELETE FROM public.cotacoes 
WHERE requisicao_id IN (
  SELECT r.id FROM public.requisicoes r
  WHERE r.id NOT IN (
    SELECT DISTINCT requisicao_id 
    FROM public.itens_requisicao 
    WHERE requisicao_id IS NOT NULL
  )
);

-- 2. Agora remover requisições sem itens (órfãs)
DELETE FROM public.requisicoes 
WHERE id NOT IN (
  SELECT DISTINCT requisicao_id 
  FROM public.itens_requisicao 
  WHERE requisicao_id IS NOT NULL
);

-- 3. Remover transferências relacionadas a lojas inativas
DELETE FROM public.transferencias 
WHERE loja_destino NOT IN (
  SELECT nome FROM public.lojas WHERE ativo = true
) OR loja_origem NOT IN (
  SELECT nome FROM public.lojas WHERE ativo = true AND nome != 'Home Center'
);

-- 4. Remover estoque de lojas inativas
DELETE FROM public.estoque_atual 
WHERE loja NOT IN (
  SELECT nome FROM public.lojas WHERE ativo = true
);

-- 5. Limpar dados da "Dal Pozzo Teste" especificamente
DELETE FROM public.cotacoes WHERE requisicao_id IN (
  SELECT id FROM public.requisicoes WHERE loja = 'Dal Pozzo Teste'
);
DELETE FROM public.transferencias WHERE loja_destino = 'Dal Pozzo Teste' OR loja_origem = 'Dal Pozzo Teste';
DELETE FROM public.requisicoes WHERE loja = 'Dal Pozzo Teste';
DELETE FROM public.estoque_atual WHERE loja = 'Dal Pozzo Teste';

-- 6. Desativar a loja "Dal Pozzo Teste" se ainda existir
UPDATE public.lojas SET ativo = false WHERE nome = 'Dal Pozzo Teste';
