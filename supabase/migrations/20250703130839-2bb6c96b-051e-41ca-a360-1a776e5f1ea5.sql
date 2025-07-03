-- FASE 2: HABILITAR RLS E CORRIGIR POLÍTICAS (SEM DUPLICATAS)

-- Habilitar RLS nas tabelas que não têm
ALTER TABLE public.areas_exposicao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.divergencias_transferencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estoque_atual ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- Remover políticas conflitantes antes de criar novas
DROP POLICY IF EXISTS "Masters can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Masters can manage usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "Users can view own usuario data" ON public.usuarios;
DROP POLICY IF EXISTS "Users can view estoque for their loja" ON public.estoque_atual;
DROP POLICY IF EXISTS "Users can manage estoque for their loja" ON public.estoque_atual;

-- Criar políticas para areas_exposicao
CREATE POLICY "Authenticated users can view areas_exposicao" ON public.areas_exposicao
    FOR SELECT USING (true);

CREATE POLICY "Masters can manage areas_exposicao" ON public.areas_exposicao
    FOR ALL USING (is_user_master());

-- Criar políticas para divergencias_transferencias
CREATE POLICY "Users can view divergencias for their transferencias" ON public.divergencias_transferencias
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.transferencias 
            WHERE id = transferencia_id 
            AND (loja_destino = get_user_loja_new() OR loja_origem = get_user_loja_new())
        ) OR is_user_master() OR is_cd_user()
    );

CREATE POLICY "CD users and masters can manage divergencias" ON public.divergencias_transferencias
    FOR ALL USING (is_cd_user() OR is_user_master());

-- Políticas corrigidas para estoque_atual
CREATE POLICY "Users can view estoque for their loja or all if master" ON public.estoque_atual
    FOR SELECT USING (
        loja = get_user_loja_new() OR is_user_master()
    );

CREATE POLICY "Users can manage estoque for their loja or all if master" ON public.estoque_atual
    FOR ALL USING (
        loja = get_user_loja_new() OR is_user_master()
    );

-- Políticas corrigidas para user_roles
CREATE POLICY "Users can view own roles or masters view all" ON public.user_roles
    FOR SELECT USING (
        user_id = auth.uid() OR is_user_master()
    );

CREATE POLICY "Masters can manage all user roles" ON public.user_roles
    FOR ALL USING (is_user_master());

-- Políticas corrigidas para usuarios
CREATE POLICY "Users can view own data or masters view all" ON public.usuarios
    FOR SELECT USING (
        id = auth.uid() OR is_user_master()
    );

CREATE POLICY "Masters can manage all usuarios data" ON public.usuarios
    FOR ALL USING (is_user_master());