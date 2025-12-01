import sqlite3
import os
import requests
from bs4 import BeautifulSoup
import re 
from typing import Optional
import time 

# --- Selenium Imports ---
from selenium import webdriver
from selenium.webdriver.chrome.service import Service as ChromeService
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import WebDriverException

# --- Configuration ---
DB_NAME = 'diecast_collection.db'
IMAGE_DIR = 'images/mini_gt'
SEARCH_URL_TEMPLATE = 'https://minigt.tsm-models.com/index.php?action=product-search&keywords='
BASE_DOMAIN = 'https://minigt.tsm-models.com/' 

# *** FIX: DYNAMIC ABSOLUTE PATH ***
# This ensures it finds the driver even if you run the script from a different folder.
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CHROME_DRIVER_PATH = os.path.join(BASE_DIR, 'chromedriver.exe')


# --- 1. Environment Setup ---

def setup_environment():
    """Sets up the image directory and the SQLite database table."""
    
    # Ensure image directory is relative to this script, not the terminal location
    abs_image_dir = os.path.join(BASE_DIR, IMAGE_DIR)
    os.makedirs(abs_image_dir, exist_ok=True)
    
    db_path = os.path.join(BASE_DIR, DB_NAME)
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS mini_gt (
            model_number TEXT PRIMARY KEY,
            model_name TEXT,
            release_type TEXT,
            purchase_price REAL,
            image_path TEXT,
            notes TEXT
        )
    ''')
    conn.commit()
    conn.close()
    print(f"Environment setup complete. DB: {db_path}")


# --- 2. Headless Browser (Selenium) Fetching ---

def get_page_content(url: str) -> Optional[str]:
    """Uses Selenium to execute JavaScript and return the fully rendered HTML."""
    
    chrome_options = Options()
    # Run in headless mode (invisible)
    chrome_options.add_argument("--headless") 
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--window-size=1920,1080")
    chrome_options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
    
    driver = None
    try:
        service = ChromeService(executable_path=CHROME_DRIVER_PATH)
        driver = webdriver.Chrome(service=service, options=chrome_options)
        
        print(f"Loading page via Chrome (Headless): {url}")
        driver.get(url)
        
        time.sleep(5) 
        
        rendered_html = driver.page_source
        return rendered_html
        
    except WebDriverException as e:
        print("\n--- CRITICAL SELENIUM ERROR ---")
        print(f"Could not initialize Chrome driver at: {CHROME_DRIVER_PATH}")
        print(f"Error Details: {e}")
        print("-----------------------------\n")
        return None
        
    finally:
        if driver:
            driver.quit() 


# --- 3. URL Finder (Uses Direct Search URL) ---

def find_product_page_url(model_number: str) -> Optional[str]:
    """
    Finds the product detail URL by navigating directly to the search results page.
    """
    
    search_url = SEARCH_URL_TEMPLATE + model_number
    
    # Fetch content using Selenium
    rendered_content = get_page_content(search_url)
    
    if not rendered_content:
        return None
        
    print(f"Searching rendered HTML for product link...")
    soup = BeautifulSoup(rendered_content, 'html.parser')

    # Find the link that points to the single product detail page on the results screen.
    final_product_link = soup.find('a', href=re.compile(r'action=product-detail&'))
    
    if final_product_link and final_product_link.get('href'):
        
        relative_url = final_product_link.get('href')
        
        # URL Construction is safe due to BASE_DOMAIN trailing slash
        full_url = BASE_DOMAIN + relative_url.lstrip('/')
        
        # Attempt to get product name for better output
        image_tag = final_product_link.find('img')
        product_name = image_tag.get('alt', f'Product {model_number}') if image_tag else f'Product {model_number}'
        
        print(f"✅ FOUND MATCH: '{product_name}'. Link ID: {full_url.split('=')[-1]}")
        return full_url
        
    print(f"Search was successful, but could not locate a link pointing to a product detail page.")
    return None


# --- 4. Image Downloader & Data Saver ---

def fetch_and_download_image(model_number: str) -> Optional[str]:
    """
    Downloads the image AND extracts the model name, saving both to the DB.
    """
    product_url = find_product_page_url(model_number)
    if not product_url:
        return None

    # Save absolute path for image
    abs_image_dir = os.path.join(BASE_DIR, IMAGE_DIR)
    local_image_path = os.path.join(abs_image_dir, f"{model_number}.jpg")
    
    # We continue even if image exists, to ensure we scrape the name if missing.
    # if os.path.exists(local_image_path):
    #     print(f"Image for {model_number} already exists.")
    #     return local_image_path

    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        response = requests.get(product_url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')

        # --- 4a. TARGET IMAGE BY LONGEST SRC ATTRIBUTE ---
        all_images = soup.find_all('img')
        product_image_tag = None
        longest_src = 0
        
        for img in all_images:
            src = img.get('src', '')
            if len(src) > longest_src and not src.endswith(('.svg', '.png', '.gif')):
                longest_src = len(src)
                product_image_tag = img

        if not product_image_tag:
            print(f"Image tag not found using longest SRC heuristic.")
            return None

        # --- 4b. EXTRACT MODEL NAME FROM IMAGE ALT TEXT (Prioritized) ---
        model_name = f"Mini GT {model_number}" # Default fallback
        
        # Try to get the name from the image's alt text first (Most reliable)
        alt_text = product_image_tag.get('alt', '').strip()
        if alt_text and len(alt_text) > 5:
            model_name = alt_text
            print(f"Extracted Model Name from Image Alt: {model_name}")
        else:
            # Fallback: Find the longest header text if alt text is missing
            candidates = soup.find_all(['h1', 'h2', 'h3', 'h4'])
            longest_text = ""
            ignored_terms = ["About Us", "Products", "News", "Distributions", "Contact", "Home", "Search", "Welcome", "Brands"]
            
            for tag in candidates:
                text = tag.get_text(strip=True)
                if len(text) > len(longest_text) and len(text) > 10:
                    if not any(term.lower() == text.lower() for term in ignored_terms):
                        longest_text = text
            
            if longest_text:
                model_name = longest_text
                print(f"Extracted Model Name from Header: {model_name}")

        remote_image_url = product_image_tag.get('src')
        
        if remote_image_url.startswith('/'):
            remote_image_url = BASE_DOMAIN + remote_image_url.lstrip('/')
        elif not remote_image_url.startswith('http'):
            remote_image_url = BASE_DOMAIN + remote_image_url
            
        print(f"Downloading image from: {remote_image_url}")

        img_data = requests.get(remote_image_url, timeout=10).content
        with open(local_image_path, 'wb') as handler:
            handler.write(img_data)
            
        print(f"Image downloaded successfully to {local_image_path}")

        # --- 4c. SAVE DATA TO DB IMMEDIATELY ---
        # This ensures the API server picks up the name we just scraped.
        db_path = os.path.join(BASE_DIR, DB_NAME)
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if record exists
        cursor.execute("SELECT model_number FROM mini_gt WHERE model_number = ?", (model_number,))
        data = cursor.fetchone()
        
        if data:
            # Update existing record with new name/image
            cursor.execute('''
                UPDATE mini_gt 
                SET model_name = ?, image_path = ?
                WHERE model_number = ?
            ''', (model_name, local_image_path, model_number))
        else:
            # Insert new record
            cursor.execute('''
                INSERT INTO mini_gt (model_number, model_name, image_path)
                VALUES (?, ?, ?)
            ''', (model_number, model_name, local_image_path))
            
        conn.commit()
        conn.close()
        print(f"Database updated for {model_number}")

        return local_image_path

    except requests.exceptions.RequestException as e:
        print(f"Error fetching image content for {model_number}: {e}")
        return None


# --- 5. Database Integration (Legacy/Manual usage) ---

def add_mini_gt_model(model_number: str, model_name: str, release_type: str, purchase_price: float, notes: str=""):
    image_path = fetch_and_download_image(model_number)
    # The scraping function now handles the DB update for name/image.
    # This function can be used to update the other fields (price, notes) later if needed.
    
    if image_path is None:
        print(f"Skipping database entry for {model_number} due to image failure.")
        return

if __name__ == '__main__':
    setup_environment() 
    print("Scraper module loaded.")