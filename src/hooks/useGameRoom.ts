import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';

interface Player {
  connection_id: string;
  user_id: number;
  user_name: string;
  ready: boolean;
  role?: string;
  alive?: boolean;
}

interface GameState {
  phase: 'night' | 'day' | 'vote';
  day_number: number;
  started_at: string;
}

interface ChatMessage {
  user_name: string;
  message: string;
  timestamp: string;
}

const WS_URL = 'wss://functions.poehali.dev/5824c606-b36a-438b-8f5f-78752f089f37';

export function useGameRoom(roomId: string, userId: number, userName: string) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [myRole, setMyRole] = useState<string | null>(null);

  const handleMessage = useCallback((message: any) => {
    switch (message.type) {
      case 'player_joined':
        setPlayers(message.players || []);
        break;
      case 'player_left':
        setPlayers(message.players || []);
        break;
      case 'game_started':
        setGameState(message.game_state);
        break;
      case 'role_assigned':
        setMyRole(message.role);
        break;
      case 'phase_changed':
        setGameState(message.game_state);
        break;
      case 'vote_cast':
        break;
      case 'new_message':
        setChatMessages((prev) => [...prev, message.message]);
        break;
    }
  }, []);

  const { isConnected, sendMessage } = useWebSocket(WS_URL, {
    onMessage: handleMessage,
    onConnect: () => {
      sendMessage({
        action: 'join_room',
        room_id: roomId,
        user_id: userId,
        user_name: userName,
      });
    },
  });

  const leaveRoom = useCallback(() => {
    sendMessage({ action: 'leave_room' });
  }, [sendMessage]);

  const sendChatMessage = useCallback((message: string) => {
    sendMessage({
      action: 'send_message',
      user_name: userName,
      message,
    });
  }, [sendMessage, userName]);

  const vote = useCallback((targetId: number) => {
    sendMessage({
      action: 'vote',
      target_id: targetId,
    });
  }, [sendMessage]);

  const startGame = useCallback(() => {
    sendMessage({ action: 'start_game' });
  }, [sendMessage]);

  const nextPhase = useCallback(() => {
    sendMessage({ action: 'next_phase' });
  }, [sendMessage]);

  return {
    isConnected,
    players,
    gameState,
    chatMessages,
    myRole,
    leaveRoom,
    sendChatMessage,
    vote,
    startGame,
    nextPhase,
  };
}
