import { db } from './index.ts';
import { users, quizzes, questions, options, attempts, answers } from './schema.ts';
import { hashPassword } from '../utils/auth.ts';
import crypto from 'crypto';

async function seed() {
  console.log('🌱 Seeding database...');
  
  try {
    console.log('Cleaning up existing data...');
    // We clear in reverse order of dependencies
    await db.delete(answers).run();
    await db.delete(attempts).run();
    await db.delete(options).run();
    await db.delete(questions).run();
    await db.delete(quizzes).run();
    await db.delete(users).run();

    const password = 'password123';
    const hashed = await hashPassword(password);

    const teacherAhmadId = crypto.randomUUID();

    const teachers = [
      { id: teacherAhmadId, name: 'أحمد الخطيب', email: 'ahmad@nour.edu.jo', role: 'TEACHER' as const, passwordHash: hashed },
      { id: crypto.randomUUID(), name: 'ليلى حجاوي', email: 'layla@nour.edu.jo', role: 'TEACHER' as const, passwordHash: hashed },
      { id: crypto.randomUUID(), name: 'عمر المصري', email: 'omar@nour.edu.jo', role: 'TEACHER' as const, passwordHash: hashed },
      { id: crypto.randomUUID(), name: 'سلمى العبد', email: 'salma@nour.edu.jo', role: 'TEACHER' as const, passwordHash: hashed },
    ];

    const students: any[] = [];
    const classes = ['10A', '10B', '11A'];
    const firstNames = ['زيد', 'ريما', 'خالد', 'نور', 'يوسف', 'فرح', 'عمر', 'سارة', 'علي', 'ليلى', 'محمد', 'مريم', 'أحمد', 'هبة', 'محمود', 'منى', 'حسن', 'دانا', 'سامر', 'رنا'];
    const lastNames = ['حمدان', 'القاسم', 'جابر', 'الهدى', 'منصور', 'ناصر', 'المصري', 'حجاوي', 'العبد', 'خطيب', 'عبدالله', 'الخوري', 'الحداد', 'سعيد', 'بدر', 'عوض', 'فواز', 'الشيخ', 'الرائد', 'الكامل'];

    for (const className of classes) {
      for (let i = 0; i < 20; i++) {
        students.push({
          id: crypto.randomUUID(),
          name: `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`,
          email: `student${className}${i}@nour.edu.jo`,
          role: 'STUDENT' as const,
          className,
          passwordHash: hashed
        });
      }
    }

    // Explicit sample student accounts matching README
    students.push(
      { id: crypto.randomUUID(), name: 'زيد حمدان', email: 'zeid@student.com', role: 'STUDENT' as const, className: '10A', passwordHash: hashed },
      { id: crypto.randomUUID(), name: 'خالد جابر', email: 'khaled@student.com', role: 'STUDENT' as const, className: '10B', passwordHash: hashed },
      { id: crypto.randomUUID(), name: 'يوسف منصور', email: 'yousef@student.com', role: 'STUDENT' as const, className: '11A', passwordHash: hashed }
    );

    console.log('Inserting users...');
    await db.insert(users).values([...teachers, ...students]).onConflictDoNothing();

    // Add sample quizzes for Ahmad
    const now = new Date();
    const yesterday = new Date(now.getTime() - 86400000).toISOString();
    const tomorrow = new Date(now.getTime() + 86400000).toISOString();
    const nextWeek = new Date(now.getTime() + 604800000).toISOString();
    const lastWeek = new Date(now.getTime() - 604800000).toISOString();
    const twoDaysAgo = new Date(now.getTime() - 172800000).toISOString();

    console.log('Inserting sample quizzes...');
    const q1Id = crypto.randomUUID();
    const q2Id = crypto.randomUUID();
    const q3Id = crypto.randomUUID();
    const q4Id = crypto.randomUUID();
    const q5Id = crypto.randomUUID();
    const q6Id = crypto.randomUUID();

    await db.insert(quizzes).values([
      {
        id: q1Id,
        teacherId: teacherAhmadId,
        title: 'اختبار اللغة العربية - مسودة',
        className: '10A',
        timeLimitMins: 45,
        startDate: now.toISOString(),
        endDate: tomorrow,
        isPublished: false,
      },
      {
        id: q2Id,
        teacherId: teacherAhmadId,
        title: 'تحدي الثقافة الإسلامية (متاح حالياً)',
        description: 'اختبار شامل للمواد الدراسية للشهر الأول',
        className: '11A',
        timeLimitMins: 60,
        startDate: yesterday,
        endDate: nextWeek,
        negativeMarking: true,
        isPublished: true,
      },
      {
        id: q3Id,
        teacherId: teacherAhmadId,
        title: 'اختبار الرياضيات (مغلق)',
        className: '11A',
        timeLimitMins: 30,
        startDate: lastWeek,
        endDate: twoDaysAgo,
        isPublished: true,
      },
      {
        id: q4Id,
        teacherId: teacherAhmadId,
        title: 'اختبار العلوم القادم',
        className: '11A',
        timeLimitMins: 40,
        startDate: tomorrow,
        endDate: nextWeek,
        isPublished: true,
      },
      {
        id: q5Id,
        teacherId: teacherAhmadId,
        title: 'اختبار الصف العاشر أ (متاح)',
        className: '10A',
        timeLimitMins: 20,
        startDate: yesterday,
        endDate: tomorrow,
        isPublished: true,
      },
      {
        id: q6Id,
        teacherId: teacherAhmadId,
        title: 'اختبار الصف العاشر ب (متاح)',
        className: '10B',
        timeLimitMins: 25,
        startDate: yesterday,
        endDate: tomorrow,
        isPublished: true,
      }
    ]).onConflictDoNothing();

    // Add questions for the main published quiz (q2)
    console.log('Inserting 15 questions for main published quiz...');
    for (let i = 1; i <= 15; i++) {
      const qId = crypto.randomUUID();
      await db.insert(questions).values({
        id: qId,
        quizId: q2Id,
        text: `السؤال رقم ${i}: ما هو فضل العلم في الإسلام؟`,
        points: i % 5 === 0 ? 5 : 2,
        sortOrder: i,
      });

      await db.insert(options).values([
        { id: crypto.randomUUID(), questionId: qId, text: 'الخيار الأول (صحيح)', isCorrect: true },
        { id: crypto.randomUUID(), questionId: qId, text: 'الخيار الثاني', isCorrect: false },
        { id: crypto.randomUUID(), questionId: qId, text: 'الخيار الثالث', isCorrect: false },
        { id: crypto.randomUUID(), questionId: qId, text: 'الخيار الرابع', isCorrect: false },
      ]);
    }

    // Add at least one question for q5 to make it "valid" in theory
    const q5qId = crypto.randomUUID();
    await db.insert(questions).values({
      id: q5qId,
      quizId: q5Id,
      text: 'سؤال بسيط للصف العاشر أ',
      points: 10,
      sortOrder: 1,
    });
    await db.insert(options).values([
      { id: crypto.randomUUID(), questionId: q5qId, text: 'صح', isCorrect: true },
      { id: crypto.randomUUID(), questionId: q5qId, text: 'خطأ', isCorrect: false },
      { id: crypto.randomUUID(), questionId: q5qId, text: 'ربما', isCorrect: false },
      { id: crypto.randomUUID(), questionId: q5qId, text: 'لا أعرف', isCorrect: false },
    ]);

    console.log('✅ Seeding complete!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  }
}

seed();
