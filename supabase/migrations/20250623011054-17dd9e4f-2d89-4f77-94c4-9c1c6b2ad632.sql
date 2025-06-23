
-- Primeiro, vamos ver quais tipos de usuário existem atualmente na tabela
SELECT DISTINCT tipo, COUNT(*) as quantidade
FROM public.usuarios 
GROUP BY tipo
ORDER BY tipo;

-- Verificar se há registros com tipos que não são: master, comprador, estoque, cd
SELECT id, nome, tipo, loja
FROM public.usuarios 
WHERE tipo NOT IN ('master', 'comprador', 'estoque', 'cd');

-- Atualizar registros com tipos inválidos (se houver) para um tipo válido
-- Por exemplo, se houver 'requisitante', vamos mudar para 'estoque'
UPDATE public.usuarios 
SET tipo = 'estoque' 
WHERE tipo NOT IN ('master', 'comprador', 'estoque', 'cd');

-- Agora tentar criar a constraint novamente
ALTER TABLE public.usuarios DROP CONSTRAINT IF EXISTS usuarios_tipo_check;
ALTER TABLE public.usuarios ADD CONSTRAINT usuarios_tipo_check 
CHECK (tipo IN ('master', 'comprador', 'estoque', 'cd'));

-- Verificar se a constraint foi criada com sucesso
SELECT conname, pg_get_constraintdef(oid) as constraint_def
FROM pg_constraint 
WHERE conrelid = 'public.usuarios'::regclass 
AND contype = 'c';
