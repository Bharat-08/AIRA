// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { LoginPage } from './pages/LoginPage';
import { RecruiterDashboardPage } from './pages/RecruiterDashboardPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { SuperAdminDashboardPage } from './pages/SuperAdminDashboardPage';
import { SearchPage } from './pages/SearchPage';
import RolesPage from './pages/RolesPage';
// ADDED: Import for PipelinePage
import { PipelinePage } from './pages/PipelinePage';

function App() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="bg-gray-900 text-white flex items-center justify-center min-h-screen">
        <h1 className="text-3xl font-bold">Loading...</h1>
      </div>
    );
  }

  // This is a protected route component. It checks if a user is logged in.
  // If not, it redirects to the login page.
  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (!user) {
      return <Navigate to="/login" />;
    }
    return <>{children}</>;
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            {user?.is_superadmin ? <SuperAdminDashboardPage /> :
             user?.role === 'admin' ? <AdminDashboardPage /> :
             user?.role === 'user' ? <RecruiterDashboardPage user={user} /> :
             <Navigate to="/login" />}
          </ProtectedRoute>
        } />

        <Route path="/search" element={
          <ProtectedRoute>
            {user ? <SearchPage user={user} /> : <Navigate to="/login" />}
          </ProtectedRoute>
        } />

        <Route path="/roles" element={
          <ProtectedRoute>
            <RolesPage />
          </ProtectedRoute>
        } />

        {/* ADDED: This is the new route for the Pipeline page */}
        <Route path="/pipeline" element={
          <ProtectedRoute>
            {user ? <PipelinePage user={user} /> : <Navigate to="/login" />}
          </ProtectedRoute>
        } />

        {/* Add a fallback route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;