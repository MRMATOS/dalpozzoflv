import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield } from "lucide-react";

const PoliticaPrivacidade = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button
            onClick={() => navigate("/")}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar</span>
          </Button>
        </div>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Shield className="text-white text-2xl" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Política de Privacidade</h1>
          <p className="text-gray-600">Sistema FLV - Super Dal Pozzo</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Política de Privacidade</CardTitle>
            <p className="text-sm text-gray-600">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Nota:</strong> Este aplicativo está sendo desenvolvido por Rodrigo Matos para testes internos no Super Dal Pozzo. 
                Para suporte ou dúvidas, entre em contato através do e-mail: <strong>dalpozzo.ti@gmail.com</strong>
              </p>
            </div>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Dados que Coletamos</h2>
              <p className="text-gray-700 mb-2">
                Para garantir o funcionamento do sistema, coletamos apenas as seguintes informações através da autenticação com Google:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>Endereço de e-mail da conta Google</li>
                <li>Foto de perfil da conta Google</li>
                <li>Nome associado à conta Google</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Como Utilizamos seus Dados</h2>
              <p className="text-gray-700 mb-2">
                Os dados coletados são utilizados exclusivamente para:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>Autenticação e identificação do usuário no sistema</li>
                <li>Controle de acesso às funcionalidades do aplicativo</li>
                <li>Registro de atividades para fins de auditoria interna</li>
              </ul>
              <p className="text-gray-700 mt-2">
                <strong>Não utilizamos seus dados para nenhuma outra finalidade.</strong>
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Compartilhamento de Dados</h2>
              <p className="text-gray-700">
                <strong>Não compartilhamos, vendemos ou distribuímos seus dados pessoais com terceiros.</strong> 
                Todas as informações permanecem armazenadas de forma segura em nossa infraestrutura e são 
                acessíveis apenas pelos administradores autorizados do sistema.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Segurança dos Dados</h2>
              <p className="text-gray-700">
                Implementamos medidas de segurança adequadas para proteger suas informações pessoais contra 
                acesso não autorizado, alteração, divulgação ou destruição. Utilizamos criptografia e 
                protocolos seguros para todas as transmissões de dados.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Seus Direitos</h2>
              <p className="text-gray-700 mb-2">
                Você tem o direito de:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>Acessar os dados que temos sobre você</li>
                <li>Solicitar a correção de dados incorretos</li>
                <li>Solicitar a exclusão de seus dados</li>
                <li>Revogar o consentimento a qualquer momento</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Contato</h2>
              <p className="text-gray-700">
                Para exercer seus direitos ou esclarecer dúvidas sobre esta Política de Privacidade, 
                entre em contato conosco através do e-mail: <strong>dalpozzo.ti@gmail.com</strong>
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Alterações nesta Política</h2>
              <p className="text-gray-700">
                Esta Política de Privacidade pode ser atualizada periodicamente. Notificaremos sobre 
                mudanças significativas através do próprio sistema ou por e-mail.
              </p>
            </section>
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-sm text-gray-500">
          <p>© 2024 Super Dal Pozzo - Sistema FLV</p>
          <p>Desenvolvido por Rodrigo Matos para uso interno</p>
        </div>
      </div>
    </div>
  );
};

export default PoliticaPrivacidade;