import json
import os
from datetime import datetime, timedelta
import psycopg2
import jwt
import requests

def handler(event: dict, context) -> dict:
    '''API для авторизации через Яндекс ID'''
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
            
            code = body.get('code')
            redirect_uri = body.get('redirect_uri')
            
            if not code or not redirect_uri:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Missing code or redirect_uri'}),
                    'isBase64Encoded': False
                }
            
            client_id = os.environ.get('YANDEX_CLIENT_ID')
            client_secret = os.environ.get('YANDEX_CLIENT_SECRET')
            jwt_secret = os.environ.get('JWT_SECRET')
            
            if not client_id or not client_secret or not jwt_secret:
                return {
                    'statusCode': 500,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'OAuth credentials not configured'}),
                    'isBase64Encoded': False
                }
            
            token_response = requests.post('https://oauth.yandex.ru/token', data={
                'grant_type': 'authorization_code',
                'code': code,
                'client_id': client_id,
                'client_secret': client_secret,
                'redirect_uri': redirect_uri
            })
            
            if token_response.status_code != 200:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Failed to exchange code for token'}),
                    'isBase64Encoded': False
                }
            
            access_token = token_response.json().get('access_token')
            
            user_info_response = requests.get('https://login.yandex.ru/info', headers={
                'Authorization': f'OAuth {access_token}'
            })
            
            if user_info_response.status_code != 200:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Failed to get user info'}),
                    'isBase64Encoded': False
                }
            
            yandex_user = user_info_response.json()
            yandex_id = yandex_user.get('id')
            username = yandex_user.get('login', '')
            first_name = yandex_user.get('first_name', '')
            last_name = yandex_user.get('last_name', '')
            photo_url = yandex_user.get('default_avatar_id', '')
            if photo_url:
                photo_url = f'https://avatars.yandex.net/get-yapic/{photo_url}/islands-200'
            
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
            ''', (int(yandex_id), username, first_name, last_name, photo_url))
            
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
            
            token = jwt.encode(
                {
                    'user_id': user[0],
                    'yandex_id': user[1],
                    'exp': datetime.utcnow() + timedelta(days=30)
                },
                jwt_secret,
                algorithm='HS256'
            )
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'user': user_data, 'token': token}),
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
