import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { SocketProvider } from './contexts/SocketContext';

// Pages
import BeerExchangeDisplay from './pages/BeerExchangeDisplay';
import SimpleLogin from './pages/SimpleLogin';
import SimpleServerDashboard from './pages/SimpleServerDashboard';
import SimpleAdminDashboard from './pages/SimpleAdminDashboard';
import EnhancedAdminDashboard from './pages/EnhancedAdminDashboard';
import SumUpAdmin from './pages/SumUpAdmin';
import CashierInterface from './pages/CashierInterface';
import MobileCashier from './pages/MobileCashier';

function App() {
  return (
    <SocketProvider>
        <Router>
          <div className="App min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
            <Routes>
              {/* Interface publique - accessible sans authentification */}
              <Route path="/" element={<BeerExchangeDisplay />} />
              <Route path="/public" element={<BeerExchangeDisplay />} />
              
              {/* Interface de connexion simple */}
              <Route path="/login" element={<SimpleLogin />} />
              <Route path="/server/login" element={<SimpleLogin />} />
              <Route path="/admin/login" element={<SimpleLogin />} />
              
              {/* Interface serveur */}
              <Route 
                path="/server/dashboard" 
                element={<SimpleServerDashboard />}
              />
              
              {/* Interface caisse */}
              <Route 
                path="/cashier" 
                element={<CashierInterface />}
              />
              
              {/* Interface caisse mobile */}
              <Route 
                path="/mobile" 
                element={<MobileCashier />}
              />
              
                  {/* Interface administrateur */}
                  <Route
                    path="/admin/dashboard"
                    element={<SimpleAdminDashboard />}
                  />
                  
                  {/* Interface administrateur améliorée */}
                  <Route
                    path="/admin/reports"
                    element={<EnhancedAdminDashboard />}
                  />

                  {/* Interface SumUp */}
                  <Route
                    path="/admin/sumup"
                    element={<SumUpAdmin />}
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
  );
}

export default App;
