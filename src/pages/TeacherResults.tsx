import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api.ts';
import { ChevronLeft, User, BarChart3, Clock, CheckCircle, XCircle } from 'lucide-react';

interface QuizResult {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  className: string;
  score: number;
  status: 'IN_PROGRESS' | 'SUBMITTED';
  startTime: string;
  submittedAt: string | null;
}

interface ResultsResponse {
  quiz: {
    id: string;
    title: string;
    className: string;
  };
  results: QuizResult[];
}

const TeacherResults = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<ResultsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await api.get<ResultsResponse>(`/quizzes/${id}/results`);
        setData(response.data);
      } catch (err: any) {
        console.error('Failed to fetch results:', err);
        setError(err.response?.data?.error || 'فشل في تحميل النتائج');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [id]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('ar-JO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateStats = () => {
    if (!data || data.results.length === 0) return { avg: 0, total: 0 };
    const submitted = data.results.filter(r => r.status === 'SUBMITTED');
    if (submitted.length === 0) return { avg: 0, total: data.results.length };
    const sum = submitted.reduce((acc, curr) => acc + curr.score, 0);
    return {
      avg: (sum / submitted.length).toFixed(1),
      total: data.results.length
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4" dir="rtl">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 text-center max-w-md w-full">
          <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="text-red-500 w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">خطأ في التحميل</h2>
          <p className="text-slate-500 mb-6">{error || 'تعذر العثور على البيانات'}</p>
          <button 
            onClick={() => navigate('/teacher')}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors"
          >
            العودة للوحة التحكم
          </button>
        </div>
      </div>
    );
  }

  const { avg, total } = calculateStats();

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20" dir="rtl">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <button 
              onClick={() => navigate('/teacher')}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium"
            >
              <ChevronLeft className="w-5 h-5 rotate-180" />
              العودة للوحة التحكم
            </button>
            <span className="font-bold text-slate-900 text-lg hidden sm:inline">نتائج الطلاب</span>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <header className="mb-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  {data.quiz.className}
                </span>
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900">{data.quiz.title}</h1>
              <p className="text-slate-500 mt-2">عرض أداء الطلاب ونتائج المحاولات</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm min-w-[140px]">
                <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                  <User className="w-4 h-4" />
                  <span>المحاولات</span>
                </div>
                <div className="text-2xl font-black text-slate-900">{total}</div>
              </div>
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm min-w-[140px]">
                <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                  <BarChart3 className="w-4 h-4" />
                  <span>متوسط الدرجات</span>
                </div>
                <div className="text-2xl font-black text-blue-600">{avg}</div>
              </div>
            </div>
          </div>
        </header>

        {data.results.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl py-20 text-center">
            <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="text-slate-300 w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">لا توجد محاولات بعد</h3>
            <p className="text-slate-500 mt-2 max-w-sm mx-auto">سيظهر هنا الطلاب الذين بدأوا الاختبار ودرجاتهم بمجرد البدء.</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-sm font-bold text-slate-600">اسم الطالب</th>
                    <th className="px-6 py-4 text-sm font-bold text-slate-600">الصف</th>
                    <th className="px-6 py-4 text-sm font-bold text-slate-600">الحالة</th>
                    <th className="px-6 py-4 text-sm font-bold text-slate-600">تاريخ البدء</th>
                    <th className="px-6 py-4 text-sm font-bold text-slate-600">تاريخ التسليم</th>
                    <th className="px-6 py-4 text-sm font-bold text-slate-600">الدرجة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.results.map((result) => (
                    <tr key={result.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">{result.studentName}</span>
                          <span className="text-xs text-slate-400">{result.studentEmail}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold">
                          {result.className}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        {result.status === 'SUBMITTED' ? (
                          <div className="flex items-center gap-1.5 text-green-600 text-sm font-bold">
                            <CheckCircle className="w-4 h-4" />
                            <span>مكتمل</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-orange-500 text-sm font-bold animate-pulse">
                            <Clock className="w-4 h-4" />
                            <span>قيد التقدم</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-5 text-sm text-slate-500">
                        {formatDate(result.startTime)}
                      </td>
                      <td className="px-6 py-5 text-sm text-slate-500">
                        {formatDate(result.submittedAt)}
                      </td>
                      <td className="px-6 py-5">
                        <span className={`text-lg font-black ${
                          result.status === 'SUBMITTED' ? 'text-blue-600' : 'text-slate-300'
                        }`}>
                          {result.status === 'SUBMITTED' ? result.score : '-'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default TeacherResults;
