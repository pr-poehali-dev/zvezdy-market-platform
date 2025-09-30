'''
Business: Управление заданиями и верификация через Telegram Bot
Args: event - dict с httpMethod, body, queryStringParameters
      context - object с request_id, function_name
Returns: HTTP response dict с заданиями или результатом верификации
'''

import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any
import requests

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
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
            'body': '',
            'isBase64Encoded': False
        }
    
    dsn = os.environ.get('DATABASE_URL')
    bot_token = os.environ.get('TELEGRAM_BOT_TOKEN')
    conn = psycopg2.connect(dsn)
    
    try:
        if method == 'GET':
            user_id = event.get('queryStringParameters', {}).get('user_id')
            
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute('''
                    SELECT t.*, 
                           CASE WHEN ut.id IS NOT NULL THEN TRUE ELSE FALSE END as completed
                    FROM tasks t
                    LEFT JOIN user_tasks ut ON t.id = ut.task_id AND ut.user_id = %s
                    WHERE t.is_active = TRUE
                    ORDER BY t.reward DESC
                ''', (user_id,))
                tasks = cur.fetchall()
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'success': True,
                        'tasks': [dict(task) for task in tasks]
                    }, default=str),
                    'isBase64Encoded': False
                }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            action = body_data.get('action')
            
            if action == 'verify':
                user_id = body_data.get('user_id')
                task_id = body_data.get('task_id')
                telegram_user_id = body_data.get('telegram_user_id')
                
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute('SELECT * FROM tasks WHERE id = %s', (task_id,))
                    task = cur.fetchone()
                    
                    if not task:
                        return {
                            'statusCode': 404,
                            'headers': {
                                'Content-Type': 'application/json',
                                'Access-Control-Allow-Origin': '*'
                            },
                            'body': json.dumps({'success': False, 'error': 'Task not found'}),
                            'isBase64Encoded': False
                        }
                    
                    verified = False
                    if task['task_type'] == 'telegram_subscribe':
                        try:
                            response = requests.get(
                                f"https://api.telegram.org/bot{bot_token}/getChatMember",
                                params={
                                    'chat_id': task['telegram_channel_id'],
                                    'user_id': telegram_user_id
                                }
                            )
                            data = response.json()
                            if data.get('ok'):
                                status = data.get('result', {}).get('status')
                                verified = status in ['member', 'administrator', 'creator']
                        except:
                            verified = True
                    else:
                        verified = True
                    
                    if verified:
                        cur.execute('''
                            INSERT INTO user_tasks (user_id, task_id, verified)
                            VALUES (%s, %s, TRUE)
                            ON CONFLICT (user_id, task_id) DO NOTHING
                            RETURNING id
                        ''', (user_id, task_id))
                        
                        result = cur.fetchone()
                        
                        if result:
                            cur.execute('''
                                UPDATE users SET balance = balance + %s WHERE id = %s
                                RETURNING balance
                            ''', (task['reward'], user_id))
                            
                            new_balance = cur.fetchone()
                            
                            cur.execute('''
                                INSERT INTO balance_transactions (user_id, amount, transaction_type, description)
                                VALUES (%s, %s, 'task_reward', %s)
                            ''', (user_id, task['reward'], f"Награда за задание: {task['title']}"))
                            
                            conn.commit()
                            
                            return {
                                'statusCode': 200,
                                'headers': {
                                    'Content-Type': 'application/json',
                                    'Access-Control-Allow-Origin': '*'
                                },
                                'body': json.dumps({
                                    'success': True,
                                    'verified': True,
                                    'reward': task['reward'],
                                    'new_balance': new_balance['balance']
                                }),
                                'isBase64Encoded': False
                            }
                        else:
                            return {
                                'statusCode': 400,
                                'headers': {
                                    'Content-Type': 'application/json',
                                    'Access-Control-Allow-Origin': '*'
                                },
                                'body': json.dumps({
                                    'success': False,
                                    'error': 'Task already completed'
                                }),
                                'isBase64Encoded': False
                            }
                    else:
                        return {
                            'statusCode': 400,
                            'headers': {
                                'Content-Type': 'application/json',
                                'Access-Control-Allow-Origin': '*'
                            },
                            'body': json.dumps({
                                'success': False,
                                'verified': False,
                                'error': 'Verification failed'
                            }),
                            'isBase64Encoded': False
                        }
        
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'success': False, 'error': 'Invalid request'}),
            'isBase64Encoded': False
        }
    
    finally:
        conn.close()