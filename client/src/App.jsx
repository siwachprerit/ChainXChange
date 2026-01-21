import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Markets from './pages/Markets';
import Login from './pages/Login';
// Define these as placeholders or implement them next
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

const AppContent = () => {
  return (
    <Router>
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
