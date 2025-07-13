import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useIsMobile } from "@/hooks/use-mobile";
import { ShoppingCart, Package, Calculator, History, Settings, BarChart3, Users, Store, LogOut, Building2, Shield, FileText } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, profile, hasRole, signOut } = useAuth();
  const { canView, loading: permissionsLoading } = usePermissions();
  const isMobile = useIsMobile();

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  if (permissionsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando permissões...</p>
        </div>
      </div>
    );
  }

  const cards = [
    // Primeira linha: Cotação, Gestão CD, Recebimento
    canView('cotacao') && {
      title: "Cotação",
      description: "Comparar preços e criar pedidos",
      icon: Calculator,
      color: "bg-purple-500",
      onClick: () => navigate("/cotacao")
    },
    canView('pedido_simples') && {
      title: "Pedido Simples",
      description: "Pedidos rápidos com fornecedores",
      icon: FileText,
      color: "bg-amber-500",
      onClick: () => navigate("/pedido-simples")
    },
    canView('gestao_cd') && {
      title: "Gestão CD",
      description: "Gerenciar requisições e transferências",
      icon: Building2,
      color: "bg-cyan-500",
      onClick: () => navigate("/gestao-cd")
    },
    (profile?.tipo === 'cd' || profile?.tipo === 'master') && {
      title: "Recebimento",
      description: "Registrar recebimento de mercadorias no CD",
      icon: Package,
      color: "bg-purple-500",
      onClick: () => navigate("/recebimento")
    },
    // Segunda linha: Requisições, Estoque, Histórico de Pedidos
    canView('requisicoes') && {
      title: "Requisições",
      description: "Criar e gerenciar requisições",
      icon: ShoppingCart,
      color: "bg-green-500",
      onClick: () => navigate("/requisicoes")
    },
    canView('estoque') && {
      title: "Estoque",
      description: "Gerenciar estoque de produtos",
      icon: Package,
      color: "bg-blue-500",
      onClick: () => navigate("/estoque")
    },
    canView('historico_pedidos') && {
      title: "Histórico de Pedidos",
      description: "Visualizar pedidos de compra",
      icon: BarChart3,
      color: "bg-indigo-500",
      onClick: () => navigate("/historico-pedidos")
    },
    // Terceira linha: Histórico de Requisições, Admin de Permissões, Configurações
    canView('historico_requisicoes') && {
      title: "Histórico de Requisições",
      description: "Visualizar requisições anteriores",
      icon: History,
      color: "bg-orange-500",
      onClick: () => navigate("/historico-requisicoes")
    },
    hasRole('master') && {
      title: "Administração de Permissões",
      description: "Gerenciar permissões de usuários",
      icon: Shield,
      color: "bg-red-500",
      onClick: () => navigate("/admin/permissions")
    },
    (canView('configuracoes') || hasRole('comprador')) && {
      title: "Configurações",
      description: "Gerenciar produtos e fornecedores",
      icon: Settings,
      color: "bg-gray-500",
      onClick: () => navigate("/configuracoes")
    }
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Store className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-lg font-semibold text-gray-900">FLV</h1>
              </div>
              {!isMobile && (
                <div className="flex items-center space-x-4 ml-8">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{profile?.nome}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {profile?.loja}
                      </Badge>
                      <Badge variant="default" className={`text-xs ${
                        user?.tipo === 'master' ? 'bg-red-600' : 
                        user?.tipo === 'comprador' ? 'bg-blue-600' :
                        user?.tipo === 'cd' ? 'bg-orange-600' : 'bg-green-600'
                      }`}>
                        {user?.tipo === 'cd' ? 'Centro de Distribuição' : user?.tipo || 'estoque'}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <Button variant="outline" size="sm" onClick={handleLogout} className="flex items-center space-x-2">
              <LogOut className="h-4 w-4" />
              <span>Sair</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Seção de informações do usuário - apenas mobile */}
      {isMobile && (
        <div className="bg-white border-b px-4 sm:px-6 lg:px-8 py-3">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-end">
              <div>
                <p className="text-sm font-medium text-gray-900">{profile?.nome}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {profile?.loja}
                  </Badge>
                  <Badge variant="default" className={`text-xs ${
                    user?.tipo === 'master' ? 'bg-red-600' : 
                    user?.tipo === 'comprador' ? 'bg-blue-600' :
                    user?.tipo === 'cd' ? 'bg-orange-600' : 'bg-green-600'
                  }`}>
                    {user?.tipo === 'cd' ? 'Centro de Distribuição' : user?.tipo || 'estoque'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h2>
          <p className="text-gray-600">Sistema de compras FLV Super Dal Pozzo.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card: any, index) => {
            const IconComponent = card.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${card.color}`}>
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{card.title}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4 text-sm">
                    {card.description}
                  </CardDescription>
                  <Button onClick={card.onClick} className="w-full bg-blue-600 hover:bg-blue-700" variant="default">
                    Acessar
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>


        {cards.length === 0 && (
          <Card className="text-center py-8">
            <CardContent>
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                Nenhuma funcionalidade disponível para seu perfil.
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Entre em contato com o administrador para verificar suas permissões.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
