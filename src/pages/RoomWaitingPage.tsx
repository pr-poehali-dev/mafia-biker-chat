import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import Icon from '@/components/ui/icon';

const API_URL = 'https://functions.poehali.dev/5c41a30e-4c90-4aed-9351-0dacd2291ebd';

interface Player {
  user_id: number;
  user_name: string;
  is_creator: boolean;
}

interface ChatMessage {
  user_name: string;
  message: string;
  created_at: string;
}

export default function RoomWaitingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, token } = useAuth();
  const [message, setMessage] = useState('');

  const roomId = searchParams.get('id');
  const roomName = searchParams.get('name') || 'Комната';

  const [players, setPlayers] = useState<Player[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(true);
  const [isCreator, setIsCreator] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  useEffect(() => {
    if (!roomId || !user) {
      navigate('/lobby');
      return;
    }

    joinRoom();
    const interval = setInterval(loadRoomState, 1000);

    return () => {
      clearInterval(interval);
      leaveRoom();
    };
  }, [roomId, user]);

  const joinRoom = async () => {
    try {
      const response = await fetch(`${API_URL}?path=room&action=join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': token || ''
        },
        body: JSON.stringify({
          room_id: parseInt(roomId || '0'),
          user_name: user?.profile_name || user?.first_name || 'Guest'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setIsCreator(data.is_creator || false);
        loadRoomState();
      }
    } catch (error) {
      console.error('Failed to join room', error);
      setIsConnected(false);
    }
  };

  const loadRoomState = async () => {
    try {
      const response = await fetch(`${API_URL}?path=room&action=state&room_id=${roomId}`, {
        headers: {
          'X-Auth-Token': token || ''
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setPlayers(data.players || []);
        setChatMessages(data.chat || []);
        
        if (data.game_started && data.session_id) {
          setGameStarted(true);
          navigate(`/game?session=${data.session_id}`);
        }
      }
    } catch (error) {
      console.error('Failed to load room state', error);
      setIsConnected(false);
    }
  };

  const sendMessage = async () => {
    if (!message.trim()) return;

    try {
      const response = await fetch(`${API_URL}?path=room&action=chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': token || ''
        },
        body: JSON.stringify({
          room_id: parseInt(roomId || '0'),
          message: message.trim()
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage('');
        loadRoomState();
      }
    } catch (error) {
      console.error('Failed to send message', error);
    }
  };

  const handleStartGame = async () => {
    if (players.length < 4) {
      alert('Минимум 4 игрока для начала игры!');
      return;
    }

    try {
      const response = await fetch(`${API_URL}?path=game&action=start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': token || ''
        },
        body: JSON.stringify({
          room_id: parseInt(roomId || '0')
        })
      });

      const data = await response.json();
      
      if (data.success && data.session_id) {
        navigate(`/game?session=${data.session_id}`);
      }
    } catch (error) {
      console.error('Failed to start game', error);
    }
  };

  const leaveRoom = async () => {
    try {
      await fetch(`${API_URL}?path=room&action=leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': token || ''
        },
        body: JSON.stringify({
          room_id: parseInt(roomId || '0')
        })
      });
    } catch (error) {
      console.error('Failed to leave room', error);
    }
  };

  const handleLeave = () => {
    leaveRoom();
    navigate('/lobby');
  };

  return (
    <div className="min-h-screen concrete-bg">
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-heading font-black text-transparent bg-gradient-to-r from-biker-orange to-biker-yellow bg-clip-text graffiti-text">
              {roomName}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-muted-foreground">
                {isConnected ? 'Подключено' : 'Отключено'}
              </span>
            </div>
          </div>

          <Button variant="outline" onClick={handleLeave}>
            <Icon name="ArrowLeft" className="mr-2" size={18} />
            Выйти
          </Button>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1fr,350px]">
          <div className="space-y-4">
            <Card className="p-6 border-2 border-biker-orange">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-heading font-bold">
                  Игроки ({players.length})
                </h2>
                
                {isCreator && players.length >= 4 && (
                  <Button 
                    className="bg-gradient-to-r from-biker-orange to-biker-flame"
                    onClick={handleStartGame}
                  >
                    <Icon name="Play" className="mr-2" size={18} />
                    Начать игру
                  </Button>
                )}
              </div>

              {players.length < 4 && (
                <div className="mb-4 p-3 bg-biker-orange/10 border border-biker-orange/30 rounded-lg text-sm text-center">
                  Ожидаем игроков... Минимум 4 для начала игры
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {players.map((player) => (
                  <div
                    key={player.user_id}
                    className="p-4 rounded-lg border-2 border-border bg-card hover:border-biker-cyan transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10 border-2 border-biker-orange">
                        <AvatarImage src="" />
                        <AvatarFallback>{player.user_name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-heading font-bold flex items-center gap-2">
                          {player.user_name}
                          {player.is_creator && <span className="text-xs">👑</span>}
                        </div>
                        <div className="text-xs text-green-500">
                          ✅ Готов
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4 border-2 border-biker-cyan/20">
              <h3 className="text-lg font-heading font-bold mb-3">Правила игры</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>🌙 <strong>Ночь:</strong> Мафия выбирает жертву, Комиссар проверяет игрока</p>
                <p>☀️ <strong>День:</strong> Все обсуждают, кто может быть мафией</p>
                <p>🗳️ <strong>Голосование:</strong> Все голосуют за изгнание одного игрока</p>
                <p>🎯 <strong>Победа мирных:</strong> Когда все мафиози найдены</p>
                <p>💀 <strong>Победа мафии:</strong> Когда мафии больше или равно мирных</p>
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="p-4 border-2 border-border">
              <h3 className="text-lg font-heading font-bold mb-3 flex items-center gap-2">
                <Icon name="MessageSquare" size={18} />
                Чат
              </h3>

              <ScrollArea className="h-80 mb-4 pr-4">
                <div className="space-y-2">
                  {chatMessages.map((msg, index) => (
                    <div key={index} className="p-3 bg-muted rounded-lg">
                      <div className="font-medium text-sm mb-1">{msg.user_name}</div>
                      <div className="text-sm text-muted-foreground">{msg.message}</div>
                    </div>
                  ))}
                  
                  {chatMessages.length === 0 && (
                    <div className="text-center text-muted-foreground text-sm py-8">
                      Нет сообщений
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div className="flex gap-2">
                <Input
                  placeholder="Напиши сообщение..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />
                <Button onClick={sendMessage}>
                  <Icon name="Send" size={18} />
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
