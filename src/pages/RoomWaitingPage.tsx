import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useGameRoom } from '@/hooks/useGameRoom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import Icon from '@/components/ui/icon';

export default function RoomWaitingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [message, setMessage] = useState('');

  const roomId = searchParams.get('id') || '1';
  const roomName = searchParams.get('name') || 'Комната';

  const {
    isConnected,
    players,
    gameState,
    chatMessages,
    sendChatMessage,
    startGame,
    leaveRoom,
  } = useGameRoom(
    roomId,
    user?.id || 0,
    user?.first_name || 'Guest'
  );

  const handleSendMessage = () => {
    if (message.trim()) {
      sendChatMessage(message);
      setMessage('');
    }
  };

  const handleStartGame = () => {
    startGame();
    navigate(`/game?room=${roomId}`);
  };

  const handleLeave = () => {
    leaveRoom();
    navigate('/lobby');
  };

  if (gameState) {
    navigate(`/game?room=${roomId}`);
    return null;
  }

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
                  Игроки ({players.length}/10)
                </h2>
                
                {players.length >= 6 && (
                  <Button 
                    className="bg-gradient-to-r from-biker-orange to-biker-flame"
                    onClick={handleStartGame}
                  >
                    <Icon name="Play" className="mr-2" size={18} />
                    Начать игру
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {players.map((player, index) => (
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
                        <div className="font-heading font-bold">{player.user_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {player.ready ? '✅ Готов' : '⏳ Ожидает'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {Array.from({ length: Math.max(0, 10 - players.length) }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="p-4 rounded-lg border-2 border-dashed border-muted bg-muted/5"
                  >
                    <div className="flex items-center gap-3 opacity-30">
                      <div className="w-10 h-10 rounded-full bg-muted" />
                      <div className="flex-1">
                        <div className="h-4 bg-muted rounded w-20 mb-1" />
                        <div className="h-3 bg-muted rounded w-16" />
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
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <Button onClick={handleSendMessage}>
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
