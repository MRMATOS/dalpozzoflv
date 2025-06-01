
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, HelpCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Login = () => {
  const [accessCode, setAccessCode] = useState("");
  const [error, setError] = useState("");
  const { login, loading, user } = useAuth();
  const navigate = useNavigate();

  // Redirecionar se já estiver logado
  if (user) {
    navigate("/dashboard");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessCode.trim()) return;

    setError("");
    const result = await login(accessCode);

    if (result.success) {
      navigate("/dashboard");
    } else {
      setError(result.error || "Erro desconhecido");
    }
  };

  const isFormValid = accessCode.trim().length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
          {/* Logo/Header */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg flex items-center justify-center mx-auto">
              <span className="text-white text-2xl font-bold">FLV</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Sistema FLV</h1>
            <p className="text-gray-600 text-sm">Super Dal Pozzo</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="accessCode" className="text-sm font-medium text-gray-700">
                Código de Acesso
              </label>
              <Input
                id="accessCode"
                type="text"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder="Digite seu código"
                className="w-full"
                autoComplete="off"
                autoFocus
              />
            </div>

            {/* Error Messages */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={!isFormValid || loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? "Verificando..." : "Entrar"}
            </Button>
          </form>

          {/* Help Link */}
          <div className="text-center">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="text-sm text-green-600 hover:text-green-700 flex items-center justify-center gap-1 mx-auto">
                  <HelpCircle className="w-4 h-4" />
                  Problemas com o acesso?
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Problemas com o Acesso?</AlertDialogTitle>
                  <AlertDialogDescription className="space-y-2">
                    <p>Se você está enfrentando dificuldades para acessar o sistema:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Verifique se digitou o código corretamente</li>
                      <li>Códigos são sensíveis a maiúsculas e minúsculas</li>
                      <li>Em caso de primeiro acesso, será solicitada alteração do código</li>
                      <li>Códigos expirados devem ser renovados</li>
                    </ul>
                    <p className="text-sm mt-4">
                      Entre em contato com o administrador do sistema para obter um novo código de acesso.
                    </p>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Fechar</AlertDialogCancel>
                  <AlertDialogAction className="bg-green-600 hover:bg-green-700">
                    Entendi
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
