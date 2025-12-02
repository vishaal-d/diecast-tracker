from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import sqlite3
from dotenv import load_dotenv # Import dotenv to read .env file

# Import your scraper logic
from mini_gt_scraper import fetch_and_download_image, setup_environment, DB_NAME, IMAGE_DIR

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app) 

# --- CONFIGURATION ---
# Now reads from .env, falls back to localhost if missing
HOST_IP = os.getenv('HOST_IP', 'localhost')
PORT = int(os.getenv('PORT', 5000))

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, DB_NAME)
ABS_IMAGE_DIR = os.path.join(BASE_DIR, IMAGE_DIR)

setup_environment()

@app.route('/api/fetch_model/<model_number>', methods=['GET'])
def fetch_model_data(model_number):
    print(f"Received request to fetch model: {model_number}")
    
    image_path = fetch_and_download_image(model_number)
    
    if image_path:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT model_name FROM mini_gt WHERE model_number = ?", (model_number,))
        result = cursor.fetchone()
        conn.close()
        
        model_name = result[0] if result else f"Mini GT {model_number}"
        
        # Construct URL using the IP from .env
        image_url = f"http://{HOST_IP}:{PORT}/images/{model_number}.jpg"
        
        return jsonify({
            "modelName": model_name,
            "imageUrl": image_url
        })
    else:
        return jsonify({"error": f"Model {model_number} could not be scraped."}), 404

@app.route('/images/<path:filename>')
def serve_image(filename):
    return send_from_directory(ABS_IMAGE_DIR, filename)

if __name__ == '__main__':
    print(f"Starting Python API Server on {HOST_IP}:{PORT}...")
    # host='0.0.0.0' is required to make it accessible on the network
    app.run(debug=True, host='0.0.0.0', port=PORT)