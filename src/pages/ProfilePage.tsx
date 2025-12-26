import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import Icon from '@/components/ui/icon';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  if (!user) return null;

  const winRate = user.total_games > 0 ? Math.round((user.wins / user.total_games) * 100) : 0;

  const motorcycles = [
    { id: 1, name: 'Harley Chopper', rarity: 'common', active: true },
    { id: 2, name: 'Sportster Iron', rarity: 'uncommon', active: false },
    { id: 3, name: 'Road King', rarity: 'rare', active: false, locked: true },
  ];

  const achievements = [
    { id: 1, name: 'Первая Игра', icon: '🏍️', unlocked: true },
    { id: 2, name: 'Победитель', icon: '🏆', unlocked: true },
    { id: 3, name: 'Мафиози', icon: '💀', unlocked: false },
    { id: 4, name: 'Легенда', icon: '⭐', unlocked: false },
  ];

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
                <AvatarImage src={user.photo_url} />
                <AvatarFallback className="text-3xl bg-biker-dark">
                  {user.first_name[0]}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <h1 className="text-3xl font-heading font-black text-transparent bg-gradient-to-r from-biker-orange to-biker-yellow bg-clip-text graffiti-text mb-2">
                  {user.first_name} {user.last_name}
                </h1>
                <p className="text-muted-foreground mb-4">@{user.username}</p>

                <div className="flex items-center gap-6">
                  <div>
                    <div className="text-sm text-muted-foreground">Уровень</div>
                    <div className="text-2xl font-heading font-bold text-biker-orange">{user.level}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Репутация</div>
                    <div className="text-2xl font-heading font-bold text-biker-cyan">{user.reputation}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Винрейт</div>
                    <div className="text-2xl font-heading font-bold text-biker-yellow">{winRate}%</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-border">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-heading font-bold text-foreground">{user.total_games}</div>
                  <div className="text-sm text-muted-foreground">Игр</div>
                </div>
                <div>
                  <div className="text-2xl font-heading font-bold text-green-500">{user.wins}</div>
                  <div className="text-sm text-muted-foreground">Побед</div>
                </div>
                <div>
                  <div className="text-2xl font-heading font-bold text-red-500">{user.losses}</div>
                  <div className="text-sm text-muted-foreground">Поражений</div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-2 border-biker-cyan/20">
            <h2 className="text-2xl font-heading font-bold mb-4 flex items-center gap-2">
              <Icon name="Bike" size={24} />
              Мотоциклы
            </h2>
            <div className="grid gap-3">
              {motorcycles.map((moto) => (
                <div
                  key={moto.id}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    moto.active
                      ? 'border-biker-orange bg-biker-orange/10'
                      : moto.locked
                      ? 'border-muted bg-muted/5 opacity-50'
                      : 'border-border hover:border-biker-cyan'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{moto.locked ? '🔒' : '🏍️'}</div>
                      <div>
                        <div className="font-heading font-bold">{moto.name}</div>
                        <div className="text-sm text-muted-foreground capitalize">{moto.rarity}</div>
                      </div>
                    </div>
                    {moto.active && (
                      <div className="text-sm font-medium text-biker-orange">Активный</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 border-2 border-biker-yellow/20">
            <h2 className="text-2xl font-heading font-bold mb-4 flex items-center gap-2">
              <Icon name="Award" size={24} />
              Достижения
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    achievement.unlocked
                      ? 'border-biker-yellow bg-biker-yellow/10'
                      : 'border-muted bg-muted/5 opacity-50'
                  }`}
                >
                  <div className="text-3xl mb-2">{achievement.icon}</div>
                  <div className="font-heading font-bold">{achievement.name}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
