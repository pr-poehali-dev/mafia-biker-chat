import json
from utils import verify_token, check_admin, error_response, success_response

def handle_bonuses(event, cur, conn):
    '''Обработка запросов к бонусам'''
    method = event.get('httpMethod', 'GET')
    headers = event.get('headers', {})
    token = headers.get('X-Auth-Token') or headers.get('x-auth-token')
    
    if not token:
        return error_response(401, json.dumps({'error': 'Missing auth token'}))
    
    user_id = verify_token(token)
    if not user_id:
        return error_response(401, json.dumps({'error': 'Invalid token'}))
    
    # GET - получить бонусы пользователя
    if method == 'GET':
        target_id = event.get('queryStringParameters', {}).get('user_id', user_id)
        
        cur.execute('''
            SELECT bonus_documents, bonus_shield, bonus_privilege
            FROM users WHERE id = %s
        ''', (target_id,))
        
        bonuses = cur.fetchone()
        if not bonuses:
            return error_response(404, json.dumps({'error': 'User not found'}))
        
        return success_response({
            'bonuses': {
                'documents': bonuses[0],
                'shield': bonuses[1],
                'privilege': bonuses[2]
            }
        })
    
    # POST - админ выдаёт бонусы
    elif method == 'POST':
        if not check_admin(user_id, cur):
            return error_response(403, json.dumps({'error': 'Admin access required'}))
        
        body = json.loads(event.get('body', '{}'))
        target_user_id = body.get('user_id')
        bonus_type = body.get('bonus_type')
        amount = body.get('amount', 1)
        
        if not target_user_id or not bonus_type:
            return error_response(400, json.dumps({'error': 'Missing user_id or bonus_type'}))
        
        if bonus_type not in ['documents', 'shield', 'privilege']:
            return error_response(400, json.dumps({'error': 'Invalid bonus_type'}))
        
        column_name = f'bonus_{bonus_type}'
        cur.execute(f'''
            UPDATE users 
            SET {column_name} = {column_name} + %s
            WHERE id = %s
            RETURNING bonus_documents, bonus_shield, bonus_privilege
        ''', (amount, target_user_id))
        
        bonuses = cur.fetchone()
        if not bonuses:
            return error_response(404, json.dumps({'error': 'User not found'}))
        
        conn.commit()
        
        return success_response({
            'bonuses': {
                'documents': bonuses[0],
                'shield': bonuses[1],
                'privilege': bonuses[2]
            }
        })
    
    # PUT - активировать бонус в игре
    elif method == 'PUT':
        body = json.loads(event.get('body', '{}'))
        session_id = body.get('session_id')
        bonus_type = body.get('bonus_type')
        
        if not session_id or not bonus_type:
            return error_response(400, json.dumps({'error': 'Missing session_id or bonus_type'}))
        
        if bonus_type not in ['documents', 'shield', 'privilege']:
            return error_response(400, json.dumps({'error': 'Invalid bonus_type'}))
        
        column_name = f'bonus_{bonus_type}'
        
        cur.execute(f'SELECT {column_name} FROM users WHERE id = %s', (user_id,))
        current_bonus = cur.fetchone()
        
        if not current_bonus or current_bonus[0] <= 0:
            return error_response(400, json.dumps({'error': 'No bonuses available'}))
        
        cur.execute(f'''
            UPDATE users 
            SET {column_name} = {column_name} - 1
            WHERE id = %s
        ''', (user_id,))
        
        cur.execute('''
            INSERT INTO game_active_bonuses (session_id, user_id, bonus_type)
            VALUES (%s, %s, %s)
            ON CONFLICT (session_id, user_id) 
            DO UPDATE SET bonus_type = EXCLUDED.bonus_type
        ''', (session_id, user_id, bonus_type))
        
        conn.commit()
        
        return success_response({'success': True, 'activated': bonus_type})
    
    return error_response(405, json.dumps({'error': 'Method not allowed'}))
