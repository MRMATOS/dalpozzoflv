
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Auth = () => {
  const [codigoAcesso, setCodigoAcesso] = useState('');
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  if (user) {
    navigate("/dashboard");
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!codigoAcesso.trim()) {
      setError("Código de acesso é obrigatório");
      setLoading(false);
      return;
    }

    try {
      // Buscar usuário pelo código de acesso
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('codigo_acesso', codigoAcesso.trim())
        .eq('ativo', true)
        .single();

      if (profileError || !profile) {
        setError("Código de acesso inválido ou usuário inativo");
        setLoading(false);
        return;
      }

      // Simular login direto usando o ID do usuário
      // Para implementação temporária, vamos usar signInAnonymously e depois associar o perfil
      const { data: authData, error: authError } = await supabase.auth.signInAnonymously();

      if (authError) {
        setError("Erro ao fazer login. Tente novamente.");
        setLoading(false);
        return;
      }

      // Atualizar o perfil para associar ao usuário anônimo
      if (authData.user) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ id: authData.user.id })
          .eq('codigo_acesso', codigoAcesso.trim());

        if (updateError) {
          console.error('Erro ao atualizar perfil:', updateError);
        }
      }

      navigate("/dashboard");
    } catch (error: any) {
      console.error('Erro no login:', error);
      setError("Erro interno. Tente novamente.");
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
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
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
                  autoFocus
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {loading ? "Entrando..." : "Entrar"}
              </Button>
            </form>

            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
