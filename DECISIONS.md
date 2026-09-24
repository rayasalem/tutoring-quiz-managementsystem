# Architectural Decisions & Assessment Brief Rationale

## 1. Core Architectural Overview
- **Authentication & Authorization**: JSON Web Token (JWT) stateless auth with role-based access control (`STUDENT`, `TEACHER`). Passwords hashed with `bcryptjs` (salt factor 10).
- **Backend**: Express + TypeScript with modular router separation (`auth`, `quizzes`, `attempts`).
- **Database**: SQLite with `better-sqlite3` and Drizzle ORM for local zero-dependency persistence without running a separate database server.
- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS + React Router, designed RTL-first for Arabic locale.

---

## 2. Assumptions
1. **Curriculum & Classes**: The tutoring center operates with defined cohorts (Grades 10A, 10B, 11A). Quizzes are assigned at the cohort level, and students only see quizzes assigned to their class.
2. **Access Security & Timing**: In an Amman tutoring center setting where quizzes may be taken on personal mobile devices or lab workstations, the client clock cannot be trusted. Therefore, the server is the single source of truth for start times, deadlines, and time limits.
3. **Assessment Grading Standard**: When negative marking is enabled for competitive practice (e.g., Tawjihi preparation), incorrect answers penalize by 50% of the question's point value, while unanswered questions carry 0 points (neither penalty nor reward). Minimum attempt score is floored at 0 to prevent negative net scores.
4. **Session Resiliency**: Students on spotty mobile data connections in Amman need persistence: refreshing or accidentally closing the browser does not lose saved answers or reset the server-authoritative timer.

---

## 3. Ambiguous Requirements & Our Decisions
1. **Attempt Resumption vs. Cheating Prevention**:
   - *Ambiguity*: Should a student be allowed to reopen an ongoing quiz if their browser closes?
   - *Decision*: Yes, but the timer continues ticking on the server (`expiresAt`). If they return before `expiresAt`, they resume their current answers. Once submitted or expired, no further attempts or modifications are permitted.
2. **Answer Visibility Timing**:
   - *Ambiguity*: When should correct answers and explanations be shown to students?
   - *Decision*: Never during the quiz attempt. The `isCorrect` flag is stripped by server-side serialization when serving quiz questions and active attempts. Full question breakdowns with correct answers and explanations are only delivered upon successful submission.
3. **Teacher Result Privacy**:
   - *Ambiguity*: Can any teacher view quiz results across the tutoring center?
   - *Decision*: No. Access control strictly verifies quiz ownership (`quiz.teacherId === req.user.id`). Teachers can only access student submissions and score distributions for quizzes they created.

---

## 4. Features Built That Nour Did Not Explicitly Request (And Why)
1. **Visual Score Distribution & Question Analysis**:
   - *Why*: Teachers need at-a-glance insight into cohort performance and identifying which questions had the highest failure rates, rather than manually tallying scores from raw lists.
2. **Pre-Submission Answer Flagging / Overview**:
   - *Why*: In timed exams, students benefit from seeing how many questions remain unanswered before clicking final submission, reducing accidental blank submissions.
3. **Seed Seeding Script with Realistic Cohorts**:
   - *Why*: Enables immediate evaluation with 3 classes, 60 students (20 per class), and 4 teachers using authentic Jordanian Arabic names and curriculum-aligned sample questions.

---

## 5. Things Deliberately Left Out (And Why)
1. **Public Self-Registration / Sign Up**:
   - *Why*: A physical tutoring center manages enrollment administratively. Allowing arbitrary public registration would risk unauthorized students joining classes.
2. **Online Payment & Billing**:
   - *Why*: Out of scope for a quiz management system; distracts from core assessment goals.
3. **Live Chat / Real-time Messaging**:
   - *Why*: Unnecessary complexity that distracts from exam integrity.
4. **Complex External LMS Integrations**:
   - *Why*: Kept zero-dependency for clean single-machine evaluation.

---

## 6. What We Would Do Next With Another Week
1. **CSV / Excel Export**: Allow teachers to download gradebooks for institutional reporting.
2. **Question Bank & Randomization**: Enable question pools where each student receives a randomized permutation of questions and options to prevent shoulder surfing in shared computer labs.
3. **Student Analytics History**: Provide students with historical performance trends over time across different subjects.
4. **Offline PWA Support**: Service worker caching of quiz static assets so students with brief internet drops experience zero interface stutter.
