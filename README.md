# Amman Tutoring Center Quiz Portal

A secure, mobile-responsive, and RTL-first timed quiz platform designed for a tutoring centre in Amman, Jordan.

---

## 1. Prerequisites
- **Node.js**: `v18.0.0` or higher (`v20+` recommended)
- **npm**: `v9.0.0` or higher
- **Git**

No external database server (PostgreSQL/MySQL/Docker) is required. The application runs locally using an embedded SQLite database.

---

## 2. One-Command Startup (Clean Machine)

Clone the repository and run the single initialization and start command:

```bash
npm run setup:start
```

This single command automatically:
1. Installs all project dependencies (`npm install`)
2. Creates and pushes the SQLite schema (`drizzle-kit push`)
3. Seeds realistic sample data: 4 teachers, 3 classes, 60 students, and sample quizzes (`npm run db:seed`)
4. Launches the full-stack development environment concurrently on **http://localhost:3000**

---

### Alternative: Step-by-Step Setup
If you prefer running the lifecycle steps individually:

```bash
# 1. Install dependencies and seed the database
npm run setup

# 2. Start the development servers
npm run dev
```

*(Optional environment configuration)*: A `.env.example` file is included. If `.env` is omitted, the application automatically uses safe fallback development defaults for local zero-config evaluation.

---

## 3. URLs & Endpoints
- **Application Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend Health Check**: [http://localhost:3000/api/health](http://localhost:3000/api/health)
- **Current Session Info**: [http://localhost:3000/api/auth/me](http://localhost:3000/api/auth/me) *(requires Bearer token)*

---

## 4. Test Credentials

The database comes pre-seeded with authentic Jordanian Arabic accounts across teachers and multiple cohorts.

### Teacher Accounts
All teachers use the password: `password123`

| Teacher Name | Email | Role | Focus Cohorts |
| :--- | :--- | :--- | :--- |
| **أحمد الخطيب (Ahmad)** | `ahmad@nour.edu.jo` | Teacher (Primary) | 10A, 10B, 11A |
| **ليلى حجاوي (Layla)** | `layla@nour.edu.jo` | Teacher | 10A, 10B |
| **عمر المصري (Omar)** | `omar@nour.edu.jo` | Teacher | 11A |
| **سلمى العبد (Salma)** | `salma@nour.edu.jo` | Teacher | 10A |

### Student Accounts
All students use the password: `password123`

| Student Name | Email | Class | Notes |
| :--- | :--- | :--- | :--- |
| **زيد حمدان (Zeid)** | `student10A0@nour.edu.jo` | **10A** | Eligible for 10A quizzes |
| **ريما القاسم (Reema)** | `student10A1@nour.edu.jo` | **10A** | Eligible for 10A quizzes |
| **خالد جابر (Khaled)** | `student10B0@nour.edu.jo` | **10B** | Eligible for 10B quizzes |
| **نور الهدى (Nour)** | `student10B1@nour.edu.jo` | **10B** | Eligible for 10B quizzes |
| **يوسف منصور (Yousef)** | `student11A0@nour.edu.jo` | **11A** | Eligible for 11A quizzes |
| **فرح ناصر (Farah)** | `student11A1@nour.edu.jo` | **11A** | Eligible for 11A quizzes |

*(Total of 60 students are seeded: 20 in 10A, 20 in 10B, and 20 in 11A, matching pattern `student<CLASS><INDEX>@nour.edu.jo`).*

---

## 5. Sample Data Overview
- **3 Classes**: `10A`, `10B`, `11A`.
- **20 Students per class** (60 total active student profiles).
- **4 Teachers** representing the initial faculty roll-out.
- **Pre-configured Quizzes**:
  - `تحدي الثقافة الإسلامية`: 15 questions, 60 minutes, negative marking enabled, assigned to Grade 11A (Active).
  - `اختبار الصف العاشر أ`: Timed quiz assigned to Grade 10A (Active).
  - `اختبار الصف العاشر ب`: Timed quiz assigned to Grade 10B (Active).
  - `اختبار الرياضيات`: Closed/past deadline quiz (for testing expiration handling).
  - `اختبار اللغة العربية`: Draft quiz (unpublished, testing draft visibility).

---

## 6. Verification & Testing
Run the automated test suite and typecheck verification:

```bash
# Run Vitest test suites (29 tests)
npm test

# Production build check
npm run build

# TypeScript validation
npm run lint
```

---

## 7. Architecture & Tech Stack
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide React Icons.
- **Backend**: Node.js, Express, JSON Web Tokens (JWT), bcryptjs.
- **Database**: SQLite (`better-sqlite3`), Drizzle ORM.
- **Test Framework**: Vitest, Supertest.
