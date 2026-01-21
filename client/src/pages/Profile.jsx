import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { User, Wallet, History, ArrowRight, ArrowLeft, ShoppingCart, Info, UserX } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const { data } = await axios.get('/api/auth/profile');
                if (data.success && data.transactions) {
                    setTransactions(data.transactions);
                }
            } catch (error) {
                console.error('Error fetching history:', error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchHistory();
        }
    }, [user]);

    const formatNumber = (num) => {
        if (!num) return '0.00';
        return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const formatPrice = (price) => {
        if (price == null) return 'N/A';
        return price < 1 ? price.toFixed(6) : price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    if (!user) {
        return (
            <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <div className="card" style={{ maxWidth: '450px', width: '100%', textAlign: 'center', padding: '3rem' }}>
                    <div style={{ background: 'var(--bg-tertiary)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
                        <UserX size={40} style={{ color: 'var(--danger-color)' }} />
                    </div>
                    <h2 style={{ marginBottom: '1rem', fontWeight: 800 }}>Account Access Required</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem', lineHeight: 1.6 }}>
                        Please sign in to view your profile dashboard and manage your account settings.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <Link to="/login" className="btn btn-primary btn-lg" style={{ borderRadius: '12px' }}>
                            Sign In
                        </Link>
                        <Link to="/signup" className="btn btn-secondary btn-lg" style={{ borderRadius: '12px' }}>
                            Create Account
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="page-header">
                <h1 className="page-title">Profile Settings</h1>
                <p className="page-subtitle">Personalize your account and review your trade activity</p>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(350px, 1fr) 2fr',
                gap: '2.5rem',
                alignItems: 'start'
            }}>

                {/* Profile Details */}
                <div>
                    <div className="card" style={{ padding: '2.5rem 2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2.5rem' }}>
                            <div style={{ background: 'var(--bg-tertiary)', padding: '10px', borderRadius: '12px' }}>
                                <User size={24} style={{ color: 'var(--accent-primary)' }} />
                            </div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Account Information</h2>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                            <div>
                                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>USERNAME</label>
                                <div className="form-control" style={{
                                    background: 'var(--bg-tertiary)',
                                    height: '54px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '12px',
                                    fontWeight: 700,
                                    padding: '0 1.25rem',
                                    fontSize: '1rem'
                                }}>
                                    {user.username}
                                </div>
                            </div>

                            <div>
                                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>EMAIL ADDRESS</label>
                                <div className="form-control" style={{
                                    background: 'var(--bg-tertiary)',
                                    height: '54px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '12px',
                                    fontWeight: 700,
                                    padding: '0 1.25rem',
                                    fontSize: '1rem'
                                }}>
                                    {user.email}
                                </div>
                            </div>

                            <div>
                                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>WALLET BALANCE</label>
                                <div className="form-control" style={{
                                    background: 'rgba(240, 185, 11, 0.05)',
                                    height: '60px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    border: '1px solid rgba(240, 185, 11, 0.3)',
                                    borderRadius: '12px',
                                    color: 'var(--accent-primary)',
                                    fontWeight: 800,
                                    fontSize: '1.25rem',
                                    padding: '0 1.25rem'
                                }}>
                                    ${formatNumber(user.wallet)}
                                </div>
                            </div>

                            <Link to="/wallet" className="btn btn-primary btn-lg" style={{ width: '100%', height: '54px', marginTop: '0.5rem', borderRadius: '12px', fontWeight: 700 }}>
                                <Wallet size={20} style={{ marginRight: '10px' }} /> Manage Wallet
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Transaction History */}
                <div>
                    <div className="card" style={{ padding: '0' }}>
                        <div style={{ padding: '2.5rem 2rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ background: 'var(--bg-tertiary)', padding: '10px', borderRadius: '12px' }}>
                                    <History size={24} style={{ color: 'var(--accent-primary)' }} />
                                </div>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Recent Orders</h2>
                            </div>
                        </div>

                        {loading ? (
                            <div style={{ padding: '4rem', textAlign: 'center' }}>
                                <div className="spinner" style={{ margin: '0 auto 1.5rem' }}></div>
                                <div style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Syncing trade history...</div>
                            </div>
                        ) : transactions.length > 0 ? (
                            <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th style={{ paddingLeft: '2rem' }}>Date</th>
                                            <th>Type</th>
                                            <th>Asset</th>
                                            <th className="numeric-cell">Price</th>
                                            <th className="numeric-cell">Quantity</th>
                                            <th className="numeric-cell" style={{ paddingRight: '2rem' }}>Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transactions.map((tx) => (
                                            <tr key={tx._id}>
                                                <td style={{ padding: '1.25rem 1.5rem', paddingLeft: '2rem', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                                                    {tx.formattedTimestamp}
                                                </td>
                                                <td style={{ padding: '1.25rem 1.5rem' }}>
                                                    <span style={{
                                                        padding: '0.4rem 0.8rem',
                                                        borderRadius: '8px',
                                                        fontWeight: 800,
                                                        fontSize: '0.75rem',
                                                        textTransform: 'uppercase',
                                                        backgroundColor: tx.type === 'buy' ? 'rgba(2, 192, 118, 0.1)' : 'rgba(246, 70, 93, 0.1)',
                                                        color: tx.type === 'buy' ? '#02c076' : '#f6465d',
                                                        letterSpacing: '0.05em'
                                                    }}>
                                                        {tx.type}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1.25rem 1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{tx.coinName}</td>
                                                <td className="numeric-cell" style={{ padding: '1.25rem 1.5rem', fontWeight: 600 }}>${formatPrice(tx.price)}</td>
                                                <td className="numeric-cell" style={{ padding: '1.25rem 1.5rem', fontWeight: 600 }}>{tx.quantity}</td>
                                                <td className="numeric-cell" style={{ padding: '1.25rem 1.5rem', paddingRight: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                                                    ${formatPrice(tx.totalValue)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div style={{ padding: '5rem 2rem', textAlign: 'center' }}>
                                <div style={{ background: 'var(--bg-tertiary)', width: '70px', height: '70px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                                    <ShoppingCart size={32} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
                                </div>
                                <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>No Trades Yet</h3>
                                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>You haven't made any purchases or sales yet.</p>
                                <Link to="/" className="btn btn-primary btn-sm" style={{ borderRadius: '10px', padding: '0.6rem 1.5rem' }}>
                                    Browse Markets
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '3rem' }}>
                <Link to="/portfolio" className="btn btn-secondary btn-lg" style={{ borderRadius: '14px', padding: '0 2rem', height: '54px' }}>
                    View Performance
                </Link>
                <Link to="/" className="btn btn-secondary btn-lg" style={{ borderRadius: '14px', padding: '0 2rem', height: '54px' }}>
                    <ArrowLeft size={18} style={{ marginRight: '8px' }} /> Back to Markets
                </Link>
            </div>
        </div>
    );
};

export default Profile;
