import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { lazy, Suspense, type ReactNode } from 'react';
import { Layout } from './components/Layout';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import { ProjectProvider } from './context/ProjectContext';
import { Loader2 } from 'lucide-react';

// Lazy load feature pages
const LocationsPage = lazy(() => import('./features/locations').then(m => ({ default: m.LocationsPage })));
const ScenesPage = lazy(() => import('./features/scenes').then(m => ({ default: m.ScenesPage })));
const CharactersPage = lazy(() => import('./features/characters').then(m => ({ default: m.CharactersPage })));
const ProjectDashboard = lazy(() => import('./features/dashboard').then(m => ({ default: m.ProjectDashboard })));
const StartPage = lazy(() => import('./features/start').then(m => ({ default: m.StartPage })));
const AuthPage = lazy(() => import('./features/auth/AuthPage').then(m => ({ default: m.AuthPage })));
const SchedulingPage = lazy(() => import('./features/scheduling').then(m => ({ default: m.SchedulingPage })));
const AssetsPage = lazy(() => import('./features/assets').then(m => ({ default: m.AssetsPage })));
const PeoplePage = lazy(() => import('./features/people').then(m => ({ default: m.PeoplePage })));

// Loading Component
const LoadingFallback = () => (
  <div className="flex h-[calc(100vh-3.5rem)] w-full items-center justify-center bg-primary-50/50 dark:bg-primary-950/50">
    <div className="flex flex-col items-center gap-2">
      <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      <p className="text-sm font-medium text-primary-600 dark:text-primary-400">Loading scene...</p>
    </div>
  </div>
);

// Protected Route Wrapper
const RequireAuth = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ProjectProvider>
          <BrowserRouter basename={import.meta.env.URL.includes('github.io') ? '/kopfkino/' : '/'}>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                <Route path="/login" element={<AuthPage />} />

                <Route path="/" element={
                  <RequireAuth>
                    <Layout />
                  </RequireAuth>
                }>
                  <Route index element={<StartPage />} />
                  <Route path="project/:projectId">
                    <Route index element={<ProjectDashboard />} />
                    <Route path="locations/*" element={<LocationsPage />} />
                    <Route path="scenes/*" element={<ScenesPage />} />
                    <Route path="characters/*" element={<CharactersPage />} />
                    <Route path="scheduling/*" element={<SchedulingPage />} />
                    <Route path="assets/*" element={<AssetsPage />} />
                    <Route path="people/*" element={<PeoplePage />} />
                  </Route>
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Routes>
            </Suspense>
          </BrowserRouter>
        </ProjectProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
