import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";

const TermosUso = () => {
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
            <FileText className="text-white text-2xl" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Termos de Uso</h1>
          <p className="text-gray-600">Sistema FLV - Super Dal Pozzo</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Termos de Uso</CardTitle>
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
              <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Aceitação dos Termos</h2>
              <p className="text-gray-700">
                Ao acessar e utilizar o Sistema FLV do Super Dal Pozzo, você concorda em cumprir e 
                ficar vinculado a estes Termos de Uso. Se você não concordar com algum destes termos, 
                não deve utilizar este aplicativo.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Natureza do Serviço</h2>
              <p className="text-gray-700">
                Este aplicativo é fornecido <strong>"como está"</strong> e <strong>"conforme disponível"</strong>, 
                sem garantias de qualquer tipo, expressas ou implícitas. O sistema está em desenvolvimento 
                e pode apresentar instabilidades ou funcionalidades em teste.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Uso por Conta e Risco</h2>
              <p className="text-gray-700 mb-2">
                O uso deste aplicativo é de sua inteira responsabilidade. Você reconhece e concorda que:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>Utiliza o sistema por sua conta e risco</li>
                <li>É responsável por manter a confidencialidade de suas credenciais de acesso</li>
                <li>Deve utilizar o sistema apenas para fins legítimos e autorizados</li>
                <li>Não deve tentar acessar áreas restritas ou comprometer a segurança do sistema</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Limitação de Responsabilidade</h2>
              <p className="text-gray-700">
                Em nenhuma circunstância o Super Dal Pozzo ou seus desenvolvedores serão responsáveis 
                por danos diretos, indiretos, incidentais, especiais ou consequenciais resultantes do 
                uso ou da incapacidade de usar este aplicativo.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Uso Interno</h2>
              <p className="text-gray-700">
                Este sistema é destinado exclusivamente para uso interno dos funcionários autorizados 
                do Super Dal Pozzo. O acesso é controlado e monitorado. O uso inadequado pode resultar 
                na suspensão do acesso.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Propriedade Intelectual</h2>
              <p className="text-gray-700">
                Todo o conteúdo, design, funcionalidades e códigos deste aplicativo são de propriedade 
                do Super Dal Pozzo e estão protegidos pelas leis de propriedade intelectual aplicáveis.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Modificações dos Termos</h2>
              <p className="text-gray-700">
                Estes Termos de Uso podem ser atualizados a qualquer momento, sem aviso prévio. 
                É sua responsabilidade revisar periodicamente estes termos. O uso continuado 
                do aplicativo após as modificações constitui aceitação dos novos termos.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">8. Disponibilidade do Serviço</h2>
              <p className="text-gray-700">
                Não garantimos que o aplicativo estará disponível ininterruptamente. Podemos 
                suspender, interromper ou modificar o serviço a qualquer momento, com ou sem aviso prévio, 
                para manutenção, atualizações ou por qualquer outro motivo.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">9. Lei Aplicável</h2>
              <p className="text-gray-700">
                Estes Termos de Uso são regidos pelas leis brasileiras. Qualquer disputa será 
                resolvida nos tribunais competentes do Brasil.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">10. Contato</h2>
              <p className="text-gray-700">
                Para dúvidas sobre estes Termos de Uso ou questões relacionadas ao aplicativo, 
                entre em contato através do e-mail: <strong>dalpozzo.ti@gmail.com</strong>
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

export default TermosUso;