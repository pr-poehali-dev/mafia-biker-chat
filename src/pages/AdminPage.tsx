import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';

const API_URL = 'https://functions.poehali.dev/5c41a30e-4c90-4aed-9351-0dacd2291ebd';

interface User {
  id: number;
  profile_name: string;
  username: string;
  first_name: string;
  reputation: number;
  level: number;
  is_admin: boolean;
}

interface ShopItem {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
}

export default function AdminPage() {
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newItem, setNewItem] = useState({ name: '', description: '', price: 0, image_url: '' });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }

    checkAdmin();
  }, [isAuthenticated, navigate]);

  const checkAdmin = async () => {
    try {
      const response = await fetch(`${API_URL}?path=admin&action=check`, {
        headers: { 'X-Auth-Token': token || '' }
      });
      const data = await response.json();
      
      if (data.is_admin) {
        setIsAdmin(true);
        loadUsers();
        loadShopItems();
      } else {
        navigate('/lobby');
      }
    } catch (error) {
      console.error('Admin check failed:', error);
      navigate('/lobby');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await fetch(`${API_URL}?path=admin&action=users`, {
        headers: { 'X-Auth-Token': token || '' }
      });
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const giveBonus = async (userId: number, bonusType: string) => {
    try {
      await fetch(`${API_URL}?path=bonuses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': token || ''
        },
        body: JSON.stringify({ user_id: userId, bonus_type: bonusType, amount: 1 })
      });
      alert(`Бонус "${bonusType}" выдан!`);
    } catch (error) {
      console.error('Failed to give bonus:', error);
      alert('Ошибка выдачи бонуса');
    }
  };

  const loadShopItems = async () => {
    try {
      const response = await fetch(`${API_URL}?path=shop`);
      const data = await response.json();
      setShopItems(data.items || []);
    } catch (error) {
      console.error('Failed to load shop items:', error);
    }
  };

  const toggleAdmin = async (userId: number, makeAdmin: boolean) => {
    try {
      await fetch(`${API_URL}?path=admin`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': token || ''
        },
        body: JSON.stringify({ user_id: userId, make_admin: makeAdmin })
      });
      loadUsers();
    } catch (error) {
      console.error('Failed to toggle admin:', error);
    }
  };

  const addShopItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch(`${API_URL}?path=shop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': token || ''
        },
        body: JSON.stringify(newItem)
      });
      setNewItem({ name: '', description: '', price: 0, image_url: '' });
      loadShopItems();
    } catch (error) {
      console.error('Failed to add item:', error);
    }
  };

  const deleteShopItem = async (itemId: number) => {
    try {
      await fetch(`${API_URL}?path=shop&id=${itemId}`, {
        method: 'DELETE',
        headers: { 'X-Auth-Token': token || '' }
      });
      loadShopItems();
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen concrete-bg flex items-center justify-center">
        <div className="text-biker-cyan text-xl">Загрузка...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen concrete-bg p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-heading font-black text-transparent bg-gradient-to-r from-biker-orange via-biker-flame to-biker-yellow bg-clip-text graffiti-text">
            🏍️ АДМИН ПАНЕЛЬ
          </h1>
          <Button onClick={() => navigate('/lobby')} variant="outline">
            <Icon name="ArrowLeft" className="mr-2" size={16} />
            Назад в лобби
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-card border-biker-orange">
            <CardHeader>
              <CardTitle className="text-biker-flame flex items-center gap-2">
                <Icon name="Users" size={24} />
                Управление пользователями
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {users.map(user => (
                  <div key={user.id} className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-semibold text-foreground">{user.profile_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {user.first_name} • Rep: {user.reputation} • Lvl: {user.level}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant={user.is_admin ? 'destructive' : 'default'}
                        onClick={() => toggleAdmin(user.id, !user.is_admin)}
                      >
                        {user.is_admin ? 'Убрать' : 'Сделать'} админом
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => giveBonus(user.id, 'documents')}>
                        📄 Документы
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => giveBonus(user.id, 'shield')}>
                        🛡️ Щит
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => giveBonus(user.id, 'privilege')}>
                        👑 Привилегия
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-biker-orange">
            <CardHeader>
              <CardTitle className="text-biker-flame flex items-center gap-2">
                <Icon name="ShoppingCart" size={24} />
                Добавить товар
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={addShopItem} className="space-y-4">
                <div>
                  <Label htmlFor="name">Название</Label>
                  <Input
                    id="name"
                    value={newItem.name}
                    onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Описание</Label>
                  <Textarea
                    id="description"
                    value={newItem.description}
                    onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="price">Цена (репутация)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={newItem.price}
                    onChange={e => setNewItem({ ...newItem, price: Number(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="image">URL изображения</Label>
                  <Input
                    id="image"
                    value={newItem.image_url}
                    onChange={e => setNewItem({ ...newItem, image_url: e.target.value })}
                  />
                </div>
                <Button type="submit" className="w-full">Добавить товар</Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card border-biker-orange mt-6">
          <CardHeader>
            <CardTitle className="text-biker-flame flex items-center gap-2">
              <Icon name="Package" size={24} />
              Товары в магазине
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {shopItems.map(item => (
                <div key={item.id} className="p-4 bg-muted rounded-lg border border-border">
                  {item.image_url && (
                    <img src={item.image_url} alt={item.name} className="w-full h-32 object-cover rounded mb-3" />
                  )}
                  <h3 className="font-bold text-foreground mb-2">{item.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-biker-flame font-semibold">{item.price} Rep</span>
                    <Button size="sm" variant="destructive" onClick={() => deleteShopItem(item.id)}>
                      Удалить
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}