
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Se o usuário estiver logado, não mostrar nada (será redirecionado)
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md mx-auto">
        <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-6">
          <span className="text-white text-3xl font-bold">FLV</span>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Sistema FLV
        </h1>
        
        <p className="text-gray-600 mb-8">
          Super Dal Pozzo - Sistema de Gestão de Frutas, Legumes e Verduras
        </p>
        
        <Button 
          onClick={() => navigate('/login')}
          size="lg"
          className="bg-green-600 hover:bg-green-700 text-white px-8"
        >
          Acessar Sistema
        </Button>
      </div>
    </div>
  );
};

export default Index;
