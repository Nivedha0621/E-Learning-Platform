// Legacy script extracted from original index.html.
// For now export an init function that mounts behavior to the DOM.
// We'll keep the original functions available so the markup works inside React.

export async function initLegacy(root=document){
  // This file intentionally lightweight — the full logic is large.
  // To keep migration incremental, we simply attach the original script
  // by creating a script tag that loads the original inline logic.
  // In a later iteration we should refactor functions into React components.
  const script = document.createElement('script');
  script.type = 'text/javascript';
  script.text = `/* Legacy inline script was moved to a separate file during migration. */`;
  root.body.appendChild(script);
}
/* Legacy script migrated from original index.html.
   This file expects the DOM elements to already exist when imported.
   It also expects `window.supabase` (CDN) to be available (index.html includes it).
*/

/* ════════════════════════════════════════════════
   SUPABASE CONFIG — REPLACE THESE TWO VALUES
   ════════════════════════════════════════════════ */
const SUPABASE_URL = "https://mdbxbayhztxqowqqqpoe.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kYnhiYXloenR4cW93cXFxcG9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNDMzNjksImV4cCI6MjA5NDkxOTM2OX0.I2XO9bN4xqaeWN8OvgosjuXeOV9JJeDGVJZFkhiaoK8";
/* ════════════════════════════════════════════════
   END CONFIG
   ════════════════════════════════════════════════ */

let sb;
const TABLE     = "student_marks";
const ATT_TABLE = "student_attendance";

const SUBJECTS   = ['Mathematics','Physics','Chemistry','Biology','Computer Science'];
const SUB_ICONS  = ['📐','⚛️','🧪','🧬','💻'];
const SUB_COLORS = ['#4f46e5','#0ea5e9','#10b981','#f59e0b','#ef4444'];
const SUB_LITES  = ['#ede9fe','#dbeafe','#d1fae5','#fef3c7','#fee2e2'];
const AVT_GRADS  = [
  ['#6366f1','#4f46e5'],['#0ea5e9','#0284c7'],['#10b981','#059669'],
  ['#f59e0b','#d97706'],['#ef4444','#dc2626'],['#8b5cf6','#7c3aed'],
  ['#06b6d4','#0891b2'],['#84cc16','#65a30d'],['#f43f5e','#e11d48'],['#a855f7','#9333ea']
];
const STUDENT_NAMES = ['Arun Kumar','Priya Sharma','Rahul Patel','Sneha Nair','Karthik Raj','Divya Menon','Vikram Singh','Ananya Reddy','Arjun Das','Meera Iyer'];

let allRows = [];
let allAtt  = [];
let todayStatus = {}; // student_no -> status for selected date

/* ── SQL for attendance table (run in Supabase SQL editor):
CREATE TABLE student_attendance (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  student_no int NOT NULL,
  student_name text NOT NULL,
  att_date date NOT NULL,
  status text NOT NULL CHECK (status IN ('present','absent','late')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(student_no, att_date)
);
ALTER TABLE student_attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all" ON student_attendance FOR ALL USING (true) WITH CHECK (true);
*/

async function init() {
  // Wait for window.supabase CDN to be ready
  let attempts = 0;
  while (!window.supabase && attempts < 50) {
    await new Promise(r => setTimeout(r, 100));
    attempts++;
  }
  if (!window.supabase) {
    toast('Supabase CDN failed to load.', 'err');
    return;
  }
  sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Populate subject dropdowns
  const subjectOptions = ['<option value="">All Subjects</option>', ...SUBJECTS.map(s => `<option value="${s}">${s}</option>`)].join('');
  const examOptions = ['<option value="">All Exams</option>', ...['exam1','exam2','exam3','exam4','exam5'].map((e,i) => `<option value="${e}">Exam ${i+1}</option>`)].join('');
  const fSubOpts = SUBJECTS.map(s => `<option value="${s}">${s}</option>`).join('');
  const filterSubEl = document.getElementById('filterSubject');
  if (filterSubEl) filterSubEl.innerHTML = subjectOptions;
  const filterExamEl = document.getElementById('filterExam');
  if (filterExamEl) filterExamEl.innerHTML = examOptions;
  const fSubEl = document.getElementById('fSub');
  if (fSubEl) fSubEl.innerHTML = fSubOpts;

  // Set today's date as default
  const today = new Date().toISOString().split('T')[0];
  const el = document.getElementById('attDate');
  if (el) el.value = today;
  try {
    await loadData();
    setDbStatus(true);
  } catch(e) {
    setDbStatus(false);
    toast('Could not reach Supabase. Check URL/key.', 'err');
  }
}

function setDbStatus(ok) {
  const d = document.getElementById('dbDot');
  if (!d) return;
  d.className = 'db-indicator' + (ok ? '' : ' off');
}

async function loadData() {
  const [marksRes, attRes] = await Promise.all([
    sb.from(TABLE).select('*').order('student_no').order('subject'),
    sb.from(ATT_TABLE).select('*').order('att_date').order('student_no')
  ]);
  if (marksRes.error) throw marksRes.error;
  if (attRes.error)   throw attRes.error;
  allRows = marksRes.data || [];
  allAtt  = attRes.data  || [];

  // Sync todayStatus with loaded database values for currently selected date
  const date = document.getElementById('attDate')?.value;
  if (date) {
    allAtt.filter(r => r.att_date === date).forEach(r => {
      todayStatus[r.student_no] = r.status;
    });
  }

  const nb = document.getElementById('navBadge'); if (nb) nb.textContent = allRows.length;
  renderAll();
}

function renderAll() {
  renderKPIs();
  renderPerfCards();
  renderTopPreview();
  renderMarksTable(allRows);
  renderStudentGrid();
  renderAnalytics();
  renderAttKPIs();
  renderAttMarkTable();
  renderAttSummary();
}

/* ── HELPERS ── */
function groupByStudent(rows) {
  const map = {};
  rows.forEach(r => {
    if (!map[r.student_no]) map[r.student_no] = { name:r.student_name, no:r.student_no, subjects:{} };
    map[r.student_no].subjects[r.subject] = r;
  });
  return Object.values(map).sort((a,b) => a.no-b.no);
}
function studentAvg(s) {
  let t=0,c=0;
  Object.values(s.subjects).forEach(r => {
    [r.exam1,r.exam2,r.exam3,r.exam4,r.exam5].forEach(v => { if(v!=null){t+=+v;c++;} });
  });
  return c ? t/c : 0;
}
function scoreClass(v) {
  if(v==null) return ''; const n=+v;
  if(n>=80) return 's-ex'; if(n>=60) return 's-gd'; if(n>=40) return 's-ok'; return 's-fl';
}
function scoreColor(v) {
  if(v==null||v==='') return 'var(--text-3)'; const n=+v;
  if(n>=80) return 'var(--green)'; if(n>=60) return 'var(--accent)'; if(n>=40) return 'var(--amber)'; return 'var(--red)';
}
function initials(name) { return name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase(); }
function rnd(a,b) { return Math.floor(Math.random()*(b-a+1))+a; }

/* ── ATTENDANCE HELPERS ── */
function getAttPct(studentNo) {
  const rows = allAtt.filter(r => r.student_no == studentNo);
  if (!rows.length) return null;
  const present = rows.filter(r => r.status === 'present' || r.status === 'late').length;
  return Math.round(present / rows.length * 100);
}
function attPctColor(pct) {
  if (pct == null) return 'var(--text-3)';
  if (pct >= 85) return 'var(--green)';
  if (pct >= 75) return 'var(--amber)';
  return 'var(--red)';
}

/* ── KPIs ── */
function renderKPIs() {
  const students = groupByStudent(allRows);
  const kTotal = document.getElementById('kTotal'); if (kTotal) kTotal.textContent = students.length || '0';
  const kTotalTrend = document.getElementById('kTotalTrend'); if (kTotalTrend) kTotalTrend.textContent = students.length + ' enrolled';

  const allMarks = allRows.flatMap(r => [r.exam1,r.exam2,r.exam3,r.exam4,r.exam5].filter(v=>v!=null).map(Number));
  const avg = allMarks.length ? (allMarks.reduce((a,b)=>a+b,0)/allMarks.length).toFixed(1) : '—';
  const kAvg = document.getElementById('kAvg'); if (kAvg) kAvg.textContent = avg;
  const kAvgTrend = document.getElementById('kAvgTrend'); if (kAvgTrend) kAvgTrend.textContent = avg !== '—' ? (avg>=60?'↑ Good':'↓ Low') : '—';

  const pcts = students.map(s => getAttPct(s.no)).filter(p=>p!=null);
  const attAvg = pcts.length ? Math.round(pcts.reduce((a,b)=>a+b,0)/pcts.length) : null;
  const kAtt = document.getElementById('kAtt'); if (kAtt) kAtt.textContent = attAvg != null ? attAvg+'%' : '—';
  const kAttTrend = document.getElementById('kAttTrend'); if (kAttTrend) kAttTrend.textContent = attAvg != null ? (attAvg>=75?'↑ Good':'↓ Low') : '—';

  const ranked = students.map(s => ({...s, avg:studentAvg(s)})).sort((a,b)=>b.avg-a.avg);
  const passed = ranked.filter(s=>s.avg>=50).length;
  const pct = ranked.length ? Math.round(passed/ranked.length*100) : 0;
  const kPass = document.getElementById('kPass'); if (kPass) kPass.textContent = pct + '%';
  const kPassTrend = document.getElementById('kPassTrend'); if (kPassTrend) kPassTrend.textContent = passed+'/'+ranked.length+' passed';
}

/* ── PERF CARDS ── */
function renderPerfCards() {
  const subjAvg = {};
  SUBJECTS.forEach(s => subjAvg[s]=[]);
  allRows.forEach(r => {
    if(subjAvg[r.subject]) [r.exam1,r.exam2,r.exam3,r.exam4,r.exam5].forEach(v=>{if(v!=null)subjAvg[r.subject].push(+v)});
  });
  const perfGrid = document.getElementById('perfGrid'); if (!perfGrid) return;
  perfGrid.innerHTML = SUBJECTS.map((s,i) => {
    const marks = subjAvg[s];
    const avg = marks.length ? (marks.reduce((a,b)=>a+b,0)/marks.length).toFixed(1) : '—';
    const pct = avg !== '—' ? avg : 0;
    return `<div class="perf-card" style="border-top:3px solid ${SUB_COLORS[i]}">
      <div class="perf-icon">${SUB_ICONS[i]}</div>
      <div class="perf-name">${s}</div>
      <div class="perf-avg" style="color:${SUB_COLORS[i]}">${avg}</div>
      <div class="perf-meta">${marks.length} marks</div>
      <div class="perf-bar"><div class="perf-fill" style="width:${pct}%;background:${SUB_COLORS[i]}"></div></div>
    </div>`;
  }).join('');
}

/* ── TOP PREVIEW ── */
function renderTopPreview() {
  const students = groupByStudent(allRows).map(s=>({...s,avg:studentAvg(s)})).sort((a,b)=>b.avg-a.avg).slice(0,5);
  const topPreview = document.getElementById('topPreview'); if (!topPreview) return;
  if (!students.length) { topPreview.innerHTML='<div class="empty-state"><div class="ico">📭</div><h3>No data yet</h3><p>Click Seed Data to populate.</p></div>'; return; }
  topPreview.innerHTML = `<table>
    <thead><tr><th>Rank</th><th>Student</th><th>Avg</th><th>Attendance</th>${SUBJECTS.map(s=>`<th>${s.split(' ')[0]}</th>`).join('')}</tr></thead>
    <tbody>${students.map((s,i) => {
      const rc = i===0?'r1':i===1?'r2':i===2?'r3':'rn';
      const [g1,g2] = AVT_GRADS[(s.no-1)%AVT_GRADS.length];
      const pct = getAttPct(s.no);
      const subAvgs = SUBJECTS.map(sub => {
        const r=s.subjects[sub]; if(!r) return '—';
        const v=[r.exam1,r.exam2,r.exam3,r.exam4,r.exam5].filter(v=>v!=null).map(Number);
        return v.length?(v.reduce((a,b)=>a+b,0)/v.length).toFixed(0):'—';
      });
      return `<tr>
        <td><span class="rank-badge ${rc}">${i+1}</span></td>
        <td><div class="stu-cell"><div class="stu-avatar" style="background:linear-gradient(135deg,${g1},${g2})">${initials(s.name)}</div><div><div class="stu-name">${s.name}</div><div class="stu-id">S${String(s.no).padStart(2,'0')}</div></div></div></td>
        <td><span class="avg-score" style="color:${scoreColor(s.avg)}">${s.avg.toFixed(1)}</span></td>
        <td><span style="font-family:var(--mono);font-size:13px;font-weight:700;color:${attPctColor(pct)}">${pct!=null?pct+'%':'—'}</span></td>
        ${subAvgs.map(a=>`<td><span class="score-pill ${scoreClass(a)}">${a}</span></td>`).join('')}
      </tr>`;
    }).join('')}</tbody></table>`;
}

/* ── MARKS TABLE ── */
function renderMarksTable(rows) {
  const wrap = document.getElementById('marksTableWrap'); if (!wrap) return;
  const fSub  = document.getElementById('filterSubject')?.value||'';
  const fExam = document.getElementById('filterExam')?.value||'';
  let filtered = rows;
  if (fSub) filtered = filtered.filter(r=>r.subject===fSub);
  const students = groupByStudent(filtered).map(s=>({...s,avg:studentAvg(s)})).sort((a,b)=>b.avg-a.avg);
  if (!students.length) { wrap.innerHTML='<div class="empty-state"><div class="ico">🗂️</div><h3>No records found</h3></div>'; return; }
  const exams = fExam ? [fExam] : ['exam1','exam2','exam3','exam4','exam5'];
  const eLabels = {exam1:'E1',exam2:'E2',exam3:'E3',exam4:'E4',exam5:'E5'};
  const subjects = fSub ? [fSub] : SUBJECTS;
  let html = `<table><thead><tr><th>#</th><th>Student</th>
    ${subjects.map((s,i)=>`<th colspan="${exams.length+1}" style="text-align:center;color:${SUB_COLORS[SUBJECTS.indexOf(s)]};border-left:2px solid ${SUB_LITES[SUBJECTS.indexOf(s)]}">${SUB_ICONS[SUBJECTS.indexOf(s)]} ${s}</th>`).join('')}
    <th>Att%</th><th>Overall</th><th>Actions</th></tr>
  <tr style="background:#f8fafc"><th></th><th></th>
    ${subjects.map(()=>[...exams.map(e=>`<th>${eLabels[e]}</th>`),'<th>Avg</th>'].join('')).join('')}
    <th></th><th></th><th></th></tr></thead><tbody>`;
  students.forEach((s,idx) => {
    const rc = idx===0?'r1':idx===1?'r2':idx===2?'r3':'rn';
    const [g1,g2] = AVT_GRADS[(s.no-1)%AVT_GRADS.length];
    const pct = getAttPct(s.no);
    html += `<tr><td><span class="rank-badge ${rc}">${idx+1}</span></td>
      <td><div class="stu-cell"><div class="stu-avatar" style="background:linear-gradient(135deg,${g1},${g2})">${initials(s.name)}</div><div><div class="stu-name">${s.name}</div><div class="stu-id">No.${s.no}</div></div></div></td>`;
    subjects.forEach(sub => {
      const r=s.subjects[sub];
      if(r){
        const vals=exams.map(e=>r[e]); const valid=vals.filter(v=>v!=null).map(Number);
        const subA=valid.length?(valid.reduce((a,b)=>a+b,0)/valid.length).toFixed(1):'—';
        vals.forEach(v=>{ html+=`<td><span class="score-pill ${scoreClass(v)}">${v!=null?v:'—'}</span></td>`; });
        html+=`<td style="border-right:2px solid var(--border)"><b style="font-family:var(--mono);font-size:13px;color:${scoreColor(subA)}">${subA}</b></td>`;
      } else {
        html+=`<td colspan="${exams.length+1}" style="text-align:center;color:var(--text-3);font-size:12px;border-right:2px solid var(--border)">—</td>`;
      }
    });
    html+=`<td><span style="font-family:var(--mono);font-size:13px;font-weight:700;color:${attPctColor(pct)}">${pct!=null?pct+'%':'—'}</span></td>
      <td><b class="avg-score" style="color:${scoreColor(s.avg)}">${s.avg.toFixed(1)}</b></td>
      <td><div class="flex-gap">
        <button class="btn btn-outline btn-sm" onclick='prefillEdit(${JSON.stringify({name:s.name,no:s.no,subjects:s.subjects})})'>Edit</button>
        <button class="btn btn-danger btn-sm" onclick="delStudent(${s.no},'${s.name.replace(/'/g,"\\'")}')">Del</button>
      </div></td></tr>`;
  });
  html += '</tbody></table>';
  wrap.innerHTML = html;
}
function applyFilter() { renderMarksTable(allRows); }

/* ── ATTENDANCE KPIs ── */
function renderAttKPIs() {
  const days = [...new Set(allAtt.map(r=>r.att_date))].length;
  const elDays = document.getElementById('attDays'); if (elDays) elDays.textContent = days;
  const students = groupByStudent(allRows);
  const pcts = students.map(s=>getAttPct(s.no)).filter(p=>p!=null);
  const avg = pcts.length ? Math.round(pcts.reduce((a,b)=>a+b,0)/pcts.length) : '—';
  const elAvg = document.getElementById('attAvg'); if (elAvg) elAvg.textContent = avg !== '—' ? avg+'%' : '—';
  const elLow = document.getElementById('attLow'); if (elLow) elLow.textContent = pcts.filter(p=>p<75).length;
  const elLate = document.getElementById('attLate'); if (elLate) elLate.textContent = allAtt.filter(r=>r.status==='late').length;
}

/* ── MARK ATTENDANCE TABLE ── */
function renderAttMarkTable() {
  const wrap = document.getElementById('attMarkWrap'); if (!wrap) return;
  const students = groupByStudent(allRows);
  const date = document.getElementById('attDate')?.value;
  if (!students.length) { wrap.innerHTML='<div class="empty-state"><div class="ico">📭</div><h3>No students found</h3><p>Seed marks data first.</p></div>'; return; }
  const dayMap = {};
  allAtt.filter(r=>r.att_date===date).forEach(r => { dayMap[r.student_no]=r.status; });
  students.forEach(s => { if(todayStatus[s.no]) dayMap[s.no]=todayStatus[s.no]; });

  let html = `<table><thead><tr><th>Student</th><th>Status</th><th>Overall Attendance</th><th>Days Present</th><th>Days Absent</th><th>Days Late</th></tr></thead><tbody>`;
  students.forEach(s => {
    const [g1,g2] = AVT_GRADS[(s.no-1)%AVT_GRADS.length];
    const cur = dayMap[s.no] || '';
    const attRows = allAtt.filter(r=>r.student_no==s.no);
    const total = attRows.length; const pres=attRows.filter(r=>r.status==='present').length;
    const abs=attRows.filter(r=>r.status==='absent').length; const late=attRows.filter(r=>r.status==='late').length;
    const pct = getAttPct(s.no);
    html += `<tr>
      <td><div class="stu-cell"><div class="stu-avatar" style="background:linear-gradient(135deg,${g1},${g2})">${initials(s.name)}</div><div><div class="stu-name">${s.name}</div><div class="stu-id">S${String(s.no).padStart(2,'0')}</div></div></div></td>
      <td><div class="flex-gap">
        <button class="att-btn present ${cur==='present'?'on':''}" onclick="setStatus(${s.no},'present',this)">✅ Present</button>
        <button class="att-btn absent ${cur==='absent'?'on':''}" onclick="setStatus(${s.no},'absent',this)">❌ Absent</button>
        <button class="att-btn late ${cur==='late'?'on':''}" onclick="setStatus(${s.no},'late',this)">⏰ Late</button>
      </div></td>
      <td>
        <span style="font-family:var(--mono);font-size:13px;font-weight:700;color:${attPctColor(pct)}">${pct!=null?pct+'%':'—'}</span>
        <div style="width:90px;height:5px;border-radius:3px;background:var(--border);margin-top:5px;overflow:hidden"><div style="height:100%;border-radius:3px;background:${attPctColor(pct)};width:${pct||0}%"></div></div>
      </td>
      <td style="font-family:var(--mono);font-size:13px;color:var(--green)">${pres}</td>
      <td style="font-family:var(--mono);font-size:13px;color:var(--red)">${abs}</td>
      <td style="font-family:var(--mono);font-size:13px;color:var(--amber)">${late}</td>
    </tr>`;
  });
  html += '</tbody></table>';
  wrap.innerHTML = html;
}

async function setStatus(no, status, btn) {
  todayStatus[no] = status;
  const row = btn.closest('tr');
  if (!row) return;
  row.querySelectorAll('.att-btn').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');

  const dateEl = document.getElementById('attDate');
  const date = dateEl?.value;
  if (!date) { toast('Select a date first', 'err'); return; }

  const student = allRows.find(r => r.student_no === no);
  const student_name = student ? student.student_name : 'Student';
  const toSave = {
    student_no: no,
    student_name: student_name,
    att_date: date,
    status: status
  };

  // Optimistically update local cache so KPIs and summaries react instantly
  const existingIdx = allAtt.findIndex(r => r.student_no === no && r.att_date === date);
  if (existingIdx >= 0) {
    allAtt[existingIdx].status = status;
  } else {
    allAtt.push(toSave);
  }

  // Update UI components instantly
  renderKPIs();
  renderAttKPIs();
  renderAttSummary();
  renderTopPreview();
  renderStudentGrid();

  try {
    const { error } = await sb.from(ATT_TABLE).upsert(toSave, { onConflict: 'student_no,att_date' });
    if (error) {
      toast('Failed to save to Supabase: ' + error.message, 'err');
    }
  } catch(e) {
    toast('Error: ' + e.message, 'err');
  }
}

async function markAll(status) {
  const dateEl = document.getElementById('attDate');
  const date = dateEl?.value;
  if (!date) { toast('Select a date first', 'err'); return; }
  const students = groupByStudent(allRows);
  if (!students.length) { toast('No students found', 'err'); return; }

  students.forEach(s => todayStatus[s.no] = status);
  renderAttMarkTable();

  const toSave = students.map(s => ({
    student_no: s.no,
    student_name: s.name,
    att_date: date,
    status: status
  }));

  // Optimistically update local cache
  toSave.forEach(item => {
    const existingIdx = allAtt.findIndex(r => r.student_no === item.student_no && r.att_date === date);
    if (existingIdx >= 0) {
      allAtt[existingIdx].status = status;
    } else {
      allAtt.push(item);
    }
  });

  // Update UI components instantly
  renderKPIs();
  renderAttKPIs();
  renderAttSummary();
  renderTopPreview();
  renderStudentGrid();

  toast(`Saving attendance for all…`, 'info');
  try {
    const { error } = await sb.from(ATT_TABLE).upsert(toSave, { onConflict: 'student_no,att_date' });
    if (error) {
      toast('Error: ' + error.message, 'err');
      return;
    }
    toast(`All students marked as ${status}!`, 'ok');
  } catch(e) {
    toast('Error: ' + e.message, 'err');
  }
}

async function loadAttForDate() {
  todayStatus = {};
  const date = document.getElementById('attDate')?.value;
  if (date) {
    allAtt.filter(r => r.att_date === date).forEach(r => {
      todayStatus[r.student_no] = r.status;
    });
  }
  renderAttMarkTable();
}

async function saveAttendance() {
  const dateEl = document.getElementById('attDate');
  const date = dateEl?.value;
  if (!date) { toast('Select a date first', 'err'); return; }
  const students = groupByStudent(allRows);
  const toSave = students.map(s => ({
    student_no: s.no,
    student_name: s.name,
    att_date: date,
    status: todayStatus[s.no] || 'absent'
  }));
  if (!toSave.length) { toast('No students found', 'err'); return; }
  toast('Saving attendance…', 'info');
  const { error } = await sb.from(ATT_TABLE).upsert(toSave, { onConflict: 'student_no,att_date' });
  if (error) { toast('Error: ' + error.message, 'err'); return; }
  toast(`Attendance saved for ${date}!`, 'ok');
  todayStatus = {};
  await loadData();
}

/* ── ATTENDANCE SUMMARY TABLE ── */
function renderAttSummary() {
  const students = groupByStudent(allRows).map(s=>({...s,avg:studentAvg(s)})).sort((a,b)=>b.avg-a.avg);
  const wrap = document.getElementById('attSummaryWrap'); if (!wrap) return;
  if (!students.length) { wrap.innerHTML='<div class="empty-state"><div class="ico">📅</div><h3>No data</h3></div>'; return; }

  let html = `<table><thead><tr><th>#</th><th>Student</th><th>Total Days</th><th>Present</th><th>Absent</th><th>Late</th><th>Attendance %</th><th>Status</th></tr></thead><tbody>`;
  students.forEach((s,i) => {
    const [g1,g2] = AVT_GRADS[(s.no-1)%AVT_GRADS.length];
    const rows = allAtt.filter(r=>r.student_no==s.no);
    const total=rows.length; const pres=rows.filter(r=>r.status==='present').length;
    const abs=rows.filter(r=>r.status==='absent').length; const late=rows.filter(r=>r.status==='late').length;
    const pct = getAttPct(s.no);
    const statusLabel = pct==null?'<span style="color:var(--text-3)">No Data</span>':pct>=85?'<span style="background:var(--green-lt);color:#047857;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700">Excellent</span>':pct>=75?'<span style="background:var(--amber-lt);color:#92400e;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700">Low</span>':'<span style="background:var(--red-lt);color:#b91c1c;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700">At Risk</span>';
    const rc = i===0?'r1':i===1?'r2':i===2?'r3':'rn';
    html += `<tr>
      <td><span class="rank-badge ${rc}">${i+1}</span></td>
      <td><div class="stu-cell"><div class="stu-avatar" style="background:linear-gradient(135deg,${g1},${g2})">${initials(s.name)}</div><div><div class="stu-name">${s.name}</div><div class="stu-id">S${String(s.no).padStart(2,'0')}</div></div></div></td>
      <td style="font-family:var(--mono)">${total}</td>
      <td style="font-family:var(--mono);color:var(--green);font-weight:700">${pres}</td>
      <td style="font-family:var(--mono);color:var(--red);font-weight:700">${abs}</td>
      <td style="font-family:var(--mono);color:var(--amber);font-weight:700">${late}</td>
      <td>
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-family:var(--mono);font-weight:800;font-size:14px;color:${attPctColor(pct)}">${pct!=null?pct+'%':'—'}</span>
          <div style="width:80px;height:6px;border-radius:3px;background:var(--border);overflow:hidden"><div style="height:100%;border-radius:3px;background:${attPctColor(pct)};width:${pct||0}%"></div></div>
        </div>
      </td>
      <td>${statusLabel}</td>
    </tr>`;
  });
  html += '</tbody></table>';
  wrap.innerHTML = html;
}

/* ── STUDENTS GRID ── */
function renderStudentGrid() {
  const grid = document.getElementById('stuGrid'); if (!grid) return;
  const students = groupByStudent(allRows).map(s=>({...s,avg:studentAvg(s)})).sort((a,b)=>b.avg-a.avg);
  if (!students.length) { grid.innerHTML='<div class="empty-state" style="grid-column:1/-1"><div class="ico">👨‍🎓</div><h3>No students</h3></div>'; return; }
  grid.innerHTML = students.map((s,i) => {
    const [g1,g2] = AVT_GRADS[(s.no-1)%AVT_GRADS.length];
    const pct = getAttPct(s.no);
    return `<div class="stu-card">
      <div class="stu-card-avatar" style="background:linear-gradient(135deg,${g1},${g2})">${initials(s.name)}</div>
      <div class="stu-card-name">${s.name}</div>
      <div class="stu-card-id">S${String(s.no).padStart(2,'0')} · Rank #${i+1}</div>
      <div class="stu-card-avg" style="color:${scoreColor(s.avg)}">${s.avg.toFixed(1)}</div>
      <div class="stu-card-lbl">Marks Average</div>
      <div style="margin-top:8px;padding:8px;background:var(--bg);border-radius:8px">
        <div style="font-size:11px;color:var(--text-3);margin-bottom:3px">Attendance</div>
        <div style="font-family:var(--mono);font-weight:800;font-size:16px;color:${attPctColor(pct)}">${pct!=null?pct+'%':'—'}</div>
        <div style="height:4px;border-radius:2px;background:var(--border);overflow:hidden;margin-top:4px"><div style="height:100%;border-radius:2px;background:${attPctColor(pct)};width:${pct||0}%"></div></div>
      </div>
      <div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:4px;justify-content:center">
        ${SUBJECTS.map((sub,si)=>{ const r=s.subjects[sub]; if(!r) return ''; const v=[r.exam1,r.exam2,r.exam3,r.exam4,r.exam5].filter(v=>v!=null).map(Number); const a=v.length?(v.reduce((x,y)=>x+y,0)/v.length).toFixed(0):null; return a?`<span class="score-pill ${scoreClass(a)}" style="font-size:10px" title="${sub}">${SUB_ICONS[si]} ${a}</span>`:''; }).join('')}
      </div>
    </div>`;
  }).join('');
}

/* ── ANALYTICS ── */
function renderAnalytics() {
  const content = document.getElementById('analyticsContent'); if (!content) return;
  let html = `<div class="card" style="margin-bottom:20px">
    <div class="card-header"><div><div class="card-title">Exam-wise Class Averages</div><div class="card-sub">Per subject per exam</div></div></div>
    <div style="padding:0 0 8px"><div class="table-wrap"><table>
    <thead><tr><th>Subject</th><th>Exam 1</th><th>Exam 2</th><th>Exam 3</th><th>Exam 4</th><th>Exam 5</th><th>Overall</th></tr></thead><tbody>`;
  SUBJECTS.forEach((sub,si) => {
    const sr=allRows.filter(r=>r.subject===sub);
    const ea=['exam1','exam2','exam3','exam4','exam5'].map(e=>{ const v=sr.map(r=>r[e]).filter(v=>v!=null).map(Number); return v.length?(v.reduce((a,b)=>a+b,0)/v.length).toFixed(1):'—'; });
    const all=sr.flatMap(r=>[r.exam1,r.exam2,r.exam3,r.exam4,r.exam5].filter(v=>v!=null).map(Number));
    const ov=all.length?(all.reduce((a,b)=>a+b,0)/all.length).toFixed(1):'—';
    html+=`<tr><td><span style="color:${SUB_COLORS[si]};font-weight:600">${SUB_ICONS[si]} ${sub}</span></td>${ea.map(v=>`<td><span class="score-pill ${scoreClass(v)}">${v}</span></td>`).join('')}<td><b style="font-family:var(--mono);color:${scoreColor(ov)}">${ov}</b></td></tr>`;
  });
  html += `</tbody></table></div></div></div>`;

  const allMarks=allRows.flatMap(r=>[r.exam1,r.exam2,r.exam3,r.exam4,r.exam5].filter(v=>v!=null).map(Number));
  const dist={A:0,B:0,C:0,F:0};
  allMarks.forEach(v=>{if(v>=80)dist.A++;else if(v>=60)dist.B++;else if(v>=40)dist.C++;else dist.F++;});
  const tot=allMarks.length||1;
  html+=`<div class="card">
    <div class="card-header"><div><div class="card-title">Grade Distribution</div><div class="card-sub">${allMarks.length} total marks recorded</div></div></div>
    <div style="padding:18px 22px;display:grid;grid-template-columns:repeat(4,1fr);gap:14px">
      ${[['A','80+','s-ex',dist.A],['B','60–79','s-gd',dist.B],['C','40–59','s-ok',dist.C],['F','<40','s-fl',dist.F]].map(([g,l,cls,cnt])=>`
        <div style="text-align:center;padding:20px;background:var(--bg);border-radius:12px">
          <div style="font-size:28px;font-weight:800;font-family:var(--mono)">${cnt}</div>
          <div style="margin:6px 0"><span class="score-pill ${cls}">${g} (${l})</span></div>
          <div style="font-size:12px;font-weight:600;color:var(--text-2)">${(cnt/tot*100).toFixed(1)}%</div>
        </div>`).join('')}
    </div>
  </div>`;
  content.innerHTML = html;
}

/* ── MODAL ── */
function openModal() {
  const title = document.getElementById('modalTitle'); if (title) title.textContent='Add Student Record';
  ['fName','fNo','fE1','fE2','fE3','fE4','fE5','fEditId'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value='';});
  const fsub = document.getElementById('fSub'); if (fsub) fsub.value='Mathematics';
  const bg = document.getElementById('modalBg'); if (bg) bg.classList.add('open');
}
function prefillEdit(s) {
  const title = document.getElementById('modalTitle'); if (title) title.textContent='Edit: '+s.name;
  const fn = document.getElementById('fName'); if (fn) fn.value=s.name;
  const fno = document.getElementById('fNo'); if (fno) fno.value=s.no;
  const fsub=Object.keys(s.subjects)[0];
  if(fsub){ const r=s.subjects[fsub]; const fsubEl=document.getElementById('fSub'); if(fsubEl) fsubEl.value=fsub; if(document.getElementById('fE1')) document.getElementById('fE1').value=r.exam1??''; if(document.getElementById('fE2')) document.getElementById('fE2').value=r.exam2??''; if(document.getElementById('fE3')) document.getElementById('fE3').value=r.exam3??''; if(document.getElementById('fE4')) document.getElementById('fE4').value=r.exam4??''; if(document.getElementById('fE5')) document.getElementById('fE5').value=r.exam5??''; }
  const bg = document.getElementById('modalBg'); if (bg) bg.classList.add('open');
}
function closeModal() { const bg=document.getElementById('modalBg'); if(bg) bg.classList.remove('open'); }
const modalBgEl = document.getElementById('modalBg'); if (modalBgEl) modalBgEl.addEventListener('click',e=>{ if(e.target===modalBgEl)closeModal(); });

async function saveRecord() {
  const nameEl=document.getElementById('fName'); const noEl=document.getElementById('fNo'); const subEl=document.getElementById('fSub');
  const name=nameEl?.value.trim(); const no=parseInt(noEl?.value); const sub=subEl?.value;
  if(!name||!no){toast('Name and number required','err');return;}
  const vals={student_name:name,student_no:no,subject:sub,exam1:parseFloat(document.getElementById('fE1').value)||null,exam2:parseFloat(document.getElementById('fE2').value)||null,exam3:parseFloat(document.getElementById('fE3').value)||null,exam4:parseFloat(document.getElementById('fE4').value)||null,exam5:parseFloat(document.getElementById('fE5').value)||null};
  try{
    const{data:ex} = await sb.from(TABLE).select('id').eq('student_no',no).eq('subject',sub).limit(1);
    let res;
    if(ex?.length){ res = await sb.from(TABLE).update(vals).eq('id',ex[0].id); }
    else { res = await sb.from(TABLE).insert(vals); }
    if(res.error) throw res.error;
    toast('Saved!','ok'); closeModal(); await loadData();
  }catch(e){toast('Error: '+e.message,'err');}
}
async function delStudent(no,name){
  if(!confirm(`Delete all records for ${name}?`))return;
  const{error}=await sb.from(TABLE).delete().eq('student_no',no);
  if(error){toast('Error: '+error.message,'err');return;}
  toast(`${name} deleted`,'ok'); await loadData();
}

/* ── SEED ── */
async function seedData(){
  const rows=[];
  STUDENT_NAMES.forEach((name,i)=>{SUBJECTS.forEach(sub=>{ rows.push({student_no:i+1,student_name:name,subject:sub,exam1:rnd(45,98),exam2:rnd(45,98),exam3:rnd(45,98),exam4:rnd(45,98),exam5:rnd(45,98)}); }); });
  toast('Seeding 50 marks records…','info');
  const{error}=await sb.from(TABLE).insert(rows);
  if(error){toast('Seed error: '+error.message,'err');return;}
  toast('50 marks records seeded!','ok'); await loadData();
}

async function seedAttendance(){
  const rows=[];
  const today=new Date();
  for(let d=19;d>=0;d--){
    const date=new Date(today); date.setDate(today.getDate()-d);
    const dateStr=date.toISOString().split('T')[0];
    STUDENT_NAMES.forEach((name,i)=>{
      const statuses=['present','present','present','present','absent','late'];
      rows.push({student_no:i+1,student_name:name,att_date:dateStr,status:statuses[rnd(0,5)]});
    });
  }
  toast('Seeding 200 attendance records…','info');
  const{error}=await sb.from(ATT_TABLE).upsert(rows,{onConflict:'student_no,att_date'});
  if(error){toast('Seed error: '+error.message,'err');return;}
  toast('20 days of attendance seeded!','ok'); await loadData();
}

async function clearAllData(){
  if(!confirm('Delete ALL marks records?'))return;
  const{error}=await sb.from(TABLE).delete().neq('id','00000000-0000-0000-0000-000000000000');
  if(error){toast('Error: '+error.message,'err');return;}
  toast('All marks cleared','ok'); await loadData();
}

/* ── EXPORTS ── */
function dlCSV(rows,name){const csv=rows.map(r=>r.join(',')).join('\n');const a=document.createElement('a');a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv);a.download=name;a.click();}
function exportCSV(){const h=['No','Name','Subject','E1','E2','E3','E4','E5','Avg'];const b=allRows.map(r=>{const v=[r.exam1,r.exam2,r.exam3,r.exam4,r.exam5].filter(v=>v!=null).map(Number);const a=v.length?(v.reduce((x,y)=>x+y,0)/v.length).toFixed(1):'';return[r.student_no,r.student_name,r.subject,r.exam1??'',r.exam2??'',r.exam3??'',r.exam4??'',r.exam5??'',a];});dlCSV([h,...b],'marks_full.csv');toast('Exported','ok');}
function exportRankCSV(){const s=groupByStudent(allRows).map(s=>({...s,avg:studentAvg(s)})).sort((a,b)=>b.avg-a.avg);dlCSV([['Rank','No','Name','Avg','Grade'],...s.map((s,i)=>[i+1,s.no,s.name,s.avg.toFixed(1),s.avg>=80?'A':s.avg>=60?'B':s.avg>=40?'C':'F'])],'rank_sheet.csv');toast('Exported','ok');}
function exportSubjectCSV(){const h=['Subject','E1 Avg','E2 Avg','E3 Avg','E4 Avg','E5 Avg','Overall'];const b=SUBJECTS.map(sub=>{const sr=allRows.filter(r=>r.subject===sub);const ea=['exam1','exam2','exam3','exam4','exam5'].map(e=>{const v=sr.map(r=>r[e]).filter(v=>v!=null).map(Number);return v.length?(v.reduce((a,b)=>a+b,0)/v.length).toFixed(1):'';});const all=sr.flatMap(r=>[r.exam1,r.exam2,r.exam3,r.exam4,r.exam5].filter(v=>v!=null).map(Number));return[sub,...ea,all.length?(all.reduce((a,b)=>a+b,0)/all.length).toFixed(1):''];});dlCSV([h,...b],'subject_summary.csv');toast('Exported','ok');}
function exportAttCSV(){const s=groupByStudent(allRows);const h=['No','Name','Total Days','Present','Absent','Late','Att%'];const b=s.map(s=>{const r=allAtt.filter(r=>r.student_no==s.no);return[s.no,s.name,r.length,r.filter(x=>x.status==='present').length,r.filter(x=>x.status==='absent').length,r.filter(x=>x.status==='late').length,(getAttPct(s.no)??'—')+'%'];});dlCSV([h,...b],'attendance.csv');toast('Exported','ok');}
function exportAtRiskCSV(){const s=groupByStudent(allRows).map(s=>({...s,avg:studentAvg(s)})).filter(s=>s.avg<50||getAttPct(s.no)<75);dlCSV([['No','Name','Avg','Att%'],...s.map(s=>[s.no,s.name,s.avg.toFixed(1),(getAttPct(s.no)??'—')+'%'])],'at_risk.csv');toast('Exported','ok');}
function exportDistinctionCSV(){const s=groupByStudent(allRows).map(s=>({...s,avg:studentAvg(s)})).filter(s=>s.avg>=80).sort((a,b)=>b.avg-a.avg);dlCSV([['Rank','No','Name','Avg'],...s.map((s,i)=>[i+1,s.no,s.name,s.avg.toFixed(1)])],'distinction.csv');toast('Exported','ok');}

/* ── NAV ── */
const PAGE_NAMES={overview:'Overview',marks:'Marks Table',attendance:'Attendance',students:'Students',analytics:'Analytics',reports:'Reports',settings:'Settings',staff:'Staff Management',timetable:'Time Table'};
function nav(page){
  document.querySelectorAll('.nav-link').forEach(l=>l.classList.remove('active'));
  const nl=document.getElementById('nl-'+page); if(nl) nl.classList.add('active');
  document.querySelectorAll('.page-view').forEach(v=>v.classList.remove('active'));
  const pg = document.getElementById('pg-'+page); if (pg) pg.classList.add('active');
  const bp = document.getElementById('breadPage'); if (bp) bp.textContent=PAGE_NAMES[page]||page;
  // Trigger a custom event to let React know navigation occurred (so it can update its internal page state if needed)
  window.dispatchEvent(new CustomEvent('page-navigated', { detail: page }));
}

/* ── TOAST ── */
function toast(msg,type='info'){const el=document.createElement('div');el.className=`toast ${type}`;const ico=type==='ok'?'✅':type==='err'?'❌':'ℹ️';el.innerHTML=`<span>${ico}</span><span>${msg}</span>`;document.getElementById('toasts')?.appendChild(el);setTimeout(()=>el.remove(),3500);}

// Expose some functions globally so inline onclick handlers work
window.nav = nav; window.loadData = loadData; window.openModal = openModal; window.seedData = seedData; window.seedAttendance = seedAttendance; window.saveAttendance = saveAttendance; window.clearAllData = clearAllData; window.exportCSV = exportCSV; window.exportRankCSV = exportRankCSV; window.exportSubjectCSV = exportSubjectCSV; window.exportAttCSV = exportAttCSV; window.exportAtRiskCSV = exportAtRiskCSV; window.exportDistinctionCSV = exportDistinctionCSV; window.prefillEdit = prefillEdit; window.delStudent = delStudent; window.applyFilter = applyFilter; window.markAll = markAll; window.loadAttForDate = loadAttForDate; window.setStatus = setStatus; window.saveRecord = saveRecord; window.openModal = openModal; window.closeModal = closeModal; window.toast = toast; window.initSupabase = () => { return sb; };

init();
