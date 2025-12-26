import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import Icon from '@/components/ui/icon';

const API_URL = 'https://functions.poehali.dev/5c41a30e-4c90-4aed-9351-0dacd2291ebd';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, token, logout, login } = useAuth();
  const [profileName, setProfileName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    loadProfile();
  }, [user, navigate]);

  const loadProfile = async () => {
    try {
      const response = await fetch(`${API_URL}?path=profile`, {
        headers: { 'X-Auth-Token': token || '' }
      });
      const data = await response.json();
      if (data.user) {
        setUserProfile(data.user);
        if (data.user.profile_created) {
          // Профиль уже создан
        }
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const createProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}?path=profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': token || ''
        },
        body: JSON.stringify({ profile_name: profileName })
      });

      const data = await response.json();

      if (response.ok && data.user) {
        login(data.user, token || '');
        setUserProfile(data.user);
        navigate('/lobby');
      } else {
        setError(data.error || 'Не удалось создать профиль');
      }
    } catch (error) {
      setError('Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const winRate = userProfile?.total_games > 0 ? Math.round((userProfile.wins / userProfile.total_games) * 100) : 0;

  if (!userProfile?.profile_created) {
    return (
      <div className="min-h-screen concrete-bg flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 border-2 border-biker-orange">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">🏍️</div>
            <h1 className="text-3xl font-heading font-black text-transparent bg-gradient-to-r from-biker-orange to-biker-yellow bg-clip-text graffiti-text mb-2">
              Создание профиля
            </h1>
            <p className="text-muted-foreground">
              Выбери уникальное имя для игры
            </p>
          </div>

          <form onSubmit={createProfile} className="space-y-4">
            <div>
              <Label htmlFor="profileName">Игровое имя</Label>
              <Input
                id="profileName"
                value={profileName}
                onChange={e => setProfileName(e.target.value)}
                placeholder="Введи имя (3-50 символов)"
                minLength={3}
                maxLength={50}
                required
                className="text-lg"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Это имя будут видеть другие игроки
              </p>
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive rounded-lg text-destructive text-sm">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full py-6 text-lg" 
              disabled={loading}
            >
              {loading ? 'Создание...' : 'Создать профиль'}
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen concrete-bg">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <header className="flex items-center justify-between mb-8">
          <Button variant="outline" onClick={() => navigate('/lobby')}>
            <Icon name="ArrowLeft" className="mr-2" size={18} />
            Назад
          </Button>
          <Button variant="destructive" onClick={() => { logout(); navigate('/'); }}>
            <Icon name="LogOut" className="mr-2" size={18} />
            Выйти
          </Button>
        </header>

        <div className="space-y-6">
          <Card className="p-8 border-2 border-biker-orange animate-spray-paint">
            <div className="flex items-start gap-6">
              <Avatar className="w-24 h-24 border-4 border-biker-orange">
                <AvatarImage src={userProfile.photo_url} />
                <AvatarFallback className="text-3xl bg-biker-dark">
                  {userProfile.first_name?.[0] || '?'}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <h1 className="text-3xl font-heading font-black text-transparent bg-gradient-to-r from-biker-orange to-biker-yellow bg-clip-text graffiti-text mb-2">
                  {userProfile.profile_name}
                </h1>
                <p className="text-muted-foreground mb-4">
                  {userProfile.first_name} {userProfile.last_name}
                </p>

                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Icon name="Award" className="text-biker-flame" size={20} />
                    <span className="font-semibold">{userProfile.reputation} Rep</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon name="TrendingUp" className="text-biker-cyan" size={20} />
                    <span className="font-semibold">Уровень {userProfile.level}</span>
                  </div>
                  {userProfile.is_admin && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-biker-flame/20 rounded-full">
                      <Icon name="Shield" className="text-biker-flame" size={16} />
                      <span className="text-sm font-semibold text-biker-flame">ADMIN</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6 text-center border border-biker-orange">
              <div className="text-4xl font-bold text-biker-flame mb-2">{userProfile.total_games}</div>
              <div className="text-sm text-muted-foreground">Всего игр</div>
            </Card>
            <Card className="p-6 text-center border border-biker-cyan">
              <div className="text-4xl font-bold text-biker-cyan mb-2">{userProfile.wins}</div>
              <div className="text-sm text-muted-foreground">Побед</div>
            </Card>
            <Card className="p-6 text-center border border-biker-yellow">
              <div className="text-4xl font-bold text-biker-yellow mb-2">{winRate}%</div>
              <div className="text-sm text-muted-foreground">Винрейт</div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
