import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn } from 'lucide-react';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const data = await login(username, password);
            if (data.success) {
                navigate('/profile');
            } else {
                setError(data.error || 'Login failed');
            }
        } catch (err) {
            if (err.response && err.response.data && err.response.data.error) {
                setError(err.response.data.error);
            } else {
                setError('An error occurred during login');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{ maxWidth: '450px', marginTop: '4rem' }}>
            <div className="card">
                <div className="card-header" style={{ textAlign: 'center' }}>
                    <h2 className="card-title">Welcome Back</h2>
                    <p className="card-subtitle">Login to your ChainXchange account</p>
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Username</label>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Enter your username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                            type="password"
                            className="form-control"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                        {loading ? 'Logging in...' : <><LogIn size={18} style={{ marginRight: '8px' }} /> Login</>}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                    <p className="text-secondary">
                        Don't have an account? <Link to="/signup" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>Register now</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
