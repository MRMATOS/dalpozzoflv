
-- Criar view que resolve o relacionamento auto-referenciado entre produtos
CREATE OR REPLACE VIEW produtos_com_pai AS
SELECT 
  p.id,
  p.produto,
  p.nome_variacao,
  p.produto_pai_id,
  p.unidade,
  p.ativo,
  p.media_por_caixa,
  p.ordem_exibicao,
  p.nome_base,
  p.observacoes,
  p.created_at,
  pai.id as produto_pai_id_ref,
  pai.produto as produto_pai_nome
FROM produtos p
LEFT JOIN produtos pai ON p.produto_pai_id = pai.id;

-- Garantir que a view tenha as mesmas políticas RLS da tabela produtos
-- Como é uma view, ela herda automaticamente as políticas da tabela base
