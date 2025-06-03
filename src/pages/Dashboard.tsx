
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Package, ShoppingCart, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    // Itens para todos os usuários autenticados
    ...(profile ? [
      {
        title: 'Cotação',
        description: 'Criar e gerenciar cotações de fornecedores',
        icon: ShoppingCart,
        path: '/cotacao',
        color: 'from-blue-600 to-indigo-600',
        roles: ['master', 'comprador']
      }
    ] : []),

    // Itens específicos por tipo de usuário
    ...(profile?.tipo === 'master' ? [
      {
        title: 'Configurações',
        description: 'Gerenciar produtos, fornecedores e usuários',
        icon: Users,
        path: '/configuracoes',
        color: 'from-purple-600 to-pink-600',
        roles: ['master']
      }
    ] : []),

    ...(profile?.tipo === 'estoque' ? [
      {
        title: 'Controle de Estoque',
        description: 'Atualizar quantidades de produtos por loja',
        icon: Package,
        path: '/estoque',
        color: 'from-green-600 to-emerald-600',
        roles: ['estoque']
      }
    ] : [])
  ];

  // Filtrar itens baseado no tipo do usuário
  const availableItems = menuItems.filter(item => 
    item.roles.includes(profile?.tipo || '')
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="text-white text-sm" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
                <p className="text-sm text-gray-500">Sistema FLV - Dalpozzo</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{profile?.nome}</p>
                <p className="text-xs text-gray-500 capitalize">{profile?.tipo} - {profile?.loja}</p>
              </div>
              <Button variant="outline" onClick={signOut} size="sm">
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Bem-vindo, {profile?.nome}!
          </h2>
          <p className="text-gray-600">
            Selecione uma opção abaixo para começar.
          </p>
        </div>

        {/* Menu Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {availableItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <Card 
                key={index} 
                className="hover:shadow-lg transition-shadow duration-200 cursor-pointer"
                onClick={() => navigate(item.path)}
              >
                <CardHeader className="pb-3">
                  <div className={`w-12 h-12 bg-gradient-to-br ${item.color} rounded-lg flex items-center justify-center mb-4`}>
                    <Icon className="text-white text-xl" />
                  </div>
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="outline">
                    Acessar
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {availableItems.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma funcionalidade disponível
            </h3>
            <p className="text-gray-500">
              Entre em contato com o administrador para obter acesso.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
