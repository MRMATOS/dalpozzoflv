
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ProdutosTab from '@/components/configuracoes/ProdutosTab';
import UsuariosTab from '@/components/configuracoes/UsuariosTab';
import FornecedoresTab from '@/components/configuracoes/FornecedoresTab';
import LojasTab from '@/components/configuracoes/LojasTab';

const Configuracoes = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/dashboard')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar</span>
              </Button>
              <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">FLV</span>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Configurações</h1>
                <p className="text-sm text-gray-500">Super Dal Pozzo</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="produtos" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="produtos">Produtos</TabsTrigger>
            <TabsTrigger value="usuarios">Usuários</TabsTrigger>
            <TabsTrigger value="fornecedores">Fornecedores</TabsTrigger>
            <TabsTrigger value="lojas">Lojas</TabsTrigger>
          </TabsList>
          
          <TabsContent value="produtos" className="mt-6">
            <ProdutosTab />
          </TabsContent>
          
          <TabsContent value="usuarios" className="mt-6">
            <UsuariosTab />
          </TabsContent>
          
          <TabsContent value="fornecedores" className="mt-6">
            <FornecedoresTab />
          </TabsContent>
          
          <TabsContent value="lojas" className="mt-6">
            <LojasTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Configuracoes;
