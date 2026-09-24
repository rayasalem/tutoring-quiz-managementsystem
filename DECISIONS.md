# Architectural Decisions

## Phase 1: Authentication & Foundation
- **Mechanism**: JSON Web Token (JWT) for stateless authentication.
- **Storage**: Tokens in `localStorage` (simplified for assessment).
- **Password Hashing**: `bcryptjs` with salt factor 10.
- **Roles**: `STUDENT` and `TEACHER` roles enforced via backend middleware.

## Phase 3: Student Quiz Flow
- **One Attempt Only**: Enforced by a unique constraint on `(user_id, quiz_id)` in the `attempts` table. This prevents students from retrying the same quiz.
- **Server-Authoritative Timer**: 
  - `expiresAt` is calculated and stored on the server at the moment of attempt creation (`startTime + timeLimit`).
  - All answer saves and submissions are validated against this `expiresAt` timestamp.
  - The frontend countdown is purely cosmetic and synchronizes with the server time.
- **Security & Answer Protection**:
  - The `GET /api/quizzes/:id` and `GET /api/attempts/:id` endpoints for students explicitly strip the `isCorrect` property from options.
  - Correct answers are only exposed via the `GET /api/attempts/:id/result` endpoint *after* the attempt is marked as `SUBMITTED`.
- **Grading Formula**:
  - Implementation: Correct (+Full Points), Wrong with Negative Marking (-50% of Points), Unanswered (0).
  - Logic is fully backend-contained to prevent client-side manipulation.
- **Refresh & Persistence**:
  - Attempts are persistent. Refreshing or closing the browser does not reset the timer or lose saved answers.
  - Upon reconnection, the student resumes from where they left off, provided `now < expiresAt`.

## Teacher Results & Performance
- **Authorization**: Ownership-based access control. Teachers can only view results for quizzes they created.
- **Privacy**: Student results include essential PII (Name, Email, Class) but omit sensitive credentials.
- **Aggregate Stats**: Server calculates score distribution (average) on-the-fly to provide a high-level performance overview without complex database views.

