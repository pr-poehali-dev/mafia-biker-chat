import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function YandexCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    const code = searchParams.get('code');
    
    if (!code) {
      navigate('/');
      return;
    }

    const handleYandexAuth = async () => {
      try {
        const redirectUri = `${window.location.origin}/auth/yandex/callback`;
        const response = await fetch('https://functions.poehali.dev/9e557f0f-c20f-4ff7-b370-7c13bbb9f321', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, redirect_uri: redirectUri }),
        });

        const data = await response.json();
        
        if (data.user && data.token) {
          login(data.user, data.token);
          navigate('/lobby');
        } else {
          console.error('Auth failed:', data);
          navigate('/');
        }
      } catch (error) {
        console.error('Yandex auth error:', error);
        navigate('/');
      }
    };

    handleYandexAuth();
  }, [searchParams, navigate, login]);

  return (
    <div className="min-h-screen concrete-bg flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4 animate-spin">🏍️</div>
        <p className="text-xl text-biker-cyan font-heading">Авторизация...</p>
      </div>
    </div>
  );
}
