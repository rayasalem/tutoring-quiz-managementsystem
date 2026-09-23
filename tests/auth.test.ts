import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../server.ts';
import { db } from '../server/db/index.ts';
import { users } from '../server/db/schema.ts';
import { eq } from 'drizzle-orm';

describe('Authentication API', () => {
  const teacherCredentials = {
    email: 'ahmad@nour.edu.jo',
    password: 'password123'
  };

  const studentCredentials = {
    email: 'zeid@student.com',
    password: 'password123'
  };

  it('should login a teacher successfully', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send(teacherCredentials);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.role).toBe('TEACHER');
    expect(res.body.user).not.toHaveProperty('passwordHash');
  });

  it('should login a student successfully', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send(studentCredentials);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.role).toBe('STUDENT');
  });

  it('should fail with incorrect password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: teacherCredentials.email,
        password: 'wrongpassword'
      });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error', 'Invalid email or password');
  });

  it('should fail with unknown email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'unknown@example.com',
        password: 'password123'
      });

    expect(res.status).toBe(401);
  });

  it('should get current user info with valid token', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send(teacherCredentials);
    
    const token = loginRes.body.token;

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe(teacherCredentials.email);
    expect(res.body).not.toHaveProperty('passwordHash');
  });

  it('should fail /me without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('should fail /me with invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid-token');
    expect(res.status).toBe(401);
  });
});
