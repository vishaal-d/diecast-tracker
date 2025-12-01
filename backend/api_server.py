from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import sqlite3

# Import your scraper logic and configuration
from mini_gt_scraper import fetch_and_download_image, setup_environment, DB_NAME, IMAGE_DIR

app = Flask(__name__)
CORS(app) # Enable Cross-Origin Resource Sharing for React

# --- PATH CONFIGURATION (Matches Scraper) ---
# Ensure we look for the DB in the same folder as this script, 
# regardless of where you run the command from.
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, DB_NAME)
ABS_IMAGE_DIR = os.path.join(BASE_DIR, IMAGE_DIR)

# Run setup once when the server starts to ensure DB/folders exist
setup_environment()

@app.route('/api/fetch_model/<model_number>', methods=['GET'])
def fetch_model_data(model_number):
    print(f"Received request to fetch model: {model_number}")
    
    # 1. Trigger the scraping process (This saves name/image to the DB)
    image_path = fetch_and_download_image(model_number)
    
    if image_path:
        # 2. Retrieve the model name/details from the SQLite DB
        # We use the ROBUST DB_PATH here to ensure we read the correct file
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT model_name FROM mini_gt WHERE model_number = ?", (model_number,))
        result = cursor.fetchone()
        conn.close()
        
        # If scraper worked but DB read failed, provide a fallback
        model_name = result[0] if result else f"Mini GT {model_number}"
        
        # 3. Return the data to React
        # We serve the image via a local URL provided by this Flask server
        image_url = f"http://localhost:5000/images/{model_number}.jpg"
        
        return jsonify({
            "modelName": model_name,
            "imageUrl": image_url
        })
    else:
        return jsonify({"error": f"Model {model_number} could not be scraped."}), 404

# Serve the downloaded images so React can display them
@app.route('/images/<path:filename>')
def serve_image(filename):
    # We serve from the absolute image path to be safe
    return send_from_directory(ABS_IMAGE_DIR, filename)

if __name__ == '__main__':
    print("Starting Python API Server on port 5000...")
    app.run(debug=True, port=5000)