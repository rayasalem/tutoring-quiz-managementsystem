# AI Usage Documentation

This document transparently outlines how AI tools were utilized during the development, testing, and auditing of the Amman Tutoring Center Quiz Portal.

---

## 1. AI Tools Used
- **Google AI Studio Build Agent**: Used for initial project scaffolding, boilerplate API routing, React component scaffolding, and test suite generation.
- **Anthropic Claude / Gemini Code Assist**: Used for code auditing, edge-case analysis in security middleware, and reviewing test coverage against the assessment brief.

---

## 2. How They Were Directed
- **Prompt Engineering**: AI was instructed with explicit functional constraints rather than generic goals. Prompts included specific database schema designs, strict role-based access control rules, server-authoritative timer requirements, and RTL layout considerations.
- **Iterative Feedback Loops**: When generating endpoints and frontend components, AI was prompted in phases (Phase 1 Foundation & Auth, Phase 2 Quiz Management, Phase 3 Student Taking & Grading, Phase 4 Teacher Analytics) to maintain tight boundaries and prevent code regressions.

---

## 3. What They Were Used For
1. **Infrastructure & Boilerplate**: Generating initial Drizzle ORM schemas, SQLite database connection patterns, and Express router mounts.
2. **Security-First Middlewares**: Drafting the JWT verification, role-enforcement guards (`requireRole`), and attempt ownership checks.
3. **Frontend UI Components**: Scaffolding Tailwind CSS classes for responsive layouts, RTL navigation, and progress bars.
4. **Automated Test Cases**: Writing unit and integration test fixtures using Vitest and Supertest across authentication, quiz lifecycle, and teacher results.
5. **Seed Data Generation**: Formulating realistic Arabic student and teacher names representative of Jordan/Amman educational institutions.

---

## 4. How Output Was Checked
- **Automated Verification**: Every AI-generated file was audited through `npm test`, `npm run build`, and `npm run lint` (`tsc --noEmit`) to ensure type safety and error-free execution.
- **Security Inspection**: Every endpoint handling quiz questions was manually verified to confirm `isCorrect` fields were not leaked in student payloads before submission.
- **Cross-Role Testing**: Manually inspected and automated HTTP calls to ensure teachers cannot access other teachers' quizzes and students cannot access teacher routes.

---

## 5. Manual Fixes & Corrections
1. **Port Conflicts**: Corrected port binding conflicts between Vite dev server (3000) and backend server (3001) during test suite runs to prevent `EADDRINUSE`.
2. **Database Clean Reset & Foreign Keys**: Fixed SQLite foreign-key constraint violations during database re-seeding by enforcing reverse-order deletion of dependent records (`answers -> attempts -> options -> questions -> quizzes -> users`).
3. **Timestamp Normalization**: Resolved date comparison edge cases in the test suite by ensuring ISO-8601 string conversions were strictly enforced on server expiration checks.
4. **Git Remote URL Consistency**: Corrected git remote configuration to match the exact assessment repository name without hyphenation mismatches.

---

## 6. Testing & Auditing Process
- **Integration Test Execution**: 29 automated tests across 4 test suites covering:
  - `tests/auth.test.ts`: User registration, login, role restrictions, password hashing.
  - `tests/quizzes.test.ts`: Quiz CRUD, question/option association, date range validation.
  - `tests/student_quiz.test.ts`: Single-attempt enforcement, timer expiration, answer protection, negative marking calculations.
  - `tests/teacher_results.test.ts`: Teacher ownership authorization, class score aggregation, privacy protection.
- **Production Build & Typecheck**: Audited via `vite build && tsc` to verify zero compile or bundling warnings.
