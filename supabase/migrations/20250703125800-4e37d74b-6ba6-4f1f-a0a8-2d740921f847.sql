-- PHASE 1: SECURITY FIX - CRITICAL RLS POLICIES ENFORCEMENT

-- Fix overly permissive policies on escala_abastecimento
DROP POLICY IF EXISTS "Allow access to escala_abastecimento" ON public.escala_abastecimento;

CREATE POLICY "Masters and compradors can view escala_abastecimento" ON public.escala_abastecimento
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('master', 'comprador')
        ) OR is_user_master()
    );

CREATE POLICY "Masters can manage escala_abastecimento" ON public.escala_abastecimento
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'master'
        ) OR is_user_master()
    );

-- Fix overly permissive policies on recebimentos tables
DROP POLICY IF EXISTS "Usuarios autenticados podem ver recebimentos" ON public.recebimentos;
DROP POLICY IF EXISTS "Usuarios autenticados podem gerenciar pallets" ON public.recebimentos_pallets;
DROP POLICY IF EXISTS "Usuarios autenticados podem gerenciar produtos recebidos" ON public.recebimentos_produtos;

-- Restrict recebimentos to CD users and masters only
CREATE POLICY "CD users and masters can view recebimentos" ON public.recebimentos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('master', 'cd')
        ) OR is_user_master() OR is_cd_user()
    );

CREATE POLICY "CD users and masters can manage recebimentos" ON public.recebimentos
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('master', 'cd')
        ) OR is_user_master() OR is_cd_user()
    );

-- Recebimentos pallets - CD only
CREATE POLICY "CD users and masters can manage pallets" ON public.recebimentos_pallets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('master', 'cd')
        ) OR is_user_master() OR is_cd_user()
    );

-- Recebimentos produtos - CD only  
CREATE POLICY "CD users and masters can manage produtos recebidos" ON public.recebimentos_produtos
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('master', 'cd')
        ) OR is_user_master() OR is_cd_user()
    );

-- Fix transferencias policies - restrict to appropriate users
DROP POLICY IF EXISTS "Usuários podem ver transferências" ON public.transferencias;
DROP POLICY IF EXISTS "Usuários transferencia podem atualizar transferências" ON public.transferencias;
DROP POLICY IF EXISTS "Usuários transferencia podem inserir transferências" ON public.transferencias;

CREATE POLICY "Users can view transferencias for their loja" ON public.transferencias
    FOR SELECT USING (
        loja_destino = get_user_loja_new() OR 
        loja_origem = get_user_loja_new() OR 
        is_user_master() OR 
        is_cd_user()
    );

CREATE POLICY "CD users can create transferencias" ON public.transferencias
    FOR INSERT WITH CHECK (
        is_cd_user() OR is_user_master()
    );

CREATE POLICY "CD and destination loja users can update transferencias" ON public.transferencias
    FOR UPDATE USING (
        (loja_destino = get_user_loja_new() AND auth.uid() = confirmado_por) OR
        is_cd_user() OR 
        is_user_master()
    );

-- Fix transferencias_logs - restrict to authenticated users
DROP POLICY IF EXISTS "Authenticated users can insert logs" ON public.transferencias_logs;

CREATE POLICY "Authenticated users can insert logs" ON public.transferencias_logs
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Add security function for role validation
CREATE OR REPLACE FUNCTION public.validate_user_role_access()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT auth.uid() IS NOT NULL AND (
    is_user_master() OR
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND ativo = true
    )
  );
$$;