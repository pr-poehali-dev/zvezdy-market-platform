import json
import os
import psycopg2
from datetime import datetime
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Регистрация и аутентификация пользователей
    Args: event - dict с httpMethod, body (username, telegram_id, email)
          context - object с request_id
    Returns: HTTP response с данными пользователя или ошибкой
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Database not configured'})
        }
    
    conn = psycopg2.connect(database_url)
    cur = conn.cursor()
    
    try:
        if method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            action = body_data.get('action', 'register')
            
            if action == 'register':
                username = body_data.get('username')
                telegram_id = body_data.get('telegram_id')
                email = body_data.get('email')
                
                if not username:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Username is required'})
                    }
                
                cur.execute(
                    "SELECT id FROM users WHERE username = %s OR telegram_id = %s",
                    (username, telegram_id)
                )
                existing = cur.fetchone()
                
                if existing:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'User already exists'})
                    }
                
                cur.execute(
                    """INSERT INTO users (username, telegram_id, email, balance, role, created_at, last_login) 
                       VALUES (%s, %s, %s, 0, 'user', %s, %s) 
                       RETURNING id, username, telegram_id, email, balance, role, created_at""",
                    (username, telegram_id, email, datetime.now(), datetime.now())
                )
                user = cur.fetchone()
                conn.commit()
                
                return {
                    'statusCode': 201,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'id': user[0],
                        'username': user[1],
                        'telegram_id': user[2],
                        'email': user[3],
                        'balance': user[4],
                        'role': user[5],
                        'created_at': user[6].isoformat()
                    })
                }
            
            elif action == 'login':
                username = body_data.get('username')
                
                cur.execute(
                    """SELECT id, username, telegram_id, email, balance, role, created_at 
                       FROM users WHERE username = %s""",
                    (username,)
                )
                user = cur.fetchone()
                
                if not user:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'User not found'})
                    }
                
                cur.execute(
                    "UPDATE users SET last_login = %s WHERE id = %s",
                    (datetime.now(), user[0])
                )
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'id': user[0],
                        'username': user[1],
                        'telegram_id': user[2],
                        'email': user[3],
                        'balance': user[4],
                        'role': user[5],
                        'created_at': user[6].isoformat()
                    })
                }
        
        elif method == 'GET':
            user_id = event.get('queryStringParameters', {}).get('user_id')
            
            if user_id:
                cur.execute(
                    """SELECT id, username, telegram_id, email, balance, role, created_at 
                       FROM users WHERE id = %s""",
                    (user_id,)
                )
                user = cur.fetchone()
                
                if not user:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'User not found'})
                    }
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'id': user[0],
                        'username': user[1],
                        'telegram_id': user[2],
                        'email': user[3],
                        'balance': user[4],
                        'role': user[5],
                        'created_at': user[6].isoformat()
                    })
                }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    finally:
        cur.close()
        conn.close()