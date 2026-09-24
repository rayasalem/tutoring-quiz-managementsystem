import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql, relations } from 'drizzle-orm';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role', { enum: ['STUDENT', 'TEACHER'] }).notNull(),
  className: text('class_name'), // e.g., '10A', '10B', '11A'
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const usersRelations = relations(users, ({ many }) => ({
  quizzes: many(quizzes),
  attempts: many(attempts),
}));

export const quizzes = sqliteTable('quizzes', {
  id: text('id').primaryKey(),
  teacherId: text('teacher_id').notNull().references(() => users.id),
  title: text('title').notNull(),
  description: text('description'),
  className: text('class_name').notNull(), // Target class for the quiz
  timeLimitMins: integer('time_limit_mins').notNull(),
  startDate: text('start_date').notNull(), // ISO string
  endDate: text('end_date').notNull(), // ISO string
  negativeMarking: integer('negative_marking', { mode: 'boolean' }).notNull().default(false),
  isPublished: integer('is_published', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const quizzesRelations = relations(quizzes, ({ one, many }) => ({
  teacher: one(users, {
    fields: [quizzes.teacherId],
    references: [users.id],
  }),
  questions: many(questions),
  attempts: many(attempts),
}));

export const questions = sqliteTable('questions', {
  id: text('id').primaryKey(),
  quizId: text('quiz_id').notNull().references(() => quizzes.id, { onDelete: 'cascade' }),
  text: text('text').notNull(),
  points: integer('points').notNull().default(1),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const questionsRelations = relations(questions, ({ one, many }) => ({
  quiz: one(quizzes, {
    fields: [questions.quizId],
    references: [quizzes.id],
  }),
  options: many(options),
}));

export const options = sqliteTable('options', {
  id: text('id').primaryKey(),
  questionId: text('question_id').notNull().references(() => questions.id, { onDelete: 'cascade' }),
  text: text('text').notNull(),
  isCorrect: integer('is_correct', { mode: 'boolean' }).notNull().default(false),
});

export const optionsRelations = relations(options, ({ one }) => ({
  question: one(questions, {
    fields: [options.questionId],
    references: [questions.id],
  }),
}));

export const attempts = sqliteTable('attempts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  quizId: text('quiz_id').notNull().references(() => quizzes.id),
  startTime: text('start_time').notNull().default(sql`CURRENT_TIMESTAMP`),
  submittedAt: text('submitted_at'),
  expiresAt: text('expires_at').notNull(), // Authority for the timer
  score: real('score').notNull().default(0),
  status: text('status', { enum: ['IN_PROGRESS', 'SUBMITTED'] }).notNull().default('IN_PROGRESS'),
});

export const attemptsRelations = relations(attempts, ({ one, many }) => ({
  user: one(users, {
    fields: [attempts.userId],
    references: [users.id],
  }),
  quiz: one(quizzes, {
    fields: [attempts.quizId],
    references: [quizzes.id],
  }),
  answers: many(answers),
}));

export const answers = sqliteTable('answers', {
  id: text('id').primaryKey(),
  attemptId: text('attempt_id').notNull().references(() => attempts.id, { onDelete: 'cascade' }),
  questionId: text('question_id').notNull().references(() => questions.id),
  optionId: text('option_id').notNull().references(() => options.id),
});

export const answersRelations = relations(answers, ({ one }) => ({
  attempt: one(attempts, {
    fields: [answers.attemptId],
    references: [attempts.id],
  }),
  question: one(questions, {
    fields: [answers.questionId],
    references: [questions.id],
  }),
  option: one(options, {
    fields: [answers.optionId],
    references: [options.id],
  }),
}));
