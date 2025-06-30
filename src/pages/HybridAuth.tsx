
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useHybridAuth } from "@/contexts/HybridAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Chrome } from "lucide-react";

const HybridAuth = () => {
  const [codigoAcesso, setCodigoAcesso] = useState('');
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const { user, signInWithCode, signInWithGoogle } = useHybridAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  if (user) {
    navigate("/dashboard");
    return null;
  }

  const handleCodeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!codigoAcesso.trim()) {
      setError("Código de acesso é obrigatório");
      setLoading(false);
      return;
    }

    try {
      const result = await signInWithCode(codigoAcesso.trim());
      
      if (result.success) {
        navigate("/dashboard");
      } else {
        setError(result.error || "Erro ao fazer login");
      }
    } catch (error: any) {
      console.error('Erro no login:', error);
      setError("Erro interno. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);

    try {
      const result = await signInWithGoogle();
      
      if (!result.success && result.error) {
        setError(result.error);
      }
      // Se sucesso, o redirecionamento será automático via callback
    } catch (error: any) {
      console.error('Erro no login Google:', error);
      setError("Erro ao conectar com Google. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">FLV</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Sistema FLV</h1>
          <p className="text-gray-600 text-sm">Super Dal Pozzo</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Acesso ao Sistema</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Login com Google */}
            <div className="space-y-3">
              <Button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center space-x-2"
              >
                <Chrome className="w-4 h-4" />
                <span>{loading ? "Conectando..." : "Entrar com Google"}</span>
              </Button>
              <p className="text-xs text-gray-500 text-center">
                Recomendado para Dal Pozzo Master
              </p>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">ou</span>
              </div>
            </div>

            {/* Login com Código */}
            <form onSubmit={handleCodeLogin} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="codigoAcesso" className="text-sm font-medium text-gray-700">
                  Código de Acesso
                </label>
                <Input
                  id="codigoAcesso"
                  type="text"
                  value={codigoAcesso}
                  onChange={(e) => setCodigoAcesso(e.target.value)}
                  placeholder="Digite seu código de acesso"
                  autoComplete="username"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                {loading ? "Entrando..." : "Entrar com Código"}
              </Button>
            </form>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="text-xs text-gray-500 space-y-1">
              <p><strong>Google:</strong> Para usuários master</p>
              <p><strong>Código:</strong> Para funcionários das lojas</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HybridAuth;
