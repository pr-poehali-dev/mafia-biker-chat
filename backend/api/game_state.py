import json

def handle_game_state(event, cur, conn):
    '''Получение состояния игры'''
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
    
    session_id = event.get('queryStringParameters', {}).get('session_id')
    
    if not session_id:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Session ID required'}),
            'isBase64Encoded': False
        }
    
    cur.execute('''
        SELECT phase, day_number, status
        FROM game_sessions
        WHERE id = %s
    ''', (session_id,))
    
    game = cur.fetchone()
    
    if not game:
        return {
            'statusCode': 404,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Game not found'}),
            'isBase64Encoded': False
        }
    
    phase, day_number, status = game
    
    cur.execute('''
        SELECT sp.user_id, sp.role, sp.is_alive, u.profile_name, u.first_name
        FROM session_players sp
        JOIN users u ON sp.user_id = u.id
        WHERE sp.session_id = %s
    ''', (session_id,))
    
    all_players = []
    my_role = ''
    
    for p in cur.fetchall():
        player_id = p[0]
        role = p[1]
        is_alive = p[2]
        name = p[3] or p[4] or 'Guest'
        
        if player_id == user_id:
            my_role = role
        
        cur.execute('''
            SELECT COUNT(*) FROM votes
            WHERE session_id = %s AND voter_id = %s AND day_number = %s AND phase = %s
        ''', (session_id, player_id, day_number, phase))
        
        voted = cur.fetchone()[0] > 0
        
        all_players.append({
            'id': player_id,
            'name': name,
            'role': role if player_id == user_id else 'unknown',
            'alive': is_alive,
            'voted': voted
        })
    
    game_ended = status == 'finished'
    winner = None
    
    if not game_ended:
        alive_players = [p for p in all_players if p['alive']]
        mafia_alive = len([p for p in alive_players if p['role'] in ['mafia', 'don']])
        civilian_alive = len([p for p in alive_players if p['role'] not in ['mafia', 'don']])
        
        if mafia_alive == 0:
            game_ended = True
            winner = 'civilian'
            cur.execute('''
                UPDATE game_sessions SET status = 'finished' WHERE id = %s
            ''', (session_id,))
            conn.commit()
        elif mafia_alive >= civilian_alive:
            game_ended = True
            winner = 'mafia'
            cur.execute('''
                UPDATE game_sessions SET status = 'finished' WHERE id = %s
            ''', (session_id,))
            conn.commit()
    
    cur.execute('''
        SELECT rc.user_name, rc.message, rc.created_at
        FROM room_chat rc
        JOIN game_sessions gs ON rc.room_id = gs.room_id
        WHERE gs.id = %s
        ORDER BY rc.created_at DESC
        LIMIT 50
    ''', (session_id,))
    
    chat = []
    for c in cur.fetchall():
        chat.append({
            'user_name': c[0],
            'message': c[1],
            'created_at': c[2].isoformat() if c[2] else None
        })
    
    chat.reverse()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'success': True,
            'phase': phase,
            'day_number': day_number,
            'my_role': my_role,
            'players': all_players,
            'game_ended': game_ended,
            'winner': winner,
            'chat': chat
        }),
        'isBase64Encoded': False
    }
