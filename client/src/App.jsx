import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import Navbar from './components/Navbar';
import Markets from './pages/Markets';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Portfolio from './pages/Portfolio';
import Profile from './pages/Profile';
import CryptoDetail from './pages/CryptoDetail';
import WalletPage from './pages/WalletPage';
import TransactionHistory from './pages/TransactionHistory';
import About from './pages/About';
import { Toaster } from 'react-hot-toast';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading"><div className="spinner"></div></div>;
  if (!user) return <Navigate to="/login" />;
  return children;
};

// Component to handle scrolling to top on navigation
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

// Component to handle dynamic page titles
const PageTitleUpdater = () => {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    let title = 'ChainXchange - Crypto Trading Platform';

    if (path === '/') title = 'Markets';
    else if (path === '/login') title = 'Login';
    else if (path === '/signup') title = 'Register';
    else if (path === '/portfolio') title = 'Portfolio';
    else if (path === '/profile') title = 'Profile';
    else if (path === '/wallet') title = 'Wallet';
    else if (path === '/history') title = 'Trade History';
    // else if (path === '/about') title = 'About ChainXchange';
    else if (path.startsWith('/crypto/')) {
      title = 'Crypto Detail';
    }

    document.title = title;
  }, [location]);

  return null;
};

const AppContent = () => {
  return (
    <Router>
      <Toaster position="top-right" reverseOrder={false} />
      <div className="ambient-light" style={{ top: '-10%', left: '-10%' }}></div>
      <div className="ambient-light" style={{ bottom: '10%', right: '-10%', background: 'radial-gradient(circle, var(--success-color) 0%, transparent 70%)', opacity: 0.03 }}></div>
      <ScrollToTop />
      <PageTitleUpdater />
      <Navbar />
      <main className="container">
        <Routes>
          <Route path="/" element={<Markets />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          {/* <Route path="/about" element={<About />} /> */}
          <Route path="/crypto/:coinId" element={<CryptoDetail />} />
          <Route
            path="/portfolio"
            element={
              <ProtectedRoute>
                <Portfolio />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wallet"
            element={
              <ProtectedRoute>
                <WalletPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <TransactionHistory />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
      <footer className="footer" style={{ textAlign: 'center', padding: '2rem', borderTop: '1px solid var(--border-color)', marginTop: '4rem' }}>
        <p>&copy; {new Date().getFullYear()} ChainXchange - Professional Crypto Trading Platform</p>
      </footer>
    </Router>
  );
};

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
