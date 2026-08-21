/**
 * Apex AI Study Planner - Frontend Controller
 */

let currentScheduleData = null;
let currentSubjects = [];
let chartInstances = {};

// Default subjects to start with
const DEFAULT_INITIAL_SUBJECTS = [
    {
        name: "Data Structures & Algorithms",
        difficulty: "hard",
        confidence: 2,
        exam_date: getFutureDate(14),
        topics: ["Graph Traversals (BFS/DFS)", "Dynamic Programming", "Tree Balancing & AVL", "Sorting & Divide-and-Conquer"],
        color: "#3B82F6"
    },
    {
        name: "Operating Systems",
        difficulty: "medium",
        confidence: 3,
        exam_date: getFutureDate(18),
        topics: ["Deadlock Prevention", "Virtual Memory & Paging", "CPU Scheduling Algorithms"],
        color: "#8B5CF6"
    },
    {
        name: "Database Systems (DBMS)",
        difficulty: "medium",
        confidence: 4,
        exam_date: getFutureDate(22),
        topics: ["SQL Queries & Joins", "B+ Trees & Indexing", "ACID Transactions & 3NF"],
        color: "#10B981"
    }
];

function getFutureDate(daysAhead) {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    return d.toISOString().split('T')[0];
}

document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    initDateDefaults();
    initSubjects();
    initEventHandlers();
});

function initDateDefaults() {
    const today = new Date();
    const startDateInput = document.getElementById('inputStartDate');
    const endDateInput = document.getElementById('inputEndDate');
    
    startDateInput.value = today.toISOString().split('T')[0];
    
    const defaultEnd = new Date();
    defaultEnd.setDate(today.getDate() + 25);
    endDateInput.value = defaultEnd.toISOString().split('T')[0];

    const slider = document.getElementById('inputDailyHours');
    const lbl = document.getElementById('lblDailyHours');
    slider.addEventListener('input', () => {
        lbl.innerText = `${parseFloat(slider.value).toFixed(1)} hrs/day`;
    });
}

function initSubjects() {
    currentSubjects = [...DEFAULT_INITIAL_SUBJECTS];
    renderSubjectRows();
}

function renderSubjectRows() {
    const container = document.getElementById('subjectList');
    container.innerHTML = '';

    currentSubjects.forEach((subj, idx) => {
        const row = document.createElement('div');
        row.className = "bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3 card-glow transition";
        row.innerHTML = `
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div class="flex items-center space-x-2 flex-1">
                    <input type="color" value="${subj.color || '#3B82F6'}" onchange="updateSubject(${idx}, 'color', this.value)" class="w-7 h-7 rounded cursor-pointer bg-transparent border-0">
                    <input type="text" value="${subj.name}" placeholder="Subject Name" oninput="updateSubject(${idx}, 'name', this.value)" class="bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-100 flex-1 focus:outline-none focus:border-cyan-500">
                </div>
                <div class="flex items-center space-x-2">
                    <div class="flex items-center space-x-1">
                        <span class="text-[11px] text-slate-400">Exam:</span>
                        <input type="date" value="${subj.exam_date || ''}" onchange="updateSubject(${idx}, 'exam_date', this.value)" class="bg-slate-800/80 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500">
                    </div>
                    <button onclick="removeSubjectRow(${idx})" class="text-rose-400 hover:text-rose-300 p-1 rounded hover:bg-rose-500/10 transition" title="Delete Subject">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                <div class="flex items-center space-x-2">
                    <span class="text-slate-400">Difficulty:</span>
                    <select onchange="updateSubject(${idx}, 'difficulty', this.value)" class="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200 flex-1">
                        <option value="easy" ${subj.difficulty === 'easy' ? 'selected' : ''}>Easy (1x Weight)</option>
                        <option value="medium" ${subj.difficulty === 'medium' ? 'selected' : ''}>Medium (1.5x Weight)</option>
                        <option value="hard" ${subj.difficulty === 'hard' ? 'selected' : ''}>Hard (2.2x Weight)</option>
                        <option value="very_hard" ${subj.difficulty === 'very_hard' ? 'selected' : ''}>Very Hard (3.0x Weight)</option>
                    </select>
                </div>

                <div class="flex items-center space-x-2">
                    <span class="text-slate-400">Current Confidence:</span>
                    <select onchange="updateSubject(${idx}, 'confidence', parseInt(this.value)) class="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200 flex-1">
                        <option value="1" ${subj.confidence === 1 ? 'selected' : ''}>⭐ 1 - Need heavy foundation</option>
                        <option value="2" ${subj.confidence === 2 ? 'selected' : ''}>⭐⭐ 2 - Low Confidence</option>
                        <option value="3" ${subj.confidence === 3 ? 'selected' : ''}>⭐⭐⭐ 3 - Moderate</option>
                        <option value="4" ${subj.confidence === 4 ? 'selected' : ''}>⭐⭐⭐⭐ 4 - Good Understanding</option>
                        <option value="5" ${subj.confidence === 5 ? 'selected' : ''}>⭐⭐⭐⭐⭐ 5 - Exam Ready</option>
                    </select>
                </div>
            </div>

            <div>
                <input type="text" value="${(subj.topics || []).join(', ')}" placeholder="Topics / Chapters separated by comma (e.g. Chapter 1, Trees, Graphs)" onchange="updateSubjectTopics(${idx}, this.value)" class="w-full bg-slate-800/50 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:border-cyan-500">
            </div>
        `;
        container.appendChild(row);
    });

    lucide.createIcons();
}

function addSubjectRow() {
    const colors = ["#3B82F6", "#8B5CF6", "#EC4899", "#10B981", "#F59E0B", "#06B6D4", "#EF4444", "#6366F1"];
    currentSubjects.push({
        name: `New Subject ${currentSubjects.length + 1}`,
        difficulty: "medium",
        confidence: 3,
        exam_date: getFutureDate(20),
        topics: ["Core Concepts", "Practice Problems", "Review Sheet"],
        color: colors[currentSubjects.length % colors.length]
    });
    renderSubjectRows();
}

function removeSubjectRow(index) {
    if (currentSubjects.length <= 1) {
        alert("You must have at least one subject in your study planner.");
        return;
    }
    currentSubjects.splice(index, 1);
    renderSubjectRows();
}

function updateSubject(index, field, value) {
    if (currentSubjects[index]) {
        currentSubjects[index][field] = value;
    }
}

function updateSubjectTopics(index, commaSeparated) {
    if (currentSubjects[index]) {
        currentSubjects[index].topics = commaSeparated.split(',').map(t => t.trim()).filter(Boolean);
    }
}

async function loadTemplate(key) {
    try {
        const res = await fetch('/api/templates');
        const data = await res.json();
        if (data[key]) {
            currentSubjects = data[key].subjects.map(s => ({
                ...s,
                exam_date: getFutureDate(15 + Math.floor(Math.random() * 10))
            }));
            renderSubjectRows();
            triggerNotification(`Loaded template: ${data[key].name}`);
        }
    } catch (err) {
        console.error("Template load failed", err);
    }
}

async function generateSchedule() {
    const btn = document.getElementById('btnGeneratePlan');
    const loading = document.getElementById('loadingIndicator');
    
    btn.disabled = true;
    loading.classList.remove('hidden');

    const payload = {
        subjects: currentSubjects,
        start_date: document.getElementById('inputStartDate').value,
        end_date: document.getElementById('inputEndDate').value,
        daily_hours: parseFloat(document.getElementById('inputDailyHours').value),
        gemini_api_key: document.getElementById('inputApiKey').value,
        preferences: {
            session_duration: parseInt(document.getElementById('selectSessionDuration').value),
            peak_time: document.getElementById('selectPeakTime').value,
            enable_spaced_repetition: document.getElementById('chkSpacedRepetition').checked,
            buffer_days_before_exam: parseInt(document.getElementById('selectBufferDays').value),
            max_daily_subjects: parseInt(document.getElementById('selectMaxDailySubjects').value)
        }
    };

    try {
        const response = await fetch('/api/generate-plan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        if (result.success && result.data) {
            currentScheduleData = result.data;
            renderScheduleOutput(result.data);
            
            // Confetti celebration
            if (typeof confetti === 'function') {
                confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
            }
        } else {
            alert('Failed to generate schedule: ' + (result.error || 'Unknown error'));
        }
    } catch (err) {
        alert('Server communication error: ' + err.message);
    } finally {
        btn.disabled = false;
        loading.classList.add('hidden');
    }
}

function renderScheduleOutput(data) {
    const resultsSection = document.getElementById('resultsSection');
    resultsSection.classList.remove('hidden');

    // Show header action buttons
    document.getElementById('btnExportIcal').classList.remove('hidden');
    document.getElementById('btnPrintPlan').classList.remove('hidden');

    // Render Today's mission
    renderTodayMission(data.schedule);

    // Render Readiness gauge
    renderReadinessCard(data.analytics);

    // Render Timetable Grid
    renderCalendarGrid(data.schedule);

    // Render Charts & Analytics
    renderAnalytics(data.analytics);

    // Render AI Advice
    renderAIAdvice(data.ai_advice);

    // Scroll smoothly to results
    resultsSection.scrollIntoView({ behavior: 'smooth' });
}

function renderCalendarGrid(schedule) {
    const grid = document.getElementById('calendarGrid');
    grid.innerHTML = '';

    schedule.forEach((day, dayIdx) => {
        const card = document.createElement('div');
        const isRest = day.is_rest_day;
        const hasExam = day.exams_today && day.exams_today.length > 0;

        card.className = `rounded-2xl p-5 border transition card-glow ${
            hasExam 
                ? 'bg-gradient-to-b from-rose-950/50 to-slate-900 border-rose-500/40 shadow-rose-900/20' 
                : isRest 
                    ? 'bg-slate-950/40 border-slate-800/60 opacity-75' 
                    : 'bg-slate-900/90 border-slate-800 shadow-xl'
        }`;

        let sessionsHtml = '';
        if (isRest) {
            sessionsHtml = `
                <div class="py-6 text-center text-xs text-slate-400 space-y-1">
                    <i data-lucide="coffee" class="w-6 h-6 mx-auto text-amber-400/80"></i>
                    <p class="font-semibold text-slate-300">Rest & Cognitive Recharge</p>
                    <p class="text-[11px]">Consolidate memory with healthy rest.</p>
                </div>
            `;
        } else if (!day.sessions || day.sessions.length === 0) {
            sessionsHtml = `<div class="py-4 text-center text-xs text-slate-500">No scheduled sessions.</div>`;
        } else {
            sessionsHtml = day.sessions.map((sess, sIdx) => {
                const isReview = sess.type === 'review';
                const isExamPrep = sess.type === 'exam_prep';
                return `
                    <div class="p-3 rounded-xl border transition ${
                        isExamPrep 
                            ? 'bg-rose-950/30 border-rose-500/30' 
                            : isReview 
                                ? 'bg-amber-950/20 border-amber-500/30' 
                                : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                    }">
                        <div class="flex items-center justify-between text-xs mb-1">
                            <span class="font-bold flex items-center space-x-1.5" style="color: ${sess.color}">
                                <span class="w-2 h-2 rounded-full" style="background-color: ${sess.color}"></span>
                                <span>${sess.subject}</span>
                            </span>
                            <span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">${sess.duration_minutes}m</span>
                        </div>
                        <p class="text-xs text-slate-200 font-medium mb-1.5">${sess.topic}</p>
                        <div class="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
                            <span>${sess.time_slot || 'Focus Block'}</span>
                            <button onclick="startPomodoroFor('${escapeHtml(sess.subject)}', '${escapeHtml(sess.topic)}', ${sess.duration_minutes})" class="text-cyan-400 hover:text-cyan-300 flex items-center space-x-1">
                                <i data-lucide="play" class="w-3 h-3"></i>
                                <span>Start Timer</span>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        }

        card.innerHTML = `
            <div class="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                <div>
                    <h4 class="font-bold text-sm text-slate-100">${day.day_name}</h4>
                    <p class="text-[11px] text-slate-400 font-mono">${day.date}</p>
                </div>
                <div class="text-right">
                    ${hasExam ? `<span class="px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[10px] font-bold animate-pulse">EXAM DAY</span>` : ''}
                    <span class="text-xs text-cyan-400 font-bold block">${day.total_hours}h Planned</span>
                </div>
            </div>
            
            ${day.note ? `<div class="text-[11px] px-2.5 py-1 rounded-lg bg-indigo-950/30 border border-indigo-500/20 text-indigo-300 mb-3">${day.note}</div>` : ''}
            
            <div class="space-y-2">
                ${sessionsHtml}
            </div>
        `;

        grid.appendChild(card);
    });

    lucide.createIcons();
}

function renderTodayMission(schedule) {
    const todayCard = document.getElementById('todayMissionCard');
    const todayList = document.getElementById('todayTaskList');
    const badge = document.getElementById('todayProgressBadge');
    
    if (!schedule || schedule.length === 0) return;
    
    // Pick the first day as Today
    const todayData = schedule[0];
    todayCard.classList.remove('hidden');
    todayList.innerHTML = '';

    if (todayData.is_rest_day || !todayData.sessions || todayData.sessions.length === 0) {
        todayList.innerHTML = `<p class="text-xs text-slate-400 py-2">No heavy tasks today. Relax or review key formula sheets!</p>`;
        badge.innerText = "Rest Day";
        return;
    }

    let completedCount = 0;
    const total = todayData.sessions.length;

    todayData.sessions.forEach((sess, idx) => {
        const item = document.createElement('div');
        item.className = "flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800 text-xs";
        item.innerHTML = `
            <div class="flex items-center space-x-2 flex-1 mr-2">
                <input type="checkbox" id="task_${idx}" onchange="toggleTaskDone(this, ${idx})" class="w-4 h-4 rounded text-cyan-500 bg-slate-800 border-slate-700">
                <label for="task_${idx}" class="text-slate-200 font-medium truncate cursor-pointer select-none" id="label_task_${idx}">
                    ${sess.subject}: ${sess.topic}
                </label>
            </div>
            <button onclick="startPomodoroFor('${escapeHtml(sess.subject)}', '${escapeHtml(sess.topic)}', ${sess.duration_minutes})" class="p-1 rounded bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/40">
                <i data-lucide="play" class="w-3.5 h-3.5"></i>
            </button>
        `;
        todayList.appendChild(item);
    });

    badge.innerText = `0/${total} Done`;
    lucide.createIcons();
}

function toggleTaskDone(checkbox, idx) {
    const label = document.getElementById(`label_task_${idx}`);
    if (checkbox.checked) {
        label.classList.add('line-through', 'text-slate-500');
        if (typeof confetti === 'function') {
            confetti({ particleCount: 30, spread: 50, origin: { y: 0.8 } });
        }
    } else {
        label.classList.remove('line-through', 'text-slate-500');
    }
    
    // Update badge
    const checks = document.querySelectorAll('#todayTaskList input[type="checkbox"]');
    const completed = Array.from(checks).filter(c => c.checked).length;
    document.getElementById('todayProgressBadge').innerText = `${completed}/${checks.length} Done`;
}

function renderReadinessCard(analytics) {
    const card = document.getElementById('readinessCard');
    const scoreVal = document.getElementById('readinessScoreVal');
    const bar = document.getElementById('readinessProgressBar');
    const summary = document.getElementById('readinessSummaryText');

    card.classList.remove('hidden');
    const score = analytics.readiness_score || 75;
    scoreVal.innerText = `${score}%`;
    bar.style.width = `${score}%`;

    summary.innerText = `Total planned study: ${analytics.total_hours} hrs across ${analytics.total_days} days. High active-recall coverage configured.`;
}

function renderAnalytics(analytics) {
    const tbody = document.getElementById('subjectBreakdownTbody');
    tbody.innerHTML = '';

    const breakdown = analytics.subject_breakdown || {};
    const labels = [];
    const dataValues = [];
    const backgroundColors = [];

    Object.keys(breakdown).forEach(sName => {
        const item = breakdown[sName];
        labels.push(sName);
        dataValues.push(item.planned_hours);
        backgroundColors.push(item.color || '#3B82F6');

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="py-2 px-3 font-semibold flex items-center space-x-2">
                <span class="w-2.5 h-2.5 rounded-full" style="background-color: ${item.color}"></span>
                <span>${sName}</span>
            </td>
            <td class="py-2 px-3 uppercase text-[10px] text-slate-400 font-bold">${item.difficulty}</td>
            <td class="py-2 px-3">${'⭐'.repeat(item.confidence)}</td>
            <td class="py-2 px-3 font-mono font-bold text-cyan-400">${item.planned_hours} hrs</td>
            <td class="py-2 px-3 font-mono">${item.percentage}%</td>
        `;
        tbody.appendChild(tr);
    });

    // Chart 1: Subject Pie Chart
    if (chartInstances.pie) chartInstances.pie.destroy();
    const ctxPie = document.getElementById('chartSubjectBreakdown').getContext('2d');
    chartInstances.pie = new Chart(ctxPie, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: dataValues,
                backgroundColor: backgroundColors,
                borderWidth: 2,
                borderColor: '#0f172a'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { color: '#94a3b8', boxWidth: 12, font: { size: 11 } } }
            }
        }
    });

    // Chart 2: Daily Load Bar Chart
    if (chartInstances.bar) chartInstances.bar.destroy();
    const ctxBar = document.getElementById('chartDailyLoad').getContext('2d');
    const dayLabels = (currentScheduleData.schedule || []).map(d => d.day_name.slice(0, 3) + ' ' + d.date.slice(8));
    const dayHours = (currentScheduleData.schedule || []).map(d => d.total_hours);

    chartInstances.bar = new Chart(ctxBar, {
        type: 'bar',
        data: {
            labels: dayLabels,
            datasets: [{
                label: 'Study Hours',
                data: dayHours,
                backgroundColor: '#06b6d4',
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { display: false } },
                y: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: '#1e293b' } }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

function renderAIAdvice(advice) {
    const container = document.getElementById('aiAdviceContent');
    if (!advice) {
        container.innerHTML = `<p class="text-xs text-slate-400">No strategy insights generated.</p>`;
        return;
    }

    let highPriorityHtml = (advice.high_priority_actions || []).map(a => `
        <li class="flex items-start space-x-2 text-xs text-slate-200">
            <span class="text-cyan-400 font-bold">•</span>
            <span>${a}</span>
        </li>
    `).join('');

    let retentionHtml = (advice.retention_tactics || []).map(t => `
        <li class="flex items-start space-x-2 text-xs text-slate-200">
            <span class="text-indigo-400 font-bold">•</span>
            <span>${t}</span>
        </li>
    `).join('');

    let checklistHtml = (advice.exam_week_checklist || []).map(c => `
        <li class="flex items-start space-x-2 text-xs text-slate-200">
            <span class="text-emerald-400 font-bold">✓</span>
            <span>${c}</span>
        </li>
    `).join('');

    container.innerHTML = `
        <div class="p-4 rounded-xl bg-gradient-to-r from-indigo-950/40 to-slate-900 border border-indigo-500/30 space-y-2">
            <h4 class="font-bold text-white text-sm flex items-center space-x-2">
                <i data-lucide="sparkles" class="w-4 h-4 text-indigo-400"></i>
                <span>Executive Strategy Summary</span>
            </h4>
            <p class="text-xs text-slate-300 leading-relaxed">${advice.status_summary || 'Custom study pacing applied.'}</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
                <h5 class="font-bold text-xs text-cyan-400 uppercase tracking-wider flex items-center space-x-1.5">
                    <i data-lucide="target" class="w-4 h-4"></i>
                    <span>High Priority Actions</span>
                </h5>
                <ul class="space-y-2">
                    ${highPriorityHtml}
                </ul>
            </div>

            <div class="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
                <h5 class="font-bold text-xs text-indigo-400 uppercase tracking-wider flex items-center space-x-1.5">
                    <i data-lucide="brain" class="w-4 h-4"></i>
                    <span>Cognitive Retention Tactics</span>
                </h5>
                <ul class="space-y-2">
                    ${retentionHtml}
                </ul>
            </div>

            <div class="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
                <h5 class="font-bold text-xs text-emerald-400 uppercase tracking-wider flex items-center space-x-1.5">
                    <i data-lucide="list-checks" class="w-4 h-4"></i>
                    <span>Exam Week Checklist</span>
                </h5>
                <ul class="space-y-2">
                    ${checklistHtml}
                </ul>
            </div>
        </div>
    `;

    lucide.createIcons();
}

function switchView(tab) {
    const tabs = ['calendar', 'analytics', 'advice'];
    tabs.forEach(t => {
        const viewEl = document.getElementById(`view${t.charAt(0).toUpperCase() + t.slice(1)}`);
        const btnEl = document.getElementById(`tabBtn${t.charAt(0).toUpperCase() + t.slice(1)}`);
        if (t === tab) {
            viewEl.classList.remove('hidden');
            btnEl.className = "px-4 py-2 rounded-xl text-sm font-semibold bg-cyan-600 text-white shadow-md shadow-cyan-600/20 flex items-center space-x-2 transition";
        } else {
            viewEl.classList.add('hidden');
            btnEl.className = "px-4 py-2 rounded-xl text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center space-x-2 transition";
        }
    });
}

async function downloadCalendarFile() {
    if (!currentScheduleData) return;
    try {
        const res = await fetch('/api/export-ical', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ schedule_data: currentScheduleData, name: "Student" })
        });
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Apex_AI_Study_Schedule.ics';
        document.body.appendChild(a);
        a.click();
        a.remove();
        triggerNotification('iCalendar (.ics) downloaded! Ready to import into Google / Apple Calendar.');
    } catch (e) {
        alert('Export failed: ' + e.message);
    }
}

// -------------------------------------------------------------
// Integrated Focus Pomodoro Timer with Web Audio API Synthesizer
// -------------------------------------------------------------
let pomoTimer = null;
let pomoSecondsLeft = 25 * 60;
let isPomoRunning = false;
let audioCtx = null;
let noiseNode = null;
let gainNode = null;

function initEventHandlers() {
    document.getElementById('btnFocusMode').addEventListener('click', () => {
        document.getElementById('pomodoroModal').classList.remove('hidden');
        document.getElementById('pomodoroModal').classList.add('flex');
    });

    document.getElementById('btnPrintPlan').addEventListener('click', () => {
        window.print();
    });

    document.getElementById('btnExportIcal').addEventListener('click', downloadCalendarFile);

    document.getElementById('btnThemeToggle').addEventListener('click', () => {
        document.documentElement.classList.toggle('dark');
    });
}

function closePomodoroModal() {
    document.getElementById('pomodoroModal').classList.add('hidden');
    document.getElementById('pomodoroModal').classList.remove('flex');
}

function startPomodoroFor(subject, topic, mins) {
    document.getElementById('pomoSubjectTitle').innerText = `${subject} - ${topic}`;
    setPomoDuration(mins || 25, `${subject} Focus`);
    document.getElementById('pomodoroModal').classList.remove('hidden');
    document.getElementById('pomodoroModal').classList.add('flex');
    if (!isPomoRunning) {
        togglePomodoroTimer();
    }
}

function setPomoDuration(mins, label) {
    pomoSecondsLeft = mins * 60;
    document.getElementById('pomoModeLabel').innerText = label;
    updatePomoDisplay();
}

function togglePomodoroTimer() {
    if (isPomoRunning) {
        clearInterval(pomoTimer);
        isPomoRunning = false;
        document.getElementById('pomoBtnText').innerText = "Resume Focus";
        document.getElementById('pomoPlayIcon').setAttribute('data-lucide', 'play');
    } else {
        isPomoRunning = true;
        document.getElementById('pomoBtnText').innerText = "Pause Focus";
        document.getElementById('pomoPlayIcon').setAttribute('data-lucide', 'pause');
        pomoTimer = setInterval(() => {
            if (pomoSecondsLeft > 0) {
                pomoSecondsLeft--;
                updatePomoDisplay();
            } else {
                clearInterval(pomoTimer);
                isPomoRunning = false;
                playChime();
                alert("🎉 Focus session completed! Take a well-deserved break.");
                document.getElementById('pomoBtnText').innerText = "Start Focus";
            }
        }, 1000);
    }
    lucide.createIcons();
}

function resetPomodoroTimer() {
    clearInterval(pomoTimer);
    isPomoRunning = false;
    pomoSecondsLeft = 25 * 60;
    updatePomoDisplay();
    document.getElementById('pomoBtnText').innerText = "Start Focus";
    document.getElementById('pomoPlayIcon').setAttribute('data-lucide', 'play');
    lucide.createIcons();
}

function updatePomoDisplay() {
    const mins = Math.floor(pomoSecondsLeft / 60);
    const secs = pomoSecondsLeft % 60;
    document.getElementById('pomoTimeDisplay').innerText = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function changeAmbientSound(type) {
    stopAmbientSound();
    if (type === 'none') return;

    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();

        const bufferSize = audioCtx.sampleRate * 2;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);

        if (type === 'rain' || type === 'whitenoise') {
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
        } else if (type === 'binaural') {
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.sin(i / 20) * 0.5 + Math.random() * 0.1;
            }
        }

        noiseNode = audioCtx.createBufferSource();
        noiseNode.buffer = buffer;
        noiseNode.loop = true;

        gainNode = audioCtx.createGain();
        gainNode.gain.value = type === 'rain' ? 0.04 : 0.02;

        noiseNode.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        noiseNode.start(0);
    } catch (e) {
        console.log("Audio synthesis notice:", e);
    }
}

function stopAmbientSound() {
    if (noiseNode) {
        try { noiseNode.stop(); } catch(e) {}
        noiseNode = null;
    }
}

function playChime() {
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3); // A5
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.2);
        osc.start();
        osc.stop(audioCtx.currentTime + 1.2);
    } catch(e) {}
}

function triggerNotification(msg) {
    const notif = document.createElement('div');
    notif.className = "fixed bottom-5 right-5 bg-cyan-600 text-white px-4 py-2.5 rounded-xl shadow-2xl text-xs font-semibold z-50 transition transform duration-300";
    notif.innerText = msg;
    document.body.appendChild(notif);
    setTimeout(() => {
        notif.style.opacity = '0';
        setTimeout(() => notif.remove(), 300);
    }, 3000);
}

function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}