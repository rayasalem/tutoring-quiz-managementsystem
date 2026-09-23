import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api.ts';
import { Quiz } from './Dashboards.tsx';
import { ChevronRight, Plus, Trash2, Check, AlertTriangle, Loader2, Rocket, HelpCircle } from 'lucide-react';

interface Question {
  id: string;
  text: string;
  points: number;
  sortOrder: number;
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
  }[];
}

export const QuestionEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [publishErrors, setPublishErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState<string | null>(null);

  // New question form state
  const [newQ, setNewQ] = useState({
    text: '',
    points: 1,
    options: [
      { text: '', isCorrect: true },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
    ]
  });

  const fetchData = async () => {
    try {
      const response = await api.get<Quiz & { questions: Question[] }>(`/quizzes/${id}`);
      setQuiz(response.data);
      setQuestions(response.data.questions || []);
    } catch (err) {
      console.error('Failed to fetch quiz questions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/quizzes/${id}/questions`, {
        ...newQ,
        sortOrder: questions.length
      });
      setNewQ({
        text: '',
        points: 1,
        options: [
          { text: '', isCorrect: true },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
        ]
      });
      fetchData();
      setSuccess('تم إضافة السؤال بنجاح');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to add question:', err);
    }
  };

  const handleDeleteQuestion = async (qId: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا السؤال؟')) return;
    try {
      await api.delete(`/quizzes/questions/${qId}`);
      fetchData();
    } catch (err) {
      console.error('Failed to delete question:', err);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    setPublishErrors([]);
    try {
      await api.post(`/quizzes/${id}/publish`);
      setSuccess('تم نشر الاختبار بنجاح!');
      setTimeout(() => navigate('/teacher'), 2000);
    } catch (err: any) {
      if (err.response?.data?.details) {
        setPublishErrors(err.response.data.details);
      } else {
        setPublishErrors([err.response?.data?.error || 'فشل نشر الاختبار']);
      }
    } finally {
      setPublishing(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500 w-10 h-10" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20" dir="rtl">
      <div className="max-w-4xl mx-auto py-10 px-4">
        <button 
          onClick={() => navigate('/teacher')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6 transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
          العودة للوحة التحكم
        </button>

        <header className="flex justify-between items-start mb-10">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">{quiz?.title}</h1>
            <p className="text-slate-500 mt-2">إدارة أسئلة الاختبار ({questions.length} سؤال حالياً)</p>
          </div>
          {!quiz?.isPublished && (
            <button 
              onClick={handlePublish}
              disabled={publishing || questions.length === 0}
              className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-green-200 hover:bg-green-700 disabled:opacity-50 transition-all transform active:scale-95"
            >
              {publishing ? <Loader2 className="animate-spin w-5 h-5" /> : <Rocket className="w-5 h-5" />}
              نشر الاختبار
            </button>
          )}
        </header>

        {publishErrors.length > 0 && (
          <div className="bg-red-50 border-r-4 border-red-500 p-6 mb-8 rounded-2xl shadow-sm">
            <h3 className="text-red-800 font-bold mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              لا يمكن النشر للأسباب التالية:
            </h3>
            <ul className="list-disc list-inside text-red-700 text-sm space-y-1 mr-2">
              {publishErrors.map((err, i) => <li key={i}>{err}</li>)}
            </ul>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border-r-4 border-green-500 p-4 mb-8 rounded-xl text-green-800 font-bold">
            {success}
          </div>
        )}

        <div className="space-y-8">
          {/* Add New Question */}
          {!quiz?.isPublished && (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="bg-slate-50 px-8 py-4 border-b border-slate-100">
                <h3 className="font-bold text-slate-700 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-blue-500" />
                  إضافة سؤال جديد
                </h3>
              </div>
              <form onSubmit={handleAddQuestion} className="p-8 space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">نص السؤال</label>
                  <textarea 
                    required
                    value={newQ.text}
                    onChange={e => setNewQ({...newQ, text: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all min-h-[80px]"
                    placeholder="اكتب السؤال هنا..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-slate-700">خيارات الإجابة (اختر الإجابة الصحيحة)</label>
                    {newQ.options.map((opt, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <input 
                          type="radio" 
                          name="correct" 
                          checked={opt.isCorrect}
                          onChange={() => {
                            const updated = newQ.options.map((o, idx) => ({...o, isCorrect: idx === i}));
                            setNewQ({...newQ, options: updated});
                          }}
                          className="w-5 h-5 text-blue-600 border-slate-300 focus:ring-blue-500"
                        />
                        <input 
                          type="text" 
                          required
                          value={opt.text}
                          onChange={e => {
                            const updated = [...newQ.options];
                            updated[i].text = e.target.value;
                            setNewQ({...newQ, options: updated});
                          }}
                          className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder={`الخيار ${i + 1}`}
                        />
                      </div>
                    ))}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">درجة السؤال</label>
                    <input 
                      type="number" 
                      min="1"
                      required
                      value={newQ.points}
                      onChange={e => setNewQ({...newQ, points: parseInt(e.target.value) || 1})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all flex justify-center items-center gap-2">
                  <Plus className="w-5 h-5" />
                  إضافة السؤال للقائمة
                </button>
              </form>
            </div>
          )}

          {/* List Questions */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-lg mb-4">قائمة الأسئلة</h3>
            {questions.map((q, idx) => (
              <div key={q.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:border-blue-100 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <span className="bg-blue-50 text-blue-600 w-8 h-8 rounded-lg flex items-center justify-center font-bold">{idx + 1}</span>
                    <h4 className="text-lg font-bold text-slate-800">{q.text}</h4>
                  </div>
                  {!quiz?.isPublished && (
                    <button 
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mr-11">
                  {q.options.map((opt) => (
                    <div key={opt.id} className={`flex items-center gap-3 p-3 rounded-xl border ${opt.isCorrect ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
                      {opt.isCorrect ? <Check className="w-4 h-4" /> : <HelpCircle className="w-4 h-4 opacity-30" />}
                      <span className="text-sm font-medium">{opt.text}</span>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 mr-11 pt-4 border-t border-slate-50 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">نقاط السؤال: {q.points}</span>
                </div>
              </div>
            ))}
            {questions.length === 0 && !loading && (
              <p className="text-center text-slate-400 py-10 bg-white rounded-3xl border border-dashed border-slate-200">
                لا توجد أسئلة مضافة بعد.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
