import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, User, Mail, Lock, ArrowLeft, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const Signup = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const { signup } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = await signup(username, email, password);
            if (data.success) {
                toast.success('Account created successfully!');
                navigate('/profile');
            } else {
                toast.error(data.error || 'Registration failed');
            }
        } catch (err) {
            toast.error('An error occurred during registration');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            className="container"
            style={{ maxWidth: '450px', marginTop: '4rem' }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
        >
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

                <form onSubmit={handleSubmit}>
                    <motion.div
                        className="form-group"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                    >
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
                    </motion.div>

                    <motion.div
                        className="form-group"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                    >
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
                    </motion.div>

                    <motion.div
                        className="form-group"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                    >
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
                    </motion.div>

                    <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', height: '48px', marginTop: '1rem' }}
                        disabled={loading}
                    >
                        {loading ? 'Creating Account...' : <><UserPlus size={18} style={{ marginRight: '8px' }} /> Create Account</>}
                    </motion.button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                    <p className="text-secondary" style={{ marginBottom: '1rem' }}>Already have an account?</p>
                    <Link to="/login" className="btn btn-secondary" style={{ display: 'inline-flex' }}>
                        <LogIn size={16} style={{ marginRight: '6px' }} /> Sign In
                    </Link>
                </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                <Link to="/" className="btn btn-secondary" style={{ borderRadius: '12px' }}>
                    <ArrowLeft size={16} style={{ marginRight: '6px' }} /> Back to Markets
                </Link>
            </div>
        </motion.div>
    );
};

export default Signup;
