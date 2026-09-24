import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth.ts';
import api from '../services/api.ts';
import { Plus, Edit, BookOpen, Clock, Calendar, CheckCircle, HelpCircle, LayoutDashboard, LogOut, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface Quiz {
  id: string;
  title: string;
  description: string | null;
  className: string;
  timeLimitMins: number;
  startDate: string;
  endDate: string;
  negativeMarking: boolean;
  isPublished: boolean;
  createdAt: string;
}

export const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const response = await api.get<Quiz[]>('/quizzes');
        setQuizzes(response.data);
      } catch (err) {
        console.error('Failed to fetch available quizzes:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuizzes();
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ar-JO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const startQuiz = async (quizId: string) => {
    try {
      const response = await api.post<{ id: string }>(`/quizzes/${quizId}/attempts`);
      navigate(`/student/attempts/${response.data.id}`);
    } catch (err: any) {
      if (err.response?.status === 409) {
        // Already exists
        const attemptId = err.response.data.attemptId;
        if (err.response.data.status === 'SUBMITTED') {
          navigate(`/student/attempts/${attemptId}/result`);
        } else {
          navigate(`/student/attempts/${attemptId}`);
        }
      } else {
        setErrorMessage(err.response?.data?.error || 'فشل بدء الاختبار');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans" dir="rtl">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <BookOpen className="text-white w-5 h-5" />
              </div>
              <span className="font-bold text-slate-900 text-lg">بوابة الطالب</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                <span className="text-sm font-bold text-slate-900">{user?.name}</span>
                <span className="text-xs text-slate-500">{user?.className}</span>
              </div>
              <button 
                onClick={logout}
                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                title="تسجيل الخروج"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <header className="mb-8">
          <h1 className="text-2xl font-extrabold text-slate-900">الاختبارات المتاحة</h1>
          <p className="text-slate-500 mt-1">اختر اختباراً للبدء. تذكر أن لديك محاولة واحدة فقط لكل اختبار.</p>
        </header>

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between text-red-700 text-sm font-semibold">
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="text-red-500 hover:text-red-700 font-bold px-2">✕</button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : quizzes.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl py-16 text-center">
            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="text-slate-300 w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">لا يوجد اختبارات متاحة حالياً</h3>
            <p className="text-slate-500 mt-1 max-w-xs mx-auto">سيظهر هنا أي اختبار يتم تخصيصه لصفك الدراسي ({user?.className}).</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz) => (
              <div key={quiz.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                      متاح
                    </span>
                    <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg text-xs font-bold">
                      {quiz.className}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-slate-900 mb-2 line-clamp-1">{quiz.title}</h3>
                  <p className="text-slate-500 text-sm mb-6 line-clamp-2 min-h-[2.5rem]">
                    {quiz.description || 'لا يوجد وصف...'}
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2.5 text-slate-600 text-sm">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span>{quiz.timeLimitMins} دقيقة</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-slate-600 text-sm">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="truncate">ينتهي في: {formatDate(quiz.endDate)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 px-6 py-4">
                  <button 
                    onClick={() => startQuiz(quiz.id)}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transform active:scale-95 transition-all"
                  >
                    بدء الاختبار الآن
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export const TeacherDashboard = () => {
  const { user, logout } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const response = await api.get<Quiz[]>('/quizzes/mine');
        setQuizzes(response.data);
      } catch (err) {
        console.error('Failed to fetch quizzes:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuizzes();
  }, []);

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
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <LayoutDashboard className="text-white w-5 h-5" />
              </div>
              <span className="font-bold text-slate-900 text-lg">لوحة تحكم المعلم</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-500 hidden sm:inline">{user?.name}</span>
              <button 
                onClick={logout}
                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                title="تسجيل الخروج"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">اختباراتي</h1>
            <p className="text-slate-500 mt-1">إدارة الاختبارات والأسئلة والنتائج</p>
          </div>
          <button 
            onClick={() => navigate('/teacher/quizzes/new')}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transform active:scale-95 transition-all"
          >
            <Plus className="w-5 h-5" />
            إنشاء اختبار جديد
          </button>
        </header>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : quizzes.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl py-16 text-center">
            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="text-slate-300 w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">لا يوجد اختبارات بعد</h3>
            <p className="text-slate-500 mt-1 max-w-xs mx-auto">ابدأ بإنشاء أول اختبار لطلابك لمتابعة مستواهم الدراسي.</p>
            <button 
              onClick={() => navigate('/teacher/quizzes/new')}
              className="mt-6 text-blue-600 font-bold hover:underline"
            >
              أنشئ اختباراً الآن
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz) => (
              <div key={quiz.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      quiz.isPublished ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'
                    }`}>
                      {quiz.isPublished ? 'منشور' : 'مسودة'}
                    </span>
                    <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg text-xs font-bold">
                      {quiz.className}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-slate-900 mb-2 line-clamp-1">{quiz.title}</h3>
                  <p className="text-slate-500 text-sm mb-6 line-clamp-2 min-h-[2.5rem]">
                    {quiz.description || 'لا يوجد وصف...'}
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2.5 text-slate-600 text-sm">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span>{quiz.timeLimitMins} دقيقة</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-slate-600 text-sm">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="truncate">{formatDate(quiz.startDate)}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-slate-600 text-sm">
                      <CheckCircle className={`w-4 h-4 ${quiz.negativeMarking ? 'text-red-400' : 'text-slate-400'}`} />
                      <span>{quiz.negativeMarking ? 'الخصم من الإجابة الخاطئة مفعّل' : 'بدون خصم من الإجابة الخاطئة'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 px-6 py-4 flex gap-3">
                  <button 
                    onClick={() => navigate(`/teacher/quizzes/${quiz.id}/edit`)}
                    className="flex-1 flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 py-2 rounded-xl text-sm font-bold hover:bg-slate-100 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    تعديل
                  </button>
                  <button 
                    onClick={() => navigate(`/teacher/quizzes/${quiz.id}/questions`)}
                    className="flex-1 flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 py-2 rounded-xl text-sm font-bold hover:bg-slate-100 transition-colors"
                  >
                    <HelpCircle className="w-4 h-4" />
                    الأسئلة
                  </button>
                </div>
                
                <div className="bg-slate-50 px-6 pb-4 pt-0">
                  <button 
                    onClick={() => navigate(`/teacher/quizzes/${quiz.id}/results`)}
                    className="w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-700 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-100 transition-colors border border-blue-100"
                  >
                    <BarChart3 className="w-4 h-4" />
                    عرض النتائج والأداء
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
