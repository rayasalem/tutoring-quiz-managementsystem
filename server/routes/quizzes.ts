import { Router } from 'express';
import { db } from '../db/index.ts';
import { quizzes, questions, options, users, attempts } from '../db/schema.ts';
import { eq, and, asc, lte, gte } from 'drizzle-orm';
import { authenticateToken, requireRole } from '../middleware/auth.ts';
import crypto from 'crypto';

const router = Router();

// GET /api/quizzes - For STUDENTS: Available quizzes for their class
router.get('/', authenticateToken, requireRole('STUDENT'), async (req, res) => {
  try {
    const student = await db.query.users.findFirst({
      where: eq(users.id, req.user!.id)
    });

    if (!student || !student.className) {
      return res.status(400).json({ error: 'Student class not found' });
    }

    const now = new Date().toISOString();

    const availableQuizzes = await db.query.quizzes.findMany({
      where: and(
        eq(quizzes.isPublished, true),
        eq(quizzes.className, student.className),
        lte(quizzes.startDate, now),
        gte(quizzes.endDate, now)
      ),
      orderBy: [asc(quizzes.startDate)],
    });

    // Filter out quizzes the student already has an attempt for
    const attemptsList = await db.query.attempts.findMany({
      where: eq(attempts.userId, req.user!.id)
    });
    const attemptedQuizIds = new Set(attemptsList.map(a => a.quizId));

    const finalQuizzes = availableQuizzes.filter(q => !attemptedQuizIds.has(q.id));

    res.json(finalQuizzes);
  } catch (error) {
    console.error('Fetch available quizzes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/quizzes/mine - TEACHER: Get all quizzes for the logged-in teacher
router.get('/mine', authenticateToken, requireRole('TEACHER'), async (req, res) => {
  try {
    const teacherQuizzes = await db.query.quizzes.findMany({
      where: eq(quizzes.teacherId, req.user!.id),
      orderBy: [asc(quizzes.createdAt)],
    });
    res.json(teacherQuizzes);
  } catch (error) {
    console.error('Fetch quizzes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/quizzes/:id - Get quiz details (supports both roles with different data)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const isTeacher = req.user!.role === 'TEACHER';
    const isStudent = req.user!.role === 'STUDENT';

    if (isTeacher) {
      const quiz = await db.query.quizzes.findFirst({
        where: and(
          eq(quizzes.id, req.params.id),
          eq(quizzes.teacherId, req.user!.id)
        ),
        with: {
          questions: {
            orderBy: [asc(questions.sortOrder)],
            with: {
              options: true,
            },
          },
        },
      });

      if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
      return res.json(quiz);
    }

    if (isStudent) {
      const student = await db.query.users.findFirst({
        where: eq(users.id, req.user!.id)
      });

      const quiz = await db.query.quizzes.findFirst({
        where: and(
          eq(quizzes.id, req.params.id),
          eq(quizzes.isPublished, true),
          eq(quizzes.className, student!.className!)
        ),
        with: {
          questions: {
            orderBy: [asc(questions.sortOrder)],
            with: {
              options: true,
            },
          },
        },
      });

      if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

      // Security: Strip isCorrect from options for students
      const safeQuiz = {
        ...quiz,
        questions: quiz.questions.map(q => ({
          ...q,
          options: q.options.map(o => ({
            id: o.id,
            questionId: o.questionId,
            text: o.text,
            // isCorrect is OMITTED
          }))
        }))
      };

      return res.json(safeQuiz);
    }

    res.status(403).json({ error: 'Forbidden' });
  } catch (error) {
    console.error('Fetch quiz error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/quizzes/:id/results - TEACHER: Get student results for a quiz
router.get('/:id/results', authenticateToken, requireRole('TEACHER'), async (req, res) => {
  try {
    const quizId = req.params.id;
    const teacherId = req.user!.id;

    // Check if quiz exists
    const quiz = await db.query.quizzes.findFirst({
      where: eq(quizzes.id, quizId),
    });

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Verify ownership
    if (quiz.teacherId !== teacherId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Fetch all attempts for this quiz joined with student data
    const quizResults = await db.query.attempts.findMany({
      where: eq(attempts.quizId, quizId),
      with: {
        user: true,
      },
      orderBy: [asc(attempts.submittedAt)],
    });

    // Format the response
    const results = quizResults.map(a => ({
      id: a.id,
      studentId: a.userId,
      studentName: a.user.name,
      studentEmail: a.user.email,
      className: a.user.className,
      score: a.score,
      status: a.status,
      startTime: a.startTime,
      submittedAt: a.submittedAt,
    }));

    res.json({
      quiz: {
        id: quiz.id,
        title: quiz.title,
        className: quiz.className,
      },
      results,
    });
  } catch (error) {
    console.error('Fetch quiz results error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/quizzes/:id/attempts - Start a new quiz attempt (STUDENT only)
router.post('/:id/attempts', authenticateToken, requireRole('STUDENT'), async (req, res) => {
  try {
    const quizId = req.params.id;
    const userId = req.user!.id;

    // Fetch quiz and student class
    const quiz = await db.query.quizzes.findFirst({
      where: eq(quizzes.id, quizId),
    });

    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    if (!quiz.isPublished) return res.status(400).json({ error: 'Quiz is not published' });

    const student = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (student?.className !== quiz.className) {
      return res.status(403).json({ error: 'This quiz is not for your class' });
    }

    // Check dates
    const now = new Date();
    if (now < new Date(quiz.startDate)) return res.status(400).json({ error: 'Quiz has not opened yet' });
    if (now > new Date(quiz.endDate)) return res.status(400).json({ error: 'Quiz has closed' });

    // Check for existing attempt (one attempt only)
    const existingAttempt = await db.query.attempts.findFirst({
      where: and(eq(attempts.quizId, quizId), eq(attempts.userId, userId)),
    });

    if (existingAttempt) {
      return res.status(409).json({ 
        error: 'Attempt already exists',
        attemptId: existingAttempt.id,
        status: existingAttempt.status
      });
    }

    // Create new attempt
    const startTime = now.toISOString();
    const expiresAt = new Date(now.getTime() + quiz.timeLimitMins * 60000).toISOString();
    const attemptId = crypto.randomUUID();

    await db.insert(attempts).values({
      id: attemptId,
      userId,
      quizId,
      startTime,
      expiresAt,
      status: 'IN_PROGRESS',
      score: 0
    });

    res.status(201).json({
      id: attemptId,
      startTime,
      expiresAt,
      timeLimitMins: quiz.timeLimitMins
    });
  } catch (error: any) {
    // Handle race condition for unique constraint
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'Attempt already exists' });
    }
    console.error('Start attempt error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/quizzes - Create a new draft quiz
router.post('/', authenticateToken, requireRole('TEACHER'), async (req, res) => {
  try {
    const { title, description, className, timeLimitMins, startDate, endDate, negativeMarking } = req.body;

    // Minimum validation for draft
    if (!title || !className) {
      return res.status(400).json({ error: 'Title and target class are required' });
    }

    const newQuiz = {
      id: crypto.randomUUID(),
      teacherId: req.user!.id,
      title,
      description,
      className,
      timeLimitMins: timeLimitMins || 0,
      startDate: startDate || new Date().toISOString(),
      endDate: endDate || new Date(Date.now() + 86400000).toISOString(),
      negativeMarking: !!negativeMarking,
      isPublished: false,
    };

    await db.insert(quizzes).values(newQuiz);
    res.status(201).json(newQuiz);
  } catch (error) {
    console.error('Create quiz error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/quizzes/:id - Update quiz metadata
router.put('/:id', authenticateToken, requireRole('TEACHER'), async (req, res) => {
  try {
    const { title, description, className, timeLimitMins, startDate, endDate, negativeMarking } = req.body;

    const existingQuiz = await db.query.quizzes.findFirst({
      where: and(
        eq(quizzes.id, req.params.id),
        eq(quizzes.teacherId, req.user!.id)
      ),
    });

    if (!existingQuiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    await db.update(quizzes)
      .set({
        title,
        description,
        className,
        timeLimitMins,
        startDate,
        endDate,
        negativeMarking: !!negativeMarking,
      })
      .where(eq(quizzes.id, req.params.id));

    res.json({ message: 'Quiz updated successfully' });
  } catch (error) {
    console.error('Update quiz error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/quizzes/:id/questions - Add a new question to a quiz
router.post('/:id/questions', authenticateToken, requireRole('TEACHER'), async (req, res) => {
  try {
    const { text, points, sortOrder, options: questionOptions } = req.body;
    const quizId = req.params.id;

    const quiz = await db.query.quizzes.findFirst({
      where: and(eq(quizzes.id, quizId), eq(quizzes.teacherId, req.user!.id)),
    });

    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    const questionId = crypto.randomUUID();

    await db.transaction((tx) => {
      tx.insert(questions).values({
        id: questionId,
        quizId,
        text,
        points: points || 1,
        sortOrder: sortOrder || 0,
      }).run();

      if (questionOptions && Array.isArray(questionOptions)) {
        for (const opt of questionOptions) {
          tx.insert(options).values({
            id: crypto.randomUUID(),
            questionId,
            text: opt.text,
            isCorrect: !!opt.isCorrect,
          }).run();
        }
      }
    });

    res.status(201).json({ id: questionId });
  } catch (error) {
    console.error('Add question error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/quizzes/:id/publish - Validate and publish a quiz
router.post('/:id/publish', authenticateToken, requireRole('TEACHER'), async (req, res) => {
  try {
    const quizId = req.params.id;
    const quiz = await db.query.quizzes.findFirst({
      where: and(eq(quizzes.id, quizId), eq(quizzes.teacherId, req.user!.id)),
      with: {
        questions: {
          with: {
            options: true,
          },
        },
      },
    });

    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    // Validation
    const errors: string[] = [];
    if (!quiz.title) errors.push('Title is required');
    if (!quiz.className) errors.push('Target class is required');
    if (quiz.timeLimitMins <= 0) errors.push('Duration must be positive');
    
    const start = new Date(quiz.startDate);
    const end = new Date(quiz.endDate);
    if (isNaN(start.getTime())) errors.push('Invalid opening date');
    if (isNaN(end.getTime())) errors.push('Invalid closing date');
    if (end <= start) errors.push('Closing date must be after opening date');

    if (quiz.questions.length === 0) {
      errors.push('Quiz must contain at least 1 question');
    }

    for (const q of quiz.questions) {
      if (q.options.length !== 4) {
        errors.push(`Question "${q.text}" must have exactly 4 options`);
      }
      const correctCount = q.options.filter(o => o.isCorrect).length;
      if (correctCount !== 1) {
        errors.push(`Question "${q.text}" must have exactly 1 correct option`);
      }
      if (q.points <= 0) {
        errors.push(`Question "${q.text}" must have points greater than 0`);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    await db.update(quizzes)
      .set({ isPublished: true })
      .where(eq(quizzes.id, quizId));

    res.json({ message: 'Quiz published successfully', isPublished: true });
  } catch (error) {
    console.error('Publish quiz error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/questions/:id
router.delete('/questions/:id', authenticateToken, requireRole('TEACHER'), async (req, res) => {
  try {
    // We need to verify ownership via the quiz
    const question = await db.query.questions.findFirst({
      where: eq(questions.id, req.params.id),
      with: {
        quiz: true
      }
    });

    if (!question) return res.status(404).json({ error: 'Question not found' });
    if (question.quiz.teacherId !== req.user!.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await db.delete(questions).where(eq(questions.id, req.params.id));
    res.json({ message: 'Question deleted' });
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/questions/:id
router.put('/questions/:id', authenticateToken, requireRole('TEACHER'), async (req, res) => {
  try {
    const { text, points, sortOrder, options: questionOptions } = req.body;
    
    const question = await db.query.questions.findFirst({
      where: eq(questions.id, req.params.id),
      with: {
        quiz: true
      }
    });

    if (!question) return res.status(404).json({ error: 'Question not found' });
    if (question.quiz.teacherId !== req.user!.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await db.transaction((tx) => {
      tx.update(questions)
        .set({
          text,
          points: points || 1,
          sortOrder: sortOrder || 0,
        })
        .where(eq(questions.id, req.params.id))
        .run();

      if (questionOptions && Array.isArray(questionOptions)) {
        // Simple approach: delete and recreate options
        tx.delete(options).where(eq(options.questionId, req.params.id)).run();
        
        for (const opt of questionOptions) {
          tx.insert(options).values({
            id: crypto.randomUUID(),
            questionId: req.params.id,
            text: opt.text,
            isCorrect: !!opt.isCorrect,
          }).run();
        }
      }
    });

    res.json({ message: 'Question updated successfully' });
  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
