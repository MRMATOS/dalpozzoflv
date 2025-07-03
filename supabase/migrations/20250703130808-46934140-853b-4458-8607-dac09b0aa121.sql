-- FASE 2: HABILITAR RLS E CORRIGIR POLÍTICAS FALTANTES

-- Habilitar RLS nas tabelas que não têm
ALTER TABLE public.areas_exposicao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.divergencias_transferencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estoque_atual ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

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

-- Reabilitar RLS no estoque_atual com políticas corretas
CREATE POLICY "Users can view estoque for their loja or all if master" ON public.estoque_atual
    FOR SELECT USING (
        loja = get_user_loja_new() OR is_user_master()
    );

CREATE POLICY "Users can manage estoque for their loja or all if master" ON public.estoque_atual
    FOR ALL USING (
        loja = get_user_loja_new() OR is_user_master()
    );

-- Políticas para user_roles
CREATE POLICY "Users can view own roles or masters view all" ON public.user_roles
    FOR SELECT USING (
        user_id = auth.uid() OR is_user_master()
    );

CREATE POLICY "Masters can manage all roles" ON public.user_roles
    FOR ALL USING (is_user_master());

-- Políticas para usuarios (compatibilidade)
CREATE POLICY "Users can view own data or masters view all" ON public.usuarios
    FOR SELECT USING (
        id = auth.uid() OR is_user_master()
    );

CREATE POLICY "Masters can manage all usuarios" ON public.usuarios
    FOR ALL USING (is_user_master());

-- Corrigir função is_cd_user para verificar múltiplas fontes
CREATE OR REPLACE FUNCTION public.is_cd_user()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'cd'
  ) OR EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = auth.uid() AND tipo = 'cd'
  ) OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND loja = get_cd_loja()
  );
$$;