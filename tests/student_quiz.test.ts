import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../server.ts';
import { db } from '../server/db/index.ts';
import { users, quizzes, questions, options, attempts, answers } from '../server/db/schema.ts';
import { eq, and } from 'drizzle-orm';

describe('Student Quiz Flow API', () => {
  let studentToken: string;
  let anotherStudentToken: string;
  let teacherToken: string;
  let quizId: string;
  let teacherId: string;
  let studentId: string;
  let anotherStudentId: string;

  beforeAll(async () => {
    // Re-seed or ensure necessary data exists without clobbering others
    const password = 'password123';
    const { hashPassword } = await import('../server/utils/auth.ts');
    const hashed = await hashPassword(password);
    
    studentId = crypto.randomUUID();
    const studentEmail = `student_${studentId}@test.com`;
    
    teacherId = crypto.randomUUID();
    
    await db.insert(users).values([
      { id: teacherId, name: 'Teacher', email: `teacher_${teacherId}@test.com`, role: 'TEACHER', passwordHash: hashed },
      { id: studentId, name: 'Student 10A', email: studentEmail, role: 'STUDENT', className: '10A', passwordHash: hashed },
    ]).onConflictDoNothing();

    const now = new Date();
    const yesterday = new Date(now.getTime() - 86400000).toISOString();
    const tomorrow = new Date(now.getTime() + 86400000).toISOString();

    quizId = crypto.randomUUID();
    await db.insert(quizzes).values({
      id: quizId,
      teacherId,
      title: 'اختبار الصف العاشر أ (متاح)',
      className: '10A',
      timeLimitMins: 30,
      startDate: yesterday,
      endDate: tomorrow,
      isPublished: true,
    });

    const qId = crypto.randomUUID();
    await db.insert(questions).values({
      id: qId,
      quizId,
      text: 'Question 1',
      points: 5,
      sortOrder: 1,
    });

    await db.insert(options).values([
      { id: crypto.randomUUID(), questionId: qId, text: 'Correct', isCorrect: true },
      { id: crypto.randomUUID(), questionId: qId, text: 'Wrong', isCorrect: false },
    ]);

    // Get tokens via direct login
    const studentLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: studentEmail, password: 'password123' });
    studentToken = studentLogin.body.token;

    // Another student for class isolation test
    anotherStudentId = crypto.randomUUID();
    const anotherEmail = `student_${anotherStudentId}@test.com`;
    await db.insert(users).values({
      id: anotherStudentId,
      name: 'Student 10B',
      email: anotherEmail,
      role: 'STUDENT',
      className: '10B',
      passwordHash: hashed
    });

    const anotherLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: anotherEmail, password: 'password123' });
    anotherStudentToken = anotherLogin.body.token;
  });

  it('student should see matching-class published quiz', async () => {
    const res = await request(app)
      .get('/api/quizzes')
      .set('Authorization', `Bearer ${studentToken}`);
    
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some((q: any) => q.id === quizId)).toBe(true);
  });

  it('student should not see quiz for another class', async () => {
    const res = await request(app)
      .get('/api/quizzes')
      .set('Authorization', `Bearer ${anotherStudentToken}`);
    
    // Khaled is in 10B, so he shouldn't see the 10A quiz
    expect(res.body.some((q: any) => q.id === quizId)).toBe(false);
  });

  it('student cannot see isCorrect in quiz details', async () => {
    const res = await request(app)
      .get(`/api/quizzes/${quizId}`)
      .set('Authorization', `Bearer ${studentToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body.questions[0].options[0].isCorrect).toBeUndefined();
  });

  it('student can start available quiz', async () => {
    const res = await request(app)
      .post(`/api/quizzes/${quizId}/attempts`)
      .set('Authorization', `Bearer ${studentToken}`);
    
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('expiresAt');
  });

  it('student cannot create duplicate attempt', async () => {
    const res = await request(app)
      .post(`/api/quizzes/${quizId}/attempts`)
      .set('Authorization', `Bearer ${studentToken}`);
    
    expect(res.status).toBe(409);
  });

  it('student can save answer', async () => {
    const attemptRes = await db.query.attempts.findFirst({
      where: eq(attempts.quizId, quizId)
    });
    const attemptId = attemptRes!.id;

    const quizRes = await request(app)
      .get(`/api/quizzes/${quizId}`)
      .set('Authorization', `Bearer ${studentToken}`);
    
    const questionId = quizRes.body.questions[0].id;
    const optionId = quizRes.body.questions[0].options[0].id;

    const res = await request(app)
      .put(`/api/attempts/${attemptId}/answers/${questionId}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ optionId });
    
    expect(res.status).toBe(200);
  });

  it('student cannot access another students attempt', async () => {
    const attemptRes = await db.query.attempts.findFirst({
      where: eq(attempts.userId, studentId)
    });
    const attemptId = attemptRes!.id;

    const res = await request(app)
      .get(`/api/attempts/${attemptId}`)
      .set('Authorization', `Bearer ${anotherStudentToken}`);
    
    expect(res.status).toBe(404);
  });

  it('student can submit quiz and get score', async () => {
    const attemptRes = await db.query.attempts.findFirst({
      where: and(eq(attempts.userId, studentId), eq(attempts.quizId, quizId))
    });
    const attemptId = attemptRes!.id;

    const res = await request(app)
      .post(`/api/attempts/${attemptId}/submit`)
      .set('Authorization', `Bearer ${studentToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('score');
  });

  it('result should be accessible and show isCorrect after submission', async () => {
    const attemptRes = await db.query.attempts.findFirst({
      where: and(eq(attempts.userId, studentId), eq(attempts.quizId, quizId))
    });
    const attemptId = attemptRes!.id;

    const res = await request(app)
      .get(`/api/attempts/${attemptId}/result`)
      .set('Authorization', `Bearer ${studentToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body.questionResults[0]).toHaveProperty('isCorrect');
  });
});
