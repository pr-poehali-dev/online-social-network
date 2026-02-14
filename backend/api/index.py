"""API соцсети Online — авторизация, посты, комментарии, лайки, профили, верификация, уведомления"""

import json
import hashlib
import uuid
import os
import base64
import psycopg2

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Authorization',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json'
}

def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def resp(status, body):
    return {'statusCode': status, 'headers': CORS_HEADERS, 'body': json.dumps(body, default=str)}

def hash_pw(pw):
    return hashlib.sha256(pw.encode()).hexdigest()

def get_user_by_token(conn, token):
    if not token:
        return None
    token = token.replace('Bearer ', '')
    cur = conn.cursor()
    cur.execute("SELECT u.id, u.username, u.email, u.display_name, u.bio, u.avatar_url, u.is_private, u.is_verified, u.is_admin FROM users u JOIN sessions s ON s.user_id = u.id WHERE s.token = '%s' LIMIT 1" % token.replace("'", "''"))
    row = cur.fetchone()
    if not row:
        return None
    return {'id': row[0], 'username': row[1], 'email': row[2], 'display_name': row[3], 'bio': row[4], 'avatar_url': row[5], 'is_private': row[6], 'is_verified': row[7], 'is_admin': row[8]}

def handler(event, context):
    """Единый API для соцсети Online"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    qs = event.get('queryStringParameters') or {}
    path = qs.get('route', '/')
    body = {}
    if event.get('body'):
        try:
            raw = event['body']
            if event.get('isBase64Encoded'):
                raw = base64.b64decode(raw).decode()
            body = json.loads(raw)
        except:
            body = {}

    headers = event.get('headers') or {}
    token = headers.get('X-Authorization') or headers.get('x-authorization') or headers.get('Authorization') or headers.get('authorization') or ''

    conn = get_db()
    try:
        cur = conn.cursor()

        # === AUTH ===
        if path == '/auth/register' and method == 'POST':
            username = (body.get('username') or '').strip().lower()
            email = (body.get('email') or '').strip().lower()
            password = body.get('password') or ''
            if not username or not email or not password:
                return resp(400, {'error': 'Все поля обязательны'})
            if len(username) < 3 or len(username) > 50:
                return resp(400, {'error': 'Username от 3 до 50 символов'})
            if len(password) < 6:
                return resp(400, {'error': 'Пароль минимум 6 символов'})
            cur.execute("SELECT id FROM users WHERE username = '%s' OR email = '%s'" % (username.replace("'","''"), email.replace("'","''")))
            if cur.fetchone():
                return resp(400, {'error': 'Пользователь уже существует'})
            pw_hash = hash_pw(password)
            user_id = str(uuid.uuid4())
            sess_token = str(uuid.uuid4())
            cur.execute("INSERT INTO users (id, username, email, password_hash, display_name) VALUES ('%s','%s','%s','%s','%s')" % (user_id, username.replace("'","''"), email.replace("'","''"), pw_hash, username.replace("'","''")))
            cur.execute("INSERT INTO sessions (user_id, token) VALUES ('%s','%s')" % (user_id, sess_token))
            conn.commit()
            return resp(200, {'token': sess_token, 'user': {'id': user_id, 'username': username, 'display_name': username, 'is_verified': False, 'is_admin': False, 'avatar_url': '', 'bio': '', 'is_private': False}})

        if path == '/auth/login' and method == 'POST':
            email = (body.get('email') or '').strip().lower()
            password = body.get('password') or ''
            if not email or not password:
                return resp(400, {'error': 'Заполните все поля'})
            pw_hash = hash_pw(password)
            cur.execute("SELECT id, username, display_name, is_verified, is_admin, avatar_url, bio, is_private FROM users WHERE email = '%s' AND password_hash = '%s'" % (email.replace("'","''"), pw_hash))
            row = cur.fetchone()
            if not row:
                return resp(401, {'error': 'Неверный email или пароль'})
            sess_token = str(uuid.uuid4())
            cur.execute("INSERT INTO sessions (user_id, token) VALUES ('%s','%s')" % (row[0], sess_token))
            conn.commit()
            return resp(200, {'token': sess_token, 'user': {'id': row[0], 'username': row[1], 'display_name': row[2], 'is_verified': row[3], 'is_admin': row[4], 'avatar_url': row[5], 'bio': row[6], 'is_private': row[7]}})

        if path == '/auth/me' and method == 'GET':
            user = get_user_by_token(conn, token)
            if not user:
                return resp(401, {'error': 'Не авторизован'})
            return resp(200, {'user': user})

        # === POSTS ===
        if path == '/posts' and method == 'GET':
            page = int(qs.get('page', '1'))
            limit = 20
            offset = (page - 1) * limit
            cur.execute("SELECT p.id, p.content, p.image_url, p.created_at, p.user_id, u.username, u.display_name, u.avatar_url, u.is_verified, (SELECT COUNT(*) FROM likes WHERE post_id = p.id), (SELECT COUNT(*) FROM comments WHERE post_id = p.id) FROM posts p JOIN users u ON u.id = p.user_id WHERE u.is_private = false ORDER BY p.created_at DESC LIMIT %d OFFSET %d" % (limit, offset))
            rows = cur.fetchall()
            user = get_user_by_token(conn, token)
            posts = []
            for r in rows:
                liked = False
                if user:
                    cur.execute("SELECT id FROM likes WHERE post_id = '%s' AND user_id = '%s'" % (r[0], user['id']))
                    liked = cur.fetchone() is not None
                posts.append({'id': r[0], 'content': r[1], 'image_url': r[2], 'created_at': r[3], 'user_id': r[4], 'username': r[5], 'display_name': r[6], 'avatar_url': r[7], 'is_verified': r[8], 'likes_count': r[9], 'comments_count': r[10], 'liked': liked})
            return resp(200, {'posts': posts})

        if path == '/posts' and method == 'POST':
            user = get_user_by_token(conn, token)
            if not user:
                return resp(401, {'error': 'Не авторизован'})
            content = (body.get('content') or '').strip()
            image_url = body.get('image_url') or ''
            if not content and not image_url:
                return resp(400, {'error': 'Напишите что-нибудь'})
            post_id = str(uuid.uuid4())
            cur.execute("INSERT INTO posts (id, user_id, content, image_url) VALUES ('%s','%s','%s','%s')" % (post_id, user['id'], content.replace("'","''"), image_url.replace("'","''")))
            conn.commit()
            return resp(200, {'id': post_id})

        # === LIKES ===
        if path == '/likes' and method == 'POST':
            user = get_user_by_token(conn, token)
            if not user:
                return resp(401, {'error': 'Не авторизован'})
            post_id = body.get('post_id')
            if not post_id:
                return resp(400, {'error': 'post_id обязателен'})
            cur.execute("SELECT id FROM likes WHERE post_id = '%s' AND user_id = '%s'" % (post_id.replace("'","''"), user['id']))
            existing = cur.fetchone()
            if existing:
                cur.execute("UPDATE likes SET created_at = NULL WHERE id = '%s'" % existing[0])
                cur.execute("SELECT COUNT(*) FROM likes WHERE post_id = '%s' AND created_at IS NOT NULL" % post_id.replace("'","''"))
                cnt = cur.fetchone()[0]
                conn.commit()
                return resp(200, {'liked': False, 'count': cnt})
            else:
                like_id = str(uuid.uuid4())
                cur.execute("INSERT INTO likes (id, post_id, user_id) VALUES ('%s','%s','%s')" % (like_id, post_id.replace("'","''"), user['id']))
                cur.execute("SELECT user_id FROM posts WHERE id = '%s'" % post_id.replace("'","''"))
                post_owner = cur.fetchone()
                if post_owner and post_owner[0] != user['id']:
                    n_id = str(uuid.uuid4())
                    cur.execute("INSERT INTO notifications (id, user_id, type, from_user_id, post_id, message) VALUES ('%s','%s','like','%s','%s','%s')" % (n_id, post_owner[0], user['id'], post_id.replace("'","''"), '%s лайкнул ваш пост' % user['display_name'].replace("'","''")))
                cur.execute("SELECT COUNT(*) FROM likes WHERE post_id = '%s' AND created_at IS NOT NULL" % post_id.replace("'","''"))
                cnt = cur.fetchone()[0]
                conn.commit()
                return resp(200, {'liked': True, 'count': cnt})

        # === COMMENTS ===
        if path == '/comments' and method == 'GET':
            post_id = qs.get('post_id')
            if not post_id:
                return resp(400, {'error': 'post_id обязателен'})
            cur.execute("SELECT c.id, c.content, c.created_at, c.parent_id, c.user_id, u.username, u.display_name, u.avatar_url, u.is_verified FROM comments c JOIN users u ON u.id = c.user_id WHERE c.post_id = '%s' ORDER BY c.created_at ASC" % post_id.replace("'","''"))
            rows = cur.fetchall()
            comments = [{'id': r[0], 'content': r[1], 'created_at': r[2], 'parent_id': r[3], 'user_id': r[4], 'username': r[5], 'display_name': r[6], 'avatar_url': r[7], 'is_verified': r[8]} for r in rows]
            return resp(200, {'comments': comments})

        if path == '/comments' and method == 'POST':
            user = get_user_by_token(conn, token)
            if not user:
                return resp(401, {'error': 'Не авторизован'})
            post_id = body.get('post_id')
            content = (body.get('content') or '').strip()
            parent_id = body.get('parent_id')
            if not post_id or not content:
                return resp(400, {'error': 'Заполните все поля'})
            c_id = str(uuid.uuid4())
            if parent_id:
                cur.execute("INSERT INTO comments (id, post_id, user_id, content, parent_id) VALUES ('%s','%s','%s','%s','%s')" % (c_id, post_id.replace("'","''"), user['id'], content.replace("'","''"), parent_id.replace("'","''")))
            else:
                cur.execute("INSERT INTO comments (id, post_id, user_id, content) VALUES ('%s','%s','%s','%s')" % (c_id, post_id.replace("'","''"), user['id'], content.replace("'","''")))
            cur.execute("SELECT user_id FROM posts WHERE id = '%s'" % post_id.replace("'","''"))
            post_owner = cur.fetchone()
            if post_owner and post_owner[0] != user['id']:
                n_id = str(uuid.uuid4())
                cur.execute("INSERT INTO notifications (id, user_id, type, from_user_id, post_id, comment_id, message) VALUES ('%s','%s','comment','%s','%s','%s','%s')" % (n_id, post_owner[0], user['id'], post_id.replace("'","''"), c_id, '%s прокомментировал ваш пост' % user['display_name'].replace("'","''")))
            conn.commit()
            return resp(200, {'id': c_id})

        # === PROFILE ===
        if path == '/profile' and method == 'GET':
            username = qs.get('username')
            if not username:
                return resp(400, {'error': 'username обязателен'})
            cur.execute("SELECT id, username, display_name, bio, avatar_url, is_private, is_verified, is_admin, created_at FROM users WHERE username = '%s'" % username.replace("'","''"))
            row = cur.fetchone()
            if not row:
                return resp(404, {'error': 'Пользователь не найден'})
            profile = {'id': row[0], 'username': row[1], 'display_name': row[2], 'bio': row[3], 'avatar_url': row[4], 'is_private': row[5], 'is_verified': row[6], 'is_admin': row[7], 'created_at': row[8]}
            viewer = get_user_by_token(conn, token)
            is_own = viewer and viewer['id'] == row[0]
            if row[5] and not is_own:
                return resp(200, {'profile': profile, 'posts': [], 'is_private_hidden': True})
            cur.execute("SELECT p.id, p.content, p.image_url, p.created_at, (SELECT COUNT(*) FROM likes WHERE post_id = p.id), (SELECT COUNT(*) FROM comments WHERE post_id = p.id) FROM posts p WHERE p.user_id = '%s' ORDER BY p.created_at DESC LIMIT 50" % row[0])
            posts = []
            for pr in cur.fetchall():
                liked = False
                if viewer:
                    cur.execute("SELECT id FROM likes WHERE post_id = '%s' AND user_id = '%s'" % (pr[0], viewer['id']))
                    liked = cur.fetchone() is not None
                posts.append({'id': pr[0], 'content': pr[1], 'image_url': pr[2], 'created_at': pr[3], 'likes_count': pr[4], 'comments_count': pr[5], 'liked': liked, 'user_id': row[0], 'username': row[1], 'display_name': row[2], 'avatar_url': row[4], 'is_verified': row[6]})
            cur.execute("SELECT COUNT(*) FROM posts WHERE user_id = '%s'" % row[0])
            profile['posts_count'] = cur.fetchone()[0]
            return resp(200, {'profile': profile, 'posts': posts})

        if path == '/profile/update' and method == 'POST':
            user = get_user_by_token(conn, token)
            if not user:
                return resp(401, {'error': 'Не авторизован'})
            display_name = body.get('display_name')
            bio = body.get('bio')
            is_private = body.get('is_private')
            avatar_url = body.get('avatar_url')
            updates = []
            if display_name is not None:
                updates.append("display_name = '%s'" % str(display_name).replace("'","''"))
            if bio is not None:
                updates.append("bio = '%s'" % str(bio).replace("'","''"))
            if is_private is not None:
                updates.append("is_private = %s" % ('true' if is_private else 'false'))
            if avatar_url is not None:
                updates.append("avatar_url = '%s'" % str(avatar_url).replace("'","''"))
            if updates:
                cur.execute("UPDATE users SET %s WHERE id = '%s'" % (', '.join(updates), user['id']))
                conn.commit()
            return resp(200, {'ok': True})

        # === SEARCH ===
        if path == '/search' and method == 'GET':
            q = (qs.get('q') or '').strip()
            if not q:
                return resp(200, {'users': []})
            cur.execute("SELECT id, username, display_name, avatar_url, is_verified, is_admin FROM users WHERE username ILIKE '%%%s%%' OR display_name ILIKE '%%%s%%' LIMIT 20" % (q.replace("'","''"), q.replace("'","''")))
            rows = cur.fetchall()
            users = [{'id': r[0], 'username': r[1], 'display_name': r[2], 'avatar_url': r[3], 'is_verified': r[4], 'is_admin': r[5]} for r in rows]
            return resp(200, {'users': users})

        # === VERIFICATION ===
        if path == '/verification/request' and method == 'POST':
            user = get_user_by_token(conn, token)
            if not user:
                return resp(401, {'error': 'Не авторизован'})
            reason = (body.get('reason') or '').strip()
            if not reason:
                return resp(400, {'error': 'Укажите причину'})
            cur.execute("SELECT id FROM verification_requests WHERE user_id = '%s' AND status = 'pending'" % user['id'])
            if cur.fetchone():
                return resp(400, {'error': 'Заявка уже подана'})
            vr_id = str(uuid.uuid4())
            cur.execute("INSERT INTO verification_requests (id, user_id, reason) VALUES ('%s','%s','%s')" % (vr_id, user['id'], reason.replace("'","''")))
            conn.commit()
            return resp(200, {'id': vr_id})

        if path == '/verification/list' and method == 'GET':
            user = get_user_by_token(conn, token)
            if not user or not user.get('is_admin'):
                return resp(403, {'error': 'Доступ запрещен'})
            cur.execute("SELECT vr.id, vr.reason, vr.status, vr.created_at, u.id, u.username, u.display_name, u.avatar_url FROM verification_requests vr JOIN users u ON u.id = vr.user_id WHERE vr.status = 'pending' ORDER BY vr.created_at ASC")
            rows = cur.fetchall()
            reqs = [{'id': r[0], 'reason': r[1], 'status': r[2], 'created_at': r[3], 'user_id': r[4], 'username': r[5], 'display_name': r[6], 'avatar_url': r[7]} for r in rows]
            return resp(200, {'requests': reqs})

        if path == '/verification/review' and method == 'POST':
            user = get_user_by_token(conn, token)
            if not user or not user.get('is_admin'):
                return resp(403, {'error': 'Доступ запрещен'})
            req_id = body.get('request_id')
            action = body.get('action')
            if not req_id or action not in ('approve', 'reject'):
                return resp(400, {'error': 'Неверные параметры'})
            cur.execute("SELECT user_id FROM verification_requests WHERE id = '%s' AND status = 'pending'" % req_id.replace("'","''"))
            row = cur.fetchone()
            if not row:
                return resp(404, {'error': 'Заявка не найдена'})
            status = 'approved' if action == 'approve' else 'rejected'
            cur.execute("UPDATE verification_requests SET status = '%s', reviewed_by = '%s', reviewed_at = NOW() WHERE id = '%s'" % (status, user['id'], req_id.replace("'","''")))
            if action == 'approve':
                cur.execute("UPDATE users SET is_verified = true WHERE id = '%s'" % row[0])
            n_id = str(uuid.uuid4())
            msg = 'Ваша заявка на верификацию одобрена!' if action == 'approve' else 'Ваша заявка на верификацию отклонена'
            cur.execute("INSERT INTO notifications (id, user_id, type, from_user_id, message) VALUES ('%s','%s','verification','%s','%s')" % (n_id, row[0], user['id'], msg))
            conn.commit()
            return resp(200, {'ok': True})

        # === NOTIFICATIONS ===
        if path == '/notifications' and method == 'GET':
            user = get_user_by_token(conn, token)
            if not user:
                return resp(401, {'error': 'Не авторизован'})
            cur.execute("SELECT n.id, n.type, n.message, n.is_read, n.created_at, n.post_id, n.comment_id, COALESCE(u.username,''), COALESCE(u.display_name,''), COALESCE(u.avatar_url,''), COALESCE(u.is_verified, false) FROM notifications n LEFT JOIN users u ON u.id = n.from_user_id WHERE n.user_id = '%s' ORDER BY n.created_at DESC LIMIT 50" % user['id'])
            rows = cur.fetchall()
            notifs = [{'id': r[0], 'type': r[1], 'message': r[2], 'is_read': r[3], 'created_at': r[4], 'post_id': r[5], 'comment_id': r[6], 'from_username': r[7], 'from_display_name': r[8], 'from_avatar_url': r[9], 'from_is_verified': r[10]} for r in rows]
            return resp(200, {'notifications': notifs})

        if path == '/notifications/read' and method == 'POST':
            user = get_user_by_token(conn, token)
            if not user:
                return resp(401, {'error': 'Не авторизован'})
            cur.execute("UPDATE notifications SET is_read = true WHERE user_id = '%s'" % user['id'])
            conn.commit()
            return resp(200, {'ok': True})

        if path == '/upload/avatar' and method == 'POST':
            user = get_user_by_token(conn, token)
            if not user:
                return resp(401, {'error': 'Не авторизован'})
            import boto3
            image_data = body.get('image')
            if not image_data:
                return resp(400, {'error': 'Нет изображения'})
            img_bytes = base64.b64decode(image_data.split(',')[-1] if ',' in image_data else image_data)
            key = 'avatars/%s.jpg' % user['id']
            s3 = boto3.client('s3', endpoint_url='https://bucket.poehali.dev', aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'], aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'])
            s3.put_object(Bucket='files', Key=key, Body=img_bytes, ContentType='image/jpeg')
            cdn_url = 'https://cdn.poehali.dev/projects/%s/bucket/%s' % (os.environ['AWS_ACCESS_KEY_ID'], key)
            cur.execute("UPDATE users SET avatar_url = '%s' WHERE id = '%s'" % (cdn_url.replace("'","''"), user['id']))
            conn.commit()
            return resp(200, {'url': cdn_url})

        if path == '/upload/image' and method == 'POST':
            user = get_user_by_token(conn, token)
            if not user:
                return resp(401, {'error': 'Не авторизован'})
            import boto3
            image_data = body.get('image')
            if not image_data:
                return resp(400, {'error': 'Нет изображения'})
            img_bytes = base64.b64decode(image_data.split(',')[-1] if ',' in image_data else image_data)
            fname = str(uuid.uuid4())
            key = 'posts/%s.jpg' % fname
            s3 = boto3.client('s3', endpoint_url='https://bucket.poehali.dev', aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'], aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'])
            s3.put_object(Bucket='files', Key=key, Body=img_bytes, ContentType='image/jpeg')
            cdn_url = 'https://cdn.poehali.dev/projects/%s/bucket/%s' % (os.environ['AWS_ACCESS_KEY_ID'], key)
            return resp(200, {'url': cdn_url})

        return resp(404, {'error': 'Маршрут не найден'})
    except Exception as e:
        conn.rollback()
        return resp(500, {'error': str(e)})
    finally:
        conn.close()