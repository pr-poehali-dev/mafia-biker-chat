import jwt
import os

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

def get_headers():
    '''Стандартные CORS заголовки'''
    return {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    }

def error_response(status, message):
    '''Стандартный ответ с ошибкой'''
    return {
        'statusCode': status,
        'headers': get_headers(),
        'body': message if isinstance(message, str) else str(message),
        'isBase64Encoded': False
    }

def success_response(data):
    '''Стандартный успешный ответ'''
    import json
    return {
        'statusCode': 200,
        'headers': get_headers(),
        'body': json.dumps(data),
        'isBase64Encoded': False
    }
