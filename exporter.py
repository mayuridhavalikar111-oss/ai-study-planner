"""
Calendar and Export Utilities (Python)
Generates iCalendar (.ics) format for Google Calendar, Apple Calendar, Outlook,
and CSV/JSON structured export files.
"""

from datetime import datetime, timedelta

class CalendarExporter:
    @staticmethod
    def generate_ics(schedule_data, user_name="Student"):
        """
        Generates standard iCalendar (.ics) string for importing all study sessions into
        Google Calendar, Apple Calendar, or Microsoft Outlook.
        """
        lines = [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "PRODID:-//Apex AI Study Planner//EN",
            "CALSCALE:GREGORIAN",
            "METHOD:PUBLISH",
            f"X-WR-CALNAME:AI Study Plan - {user_name}",
            "X-WR-TIMEZONE:UTC"
        ]

        now_str = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")

        for day in schedule_data.get("schedule", []):
            if day.get("is_rest_day"):
                continue

            day_date_str = day.get("date") # "YYYY-MM-DD"
            if not day_date_str:
                continue

            # Parse date
            try:
                d = datetime.strptime(day_date_str, "%Y-%m-%d")
            except Exception:
                continue

            # Add exams as All-Day High Priority Events
            for exam_name in day.get("exams_today", []):
                uid = f"exam_{d.strftime('%Y%m%d')}_{hash(exam_name)}@aistudyplanner.local"
                lines.extend([
                    "BEGIN:VEVENT",
                    f"UID:{uid}",
                    f"DTSTAMP:{now_str}",
                    f"DTSTART;VALUE=DATE:{d.strftime('%Y%m%d')}",
                    f"DTEND;VALUE=DATE:{(d + timedelta(days=1)).strftime('%Y%m%d')}",
                    f"SUMMARY:🚨 EXAM: {exam_name}",
                    f"DESCRIPTION:Final Exam for {exam_name}. Best of luck!",
                    "STATUS:CONFIRMED",
                    "PRIORITY:1",
                    "END:VEVENT"
                ])

            # Add study sessions
            current_hour = 9 # Start default at 09:00 AM if time slot not strict
            for idx, sess in enumerate(day.get("sessions", [])):
                subj = sess.get("subject", "Study Session")
                topic = sess.get("topic", "Focused Learning")
                duration_mins = int(sess.get("duration_minutes", 45))
                
                # Approximate start & end datetime
                start_dt = d.replace(hour=current_hour, minute=0, second=0)
                end_dt = start_dt + timedelta(minutes=duration_mins)
                current_hour = (current_hour + max(1, duration_mins // 60 + 1)) % 22
                if current_hour < 9:
                    current_hour = 14

                dt_start_str = start_dt.strftime("%Y%m%dT%H%M%S")
                dt_end_str = end_dt.strftime("%Y%m%dT%H%M%S")
                uid = f"sess_{d.strftime('%Y%m%d')}_{idx}_{hash(subj)}@aistudyplanner.local"

                lines.extend([
                    "BEGIN:VEVENT",
                    f"UID:{uid}",
                    f"DTSTAMP:{now_str}",
                    f"DTSTART:{dt_start_str}",
                    f"DTEND:{dt_end_str}",
                    f"SUMMARY:📚 {subj} - {topic}",
                    f"DESCRIPTION:AI Study Plan\\nSubject: {subj}\\nTopic: {topic}\\nDuration: {duration_mins} mins\\nFocus: {sess.get('focus_level', 'Deep Work')}",
                    "STATUS:CONFIRMED",
                    "END:VEVENT"
                ])

        lines.append("END:VCALENDAR")
        return "\r\n".join(lines)