import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Markets from './pages/Markets';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Portfolio from './pages/Portfolio';
import Profile from './pages/Profile';
import CryptoDetail from './pages/CryptoDetail';
import WalletPage from './pages/WalletPage';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading"><div className="spinner"></div></div>;
  if (!user) return <Navigate to="/login" />;
  return children;
};

// Component to handle dynamic page titles
const PageTitleUpdater = () => {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    let title = 'ChainXchange - Crypto Trading Platform';

    if (path === '/') title = 'Markets | ChainXchange';
    else if (path === '/login') title = 'Login | ChainXchange';
    else if (path === '/signup') title = 'Register | ChainXchange';
    else if (path === '/portfolio') title = 'Portfolio | ChainXchange';
    else if (path === '/profile') title = 'Profile | ChainXchange';
    else if (path === '/wallet') title = 'Wallet | ChainXchange';
    else if (path.startsWith('/crypto/')) {
      // We set a generic title here, letting the page component set a specific one
      // or we can try to leave it if we want the component to take over completely.
      title = 'Crypto Detail | ChainXchange';
    }

    document.title = title;
  }, [location]);

  return null;
};

const AppContent = () => {
  return (
    <Router>
      <PageTitleUpdater />
      <Navbar />
      <main className="container">
        <Routes>
          <Route path="/" element={<Markets />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
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
      <AppContent />
    </AuthProvider>
  );
}

export default App;
