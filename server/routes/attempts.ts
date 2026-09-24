import { Router } from 'express';
import { db } from '../db/index.ts';
import { attempts, answers, options } from '../db/schema.ts';
import { eq, and } from 'drizzle-orm';
import { authenticateToken } from '../middleware/auth.ts';
import crypto from 'crypto';

const router = Router();

// Middleware applied to all attempt routes
router.use(authenticateToken);

// GET /api/attempts/:id - Get attempt details
router.get('/:id', async (req, res) => {
  try {
    const attempt = await db.query.attempts.findFirst({
      where: and(
        eq(attempts.id, req.params.id),
        eq(attempts.userId, req.user!.id)
      ),
      with: {
        quiz: {
          with: {
            questions: {
              with: {
                options: true
              }
            }
          }
        },
        answers: true
      }
    });

    if (!attempt) return res.status(404).json({ error: 'Attempt not found' });

    // Security: Strip isCorrect from options
    const safeAttempt = {
      ...attempt,
      quiz: {
        ...attempt.quiz,
        questions: attempt.quiz.questions.map(q => ({
          ...q,
          options: q.options.map(o => ({
            id: o.id,
            questionId: o.questionId,
            text: o.text
          }))
        }))
      }
    };

    res.json(safeAttempt);
  } catch (error) {
    console.error('Fetch attempt error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/attempts/:attemptId/answers/:questionId - Save/Update an answer
router.put('/:attemptId/answers/:questionId', async (req, res) => {
  try {
    const { optionId } = req.body;
    const { attemptId, questionId } = req.params;

    const attempt = await db.query.attempts.findFirst({
      where: and(
        eq(attempts.id, attemptId),
        eq(attempts.userId, req.user!.id)
      )
    });

    if (!attempt) return res.status(404).json({ error: 'Attempt not found' });
    if (attempt.status !== 'IN_PROGRESS') return res.status(400).json({ error: 'Attempt is already submitted' });

    // Check expiration
    if (new Date() > new Date(attempt.expiresAt)) {
      return res.status(400).json({ error: 'Attempt has expired' });
    }

    // Verify option belongs to question
    const option = await db.query.options.findFirst({
      where: and(
        eq(options.id, optionId),
        eq(options.questionId, questionId)
      )
    });

    if (!option) return res.status(400).json({ error: 'Invalid option for this question' });

    // Upsert answer
    const existingAnswer = await db.query.answers.findFirst({
      where: and(
        eq(answers.attemptId, attemptId),
        eq(answers.questionId, questionId)
      )
    });

    if (existingAnswer) {
      await db.update(answers)
        .set({ optionId })
        .where(eq(answers.id, existingAnswer.id));
    } else {
      await db.insert(answers).values({
        id: crypto.randomUUID(),
        attemptId,
        questionId,
        optionId
      });
    }

    res.json({ message: 'Answer saved' });
  } catch (error) {
    console.error('Save answer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/attempts/:id/submit - Submit and grade
router.post('/:id/submit', async (req, res) => {
  try {
    const attemptId = req.params.id;
    const attempt = await db.query.attempts.findFirst({
      where: and(
        eq(attempts.id, attemptId),
        eq(attempts.userId, req.user!.id)
      ),
      with: {
        quiz: {
          with: {
            questions: {
              with: {
                options: true
              }
            }
          }
        },
        answers: true
      }
    });

    if (!attempt) return res.status(404).json({ error: 'Attempt not found' });
    if (attempt.status !== 'IN_PROGRESS') {
      return res.status(400).json({ error: 'Attempt is already submitted', score: attempt.score });
    }

    const now = new Date();
    const isExpired = now > new Date(attempt.expiresAt);
    const submittedAt = isExpired ? attempt.expiresAt : now.toISOString();

    // Grading Logic
    let totalScore = 0;
    for (const question of attempt.quiz.questions) {
      const answer = attempt.answers.find(a => a.questionId === question.id);
      if (!answer) continue; // Unanswered = 0 points

      const selectedOption = question.options.find(o => o.id === answer.optionId);
      if (selectedOption?.isCorrect) {
        totalScore += question.points;
      } else if (attempt.quiz.negativeMarking) {
        totalScore -= (question.points * 0.5);
      }
    }

    await db.update(attempts)
      .set({
        status: 'SUBMITTED',
        submittedAt,
        score: totalScore
      })
      .where(eq(attempts.id, attemptId));

    res.json({ message: 'Submitted successfully', score: totalScore, status: 'SUBMITTED' });
  } catch (error) {
    console.error('Submit attempt error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/attempts/:id/result - Get result summary
router.get('/:id/result', async (req, res) => {
  try {
    const attempt = await db.query.attempts.findFirst({
      where: and(
        eq(attempts.id, req.params.id),
        eq(attempts.userId, req.user!.id)
      ),
      with: {
        quiz: {
          with: {
            questions: {
              with: {
                options: true
              }
            }
          }
        },
        answers: {
          with: {
            option: true
          }
        }
      }
    });

    if (!attempt) return res.status(404).json({ error: 'Attempt not found' });
    if (attempt.status !== 'SUBMITTED') return res.status(400).json({ error: 'Attempt not yet submitted' });

    // Calculate total possible points
    const totalPossiblePoints = attempt.quiz.questions.reduce((sum, q) => sum + q.points, 0);

    const questionResults = attempt.quiz.questions.map(q => {
      const answer = attempt.answers.find(a => a.questionId === q.id);
      const isCorrect = answer?.option?.isCorrect || false;
      const awardedPoints = isCorrect ? q.points : (answer && attempt.quiz.negativeMarking ? -(q.points * 0.5) : 0);

      return {
        id: q.id,
        text: q.text,
        points: q.points,
        selectedOptionId: answer?.optionId,
        isCorrect,
        awardedPoints
      };
    });

    res.json({
      quizTitle: attempt.quiz.title,
      score: attempt.score,
      totalPossiblePoints,
      submittedAt: attempt.submittedAt,
      questionResults
    });
  } catch (error) {
    console.error('Fetch result error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
