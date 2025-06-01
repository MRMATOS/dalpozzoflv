
import { ShoppingCart, Users, TrendingUp, FileText, Smartphone, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Index = () => {
  const features = [
    {
      icon: FileText,
      title: "Requisições Digitais",
      description: "Elimine papel e pranchetas. Crie requisições online de forma rápida e organizada."
    },
    {
      icon: Users,
      title: "Múltiplos Perfis",
      description: "Sistema com perfis específicos: requisitante, comprador, estoque e master."
    },
    {
      icon: TrendingUp,
      title: "Cotações Automáticas",
      description: "Compare preços de fornecedores em tempo real e tome decisões inteligentes."
    },
    {
      icon: Smartphone,
      title: "Mobile First",
      description: "Acesse de qualquer lugar, substituindo WhatsApp por uma plataforma profissional."
    }
  ];

  const stats = [
    { number: "100%", label: "Digital", description: "Fim do papel" },
    { number: "5", label: "Perfis", description: "Diferentes usuários" },
    { number: "24/7", label: "Disponível", description: "Sempre online" },
    { number: "∞", label: "Fornecedores", description: "Sem limites" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-green-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">FLV Digital</h1>
                <p className="text-sm text-green-600">Super Dal Pozzo</p>
              </div>
            </div>
            <Button className="bg-green-600 hover:bg-green-700">
              Acessar Sistema
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Digitalização do Setor
              <span className="text-green-600"> FLV</span>
            </h2>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Transforme o processo de compras de Frutas, Legumes e Verduras do papel para o digital. 
              Sistema completo para requisições, cotações e pedidos.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-green-600 hover:bg-green-700 text-lg px-8">
                <Clock className="w-5 h-5 mr-2" />
                Começar Agora
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 border-green-200 hover:bg-green-50">
                Ver Demonstração
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-green-600 mb-2">{stat.number}</div>
                <div className="text-lg font-semibold text-gray-900 mb-1">{stat.label}</div>
                <div className="text-sm text-gray-600">{stat.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Funcionalidades Principais
            </h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Substitua o fluxo manual de papel, prancheta e WhatsApp por uma plataforma 
              moderna e eficiente adaptada à realidade dos compradores.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="border-green-100 hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="w-6 h-6 text-green-600" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-emerald-600">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Pronto para Digitalizar suas Compras?
            </h3>
            <p className="text-xl text-green-100 mb-8">
              Configure o sistema com seus fornecedores, produtos e usuários. 
              Comece a economizar tempo e papel hoje mesmo.
            </p>
            <Button size="lg" className="bg-white text-green-600 hover:bg-gray-100 text-lg px-8">
              Iniciar Configuração
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">FLV Digital</span>
            </div>
            <p className="text-gray-400 mb-4">
              Sistema de Compras Digital - Super Dal Pozzo
            </p>
            <p className="text-sm text-gray-500">
              Transformando processos manuais em soluções digitais eficientes
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
