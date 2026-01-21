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
        if (!num) return '0';
        return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const formatPrice = (price) => {
        if (price == null) return 'N/A';
        return price < 1 ? price.toFixed(6) : price.toFixed(2);
    };

    if (!user) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">
                    <UserX size={48} />
                </div>
                <div className="empty-state-title">Not Logged In</div>
                <div className="empty-state-text">
                    Please sign in to view your profile and account information.
                </div>
                <div style={{ marginTop: '1rem' }}>
                    <Link to="/login" className="btn btn-primary" style={{ marginRight: '1rem' }}>
                        Login
                    </Link>
                    <Link to="/signup" className="btn btn-secondary">
                        Sign Up
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="page-header">
                <h1 className="page-title">Profile</h1>
                <p className="page-subtitle">Manage your account settings and recent history</p>
            </div>

            <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>

                {/* Profile Details */}
                <div className="profile-details">
                    <div className="card">
                        <div className="card-header">
                            <div className="card-title">
                                <User size={20} style={{ marginRight: '8px', verticalAlign: 'text-bottom' }} />
                                Account Information
                            </div>
                            <div className="card-subtitle">Your ChainXchange account details</div>
                        </div>

                        <div style={{ padding: '1rem 0' }}>
                            <div className="form-group">
                                <label className="form-label">Username</label>
                                <div className="form-control" style={{ background: 'var(--bg-hover)', cursor: 'not-allowed' }}>
                                    {user.username}
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Email Address</label>
                                <div className="form-control" style={{ background: 'var(--bg-hover)', cursor: 'not-allowed' }}>
                                    {user.email}
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Wallet Balance</label>
                                <div className="form-control" style={{ background: 'var(--bg-hover)', cursor: 'not-allowed' }}>
                                    ${formatNumber(user.wallet)}
                                </div>
                            </div>

                            {/* Assuming wallet management will be added later or linked */}
                            <Link to="/wallet" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Wallet size={18} style={{ marginRight: '8px' }} /> Manage Wallet
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Transaction History */}
                <div className="profile-history">
                    <div className="card">
                        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div className="card-title">Recent Order History</div>
                            {/* Link to full history if implemented */}
                            {/* <Link to="/history" className="btn btn-sm btn-primary">View All <ArrowRight size={14} /></Link> */}
                        </div>

                        {loading ? (
                            <div className="loading"><div className="spinner"></div>Loading history...</div>
                        ) : transactions.length > 0 ? (
                            <div className="table-container">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Type</th>
                                            <th>Asset</th>
                                            <th className="numeric-cell">Price</th>
                                            <th className="numeric-cell">Quantity</th>
                                            <th className="numeric-cell">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transactions.map((tx) => (
                                            <tr key={tx._id}>
                                                <td>{tx.formattedTimestamp}</td>
                                                <td>
                                                    <span className={`badge ${tx.type === 'buy' ? 'badge-success' : 'badge-danger'}`}
                                                        style={{
                                                            padding: '0.25rem 0.6rem',
                                                            borderRadius: '12px',
                                                            fontWeight: 'bold',
                                                            fontSize: '0.8rem',
                                                            textTransform: 'uppercase',
                                                            backgroundColor: tx.type === 'buy' ? 'rgba(0, 128, 0, 0.15)' : 'rgba(255, 0, 0, 0.15)',
                                                            color: tx.type === 'buy' ? 'var(--success-color)' : 'var(--danger-color)'
                                                        }}>
                                                        {tx.type}
                                                    </span>
                                                </td>
                                                <td>{tx.coinName}</td>
                                                <td className="numeric-cell">${formatPrice(tx.price)}</td>
                                                <td className="numeric-cell">{formatPrice(tx.quantity)}</td>
                                                <td className="numeric-cell">${formatPrice(tx.totalValue)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="empty-state" style={{ padding: '2rem' }}>
                                <div className="empty-state-icon">
                                    <History size={32} />
                                </div>
                                <div className="empty-state-title">No Transactions Yet</div>
                                <div className="empty-state-text">
                                    Your recent trades will appear here.
                                </div>
                                <Link to="/" className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }}>
                                    <ShoppingCart size={16} style={{ marginRight: '6px' }} /> Start Trading
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                <Link to="/portfolio" className="btn btn-primary" style={{ marginRight: '1rem' }}>
                    <span style={{ marginRight: '8px' }}>📊</span> View Full Portfolio
                </Link>
                <Link to="/" className="btn btn-secondary">
                    <ArrowLeft size={16} style={{ marginRight: '6px' }} /> Back to Markets
                </Link>
            </div>
        </div>
    );
};

export default Profile;
