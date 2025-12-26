import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

const YANDEX_CLIENT_ID = import.meta.env.VITE_YANDEX_CLIENT_ID || '';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/lobby');
      return;
    }

    (window as any).onTelegramAuth = async (user: any) => {
      try {
        console.log('Telegram auth data:', user);
        const response = await fetch('https://functions.poehali.dev/fc7750dc-85bb-4878-8cf4-66b7110d39ba', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(user),
        });

        const data = await response.json();
        console.log('Backend response:', data);
        
        if (data.user && data.token) {
          login(data.user, data.token);
          navigate('/lobby');
        } else {
          console.error('Login failed:', data);
        }
      } catch (error) {
        console.error('Auth error:', error);
      }
    };

    const container = document.getElementById('telegram-login-container');
    if (container && container.children.length === 0) {
      const script = document.createElement('script');
      script.src = 'https://telegram.org/js/telegram-widget.js?22';
      script.setAttribute('data-telegram-login', 'MotoMafia_bot');
      script.setAttribute('data-size', 'large');
      script.setAttribute('data-onauth', 'onTelegramAuth(user)');
      script.setAttribute('data-request-access', 'write');
      script.async = true;
      container.appendChild(script);
    }
  }, [isAuthenticated, navigate, login]);

  const handleYandexLogin = () => {
    if (!YANDEX_CLIENT_ID) {
      alert('Яндекс авторизация не настроена. Добавьте YANDEX_CLIENT_ID в секреты проекта.');
      return;
    }
    const redirectUri = 'https://preview--mafia-biker-chat.poehali.dev/auth/yandex/callback';
    const authUrl = `https://oauth.yandex.ru/authorize?response_type=code&client_id=${YANDEX_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}`;
    window.location.href = authUrl;
  };

  return (
    <div className="min-h-screen concrete-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-12 animate-slide-up">
          <div className="text-8xl mb-4">🏍️</div>
          <h1 className="text-5xl font-heading font-black text-transparent bg-gradient-to-r from-biker-orange via-biker-flame to-biker-yellow bg-clip-text graffiti-text mb-2">
            MAFIA
          </h1>
          <p className="text-xl text-biker-cyan font-heading">Байкерская Мафия</p>
        </div>

        <div className="bg-card border-2 border-biker-orange rounded-xl p-8 spray-shadow animate-spray-paint">
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-heading font-bold text-foreground mb-2">
                Войти через Telegram
              </h2>
              <p className="text-muted-foreground">
                Для начала игры нужно авторизоваться
              </p>
            </div>

            <div id="telegram-login-container" className="flex justify-center"></div>

            {YANDEX_CLIENT_ID && (
              <>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">или</span>
                  </div>
                </div>

                <Button
                  onClick={handleYandexLogin}
                  className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-heading font-semibold py-6 text-lg"
                  size="lg"
                >
                  <Icon name="UserCircle" className="mr-2" size={24} />
                  Войти через Яндекс ID
                </Button>
              </>
            )}

            <div className="pt-4 border-t border-border mt-6">
              <div className="flex items-start gap-3 text-sm text-muted-foreground">
                <Icon name="Info" className="mt-0.5 flex-shrink-0" size={16} />
                <p>
                  После входа вы получите доступ к игре, профилю, кланам и рейтингу
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Icon name="Users" size={16} />
              <span>Кланы</span>
            </div>
            <div className="flex items-center gap-2">
              <Icon name="Trophy" size={16} />
              <span>Рейтинг</span>
            </div>
            <div className="flex items-center gap-2">
              <Icon name="Award" size={16} />
              <span>Достижения</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}