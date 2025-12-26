import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';

export default function ClansPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const clans = [
    { 
      id: 1, 
      name: 'Ночные Волки', 
      tag: 'NW', 
      members: 25, 
      reputation: 15000,
      description: 'Легендарный мотоклуб для настоящих байкеров'
    },
    { 
      id: 2, 
      name: 'Стальные Братья', 
      tag: 'SB', 
      members: 20, 
      reputation: 12000,
      description: 'Братство стали и асфальта'
    },
  ];

  return (
    <div className="min-h-screen concrete-bg">
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        <header className="flex items-center justify-between mb-8">
          <Button variant="outline" onClick={() => navigate('/lobby')}>
            <Icon name="ArrowLeft" className="mr-2" size={18} />
            Назад
          </Button>

          <div className="flex items-center gap-4">
            <Button variant="outline">
              <Icon name="Users" className="mr-2" size={18} />
              Мой клан
            </Button>
          </div>
        </header>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-heading font-black text-transparent bg-gradient-to-r from-biker-orange to-biker-yellow bg-clip-text graffiti-text mb-2">
            КЛАНЫ 🏍️
          </h1>
          <p className="text-muted-foreground">Найди свой мотоклуб или создай новый</p>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="all">
              <Icon name="Search" className="mr-2" size={18} />
              Все кланы
            </TabsTrigger>
            <TabsTrigger value="create">
              <Icon name="Plus" className="mr-2" size={18} />
              Создать
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Icon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  placeholder="Поиск клана..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="grid gap-4">
              {clans.map((clan) => (
                <Card key={clan.id} className="p-6 border-2 border-biker-orange/20 hover:border-biker-orange transition-all animate-spray-paint">
                  <div className="flex items-start gap-4">
                    <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-biker-orange to-biker-flame flex items-center justify-center flex-shrink-0">
                      <div className="text-3xl font-heading font-black text-white">
                        {clan.tag}
                      </div>
                    </div>

                    <div className="flex-1">
                      <h3 className="text-2xl font-heading font-bold text-foreground mb-2">
                        {clan.name}
                      </h3>
                      <p className="text-muted-foreground mb-4">{clan.description}</p>
                      
                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2">
                          <Icon name="Users" size={16} />
                          <span>{clan.members} участников</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Icon name="Star" size={16} />
                          <span>{clan.reputation.toLocaleString()} репутации</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button className="bg-gradient-to-r from-biker-orange to-biker-flame">
                        <Icon name="UserPlus" className="mr-2" size={18} />
                        Вступить
                      </Button>
                      <Button variant="outline">
                        <Icon name="Eye" size={18} />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="create" className="space-y-4">
            <Card className="p-6 border-2 border-biker-cyan/20">
              <h3 className="text-2xl font-heading font-bold mb-6">Создать клан</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Название клана</label>
                  <Input placeholder="Введи название..." maxLength={50} />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Тег клана (2-5 символов)</label>
                  <Input placeholder="NW" maxLength={5} className="uppercase" />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Описание</label>
                  <Textarea 
                    placeholder="Расскажи о своём клане..." 
                    rows={4}
                    maxLength={200}
                  />
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-start gap-3 text-sm">
                    <Icon name="Info" className="mt-0.5 flex-shrink-0" size={16} />
                    <div>
                      <p className="font-medium mb-1">Требования для создания:</p>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>• Минимум 500 репутации</li>
                        <li>• Стоимость создания: 1000 репутации</li>
                        <li>• Уникальное название и тег</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Button 
                  className="w-full bg-gradient-to-r from-biker-orange to-biker-flame text-lg py-6"
                  disabled={user && user.reputation < 500}
                >
                  <Icon name="Plus" className="mr-2" size={20} />
                  Создать клан за 1000 репутации
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
