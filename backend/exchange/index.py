'''
Business: Инвестиционная биржа с акциями компаний и динамическими ценами
Args: event - dict с httpMethod, body, queryStringParameters
      context - object с request_id, function_name
Returns: HTTP response dict с данными о компаниях, акциях и сделках
'''

import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any
from datetime import datetime, timedelta

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
    conn = psycopg2.connect(dsn)
    
    try:
        if method == 'GET':
            action = event.get('queryStringParameters', {}).get('action', 'companies')
            
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                if action == 'companies':
                    cur.execute('''
                        SELECT c.*,
                               ROUND(((c.current_price - c.base_price)::numeric / c.base_price::numeric) * 100, 2) as change_percent
                        FROM companies c
                        ORDER BY c.id
                    ''')
                    companies = cur.fetchall()
                    
                    return {
                        'statusCode': 200,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({
                            'success': True,
                            'companies': [dict(c) for c in companies]
                        }, default=str),
                        'isBase64Encoded': False
                    }
                
                elif action == 'price_history':
                    company_id = event.get('queryStringParameters', {}).get('company_id')
                    
                    cur.execute('''
                        SELECT price, recorded_at
                        FROM stock_price_history
                        WHERE company_id = %s
                        ORDER BY recorded_at DESC
                        LIMIT 50
                    ''', (company_id,))
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
                
                elif action == 'portfolio':
                    user_id = event.get('queryStringParameters', {}).get('user_id')
                    
                    cur.execute('''
                        SELECT us.*, c.name, c.ticker, c.current_price,
                               (c.current_price - us.average_buy_price) * us.shares as profit,
                               c.current_price * us.shares as current_value
                        FROM user_stocks us
                        JOIN companies c ON us.company_id = c.id
                        WHERE us.user_id = %s AND us.shares > 0
                        ORDER BY current_value DESC
                    ''', (user_id,))
                    portfolio = cur.fetchall()
                    
                    return {
                        'statusCode': 200,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({
                            'success': True,
                            'portfolio': [dict(p) for p in portfolio]
                        }, default=str),
                        'isBase64Encoded': False
                    }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            action = body_data.get('action')
            
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                if action == 'buy':
                    user_id = body_data.get('user_id')
                    company_id = body_data.get('company_id')
                    shares = body_data.get('shares')
                    
                    cur.execute('SELECT current_price FROM companies WHERE id = %s', (company_id,))
                    company = cur.fetchone()
                    
                    total_cost = company['current_price'] * shares
                    
                    cur.execute('SELECT balance FROM users WHERE id = %s', (user_id,))
                    user = cur.fetchone()
                    
                    if user['balance'] < total_cost:
                        return {
                            'statusCode': 400,
                            'headers': {
                                'Content-Type': 'application/json',
                                'Access-Control-Allow-Origin': '*'
                            },
                            'body': json.dumps({'success': False, 'error': 'Insufficient balance'}),
                            'isBase64Encoded': False
                        }
                    
                    cur.execute('UPDATE users SET balance = balance - %s WHERE id = %s', (total_cost, user_id))
                    
                    cur.execute('''
                        INSERT INTO user_stocks (user_id, company_id, shares, average_buy_price)
                        VALUES (%s, %s, %s, %s)
                        ON CONFLICT (user_id, company_id)
                        DO UPDATE SET 
                            shares = user_stocks.shares + %s,
                            average_buy_price = ((user_stocks.average_buy_price * user_stocks.shares) + (%s * %s)) / (user_stocks.shares + %s)
                    ''', (user_id, company_id, shares, company['current_price'], 
                          shares, company['current_price'], shares, shares))
                    
                    cur.execute('''
                        INSERT INTO stock_transactions (user_id, company_id, transaction_type, shares, price_per_share, total_amount)
                        VALUES (%s, %s, 'buy', %s, %s, %s)
                    ''', (user_id, company_id, shares, company['current_price'], total_cost))
                    
                    conn.commit()
                    
                    return {
                        'statusCode': 200,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({
                            'success': True,
                            'message': 'Shares purchased successfully'
                        }),
                        'isBase64Encoded': False
                    }
                
                elif action == 'sell':
                    user_id = body_data.get('user_id')
                    company_id = body_data.get('company_id')
                    shares = body_data.get('shares')
                    
                    cur.execute('''
                        SELECT shares FROM user_stocks
                        WHERE user_id = %s AND company_id = %s
                    ''', (user_id, company_id))
                    user_stock = cur.fetchone()
                    
                    if not user_stock or user_stock['shares'] < shares:
                        return {
                            'statusCode': 400,
                            'headers': {
                                'Content-Type': 'application/json',
                                'Access-Control-Allow-Origin': '*'
                            },
                            'body': json.dumps({'success': False, 'error': 'Insufficient shares'}),
                            'isBase64Encoded': False
                        }
                    
                    cur.execute('SELECT current_price FROM companies WHERE id = %s', (company_id,))
                    company = cur.fetchone()
                    
                    total_value = company['current_price'] * shares
                    
                    cur.execute('UPDATE users SET balance = balance + %s WHERE id = %s', (total_value, user_id))
                    
                    cur.execute('''
                        UPDATE user_stocks SET shares = shares - %s
                        WHERE user_id = %s AND company_id = %s
                    ''', (shares, user_id, company_id))
                    
                    cur.execute('''
                        INSERT INTO stock_transactions (user_id, company_id, transaction_type, shares, price_per_share, total_amount)
                        VALUES (%s, %s, 'sell', %s, %s, %s)
                    ''', (user_id, company_id, shares, company['current_price'], total_value))
                    
                    conn.commit()
                    
                    return {
                        'statusCode': 200,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({
                            'success': True,
                            'message': 'Shares sold successfully',
                            'total_value': total_value
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