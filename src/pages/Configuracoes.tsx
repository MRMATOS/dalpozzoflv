
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
  const navigate = useNavigate();
  const { hasRole, user } = useAuth();

  const isMaster = hasRole('master');
  const isComprador = hasRole('comprador') || user?.tipo === 'comprador';

  const availableTabs = isMaster 
    ? ['produtos', 'usuarios', 'fornecedores', 'lojas']
    : isComprador 
    ? ['produtos', 'fornecedores']
    : ['produtos', 'fornecedores'];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar</span>
            </Button>
            <div className="ml-4">
              <h1 className="text-lg font-semibold text-gray-900">Configurações</h1>
              <p className="text-sm text-gray-500">Super Dal Pozzo</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="produtos" className="w-full">
          <TabsList className={`grid w-full ${isMaster ? 'grid-cols-4' : 'grid-cols-2'}`}>
            {availableTabs.includes('produtos') && (
              <TabsTrigger value="produtos">Produtos</TabsTrigger>
            )}
            {availableTabs.includes('usuarios') && (
              <TabsTrigger value="usuarios">Usuários</TabsTrigger>
            )}
            {availableTabs.includes('fornecedores') && (
              <TabsTrigger value="fornecedores">Fornecedores</TabsTrigger>
            )}
            {availableTabs.includes('lojas') && (
              <TabsTrigger value="lojas">Lojas</TabsTrigger>
            )}
          </TabsList>
          
          {availableTabs.includes('produtos') && (
            <TabsContent value="produtos" className="mt-6">
              <ProdutosTab />
            </TabsContent>
          )}
          
          {availableTabs.includes('usuarios') && (
            <TabsContent value="usuarios" className="mt-6">
              <UsuariosTab />
            </TabsContent>
          )}
          
          {availableTabs.includes('fornecedores') && (
            <TabsContent value="fornecedores" className="mt-6">
              <FornecedoresTab />
            </TabsContent>
          )}
          
          {availableTabs.includes('lojas') && (
            <TabsContent value="lojas" className="mt-6">
              <LojasTab />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
};

export default Configuracoes;
