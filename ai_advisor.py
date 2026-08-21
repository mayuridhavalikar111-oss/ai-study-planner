"""
AI Study Advisor & Insight Generator
Provides cognitive study strategies, revision tactics, and optional Gemini AI insights.
"""

import json
import os
import urllib.request
import urllib.error

class StudyAdvisor:
    @staticmethod
    def generate_strategy(subjects, daily_hours, analytics, api_key=None):
        """
        Generates tailored study recommendations and active recall strategies.
        If api_key is provided, queries Gemini API for deep natural language advice.
        Otherwise, uses the built-in rule-based cognitive heuristics engine.
        """
        if api_key and api_key.strip():
            try:
                return StudyAdvisor._query_gemini(subjects, daily_hours, analytics, api_key)
            except Exception as e:
                # Fallback to local heuristic advice with notification
                local_advice = StudyAdvisor._generate_local_heuristics(subjects, daily_hours, analytics)
                local_advice["notice"] = f"AI Custom query fallback (Local Heuristics used): {str(e)}"
                return local_advice
        else:
            return StudyAdvisor._generate_local_heuristics(subjects, daily_hours, analytics)

    @staticmethod
    def _generate_local_heuristics(subjects, daily_hours, analytics):
        tips = []
        high_priority = []
        retention_tactics = []

        total_hours = analytics.get("total_hours", 0)
        readiness = analytics.get("readiness_score", 0)

        # Subject specific analysis
        hard_subjects = [s["name"] for s in subjects if s.get("difficulty") in ["hard", "very_hard"]]
        low_conf = [s["name"] for s in subjects if int(s.get("confidence", 3)) <= 2]

        if hard_subjects:
            high_priority.append(f"🧠 High-Cognitive Focus: Prioritize {', '.join(hard_subjects)} during your morning peak focus slots.")
        
        if low_conf:
            high_priority.append(f"🎯 Confidence Booster: For {', '.join(low_conf)}, use the Feynman Technique (explain concepts out loud in simple terms) before tackling problems.")

        retention_tactics.append("⏱️ The 50/10 Rule: Study with 100% focus for 50 minutes, then take a full 10-minute screen-free break to let your hippocampus consolidate memory.")
        retention_tactics.append("🔄 Blurting Method: After studying a chapter, close your notes and blurt out everything you remember on a blank sheet, then check for knowledge gaps.")
        retention_tactics.append("📊 Interleaved Practice: Switch between 2 different subjects daily rather than bingeing 1 subject for 6 hours straight.")

        if readiness > 80:
            status_summary = "Excellent projected preparedness! Maintain steady daily consistency and focus on timed mock exams."
        elif readiness > 60:
            status_summary = "Good steady pace. Ramp up spaced recall and formula sheet reviews in the final 7 days."
        else:
            status_summary = "High-urgency schedule. Eliminate non-essential distractions and protect your daily study blocks."

        return {
            "status_summary": status_summary,
            "high_priority_actions": high_priority,
            "retention_tactics": retention_tactics,
            "exam_week_checklist": [
                "1. Solve at least 2 past exam papers under strict timed conditions.",
                "2. Compile a 1-page condensed 'Cheat Sheet' / Formula Sheet for quick recall.",
                "3. Stop heavy cramming 12 hours before each exam to ensure peak brain performance.",
                "4. Sleep 7-8 hours prior to exam day for maximum cognitive processing speed."
            ]
        }

    @staticmethod
    def _query_gemini(subjects, daily_hours, analytics, api_key):
        prompt = f"""
        Act as an elite academic coach and cognitive science expert.
        Analyze this student's exam preparation profile:
        - Subjects: {json.dumps(subjects)}
        - Daily Hours: {daily_hours}
        - Total Planned Study Hours: {analytics.get('total_hours', 0)}
        - Projected Readiness Score: {analytics.get('readiness_score', 0)}%

        Provide an actionable JSON response matching this schema:
        {{
            "status_summary": "A 2-sentence executive summary of their study strategy",
            "high_priority_actions": ["List of 3 specific high impact actions tailored to their subjects"],
            "retention_tactics": ["List of 3 science-backed study techniques tailored to their exam dates"],
            "exam_week_checklist": ["List of 4 crucial final-stretch steps"]
        }}
        Only return valid JSON without markdown wrapping.
        """
        
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        payload = {
            "contents": [{
                "parts": [{"text": prompt}]
            }]
        }
        
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        
        with urllib.request.urlopen(req, timeout=12) as response:
            result = json.loads(response.read().decode("utf-8"))
            raw_text = result["candidates"][0]["content"]["parts"][0]["text"].strip()
            # Clean markdown code blocks if returned
            if raw_text.startswith("```json"):
                raw_text = raw_text[7:]
            if raw_text.startswith("```"):
                raw_text = raw_text[3:]
            if raw_text.endswith("```"):
                raw_text = raw_text[:-3]
            return json.loads(raw_text.strip())