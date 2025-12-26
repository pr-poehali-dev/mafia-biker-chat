import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import Icon from '@/components/ui/icon';

interface Player {
  id: number;
  name: string;
  role: string;
  alive: boolean;
  voted: boolean;
}

type Phase = 'night' | 'day' | 'vote' | 'results';

export default function GamePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { token, user } = useAuth();
  
  const sessionId = searchParams.get('session');
  
  const [phase, setPhase] = useState<Phase>('night');
  const [timer, setTimer] = useState(60);
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  const [dayNumber, setDayNumber] = useState(1);
  const [myRole, setMyRole] = useState<string>('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameResult, setGameResult] = useState<string | null>(null);
  const [lastKilled, setLastKilled] = useState<string | null>(null);

  const PHASE_TIMERS = {
    night: 60,
    day: 90,
    vote: 60,
    results: 10
  };

  useEffect(() => {
    if (!sessionId) {
      navigate('/lobby');
      return;
    }
    
    loadGameState();
    const interval = setInterval(loadGameState, 2000);
    return () => clearInterval(interval);
  }, [sessionId]);

  useEffect(() => {
    if (phase === 'results') {
      return;
    }

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          handlePhaseEnd();
          return PHASE_TIMERS[getNextPhase()];
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phase, dayNumber]);

  const loadGameState = async () => {
    try {
      const response = await fetch(`https://functions.poehali.dev/5c41a30e-4c90-4aed-9351-0dacd2291ebd?path=game&action=state&session_id=${sessionId}`, {
        headers: {
          'X-Auth-Token': token || ''
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setPlayers(data.players || []);
        setPhase(data.phase || 'night');
        setDayNumber(data.day_number || 1);
        setMyRole(data.my_role || '');
        
        if (data.game_ended) {
          setGameResult(data.winner);
          setPhase('results');
        }
        
        if (data.last_killed) {
          setLastKilled(data.last_killed);
        }
      }
    } catch (error) {
      console.error('Failed to load game state', error);
    }
  };

  const getNextPhase = (): Phase => {
    if (phase === 'night') return 'day';
    if (phase === 'day') return 'vote';
    if (phase === 'vote') return 'night';
    return 'night';
  };

  const handlePhaseEnd = () => {
    const nextPhase = getNextPhase();
    setPhase(nextPhase);
    setSelectedPlayer(null);
    
    if (nextPhase === 'night') {
      setDayNumber((d) => d + 1);
    }
  };

  const handleVote = async () => {
    if (!selectedPlayer) return;

    try {
      const response = await fetch('https://functions.poehali.dev/5c41a30e-4c90-4aed-9351-0dacd2291ebd?path=game&action=vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': token || ''
        },
        body: JSON.stringify({
          session_id: sessionId,
          target_id: selectedPlayer
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setSelectedPlayer(null);
        loadGameState();
      }
    } catch (error) {
      console.error('Failed to vote', error);
    }
  };

  const getRoleInfo = () => {
    const roleConfig: Record<string, { icon: string; name: string; color: string; description: string }> = {
      mafia: { 
        icon: '💀', 
        name: 'Мафия', 
        color: 'text-red-500',
        description: 'Убивай мирных жителей ночью'
      },
      civilian: { 
        icon: '👤', 
        name: 'Мирный житель', 
        color: 'text-blue-500',
        description: 'Найди и изгони всю мафию'
      },
      sheriff: { 
        icon: '🔍', 
        name: 'Комиссар', 
        color: 'text-green-500',
        description: 'Проверяй игроков ночью'
      },
      don: { 
        icon: '👑', 
        name: 'Дон мафии', 
        color: 'text-purple-500',
        description: 'Главный мафиози, неуязвим для комиссара'
      },
      doctor: { 
        icon: '💊', 
        name: 'Доктор', 
        color: 'text-cyan-500',
        description: 'Лечи одного игрока каждую ночь'
      },
      prostitute: { 
        icon: '💋', 
        name: 'Проститутка', 
        color: 'text-pink-500',
        description: 'Блокируй действие игрока на ночь'
      }
    };
    return roleConfig[myRole] || roleConfig.civilian;
  };

  const roleInfo = getRoleInfo();

  const alivePlayers = players.filter(p => p.alive);
  const mafiaCount = alivePlayers.filter(p => ['mafia', 'don'].includes(p.role)).length;
  const civilianCount = alivePlayers.filter(p => !['mafia', 'don'].includes(p.role)).length;

  if (gameResult) {
    return (
      <div className="min-h-screen concrete-bg flex items-center justify-center">
        <Card className="p-8 max-w-md w-full border-4 border-biker-orange text-center">
          <div className="text-6xl mb-4">
            {gameResult === 'mafia' ? '💀' : '🎉'}
          </div>
          <h1 className="text-3xl font-heading font-black mb-4">
            {gameResult === 'mafia' ? 'Победа мафии!' : 'Победа мирных!'}
          </h1>
          <p className="text-muted-foreground mb-6">
            {gameResult === 'mafia' 
              ? 'Мафия захватила город' 
              : 'Все мафиози найдены и изгнаны'}
          </p>
          <Button 
            className="w-full bg-gradient-to-r from-biker-orange to-biker-flame"
            onClick={() => navigate('/lobby')}
          >
            <Icon name="Home" className="mr-2" size={18} />
            Вернуться в лобби
          </Button>
        </Card>
      </div>
    );
  }

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

          <Progress value={(timer / PHASE_TIMERS[phase]) * 100} className="h-2" />
        </header>

        {lastKilled && phase === 'day' && (
          <Card className="p-4 mb-4 border-2 border-red-500 bg-red-500/10">
            <p className="text-center text-lg">
              💀 <strong>{lastKilled}</strong> был убит прошлой ночью
            </p>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr,300px]">
          <div className="space-y-4">
            <Card className="p-4 border-2 border-biker-orange/50 bg-gradient-to-r from-biker-orange/10 to-biker-flame/10">
              <div className="flex items-center gap-3">
                <div className="text-4xl">{roleInfo.icon}</div>
                <div className="flex-1">
                  <div className="text-sm text-muted-foreground">Твоя роль</div>
                  <div className={`text-2xl font-heading font-bold ${roleInfo.color}`}>
                    {roleInfo.name}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {roleInfo.description}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6 border-2 border-border">
              <h3 className="text-lg font-heading font-bold mb-4">
                {phase === 'night' && myRole === 'mafia' && 'Выбери жертву'}
                {phase === 'night' && myRole === 'sheriff' && 'Выбери кого проверить'}
                {phase === 'night' && myRole === 'doctor' && 'Выбери кого лечить'}
                {phase === 'night' && !['mafia', 'sheriff', 'doctor', 'prostitute', 'don'].includes(myRole) && 'Город спит...'}
                {phase === 'day' && 'Обсуждение'}
                {phase === 'vote' && 'Голосуй за изгнание'}
              </h3>

              <div className="grid grid-cols-2 gap-3">
                {players.map((player) => {
                  const canSelect = player.alive && 
                    (phase !== 'night' || 
                      (myRole === 'mafia' && !['mafia', 'don'].includes(player.role)) ||
                      (myRole === 'don' && !['mafia', 'don'].includes(player.role)) ||
                      (['sheriff', 'doctor', 'prostitute'].includes(myRole)));
                  
                  return (
                    <button
                      key={player.id}
                      onClick={() => canSelect && setSelectedPlayer(player.id)}
                      disabled={!canSelect}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        !player.alive
                          ? 'opacity-30 cursor-not-allowed border-muted'
                          : selectedPlayer === player.id
                          ? 'border-biker-orange bg-biker-orange/20 scale-105'
                          : canSelect
                          ? 'border-border hover:border-biker-cyan'
                          : 'opacity-50 cursor-not-allowed border-muted'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src="" />
                          <AvatarFallback>{player.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-heading font-bold">{player.name}</div>
                          {!player.alive && (
                            <div className="text-xs text-red-500">Убит</div>
                          )}
                          {player.voted && phase === 'vote' && (
                            <div className="text-xs text-green-500">Проголосовал</div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {selectedPlayer && (phase !== 'night' || ['mafia', 'sheriff', 'doctor', 'prostitute', 'don'].includes(myRole)) && (
                <Button 
                  className="w-full mt-4 bg-gradient-to-r from-biker-orange to-biker-flame"
                  onClick={handleVote}
                >
                  <Icon name="Target" className="mr-2" size={18} />
                  {phase === 'night' && myRole === 'mafia' && 'Убить'}
                  {phase === 'night' && myRole === 'don' && 'Убить'}
                  {phase === 'night' && myRole === 'sheriff' && 'Проверить'}
                  {phase === 'night' && myRole === 'doctor' && 'Лечить'}
                  {phase === 'night' && myRole === 'prostitute' && 'Блокировать'}
                  {(phase === 'day' || phase === 'vote') && 'Голосовать'}
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
                  <span className="font-bold">{alivePlayers.length}/{players.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">День игры</span>
                  <span className="font-bold">{dayNumber}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-red-500">💀 Мафия</span>
                  <span className="font-bold text-red-500">{mafiaCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-blue-500">👤 Мирные</span>
                  <span className="font-bold text-blue-500">{civilianCount}</span>
                </div>
              </div>
            </Card>

            <Card className="p-4 border-2 border-biker-cyan/20">
              <h3 className="text-lg font-heading font-bold mb-3">Правила фазы</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                {phase === 'night' && (
                  <>
                    <p>🌙 Город спит</p>
                    <p>💀 Мафия выбирает жертву</p>
                    <p>🔍 Комиссар проверяет игрока</p>
                    <p>💊 Доктор лечит игрока</p>
                  </>
                )}
                {phase === 'day' && (
                  <>
                    <p>☀️ Город просыпается</p>
                    <p>💬 Обсуждайте подозрительных</p>
                    <p>🤔 Делитесь информацией</p>
                    <p>⏰ Готовьтесь к голосованию</p>
                  </>
                )}
                {phase === 'vote' && (
                  <>
                    <p>🗳️ Время голосования</p>
                    <p>👆 Выбери кого изгнать</p>
                    <p>🎯 Большинство решает</p>
                    <p>⚖️ Будь внимателен!</p>
                  </>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}