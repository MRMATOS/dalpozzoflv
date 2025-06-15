
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, Trash2 } from 'lucide-react';

interface Fornecedor {
  id: string;
  nome: string;
}

interface FornecedorInputProps {
  fornecedores: Fornecedor[];
  fornecedoresProcessados: Set<string>;
  fornecedorSelecionado: string | null;
  mensagemAtual: string;
  onFornecedorSelect: (id: string) => void;
  onMensagemChange: (value: string) => void;
  onProcessar: () => void;
}

const FornecedorInput: React.FC<FornecedorInputProps> = ({
  fornecedores,
  fornecedoresProcessados,
  fornecedorSelecionado,
  mensagemAtual,
  onFornecedorSelect,
  onMensagemChange,
  onProcessar,
}) => {
  return (
    <div className="mb-8">
      <div className="flex flex-wrap gap-3 mb-4">
        {fornecedores.map(fornecedor => {
          const isProcessado = fornecedoresProcessados.has(fornecedor.nome);
          const isSelecionado = fornecedorSelecionado === fornecedor.id;
          
          return (
            <Button
              key={fornecedor.id}
              onClick={() => onFornecedorSelect(fornecedor.id)}
              variant={isProcessado ? "default" : isSelecionado ? "default" : "outline"}
              className={`${
                isProcessado 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : isSelecionado 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : ''
              }`}
            >
              {fornecedor.nome}
              {isProcessado && <Trash2 className="w-4 h-4 ml-2" />}
            </Button>
          );
        })}
      </div>

      {fornecedorSelecionado && (
        <Card className="mb-4">
          <CardContent className="p-4">
            <textarea
              placeholder="Cole aqui a mensagem do WhatsApp com os produtos..."
              value={mensagemAtual}
              onChange={(e) => onMensagemChange(e.target.value)}
              className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none relative z-10 bg-white"
            />
            <div className="mt-3">
              <Button onClick={onProcessar} className="bg-blue-600 hover:bg-blue-700">
                <Upload className="w-4 h-4 mr-2" />
                Processar Mensagem
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FornecedorInput;
