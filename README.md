<div align="center">🏎️ Garage.OSAdvanced Die-Cast Collection Tracker<p align="center"><b>The ultimate futuristic dashboard for managing your Mini GT and premium die-cast collection.</b><br />Garage.OS combines a stunning, high-tech React frontend with a powerful Python-based scraping engine to automate the tedious task of cataloging your collection.<br /><br /><a href="#-key-features">Key Features</a> •<a href="#-tech-stack">Tech Stack</a> •<a href="#-getting-started">Getting Started</a> •<a href="#-how-to-use">How To Use</a></p></div>✨ Key FeaturesFeatureDescription🤖 Auto-Fetch IntelligenceEnter a simple model number (e.g., 844) and the Python backend automatically scrapes official data and images using a headless browser.💎 Premium UI/UXFeatures a "Glassmorphism" design, 3D tilt-effect cards, and smooth animations powered by Tailwind CSS.☁️ Cloud SyncFully integrated with Firebase Firestore to keep your collection safe and accessible across devices.🔐 Secure AuthSupports Google Sign-In and Anonymous Guest access.📊 Financial AnalyticsTracks purchase price vs. current value, calculating real-time portfolio appreciation.📱 Fully ResponsiveLooks amazing on desktop control centers and mobile devices.🛠️ Tech Stack<div align="center">Frontend (The Dashboard)Backend (The Engine)⚛️ React + ViteBlazing fast UI framework.🐍 Python 3Core logic and scripting.🎨 Tailwind CSSFor the futuristic styling.🌶️ FlaskREST API server.🔥 FirebaseAuth & Firestore Database.🕷️ Selenium & BS4Robust web scraping.✨ Lucide ReactBeautiful, crisp icons.🗄️ SQLiteLocal caching of scraped data.</div>🚀 Getting StartedFollow these instructions to get your Garage running locally.PrerequisitesNode.js & npm installed.Python 3.x installed.Google Chrome browser installed.Chromedriver: Download here (Match your Chrome version).1. 📥 Clone the Repositorygit clone [https://github.com/yourusername/diecast-tracker.git](https://github.com/yourusername/diecast-tracker.git)
cd diecast-tracker
2. 🐍 Backend Setup (The Scraper)The backend handles the heavy lifting of fetching data from manufacturer websites.Navigate to the backend folder:cd backend
Install required Python packages:pip install flask flask-cors selenium beautifulsoup4 requests
Crucial Step: Place your downloaded chromedriver.exe file inside the backend/ folder.Start the Python API Server:python api_server.py
✅ You should see: Running on http://127.0.0.1:50003. ⚛️ Frontend Setup (The UI)Open a new terminal and navigate to the frontend folder:cd frontend
Install dependencies:npm install
Configure Environment Variables:Create a .env file in the frontend/ folder:VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
Start the React Development Server:npm run dev
✅ Open the link shown (usually http://localhost:5173) in your browser.🎮 How to UseLogin: Choose "Sign in with Google" for permanent storage or "Guest" for a quick look.Add Model:Navigate to the Add Model tab.Enter a Mini GT model number (e.g., 1059).Click Fetch. Watch the backend do the magic! 🪄Fill in your price and condition, then click Secure Asset.View Garage: Switch to the Collection tab to see your 3D cards. Hover over them to see the tilt effect!📂 Project Structurediecast-tracker/
├── backend/               # Python Flask API
│   ├── api_server.py      # API Endpoints
│   ├── mini_gt_scraper.py # Scraping Logic
│   ├── chromedriver.exe   # Driver (Ignored in git)
│   └── images/            # Downloaded images cache
└── frontend/              # React Application
    ├── src/
    │   ├── App.jsx        # Main UI Component
    │   └── global.css     # Tailwind imports
    └── .env               # Firebase Secrets (Ignored in git)
🤝 ContributingContributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are greatly appreciated.Fork the ProjectCreate your Feature Branch (git checkout -b feature/AmazingFeature)Commit your Changes (git commit -m 'Add some AmazingFeature')Push to the Branch (git push origin feature/AmazingFeature)Open a Pull Request📄 LicenseDistributed under the MIT License. See LICENSE for more information.<div align="center"><p>Built with ❤️ for the Die-Cast Community</p><img src="https://www.google.com/search?q=https://img.shields.io/badge/Made%2520with-React-61DAFB%3Fstyle%3Dflat-square%26logo%3Dreact%26logoColor%3Dblack" /><img src="https://www.google.com/search?q=https://img.shields.io/badge/Made%2520with-Python-3776AB%3Fstyle%3Dflat-square%26logo%3Dpython%26logoColor%3Dwhite" /></div>
