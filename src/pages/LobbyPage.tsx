import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function LobbyPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const rooms = [
    { id: 1, name: 'Ночные волки', players: '5/10', status: 'waiting' },
    { id: 2, name: 'Гонка на выживание', players: '8/10', status: 'waiting' },
    { id: 3, name: 'Hardcore мафия', players: '10/10', status: 'full' },
  ];

  return (
    <div className="min-h-screen concrete-bg">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <header className="flex items-center justify-between mb-8 animate-slide-up">
          <div>
            <h1 className="text-4xl font-heading font-black text-transparent bg-gradient-to-r from-biker-orange to-biker-yellow bg-clip-text graffiti-text">
              ЛОББИ 🏍️
            </h1>
            <p className="text-muted-foreground mt-1">Выбери комнату или создай свою</p>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/shop')}>
              <Icon name="ShoppingCart" className="mr-2" size={18} />
              Магазин
            </Button>
            <Button variant="outline" onClick={() => navigate('/admin')}>
              <Icon name="Shield" size={18} />
            </Button>
            <Button variant="outline" onClick={() => navigate('/profile')}>
              <Icon name="User" className="mr-2" size={18} />
              {user?.first_name}
            </Button>
            <Button variant="outline" onClick={() => navigate('/leaderboard')}>
              <Icon name="Trophy" size={18} />
            </Button>
          </div>
        </header>

        <Tabs defaultValue="rooms" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="rooms">
              <Icon name="Home" className="mr-2" size={18} />
              Комнаты
            </TabsTrigger>
            <TabsTrigger value="create">
              <Icon name="Plus" className="mr-2" size={18} />
              Создать
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rooms" className="space-y-4">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Icon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  placeholder="Поиск комнаты..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline">
                <Icon name="Filter" size={18} />
              </Button>
            </div>

            <div className="grid gap-4">
              {rooms.map((room) => (
                <Card key={room.id} className="p-6 border-2 border-biker-orange/20 hover:border-biker-orange transition-all hover:spray-shadow animate-spray-paint">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-heading font-bold text-foreground mb-2">
                        {room.name}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Icon name="Users" size={16} />
                          <span>{room.players}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Icon name="Clock" size={16} />
                          <span>Ожидание</span>
                        </div>
                      </div>
                    </div>

                    {room.status === 'full' ? (
                      <Button disabled variant="outline">
                        Полная
                      </Button>
                    ) : (
                      <Button 
                        className="bg-gradient-to-r from-biker-orange to-biker-flame"
                        onClick={() => navigate(`/room?id=${room.id}&name=${encodeURIComponent(room.name)}`)}
                      >
                        <Icon name="LogIn" className="mr-2" size={18} />
                        Войти
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="create" className="space-y-4">
            <Card className="p-6 border-2 border-biker-cyan/20">
              <h3 className="text-2xl font-heading font-bold mb-6">Создать комнату</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Название комнаты</label>
                  <Input placeholder="Введи название..." />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Максимум игроков</label>
                  <Input type="number" min="6" max="20" defaultValue="10" />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Пароль (необязательно)</label>
                  <Input type="password" placeholder="Оставь пустым для открытой комнаты" />
                </div>

                <Button className="w-full bg-gradient-to-r from-biker-orange to-biker-flame text-lg py-6">
                  <Icon name="Plus" className="mr-2" size={20} />
                  Создать комнату
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}