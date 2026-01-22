import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { User, Wallet, History, ArrowRight, ArrowLeft, ShoppingCart, Info, UserX } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

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

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                type: 'spring',
                stiffness: 100,
                damping: 15
            }
        }
    };

    return (
        <motion.div
            className="container"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            style={{ position: 'relative' }}
        >
            <motion.div variants={itemVariants} style={{ marginBottom: '4rem' }}>
                <h1 style={{
                    fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
                    fontWeight: 900,
                    letterSpacing: '-0.05em',
                    lineHeight: 1,
                    marginBottom: '1rem'
                }}>
                    Account <br />
                    <span className="text-gradient" style={{ animation: 'shine 3s linear infinite', display: 'inline-block' }}>Control Center</span>
                </h1>
                <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                    Secure management of your account credentials and system identity.
                </p>
            </motion.div>

            <div className="profile-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(12, 1fr)',
                gap: '1.5rem',
                alignItems: 'start'
            }}>

                {/* Profile Details Bento */}
                <motion.div variants={itemVariants} style={{ gridColumn: 'span 4' }}>
                    <div className="card" style={{
                        padding: '3rem 2rem',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.05)'
                    }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '24px',
                            background: 'var(--gradient-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '2rem',
                            boxShadow: '0 12px 24px rgba(240, 185, 11, 0.2)'
                        }}>
                            <User size={40} style={{ color: 'black' }} />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-primary)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>IDENTIFIER</label>
                                <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.5rem' }}>{user.username}</div>
                            </div>

                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>SECURE EMAIL</label>
                                <div style={{ fontSize: '1rem', fontWeight: 600, marginTop: '0.5rem', opacity: 0.8 }}>{user.email}</div>
                            </div>

                            <div style={{
                                background: 'rgba(240, 185, 11, 0.05)',
                                padding: '1.5rem',
                                borderRadius: '20px',
                                border: '1px solid rgba(240, 185, 11, 0.1)'
                            }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-primary)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>AVAILABLE LIQUIDITY</label>
                                <div style={{ fontSize: '2.5rem', fontWeight: 900, marginTop: '0.5rem' }}>${formatNumber(user.wallet)}</div>
                            </div>

                            <motion.div whileHover={{ y: -5 }} whileTap={{ scale: 0.95 }}>
                                <Link to="/wallet" className="btn btn-primary" style={{ width: '100%', height: '64px', borderRadius: '20px', fontWeight: 800, fontSize: '1rem' }}>
                                    MANAGE WALLET
                                </Link>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>

                {/* Transaction History Bento */}
                <motion.div variants={itemVariants} style={{ gridColumn: 'span 8' }}>
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
                                            <th className="mobile-hide" style={{ paddingLeft: '1.5rem' }}>Date</th>
                                            <th style={{ paddingLeft: '1.5rem' }}>Type</th>
                                            <th>Asset</th>
                                            <th className="mobile-hide numeric-cell">Price</th>
                                            <th className="mobile-hide numeric-cell">Quantity</th>
                                            <th className="numeric-cell" style={{ paddingRight: '1.5rem' }}>Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transactions.map((tx) => (
                                            <tr key={tx._id}>
                                                <td className="mobile-hide" style={{ padding: '1rem 1.5rem', paddingLeft: '1.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                                                    {tx.formattedTimestamp}
                                                </td>
                                                <td style={{ padding: '1rem 1.5rem', paddingLeft: '1.5rem' }}>
                                                    <span style={{
                                                        padding: '0.3rem 0.6rem',
                                                        borderRadius: '6px',
                                                        fontWeight: 800,
                                                        fontSize: '0.65rem',
                                                        textTransform: 'uppercase',
                                                        backgroundColor: tx.type === 'buy' ? 'rgba(2, 192, 118, 0.1)' : 'rgba(246, 70, 93, 0.1)',
                                                        color: tx.type === 'buy' ? '#02c076' : '#f6465d',
                                                        letterSpacing: '0.05em'
                                                    }}>
                                                        {tx.type}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1rem 1.5rem', fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.85rem' }}>{tx.coinName}</td>
                                                <td className="mobile-hide numeric-cell" style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>${formatPrice(tx.price)}</td>
                                                <td className="mobile-hide numeric-cell" style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>{tx.quantity}</td>
                                                <td className="numeric-cell" style={{ padding: '1rem 1.5rem', paddingRight: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
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
                </motion.div>
            </div>

            <motion.div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '3rem', flexWrap: 'wrap' }} variants={itemVariants}>
                <Link to="/portfolio" className="btn btn-secondary btn-lg" style={{ borderRadius: '14px', padding: '0 1.5rem', height: '54px', flex: 1, minWidth: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    View Performance
                </Link>
                <Link to="/" className="btn btn-secondary btn-lg" style={{ borderRadius: '14px', padding: '0 1.5rem', height: '54px', flex: 1, minWidth: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ArrowLeft size={18} style={{ marginRight: '8px' }} /> Markets
                </Link>
            </motion.div>
        </motion.div>
    );
};

export default Profile;
