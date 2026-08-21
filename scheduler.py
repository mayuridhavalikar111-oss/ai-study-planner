"""
AI Study Schedule Optimizer & Engine (Python Core)
Implements spaced repetition, cognitive load interleaving, difficulty weighting,
and time-constraint satisfaction algorithms.
"""

from datetime import datetime, date, timedelta
import math
import random

DIFFICULTY_WEIGHTS = {
    "easy": 1.0,
    "medium": 1.5,
    "hard": 2.2,
    "very_hard": 3.0
}

SUBJECT_COLORS = [
    "#3B82F6", # Blue
    "#8B5CF6", # Purple
    "#EC4899", # Pink
    "#10B981", # Emerald
    "#F59E0B", # Amber
    "#06B6D4", # Cyan
    "#EF4444", # Red
    "#6366F1", # Indigo
]

class StudyScheduler:
    def __init__(self, subjects, start_date=None, end_date=None, daily_hours=None, preferences=None):
        self.subjects = subjects or []
        self.start_date = self._parse_date(start_date) or date.today()
        self.preferences = preferences or {
            "session_duration": 45,
            "break_duration": 10,
            "peak_time": "morning",
            "enable_spaced_repetition": True,
            "buffer_days_before_exam": 2,
            "max_daily_subjects": 3
        }
        
        default_hours = 4.0
        if isinstance(daily_hours, (int, float)):
            self.daily_hours = {d: float(daily_hours) for d in range(7)}
        elif isinstance(daily_hours, dict):
            day_map = {'monday': 0, 'tuesday': 1, 'wednesday': 2, 'thursday': 3, 'friday': 4, 'saturday': 5, 'sunday': 6}
            self.daily_hours = {}
            for k, v in daily_hours.items():
                idx = day_map.get(str(k).lower(), int(k) if str(k).isdigit() else 0)
                self.daily_hours[idx] = float(v)
        else:
            self.daily_hours = {d: default_hours for d in range(7)}

        exam_dates = [self._parse_date(s.get("exam_date")) for s in self.subjects if s.get("exam_date")]
        if exam_dates:
            latest_exam = max(exam_dates)
            self.end_date = self._parse_date(end_date) or (latest_exam + timedelta(days=1))
        else:
            self.end_date = self._parse_date(end_date) or (self.start_date + timedelta(days=30))

        for idx, subj in enumerate(self.subjects):
            if not subj.get("color"):
                subj["color"] = SUBJECT_COLORS[idx % len(SUBJECT_COLORS)]

    def _parse_date(self, d):
        if not d:
            return None
        if isinstance(d, date):
            return d
        if isinstance(d, datetime):
            return d.date()
        try:
            return datetime.strptime(str(d)[:10], "%Y-%m-%d").date()
        except Exception:
            return None

    def calculate_subject_weights(self):
        weights = {}
        total_raw_weight = 0.0

        for subj in self.subjects:
            name = subj["name"]
            diff_multiplier = DIFFICULTY_WEIGHTS.get(str(subj.get("difficulty", "medium")).lower(), 1.5)
            confidence = int(subj.get("confidence", 3))
            confidence_multiplier = max(1.0, (6.0 - confidence) * 0.7)
            
            exam_date = self._parse_date(subj.get("exam_date"))
            if exam_date and exam_date > self.start_date:
                days_until = (exam_date - self.start_date).days
                urgency = max(1.0, 1.0 + (30.0 / max(1, days_until)))
            else:
                urgency = 1.0

            topics = subj.get("topics", [])
            topic_factor = max(1.0, math.sqrt(len(topics))) if topics else 1.0

            raw_weight = diff_multiplier * confidence_multiplier * urgency * topic_factor
            weights[name] = raw_weight
            total_raw_weight += raw_weight

        normalized = {}
        for name, w in weights.items():
            normalized[name] = (w / total_raw_weight) if total_raw_weight > 0 else (1.0 / max(1, len(self.subjects)))

        return normalized

    def generate_schedule(self):
        if not self.subjects:
            return {
                "schedule": [],
                "analytics": {"total_hours": 0, "subject_breakdown": {}, "readiness_score": 0},
                "summary": "No subjects provided."
            }

        weights = self.calculate_subject_weights()
        total_available_hours = 0.0
        current = self.start_date
        while current <= self.end_date:
            weekday = current.weekday()
            total_available_hours += self.daily_hours.get(weekday, 4.0)
            current += timedelta(days=1)

        subject_target_hours = {name: weights[name] * total_available_hours for name in weights}
        subject_allocated_hours = {name: 0.0 for name in weights}
        
        subject_topics_map = {}
        for subj in self.subjects:
            topics = list(subj.get("topics", []))
            if not topics:
                topics = [f"{subj['name']} Core Concepts", f"{subj['name']} Practice Problems", f"{subj['name']} Key Formulae & Review"]
            subject_topics_map[subj["name"]] = topics

        spaced_reviews = []
        schedule_days = []
        current = self.start_date
        day_index = 0

        time_slots = {
            "morning": ["08:00 - 09:30", "09:45 - 11:15", "11:30 - 12:30"],
            "afternoon": ["14:00 - 15:30", "15:45 - 17:15", "17:30 - 18:30"],
            "evening": ["19:00 - 20:30", "20:45 - 22:00", "22:15 - 23:00"],
            "night": ["21:00 - 22:30", "22:45 - 00:15", "00:30 - 01:30"]
        }
        
        peak_preference = self.preferences.get("peak_time", "morning").lower()
        if peak_preference not in time_slots:
            peak_preference = "morning"

        last_studied_subjects = []

        while current <= self.end_date:
            weekday = current.weekday()
            available_hours_today = self.daily_hours.get(weekday, 4.0)
            
            if available_hours_today <= 0.2:
                schedule_days.append({
                    "date": current.strftime("%Y-%m-%d"),
                    "day_name": current.strftime("%A"),
                    "is_rest_day": True,
                    "total_hours": 0,
                    "sessions": [],
                    "note": "Scheduled Rest & Recovery Day"
                })
                current += timedelta(days=1)
                day_index += 1
                continue

            day_sessions = []
            remaining_hours_today = available_hours_today
            
            exams_today = [s for s in self.subjects if self._parse_date(s.get("exam_date")) == current]
            
            eligible_subjects = []
            for s in self.subjects:
                exam_date = self._parse_date(s.get("exam_date"))
                if exam_date is None or current <= exam_date:
                    eligible_subjects.append(s)

            if not eligible_subjects:
                break

            # 1. Spaced Repetition reviews
            due_reviews = [r for r in spaced_reviews if r["date"] == current]
            for rev in due_reviews:
                if remaining_hours_today < 0.4:
                    break
                session_time = min(1.0, remaining_hours_today)
                day_sessions.append({
                    "id": f"sess_{day_index}_{len(day_sessions)}",
                    "subject": rev["subject"],
                    "color": rev["color"],
                    "topic": f"🔄 Spaced Repetition: {rev['topic']}",
                    "type": "review",
                    "duration_minutes": int(session_time * 60),
                    "time_slot": "Active Recall Session",
                    "focus_level": "High (Retention)",
                    "pomodoros": max(1, round((session_time * 60) / self.preferences.get("session_duration", 45))),
                    "completed": False
                })
                remaining_hours_today -= session_time
                subject_allocated_hours[rev["subject"]] += session_time

            # 2. Select subjects using deficit & interleaving
            deficit_scores = []
            for subj in eligible_subjects:
                s_name = subj["name"]
                target = max(0.1, subject_target_hours.get(s_name, 1.0))
                allocated = subject_allocated_hours.get(s_name, 0.0)
                deficit = (target - allocated) / target
                
                exam_date = self._parse_date(subj.get("exam_date"))
                days_left = (exam_date - current).days if exam_date else 999
                
                if 0 <= days_left <= self.preferences.get("buffer_days_before_exam", 2):
                    deficit += 2.0

                if s_name in last_studied_subjects:
                    deficit *= 0.75

                deficit_scores.append((deficit, subj))

            deficit_scores.sort(key=lambda x: x[0], reverse=True)
            max_subjects_today = self.preferences.get("max_daily_subjects", 3)
            today_picked = [item[1] for item in deficit_scores[:max_subjects_today]]
            
            session_duration_hrs = self.preferences.get("session_duration", 45) / 60.0
            slots_pool = list(time_slots[peak_preference]) + list(time_slots["afternoon"]) + list(time_slots["evening"])
            slot_idx = len(day_sessions)

            todays_studied_names = []
            for subj in today_picked:
                if remaining_hours_today < 0.4:
                    break

                s_name = subj["name"]
                todays_studied_names.append(s_name)
                
                exam_date = self._parse_date(subj.get("exam_date"))
                days_left = (exam_date - current).days if exam_date else 999
                
                topic_list = subject_topics_map.get(s_name, [])
                if 0 <= days_left <= 2:
                    current_topic = f"🎯 Final Mock Exam & High-Yield Summary ({s_name})"
                    session_type = "exam_prep"
                elif topic_list:
                    current_topic = topic_list[0]
                    if len(topic_list) > 1:
                        subject_topics_map[s_name] = topic_list[1:] + [topic_list[0]]
                    session_type = "deep_study"
                else:
                    current_topic = f"{s_name} - Deep Problem Solving & Mastery"
                    session_type = "deep_study"

                allocated_block = min(remaining_hours_today, max(session_duration_hrs, 1.25))
                duration_mins = int(allocated_block * 60)
                pomo_count = max(1, round(duration_mins / self.preferences.get("session_duration", 45)))
                
                slot_time = slots_pool[slot_idx % len(slots_pool)]
                slot_idx += 1

                day_sessions.append({
                    "id": f"sess_{day_index}_{len(day_sessions)}",
                    "subject": s_name,
                    "color": subj["color"],
                    "topic": current_topic,
                    "type": session_type,
                    "duration_minutes": duration_mins,
                    "time_slot": slot_time,
                    "focus_level": "Deep Focus (Peak Alertness)" if slot_idx <= 2 else "Moderate Focus",
                    "pomodoros": pomo_count,
                    "completed": False
                })

                remaining_hours_today -= allocated_block
                subject_allocated_hours[s_name] += allocated_block

                if self.preferences.get("enable_spaced_repetition", True) and session_type == "deep_study":
                    review_date_1 = current + timedelta(days=2)
                    if (not exam_date) or (review_date_1 < exam_date):
                        spaced_reviews.append({
                            "date": review_date_1,
                            "subject": s_name,
                            "color": subj["color"],
                            "topic": current_topic
                        })

            last_studied_subjects = todays_studied_names
            total_day_study_hours = sum(s["duration_minutes"] for s in day_sessions) / 60.0
            
            note = ""
            if exams_today:
                exam_names = ", ".join(e["name"] for e in exams_today)
                note = f"🚨 EXAM DAY: {exam_names}! Best of luck! 🏆"
            elif any(0 < ((self._parse_date(s.get('exam_date')) - current).days if self._parse_date(s.get('exam_date')) else 999) <= 2 for s in self.subjects):
                note = "⚡ High-Yield Revision Window - Focus on summary sheets and practice mocks."

            schedule_days.append({
                "date": current.strftime("%Y-%m-%d"),
                "day_name": current.strftime("%A"),
                "is_rest_day": False,
                "total_hours": round(total_day_study_hours, 1),
                "sessions": day_sessions,
                "note": note,
                "exams_today": [e["name"] for e in exams_today]
            })

            current += timedelta(days=1)
            day_index += 1

        total_planned_hours = sum(subject_allocated_hours.values())
        subject_breakdown = {}
        for s in self.subjects:
            s_name = s["name"]
            subject_breakdown[s_name] = {
                "color": s["color"],
                "target_hours": round(subject_target_hours.get(s_name, 0), 1),
                "planned_hours": round(subject_allocated_hours.get(s_name, 0), 1),
                "difficulty": s.get("difficulty", "medium"),
                "confidence": s.get("confidence", 3),
                "percentage": round((subject_allocated_hours.get(s_name, 0) / max(0.1, total_planned_hours)) * 100, 1)
            }

        readiness_score = min(98, round(
            sum(
                min(1.0, subject_allocated_hours.get(s["name"], 0) / max(1.0, subject_target_hours.get(s["name"], 1))) * 
                (0.6 + 0.08 * int(s.get("confidence", 3)))
                for s in self.subjects
            ) / max(1, len(self.subjects)) * 100
        ))

        return {
            "schedule": schedule_days,
            "analytics": {
                "total_hours": round(total_planned_hours, 1),
                "total_days": len(schedule_days),
                "total_sessions": sum(len(d["sessions"]) for d in schedule_days),
                "subject_breakdown": subject_breakdown,
                "readiness_score": readiness_score,
                "start_date": self.start_date.strftime("%Y-%m-%d"),
                "end_date": self.end_date.strftime("%Y-%m-%d")
            },
            "summary": f"Generated {len(schedule_days)} days plan covering {round(total_planned_hours, 1)} total hours with Spaced Repetition and Active Recall."
        }