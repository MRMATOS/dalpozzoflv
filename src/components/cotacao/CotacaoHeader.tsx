
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';

interface Profile {
  nome?: string | null;
}

interface CotacaoHeaderProps {
  profile: Profile | null;
  salvandoAutomaticamente: boolean;
}

const CotacaoHeader: React.FC<CotacaoHeaderProps> = ({ profile, salvandoAutomaticamente }) => {
  const navigate = useNavigate();

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Nova Cotação</h1>
              <p className="text-sm text-gray-500">Sistema FLV</p>
            </div>
            {salvandoAutomaticamente && (
              <div className="flex items-center text-xs text-blue-600">
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                Salvando...
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{profile?.nome}</p>
              <p className="text-xs text-gray-500">Comprador</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default CotacaoHeader;
