
-- DESABILITAR RLS E REMOVER TODAS AS POLÍTICAS DE SEGURANÇA

-- 1. REMOVER TODAS AS POLÍTICAS RLS EXISTENTES

-- Tabela areas_exposicao
DROP POLICY IF EXISTS "Users can view areas of their loja" ON public.areas_exposicao;
DROP POLICY IF EXISTS "Master can manage areas" ON public.areas_exposicao;
ALTER TABLE public.areas_exposicao DISABLE ROW LEVEL SECURITY;

-- Tabela cotacoes
DROP POLICY IF EXISTS "Users can view their own cotacoes" ON public.cotacoes;
DROP POLICY IF EXISTS "Users can create their own cotacoes" ON public.cotacoes;
DROP POLICY IF EXISTS "Users can update their own cotacoes" ON public.cotacoes;
DROP POLICY IF EXISTS "Users can delete their own cotacoes" ON public.cotacoes;
ALTER TABLE public.cotacoes DISABLE ROW LEVEL SECURITY;

-- Tabela escala_abastecimento
DROP POLICY IF EXISTS "Compradores and master can view escala" ON public.escala_abastecimento;
DROP POLICY IF EXISTS "Master can manage escala" ON public.escala_abastecimento;
ALTER TABLE public.escala_abastecimento DISABLE ROW LEVEL SECURITY;

-- Tabela estoque_atual
DROP POLICY IF EXISTS "Users can view estoque of their loja" ON public.estoque_atual;
DROP POLICY IF EXISTS "Users can create estoque for their loja" ON public.estoque_atual;
DROP POLICY IF EXISTS "Users can update estoque of their loja" ON public.estoque_atual;
DROP POLICY IF EXISTS "Master users can delete estoque" ON public.estoque_atual;
DROP POLICY IF EXISTS "Users can view stock" ON public.estoque_atual;
ALTER TABLE public.estoque_atual DISABLE ROW LEVEL SECURITY;

-- Tabela estoque_cotacao
DROP POLICY IF EXISTS "Users can view estoque_cotacao of their loja" ON public.estoque_cotacao;
DROP POLICY IF EXISTS "Users can create estoque_cotacao for their loja" ON public.estoque_cotacao;
DROP POLICY IF EXISTS "Users can update estoque_cotacao of their loja" ON public.estoque_cotacao;
ALTER TABLE public.estoque_cotacao DISABLE ROW LEVEL SECURITY;

-- Tabela fornecedores
DROP POLICY IF EXISTS "All users can view fornecedores" ON public.fornecedores;
DROP POLICY IF EXISTS "Master can manage fornecedores" ON public.fornecedores;
ALTER TABLE public.fornecedores DISABLE ROW LEVEL SECURITY;

-- Tabela itens_cotacao
DROP POLICY IF EXISTS "Users can view itens of their cotacoes" ON public.itens_cotacao;
DROP POLICY IF EXISTS "Users can create itens for their cotacoes" ON public.itens_cotacao;
DROP POLICY IF EXISTS "Users can update itens of their cotacoes" ON public.itens_cotacao;
ALTER TABLE public.itens_cotacao DISABLE ROW LEVEL SECURITY;

-- Tabela itens_pedido
DROP POLICY IF EXISTS "Users can view itens of their pedidos" ON public.itens_pedido;
DROP POLICY IF EXISTS "Users can create itens for their pedidos" ON public.itens_pedido;
DROP POLICY IF EXISTS "Users can update itens of their pedidos" ON public.itens_pedido;
ALTER TABLE public.itens_pedido DISABLE ROW LEVEL SECURITY;

-- Tabela itens_requisicao
DROP POLICY IF EXISTS "Users can view itens of accessible requisicoes" ON public.itens_requisicao;
DROP POLICY IF EXISTS "Users can create itens for their requisicoes" ON public.itens_requisicao;
DROP POLICY IF EXISTS "Users can update itens of accessible requisicoes" ON public.itens_requisicao;
ALTER TABLE public.itens_requisicao DISABLE ROW LEVEL SECURITY;

-- Tabela lojas
DROP POLICY IF EXISTS "All users can view lojas" ON public.lojas;
DROP POLICY IF EXISTS "Master can manage lojas" ON public.lojas;
ALTER TABLE public.lojas DISABLE ROW LEVEL SECURITY;

-- Tabela pedidos_compra
DROP POLICY IF EXISTS "Users can view their own pedidos" ON public.pedidos_compra;
DROP POLICY IF EXISTS "Users can create their own pedidos" ON public.pedidos_compra;
DROP POLICY IF EXISTS "Users can update their own pedidos" ON public.pedidos_compra;
ALTER TABLE public.pedidos_compra DISABLE ROW LEVEL SECURITY;

-- Tabela produtos
DROP POLICY IF EXISTS "All users can view produtos" ON public.produtos;
DROP POLICY IF EXISTS "Master can manage produtos" ON public.produtos;
ALTER TABLE public.produtos DISABLE ROW LEVEL SECURITY;

-- Tabela profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Master can manage all profiles" ON public.profiles;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Tabela requisicoes
DROP POLICY IF EXISTS "Users can view requisicoes of their loja" ON public.requisicoes;
DROP POLICY IF EXISTS "Users can create requisicoes for their loja" ON public.requisicoes;
DROP POLICY IF EXISTS "Users can update their own requisicoes" ON public.requisicoes;
ALTER TABLE public.requisicoes DISABLE ROW LEVEL SECURITY;

-- Tabela sinonimos_produto
DROP POLICY IF EXISTS "All users can view sinonimos" ON public.sinonimos_produto;
DROP POLICY IF EXISTS "Master can manage sinonimos" ON public.sinonimos_produto;
ALTER TABLE public.sinonimos_produto DISABLE ROW LEVEL SECURITY;

-- Tabela transferencias
DROP POLICY IF EXISTS "Users can view transferencias of their loja" ON public.transferencias;
DROP POLICY IF EXISTS "Users can create transferencias from their loja" ON public.transferencias;
DROP POLICY IF EXISTS "Users can update transferencias of their loja" ON public.transferencias;
ALTER TABLE public.transferencias DISABLE ROW LEVEL SECURITY;

-- Tabela user_roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Master can manage all roles" ON public.user_roles;
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- Tabela usuarios
DROP POLICY IF EXISTS "Only specific user can manage usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "Master can manage usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "Users can view basic usuario info" ON public.usuarios;
ALTER TABLE public.usuarios DISABLE ROW LEVEL SECURITY;

-- 2. CONFIRMAR QUE TODAS AS TABELAS ESTÃO SEM RLS
-- Esta consulta irá mostrar quais tabelas ainda têm RLS habilitado (deve retornar vazio)
SELECT schemaname, tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  SELECT tablename 
  FROM pg_tables t 
  JOIN pg_class c ON c.relname = t.tablename 
  WHERE c.relrowsecurity = true 
  AND t.schemaname = 'public'
);

-- RESULTADO ESPERADO: Nenhuma linha retornada (todas as tabelas sem RLS)
