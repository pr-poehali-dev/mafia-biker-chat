import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

interface CreateRoomFormProps {
  onSuccess: () => void;
}

export default function CreateRoomForm({ onSuccess }: CreateRoomFormProps) {
  const { token } = useAuth();
  const [name, setName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(10);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Введи название комнаты');
      return;
    }

    if (maxPlayers < 4 || maxPlayers > 20) {
      setError('Минимум 4, максимум 20 игроков');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('https://functions.poehali.dev/5c41a30e-4c90-4aed-9351-0dacd2291ebd?path=rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': token || ''
        },
        body: JSON.stringify({
          name: name.trim(),
          max_players: maxPlayers,
          password: password || null
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setName('');
        setPassword('');
        onSuccess();
      } else {
        setError(data.error || 'Не удалось создать комнату');
      }
    } catch (err) {
      setError('Ошибка соединения');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">Название комнаты</label>
        <Input 
          placeholder="Введи название..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={50}
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Максимум игроков (4-20)</label>
        <Input 
          type="number" 
          min="4" 
          max="20" 
          value={maxPlayers}
          onChange={(e) => setMaxPlayers(parseInt(e.target.value) || 10)}
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Пароль (необязательно)</label>
        <Input 
          type="password" 
          placeholder="Оставь пустым для открытой комнаты"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      {error && (
        <div className="text-sm text-red-500 bg-red-500/10 p-3 rounded-lg">
          {error}
        </div>
      )}

      <Button 
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-biker-orange to-biker-flame text-lg py-6"
      >
        <Icon name="Plus" className="mr-2" size={20} />
        {loading ? 'Создание...' : 'Создать комнату'}
      </Button>
    </form>
  );
}