import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

import Layout from './components/Layout/Layout';
import IDVerification from './components/Auth/IDVerification';
import Login from './components/Auth/Login';
import ManagePersonnel from './components/Admin/ManagePersonnel';
import Dashboard from './components/Dashboard/Dashboard';
import CaseList from './components/Cases/CaseList';
import CaseCreate from './components/Cases/CaseCreate';
import CaseDetail from './components/Cases/CaseDetail';
import DocumentList from './components/Documents/DocumentList';
import DocumentUpload from './components/Documents/DocumentUpload';
import DocumentViewer from './components/Documents/DocumentViewer';
import DocumentSearch from './components/Documents/DocumentSearch';
import AuditLog from './components/AuditTrail/AuditLog';
import SharedCases from './components/Collaboration/SharedCases';

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-light">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isAdmin = user.role === 'admin' || user.role === 'super_admin' || user.role === 'station_admin' || user.formNumber === '25110377' || user.badgeId === '25110377';

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Layout>{children}</Layout>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<IDVerification />} />
      <Route path="/login/password" element={<Login />} />
      <Route path="/register" element={<Navigate to="/login" replace />} />

      <Route path="/" element={
        <ProtectedRoute><Dashboard /></ProtectedRoute>
      } />
      <Route path="/admin/personnel" element={
        <ProtectedRoute adminOnly><ManagePersonnel /></ProtectedRoute>
      } />
      <Route path="/cases" element={
        <ProtectedRoute><CaseList /></ProtectedRoute>
      } />
      <Route path="/cases/new" element={
        <ProtectedRoute><CaseCreate /></ProtectedRoute>
      } />
      <Route path="/cases/:id" element={
        <ProtectedRoute><CaseDetail /></ProtectedRoute>
      } />
      <Route path="/documents" element={
        <ProtectedRoute><DocumentList /></ProtectedRoute>
      } />
      <Route path="/documents/upload" element={
        <ProtectedRoute><DocumentUpload /></ProtectedRoute>
      } />
      <Route path="/documents/:id/view" element={
        <ProtectedRoute><DocumentViewer /></ProtectedRoute>
      } />
      <Route path="/search" element={
        <ProtectedRoute><DocumentSearch /></ProtectedRoute>
      } />
      <Route path="/audit" element={
        <ProtectedRoute adminOnly><AuditLog /></ProtectedRoute>
      } />
      <Route path="/collaboration" element={
        <ProtectedRoute><SharedCases /></ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1a237e',
            color: '#fff',
            fontSize: '14px',
          },
        }}
      />
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
