"""
Unit Tests for Python AI Study Scheduler
"""

import unittest
from datetime import date, timedelta
from scheduler import StudyScheduler

class TestStudyScheduler(unittest.TestCase):
    def setUp(self):
        self.subjects = [
            {
                "name": "Maths",
                "difficulty": "hard",
                "confidence": 2,
                "exam_date": (date.today() + timedelta(days=10)).strftime("%Y-%m-%d"),
                "topics": ["Calculus", "Linear Algebra"]
            },
            {
                "name": "History",
                "difficulty": "easy",
                "confidence": 4,
                "exam_date": (date.today() + timedelta(days=15)).strftime("%Y-%m-%d"),
                "topics": ["Renaissance", "Industrial Revolution"]
            }
        ]

    def test_weight_calculation(self):
        scheduler = StudyScheduler(self.subjects)
        weights = scheduler.calculate_subject_weights()
        self.assertIn("Maths", weights)
        self.assertIn("History", weights)
        # Hard subject with lower confidence should have higher weight
        self.assertGreater(weights["Maths"], weights["History"])

    def test_schedule_generation(self):
        scheduler = StudyScheduler(
            self.subjects,
            daily_hours=4.0,
            preferences={"session_duration": 45, "enable_spaced_repetition": True}
        )
        result = scheduler.generate_schedule()
        self.assertIn("schedule", result)
        self.assertIn("analytics", result)
        self.assertGreater(len(result["schedule"]), 0)
        self.assertGreater(result["analytics"]["total_hours"], 0)

if __name__ == '__main__':
    unittest.main()