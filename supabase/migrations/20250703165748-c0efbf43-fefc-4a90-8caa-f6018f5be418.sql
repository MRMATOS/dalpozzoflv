-- FUNÇÕES PARA EXCLUSÃO FORÇADA DE PRODUTOS E FORNECEDORES
-- Estas funções permitem que usuários master excluam registros mesmo com dependências

-- Função para exclusão forçada de produto (remove dependências em cascata)
CREATE OR REPLACE FUNCTION public.force_delete_produto(produto_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Só masters podem usar esta função
  IF NOT is_user_master() THEN
    RETURN false;
  END IF;
  
  -- Remover dependências em ordem
  DELETE FROM public.itens_cotacao WHERE produto_id = produto_uuid;
  DELETE FROM public.itens_requisicao WHERE produto_id = produto_uuid;
  DELETE FROM public.itens_pedido WHERE produto_id = produto_uuid;
  DELETE FROM public.escala_abastecimento WHERE produto_id = produto_uuid;
  DELETE FROM public.sinonimos_produto WHERE produto_id = produto_uuid;
  DELETE FROM public.estoque_atual WHERE produto_id = produto_uuid;
  DELETE FROM public.estoque_cotacao WHERE produto_id = produto_uuid;
  
  -- Produtos em recebimentos não podem ser removidos, apenas marcar como inativo
  -- mas vamos permitir a exclusão se o master realmente quiser
  UPDATE public.recebimentos_produtos SET produto_id = NULL WHERE produto_id = produto_uuid;
  UPDATE public.transferencias SET produto_id = NULL WHERE produto_id = produto_uuid;
  
  -- Remover produto pai de filhos se existir
  UPDATE public.produtos SET produto_pai_id = NULL WHERE produto_pai_id = produto_uuid;
  
  -- Finalmente excluir o produto
  DELETE FROM public.produtos WHERE id = produto_uuid;
  
  RETURN true;
END;
$function$;

-- Função para exclusão forçada de fornecedor (remove dependências em cascata)
CREATE OR REPLACE FUNCTION public.force_delete_fornecedor(fornecedor_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Só masters podem usar esta função
  IF NOT is_user_master() THEN
    RETURN false;
  END IF;
  
  -- Remover dependências em ordem
  DELETE FROM public.itens_pedido WHERE pedido_id IN (
    SELECT id FROM public.pedidos_compra WHERE fornecedor_id = fornecedor_uuid
  );
  DELETE FROM public.pedidos_compra WHERE fornecedor_id = fornecedor_uuid;
  DELETE FROM public.cotacoes WHERE fornecedor_id = fornecedor_uuid;
  
  -- Finalmente excluir o fornecedor
  DELETE FROM public.fornecedores WHERE id = fornecedor_uuid;
  
  RETURN true;
END;
$function$;

-- Comentário das funções
COMMENT ON FUNCTION public.force_delete_produto(uuid) IS 'Função para exclusão forçada de produtos por usuários master, removendo todas as dependências';
COMMENT ON FUNCTION public.force_delete_fornecedor(uuid) IS 'Função para exclusão forçada de fornecedores por usuários master, removendo todas as dependências';