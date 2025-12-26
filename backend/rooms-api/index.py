import json
import os
import psycopg2

def handler(event: dict, context) -> dict:
    '''API для управления комнатами игры'''
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method == 'GET':
        return get_rooms(event)
    elif method == 'POST':
        return create_room(event)
    elif method == 'PUT':
        return update_room(event)
    elif method == 'DELETE':
        return delete_room(event)
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'}),
        'isBase64Encoded': False
    }

def get_rooms(event: dict) -> dict:
    try:
        query_params = event.get('queryStringParameters', {}) or {}
        status = query_params.get('status', 'waiting')
        
        db_url = os.environ.get('DATABASE_URL')
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        cur.execute('''
            SELECT r.id, r.name, r.max_players, r.current_players, r.status, 
                   r.created_at, u.first_name, u.username
            FROM rooms r
            LEFT JOIN users u ON r.created_by = u.id
            WHERE r.status = %s
            ORDER BY r.created_at DESC
            LIMIT 50
        ''', (status,))
        
        rooms = []
        for row in cur.fetchall():
            rooms.append({
                'id': row[0],
                'name': row[1],
                'max_players': row[2],
                'current_players': row[3],
                'status': row[4],
                'created_at': row[5].isoformat() if row[5] else None,
                'creator_name': row[6] or row[7] or 'Unknown'
            })
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'rooms': rooms}),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }

def create_room(event: dict) -> dict:
    try:
        body = json.loads(event.get('body', '{}'))
        
        name = body.get('name')
        password = body.get('password', None)
        max_players = body.get('max_players', 10)
        user_id = body.get('user_id')
        
        if not name or not user_id:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Missing required fields'}),
                'isBase64Encoded': False
            }
        
        db_url = os.environ.get('DATABASE_URL')
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        cur.execute('''
            INSERT INTO rooms (name, password, max_players, current_players, status, created_by)
            VALUES (%s, %s, %s, 1, 'waiting', %s)
            RETURNING id, name, max_players, current_players, status, created_at
        ''', (name, password, max_players, user_id))
        
        room = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 201,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'room': {
                    'id': room[0],
                    'name': room[1],
                    'max_players': room[2],
                    'current_players': room[3],
                    'status': room[4],
                    'created_at': room[5].isoformat() if room[5] else None
                }
            }),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }

def update_room(event: dict) -> dict:
    try:
        body = json.loads(event.get('body', '{}'))
        
        room_id = body.get('room_id')
        current_players = body.get('current_players')
        status = body.get('status')
        
        if not room_id:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Missing room_id'}),
                'isBase64Encoded': False
            }
        
        db_url = os.environ.get('DATABASE_URL')
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        updates = []
        params = []
        
        if current_players is not None:
            updates.append('current_players = %s')
            params.append(current_players)
        
        if status is not None:
            updates.append('status = %s')
            params.append(status)
        
        if not updates:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Nothing to update'}),
                'isBase64Encoded': False
            }
        
        params.append(room_id)
        
        cur.execute(f'''
            UPDATE rooms
            SET {', '.join(updates)}
            WHERE id = %s
            RETURNING id, name, max_players, current_players, status
        ''', params)
        
        room = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        
        if not room:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Room not found'}),
                'isBase64Encoded': False
            }
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'room': {
                    'id': room[0],
                    'name': room[1],
                    'max_players': room[2],
                    'current_players': room[3],
                    'status': room[4]
                }
            }),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }

def delete_room(event: dict) -> dict:
    try:
        query_params = event.get('queryStringParameters', {}) or {}
        room_id = query_params.get('room_id')
        
        if not room_id:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Missing room_id'}),
                'isBase64Encoded': False
            }
        
        db_url = os.environ.get('DATABASE_URL')
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        cur.execute('UPDATE rooms SET status = %s WHERE id = %s', ('closed', room_id))
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'message': 'Room closed'}),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
