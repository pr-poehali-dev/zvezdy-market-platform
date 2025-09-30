'''
Business: Админ-панель для управления платформой
Args: event - dict с httpMethod, body, queryStringParameters
      context - object с request_id, function_name
Returns: HTTP response dict с данными для администратора
'''

import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Admin-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    
    try:
        admin_id = event.get('queryStringParameters', {}).get('admin_id') or \
                   json.loads(event.get('body', '{}')).get('admin_id')
        
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute('SELECT is_admin FROM users WHERE id = %s', (admin_id,))
            admin_check = cur.fetchone()
            
            if not admin_check or not admin_check.get('is_admin'):
                return {
                    'statusCode': 403,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'success': False, 'error': 'Access denied'}),
                    'isBase64Encoded': False
                }
        
        if method == 'GET':
            action = event.get('queryStringParameters', {}).get('action', 'stats')
            
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                if action == 'stats':
                    cur.execute('SELECT COUNT(*) as total_users FROM users')
                    users_count = cur.fetchone()
                    
                    cur.execute('SELECT SUM(balance) as total_balance FROM users')
                    total_balance = cur.fetchone()
                    
                    cur.execute('SELECT COUNT(*) as total_transactions FROM balance_transactions')
                    transactions_count = cur.fetchone()
                    
                    cur.execute('SELECT COUNT(*) as pending_withdrawals FROM withdrawal_requests WHERE status = %s', ('pending',))
                    pending = cur.fetchone()
                    
                    return {
                        'statusCode': 200,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({
                            'success': True,
                            'stats': {
                                'total_users': users_count['total_users'],
                                'total_balance': total_balance['total_balance'] or 0,
                                'total_transactions': transactions_count['total_transactions'],
                                'pending_withdrawals': pending['pending_withdrawals']
                            }
                        }, default=str),
                        'isBase64Encoded': False
                    }
                
                elif action == 'withdrawals':
                    cur.execute('''
                        SELECT wr.*, u.username, u.balance
                        FROM withdrawal_requests wr
                        JOIN users u ON wr.user_id = u.id
                        ORDER BY wr.created_at DESC
                    ''')
                    withdrawals = cur.fetchall()
                    
                    return {
                        'statusCode': 200,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({
                            'success': True,
                            'withdrawals': [dict(w) for w in withdrawals]
                        }, default=str),
                        'isBase64Encoded': False
                    }
                
                elif action == 'users':
                    cur.execute('''
                        SELECT id, username, email, telegram_username, balance, is_admin, created_at, last_login
                        FROM users
                        ORDER BY balance DESC
                        LIMIT 100
                    ''')
                    users = cur.fetchall()
                    
                    return {
                        'statusCode': 200,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({
                            'success': True,
                            'users': [dict(u) for u in users]
                        }, default=str),
                        'isBase64Encoded': False
                    }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            action = body_data.get('action')
            
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                if action == 'add_balance':
                    user_id = body_data.get('user_id')
                    amount = body_data.get('amount')
                    reason = body_data.get('reason', 'Admin adjustment')
                    
                    cur.execute('UPDATE users SET balance = balance + %s WHERE id = %s', (amount, user_id))
                    
                    cur.execute('''
                        INSERT INTO balance_transactions (user_id, amount, transaction_type, description)
                        VALUES (%s, %s, 'admin_adjustment', %s)
                    ''', (user_id, amount, reason))
                    
                    conn.commit()
                    
                    return {
                        'statusCode': 200,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({
                            'success': True,
                            'message': 'Balance updated'
                        }),
                        'isBase64Encoded': False
                    }
                
                elif action == 'add_task':
                    title = body_data.get('title')
                    description = body_data.get('description')
                    reward = body_data.get('reward')
                    task_type = body_data.get('task_type', 'manual')
                    
                    cur.execute('''
                        INSERT INTO tasks (title, description, task_type, reward, icon)
                        VALUES (%s, %s, %s, %s, 'Star')
                        RETURNING id
                    ''', (title, description, task_type, reward))
                    
                    task = cur.fetchone()
                    conn.commit()
                    
                    return {
                        'statusCode': 200,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({
                            'success': True,
                            'task_id': task['id']
                        }),
                        'isBase64Encoded': False
                    }
        
        elif method == 'PUT':
            body_data = json.loads(event.get('body', '{}'))
            action = body_data.get('action')
            
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                if action == 'process_withdrawal':
                    withdrawal_id = body_data.get('withdrawal_id')
                    status = body_data.get('status')
                    comment = body_data.get('comment', '')
                    
                    cur.execute('''
                        UPDATE withdrawal_requests
                        SET status = %s, admin_comment = %s, processed_by = %s, processed_at = CURRENT_TIMESTAMP
                        WHERE id = %s
                    ''', (status, comment, admin_id, withdrawal_id))
                    
                    conn.commit()
                    
                    return {
                        'statusCode': 200,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({
                            'success': True,
                            'message': 'Withdrawal processed'
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