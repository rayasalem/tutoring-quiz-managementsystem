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
| Role | Email | Password | Class |
| :--- | :--- | :--- | :--- |
| **Teacher** | `ahmad@nour.edu.jo` | `password123` | - |
| **Student (10A)** | `zeid@student.com` | `password123` | 10A |
| **Student (10B)** | `khaled@student.com` | `password123` | 10B |
| **Student (11A)** | `yousef@student.com` | `password123` | 11A |

## URLs
- **Frontend:** [http://localhost:3000](http://localhost:3000)
- **Backend Health:** [http://localhost:3005/api/health](http://localhost:3005/api/health)
- **Auth Status:** [http://localhost:3000/api/auth/me](http://localhost:3000/api/auth/me) (requires token)

## Tech Stack
- **Frontend:** React + TypeScript + Vite + Tailwind CSS + React Router
- **Backend:** Node.js + Express + JWT + bcrypt
- **Database:** SQLite + Drizzle ORM
- **Testing:** Vitest + Supertest
