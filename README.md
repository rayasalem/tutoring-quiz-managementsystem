# Amman Tutoring Center Quiz Portal

A timed quiz platform for a small tutoring centre in Amman.

## Foundation Setup

### 1. Environment Setup
Copy the example environment file:
```powershell
cp .env.example .env
```
Ensure `JWT_SECRET` is set in `.env`.

### 2. Setup and Run
Initialize the database and start the application in one command:
```powershell
npm run setup:start
```

Or run step-by-step:
```powershell
npm run setup
npm run dev
```

## Authentication & Credentials
The system uses JWT for authentication and bcrypt for password hashing.

### Sample Credentials
All accounts use the password: `password123`

#### Teachers
| Name | Email | Role |
| :--- | :--- | :--- |
| **أحمد الخطيب (Ahmad)** | `ahmad@nour.edu.jo` | Teacher (Primary) |
| **ليلى حجاوي (Layla)** | `layla@nour.edu.jo` | Teacher |
| **عمر المصري (Omar)** | `omar@nour.edu.jo` | Teacher |
| **سلمى العبد (Salma)** | `salma@nour.edu.jo` | Teacher |

#### Sample Students
| Name | Email | Class |
| :--- | :--- | :--- |
| **زيد حمدان (Zeid)** | `zeid@student.com` | 10A |
| **خالد جابر (Khaled)** | `khaled@student.com` | 10B |
| **يوسف منصور (Yousef)** | `yousef@student.com` | 11A |

*(Additional 60 students are seeded across classes: `student10A0@nour.edu.jo` to `student10A19@nour.edu.jo`, `student10B0@nour.edu.jo` to `student10B19@nour.edu.jo`, `student11A0@nour.edu.jo` to `student11A19@nour.edu.jo`).*

## URLs
- **Frontend:** [http://localhost:3000](http://localhost:3000)
- **Backend Health:** [http://localhost:3000/api/health](http://localhost:3000/api/health)
- **Auth Status:** [http://localhost:3000/api/auth/me](http://localhost:3000/api/auth/me) (requires token)

## Tech Stack
- **Frontend:** React + TypeScript + Vite + Tailwind CSS + React Router
- **Backend:** Node.js + Express + JWT + bcrypt
- **Database:** SQLite + Drizzle ORM
- **Testing:** Vitest + Supertest
