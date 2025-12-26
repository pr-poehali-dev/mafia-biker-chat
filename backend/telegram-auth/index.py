import json
import os
import hashlib
import hmac
from urllib.parse import parse_qs
import psycopg2

def handler(event: dict, context) -> dict:
    '''API для авторизации через Telegram Widget'''
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method == 'POST':
        try:
            body_str = event.get('body', '')
            if not body_str or body_str.strip() == '':
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Missing request body'}),
                    'isBase64Encoded': False
                }
            body = json.loads(body_str)
            
            telegram_id = body.get('id')
            username = body.get('username', '')
            first_name = body.get('first_name', '')
            last_name = body.get('last_name', '')
            photo_url = body.get('photo_url', '')
            auth_date = body.get('auth_date')
            hash_value = body.get('hash')
            
            if not telegram_id or not hash_value:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Missing required fields'}),
                    'isBase64Encoded': False
                }
            
            bot_token = os.environ.get('TELEGRAM_BOT_TOKEN')
            if not bot_token:
                return {
                    'statusCode': 500,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Bot token not configured'}),
                    'isBase64Encoded': False
                }
            
            check_data = {
                'id': str(telegram_id),
                'first_name': first_name,
                'username': username,
                'photo_url': photo_url,
                'auth_date': str(auth_date)
            }
            check_data = {k: v for k, v in check_data.items() if v}
            
            data_check_string = '\n'.join([f'{k}={v}' for k, v in sorted(check_data.items())])
            secret_key = hashlib.sha256(bot_token.encode()).digest()
            calculated_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
            
            if calculated_hash != hash_value:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Invalid authentication'}),
                    'isBase64Encoded': False
                }
            
            db_url = os.environ.get('DATABASE_URL')
            conn = psycopg2.connect(db_url)
            cur = conn.cursor()
            
            cur.execute('''
                INSERT INTO users (telegram_id, username, first_name, last_name, photo_url, last_login)
                VALUES (%s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
                ON CONFLICT (telegram_id) 
                DO UPDATE SET 
                    username = EXCLUDED.username,
                    first_name = EXCLUDED.first_name,
                    last_name = EXCLUDED.last_name,
                    photo_url = EXCLUDED.photo_url,
                    last_login = CURRENT_TIMESTAMP
                RETURNING id, telegram_id, username, first_name, last_name, photo_url, reputation, level, total_games, wins, losses
            ''', (telegram_id, username, first_name, last_name, photo_url))
            
            user = cur.fetchone()
            conn.commit()
            cur.close()
            conn.close()
            
            user_data = {
                'id': user[0],
                'telegram_id': user[1],
                'username': user[2],
                'first_name': user[3],
                'last_name': user[4],
                'photo_url': user[5],
                'reputation': user[6],
                'level': user[7],
                'total_games': user[8],
                'wins': user[9],
                'losses': user[10]
            }
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'user': user_data}),
                'isBase64Encoded': False
            }
            
        except json.JSONDecodeError:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Invalid JSON'}),
                'isBase64Encoded': False
            }
        except Exception as e:
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': str(e)}),
                'isBase64Encoded': False
            }
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'}),
        'isBase64Encoded': False
    }