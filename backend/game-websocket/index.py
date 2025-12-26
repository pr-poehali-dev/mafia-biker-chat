import json
import os
import psycopg2
from datetime import datetime

connections = {}
rooms = {}

def handler(event: dict, context) -> dict:
    '''WebSocket API для real-time игры в Мафию'''
    
    request_context = event.get('requestContext', {})
    event_type = request_context.get('eventType', 'MESSAGE')
    connection_id = request_context.get('connectionId', '')
    
    if event_type == 'CONNECT':
        return handle_connect(connection_id)
    elif event_type == 'DISCONNECT':
        return handle_disconnect(connection_id)
    elif event_type == 'MESSAGE':
        return handle_message(connection_id, event)
    
    return {
        'statusCode': 400,
        'body': json.dumps({'error': 'Unknown event type'}),
        'isBase64Encoded': False
    }

def handle_connect(connection_id: str) -> dict:
    connections[connection_id] = {
        'connected_at': datetime.now().isoformat(),
        'room_id': None,
        'user_id': None
    }
    
    return {
        'statusCode': 200,
        'body': json.dumps({'message': 'Connected', 'connectionId': connection_id}),
        'isBase64Encoded': False
    }

def handle_disconnect(connection_id: str) -> dict:
    if connection_id in connections:
        conn_data = connections[connection_id]
        room_id = conn_data.get('room_id')
        
        if room_id and room_id in rooms:
            rooms[room_id]['players'] = [
                p for p in rooms[room_id]['players'] 
                if p['connection_id'] != connection_id
            ]
            
            broadcast_to_room(room_id, {
                'type': 'player_left',
                'players': rooms[room_id]['players']
            })
        
        del connections[connection_id]
    
    return {
        'statusCode': 200,
        'body': json.dumps({'message': 'Disconnected'}),
        'isBase64Encoded': False
    }

def handle_message(connection_id: str, event: dict) -> dict:
    try:
        body = json.loads(event.get('body', '{}'))
        action = body.get('action')
        
        if action == 'join_room':
            return handle_join_room(connection_id, body)
        elif action == 'leave_room':
            return handle_leave_room(connection_id)
        elif action == 'send_message':
            return handle_send_message(connection_id, body)
        elif action == 'vote':
            return handle_vote(connection_id, body)
        elif action == 'start_game':
            return handle_start_game(connection_id, body)
        elif action == 'next_phase':
            return handle_next_phase(connection_id, body)
        else:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Unknown action'}),
                'isBase64Encoded': False
            }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }

def handle_join_room(connection_id: str, body: dict) -> dict:
    room_id = body.get('room_id')
    user_id = body.get('user_id')
    user_name = body.get('user_name')
    
    if not room_id or not user_id:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'Missing room_id or user_id'}),
            'isBase64Encoded': False
        }
    
    if room_id not in rooms:
        rooms[room_id] = {
            'players': [],
            'game_state': None,
            'chat': []
        }
    
    connections[connection_id]['room_id'] = room_id
    connections[connection_id]['user_id'] = user_id
    
    player_exists = any(p['user_id'] == user_id for p in rooms[room_id]['players'])
    
    if not player_exists:
        rooms[room_id]['players'].append({
            'connection_id': connection_id,
            'user_id': user_id,
            'user_name': user_name,
            'ready': False
        })
    
    broadcast_to_room(room_id, {
        'type': 'player_joined',
        'players': rooms[room_id]['players'],
        'user_name': user_name
    })
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'Joined room',
            'room': rooms[room_id]
        }),
        'isBase64Encoded': False
    }

def handle_leave_room(connection_id: str) -> dict:
    if connection_id not in connections:
        return {'statusCode': 404, 'body': json.dumps({'error': 'Connection not found'}), 'isBase64Encoded': False}
    
    room_id = connections[connection_id].get('room_id')
    if not room_id or room_id not in rooms:
        return {'statusCode': 404, 'body': json.dumps({'error': 'Room not found'}), 'isBase64Encoded': False}
    
    rooms[room_id]['players'] = [
        p for p in rooms[room_id]['players'] 
        if p['connection_id'] != connection_id
    ]
    
    connections[connection_id]['room_id'] = None
    
    broadcast_to_room(room_id, {
        'type': 'player_left',
        'players': rooms[room_id]['players']
    })
    
    return {
        'statusCode': 200,
        'body': json.dumps({'message': 'Left room'}),
        'isBase64Encoded': False
    }

def handle_send_message(connection_id: str, body: dict) -> dict:
    if connection_id not in connections:
        return {'statusCode': 404, 'body': json.dumps({'error': 'Connection not found'}), 'isBase64Encoded': False}
    
    room_id = connections[connection_id].get('room_id')
    user_name = body.get('user_name')
    message = body.get('message')
    
    if not room_id or room_id not in rooms:
        return {'statusCode': 404, 'body': json.dumps({'error': 'Room not found'}), 'isBase64Encoded': False}
    
    chat_message = {
        'user_name': user_name,
        'message': message,
        'timestamp': datetime.now().isoformat()
    }
    
    rooms[room_id]['chat'].append(chat_message)
    
    broadcast_to_room(room_id, {
        'type': 'new_message',
        'message': chat_message
    })
    
    return {
        'statusCode': 200,
        'body': json.dumps({'message': 'Message sent'}),
        'isBase64Encoded': False
    }

def handle_vote(connection_id: str, body: dict) -> dict:
    if connection_id not in connections:
        return {'statusCode': 404, 'body': json.dumps({'error': 'Connection not found'}), 'isBase64Encoded': False}
    
    room_id = connections[connection_id].get('room_id')
    user_id = connections[connection_id].get('user_id')
    target_id = body.get('target_id')
    
    if not room_id or room_id not in rooms:
        return {'statusCode': 404, 'body': json.dumps({'error': 'Room not found'}), 'isBase64Encoded': False}
    
    broadcast_to_room(room_id, {
        'type': 'vote_cast',
        'voter_id': user_id,
        'target_id': target_id
    })
    
    return {
        'statusCode': 200,
        'body': json.dumps({'message': 'Vote registered'}),
        'isBase64Encoded': False
    }

def handle_start_game(connection_id: str, body: dict) -> dict:
    if connection_id not in connections:
        return {'statusCode': 404, 'body': json.dumps({'error': 'Connection not found'}), 'isBase64Encoded': False}
    
    room_id = connections[connection_id].get('room_id')
    
    if not room_id or room_id not in rooms:
        return {'statusCode': 404, 'body': json.dumps({'error': 'Room not found'}), 'isBase64Encoded': False}
    
    players = rooms[room_id]['players']
    
    import random
    roles = ['mafia'] * (len(players) // 3) + ['sheriff'] + ['civilian'] * (len(players) - len(players) // 3 - 1)
    random.shuffle(roles)
    
    for i, player in enumerate(players):
        player['role'] = roles[i]
        player['alive'] = True
    
    rooms[room_id]['game_state'] = {
        'phase': 'night',
        'day_number': 1,
        'started_at': datetime.now().isoformat()
    }
    
    broadcast_to_room(room_id, {
        'type': 'game_started',
        'game_state': rooms[room_id]['game_state']
    })
    
    for player in players:
        send_to_connection(player['connection_id'], {
            'type': 'role_assigned',
            'role': player['role']
        })
    
    return {
        'statusCode': 200,
        'body': json.dumps({'message': 'Game started'}),
        'isBase64Encoded': False
    }

def handle_next_phase(connection_id: str, body: dict) -> dict:
    if connection_id not in connections:
        return {'statusCode': 404, 'body': json.dumps({'error': 'Connection not found'}), 'isBase64Encoded': False}
    
    room_id = connections[connection_id].get('room_id')
    
    if not room_id or room_id not in rooms:
        return {'statusCode': 404, 'body': json.dumps({'error': 'Room not found'}), 'isBase64Encoded': False}
    
    game_state = rooms[room_id].get('game_state')
    if not game_state:
        return {'statusCode': 400, 'body': json.dumps({'error': 'Game not started'}), 'isBase64Encoded': False}
    
    current_phase = game_state['phase']
    
    if current_phase == 'night':
        game_state['phase'] = 'day'
    elif current_phase == 'day':
        game_state['phase'] = 'vote'
    else:
        game_state['phase'] = 'night'
        game_state['day_number'] += 1
    
    broadcast_to_room(room_id, {
        'type': 'phase_changed',
        'game_state': game_state
    })
    
    return {
        'statusCode': 200,
        'body': json.dumps({'message': 'Phase changed'}),
        'isBase64Encoded': False
    }

def broadcast_to_room(room_id: str, message: dict):
    if room_id not in rooms:
        return
    
    for player in rooms[room_id]['players']:
        send_to_connection(player['connection_id'], message)

def send_to_connection(connection_id: str, message: dict):
    pass

def get_db_connection():
    db_url = os.environ.get('DATABASE_URL')
    return psycopg2.connect(db_url)
