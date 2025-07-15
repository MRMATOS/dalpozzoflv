-- Adicionar campos necessários para vincular recebimentos a pedidos
ALTER TABLE public.recebimentos 
ADD COLUMN pedido_origem_id uuid,
ADD COLUMN tipo_origem text;

-- Adicionar comentários para documentar os novos campos
COMMENT ON COLUMN public.recebimentos.pedido_origem_id IS 'ID do pedido que originou este recebimento (pedidos_compra ou pedidos_simples)';
COMMENT ON COLUMN public.recebimentos.tipo_origem IS 'Tipo do pedido de origem: compra ou simples';

-- Adicionar novo modo de pesagem "sem_palete"
ALTER TABLE public.recebimentos 
ALTER COLUMN modo_pesagem TYPE text;