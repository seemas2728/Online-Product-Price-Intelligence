from flask import Flask, request, jsonify, send_from_directory
import sqlite3
from werkzeug.security import generate_password_hash, check_password_hash
import os
from werkzeug.utils import secure_filename

# Import modules from local files
from model import predict_image
from scrapers.ebay_api import search_ebay
from scrapers.walmart_scraper import scrape_walmart

app = Flask(__name__, static_folder='../frontend', static_url_path='/')

DB_PATH = 'database.db'
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    # Users Table
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )
    ''')
    
    # Milestone 2 Tables
    c.execute('''
        CREATE TABLE IF NOT EXISTS Products (
            product_id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category TEXT,
            image_url TEXT
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS Prices (
            price_id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER,
            store_name TEXT,
            price REAL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            product_url TEXT,
            FOREIGN KEY(product_id) REFERENCES Products(product_id)
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS SearchHistory (
            search_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            query TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

init_db()

@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'login.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(app.static_folder, path)

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not all([username, email, password]):
        return jsonify({'message': 'All fields are required'}), 400

    hashed_password = generate_password_hash(password)

    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
                  (username, email, hashed_password))
        conn.commit()
    except sqlite3.IntegrityError:
        return jsonify({'message': 'Email already exists'}), 409
    except Exception as e:
        return jsonify({'message': 'Registration failed'}), 500
    finally:
        if 'conn' in locals() and conn:
            conn.close()

    return jsonify({'message': 'Registration successful'}), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'message': 'Email and password are required'}), 400

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('SELECT * FROM users WHERE email = ?', (email,))
    user = c.fetchone()
    conn.close()

    if user and check_password_hash(user[3], password):
        return jsonify({'message': 'Login successful', 'username': user[1]}), 200
    else:
        return jsonify({'message': 'Invalid email or password'}), 401

@app.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json()
    email = data.get('email')
    new_password = data.get('new_password')

    if not email or not new_password:
        return jsonify({'message': 'Email and new password are required'}), 400

    hashed_password = generate_password_hash(new_password)

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('UPDATE users SET password = ? WHERE email = ?', (hashed_password, email))
    updated = c.rowcount
    conn.commit()
    conn.close()

    if updated:
        return jsonify({'message': 'Password updated successfully'}), 200
    else:
        return jsonify({'message': 'Email not found'}), 404

# --- MILESTONE 2: PRICE SCRAPING ---

@app.route('/api/upload-image', methods=['POST'])
def upload_image():
    if 'image' not in request.files:
        return jsonify({'message': 'No image provided'}), 400
        
    file = request.files['image']
    if file.filename == '':
        return jsonify({'message': 'No selected file'}), 400
        
    filename = secure_filename(file.filename)
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)
    
    # Process image prediction
    try:
        prediction = predict_image(filepath)
    except Exception as e:
        print(e)
        return jsonify({'message': 'Image processing failed'}), 500
        
    # Optional: Log search history here to Database
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('INSERT INTO SearchHistory (user_id, query) VALUES (?, ?)', (None, prediction['product']))
        conn.commit()
        conn.close()
    except Exception as e:
        print("DB update error:", e)

    return jsonify(prediction), 200

def compare_prices(product_name):
    try:
        ebay_data = search_ebay(product_name)
    except Exception:
        ebay_data = []
        
    try:
        walmart_data = scrape_walmart(product_name)
    except Exception:
        walmart_data = []

    combined_results = ebay_data + walmart_data

    formatted_results = []
    prices = []
    
    for item in combined_results:
        try:
            price_val = float(str(item['price']).replace('$', '').replace(',', '').strip())
        except ValueError:
            continue
            
        prices.append(price_val)
        
        formatted_results.append({
            "product_name": item.get('product_name', ''),
            "price": f"{price_val:.2f}",
            "store": item.get('store', ''),
            "product_url": item.get('product_url', ''),
            "image": item.get('image', '')
        })

    if not formatted_results:
        return {
            "product": product_name,
            "results": [],
            "summary": {"lowest_price": "0.00", "highest_price": "0.00", "average_price": "0.00"}
        }

    lowest_price = min(prices)
    highest_price = max(prices)
    average_price = sum(prices) / len(prices)

    summary = {
        "lowest_price": f"{lowest_price:.2f}",
        "highest_price": f"{highest_price:.2f}",
        "average_price": f"{average_price:.2f}"
    }

    # Store findings in DB Products and Prices tables
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('INSERT INTO Products (name, category, image_url) VALUES (?, ?, ?)', 
                  (product_name, 'Unknown', ''))
        product_id = c.lastrowid
        
        for item in formatted_results:
            c.execute('''
                INSERT INTO Prices (product_id, store_name, price, product_url) 
                VALUES (?, ?, ?, ?)
            ''', (product_id, item['store'], float(item['price']), item['product_url']))
            
        conn.commit()
        conn.close()
    except Exception as e:
        print("DB Insert Error for Prices/Products:", e)

    return {
        "product": product_name,
        "results": formatted_results,
        "summary": summary
    }

@app.route('/api/compare-prices', methods=['GET'])
def api_compare_prices():
    product_name = request.args.get('product')
    if not product_name:
        return jsonify({'message': 'Product name required'}), 400
        
    result_data = compare_prices(product_name)
    return jsonify(result_data), 200

if __name__ == '__main__':
    app.run(debug=True)