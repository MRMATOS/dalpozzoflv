-- Popular tabela de sinônimos com dados básicos do dicionário
-- Inserir alguns sinônimos essenciais para teste

INSERT INTO sinonimos_produto (produto_id, sinonimo)
SELECT 
  p.id,
  unnest(ARRAY[
    CASE WHEN p.nome_base ILIKE '%tomate%' THEN 'tomate'
    WHEN p.nome_base ILIKE '%cebola%' THEN 'cebola'
    WHEN p.nome_base ILIKE '%batata%' THEN 'batata'
    WHEN p.nome_base ILIKE '%alface%' THEN 'alface'
    WHEN p.nome_base ILIKE '%cenoura%' THEN 'cenoura'
    END
  ])
FROM produtos p
WHERE p.ativo = true 
  AND (p.nome_base ILIKE '%tomate%' OR p.nome_base ILIKE '%cebola%' OR 
       p.nome_base ILIKE '%batata%' OR p.nome_base ILIKE '%alface%' OR 
       p.nome_base ILIKE '%cenoura%')
  AND NOT EXISTS (
    SELECT 1 FROM sinonimos_produto sp 
    WHERE sp.produto_id = p.id
  )
ON CONFLICT (produto_id, sinonimo) DO NOTHING;