import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { StudentLayout } from './layouts/StudentLayout';
import { AdminLayout } from './layouts/AdminLayout';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';

// Student Pages
import { StudentDashboardPage } from './pages/student/StudentDashboardPage';
import { MyAssignmentsPage } from './pages/student/MyAssignmentsPage';
import { ExamTakingPage } from './pages/student/ExamTakingPage';
import { ExamResultPage } from './pages/student/ExamResultPage';
import { StudentProfilePage } from './pages/student/StudentProfilePage';
import { MaterialsPage } from './pages/student/MaterialsPage';

// Admin Pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { ExamsManagementPage } from './pages/admin/ExamsManagementPage';
import { QuestionEditorPage } from './pages/admin/QuestionEditorPage';
import { AssignmentsPage } from './pages/admin/AssignmentsPage';
import { SubjectsManagementPage } from './pages/admin/SubjectsManagementPage';
import { UsersManagementPage } from './pages/admin/UsersManagementPage';
import { AdminResultsPage } from './pages/admin/AdminResultsPage';

// Route Guards
const ProtectedStudentRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'STUDENT') return <Navigate to="/admin" replace />;
  return <>{children}</>;
};

const ProtectedAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'ADMIN') return <Navigate to="/student" replace />;
  return <>{children}</>;
};

const RootRedirect: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return user?.role === 'ADMIN' ? <Navigate to="/admin" replace /> : <Navigate to="/student" replace />;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Root */}
            <Route path="/" element={<RootRedirect />} />

            {/* Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Student Routes */}
            <Route
              path="/student"
              element={
                <ProtectedStudentRoute>
                  <StudentLayout />
                </ProtectedStudentRoute>
              }
            >
              <Route index element={<StudentDashboardPage />} />
              <Route path="assignments" element={<MyAssignmentsPage />} />
              <Route path="materials" element={<MaterialsPage />} />
              <Route path="profile" element={<StudentProfilePage />} />
            </Route>

            {/* Fullscreen Exam Taking & Result Pages */}
            <Route
              path="/student/exams/:examId/take"
              element={
                <ProtectedStudentRoute>
                  <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-app)', padding: '24px' }}>
                    <ExamTakingPage />
                  </div>
                </ProtectedStudentRoute>
              }
            />
            <Route
              path="/student/attempts/:attemptId/take"
              element={
                <ProtectedStudentRoute>
                  <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-app)', padding: '24px' }}>
                    <ExamTakingPage />
                  </div>
                </ProtectedStudentRoute>
              }
            />
            <Route
              path="/student/attempts/:attemptId/result"
              element={
                <ProtectedStudentRoute>
                  <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-app)', padding: '24px' }}>
                    <ExamResultPage />
                  </div>
                </ProtectedStudentRoute>
              }
            />

            {/* Admin Kahoot Question Editor (Fullscreen) */}
            <Route
              path="/admin/exams/:examId/questions"
              element={
                <ProtectedAdminRoute>
                  <QuestionEditorPage />
                </ProtectedAdminRoute>
              }
            />

            {/* Admin Management Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedAdminRoute>
                  <AdminLayout />
                </ProtectedAdminRoute>
              }
            >
              <Route index element={<AdminDashboardPage />} />
              <Route path="exams" element={<ExamsManagementPage />} />
              <Route path="assignments" element={<AssignmentsPage />} />
              <Route path="subjects" element={<SubjectsManagementPage />} />
              <Route path="users" element={<UsersManagementPage />} />
              <Route path="results" element={<AdminResultsPage />} />
            </Route>

            {/* Fallback 404 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
};

export default App;
