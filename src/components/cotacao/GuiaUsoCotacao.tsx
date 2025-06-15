
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

const GuiaUsoCotacao = () => {
  return (
    <Card className="bg-blue-50 border-l-4 border-blue-500">
      <CardContent className="p-4">
        <h3 className="font-semibold text-blue-800 mb-2">Como usar:</h3>
        <ol className="text-blue-700 text-sm space-y-1">
          <li>1. Clique em um fornecedor para selecioná-lo (botão fica azul)</li>
          <li>2. Cole a mensagem do WhatsApp na área de texto</li>
          <li>3. Clique em "Processar Mensagem" (botão do fornecedor fica verde)</li>
          <li>4. Repita para outros fornecedores</li>
          <li>5. Use a busca para encontrar produtos rapidamente</li>
          <li>6. Insira as quantidades desejadas para cada produto</li>
          <li>7. Compare os totais por fornecedor na última linha</li>
          <li>8. Clique em "Ver Resumo" para gerar os pedidos</li>
        </ol>
      </CardContent>
    </Card>
  );
};

export default GuiaUsoCotacao;
