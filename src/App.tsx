import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage.tsx';
import { StudentDashboard, TeacherDashboard } from './pages/Dashboards.tsx';
import { QuizEditor } from './pages/QuizEditor.tsx';
import { QuestionEditor } from './pages/QuestionEditor.tsx';
import { QuizAttempt } from './pages/QuizAttempt.tsx';
import { QuizResult } from './pages/QuizResult.tsx';
import TeacherResults from './pages/TeacherResults.tsx';
import { ProtectedRoute } from './components/ProtectedRoute.tsx';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        <Route 
          path="/student/*" 
          element={
            <ProtectedRoute role="STUDENT">
              <Routes>
                <Route index element={<StudentDashboard />} />
                <Route path="dashboard" element={<Navigate to="/student" replace />} />
                <Route path="attempts/:id" element={<QuizAttempt />} />
                <Route path="attempts/:id/result" element={<QuizResult />} />
                <Route path="*" element={<Navigate to="/student" replace />} />
              </Routes>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/teacher/*" 
          element={
            <ProtectedRoute role="TEACHER">
              <Routes>
                <Route index element={<TeacherDashboard />} />
                <Route path="dashboard" element={<Navigate to="/teacher" replace />} />
                <Route path="quizzes/:id/edit" element={<QuizEditor />} />
                <Route path="quizzes/new" element={<QuizEditor />} />
                <Route path="quizzes/:id/questions" element={<QuestionEditor />} />
                <Route path="quizzes/:id/results" element={<TeacherResults />} />
                <Route path="*" element={<Navigate to="/teacher" replace />} />
              </Routes>
            </ProtectedRoute>
          } 
        />

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}
