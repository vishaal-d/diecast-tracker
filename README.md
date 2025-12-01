---

# 🏎️ Garage.OS — Advanced Die-Cast Collection Tracker

**Garage.OS** is a next-generation web application built for serious die-cast collectors. It pairs a visually stunning **React dashboard** with a powerful **Python scraping engine** to automate the entire process of cataloging your collection.

Simply enter a model number (e.g., `889`) — and Garage.OS automatically fetches **official metadata**, **high-resolution images**, and **market information** for you.

---

## 🌟 Key Features

### 🤖 Auto-Fetch Intelligence

Enter any Mini GT model number and let the Python backend scrape official manufacturer data using a headless browser.

### 💎 Premium UI/UX

- Glassmorphism design
- 3D tilt-effect cards
- Smooth Tailwind animations

### ☁️ Cloud Sync

All data is stored securely using **Firebase Firestore**, synced across all your devices.

### 🔐 Secure Authentication

- Google Sign-In
- Anonymous guest mode

### 📊 Financial Analytics

Track purchase price, market value, and real-time **portfolio appreciation**.

### 📱 Fully Responsive

Optimized for desktop command centers, tablets, and mobile devices.

---

## 🛠️ Tech Stack

### **Frontend (Dashboard)**

- **React + Vite**
- **Tailwind CSS**
- **Firebase Firestore & Auth**
- **Lucide React** (icons)

### **Backend (Engine)**

- **Python 3**
- **Flask** API server
- **Selenium** + **BeautifulSoup4**
- **SQLite** (local caching)

---

# 🚀 Getting Started

Follow the instructions below to run Garage.OS locally.

---

## ✅ Prerequisites

Make sure you have installed:

- **Node.js & npm**
- **Python 3.x**
- **Google Chrome**
- **Chromedriver** matching your Chrome version
  _(Place inside the backend folder as described below)_

---

# 1. Clone the Repository

```bash
git clone https://github.com/yourusername/diecast-tracker.git
cd diecast-tracker
```

---

# 2. Backend Setup (Scraper Engine)

The backend handles scraping and metadata retrieval.

### Navigate to the backend folder:

```bash
cd backend
```

### Install Python dependencies:

```bash
pip install flask flask-cors selenium beautifulsoup4 requests
```

### ⚠️ Crucial Step

Place **chromedriver.exe** inside the `backend/` directory.

### Start the API server:

```bash
python api_server.py
```

You should see:

```
Running on http://127.0.0.1:5000
```

---

# 3. Frontend Setup (React UI)

### Open a new terminal and go to the frontend folder:

```bash
cd frontend
```

### Install dependencies:

```bash
npm install
```

### Configure environment variables:

Create a `.env` file inside the `frontend/` directory:

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Start the development server:

```bash
npm run dev
```

Open the link shown (usually):
👉 [http://localhost:5173](http://localhost:5173)

---

# 🎮 How to Use

### **1. Login**

Choose:

- **Google Sign-In** for synced storage
- **Guest mode** for quick testing

### **2. Add a Model**

1. Go to the **Add Model** tab
2. Enter a model number (e.g., `1059`)
3. Click **Fetch** — watch the AI scraper do its magic
4. Add your price, condition, and save your asset

### **3. View Your Garage**

Browse your entire collection via beautiful 3D cards.
Hover to enjoy the tilt-effects and animations.

---

# 📂 Project Structure

```
diecast-tracker/
├── backend/                 # Python Flask API
│   ├── api_server.py        # API endpoints
│   ├── mini_gt_scraper.py   # Scraper logic
│   ├── chromedriver.exe     # Chrome Driver (ignored in Git)
│   └── images/              # Saved image cache
└── frontend/                # React Application
    ├── src/
    │   ├── App.jsx          # Main UI
    │   └── global.css       # Tailwind CSS imports
    └── .env                 # Firebase credentials (ignored in Git)
```

---

# 🤝 Contributing

Contributions are welcome and appreciated!

1. **Fork** the project
2. **Create** your feature branch

   ```bash
   git checkout -b feature/AmazingFeature
   ```

3. **Commit** your changes

   ```bash
   git commit -m "Add some AmazingFeature"
   ```

4. **Push** to your branch

   ```bash
   git push origin feature/AmazingFeature
   ```

5. **Open a Pull Request**

---

**Built with ❤️ for the Die-Cast Community.**
