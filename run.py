"""
One-click Python Launcher for Apex AI Study Planner.
Starts the Flask server and opens the browser automatically.
"""

import webbrowser
import threading
import time
import os
import sys
from app import app

def open_browser():
    time.sleep(1.2)
    webbrowser.open("http://127.0.0.1:5000")

if __name__ == '__main__':
    print("=" * 60)
    print("🚀 Launching Apex AI Study Planner (Python Web Application)")
    print("=" * 60)
    print("🌐 URL: http://127.0.0.1:5000")
    print("✨ Opening your default browser...")
    print("🛑 Press Ctrl+C in this terminal to stop the server.")
    print("=" * 60)
    
    threading.Thread(target=open_browser, daemon=True).start()
    app.run(host='127.0.0.1', port=5000, debug=False)