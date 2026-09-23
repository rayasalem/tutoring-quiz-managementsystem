import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api.ts';
import { Quiz } from './Dashboards.tsx';
import { ChevronRight, Save, Clock, Calendar, Hash, Loader2, AlertTriangle } from 'lucide-react';

export const QuizEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';
  
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    className: '',
    timeLimitMins: 30,
    startDate: new Date().toISOString().slice(0, 16),
    endDate: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    negativeMarking: false,
  });

  useEffect(() => {
    if (!isNew && id) {
      const fetchQuiz = async () => {
        try {
          const response = await api.get<Quiz>(`/quizzes/${id}`);
          const quiz = response.data;
          setFormData({
            title: quiz.title,
            description: quiz.description || '',
            className: quiz.className,
            timeLimitMins: quiz.timeLimitMins,
            startDate: new Date(quiz.startDate).toISOString().slice(0, 16),
            endDate: new Date(quiz.endDate).toISOString().slice(0, 16),
            negativeMarking: quiz.negativeMarking,
          });
        } catch (err) {
          console.error('Failed to fetch quiz:', err);
          setError('فشل تحميل بيانات الاختبار');
        } finally {
          setLoading(false);
        }
      };
      fetchQuiz();
    }
  }, [id, isNew]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (isNew) {
        const response = await api.post<Quiz>('/quizzes', formData);
        navigate(`/teacher/quizzes/${response.data.id}/questions`);
      } else {
        await api.put(`/quizzes/${id}`, formData);
        navigate('/teacher');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'فشل حفظ البيانات');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20" dir="rtl">
        <Loader2 className="animate-spin text-blue-500 w-10 h-10" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans" dir="rtl">
      <div className="max-w-3xl mx-auto py-10 px-4">
        <button 
          onClick={() => navigate('/teacher')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6 transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
          العودة للوحة التحكم
        </button>

        <header className="mb-10">
          <h1 className="text-3xl font-extrabold text-slate-900">
            {isNew ? 'إنشاء اختبار جديد' : 'تعديل الاختبار'}
          </h1>
          <p className="text-slate-500 mt-2">أدخل المعلومات الأساسية للاختبار ليتمكن الطلاب من التقديم.</p>
        </header>

        {error && (
          <div className="bg-red-50 border-r-4 border-red-500 p-4 mb-8 flex items-center gap-3">
            <AlertTriangle className="text-red-500 w-5 h-5 shrink-0" />
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">عنوان الاختبار</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="مثلاً: اختبار الرياضيات الشهري"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">وصف الاختبار (اختياري)</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all min-h-[100px]"
                placeholder="أضف تعليمات الاختبار للطلاب..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                  <Hash className="w-4 h-4" />
                  الصف المستهدف
                </label>
                <select
                  required
                  value={formData.className}
                  onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                >
                  <option value="">اختر الصف...</option>
                  <option value="10A">10A</option>
                  <option value="10B">10B</option>
                  <option value="11A">11A</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  مدة الاختبار (بالدقائق)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.timeLimitMins}
                  onChange={(e) => setFormData({ ...formData, timeLimitMins: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  تاريخ ووقت البدء
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  تاريخ ووقت الإغلاق
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={formData.negativeMarking}
                    onChange={(e) => setFormData({ ...formData, negativeMarking: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700">تفعيل نظام الخصم للإجابات الخاطئة</p>
                  <p className="text-xs text-slate-400">خصم 50% من درجة السؤال عند اختيار إجابة غير صحيحة.</p>
                </div>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transform active:scale-[0.99] transition-all flex justify-center items-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
            {isNew ? 'حفظ الاختبار والانتقال للأسئلة' : 'حفظ التعديلات'}
          </button>
        </form>
      </div>
    </div>
  );
};
