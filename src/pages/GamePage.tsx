import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import Icon from '@/components/ui/icon';

export default function GamePage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<'night' | 'day' | 'vote'>('night');
  const [timer, setTimer] = useState(60);
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  const [dayNumber, setDayNumber] = useState(1);

  const players = [
    { id: 1, name: 'Алексей', role: 'mafia', alive: true, avatar: '' },
    { id: 2, name: 'Мария', role: 'civilian', alive: true, avatar: '' },
    { id: 3, name: 'Иван', role: 'civilian', alive: false, avatar: '' },
    { id: 4, name: 'Ольга', role: 'sheriff', alive: true, avatar: '' },
    { id: 5, name: 'Дмитрий', role: 'civilian', alive: true, avatar: '' },
  ];

  const myRole = 'mafia';

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          if (phase === 'night') {
            setPhase('day');
            return 90;
          } else if (phase === 'day') {
            setPhase('vote');
            return 60;
          } else {
            setPhase('night');
            setDayNumber((d) => d + 1);
            return 60;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phase]);

  const getRoleInfo = () => {
    const roleConfig = {
      mafia: { icon: '💀', name: 'Мафия', color: 'text-red-500' },
      civilian: { icon: '👤', name: 'Мирный', color: 'text-blue-500' },
      sheriff: { icon: '🔍', name: 'Комиссар', color: 'text-green-500' },
      don: { icon: '👑', name: 'Дон', color: 'text-purple-500' },
    };
    return roleConfig[myRole as keyof typeof roleConfig];
  };

  const roleInfo = getRoleInfo();

  return (
    <div className="min-h-screen concrete-bg">
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        <header className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <Button variant="outline" size="sm" onClick={() => navigate('/lobby')}>
              <Icon name="ArrowLeft" size={16} />
            </Button>
            
            <div className="text-center">
              <div className="text-sm text-muted-foreground">День {dayNumber}</div>
              <div className="text-2xl font-heading font-bold">
                {phase === 'night' && '🌙 Ночь'}
                {phase === 'day' && '☀️ День'}
                {phase === 'vote' && '🗳️ Голосование'}
              </div>
            </div>

            <div className="text-right">
              <div className="text-3xl font-heading font-bold text-biker-orange">{timer}</div>
              <div className="text-xs text-muted-foreground">секунд</div>
            </div>
          </div>

          <Progress value={(timer / 90) * 100} className="h-2" />
        </header>

        <div className="grid gap-6 lg:grid-cols-[1fr,300px]">
          <div className="space-y-4">
            <Card className="p-4 border-2 border-biker-orange/50 bg-gradient-to-r from-biker-orange/10 to-biker-flame/10">
              <div className="flex items-center gap-3">
                <div className="text-4xl">{roleInfo.icon}</div>
                <div>
                  <div className="text-sm text-muted-foreground">Твоя роль</div>
                  <div className={`text-2xl font-heading font-bold ${roleInfo.color}`}>
                    {roleInfo.name}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6 border-2 border-border">
              <h3 className="text-lg font-heading font-bold mb-4">
                {phase === 'night' && 'Мафия просыпается...'}
                {phase === 'day' && 'Обсуждение'}
                {phase === 'vote' && 'Голосуй за изгнание'}
              </h3>

              <div className="grid grid-cols-2 gap-3">
                {players.map((player) => (
                  <button
                    key={player.id}
                    onClick={() => setSelectedPlayer(player.id)}
                    disabled={!player.alive || (phase === 'night' && player.role === 'mafia')}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      !player.alive
                        ? 'opacity-30 cursor-not-allowed border-muted'
                        : selectedPlayer === player.id
                        ? 'border-biker-orange bg-biker-orange/20 scale-105'
                        : 'border-border hover:border-biker-cyan'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={player.avatar} />
                        <AvatarFallback>{player.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-heading font-bold">{player.name}</div>
                        {!player.alive && (
                          <div className="text-xs text-red-500">Убит</div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {selectedPlayer && (
                <Button className="w-full mt-4 bg-gradient-to-r from-biker-orange to-biker-flame">
                  <Icon name="Target" className="mr-2" size={18} />
                  {phase === 'night' ? 'Убить' : 'Голосовать'}
                </Button>
              )}
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="p-4 border-2 border-border">
              <h3 className="text-lg font-heading font-bold mb-3">Статистика</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Живых игроков</span>
                  <span className="font-bold">{players.filter(p => p.alive).length}/{players.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">День игры</span>
                  <span className="font-bold">{dayNumber}</span>
                </div>
              </div>
            </Card>

            <Card className="p-4 border-2 border-border">
              <h3 className="text-lg font-heading font-bold mb-3 flex items-center gap-2">
                <Icon name="MessageSquare" size={18} />
                Чат
              </h3>
              <div className="space-y-2 text-sm">
                <div className="p-2 bg-muted rounded">
                  <div className="font-medium">Алексей</div>
                  <div className="text-muted-foreground">Кто-то подозрительный...</div>
                </div>
                <div className="p-2 bg-muted rounded">
                  <div className="font-medium">Мария</div>
                  <div className="text-muted-foreground">Проверим Ивана?</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
