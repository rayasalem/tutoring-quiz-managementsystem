import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../server.ts';

describe('Teacher Results API', () => {
  let ahmadToken: string;
  let sarahToken: string;
  let studentToken: string;
  let ahmadQuizId: string;

  beforeAll(async () => {
    // Login as Ahmad
    const ahmadRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ahmad@nour.edu.jo', password: 'password123' });
    ahmadToken = ahmadRes.body.token;

    // Login as Layla
    const sarahRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'layla@nour.edu.jo', password: 'password123' });
    sarahToken = sarahRes.body.token;

    // Login as Student (Zeid)
    const studentRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'zeid@student.com', password: 'password123' });
    studentToken = studentRes.body.token;

    // Get one of Ahmad's quizzes
    const quizzesRes = await request(app)
      .get('/api/quizzes/mine')
      .set('Authorization', `Bearer ${ahmadToken}`);
    ahmadQuizId = quizzesRes.body[0].id;
  });

  it('allows a teacher to retrieve results for their own quiz', async () => {
    const res = await request(app)
      .get(`/api/quizzes/${ahmadQuizId}/results`)
      .set('Authorization', `Bearer ${ahmadToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('quiz');
    expect(res.body).toHaveProperty('results');
    expect(Array.isArray(res.body.results)).toBe(true);
    expect(res.body.quiz.id).toBe(ahmadQuizId);
  });

  it('denies another teacher from viewing the results', async () => {
    const res = await request(app)
      .get(`/api/quizzes/${ahmadQuizId}/results`)
      .set('Authorization', `Bearer ${sarahToken}`);
    
    expect(res.status).toBe(403);
  });

  it('denies a student from viewing the results', async () => {
    const res = await request(app)
      .get(`/api/quizzes/${ahmadQuizId}/results`)
      .set('Authorization', `Bearer ${studentToken}`);
    
    expect(res.status).toBe(403);
  });

  it('returns 404 for a non-existent quiz', async () => {
    const res = await request(app)
      .get(`/api/quizzes/non-existent-id/results`)
      .set('Authorization', `Bearer ${ahmadToken}`);
    
    expect(res.status).toBe(404);
  });
});
