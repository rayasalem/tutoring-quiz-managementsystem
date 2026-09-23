import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api.ts';
import { Clock, ChevronLeft, ChevronRight, Send, AlertTriangle } from 'lucide-react';

interface Option {
  id: string;
  text: string;
}

interface Question {
  id: string;
  text: string;
  points: number;
  options: Option[];
}

interface Attempt {
  id: string;
  quizId: string;
  startTime: string;
  expiresAt: string;
  status: string;
  quiz: {
    title: string;
    description: string | null;
    timeLimitMins: number;
    questions: Question[];
  };
  answers: { questionId: string; optionId: string }[];
}

export const QuizAttempt = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAttempt = useCallback(async () => {
    try {
      const response = await api.get<Attempt>(`/attempts/${id}`);
      setAttempt(response.data);
      
      // Load existing answers
      const answersMap: Record<string, string> = {};
      response.data.answers.forEach(a => {
        answersMap[a.questionId] = a.optionId;
      });
      setSelectedAnswers(answersMap);

      // Calculate initial time left
      const expires = new Date(response.data.expiresAt).getTime();
      const now = new Date().getTime();
      setTimeLeft(Math.max(0, Math.floor((expires - now) / 1000)));

      if (response.data.status === 'SUBMITTED') {
        navigate(`/student/attempts/${id}/result`);
      }
    } catch (err) {
      console.error('Failed to fetch attempt:', err);
      navigate('/student');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchAttempt();
  }, [fetchAttempt]);

  useEffect(() => {
    if (timeLeft <= 0 && attempt && attempt.status === 'IN_PROGRESS') {
      handleSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, attempt]);

  const handleOptionSelect = async (questionId: string, optionId: string) => {
    if (isSubmitting || timeLeft <= 0) return;

    setSelectedAnswers(prev => ({ ...prev, [questionId]: optionId }));

    try {
      await api.put(`/attempts/${id}/answers/${questionId}`, { optionId });
    } catch (err) {
      console.error('Failed to save answer:', err);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      await api.post(`/attempts/${id}/submit`);
      navigate(`/student/attempts/${id}/result`);
    } catch (err) {
      console.error('Failed to submit quiz:', err);
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!attempt) return null;

  const currentQuestion = attempt.quiz.questions[currentQuestionIndex];
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="font-bold text-slate-900 truncate max-w-[200px] sm:max-w-none">
            {attempt.quiz.title}
          </h1>
          
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold ${
            timeLeft < 60 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-slate-100 text-slate-700'
          }`}>
            <Clock className="w-4 h-4" />
            <span>{formatTime(timeLeft)}</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-8 px-4">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between items-end mb-2">
            <span className="text-sm font-bold text-slate-900">سؤال {currentQuestionIndex + 1} من {attempt.quiz.questions.length}</span>
            <span className="text-xs text-slate-500">التقدم: {Math.round(((Object.keys(selectedAnswers).length) / attempt.quiz.questions.length) * 100)}%</span>
          </div>
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-blue-600 h-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / attempt.quiz.questions.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-10 mb-8">
          <div className="flex items-center gap-2 mb-6">
            <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-1 rounded-md">
              {currentQuestion.points} نقاط
            </span>
          </div>
          
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-8 leading-relaxed">
            {currentQuestion.text}
          </h2>

          <div className="space-y-4">
            {currentQuestion.options.map((option) => (
              <button
                key={option.id}
                onClick={() => handleOptionSelect(currentQuestion.id, option.id)}
                className={`w-full text-right p-5 rounded-2xl border-2 transition-all flex items-center justify-between group ${
                  selectedAnswers[currentQuestion.id] === option.id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-slate-100 hover:border-slate-300 bg-white'
                }`}
              >
                <span className={`font-medium ${
                  selectedAnswers[currentQuestion.id] === option.id ? 'text-blue-900' : 'text-slate-700'
                }`}>
                  {option.text}
                </span>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  selectedAnswers[currentQuestion.id] === option.id ? 'border-blue-600 bg-blue-600' : 'border-slate-200'
                }`}>
                  {selectedAnswers[currentQuestion.id] === option.id && (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex gap-4">
            <button
              disabled={currentQuestionIndex === 0}
              onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-2xl font-bold hover:bg-slate-50 disabled:opacity-50"
            >
              <ChevronRight className="w-5 h-5" />
              السابق
            </button>
            <button
              disabled={currentQuestionIndex === attempt.quiz.questions.length - 1}
              onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-2xl font-bold hover:bg-slate-50 disabled:opacity-50"
            >
              التالي
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? 'جاري التسليم...' : 'إنهاء وتسليم الاختبار'}
            <Send className="w-4 h-4" />
          </button>
        </div>

        {/* Warnings */}
        {timeLeft < 300 && (
          <div className="mt-8 flex items-center gap-3 bg-red-50 border border-red-100 p-4 rounded-2xl text-red-800 animate-pulse">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">تبقى أقل من 5 دقائق. سيتم تسليم الاختبار تلقائياً عند انتهاء الوقت.</p>
          </div>
        )}
      </main>
    </div>
  );
};
