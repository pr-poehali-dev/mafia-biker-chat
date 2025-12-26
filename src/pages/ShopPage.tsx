import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

const API_URL = 'https://functions.poehali.dev/5c41a30e-4c90-4aed-9351-0dacd2291ebd';

interface ShopItem {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
}

export default function ShopPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }

    loadItems();
  }, [isAuthenticated, navigate]);

  const loadItems = async () => {
    try {
      const response = await fetch(`${API_URL}?path=shop`);
      const data = await response.json();
      setItems(data.items || []);
    } catch (error) {
      console.error('Failed to load items:', error);
    } finally {
      setLoading(false);
    }
  };

  const buyItem = (itemName: string) => {
    const message = encodeURIComponent(`Купить ${itemName}`);
    window.open(`https://t.me/anthony_genevezy?text=${message}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen concrete-bg flex items-center justify-center">
        <div className="text-biker-cyan text-xl">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen concrete-bg p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-heading font-black text-transparent bg-gradient-to-r from-biker-orange via-biker-flame to-biker-yellow bg-clip-text graffiti-text">
            🏍️ МАГАЗИН
          </h1>
          <Button onClick={() => navigate('/lobby')} variant="outline">
            <Icon name="ArrowLeft" className="mr-2" size={16} />
            Назад
          </Button>
        </div>

        {items.length === 0 ? (
          <Card className="bg-card border-biker-orange">
            <CardContent className="p-12 text-center">
              <Icon name="ShoppingCart" size={64} className="mx-auto mb-4 text-muted-foreground" />
              <p className="text-xl text-muted-foreground">Магазин пока пуст</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map(item => (
              <Card key={item.id} className="bg-card border-biker-orange hover:border-biker-flame transition-colors">
                <CardHeader>
                  {item.image_url && (
                    <img 
                      src={item.image_url} 
                      alt={item.name} 
                      className="w-full h-48 object-cover rounded-lg mb-4"
                    />
                  )}
                  <CardTitle className="text-biker-flame">{item.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{item.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon name="Award" size={20} className="text-biker-yellow" />
                      <span className="text-2xl font-bold text-foreground">{item.price}</span>
                      <span className="text-sm text-muted-foreground">Rep</span>
                    </div>
                    <Button 
                      onClick={() => buyItem(item.name)}
                      className="bg-gradient-to-r from-biker-orange to-biker-flame hover:from-biker-flame hover:to-biker-yellow"
                    >
                      Приобрести
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
