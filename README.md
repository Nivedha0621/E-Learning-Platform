# 🎓 Academia — Student Portal

A modern, full-featured school management system built with **React 18** and **Vite**. Designed for academic administrators to manage students, staff, timetables, marks, and attendance — all in one sleek dashboard.

---

## ✨ Features

### 📊 Dashboard Overview
- Real-time KPI cards for **Total Students**, **Class Average**, **Avg. Attendance**, and **Pass Rate**
- Faculty count and weekly scheduled class summaries
- Subject-wise performance grid and top performer preview

### 📝 Marks Table
- View and manage student terminal grades
- Filter by **Subject** and **Exam type**
- Add or edit records via modal forms

### 📅 Attendance
- Daily attendance register with **date-based navigation**
- Quick actions: **Mark All Present / Absent**, Seed mock data
- Summary table showing per-student attendance percentage
- KPI stats: Total School Days, Average Attendance, Students below 75%, Total Late Days

### 👨‍🎓 Students Directory
- Complete enrolled student directory with card layout
- Searchable and filterable by class/name

### 📈 Analytics
- Performance metrics and class distribution summaries
- Visual charts powered by legacy JS rendering engine

### 👥 Staff Management *(React-powered)*
- Visual staff cards with avatar initials and color-coded gradients
- **Status badges**: Active, On Leave, Suspended
- **Weekly workload indicator** with progress bar (flags overloaded teachers)
- Contact information display (email, phone, staff ID)
- Subject assignment pills
- Search by name/role; filter by Department and Status
- **Add / Edit / Delete** staff with modal form
- **Seed mock faculty** data with one click
- Live sync to Supabase with localStorage fallback

### 🗓️ Timetable Management *(React-powered)*
- Weekly timetable grid (Mon–Fri × 6 periods)
- Filter view by **Class**, **Teacher**, or **Room**
- **Real-time conflict detection**:
  - Teacher teaching two classes in same period
  - Same room booked by two classes simultaneously
- Conflict warnings shown inline and on save (with option to override)
- Click any empty cell to quick-schedule a slot
- **Print timetable** with browser print dialog
- Seed default schedule with one click
- Live sync to Supabase with localStorage fallback

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| [React 18](https://react.dev/) | UI components & state management |
| [Vite 5](https://vitejs.dev/) | Build tool & dev server |
| [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react) | JSX fast refresh |
| [Supabase JS v2](https://supabase.com/docs/reference/javascript) | Cloud database (CDN loaded) |
| Vanilla CSS | Custom design system |
| Google Fonts (Outfit, JetBrains Mono) | Typography |
| `localStorage` | Offline / fallback persistence |

---

## 📂 Project Structure

```
task 2/
├── index.html              # App entry point (loads fonts & Supabase CDN)
├── package.json            # Dependencies & scripts
├── vite.config.js          # Vite configuration
├── src/
│   ├── main.jsx            # React DOM mount point
│   ├── App.jsx             # Main app component (Staff & Timetable modules)
│   ├── index.css           # Global design system & component styles
│   ├── staff-timetable.css # Staff & timetable specific styles
│   └── legacy.js           # Vanilla JS engine (marks, attendance, students, analytics)
└── dist/                   # Production build output
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18 or later
- **npm** v9 or later

### Installation

```bash
# 1. Clone or download the project
cd "task 2"

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

The app will be available at **http://localhost:5173** (or the next available port).

### Build for Production

```bash
npm run build
```

Outputs to the `dist/` folder.

### Preview Production Build

```bash
npm run preview
```

---

## 🗄️ Database Setup (Optional — Supabase)

The app works fully offline using `localStorage`. To enable cloud sync with Supabase:

1. Create a free project at [supabase.com](https://supabase.com)
2. Create the following tables:

#### `school_staff`
| Column | Type | Notes |
|---|---|---|
| `staff_no` | `int4` | Primary Key |
| `name` | `text` | Required |
| `role` | `text` | e.g., Professor, Lecturer |
| `department` | `text` | |
| `email` | `text` | Nullable |
| `phone` | `text` | Nullable |
| `status` | `text` | `active` / `leave` / `suspended` |
| `assigned_subjects` | `text[]` | Array of subject names |

#### `school_timetable`
| Column | Type | Notes |
|---|---|---|
| `id` | `text` | Primary Key (e.g., `slot-1`) |
| `class_name` | `text` | e.g., `Class 10-A` |
| `day_of_week` | `text` | Monday – Friday |
| `period` | `int4` | 1–6 |
| `subject` | `text` | |
| `teacher_no` | `int4` | FK → `school_staff.staff_no` |
| `room_no` | `text` | e.g., `Room 101`, `Lab 2` |

3. In `legacy.js`, set your Supabase **URL** and **Anon Key**:
```js
window.initSupabase = () => {
  return supabase.createClient('YOUR_SUPABASE_URL', 'YOUR_ANON_KEY');
};
```

---

## ⏱️ Period Schedule

| Period | Time |
|---|---|
| 1 | 08:30 – 09:30 |
| 2 | 09:30 – 10:30 |
| 3 | 10:45 – 11:45 |
| 4 | 11:45 – 12:45 |
| 5 | 01:45 – 02:45 |
| 6 | 02:45 – 03:45 |

---

## 🔁 Data Persistence Strategy

```
Supabase (cloud) ──► Available? ──► Use Supabase
                          │
                          └── No ──► localStorage ──► Available? ──► Use localStorage
                                                             │
                                                             └── No ──► Default mock data
```

All write operations update both **localStorage** and **Supabase** simultaneously (if connected).

---

## 🎨 Design System

- **Font**: Outfit (UI) + JetBrains Mono (codes/IDs)
- **Theme**: Dark mode with glassmorphism-inspired cards
- **Colors**: Custom CSS variables (`--accent`, `--green`, `--amber`, `--red`, etc.)
- **Animations**: Smooth hover transitions, gradient avatars, workload progress bars

---

## 📋 Available NPM Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server with HMR |
| `npm run build` | Build production bundle to `dist/` |
| `npm run preview` | Preview the production build locally |

---

## 📄 License

This project is for educational/academic administration purposes.

---

> Built with ❤️ using React + Vite · Academia Portal System
