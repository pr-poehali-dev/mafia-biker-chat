import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

const API_URL = 'https://functions.poehali.dev/5c41a30e-4c90-4aed-9351-0dacd2291ebd';

interface Bonuses {
  documents: number;
  shield: number;
  privilege: number;
}

const BONUS_INFO = {
  documents: {
    name: 'Документы',
    icon: '📄',
    description: 'Если комиссар проверяет мафию с документами, игрок выглядит как мирный'
  },
  shield: {
    name: 'Щит',
    icon: '🛡️',
    description: 'Спасает от убийства мафией один раз за игру'
  },
  privilege: {
    name: 'Привилегия',
    icon: '👑',
    description: 'Увеличивает шанс получить роль мафии'
  }
};

export default function BonusSelectPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { token, isAuthenticated } = useAuth();
  const [bonuses, setBonuses] = useState<Bonuses | null>(null);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);

  const roomId = searchParams.get('room');
  const sessionId = searchParams.get('session');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }

    if (!roomId || !sessionId) {
      navigate('/lobby');
      return;
    }

    loadBonuses();
  }, [isAuthenticated, navigate, roomId, sessionId]);

  const loadBonuses = async () => {
    try {
      const response = await fetch(`${API_URL}?path=bonuses`, {
        headers: { 'X-Auth-Token': token || '' }
      });
      const data = await response.json();
      setBonuses(data.bonuses);
    } catch (error) {
      console.error('Failed to load bonuses:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectBonus = async (bonusType: string) => {
    setActivating(true);
    try {
      const response = await fetch(`${API_URL}?path=bonuses`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': token || ''
        },
        body: JSON.stringify({ session_id: sessionId, bonus_type: bonusType })
      });

      const data = await response.json();
      if (data.success) {
        navigate(`/game?session=${sessionId}`);
      } else {
        alert(data.error || 'Не удалось активировать бонус');
      }
    } catch (error) {
      console.error('Failed to activate bonus:', error);
      alert('Ошибка активации бонуса');
    } finally {
      setActivating(false);
    }
  };

  const skipBonus = () => {
    navigate(`/game?session=${sessionId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen concrete-bg flex items-center justify-center">
        <div className="text-biker-cyan text-xl">Загрузка...</div>
      </div>
    );
  }

  const availableBonuses = bonuses ? [
    { type: 'documents', count: bonuses.documents, ...BONUS_INFO.documents },
    { type: 'shield', count: bonuses.shield, ...BONUS_INFO.shield },
    { type: 'privilege', count: bonuses.privilege, ...BONUS_INFO.privilege }
  ].filter(b => b.count > 0) : [];

  return (
    <div className="min-h-screen concrete-bg flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-heading font-black text-transparent bg-gradient-to-r from-biker-orange via-biker-flame to-biker-yellow bg-clip-text graffiti-text mb-2">
            🏍️ ВЫБЕРИ БОНУС
          </h1>
          <p className="text-lg text-muted-foreground">
            {availableBonuses.length > 0 ? 'Активируй один бонус перед игрой' : 'У тебя нет доступных бонусов'}
          </p>
        </div>

        {availableBonuses.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {availableBonuses.map(bonus => (
                <Card
                  key={bonus.type}
                  className="border-2 border-biker-orange hover:border-biker-flame transition-all cursor-pointer group"
                  onClick={() => !activating && selectBonus(bonus.type)}
                >
                  <CardContent className="p-8 text-center">
                    <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">
                      {bonus.icon}
                    </div>
                    <h3 className="text-2xl font-heading font-bold text-foreground mb-2">
                      {bonus.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {bonus.description}
                    </p>
                    <div className="text-biker-flame font-semibold">
                      Доступно: {bonus.count}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center">
              <Button
                variant="outline"
                size="lg"
                onClick={skipBonus}
                disabled={activating}
                className="px-12"
              >
                Играть без бонуса
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center">
            <Card className="bg-card border-biker-orange p-12">
              <Icon name="Package" size={64} className="mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg text-muted-foreground mb-6">
                У тебя нет доступных бонусов. Попроси админа выдать их тебе!
              </p>
              <Button onClick={skipBonus} size="lg">
                Продолжить без бонуса
              </Button>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
