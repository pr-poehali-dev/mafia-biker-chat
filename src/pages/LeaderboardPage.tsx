import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';

export default function LeaderboardPage() {
  const navigate = useNavigate();

  const topPlayers = [
    { id: 1, name: 'Алексей', reputation: 2500, level: 25, clan: 'Ночные Волки', wins: 150 },
    { id: 2, name: 'Мария', reputation: 2300, level: 23, clan: 'Стальные Братья', wins: 140 },
    { id: 3, name: 'Иван', reputation: 2100, level: 21, clan: 'Дикие Всадники', wins: 130 },
    { id: 4, name: 'Ольга', reputation: 1900, level: 19, clan: null, wins: 120 },
    { id: 5, name: 'Дмитрий', reputation: 1800, level: 18, clan: 'Ночные Волки', wins: 115 },
  ];

  const topClans = [
    { id: 1, name: 'Ночные Волки', tag: 'NW', reputation: 15000, members: 25 },
    { id: 2, name: 'Стальные Братья', tag: 'SB', reputation: 12000, members: 20 },
    { id: 3, name: 'Дикие Всадники', tag: 'DV', reputation: 10000, members: 18 },
  ];

  const getMedalEmoji = (position: number) => {
    if (position === 1) return '🥇';
    if (position === 2) return '🥈';
    if (position === 3) return '🥉';
    return `${position}`;
  };

  return (
    <div className="min-h-screen concrete-bg">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <header className="flex items-center justify-between mb-8">
          <Button variant="outline" onClick={() => navigate('/lobby')}>
            <Icon name="ArrowLeft" className="mr-2" size={18} />
            Назад
          </Button>
        </header>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-heading font-black text-transparent bg-gradient-to-r from-biker-orange via-biker-flame to-biker-yellow bg-clip-text graffiti-text mb-2">
            РЕЙТИНГ 🏆
          </h1>
          <p className="text-muted-foreground">Лучшие игроки и кланы</p>
        </div>

        <Tabs defaultValue="players" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="players">
              <Icon name="User" className="mr-2" size={18} />
              Игроки
            </TabsTrigger>
            <TabsTrigger value="clans">
              <Icon name="Users" className="mr-2" size={18} />
              Кланы
            </TabsTrigger>
          </TabsList>

          <TabsContent value="players" className="space-y-3">
            {topPlayers.map((player, index) => (
              <Card
                key={player.id}
                className={`p-5 border-2 transition-all hover:scale-[1.02] ${
                  index === 0
                    ? 'border-biker-orange spray-shadow'
                    : index === 1
                    ? 'border-biker-flame'
                    : index === 2
                    ? 'border-biker-yellow'
                    : 'border-border hover:border-biker-cyan'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="text-3xl font-heading font-black w-12 text-center">
                    {getMedalEmoji(index + 1)}
                  </div>

                  <Avatar className="w-12 h-12 border-2 border-biker-orange">
                    <AvatarImage src="" />
                    <AvatarFallback>{player.name[0]}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className="font-heading font-bold text-lg">{player.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {player.clan ? (
                        <span className="flex items-center gap-1">
                          <Icon name="Users" size={12} />
                          {player.clan}
                        </span>
                      ) : (
                        'Без клана'
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-heading font-bold text-biker-orange">
                      {player.reputation}
                    </div>
                    <div className="text-xs text-muted-foreground">репутация</div>
                  </div>

                  <div className="text-right">
                    <div className="text-xl font-heading font-bold text-biker-cyan">
                      {player.wins}
                    </div>
                    <div className="text-xs text-muted-foreground">побед</div>
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="clans" className="space-y-3">
            {topClans.map((clan, index) => (
              <Card
                key={clan.id}
                className={`p-5 border-2 transition-all hover:scale-[1.02] ${
                  index === 0
                    ? 'border-biker-orange spray-shadow'
                    : index === 1
                    ? 'border-biker-flame'
                    : index === 2
                    ? 'border-biker-yellow'
                    : 'border-border hover:border-biker-cyan'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="text-3xl font-heading font-black w-12 text-center">
                    {getMedalEmoji(index + 1)}
                  </div>

                  <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-biker-orange to-biker-flame flex items-center justify-center">
                    <div className="text-2xl font-heading font-black text-white">
                      {clan.tag}
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="font-heading font-bold text-lg">{clan.name}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <Icon name="Users" size={12} />
                      {clan.members} участников
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-heading font-bold text-biker-orange">
                      {clan.reputation.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">репутация</div>
                  </div>

                  <Button variant="outline" size="sm">
                    <Icon name="Eye" size={16} />
                  </Button>
                </div>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
