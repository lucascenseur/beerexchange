import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';

// Pages
import PublicDisplay from './pages/PublicDisplay';
import ServerLogin from './pages/ServerLogin';
import ServerDashboard from './pages/ServerDashboard';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';

// Composants
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <div className="App min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
            <Routes>
              {/* Interface publique - accessible sans authentification */}
              <Route path="/" element={<PublicDisplay />} />
              <Route path="/public" element={<PublicDisplay />} />
              
              {/* Interface serveur */}
              <Route path="/server/login" element={<ServerLogin />} />
              <Route 
                path="/server/dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['server', 'admin']}>
                    <ServerDashboard />
                  </ProtectedRoute>
                } 
              />
              
              {/* Interface administrateur */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route 
                path="/admin/dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
              
              {/* Redirection par défaut */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            
            {/* Notifications toast */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  duration: 3000,
                  iconTheme: {
                    primary: '#10B981',
                    secondary: '#fff',
                  },
                },
                error: {
                  duration: 5000,
                  iconTheme: {
                    primary: '#EF4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </div>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
