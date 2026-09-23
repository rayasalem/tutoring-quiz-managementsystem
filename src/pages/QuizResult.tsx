import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api.ts';
import { CheckCircle, XCircle, LayoutDashboard, Calendar, BarChart3 } from 'lucide-react';

interface QuestionResult {
  id: string;
  text: string;
  points: number;
  selectedOptionId: string | null;
  isCorrect: boolean;
  awardedPoints: number;
}

interface Result {
  quizTitle: string;
  score: number;
  totalPossiblePoints: number;
  submittedAt: string;
  questionResults: QuestionResult[];
}

export const QuizResult = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const response = await api.get<Result>(`/attempts/${id}/result`);
        setResult(response.data);
      } catch (err) {
        console.error('Failed to fetch result:', err);
        navigate('/student');
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!result) return null;

  const percentage = Math.round((result.score / result.totalPossiblePoints) * 100);
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ar-JO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans" dir="rtl">
      <main className="max-w-4xl mx-auto py-12 px-4">
        {/* Result Header */}
        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden mb-8">
          <div className="bg-blue-600 p-10 text-center text-white">
            <h1 className="text-3xl font-extrabold mb-4">{result.quizTitle}</h1>
            <div className="flex justify-center items-center gap-6 opacity-90">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(result.submittedAt)}</span>
              </div>
            </div>
          </div>
          
          <div className="p-10 text-center">
            <div className="inline-flex flex-col items-center justify-center w-40 h-40 rounded-full border-8 border-blue-50 mb-6">
              <span className="text-4xl font-black text-slate-900">{result.score}</span>
              <span className="text-sm text-slate-500 font-bold">من {result.totalPossiblePoints}</span>
            </div>
            
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              {percentage >= 90 ? 'ممتاز جداً! 🎉' : 
               percentage >= 75 ? 'عمل رائع! 👏' :
               percentage >= 50 ? 'جيد، استمر في الدراسة 👍' :
               'حظ أوفر المرة القادمة 📚'}
            </h2>
            <p className="text-slate-500">لقد حصلت على نسبة {percentage}% في هذا الاختبار.</p>
          </div>
        </div>

        {/* Detailed Feedback */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="text-blue-600 w-5 h-5" />
            تفاصيل الإجابات
          </h3>
          
          {result.questionResults.map((q, idx) => (
            <div key={q.id} className="bg-white rounded-3xl border border-slate-100 p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
              <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center font-bold text-slate-400 flex-shrink-0">
                {idx + 1}
              </div>
              
              <div className="flex-1">
                <p className="text-slate-900 font-bold mb-1 leading-relaxed">{q.text}</p>
                <div className="flex items-center gap-4 mt-2">
                  {q.selectedOptionId ? (
                    <div className={`flex items-center gap-1.5 text-sm font-medium ${q.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                      {q.isCorrect ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      <span>{q.isCorrect ? 'إجابة صحيحة' : 'إجابة خاطئة'}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-sm font-medium text-slate-400">
                      <XCircle className="w-4 h-4" />
                      <span>لم يتم الإجابة</span>
                    </div>
                  )}
                  <span className="text-slate-400 text-xs">•</span>
                  <span className="text-slate-500 text-xs font-bold">النقاط: {q.awardedPoints} / {q.points}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <button
            onClick={() => navigate('/student')}
            className="flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold shadow-xl hover:bg-slate-800 transform active:scale-95 transition-all"
          >
            <LayoutDashboard className="w-5 h-5" />
            العودة للرئيسية
          </button>
        </div>
      </main>
    </div>
  );
};
