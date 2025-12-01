🏎️ Garage.OS - Advanced Die-Cast Collection Tracker

The ultimate futuristic dashboard for managing your Mini GT and premium die-cast collection.

Garage.OS is a cutting-edge web application designed for serious die-cast collectors. It combines a stunning, high-tech React frontend with a powerful Python-based scraping engine to automate the tedious task of cataloging your collection. Simply enter a model number, and the system hunts down the official metadata and high-resolution imagery for you.

✨ Key Features

🤖 Auto-Fetch Intelligence: Enter a simple model number (e.g., 844) and the Python backend automatically scrapes official data and images using a headless browser.

💎 Premium UI/UX: Features a "Glassmorphism" design, 3D tilt-effect cards, and smooth animations powered by Tailwind CSS.

☁️ Cloud Sync: Fully integrated with Firebase Firestore to keep your collection safe and accessible across devices.

🔐 Secure Auth: Supports Google Sign-In and Anonymous Guest access.

📊 Financial Analytics: Tracks purchase price vs. current value, calculating real-time portfolio appreciation.

📱 Fully Responsive: Looks amazing on desktop control centers and mobile devices.

🛠️ Tech Stack

Frontend (The Dashboard)

⚛️ React + Vite - Blazing fast UI framework.

🎨 Tailwind CSS - For the futuristic styling.

🔥 Firebase - Authentication (Google/Anon) & Firestore Database.

✨ Lucide React - Beautiful, crisp icons.

Backend (The Engine)

🐍 Python 3 - Core logic.

🌶️ Flask - REST API server to communicate with the frontend.

🕷️ Selenium & BeautifulSoup4 - Robust web scraping & DOM parsing.

🗄️ SQLite - Local caching of scraped data.

🚀 Getting Started

Follow these instructions to get your Garage running locally.

Prerequisites

Node.js & npm installed.

Python 3.x installed.

Google Chrome browser installed.

Chromedriver: Download the version matching your Chrome browser from here.

1. 📥 Clone the Repository

git clone [https://github.com/yourusername/diecast-tracker.git](https://github.com/yourusername/diecast-tracker.git)
cd diecast-tracker

2. 🐍 Backend Setup (The Scraper)

The backend handles the heavy lifting of fetching data from manufacturer websites.

Navigate to the backend folder:

cd backend

Install required Python packages:

pip install flask flask-cors selenium beautifulsoup4 requests

Crucial Step: Place your downloaded chromedriver.exe file inside the backend/ folder.

Start the Python API Server:

python api_server.py

✅ You should see: Running on http://127.0.0.1:5000

3. ⚛️ Frontend Setup (The UI)

Open a new terminal and navigate to the frontend folder:

cd frontend

Install dependencies:

npm install

Configure Environment Variables:
Create a .env file in the frontend/ folder and add your Firebase credentials:

VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

Start the React Development Server:

npm run dev

✅ Open the link shown (usually http://localhost:5173) in your browser.

🎮 How to Use

Login: Choose "Sign in with Google" for permanent storage or "Guest" for a quick look.

Add Model:

Navigate to the Add Model tab.

Enter a Mini GT model number (e.g., 1059).

Click Fetch. Watch the backend do the magic! 🪄

Fill in your price and condition, then click Secure Asset.

View Garage: Switch to the Collection tab to see your 3D cards. Hover over them to see the tilt effect!

📂 Project Structure

diecast-tracker/
├── backend/ # Python Flask API
│ ├── api_server.py # API Endpoints
│ ├── mini_gt_scraper.py # Scraping Logic
│ ├── chromedriver.exe # Driver (Ignored in git)
│ └── images/ # Downloaded images cache
└── frontend/ # React Application
├── src/
│ ├── App.jsx # Main UI Component
│ └── global.css # Tailwind imports
└── .env # Firebase Secrets (Ignored in git)

🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are greatly appreciated.

Fork the Project

Create your Feature Branch (git checkout -b feature/AmazingFeature)

Commit your Changes (git commit -m 'Add some AmazingFeature')

Push to the Branch (git push origin feature/AmazingFeature)

Open a Pull Request

<p align="center">
Built with ❤️ for the Die-Cast Community
</p>
