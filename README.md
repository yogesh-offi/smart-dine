# Smart Dine 🍽️

A Hybrid Context-Aware Food and Restaurant Recommendation System
using Machine Learning, Sentiment Analysis, and Health-Aware Personalization.

## Tech Stack
- Frontend: React.js
- Backend: Node.js, Express
- Database: MongoDB
- ML: Python, Scikit-learn
- LLM: Google Gemini API

## Team Members
- Sibiarasu A B
- Venuprasath T
- Yashwanth S
- Yogesh S

## Installation & Setup

### Prerequisites
- Node.js (v20.15.0)
- Python (v3.11.9)
- MongoDB (local or cloud)
- Git

### 1. Clone Repository
```bash
git clone <repository-url>
cd SmartDine
```

### 2. Backend Setup
```bash
cd backend
npm install
```

**Create `.env` file in backend folder:**
```env
MONGO_URI=mongodb://localhost:27017/smartdine
JWT_SECRET=your_jwt_secret_key
GEMINI_API_KEY=your_gemini_api_key
PORT=5000
```

### 3. Frontend Setup
```bash
cd frontend/SmartDine
npm install
```

### 4. Python ML Setup
```bash
cd ml
python -m venv venv
venv\Scripts\activate
pip install pandas pymongo python-dotenv scikit-learn numpy matplotlib seaborn
```

**Required Python packages:**
- pandas
- pymongo
- python-dotenv
- scikit-learn
- numpy
- matplotlib
- seaborn

### 5. Database Setup
1. Start MongoDB service
2. Run data ingestion scripts:
```bash
cd backend
node scripts/ingestData.js
```

## Running the Application

### Start Backend Server
```bash
cd backend
npm run dev
```
Server runs on: http://localhost:5000

### Start Frontend
```bash
cd frontend/SmartDine
npm run dev
```
App runs on: http://localhost:5173

### Run ML Scripts (Optional)
```bash
cd ml
venv\Scripts\activate
python hybrid_recommender.py
```

## API Endpoints
- `/api/auth` - Authentication
- `/api/restaurants` - Restaurant data
- `/api/menu` - Menu items
- `/api/dashboard` - ML recommendations
- `/api/profile` - User profiles

## Features
- 🤖 AI-powered food recommendations
- 📍 Location-based restaurant suggestions
- 🍎 Health-aware meal planning
- 📊 Calorie tracking dashboard
- 🔍 Smart food scanner
- 💬 Interactive chat interface