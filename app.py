"""
Flask Application & Web Server for AI Study Planner
"""

from flask import Flask, render_template, request, jsonify, Response
from scheduler import StudyScheduler
from ai_advisor import StudyAdvisor
from exporter import CalendarExporter
import json
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEMPLATE_DIR = os.path.join(BASE_DIR, "templates")
STATIC_DIR = os.path.join(BASE_DIR, "static")
app = Flask(__name__, template_folder=TEMPLATE_DIR, static_folder=STATIC_DIR)
app.config['SECRET_KEY'] = 'ai-study-planner-secret-key-2026'

PREBUILT_TEMPLATES = {
    "engineering_cs": {
        "name": "Computer Science & Engineering",
        "description": "Balanced plan for Algorithms, Operating Systems, Database Management, and Web Dev.",
        "subjects": [
            {
                "name": "Data Structures & Algorithms",
                "difficulty": "very_hard",
                "confidence": 2,
                "topics": ["Dynamic Programming", "Graph Algorithms", "Trees & Heaps", "Greedy & Divide-and-Conquer"],
                "color": "#3B82F6"
            },
            {
                "name": "Operating Systems",
                "difficulty": "hard",
                "confidence": 3,
                "topics": ["Process Scheduling", "Virtual Memory & Paging", "Deadlocks & Semaphores", "File Systems"],
                "color": "#8B5CF6"
            },
            {
                "name": "Database Management Systems",
                "difficulty": "medium",
                "confidence": 4,
                "topics": ["SQL & Normalization (3NF/BCNF)", "Transactions & ACID", "Indexing & B+ Trees", "Concurrency Control"],
                "color": "#10B981"
            },
            {
                "name": "Computer Networks",
                "difficulty": "medium",
                "confidence": 3,
                "topics": ["TCP/IP & OSI Layers", "Routing Protocols (OSPF/BGP)", "Congestion Control", "DNS & HTTP/HTTPS"],
                "color": "#F59E0B"
            }
        ]
    },
    "medical_mcat": {
        "name": "Medical & Pre-Med (Biology & Chem)",
        "description": "High-retention spaced repetition plan for Biochemistry, Organic Chem, Anatomy & Physiology.",
        "subjects": [
            {
                "name": "Human Anatomy & Physiology",
                "difficulty": "very_hard",
                "confidence": 2,
                "topics": ["Cardiovascular System", "Neuroanatomy & Synapses", "Endocrine Regulation", "Renal System & Electrolytes"],
                "color": "#EF4444"
            },
            {
                "name": "Biochemistry & Genetics",
                "difficulty": "hard",
                "confidence": 3,
                "topics": ["Enzyme Kinetics & Michaelis-Menten", "Glycolysis & Krebs Cycle", "DNA Replication & Repair", "Lipid Metabolism"],
                "color": "#EC4899"
            },
            {
                "name": "Organic Chemistry",
                "difficulty": "hard",
                "confidence": 2,
                "topics": ["Reaction Mechanisms (SN1/SN2)", "Stereochemistry & Chirality", "Spectroscopy (NMR/IR)", "Carbonyl Chemistry"],
                "color": "#06B6D4"
            }
        ]
    },
    "highschool_stem": {
        "name": "High School STEM & Finals",
        "description": "Mathematics, Physics, Chemistry, and English literature.",
        "subjects": [
            {
                "name": "Calculus & Algebra",
                "difficulty": "hard",
                "confidence": 3,
                "topics": ["Derivatives & Chain Rule", "Integration by Parts", "Differential Equations", "Vectors & Matrices"],
                "color": "#3B82F6"
            },
            {
                "name": "Physics",
                "difficulty": "hard",
                "confidence": 2,
                "topics": ["Electromagnetism & Faraday", "Rotational Dynamics", "Optics & Wave Motion", "Thermodynamics"],
                "color": "#F59E0B"
            },
            {
                "name": "Chemistry",
                "difficulty": "medium",
                "confidence": 4,
                "topics": ["Chemical Bonding", "Equilibrium & Le Chatelier", "Acids & Bases (pH)", "Stoichiometry"],
                "color": "#10B981"
            },
            {
                "name": "English & Literature",
                "difficulty": "easy",
                "confidence": 4,
                "topics": ["Essay Structure & Arguments", "Literary Analysis", "Vocabulary & Grammar"],
                "color": "#8B5CF6"
            }
        ]
    }
}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/templates', methods=['GET'])
def get_templates():
    return jsonify(PREBUILT_TEMPLATES)

@app.route('/api/generate-plan', methods=['POST'])
def generate_plan():
    try:
        data = request.get_json() or {}
        subjects = data.get('subjects', [])
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        daily_hours = data.get('daily_hours', 4.0)
        preferences = data.get('preferences', {})

        scheduler = StudyScheduler(
            subjects=subjects,
            start_date=start_date,
            end_date=end_date,
            daily_hours=daily_hours,
            preferences=preferences
        )

        plan_result = scheduler.generate_schedule()

        # Generate AI strategy advice
        api_key = data.get('gemini_api_key', '').strip()
        advice = StudyAdvisor.generate_strategy(
            subjects=subjects,
            daily_hours=daily_hours,
            analytics=plan_result.get('analytics', {}),
            api_key=api_key
        )

        plan_result['ai_advice'] = advice

        return jsonify({"success": True, "data": plan_result})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

@app.route('/api/export-ical', methods=['POST'])
def export_ical():
    try:
        data = request.get_json() or {}
        schedule_data = data.get('schedule_data', {})
        student_name = data.get('name', 'Student')
        ics_content = CalendarExporter.generate_ics(schedule_data, user_name=student_name)
        
        return Response(
            ics_content,
            mimetype="text/calendar",
            headers={"Content-Disposition": "attachment; filename=study_schedule.ics"}
        )
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

@app.route('/api/status', methods=['GET'])
def status():
    return jsonify({
        "status": "online",
        "engine": "Python AI Study Scheduler v2.0",
        "features": ["Spaced Repetition", "Interleaving", "Cognitive Weighting", "iCal Export", "Gemini AI"]
    })

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=True)