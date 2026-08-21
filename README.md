# 🎓 Apex AI Study Planner (Python Web Application)

A smart, full-featured **AI Study Planner** web application that creates customized, science-backed study schedules based on subjects, exam deadlines, topic weights, confidence ratings, and available daily hours.

---

## 🌟 Core Features

- 🧠 **Python AI Scheduling Optimizer**:
  - **Spaced Repetition**: Automatically injects active-recall revision blocks 2 and 6 days after learning a topic.
  - **Cognitive Interleaving**: Rotates complementary subjects to prevent mental fatigue.
  - **Urgency & Difficulty Weighting**: Allocates higher study hours to challenging subjects with approaching exams.
  - **Pre-Exam Mock Buffer**: Automatically reserves final 2-3 days for full mock tests and high-yield formula sheets.
- ⏱️ **Integrated Pomodoro Focus Timer**:
  - Ambient study audio generator (Rain, White Noise, Alpha Binaural Waves synthesized in real-time).
  - 25m, 50m deep work sessions and break intervals with audio notifications.
- 📅 **1-Click Calendar Sync**:
  - Export to `.ics` iCalendar format for seamless import into **Google Calendar**, **Apple Calendar**, and **Microsoft Outlook**.
- 📊 **Study Analytics & Progress Gauge**:
  - Visual subject distribution doughnut chart, daily workload bars, and projected exam readiness score.
- 🤖 **AI Strategy Advisor**:
  - Cognitive learning tactics (Feynman technique, Blurting method, 50/10 Rule).
  - Optional **Gemini API** integration for custom natural-language study advice.
- 🖨️ **Print & PDF Mode**: Clean formatted timetable printout for your study desk.

---

## 📁 Project Structure

```
My Project/
├── app.py                  # Flask Web Server & REST API endpoints
├── scheduler.py            # Python AI Scheduling & Optimization Engine
├── ai_advisor.py           # Cognitive Learning Strategies & Gemini Integration
├── exporter.py             # iCalendar (.ics) & Export Utility
├── run.py                  # One-click launch script (boots server & opens browser)
├── start_app.bat           # Windows 1-click launcher
├── requirements.txt        # Python dependencies
├── vercel.json             # Vercel 1-click deployment config
├── Procfile                # Render / Heroku deployment config
├── Dockerfile              # Docker container definition
├── templates/
│   └── index.html          # Modern Glassmorphism Dashboard UI
├── static/
│   ├── css/
│   │   └── style.css       # Custom stylesheets & animations
│   └── js/
│       └── app.js          # Reactive controller & Web Audio synthesizer
└── tests/
    └── test_scheduler.py   # Unit tests for scheduling algorithms
```

---

## 🚀 How to Run Locally

### Method 1: One-Click Launcher (Windows)
Double-click `start_app.bat` inside this folder. It will start the server and open your browser automatically.

### Method 2: Command Line / VS Code Terminal
1. Open this folder in VS Code:
   ```bash
   code "C:\Users\Mayuri\Desktop\My Project"
   ```
2. Run the application:
   ```bash
   python run.py
   ```
3. Open your browser at [http://127.0.0.1:5000](http://127.0.0.1:5000).

---

## 🧪 Running Unit Tests

To verify the Python scheduling engine algorithms:
```bash
python -m unittest discover tests
```

---

## 🌐 Free Cloud Deployment Options

### Option 1: Render / Railway / PythonAnywhere (Recommended for Python)
1. Push this folder to a GitHub repository.
2. In [Render.com](https://render.com), create a new **Web Service** and link your repo.
3. Build Command: `pip install -r requirements.txt`
4. Start Command: `gunicorn app:app`

### Option 2: Vercel
1. Install Vercel CLI (`npm i -g vercel`) or connect GitHub repository to Vercel.
2. The included `vercel.json` will deploy the Python Flask backend automatically.

### Option 3: Docker
```bash
docker build -t ai-study-planner .
docker run -p 5000:5000 ai-study-planner
```