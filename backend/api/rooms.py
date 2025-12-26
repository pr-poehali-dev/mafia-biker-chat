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
            DELETE FROM room_players 
            WHERE last_seen < NOW() - INTERVAL '30 seconds'
        ''')
        
        cur.execute('''
            SELECT r.id, r.name, r.password, r.max_players, 
                   COUNT(DISTINCT rp.user_id) as current_players, 
                   r.status, r.created_by, r.created_at
            FROM rooms r
            LEFT JOIN room_players rp ON r.id = rp.room_id
            WHERE r.status IN ('waiting', 'in_game')
            GROUP BY r.id, r.name, r.password, r.max_players, r.status, r.created_by, r.created_at
            ORDER BY r.created_at DESC
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
        
        conn.commit()
        
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
        max_players = body.get('max_players', 20)
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

def handle_room(event, cur, conn):
    '''Обработка действий в комнате'''
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
    
    action = event.get('queryStringParameters', {}).get('action', '')
    method = event.get('httpMethod', 'GET')
    
    if action == 'join' and method == 'POST':
        body = json.loads(event.get('body', '{}'))
        room_id = body.get('room_id')
        user_name = body.get('user_name', 'Guest')
        
        if not room_id:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Room ID required'}),
                'isBase64Encoded': False
            }
        
        cur.execute('SELECT created_by FROM rooms WHERE id = %s', (room_id,))
        room = cur.fetchone()
        
        if not room:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Room not found'}),
                'isBase64Encoded': False
            }
        
        is_creator = room[0] == user_id
        
        cur.execute('''
            INSERT INTO room_players (room_id, user_id, user_name, is_creator, last_seen)
            VALUES (%s, %s, %s, %s, NOW())
            ON CONFLICT (room_id, user_id) 
            DO UPDATE SET last_seen = NOW()
        ''', (room_id, user_id, user_name, is_creator))
        
        conn.commit()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': True, 'is_creator': is_creator}),
            'isBase64Encoded': False
        }
    
    elif action == 'state' and method == 'GET':
        room_id = event.get('queryStringParameters', {}).get('room_id')
        
        if not room_id:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Room ID required'}),
                'isBase64Encoded': False
            }
        
        cur.execute('''
            UPDATE room_players 
            SET last_seen = NOW() 
            WHERE room_id = %s AND user_id = %s
        ''', (room_id, user_id))
        
        cur.execute('''
            DELETE FROM room_players 
            WHERE room_id = %s AND last_seen < NOW() - INTERVAL '10 seconds'
        ''', (room_id,))
        
        cur.execute('''
            SELECT user_id, user_name, is_creator
            FROM room_players
            WHERE room_id = %s
            ORDER BY joined_at
        ''', (room_id,))
        
        players = []
        for p in cur.fetchall():
            players.append({
                'user_id': p[0],
                'user_name': p[1],
                'is_creator': p[2]
            })
        
        cur.execute('''
            SELECT user_name, message, created_at
            FROM room_chat
            WHERE room_id = %s
            ORDER BY created_at DESC
            LIMIT 50
        ''', (room_id,))
        
        chat = []
        for c in cur.fetchall():
            chat.append({
                'user_name': c[0],
                'message': c[1],
                'created_at': c[2].isoformat() if c[2] else None
            })
        
        chat.reverse()
        
        cur.execute('''
            SELECT active_session_id, status 
            FROM rooms 
            WHERE id = %s
        ''', (room_id,))
        
        room_data = cur.fetchone()
        game_started = False
        session_id = None
        
        if room_data and room_data[0]:
            session_id = room_data[0]
            game_started = True
        
        conn.commit()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'success': True, 
                'players': players, 
                'chat': chat,
                'game_started': game_started,
                'session_id': session_id
            }),
            'isBase64Encoded': False
        }
    
    elif action == 'chat' and method == 'POST':
        body = json.loads(event.get('body', '{}'))
        room_id = body.get('room_id')
        message = body.get('message', '').strip()
        
        if not room_id or not message:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Room ID and message required'}),
                'isBase64Encoded': False
            }
        
        cur.execute('''
            SELECT user_name FROM room_players 
            WHERE room_id = %s AND user_id = %s
        ''', (room_id, user_id))
        
        player = cur.fetchone()
        
        if not player:
            return {
                'statusCode': 403,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Not in room'}),
                'isBase64Encoded': False
            }
        
        user_name = player[0]
        
        cur.execute('''
            INSERT INTO room_chat (room_id, user_id, user_name, message)
            VALUES (%s, %s, %s, %s)
        ''', (room_id, user_id, user_name, message))
        
        conn.commit()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': True}),
            'isBase64Encoded': False
        }
    
    elif action == 'leave' and method == 'POST':
        body = json.loads(event.get('body', '{}'))
        room_id = body.get('room_id')
        
        if not room_id:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Room ID required'}),
                'isBase64Encoded': False
            }
        
        cur.execute('''
            DELETE FROM room_players 
            WHERE room_id = %s AND user_id = %s
        ''', (room_id, user_id))
        
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
    
    if action == 'start' and method == 'POST':
        body = json.loads(event.get('body', '{}'))
        room_id = body.get('room_id')
        
        if not room_id:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Room ID required'}),
                'isBase64Encoded': False
            }
        
        cur.execute('''
            SELECT user_id, user_name 
            FROM room_players 
            WHERE room_id = %s
        ''', (room_id,))
        
        players = []
        for p in cur.fetchall():
            players.append({'user_id': p[0], 'user_name': p[1]})
        
        if len(players) < 4:
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
        
        player_roles = distribute_roles(players)
        
        for pr in player_roles:
            cur.execute('''
                INSERT INTO session_players (session_id, user_id, role, is_alive)
                VALUES (%s, %s, %s, %s)
            ''', (session_id, pr['user_id'], pr['role'], pr['is_alive']))
        
        cur.execute('''
            UPDATE rooms 
            SET status = %s, active_session_id = %s 
            WHERE id = %s
        ''', ('in_game', session_id, room_id))
        
        conn.commit()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': True, 'session_id': session_id}),
            'isBase64Encoded': False
        }
    
    elif action == 'vote' and method == 'POST':
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
            DELETE FROM votes 
            WHERE session_id = %s AND voter_id = %s AND day_number = %s AND phase = %s
        ''', (session_id, user_id, day_number, phase))
        
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
