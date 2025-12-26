import json
import os
import psycopg2
import jwt

def verify_token(token):
    '''Проверка JWT токена'''
    try:
        jwt_secret = os.environ.get('JWT_SECRET')
        payload = jwt.decode(token, jwt_secret, algorithms=['HS256'])
        return payload.get('user_id')
    except:
        return None

def check_admin(user_id, cur):
    '''Проверка прав администратора'''
    cur.execute('SELECT is_admin FROM users WHERE id = %s', (user_id,))
    result = cur.fetchone()
    return result and result[0]

def handler(event: dict, context) -> dict:
    '''Общий API для профилей, админки и магазина'''
    method = event.get('httpMethod', 'GET')
    path = event.get('queryStringParameters', {}).get('path', '')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    try:
        db_url = os.environ.get('DATABASE_URL')
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        # ПРОФИЛЬ
        if path == 'profile':
            headers = event.get('headers', {})
            token = headers.get('X-Auth-Token') or headers.get('x-auth-token')
            
            if not token:
                cur.close()
                conn.close()
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Missing auth token'}),
                    'isBase64Encoded': False
                }
            
            user_id = verify_token(token)
            if not user_id:
                cur.close()
                conn.close()
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Invalid token'}),
                    'isBase64Encoded': False
                }
            
            if method == 'GET':
                cur.execute('''
                    SELECT id, telegram_id, username, first_name, last_name, photo_url, 
                           reputation, level, total_games, wins, losses, profile_name, 
                           is_admin, profile_created
                    FROM users WHERE id = %s
                ''', (user_id,))
                
                user = cur.fetchone()
                if not user:
                    cur.close()
                    conn.close()
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'User not found'}),
                        'isBase64Encoded': False
                    }
                
                user_data = {
                    'id': user[0], 'telegram_id': user[1], 'username': user[2],
                    'first_name': user[3], 'last_name': user[4], 'photo_url': user[5],
                    'reputation': user[6], 'level': user[7], 'total_games': user[8],
                    'wins': user[9], 'losses': user[10], 'profile_name': user[11],
                    'is_admin': user[12], 'profile_created': user[13]
                }
                
                cur.close()
                conn.close()
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'user': user_data}),
                    'isBase64Encoded': False
                }
            
            elif method == 'POST':
                body = json.loads(event.get('body', '{}'))
                profile_name = body.get('profile_name', '').strip()
                
                if not profile_name or len(profile_name) < 3 or len(profile_name) > 50:
                    cur.close()
                    conn.close()
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Profile name must be 3-50 characters'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute('SELECT id FROM users WHERE profile_name = %s', (profile_name,))
                if cur.fetchone():
                    cur.close()
                    conn.close()
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Profile name already taken'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute('''
                    UPDATE users SET profile_name = %s, profile_created = TRUE
                    WHERE id = %s
                    RETURNING id, telegram_id, username, first_name, last_name, photo_url, 
                              reputation, level, total_games, wins, losses, profile_name, 
                              is_admin, profile_created
                ''', (profile_name, user_id))
                
                user = cur.fetchone()
                conn.commit()
                
                user_data = {
                    'id': user[0], 'telegram_id': user[1], 'username': user[2],
                    'first_name': user[3], 'last_name': user[4], 'photo_url': user[5],
                    'reputation': user[6], 'level': user[7], 'total_games': user[8],
                    'wins': user[9], 'losses': user[10], 'profile_name': user[11],
                    'is_admin': user[12], 'profile_created': user[13]
                }
                
                cur.close()
                conn.close()
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'user': user_data}),
                    'isBase64Encoded': False
                }
        
        # АДМИНКА
        elif path == 'admin':
            headers = event.get('headers', {})
            token = headers.get('X-Auth-Token') or headers.get('x-auth-token')
            
            if not token:
                cur.close()
                conn.close()
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Missing auth token'}),
                    'isBase64Encoded': False
                }
            
            user_id = verify_token(token)
            if not user_id:
                cur.close()
                conn.close()
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Invalid token'}),
                    'isBase64Encoded': False
                }
            
            action = event.get('queryStringParameters', {}).get('action', 'check')
            
            if method == 'GET' and action == 'check':
                is_admin = check_admin(user_id, cur)
                cur.execute('SELECT COUNT(*) FROM users WHERE is_admin = TRUE')
                admin_count = cur.fetchone()[0]
                
                if admin_count == 0:
                    cur.execute('UPDATE users SET is_admin = TRUE WHERE id = %s', (user_id,))
                    conn.commit()
                    is_admin = True
                
                cur.close()
                conn.close()
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'is_admin': is_admin}),
                    'isBase64Encoded': False
                }
            
            elif method == 'GET' and action == 'users':
                if not check_admin(user_id, cur):
                    cur.close()
                    conn.close()
                    return {
                        'statusCode': 403,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Admin access required'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute('''
                    SELECT id, profile_name, username, first_name, reputation, level, is_admin, profile_created
                    FROM users WHERE profile_created = TRUE
                    ORDER BY created_at DESC
                ''')
                users = cur.fetchall()
                user_list = [{
                    'id': u[0], 'profile_name': u[1], 'username': u[2],
                    'first_name': u[3], 'reputation': u[4], 'level': u[5],
                    'is_admin': u[6], 'profile_created': u[7]
                } for u in users]
                
                cur.close()
                conn.close()
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'users': user_list}),
                    'isBase64Encoded': False
                }
            
            elif method == 'PUT':
                if not check_admin(user_id, cur):
                    cur.close()
                    conn.close()
                    return {
                        'statusCode': 403,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Admin access required'}),
                        'isBase64Encoded': False
                    }
                
                body = json.loads(event.get('body', '{}'))
                target_user_id = body.get('user_id')
                make_admin = body.get('make_admin', False)
                
                if not target_user_id:
                    cur.close()
                    conn.close()
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Missing user_id'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute('UPDATE users SET is_admin = %s WHERE id = %s', (make_admin, target_user_id))
                conn.commit()
                
                cur.close()
                conn.close()
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True}),
                    'isBase64Encoded': False
                }
        
        # МАГАЗИН
        elif path == 'shop':
            if method == 'GET':
                cur.execute('''
                    SELECT id, name, description, price, image_url, is_available
                    FROM shop_items WHERE is_available = TRUE
                    ORDER BY created_at DESC
                ''')
                items = cur.fetchall()
                item_list = [{
                    'id': i[0], 'name': i[1], 'description': i[2],
                    'price': i[3], 'image_url': i[4], 'is_available': i[5]
                } for i in items]
                
                cur.close()
                conn.close()
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'items': item_list}),
                    'isBase64Encoded': False
                }
            
            headers = event.get('headers', {})
            token = headers.get('X-Auth-Token') or headers.get('x-auth-token')
            
            if not token:
                cur.close()
                conn.close()
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Missing auth token'}),
                    'isBase64Encoded': False
                }
            
            user_id = verify_token(token)
            if not user_id:
                cur.close()
                conn.close()
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Invalid token'}),
                    'isBase64Encoded': False
                }
            
            if method == 'POST':
                if not check_admin(user_id, cur):
                    cur.close()
                    conn.close()
                    return {
                        'statusCode': 403,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Admin access required'}),
                        'isBase64Encoded': False
                    }
                
                body = json.loads(event.get('body', '{}'))
                name = body.get('name')
                description = body.get('description', '')
                price = body.get('price')
                image_url = body.get('image_url', '')
                
                if not name or price is None:
                    cur.close()
                    conn.close()
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Missing name or price'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute('''
                    INSERT INTO shop_items (name, description, price, image_url, created_by)
                    VALUES (%s, %s, %s, %s, %s)
                    RETURNING id, name, description, price, image_url, is_available
                ''', (name, description, price, image_url, user_id))
                
                item = cur.fetchone()
                conn.commit()
                
                item_data = {
                    'id': item[0], 'name': item[1], 'description': item[2],
                    'price': item[3], 'image_url': item[4], 'is_available': item[5]
                }
                
                cur.close()
                conn.close()
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'item': item_data}),
                    'isBase64Encoded': False
                }
            
            elif method == 'DELETE':
                if not check_admin(user_id, cur):
                    cur.close()
                    conn.close()
                    return {
                        'statusCode': 403,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Admin access required'}),
                        'isBase64Encoded': False
                    }
                
                item_id = event.get('queryStringParameters', {}).get('id')
                if not item_id:
                    cur.close()
                    conn.close()
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Missing item id'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute('UPDATE shop_items SET is_available = FALSE WHERE id = %s', (item_id,))
                conn.commit()
                
                cur.close()
                conn.close()
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True}),
                    'isBase64Encoded': False
                }
        
        cur.close()
        conn.close()
        return {
            'statusCode': 404,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Invalid path'}),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
