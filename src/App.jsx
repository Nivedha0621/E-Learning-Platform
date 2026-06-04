import React, { useState, useEffect } from 'react';

// Default mock data for Staff
const DEFAULT_STAFF = [
  { staff_no: 1, name: "Kavitha Ramaswamy", role: "Professor", department: "Mathematics", email: "kavitha.r@academia.edu", phone: "9876543210", status: "active", assigned_subjects: ["Mathematics"] },
  { staff_no: 2, name: "Dr. Rajesh Koothrapali", role: "Professor", department: "Physics", email: "rajesh.k@academia.edu", phone: "9876543211", status: "active", assigned_subjects: ["Physics"] },
  { staff_no: 3, name: "Dr. Clara Oswald", role: "Lecturer", department: "Chemistry", email: "clara.o@academia.edu", phone: "9876543212", status: "leave", assigned_subjects: ["Chemistry"] },
  { staff_no: 4, name: "Dr. Alan Turing", role: "Professor", department: "Computer Science", email: "alan.t@academia.edu", phone: "9876543213", status: "active", assigned_subjects: ["Computer Science"] },
  { staff_no: 5, name: "Sarah Jane", role: "Lecturer", department: "Biology", email: "sarah.j@academia.edu", phone: "9876543214", status: "active", assigned_subjects: ["Biology"] },
  { staff_no: 6, name: "Dr. Bruce Banner", role: "Professor", department: "Chemistry", email: "bruce.b@academia.edu", phone: "9876543215", status: "suspended", assigned_subjects: ["Chemistry", "Physics"] }
];

// Default mock data for Timetable
const DEFAULT_TIMETABLE = [
  { id: "slot-1", class_name: "Class 10-A", day_of_week: "Monday", period: 1, subject: "Mathematics", teacher_no: 1, room_no: "Room 101" },
  { id: "slot-2", class_name: "Class 10-A", day_of_week: "Monday", period: 2, subject: "Physics", teacher_no: 2, room_no: "Lab 1" },
  { id: "slot-3", class_name: "Class 10-A", day_of_week: "Tuesday", period: 3, subject: "Chemistry", teacher_no: 3, room_no: "Lab 2" },
  { id: "slot-4", class_name: "Class 10-A", day_of_week: "Wednesday", period: 4, subject: "Computer Science", teacher_no: 4, room_no: "Lab 3" },
  { id: "slot-5", class_name: "Class 10-A", day_of_week: "Thursday", period: 5, subject: "Biology", teacher_no: 5, room_no: "Room 102" },
  { id: "slot-6", class_name: "Class 10-A", day_of_week: "Friday", period: 6, subject: "Mathematics", teacher_no: 1, room_no: "Room 101" }
];

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const PERIODS = [1, 2, 3, 4, 5, 6];
const PERIOD_TIMES = {
  1: "08:30 - 09:30",
  2: "09:30 - 10:30",
  3: "10:45 - 11:45",
  4: "11:45 - 12:45",
  5: "01:45 - 02:45",
  6: "02:45 - 03:45"
};

const SUBJECT_LIST = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science'];
const DEPARTMENTS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Language/Humanities'];
const ROLES = ['Professor', 'Assistant Professor', 'Lecturer', 'HOD', 'Lab Assistant'];

export default function App() {
  // Sync legacy script
  useEffect(() => {
    import('./legacy.js').catch(err => {
      console.error('Failed to load legacy script:', err);
    });
  }, []);

  // React States for Staff and Timetable
  const [staffList, setStaffList] = useState([]);
  const [timetableList, setTimetableList] = useState([]);
  const [currentTab, setCurrentTab] = useState('overview');

  // Search and filter states
  const [staffSearch, setStaffSearch] = useState('');
  const [staffDeptFilter, setStaffDeptFilter] = useState('');
  const [staffStatusFilter, setStaffStatusFilter] = useState('');

  const [timetableClassFilter, setTimetableClassFilter] = useState('Class 10-A');
  const [timetableTeacherFilter, setTimetableTeacherFilter] = useState('');
  const [timetableRoomFilter, setTimetableRoomFilter] = useState('');
  const [timetableFilterType, setTimetableFilterType] = useState('class'); // 'class', 'teacher', 'room'

  // Modals for editing/adding
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);

  const [isTimetableModalOpen, setIsTimetableModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);

  // Form fields states - Staff
  const [staffFormNo, setStaffFormNo] = useState('');
  const [staffFormName, setStaffFormName] = useState('');
  const [staffFormRole, setStaffFormRole] = useState('Professor');
  const [staffFormDept, setStaffFormDept] = useState('Mathematics');
  const [staffFormEmail, setStaffFormEmail] = useState('');
  const [staffFormPhone, setStaffFormPhone] = useState('');
  const [staffFormStatus, setStaffFormStatus] = useState('active');
  const [staffFormSubjects, setStaffFormSubjects] = useState([]);

  // Form fields states - Timetable
  const [ttFormClass, setTtFormClass] = useState('Class 10-A');
  const [ttFormDay, setTtFormDay] = useState('Monday');
  const [ttFormPeriod, setTtFormPeriod] = useState(1);
  const [ttFormSubject, setTtFormSubject] = useState('Mathematics');
  const [ttFormTeacherNo, setTtFormTeacherNo] = useState('');
  const [ttFormRoom, setTtFormRoom] = useState('');

  // Conflict warning status inside the Timetable Modal
  const [conflictWarning, setConflictWarning] = useState(null);

  // Custom gradients for staff cards
  const GRADIENTS = [
    ['#4f46e5', '#818cf8'], ['#0ea5e9', '#38bdf8'], ['#10b981', '#34d399'],
    ['#f59e0b', '#fbbf24'], ['#ef4444', '#f87171'], ['#8b5cf6', '#a78bfa']
  ];

  // Listen to the custom navigation event triggered by legacy.js
  useEffect(() => {
    const handleNav = (e) => {
      setCurrentTab(e.detail);
    };
    window.addEventListener('page-navigated', handleNav);

    // Initial Load sequence
    const loadCoreData = async () => {
      // Delay slightly so that window.supabase client has time to instantiate in legacy.js
      await new Promise(resolve => setTimeout(resolve, 600));
      const sbClient = window.initSupabase ? window.initSupabase() : null;

      // 1. Fetch Staff Data
      let loadedStaff = false;
      if (sbClient) {
        try {
          const { data, error } = await sbClient.from('school_staff').select('*').order('staff_no');
          if (!error && data && data.length > 0) {
            setStaffList(data);
            loadedStaff = true;
          }
        } catch (e) {
          console.warn("Supabase staff load exception. Using LocalStorage fallback:", e);
        }
      }
      if (!loadedStaff) {
        const stored = localStorage.getItem('school_staff');
        if (stored) {
          setStaffList(JSON.parse(stored));
        } else {
          setStaffList(DEFAULT_STAFF);
          localStorage.setItem('school_staff', JSON.stringify(DEFAULT_STAFF));
        }
      }

      // 2. Fetch Timetable Data
      let loadedTt = false;
      if (sbClient) {
        try {
          const { data, error } = await sbClient.from('school_timetable').select('*').order('day_of_week').order('period');
          if (!error && data && data.length > 0) {
            setTimetableList(data);
            loadedTt = true;
          }
        } catch (e) {
          console.warn("Supabase timetable load exception. Using LocalStorage fallback:", e);
        }
      }
      if (!loadedTt) {
        const stored = localStorage.getItem('school_timetable');
        if (stored) {
          setTimetableList(JSON.parse(stored));
        } else {
          setTimetableList(DEFAULT_TIMETABLE);
          localStorage.setItem('school_timetable', JSON.stringify(DEFAULT_TIMETABLE));
        }
      }
    };

    loadCoreData();

    return () => {
      window.removeEventListener('page-navigated', handleNav);
    };
  }, []);

  // Save Staff details (Supabase with LocalStorage Sync)
  const handleSaveStaff = async (e) => {
    e.preventDefault();
    if (!staffFormName || !staffFormNo) {
      if (window.toast) window.toast("Name and Staff ID are required", "err");
      return;
    }

    const targetNo = parseInt(staffFormNo);

    // If adding, prevent duplicates
    if (!editingStaff && staffList.some(s => s.staff_no === targetNo)) {
      if (window.toast) window.toast(`Staff ID ${targetNo} already exists`, "err");
      return;
    }

    const payload = {
      staff_no: targetNo,
      name: staffFormName,
      role: staffFormRole,
      department: staffFormDept,
      email: staffFormEmail || null,
      phone: staffFormPhone || null,
      status: staffFormStatus,
      assigned_subjects: staffFormSubjects
    };

    let updatedList;
    if (editingStaff) {
      updatedList = staffList.map(s => s.staff_no === editingStaff.staff_no ? payload : s);
    } else {
      updatedList = [...staffList, payload];
    }

    setStaffList(updatedList);
    localStorage.setItem('school_staff', JSON.stringify(updatedList));

    const sbClient = window.initSupabase ? window.initSupabase() : null;
    if (sbClient) {
      try {
        const { error } = await sbClient.from('school_staff').upsert(payload, { onConflict: 'staff_no' });
        if (error) {
          console.warn("Supabase staff sync failure:", error);
          if (window.toast) window.toast("Saved locally (Sync failed)", "info");
        } else {
          if (window.toast) window.toast("Staff profile saved and synced!", "ok");
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      if (window.toast) window.toast("Staff profile saved (Local)", "ok");
    }

    setIsStaffModalOpen(false);
    setEditingStaff(null);
  };

  // Seed Staff data
  const handleSeedStaff = async () => {
    setStaffList(DEFAULT_STAFF);
    localStorage.setItem('school_staff', JSON.stringify(DEFAULT_STAFF));
    const sbClient = window.initSupabase ? window.initSupabase() : null;
    if (sbClient) {
      try {
        await sbClient.from('school_staff').upsert(DEFAULT_STAFF, { onConflict: 'staff_no' });
      } catch (e) {}
    }
    if (window.toast) window.toast("Mock Teachers seeded successfully!", "ok");
  };

  // Delete staff profile
  const handleDeleteStaff = async (staffNo, name) => {
    if (!confirm(`Delete all records for ${name}? This won't affect timetable entries but will break teacher mapping.`)) return;
    const updated = staffList.filter(s => s.staff_no !== staffNo);
    setStaffList(updated);
    localStorage.setItem('school_staff', JSON.stringify(updated));

    const sbClient = window.initSupabase ? window.initSupabase() : null;
    if (sbClient) {
      try {
        await sbClient.from('school_staff').delete().eq('staff_no', staffNo);
      } catch (e) {}
    }
    if (window.toast) window.toast(`Staff member ${name} removed!`, "ok");
  };

  // Trigger Edit staff
  const triggerEditStaff = (staff) => {
    setEditingStaff(staff);
    setStaffFormNo(staff.staff_no);
    setStaffFormName(staff.name);
    setStaffFormRole(staff.role);
    setStaffFormDept(staff.department);
    setStaffFormEmail(staff.email || '');
    setStaffFormPhone(staff.phone || '');
    setStaffFormStatus(staff.status);
    setStaffFormSubjects(staff.assigned_subjects || []);
    setIsStaffModalOpen(true);
  };

  // Trigger Add staff
  const triggerAddStaff = () => {
    setEditingStaff(null);
    const nextId = staffList.length ? Math.max(...staffList.map(s => s.staff_no)) + 1 : 1;
    setStaffFormNo(nextId);
    setStaffFormName('');
    setStaffFormRole('Professor');
    setStaffFormDept('Mathematics');
    setStaffFormEmail('');
    setStaffFormPhone('');
    setStaffFormStatus('active');
    setStaffFormSubjects([]);
    setIsStaffModalOpen(true);
  };

  // Live conflict validation in timetable form
  useEffect(() => {
    if (!isTimetableModalOpen) {
      setConflictWarning(null);
      return;
    }

    const pPeriod = parseInt(ttFormPeriod);
    const pTeacherNo = parseInt(ttFormTeacherNo);

    // 1. Validate Teacher Conflict (Teacher busy teaching another class)
    if (pTeacherNo) {
      const busySlot = timetableList.find(t => 
        t.day_of_week === ttFormDay &&
        t.period === pPeriod &&
        t.teacher_no === pTeacherNo &&
        t.class_name !== ttFormClass &&
        (!editingSlot || t.id !== editingSlot.id)
      );
      if (busySlot) {
        const teacher = staffList.find(s => s.staff_no === pTeacherNo);
        setConflictWarning({
          type: "teacher",
          message: `⚠️ Teacher ${teacher ? teacher.name : 'ID ' + pTeacherNo} is already teaching ${busySlot.class_name} during Period ${pPeriod} on ${ttFormDay}!`
        });
        return;
      }
    }

    // 2. Validate Room Occupied Conflict
    if (ttFormRoom.trim()) {
      const busyRoom = timetableList.find(t =>
        t.day_of_week === ttFormDay &&
        t.period === pPeriod &&
        t.room_no.toLowerCase().trim() === ttFormRoom.toLowerCase().trim() &&
        t.class_name !== ttFormClass &&
        (!editingSlot || t.id !== editingSlot.id)
      );
      if (busyRoom) {
        setConflictWarning({
          type: "room",
          message: `⚠️ ${ttFormRoom} is already occupied by ${busyRoom.class_name} during Period ${pPeriod} on ${ttFormDay}!`
        });
        return;
      }
    }

    setConflictWarning(null);
  }, [ttFormDay, ttFormPeriod, ttFormTeacherNo, ttFormRoom, ttFormClass, isTimetableModalOpen, editingSlot, timetableList, staffList]);

  // Save Timetable entry
  const handleSaveTimetable = async (e) => {
    e.preventDefault();

    if (!ttFormClass || !ttFormRoom.trim() || !ttFormTeacherNo) {
      if (window.toast) window.toast("Class, Room, and Teacher are required", "err");
      return;
    }

    // Warn of save conflict, but allow them to proceed if they ignore it
    if (conflictWarning) {
      if (!confirm(`${conflictWarning.message}\n\nDo you want to ignore this scheduling conflict and save anyway?`)) {
        return;
      }
    }

    const payload = {
      id: editingSlot ? editingSlot.id : 'slot-' + Date.now(),
      class_name: ttFormClass,
      day_of_week: ttFormDay,
      period: parseInt(ttFormPeriod),
      subject: ttFormSubject,
      teacher_no: parseInt(ttFormTeacherNo),
      room_no: ttFormRoom.trim()
    };

    // Remove any pre-existing slot for this exact Class + Day + Period to avoid grid overlap
    let filteredList = timetableList.filter(t => 
      !(t.class_name === payload.class_name && 
        t.day_of_week === payload.day_of_week && 
        t.period === payload.period) || 
      (editingSlot && t.id === editingSlot.id)
    );

    let updatedList;
    if (editingSlot) {
      updatedList = filteredList.map(t => t.id === editingSlot.id ? payload : t);
    } else {
      updatedList = [...filteredList, payload];
    }

    setTimetableList(updatedList);
    localStorage.setItem('school_timetable', JSON.stringify(updatedList));

    const sbClient = window.initSupabase ? window.initSupabase() : null;
    if (sbClient) {
      try {
        const { error } = await sbClient.from('school_timetable').upsert(payload, { onConflict: 'class_name,day_of_week,period' });
        if (error) {
          console.warn("Supabase timetable sync failure:", error);
          if (window.toast) window.toast("Saved locally (Sync failed)", "info");
        } else {
          if (window.toast) window.toast("Schedule entry saved and synced!", "ok");
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      if (window.toast) window.toast("Schedule entry saved (Local)", "ok");
    }

    setIsTimetableModalOpen(false);
    setEditingSlot(null);
  };

  // Seed Timetable default entries
  const handleSeedTimetable = async () => {
    setTimetableList(DEFAULT_TIMETABLE);
    localStorage.setItem('school_timetable', JSON.stringify(DEFAULT_TIMETABLE));
    const sbClient = window.initSupabase ? window.initSupabase() : null;
    if (sbClient) {
      try {
        await sbClient.from('school_timetable').upsert(DEFAULT_TIMETABLE, { onConflict: 'class_name,day_of_week,period' });
      } catch (e) {}
    }
    if (window.toast) window.toast("Typical week schedule seeded!", "ok");
  };

  // Trigger Add Slot from specific cell
  const triggerAddSlot = (day, period) => {
    setEditingSlot(null);
    setTtFormClass(timetableClassFilter || 'Class 10-A');
    setTtFormDay(day);
    setTtFormPeriod(period);
    setTtFormSubject('Mathematics');
    setTtFormTeacherNo(staffList.length ? staffList[0].staff_no : '');
    setTtFormRoom('Room 101');
    setIsTimetableModalOpen(true);
  };

  // Trigger Edit slot
  const triggerEditSlot = (slot) => {
    setEditingSlot(slot);
    setTtFormClass(slot.class_name);
    setTtFormDay(slot.day_of_week);
    setTtFormPeriod(slot.period);
    setTtFormSubject(slot.subject);
    setTtFormTeacherNo(slot.teacher_no);
    setTtFormRoom(slot.room_no);
    setIsTimetableModalOpen(true);
  };

  // Delete Timetable entry
  const handleDeleteSlot = async (slotId) => {
    if (!confirm("Are you sure you want to remove this timetable entry?")) return;
    const updated = timetableList.filter(t => t.id !== slotId);
    setTimetableList(updated);
    localStorage.setItem('school_timetable', JSON.stringify(updated));

    const sbClient = window.initSupabase ? window.initSupabase() : null;
    if (sbClient) {
      try {
        await sbClient.from('school_timetable').delete().eq('id', slotId);
      } catch (e) {}
    }
    if (window.toast) window.toast("Schedule entry cleared!", "ok");
  };

  // Filtered lists
  const filteredStaff = staffList.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(staffSearch.toLowerCase()) || 
                        s.role.toLowerCase().includes(staffSearch.toLowerCase());
    const matchDept = staffDeptFilter === '' || s.department === staffDeptFilter;
    const matchStatus = staffStatusFilter === '' || s.status === staffStatusFilter;
    return matchSearch && matchDept && matchStatus;
  });

  // Calculate helpers
  const initials = (name) => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  // Highlight conflicting timetable items on overview or lists (visual warning)
  const isTeacherBusyElsewhere = (slot) => {
    return timetableList.some(t =>
      t.id !== slot.id &&
      t.day_of_week === slot.day_of_week &&
      t.period === slot.period &&
      t.teacher_no === slot.teacher_no &&
      t.class_name !== slot.class_name
    );
  };

  const isRoomOccupiedElsewhere = (slot) => {
    return timetableList.some(t =>
      t.id !== slot.id &&
      t.day_of_week === slot.day_of_week &&
      t.period === slot.period &&
      t.room_no.toLowerCase().trim() === slot.room_no.toLowerCase().trim() &&
      t.class_name !== slot.class_name
    );
  };

  return (
    <>
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-wrap">
            <div className="logo-icon">🎓</div>
            <div>
              <div className="logo-text">Academia</div>
              <div className="logo-sub">PORTAL SYSTEM</div>
            </div>
          </div>
        </div>
        <div className="sidebar-section">
          <div className="sidebar-label">Main Navigation</div>
          <button className="nav-link active" id="nl-overview" onClick={() => window.nav && window.nav('overview')}>Overview</button>
          <button className="nav-link" id="nl-marks" onClick={() => window.nav && window.nav('marks')}>Marks Table <span className="badge" id="navBadge">0</span></button>
          <button className="nav-link" id="nl-attendance" onClick={() => window.nav && window.nav('attendance')}>Attendance</button>
          <button className="nav-link" id="nl-students" onClick={() => window.nav && window.nav('students')}>Students</button>
          <button className="nav-link" id="nl-analytics" onClick={() => window.nav && window.nav('analytics')}>Analytics</button>

          <div className="sidebar-label" style={{marginTop: '20px'}}>Administration</div>
          <button className="nav-link" id="nl-staff" onClick={() => window.nav && window.nav('staff')}>Staff Directory</button>
          <button className="nav-link" id="nl-timetable" onClick={() => window.nav && window.nav('timetable')}>Time Table</button>
        </div>
        <div className="sidebar-footer">
          <div className="admin-row">
            <div className="admin-avatar">AD</div>
            <div>
              <div className="admin-name">Admin</div>
              <div className="admin-role">Administrator</div>
            </div>
            <div className="db-indicator" id="dbDot"></div>
          </div>
        </div>
      </aside>

      <main className="main">
        {/* Top Navbar */}
        <header className="topbar">
          <div className="breadcrumb">
            <span className="root">Academia</span>
            <span className="sep">›</span>
            <span className="page" id="breadPage">Overview</span>
          </div>
          <div className="topbar-right">
            <button className="icon-btn" onClick={() => window.loadData && window.loadData()} title="Refresh Marks Database">⟳</button>
            
            {currentTab === 'staff' && (
              <>
                <button className="btn btn-outline btn-sm btn-amber" onClick={handleSeedStaff}>Seed Staff</button>
                <button className="btn btn-primary btn-sm" onClick={triggerAddStaff}>Add Teacher</button>
              </>
            )}

            {currentTab === 'timetable' && (
              <>
                <button className="btn btn-outline btn-sm btn-amber" onClick={handleSeedTimetable}>Seed Timetable</button>
                <button className="btn btn-primary btn-sm" onClick={() => {
                  setEditingSlot(null);
                  setTtFormClass('Class 10-A');
                  setTtFormDay('Monday');
                  setTtFormPeriod(1);
                  setTtFormSubject('Mathematics');
                  setTtFormTeacherNo(staffList.length ? staffList[0].staff_no : '');
                  setTtFormRoom('Room 101');
                  setIsTimetableModalOpen(true);
                }}>Schedule Slot</button>
                <button className="btn btn-outline btn-sm" onClick={() => window.print()} title="Print Timetable">🖨️ Print</button>
              </>
            )}

            {currentTab !== 'staff' && currentTab !== 'timetable' && (
              <>
                <button className="btn btn-outline btn-sm" onClick={() => window.openModal && window.openModal()}>Add Record</button>
                <button className="btn btn-primary btn-sm" onClick={() => window.seedData && window.seedData()}>Seed Data</button>
              </>
            )}
          </div>
        </header>

        {/* Content Panels */}
        <div className="page-content">
          {/* Legacy: Overview Page */}
          <div className="page-view active" id="pg-overview">
            <div className="page-header">
              <div className="page-title">Dashboard Overview</div>
              <div className="page-sub">Academic performance and administrative details</div>
            </div>
            <div className="kpi-grid">
              <div className="kpi-card"><div className="kpi-value" id="kTotal">—</div><div className="kpi-label">Total Students</div></div>
              <div className="kpi-card"><div className="kpi-value" id="kAvg">—</div><div className="kpi-label">Class Average</div></div>
              <div className="kpi-card"><div className="kpi-value" id="kAtt">—</div><div className="kpi-label">Avg Attendance</div></div>
              <div className="kpi-card"><div className="kpi-value" id="kPass">—</div><div className="kpi-label">Pass Rate</div></div>
            </div>
            
            <div className="staff-kpi-grid" style={{marginBottom: '28px'}}>
              <div className="staff-kpi-card">
                <div className="staff-kpi-icon" style={{background: 'var(--accent-lt)', color: 'var(--accent)'}}>👨‍🏫</div>
                <div className="staff-kpi-details">
                  <div className="staff-kpi-val">{staffList.length}</div>
                  <div className="staff-kpi-lbl">Assigned Faculty</div>
                </div>
              </div>
              <div className="staff-kpi-card">
                <div className="staff-kpi-icon" style={{background: 'var(--green-lt)', color: 'var(--green)'}}>📅</div>
                <div className="staff-kpi-details">
                  <div className="staff-kpi-val">{timetableList.length}</div>
                  <div className="staff-kpi-lbl">Scheduled Weekly Classes</div>
                </div>
              </div>
            </div>

            <div className="card" style={{marginBottom: '24px'}}><div style={{padding:'18px 22px'}}><div className="perf-grid" id="perfGrid"></div></div></div>
            <div className="card"><div id="topPreview"></div></div>
          </div>

          {/* Legacy: Marks Page */}
          <div className="page-view" id="pg-marks">
            <div className="page-header" style={{display:'flex',justifyContent:'space-between'}}>
              <div>
                <div className="page-title">Marks Table</div>
                <div className="page-sub">Manage and audit student terminal grades</div>
              </div>
              <div className="flex-gap">
                <select className="form-input" id="filterSubject" onChange={() => window.applyFilter && window.applyFilter()}></select>
                <select className="form-input" id="filterExam" onChange={() => window.applyFilter && window.applyFilter()}></select>
              </div>
            </div>
            <div className="card"><div className="table-wrap" id="marksTableWrap"></div></div>
          </div>

          {/* Legacy: Attendance Page */}
          <div className="page-view" id="pg-attendance">
            <div className="page-header" style={{display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:'12px'}}>
              <div>
                <div className="page-title">Attendance</div>
                <div className="page-sub">Daily attendance registers and statistics</div>
              </div>
              <div className="flex-gap" style={{flexWrap:'wrap'}}>
                <input type="date" className="form-input" id="attDate" style={{width:'auto'}} onChange={() => window.loadAttForDate && window.loadAttForDate()} />
                <button className="btn btn-primary btn-sm" onClick={() => window.saveAttendance && window.saveAttendance()}>Save Attendance</button>
                <button className="btn btn-outline btn-sm" onClick={() => window.seedAttendance && window.seedAttendance()}>Seed Attendance</button>
                <button className="btn btn-outline btn-sm btn-green" onClick={() => window.markAll && window.markAll('present')}>Mark All Present</button>
                <button className="btn btn-outline btn-sm btn-danger" onClick={() => window.markAll && window.markAll('absent')}>Mark All Absent</button>
              </div>
            </div>

            <div className="att-kpi-grid">
              <div className="att-kpi">
                <div className="att-kpi-val" id="attDays">—</div>
                <div className="att-kpi-lbl">Total School Days</div>
              </div>
              <div className="att-kpi">
                <div className="att-kpi-val" id="attAvg">—</div>
                <div className="att-kpi-lbl">Average Attendance</div>
              </div>
              <div className="att-kpi">
                <div className="att-kpi-val" id="attLow">—</div>
                <div className="att-kpi-lbl">Students &lt; 75% Attendance</div>
              </div>
              <div className="att-kpi">
                <div className="att-kpi-val" id="attLate">—</div>
                <div className="att-kpi-lbl">Total Late Days</div>
              </div>
            </div>

            <div className="card" style={{marginBottom:'20px'}}><div id="attMarkWrap"></div></div>
            <div className="card"><div className="table-wrap" id="attSummaryWrap"></div></div>
          </div>

          {/* Legacy: Students Page */}
          <div className="page-view" id="pg-students">
            <div className="page-header">
              <div className="page-title">Students</div>
              <div className="page-sub">Complete enrolled student directory</div>
            </div>
            <div className="stu-grid" id="stuGrid"></div>
          </div>

          {/* Legacy: Analytics Page */}
          <div className="page-view" id="pg-analytics">
            <div className="page-header">
              <div className="page-title">Analytics</div>
              <div className="page-sub">Performance metrics and class distribution summaries</div>
            </div>
            <div id="analyticsContent"></div>
          </div>

          {/* NEW: Staff Management Page */}
          <div className="page-view" id="pg-staff">
            <div className="page-header">
              <div className="page-title">Staff Management</div>
              <div className="page-sub">View, edit, and assign workloads to academic faculty members</div>
            </div>

            {/* KPI Panels for Staff */}
            <div className="staff-kpi-grid">
              <div className="staff-kpi-card">
                <div className="staff-kpi-icon" style={{background: 'var(--accent-lt)', color: 'var(--accent)'}}>👥</div>
                <div className="staff-kpi-details">
                  <div className="staff-kpi-val">{staffList.length}</div>
                  <div className="staff-kpi-lbl">Total Faculty</div>
                </div>
              </div>
              <div className="staff-kpi-card">
                <div className="staff-kpi-icon" style={{background: 'var(--green-lt)', color: 'var(--green)'}}>🟢</div>
                <div className="staff-kpi-details">
                  <div className="staff-kpi-val">{staffList.filter(s => s.status === 'active').length}</div>
                  <div className="staff-kpi-lbl">Active Teachers</div>
                </div>
              </div>
              <div className="staff-kpi-card">
                <div className="staff-kpi-icon" style={{background: 'var(--amber-lt)', color: 'var(--amber)'}}>🏖️</div>
                <div className="staff-kpi-details">
                  <div className="staff-kpi-val">{staffList.filter(s => s.status === 'leave').length}</div>
                  <div className="staff-kpi-lbl">On Leave</div>
                </div>
              </div>
              <div className="staff-kpi-card">
                <div className="staff-kpi-icon" style={{background: 'var(--red-lt)', color: 'var(--red)'}}>🚨</div>
                <div className="staff-kpi-details">
                  <div className="staff-kpi-val">{staffList.filter(s => s.status === 'suspended').length}</div>
                  <div className="staff-kpi-lbl">Suspended / Inactive</div>
                </div>
              </div>
            </div>

            {/* Staff Toolbar */}
            <div className="section-toolbar">
              <div className="search-input-wrap">
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Search faculty by name/role..." 
                  value={staffSearch}
                  onChange={(e) => setStaffSearch(e.target.value)}
                />
              </div>
              <div className="flex-gap">
                <select 
                  className="form-input" 
                  style={{width: 'auto'}} 
                  value={staffDeptFilter}
                  onChange={(e) => setStaffDeptFilter(e.target.value)}
                >
                  <option value="">All Departments</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select 
                  className="form-input" 
                  style={{width: 'auto'}}
                  value={staffStatusFilter}
                  onChange={(e) => setStaffStatusFilter(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="leave">On Leave</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>

            {/* Staff Cards Grid */}
            {filteredStaff.length === 0 ? (
              <div className="card">
                <div className="empty-state">
                  <div className="ico">👤</div>
                  <h3>No staff members found</h3>
                  <p>Try clearing filters or click "Seed Staff" in the header to import default teachers!</p>
                </div>
              </div>
            ) : (
              <div className="staff-card-grid">
                {filteredStaff.map((staff, index) => {
                  const [grad1, grad2] = GRADIENTS[staff.staff_no % GRADIENTS.length] || GRADIENTS[0];
                  // Compute Teaching workload count from timetable
                  const workload = timetableList.filter(t => t.teacher_no === staff.staff_no).length;

                  return (
                    <div className="staff-card" key={staff.staff_no}>
                      <span className={`staff-card-badge ${staff.status}`}>{staff.status}</span>
                      <div className="staff-avatar-lg" style={{background: `linear-gradient(135deg, ${grad1}, ${grad2})`}}>
                        {initials(staff.name)}
                      </div>
                      <div className="staff-card-name">{staff.name}</div>
                      <span className="staff-card-role">{staff.role}</span>
                      <div className="staff-card-dept">{staff.department}</div>
                      
                      <div style={{width: '100%', margin: '8px 0', padding: '6px 12px', background: 'var(--bg)', borderRadius: '10px'}}>
                        <div style={{fontSize: '11px', color: 'var(--text-3)'}}>Weekly Workload</div>
                        <div style={{fontWeight: 700, fontSize: '15px', color: workload > 5 ? 'var(--red)' : 'var(--text)'}}>
                          {workload} periods {workload > 5 && '⚠️ (Overloaded)'}
                        </div>
                        <div style={{height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden', marginTop: '6px'}}>
                          <div style={{height: '100%', background: workload > 5 ? 'var(--red)' : 'var(--accent)', width: `${Math.min(workload * 15, 100)}%`}}></div>
                        </div>
                      </div>

                      <div className="staff-card-contacts">
                        <div className="staff-contact-item">
                          <span className="staff-contact-icon">📧</span>
                          <span style={{overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{staff.email || 'No email registered'}</span>
                        </div>
                        <div className="staff-contact-item">
                          <span className="staff-contact-icon">📞</span>
                          <span>{staff.phone || 'No phone registered'}</span>
                        </div>
                        <div className="staff-contact-item">
                          <span className="staff-contact-icon">🆔</span>
                          <span style={{fontFamily: 'var(--mono)'}}>No. {String(staff.staff_no).padStart(2, '0')}</span>
                        </div>
                      </div>

                      <div className="staff-card-subjects">
                        {(staff.assigned_subjects || []).map(sub => (
                          <span className="staff-sub-pill" key={sub}>{sub}</span>
                        ))}
                      </div>

                      <div className="staff-card-footer">
                        <button className="btn btn-outline btn-sm" onClick={() => triggerEditStaff(staff)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteStaff(staff.staff_no, staff.name)}>Remove</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* NEW: Time Table Page */}
          <div className="page-view" id="pg-timetable">
            <div className="page-header">
              <div className="page-title">Weekly Time Table</div>
              <div className="page-sub">Interactive weekly class schedules with collision warnings</div>
            </div>

            <div className="timetable-container">
              {/* Schedule Filters Toolbar */}
              <div className="timetable-header">
                <div className="flex-gap" style={{flexWrap: 'wrap'}}>
                  <div style={{fontSize: '13px', fontWeight: 700, color: 'var(--text-2)'}}>Filter Schedule By:</div>
                  <select 
                    className="form-input" 
                    style={{width: 'auto', fontWeight: 600}} 
                    value={timetableFilterType}
                    onChange={(e) => {
                      setTimetableFilterType(e.target.value);
                      // Clear alternative options
                      if(e.target.value === 'class') {
                        setTimetableClassFilter('Class 10-A');
                        setTimetableTeacherFilter('');
                        setTimetableRoomFilter('');
                      } else if(e.target.value === 'teacher') {
                        if (staffList.length) setTimetableTeacherFilter(String(staffList[0].staff_no));
                        setTimetableClassFilter('');
                        setTimetableRoomFilter('');
                      } else {
                        setTimetableRoomFilter('Room 101');
                        setTimetableClassFilter('');
                        setTimetableTeacherFilter('');
                      }
                    }}
                  >
                    <option value="class">🎓 Class Section</option>
                    <option value="teacher">👨‍🏫 Faculty Member</option>
                    <option value="room">🚪 Classroom / Lab</option>
                  </select>

                  {timetableFilterType === 'class' && (
                    <select 
                      className="form-input" 
                      style={{width: 'auto'}}
                      value={timetableClassFilter}
                      onChange={(e) => setTimetableClassFilter(e.target.value)}
                    >
                      <option value="Class 10-A">Class 10-A</option>
                      <option value="Class 10-B">Class 10-B</option>
                      <option value="Class 11-A">Class 11-A</option>
                      <option value="Class 11-B">Class 11-B</option>
                      <option value="Class 12-A">Class 12-A</option>
                    </select>
                  )}

                  {timetableFilterType === 'teacher' && (
                    <select 
                      className="form-input" 
                      style={{width: 'auto'}}
                      value={timetableTeacherFilter}
                      onChange={(e) => setTimetableTeacherFilter(e.target.value)}
                    >
                      <option value="">Select Teacher...</option>
                      {staffList.map(s => <option key={s.staff_no} value={s.staff_no}>{s.name} ({s.department})</option>)}
                    </select>
                  )}

                  {timetableFilterType === 'room' && (
                    <input 
                      type="text" 
                      className="form-input" 
                      style={{width: '160px'}} 
                      placeholder="e.g. Room 101"
                      value={timetableRoomFilter}
                      onChange={(e) => setTimetableRoomFilter(e.target.value)}
                    />
                  )}
                </div>

                <div className="timetable-actions">
                  <div style={{fontSize: '11px', color: 'var(--text-3)', fontWeight: 600}}>
                    💡 Double booking conflicts will show with a red warning pulse 🚨
                  </div>
                </div>
              </div>

              {/* Main Schedule Grid */}
              <div className="timetable-grid-wrapper">
                <table className="timetable-table">
                  <thead>
                    <tr>
                      <th>Day</th>
                      {PERIODS.map(p => (
                        <th key={p} style={{width: '150px'}}>
                          Period {p}
                          <div style={{fontSize: '10px', color: 'var(--text-3)', fontWeight: 500, marginTop: '2px'}}>
                            {PERIOD_TIMES[p]}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {DAYS_OF_WEEK.map(day => (
                      <tr className="timetable-day-row" key={day}>
                        <td className="timetable-day-name">{day}</td>
                        {PERIODS.map(period => {
                          // Find matching entry
                          let matchingSlot = null;
                          if (timetableFilterType === 'class') {
                            matchingSlot = timetableList.find(t => 
                              t.day_of_week === day && 
                              t.period === period && 
                              t.class_name === timetableClassFilter
                            );
                          } else if (timetableFilterType === 'teacher' && timetableTeacherFilter) {
                            matchingSlot = timetableList.find(t => 
                              t.day_of_week === day && 
                              t.period === period && 
                              t.teacher_no === parseInt(timetableTeacherFilter)
                            );
                          } else if (timetableFilterType === 'room' && timetableRoomFilter.trim()) {
                            matchingSlot = timetableList.find(t => 
                              t.day_of_week === day && 
                              t.period === period && 
                              t.room_no.toLowerCase().trim() === timetableRoomFilter.toLowerCase().trim()
                            );
                          }

                          if (matchingSlot) {
                            const teacher = staffList.find(s => s.staff_no === matchingSlot.teacher_no);
                            const hasTConflict = isTeacherBusyElsewhere(matchingSlot);
                            const hasRConflict = isRoomOccupiedElsewhere(matchingSlot);
                            const isConflict = hasTConflict || hasRConflict;

                            return (
                              <td className="timetable-period-cell" key={period}>
                                <div className={`timetable-slot-card ${isConflict ? 'conflict-warning-card' : ''}`}>
                                  <div className="timetable-slot-subject">
                                    <span>{matchingSlot.subject}</span>
                                  </div>
                                  <div className="timetable-slot-teacher" title={teacher ? teacher.name : 'Unknown'}>
                                    👨‍🏫 {teacher ? teacher.name : `Faculty #${matchingSlot.teacher_no}`}
                                  </div>
                                  <div className="timetable-slot-footer">
                                    <span className="timetable-slot-room">{matchingSlot.room_no}</span>
                                    {timetableFilterType !== 'class' && (
                                      <span className="timetable-slot-class">{matchingSlot.class_name}</span>
                                    )}
                                  </div>

                                  {isConflict && (
                                    <div className="conflict-warning-text" title={
                                      `${hasTConflict ? 'Teacher teaching another class simultaneously! ' : ''}${hasRConflict ? 'Classroom is double-booked!' : ''}`
                                    }>
                                      🚨 Conflict Detected
                                    </div>
                                  )}

                                  <div className="timetable-slot-actions">
                                    <button className="slot-action-btn edit" onClick={() => triggerEditSlot(matchingSlot)} title="Edit Slot">✏️</button>
                                    <button className="slot-action-btn del" onClick={() => handleDeleteSlot(matchingSlot.id)} title="Delete Slot">🗑️</button>
                                  </div>
                                </div>
                              </td>
                            );
                          }

                          // If cell is empty
                          return (
                            <td className="timetable-period-cell" key={period}>
                              {timetableFilterType === 'class' ? (
                                <div className="timetable-empty-cell" onClick={() => triggerAddSlot(day, period)}>
                                  ➕ Add Slot
                                </div>
                              ) : (
                                <div style={{height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', fontStyle: 'italic', fontSize: '11px'}}>
                                  {timetableFilterType === 'teacher' ? 'Free Period' : 'Available'}
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* NEW: Staff Modal Dialog */}
      {isStaffModalOpen && (
        <div className="modal-bg open" onClick={(e) => { if(e.target === e.currentTarget) { setIsStaffModalOpen(false); setEditingStaff(null); } }}>
          <div className="modal">
            <div className="modal-head">
              <div className="modal-title">{editingStaff ? `Edit: ${editingStaff.name}` : 'Add New Faculty Profile'}</div>
              <button className="modal-close" onClick={() => { setIsStaffModalOpen(false); setEditingStaff(null); }}>✕</button>
            </div>
            <form onSubmit={handleSaveStaff}>
              <div className="modal-grid">
                <div className="form-row full">
                  <label className="form-label">Full Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={staffFormName} 
                    placeholder="e.g. Kavitha Ramaswamy"
                    onChange={(e) => setStaffFormName(e.target.value)} 
                    required 
                  />
                </div>
                
                <div className="form-row">
                  <label className="form-label">Staff No. (ID)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={staffFormNo} 
                    onChange={(e) => setStaffFormNo(e.target.value)} 
                    disabled={editingStaff !== null}
                    required 
                  />
                </div>

                <div className="form-row">
                  <label className="form-label">Designation / Role</label>
                  <select 
                    className="form-input" 
                    value={staffFormRole} 
                    onChange={(e) => setStaffFormRole(e.target.value)}
                  >
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                <div className="form-row">
                  <label className="form-label">Department</label>
                  <select 
                    className="form-input" 
                    value={staffFormDept} 
                    onChange={(e) => setStaffFormDept(e.target.value)}
                  >
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                <div className="form-row">
                  <label className="form-label">Status</label>
                  <select 
                    className="form-input" 
                    value={staffFormStatus} 
                    onChange={(e) => setStaffFormStatus(e.target.value)}
                  >
                    <option value="active">Active</option>
                    <option value="leave">On Leave</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>

                <div className="form-row">
                  <label className="form-label">Email</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    value={staffFormEmail} 
                    placeholder="email@academia.edu"
                    onChange={(e) => setStaffFormEmail(e.target.value)} 
                  />
                </div>

                <div className="form-row">
                  <label className="form-label">Phone Number</label>
                  <input 
                    type="tel" 
                    className="form-input" 
                    value={staffFormPhone} 
                    placeholder="9876543210"
                    onChange={(e) => setStaffFormPhone(e.target.value)} 
                  />
                </div>

                <div className="form-row full">
                  <label className="form-label">Assigned Subjects (Teaching Competencies)</label>
                  <div className="subject-checkbox-grid">
                    {SUBJECT_LIST.map(subject => {
                      const checked = staffFormSubjects.includes(subject);
                      return (
                        <label className="subject-checkbox-item" key={subject}>
                          <input 
                            type="checkbox" 
                            checked={checked}
                            onChange={() => {
                              if (checked) {
                                setStaffFormSubjects(staffFormSubjects.filter(s => s !== subject));
                              } else {
                                setStaffFormSubjects([...staffFormSubjects, subject]);
                              }
                            }}
                          />
                          {subject}
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="modal-foot">
                <button type="button" className="btn btn-outline" onClick={() => { setIsStaffModalOpen(false); setEditingStaff(null); }}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW: Timetable Scheduler Modal Dialog */}
      {isTimetableModalOpen && (
        <div className="modal-bg open" onClick={(e) => { if(e.target === e.currentTarget) { setIsTimetableModalOpen(false); setEditingSlot(null); } }}>
          <div className="modal">
            <div className="modal-head">
              <div className="modal-title">{editingSlot ? 'Modify Schedule Entry' : 'Schedule Timetable Class Slot'}</div>
              <button className="modal-close" onClick={() => { setIsTimetableModalOpen(false); setEditingSlot(null); }}>✕</button>
            </div>
            
            {/* Realtime Conflict Banner inside modal */}
            {conflictWarning && (
              <div className="conflict-banner">
                <span>🚨</span>
                <div>{conflictWarning.message}</div>
              </div>
            )}

            <form onSubmit={handleSaveTimetable}>
              <div className="modal-grid">
                <div className="form-row">
                  <label className="form-label">Class Section</label>
                  <select 
                    className="form-input" 
                    value={ttFormClass} 
                    onChange={(e) => setTtFormClass(e.target.value)}
                    required
                  >
                    <option value="Class 10-A">Class 10-A</option>
                    <option value="Class 10-B">Class 10-B</option>
                    <option value="Class 11-A">Class 11-A</option>
                    <option value="Class 11-B">Class 11-B</option>
                    <option value="Class 12-A">Class 12-A</option>
                  </select>
                </div>

                <div className="form-row">
                  <label className="form-label">Subject</label>
                  <select 
                    className="form-input" 
                    value={ttFormSubject} 
                    onChange={(e) => setTtFormSubject(e.target.value)}
                    required
                  >
                    {SUBJECT_LIST.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                  </select>
                </div>

                <div className="form-row">
                  <label className="form-label">Day of Week</label>
                  <select 
                    className="form-input" 
                    value={ttFormDay} 
                    onChange={(e) => setTtFormDay(e.target.value)}
                    required
                  >
                    {DAYS_OF_WEEK.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                <div className="form-row">
                  <label className="form-label">Period slot</label>
                  <select 
                    className="form-input" 
                    value={ttFormPeriod} 
                    onChange={(e) => setTtFormPeriod(e.target.value)}
                    required
                  >
                    {PERIODS.map(p => (
                      <option key={p} value={p}>Period {p} ({PERIOD_TIMES[p]})</option>
                    ))}
                  </select>
                </div>

                <div className="form-row">
                  <label className="form-label">Teacher Assigned</label>
                  <select 
                    className="form-input" 
                    value={ttFormTeacherNo} 
                    onChange={(e) => setTtFormTeacherNo(e.target.value)}
                    required
                  >
                    <option value="">Select Faculty...</option>
                    {staffList.map(s => (
                      <option key={s.staff_no} value={s.staff_no}>
                        {s.name} ({s.department}) {s.status !== 'active' ? `— [Status: ${s.status}]` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-row">
                  <label className="form-label">Room / Lab Number</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={ttFormRoom} 
                    placeholder="e.g. Room 101"
                    onChange={(e) => setTtFormRoom(e.target.value)} 
                    required 
                  />
                </div>
              </div>
              <div className="modal-foot">
                <button type="button" className="btn btn-outline" onClick={() => { setIsTimetableModalOpen(false); setEditingSlot(null); }}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingSlot ? 'Apply Changes' : 'Schedule Slot'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Legacy Modal (Student Records Modal) */}
      <div className="modal-bg" id="modalBg" onClick={(e) => { if(e.target === e.currentTarget && window.closeModal) window.closeModal(); }}>
        <div className="modal">
          <div className="modal-head">
            <div className="modal-title" id="modalTitle">Add Student Record</div>
            <button className="modal-close" onClick={() => window.closeModal && window.closeModal()}>✕</button>
          </div>
          <div className="modal-grid">
            <div className="form-row full"><label className="form-label">Student Name</label><input className="form-input" id="fName" placeholder="Full name" /></div>
            <div className="form-row"><label className="form-label">Student No.</label><input type="number" className="form-input" id="fNo" /></div>
            <div className="form-row"><label className="form-label">Subject</label><select className="form-input" id="fSub"></select></div>
            <div className="form-row"><label className="form-label">Exam 1</label><input type="number" className="form-input" id="fE1" /></div>
            <div className="form-row"><label className="form-label">Exam 2</label><input type="number" className="form-input" id="fE2" /></div>
            <div className="form-row"><label className="form-label">Exam 3</label><input type="number" className="form-input" id="fE3" /></div>
            <div className="form-row"><label className="form-label">Exam 4</label><input type="number" className="form-input" id="fE4" /></div>
            <div className="form-row"><label className="form-label">Exam 5</label><input type="number" className="form-input" id="fE5" /></div>
          </div>
          <input type="hidden" id="fEditId" />
          <div className="modal-foot">
            <button className="btn btn-outline" onClick={() => window.closeModal && window.closeModal()}>Cancel</button>
            <button className="btn btn-primary" onClick={() => window.saveRecord && window.saveRecord()}>Save Record</button>
          </div>
        </div>
      </div>

      {/* Toast Notification Container */}
      <div className="toast-wrap" id="toasts"></div>
    </>
  );
}
