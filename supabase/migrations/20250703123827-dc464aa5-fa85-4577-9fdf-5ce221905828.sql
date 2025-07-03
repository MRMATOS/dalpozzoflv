-- FASE 1: Limpeza de Políticas Conflitantes

-- Remover políticas conflitantes da tabela produtos
DROP POLICY IF EXISTS "policy" ON public.produtos;
DROP POLICY IF EXISTS "Allow access to produtos" ON public.produtos;
DROP POLICY IF EXISTS "Usuários autenticados podem visualizar produtos" ON public.produtos;
DROP POLICY IF EXISTS "Usuários autenticados podem criar produtos" ON public.produtos;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar produtos" ON public.produtos;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar produtos" ON public.produtos;
DROP POLICY IF EXISTS "All authenticated users can view produtos" ON public.produtos;
DROP POLICY IF EXISTS "Masters and compradors can manage produtos" ON public.produtos;

-- Remover políticas conflitantes da tabela fornecedores
DROP POLICY IF EXISTS "Allow access to fornecedores" ON public.fornecedores;
DROP POLICY IF EXISTS "All authenticated users can view fornecedores" ON public.fornecedores;
DROP POLICY IF EXISTS "Masters can manage fornecedores" ON public.fornecedores;

-- Remover políticas conflitantes da tabela lojas
DROP POLICY IF EXISTS "Allow access to lojas" ON public.lojas;
DROP POLICY IF EXISTS "All authenticated users can view lojas" ON public.lojas;
DROP POLICY IF EXISTS "Masters can manage lojas" ON public.lojas;

-- FASE 2: Correção das Funções RLS (já existem as corretas)

-- FASE 3: Implementação de Políticas RLS Limpas e Consistentes

-- Políticas para produtos
CREATE POLICY "Authenticated users can view produtos" ON public.produtos
    FOR SELECT USING (true);

CREATE POLICY "Masters and compradors can manage produtos" ON public.produtos
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('master', 'comprador')
        ) OR is_user_master()
    );

-- Políticas para fornecedores
CREATE POLICY "Authenticated users can view fornecedores" ON public.fornecedores
    FOR SELECT USING (true);

CREATE POLICY "Masters can manage fornecedores" ON public.fornecedores
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'master'
        ) OR is_user_master()
    );

-- Políticas para lojas
CREATE POLICY "Authenticated users can view lojas" ON public.lojas
    FOR SELECT USING (true);

CREATE POLICY "Masters can manage lojas" ON public.lojas
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'master'
        ) OR is_user_master()
    );

-- FASE 4: Habilitar RLS e criar políticas para tabelas faltantes

-- Habilitar RLS nas tabelas críticas
ALTER TABLE public.cotacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requisicoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_requisicao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_cotacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_pedido ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transferencias_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sinonimos_produto ENABLE ROW LEVEL SECURITY;

-- Políticas para cotacoes
CREATE POLICY "Users can view own cotacoes" ON public.cotacoes
    FOR SELECT USING (user_id = auth.uid() OR is_user_master());

CREATE POLICY "Users can create own cotacoes" ON public.cotacoes
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own cotacoes" ON public.cotacoes
    FOR UPDATE USING (user_id = auth.uid() OR is_user_master());

CREATE POLICY "Masters can delete cotacoes" ON public.cotacoes
    FOR DELETE USING (is_user_master());

-- Políticas para requisicoes
CREATE POLICY "Users can view requisicoes from their loja" ON public.requisicoes
    FOR SELECT USING (
        loja = get_user_loja_new() OR 
        user_id = auth.uid() OR 
        is_user_master()
    );

CREATE POLICY "Users can create requisicoes for their loja" ON public.requisicoes
    FOR INSERT WITH CHECK (
        loja = get_user_loja_new() AND 
        user_id = auth.uid()
    );

CREATE POLICY "Users can update own requisicoes" ON public.requisicoes
    FOR UPDATE USING (
        user_id = auth.uid() OR 
        is_user_master()
    );

-- Políticas para itens_requisicao
CREATE POLICY "Users can view itens_requisicao" ON public.itens_requisicao
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.requisicoes 
            WHERE id = requisicao_id 
            AND (user_id = auth.uid() OR loja = get_user_loja_new())
        ) OR is_user_master()
    );

CREATE POLICY "Users can manage itens_requisicao" ON public.itens_requisicao
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.requisicoes 
            WHERE id = requisicao_id 
            AND user_id = auth.uid()
        ) OR is_user_master()
    );

-- Políticas para itens_cotacao
CREATE POLICY "Users can view itens_cotacao" ON public.itens_cotacao
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.cotacoes 
            WHERE id = cotacao_id 
            AND user_id = auth.uid()
        ) OR is_user_master()
    );

CREATE POLICY "Users can manage itens_cotacao" ON public.itens_cotacao
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.cotacoes 
            WHERE id = cotacao_id 
            AND user_id = auth.uid()
        ) OR is_user_master()
    );

-- Políticas para pedidos_compra
CREATE POLICY "Users can view own pedidos" ON public.pedidos_compra
    FOR SELECT USING (user_id = auth.uid() OR is_user_master());

CREATE POLICY "Users can create own pedidos" ON public.pedidos_compra
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own pedidos" ON public.pedidos_compra
    FOR UPDATE USING (user_id = auth.uid() OR is_user_master());

CREATE POLICY "Masters can delete pedidos" ON public.pedidos_compra
    FOR DELETE USING (is_user_master());

-- Políticas para itens_pedido
CREATE POLICY "Users can view itens_pedido" ON public.itens_pedido
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.pedidos_compra 
            WHERE id = pedido_id 
            AND user_id = auth.uid()
        ) OR is_user_master()
    );

CREATE POLICY "Users can manage itens_pedido" ON public.itens_pedido
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.pedidos_compra 
            WHERE id = pedido_id 
            AND user_id = auth.uid()
        ) OR is_user_master()
    );

-- Políticas para user_permissions
CREATE POLICY "Masters can view all permissions" ON public.user_permissions
    FOR SELECT USING (is_user_master());

CREATE POLICY "Masters can manage permissions" ON public.user_permissions
    FOR ALL USING (is_user_master());

-- Políticas para transferencias_logs
CREATE POLICY "Users can view logs" ON public.transferencias_logs
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert logs" ON public.transferencias_logs
    FOR INSERT WITH CHECK (true);

-- Políticas para sinonimos_produto
CREATE POLICY "Users can view sinonimos" ON public.sinonimos_produto
    FOR SELECT USING (true);

CREATE POLICY "Masters can manage sinonimos" ON public.sinonimos_produto
    FOR ALL USING (is_user_master());

-- Habilitar RLS na tabela tipos_caixas e adicionar políticas de inserção/edição
CREATE POLICY "Masters can manage tipos_caixas" ON public.tipos_caixas
    FOR ALL USING (is_user_master());