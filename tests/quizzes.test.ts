import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../server.ts';

describe('Teacher Quiz Management API', () => {
  let teacherToken: string;
  let studentToken: string;
  let quizId: string;

  beforeAll(async () => {
    // Login teacher
    const teacherLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ahmad@nour.edu.jo', password: 'password123' });
    teacherToken = teacherLogin.body.token;

    // Login student
    const studentLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'zeid@student.com', password: 'password123' });
    studentToken = studentLogin.body.token;
  });

  it('should allow teacher to create a draft quiz', async () => {
    const res = await request(app)
      .post('/api/quizzes')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        title: 'Test Quiz',
        className: '10A',
        timeLimitMins: 30
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    quizId = res.body.id;
  });

  it('should prevent student from creating a quiz', async () => {
    const res = await request(app)
      .post('/api/quizzes')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ title: 'Student Quiz', className: '10A' });

    expect(res.status).toBe(403);
  });

  it('should allow teacher to add questions to their quiz', async () => {
    const res = await request(app)
      .post(`/api/quizzes/${quizId}/questions`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        text: 'What is 2+2?',
        points: 5,
        options: [
          { text: '4', isCorrect: true },
          { text: '3', isCorrect: false },
          { text: '5', isCorrect: false },
          { text: '6', isCorrect: false }
        ]
      });

    expect(res.status).toBe(201);
  });

  it('should fail to publish a quiz with less than 4 options per question', async () => {
    // Create new quiz
    const qRes = await request(app)
      .post('/api/quizzes')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ title: 'Invalid Quiz', className: '10A', timeLimitMins: 10 });
    
    const invalidQuizId = qRes.body.id;

    // Add invalid question (only 2 options)
    await request(app)
      .post(`/api/quizzes/${invalidQuizId}/questions`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        text: 'Invalid Question',
        options: [
          { text: 'A', isCorrect: true },
          { text: 'B', isCorrect: false }
        ]
      });

    const publishRes = await request(app)
      .post(`/api/quizzes/${invalidQuizId}/publish`)
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(publishRes.status).toBe(400);
    expect(publishRes.body.error).toBe('Validation failed');
  });

  it('should allow publishing a valid quiz', async () => {
    const res = await request(app)
      .post(`/api/quizzes/${quizId}/publish`)
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Quiz published successfully');
  });

  it('should prevent Teacher B from accessing Teacher A\'s quiz', async () => {
    // Login as Layla (Teacher B)
    const laylaLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'layla@nour.edu.jo', password: 'password123' });
    const laylaToken = laylaLogin.body.token;

    const res = await request(app)
      .get(`/api/quizzes/${quizId}`)
      .set('Authorization', `Bearer ${laylaToken}`);

    expect(res.status).toBe(404); // Or 403, but my route returns 404 if not found for that teacher
  });

  it('should prevent Teacher B from updating Teacher A\'s quiz', async () => {
    const laylaLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'layla@nour.edu.jo', password: 'password123' });
    const laylaToken = laylaLogin.body.token;

    const res = await request(app)
      .put(`/api/quizzes/${quizId}`)
      .set('Authorization', `Bearer ${laylaToken}`)
      .send({ title: 'Hacked Quiz' });

    expect(res.status).toBe(404);
  });

  it('should allow teacher to update a question', async () => {
    // Get question ID first
    const quizRes = await request(app)
      .get(`/api/quizzes/${quizId}`)
      .set('Authorization', `Bearer ${teacherToken}`);
    
    const questionId = quizRes.body.questions[0].id;

    const res = await request(app)
      .put(`/api/quizzes/questions/${questionId}`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        text: 'Updated Question Text',
        points: 10,
        options: [
          { text: 'New 4', isCorrect: true },
          { text: 'New 3', isCorrect: false },
          { text: 'New 5', isCorrect: false },
          { text: 'New 6', isCorrect: false }
        ]
      });

    expect(res.status).toBe(200);
  });

  it('should allow teacher to delete a question', async () => {
    const quizRes = await request(app)
      .get(`/api/quizzes/${quizId}`)
      .set('Authorization', `Bearer ${teacherToken}`);
    
    const questionId = quizRes.body.questions[0].id;

    const res = await request(app)
      .delete(`/api/quizzes/questions/${questionId}`)
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Question deleted');
  });
});
