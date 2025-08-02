documentação da extração de produtos na cotação

## Visão geral

Esta documentação descreve o comportamento atual do sistema de cotação, problemas identificados, testes realizados e sugestões de correções para melhorar o processo de identificação e associação dos produtos e suas variações.

## Comportamento atual observado

### Associações corretas identificadas

- **Produto com variação existente**:
  - Exemplo: Produto "abacaxi-havaí" foi corretamente identificado, mesmo com variação escrita como "Hawaí". O sistema reconheceu corretamente "Hawaí" como "Havaí".

### Problemas identificados

1. **Associação incorreta ao criar variação "padrão" artificialmente**:

   - Quando o fornecedor envia um produto sem variação, o sistema está adicionando artificialmente a palavra "padrão".
   - Exemplo: Produto "abobrinha" sem variação está associando incorretamente à "cenoura padrão" por falta da variação específica cadastrada no produto.

2. **Associação incorreta de variações existentes**:

   - Exemplo: Produto "banana-caturra" sendo associado erroneamente à variação “Nanica".
   - Causa: "banana-caturra" não estava cadastrada como uma variação independente, e estava dentro da variação “Nanica" no arquivo de dicionário (dicionario`produto.ts`).

3. **Falta de associação correta ao produto pai**:

   - Exemplo: Produto "laranja Bahia" deveria se associar ao produto pai "laranja" quando a variação específica não existe. Atualmente fica como NULL.

4. **Erros por falta de variações cadastradas**:

   - Produtos como "Acelga", "Batata Inhame (Yame)", “Caqui Chocolate", "Goiaba Garauda" e "Melão Melícia" precisam ter suas variações adicionadas manualmente para evitar associações incorretas ou artificiais.

## Testes realizados e resultados

| Teste                                                         | Resultado                                         |
| ------------------------------------------------------------- | ------------------------------------------------- |
| Mudança ortográfica na variação (ex: Havaí → Hawái)           | Sucesso, o sistema reconheceu corretamente        |
| Adicionar variação "padrão" ao produto pai (abobrinha)        | Sucesso, evitou associação incorreta à cenoura    |
| Adicionar manualmente variação "banana-caturra" no dicionário | Sucesso, associou corretamente a "banana-caturra" |
| Adicionar "Bahia Nacional" à variação "laranja"               | Necessário, evita NULL                            |
| Adicionar "Melícia" à variação "melão"                        | Sucesso, evitou adição da palavra "padrão"        |

## Recomendações técnicas para melhorias

### Lógica sugerida para extração

- O sistema deve identificar primeiramente o produto pai.
- Após identificação do produto pai, o sistema deve buscar variações exclusivamente dentro das variações cadastradas desse produto pai.
- Caso não encontre correspondência na mensagem do fornecedor com as variações cadastradas, o sistema deve associar ao produto pai diretamente, sem adicionar a palavra "padrão".

Exemplo correto:

- Fornecedor envia "alface crespa" → Produto pai "alface" identificado → Variação "crespa" existe → Associação correta "alface crespa".
- Fornecedor envia "ameixa importada" → Produto pai "ameixa" identificado → Verifica se "importada" existe nas variações de "ameixa" → Se sim, "ameixa importada"; se não, "ameixa".

### Correções e melhorias adicionais na interface

- Permitir a correção rápida de associação diretamente na interface da cotação (igual ao ajuste de preços).
- O botão de adição de variações diretamente no cadastro do produto deve ser corrigido para funcionar corretamente (atualmente está inoperante).

## Próximos passos para base de conhecimento

- Incluir mensagens reais dos fornecedores para entender variações ortográficas e nomes alternativos.
- Criar um dicionário robusto de sinônimos para facilitar a associação correta de produtos.
- Manter histórico de correções feitas pelos usuários para o sistema aprender e otimizar automaticamente futuras associações.

