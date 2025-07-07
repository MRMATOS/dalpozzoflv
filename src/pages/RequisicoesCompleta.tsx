import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Package, CheckCircle, History as HistoryIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import RequisicoesTab from '@/components/requisicoes/RequisicoesTab';
import ConfirmacaoTab from '@/components/requisicoes/ConfirmacaoTab';
import HistoricoRequisicoes from '@/pages/HistoricoRequisicoes';

const RequisicoesCompleta = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState('requisicao');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header Fixo */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Requisições</h1>
                <p className="text-sm text-gray-500">{profile?.loja}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs Navigation */}
      <div className="bg-white border-b sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className={`grid w-full grid-cols-3 ${isMobile ? 'h-12' : 'h-10'}`}>
              <TabsTrigger 
                value="requisicao" 
                className={`flex items-center gap-2 ${isMobile ? 'text-xs px-2' : 'text-sm'}`}
              >
                <Package className="h-4 w-4" />
                {isMobile ? 'Requisição' : 'Requisição'}
              </TabsTrigger>
              <TabsTrigger 
                value="confirmacao" 
                className={`flex items-center gap-2 ${isMobile ? 'text-xs px-2' : 'text-sm'}`}
              >
                <CheckCircle className="h-4 w-4" />
                {isMobile ? 'Confirmação' : 'Confirmação'}
              </TabsTrigger>
              <TabsTrigger 
                value="historico" 
                className={`flex items-center gap-2 ${isMobile ? 'text-xs px-2' : 'text-sm'}`}
              >
                <HistoryIcon className="h-4 w-4" />
                {isMobile ? 'Histórico' : 'Histórico'}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>


      {/* Content */}
      <div className="flex-1">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full">
          <TabsContent value="requisicao" className="mt-0 h-full">
            <RequisicoesTab />
          </TabsContent>
          <TabsContent value="confirmacao" className="mt-0 h-full">
            <ConfirmacaoTab />
          </TabsContent>
          <TabsContent value="historico" className="mt-0 h-full">
            <HistoricoRequisicoes embedded={true} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default RequisicoesCompleta;