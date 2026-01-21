import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, User, Mail, Lock, ArrowLeft, LogIn } from 'lucide-react';

const Signup = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { signup } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const data = await signup(username, email, password);
            if (data.success) {
                navigate('/profile');
            } else {
                setError(data.error || 'Registration failed');
            }
        } catch (err) {
            setError('An error occurred during registration');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{ maxWidth: '450px', marginTop: '4rem' }}>
            <div className="page-header" style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h1 className="page-title" style={{ fontSize: '2rem' }}>Join ChainXchange</h1>
                <p className="page-subtitle" style={{ margin: '0.5rem auto' }}>Create your account to start trading</p>
            </div>

            <div className="card">
                <div className="card-header" style={{ textAlign: 'center' }}>
                    <div className="card-title">
                        <UserPlus size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                        Create Account
                    </div>
                    <div className="card-subtitle">Get started with crypto trading</div>
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">
                            <User size={16} style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} /> Username
                        </label>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Choose a username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            <Mail size={16} style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} /> Email Address
                        </label>
                        <input
                            type="email"
                            className="form-control"
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            <Lock size={16} style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} /> Password
                        </label>
                        <input
                            type="password"
                            className="form-control"
                            placeholder="Create a secure password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                        {loading ? 'Creating Account...' : <><UserPlus size={18} style={{ marginRight: '8px' }} /> Create Account</>}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                    <p className="text-secondary" style={{ marginBottom: '1rem' }}>Already have an account?</p>
                    <Link to="/login" className="btn btn-secondary" style={{ display: 'inline-flex' }}>
                        <LogIn size={16} style={{ marginRight: '6px' }} /> Sign In
                    </Link>
                </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                <Link to="/" className="btn btn-secondary">
                    <ArrowLeft size={16} style={{ marginRight: '6px' }} /> Back to Markets
                </Link>
            </div>
        </div>
    );
};

export default Signup;
