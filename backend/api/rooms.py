import json
import random
from datetime import datetime

def calculate_roles(player_count):
    '''Расчет распределения ролей по количеству игроков'''
    if player_count < 4:
        return {}
    
    roles = {
        'mafia': 1,
        'doctor': 1,
        'civilian': max(0, player_count - 2)
    }
    
    if player_count >= 4:
        if player_count >= 6:
            roles['sheriff'] = 1
            roles['civilian'] = player_count - 3
        
        if player_count >= 8:
            roles['mafia'] = 2
            roles['civilian'] = player_count - 4
        
        if player_count >= 10:
            roles['don'] = 1
            roles['mafia'] = 2
            roles['civilian'] = player_count - 5
        
        if player_count >= 12:
            roles['mafia'] = 3
            roles['civilian'] = player_count - 6
        
        if player_count >= 14:
            roles['prostitute'] = 1
            roles['civilian'] = player_count - 7
        
        if player_count >= 16:
            roles['mafia'] = 4
            roles['civilian'] = player_count - 8
    
    return roles

def distribute_roles(players):
    '''Распределяет роли среди игроков'''
    player_count = len(players)
    role_config = calculate_roles(player_count)
    
    role_list = []
    for role, count in role_config.items():
        role_list.extend([role] * count)
    
    random.shuffle(role_list)
    
    result = []
    for i, player in enumerate(players):
        result.append({
            'user_id': player['user_id'],
            'role': role_list[i] if i < len(role_list) else 'civilian',
            'is_alive': True
        })
    
    return result

def handle_rooms(event, cur, conn):
    '''Обработка запросов комнат'''
    method = event.get('httpMethod', 'GET')
    
    if method == 'GET':
        cur.execute('''
            SELECT id, name, password, max_players, current_players, status, created_by, created_at
            FROM rooms
            WHERE status IN ('waiting', 'in_game')
            ORDER BY created_at DESC
        ''')
        
        rooms_data = cur.fetchall()
        rooms = []
        
        for room in rooms_data:
            rooms.append({
                'id': room[0],
                'name': room[1],
                'has_password': room[2] is not None,
                'max_players': room[3],
                'current_players': room[4],
                'status': room[5],
                'created_by': room[6],
                'created_at': room[7].isoformat() if room[7] else None
            })
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': True, 'rooms': rooms}),
            'isBase64Encoded': False
        }
    
    elif method == 'POST':
        from utils import verify_token
        
        headers = event.get('headers', {})
        token = headers.get('X-Auth-Token') or headers.get('x-auth-token')
        
        if not token:
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Missing auth token'}),
                'isBase64Encoded': False
            }
        
        user_id = verify_token(token)
        if not user_id:
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Invalid token'}),
                'isBase64Encoded': False
            }
        
        body = json.loads(event.get('body', '{}'))
        name = body.get('name', '').strip()
        max_players = body.get('max_players', 10)
        password = body.get('password')
        
        if not name:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Room name required'}),
                'isBase64Encoded': False
            }
        
        if max_players < 4 or max_players > 20:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Max players must be between 4 and 20'}),
                'isBase64Encoded': False
            }
        
        cur.execute('''
            INSERT INTO rooms (name, password, max_players, current_players, status, created_by)
            VALUES (%s, %s, %s, 0, 'waiting', %s)
            RETURNING id
        ''', (name, password, max_players, user_id))
        
        room_id = cur.fetchone()[0]
        conn.commit()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': True, 'room_id': room_id}),
            'isBase64Encoded': False
        }

def handle_game(event, cur, conn):
    '''Обработка игровых действий'''
    method = event.get('httpMethod', 'GET')
    action = event.get('queryStringParameters', {}).get('action', '')
    
    from utils import verify_token
    
    headers = event.get('headers', {})
    token = headers.get('X-Auth-Token') or headers.get('x-auth-token')
    
    if not token:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Missing auth token'}),
            'isBase64Encoded': False
        }
    
    user_id = verify_token(token)
    if not user_id:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Invalid token'}),
            'isBase64Encoded': False
        }
    
    if action == 'start':
        body = json.loads(event.get('body', '{}'))
        room_id = body.get('room_id')
        
        if not room_id:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Room ID required'}),
                'isBase64Encoded': False
            }
        
        cur.execute('SELECT id, current_players FROM rooms WHERE id = %s', (room_id,))
        room = cur.fetchone()
        
        if not room:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Room not found'}),
                'isBase64Encoded': False
            }
        
        if room[1] < 4:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Minimum 4 players required'}),
                'isBase64Encoded': False
            }
        
        cur.execute('''
            INSERT INTO game_sessions (room_id, status, phase, day_number)
            VALUES (%s, 'active', 'night', 1)
            RETURNING id
        ''', (room_id,))
        
        session_id = cur.fetchone()[0]
        
        cur.execute('UPDATE rooms SET status = %s WHERE id = %s', ('in_game', room_id))
        
        conn.commit()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': True, 'session_id': session_id}),
            'isBase64Encoded': False
        }
    
    elif action == 'vote':
        body = json.loads(event.get('body', '{}'))
        session_id = body.get('session_id')
        target_id = body.get('target_id')
        
        if not session_id or not target_id:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Session ID and target ID required'}),
                'isBase64Encoded': False
            }
        
        cur.execute('''
            SELECT phase, day_number FROM game_sessions WHERE id = %s
        ''', (session_id,))
        
        game = cur.fetchone()
        if not game:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Game session not found'}),
                'isBase64Encoded': False
            }
        
        phase, day_number = game
        
        cur.execute('''
            INSERT INTO votes (session_id, voter_id, target_id, phase, day_number)
            VALUES (%s, %s, %s, %s, %s)
        ''', (session_id, user_id, target_id, phase, day_number))
        
        conn.commit()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': True}),
            'isBase64Encoded': False
        }
    
    return {
        'statusCode': 400,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Unknown action'}),
        'isBase64Encoded': False
    }
