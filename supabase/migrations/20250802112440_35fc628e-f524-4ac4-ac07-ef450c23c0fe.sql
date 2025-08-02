-- Atualizar campo 'produto' das variações para conter o nome completo
-- Fórmula: Produto Pai + Variação
UPDATE produtos 
SET produto = CONCAT(
  COALESCE(
    (SELECT COALESCE(pai.nome_base, pai.produto) 
     FROM produtos pai 
     WHERE pai.id = produtos.produto_pai_id), 
    'Produto'
  ), 
  ' ', 
  COALESCE(produtos.nome_variacao, '')
)
WHERE produto_pai_id IS NOT NULL 
  AND (produtos.produto IS NULL OR produtos.produto = '');

-- Garantir que todos os produtos tenham um nome válido
UPDATE produtos 
SET produto = COALESCE(nome_base, 'Produto Sem Nome')
WHERE (produto IS NULL OR produto = '') 
  AND produto_pai_id IS NULL;