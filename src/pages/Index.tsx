
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useHybridAuth } from "@/contexts/HybridAuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useHybridAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg flex items-center justify-center mx-auto mb-6">
            <span className="text-white text-3xl font-bold">FLV</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Sistema FLV</h1>
          <p className="text-xl text-gray-600">Super Dal Pozzo</p>
          <p className="text-gray-500 mt-2">Gestão completa de frutas, legumes e verduras</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-center text-2xl">Bem-vindo ao Sistema</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <p className="text-gray-600">
                Sistema integrado para gestão de estoque, requisições, cotações e recebimento de produtos FLV.
              </p>
              
              <Button
                onClick={() => navigate("/auth")}
                size="lg"
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3"
              >
                Acessar Sistema
              </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mt-8 text-sm text-gray-600">
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-800">Funcionalidades:</h3>
                <ul className="space-y-1">
                  <li>• Controle de estoque por loja</li>
                  <li>• Requisições de compra</li>
                  <li>• Cotações com fornecedores</li>
                  <li>• Gestão de recebimentos</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-800">Acesso:</h3>
                <ul className="space-y-1">
                  <li>• Login com Google (Master)</li>
                  <li>• Código de acesso (Funcionários)</li>
                  <li>• Interface responsiva</li>
                  <li>• Segurança avançada</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-sm text-gray-500">
          <p>© 2024 Super Dal Pozzo - Sistema FLV v2.0</p>
          <p>Desenvolvido com segurança e praticidade</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
