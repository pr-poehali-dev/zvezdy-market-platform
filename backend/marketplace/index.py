'''
Business: P2P маркетплейс подарков с историей владения
Args: event - dict с httpMethod, body, queryStringParameters
      context - object с request_id, function_name
Returns: HTTP response dict с подарками, сделками и историей
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
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    
    try:
        if method == 'GET':
            action = event.get('queryStringParameters', {}).get('action', 'list')
            
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                if action == 'store_gifts':
                    cur.execute('''
                        SELECT id, name, description, emoji as image, base_price as price, rarity as category
                        FROM gifts
                        ORDER BY base_price ASC
                    ''')
                    gifts = cur.fetchall()
                    
                    return {
                        'statusCode': 200,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({
                            'success': True,
                            'gifts': [dict(g) for g in gifts]
                        }, default=str),
                        'isBase64Encoded': False
                    }
                
                elif action == 'list':
                    cur.execute('''
                        SELECT ug.id as user_gift_id, ug.sale_price, ug.purchased_at,
                               g.*, u.username as seller_name,
                               0 as transaction_count
                        FROM user_gifts ug
                        JOIN gifts g ON ug.gift_id = g.id
                        JOIN users u ON ug.owner_id = u.id
                        WHERE ug.is_on_sale = TRUE
                        ORDER BY ug.sale_price ASC
                    ''')
                    items = cur.fetchall()
                    
                    return {
                        'statusCode': 200,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({
                            'success': True,
                            'items': [dict(item) for item in items]
                        }, default=str),
                        'isBase64Encoded': False
                    }
                
                elif action == 'history':
                    gift_id = event.get('queryStringParameters', {}).get('gift_id')
                    
                    cur.execute('''
                        SELECT gt.*, 
                               us.username as seller_name,
                               ub.username as buyer_name,
                               g.name as gift_name
                        FROM gift_transactions gt
                        LEFT JOIN users us ON gt.seller_id = us.id
                        LEFT JOIN users ub ON gt.buyer_id = ub.id
                        JOIN gifts g ON gt.gift_id = g.id
                        WHERE gt.gift_id = %s
                        ORDER BY gt.created_at DESC
                    ''', (gift_id,))
                    history = cur.fetchall()
                    
                    return {
                        'statusCode': 200,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({
                            'success': True,
                            'history': [dict(h) for h in history]
                        }, default=str),
                        'isBase64Encoded': False
                    }
                
                elif action == 'my_gifts':
                    user_id = event.get('queryStringParameters', {}).get('user_id')
                    
                    cur.execute('''
                        SELECT ug.*, g.name, g.emoji as image_emoji, g.description,
                               0 as transaction_count
                        FROM user_gifts ug
                        JOIN gifts g ON ug.gift_id = g.id
                        WHERE ug.owner_id = %s
                        ORDER BY ug.purchased_at DESC
                    ''', (user_id,))
                    gifts = cur.fetchall()
                    
                    return {
                        'statusCode': 200,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({
                            'success': True,
                            'gifts': [dict(g) for g in gifts]
                        }, default=str),
                        'isBase64Encoded': False
                    }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            action = body_data.get('action')
            
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                if action == 'buy_from_store':
                    user_id = body_data.get('user_id')
                    gift_id = body_data.get('gift_id')
                    
                    cur.execute('SELECT * FROM gifts WHERE id = %s', (gift_id,))
                    gift = cur.fetchone()
                    
                    if not gift:
                        return {
                            'statusCode': 404,
                            'headers': {
                                'Content-Type': 'application/json',
                                'Access-Control-Allow-Origin': '*'
                            },
                            'body': json.dumps({'success': False, 'error': 'Gift not found'}),
                            'isBase64Encoded': False
                        }
                    
                    cur.execute('SELECT balance FROM users WHERE id = %s', (user_id,))
                    user = cur.fetchone()
                    
                    if user['balance'] < gift['base_price']:
                        return {
                            'statusCode': 400,
                            'headers': {
                                'Content-Type': 'application/json',
                                'Access-Control-Allow-Origin': '*'
                            },
                            'body': json.dumps({'success': False, 'error': 'Insufficient balance'}),
                            'isBase64Encoded': False
                        }
                    
                    cur.execute('UPDATE users SET balance = balance - %s WHERE id = %s', (gift['base_price'], user_id))
                    
                    cur.execute('''
                        INSERT INTO user_gifts (owner_id, gift_id, purchase_price)
                        VALUES (%s, %s, %s)
                        RETURNING id
                    ''', (user_id, gift_id, gift['base_price']))
                    user_gift = cur.fetchone()
                    
                    cur.execute('''
                        INSERT INTO balance_transactions (user_id, amount, transaction_type, description)
                        VALUES (%s, %s, 'gift_purchase', %s)
                    ''', (user_id, -gift['base_price'], f"Покупка подарка: {gift['name']}"))
                    
                    conn.commit()
                    
                    return {
                        'statusCode': 200,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({
                            'success': True,
                            'message': 'Gift purchased successfully'
                        }),
                        'isBase64Encoded': False
                    }
                
                elif action == 'buy_from_user':
                    buyer_id = body_data.get('buyer_id')
                    user_gift_id = body_data.get('user_gift_id')
                    
                    cur.execute('''
                        SELECT ug.*, g.name as gift_name, u.id as seller_id
                        FROM user_gifts ug
                        JOIN gifts g ON ug.gift_id = g.id
                        JOIN users u ON ug.owner_id = u.id
                        WHERE ug.id = %s AND ug.is_on_sale = TRUE
                    ''', (user_gift_id,))
                    item = cur.fetchone()
                    
                    if not item:
                        return {
                            'statusCode': 404,
                            'headers': {
                                'Content-Type': 'application/json',
                                'Access-Control-Allow-Origin': '*'
                            },
                            'body': json.dumps({'success': False, 'error': 'Item not found'}),
                            'isBase64Encoded': False
                        }
                    
                    cur.execute('SELECT balance FROM users WHERE id = %s', (buyer_id,))
                    buyer = cur.fetchone()
                    
                    if buyer['balance'] < item['sale_price']:
                        return {
                            'statusCode': 400,
                            'headers': {
                                'Content-Type': 'application/json',
                                'Access-Control-Allow-Origin': '*'
                            },
                            'body': json.dumps({'success': False, 'error': 'Insufficient balance'}),
                            'isBase64Encoded': False
                        }
                    
                    cur.execute('UPDATE users SET balance = balance - %s WHERE id = %s', (item['sale_price'], buyer_id))
                    cur.execute('UPDATE users SET balance = balance + %s WHERE id = %s', (item['sale_price'], item['seller_id']))
                    
                    cur.execute('''
                        UPDATE user_gifts SET owner_id = %s, is_on_sale = FALSE, sale_price = NULL
                        WHERE id = %s
                    ''', (buyer_id, user_gift_id))
                    
                    cur.execute('''
                        INSERT INTO gift_transactions (gift_id, user_gift_id, seller_id, buyer_id, price, transaction_type)
                        VALUES (%s, %s, %s, %s, %s, 'p2p_sale')
                    ''', (item['gift_id'], user_gift_id, item['seller_id'], buyer_id, item['sale_price']))
                    
                    conn.commit()
                    
                    return {
                        'statusCode': 200,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({
                            'success': True,
                            'message': 'Gift purchased successfully'
                        }),
                        'isBase64Encoded': False
                    }
        
        elif method == 'PUT':
            body_data = json.loads(event.get('body', '{}'))
            action = body_data.get('action')
            
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                if action == 'list_for_sale':
                    user_gift_id = body_data.get('user_gift_id')
                    sale_price = body_data.get('sale_price')
                    
                    cur.execute('''
                        UPDATE user_gifts SET is_on_sale = TRUE, sale_price = %s
                        WHERE id = %s
                        RETURNING id
                    ''', (sale_price, user_gift_id))
                    
                    result = cur.fetchone()
                    conn.commit()
                    
                    if result:
                        return {
                            'statusCode': 200,
                            'headers': {
                                'Content-Type': 'application/json',
                                'Access-Control-Allow-Origin': '*'
                            },
                            'body': json.dumps({
                                'success': True,
                                'message': 'Gift listed for sale'
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