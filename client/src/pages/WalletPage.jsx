import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
    Wallet,
    ArrowLeft,
    CreditCard,
    Shield,
    PlusCircle,
    MinusCircle,
    CheckCircle,
    AlertCircle,
    Clock,
    TrendingUp,
    Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const WalletPage = () => {
    const { user, refreshUser } = useAuth();
    const { addNotification } = useNotifications();
    const [amount, setAmount] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvc, setCvc] = useState('');
    const [cardName, setCardName] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [activeTab, setActiveTab] = useState('deposit');

    useEffect(() => {
        const fetchWalletData = async () => {
            try {
                const response = await axios.get('/api/payment/wallet');
                if (response.data.success) {
                    setTransactions(response.data.transactions);
                }
            } catch (err) {
                console.error("Error fetching wallet data", err);
            }
        };
        if (user) {
            fetchWalletData();
        }
    }, [user]);

    const handleTransaction = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        setError(null);

        const endpoint = activeTab === 'deposit' ? '/api/payment/add-money' : '/api/payment/withdraw';

        try {
            const response = await axios.post(endpoint, {
                amount: parseFloat(amount),
                cardNumber,
                cardHolder: cardName,
                expiryDate: expiry,
                cvv: cvc
            });

            if (response.data.success) {
                setMessage(response.data.message);
                toast.success(response.data.message);
                addNotification(`${activeTab === 'deposit' ? 'Deposited' : 'Withdrew'} $${amount} ${activeTab === 'deposit' ? 'to' : 'from'} wallet`, 'success');
                setAmount('');
                setCardNumber('');
                setExpiry('');
                setCvc('');
                setCardName('');
                await refreshUser();

                const walletRes = await axios.get('/api/payment/wallet');
                if (walletRes.data.success) {
                    setTransactions(walletRes.data.transactions);
                }
            } else {
                setError(response.data.message);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Transaction failed');
        } finally {
            setLoading(false);
        }
    };

    const formatCardNumber = (value) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        const parts = [];
        for (let i = 0, len = v.length; i < len; i += 4) {
            parts.push(v.substring(i, i + 4));
        }
        return parts.join(' ');
    };

    const formatExpiry = (value) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        if (v.length >= 2) {
            return v.substring(0, 2) + '/' + v.substring(2, 4);
        }
        return v;
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { type: 'spring', stiffness: 100, damping: 15 }
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
                <Link to="/profile" className="btn btn-secondary btn-sm" style={{ marginBottom: '1.5rem', borderRadius: '100px', padding: '0.5rem 1rem' }}>
                    <ArrowLeft size={16} style={{ marginRight: '6px' }} /> Return to Profile
                </Link>
                <h1 style={{
                    fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
                    fontWeight: 900,
                    letterSpacing: '-0.05em',
                    lineHeight: 1,
                    marginBottom: '1rem'
                }}>
                    Financial <br />
                    <span className="text-gradient" style={{ animation: 'shine 3s linear infinite', display: 'inline-block' }}>Liquidity Hub</span>
                </h1>
                <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                    Execute instant deposits and withdrawals through our secure clearing system.
                </p>
            </motion.div>

            <div className="wallet-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(12, 1fr)',
                gap: '1.5rem',
                marginBottom: '4rem'
            }}>
                {/* Transaction Form Card */}
                <motion.div variants={itemVariants} style={{ gridColumn: 'span 5' }}>
                    <div className="card" style={{
                        padding: '2.5rem',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.05)'
                    }}>
                        <div style={{
                            background: 'var(--gradient-primary)',
                            padding: '2.5rem',
                            borderRadius: '24px',
                            color: '#000',
                            marginBottom: '2.5rem',
                            boxShadow: '0 20px 40px rgba(240, 185, 11, 0.2)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            <div style={{ position: 'relative', zIndex: 1 }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>AVAILABLE BALANCE</div>
                                <div style={{ fontSize: '3.5rem', fontWeight: 900, letterSpacing: '-0.05em', margin: '0.5rem 0' }}>
                                    ${user?.wallet ? user.wallet.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}
                                </div>
                                <div style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', fontWeight: 700 }}>
                                    <Lock size={14} style={{ marginRight: '6px' }} /> END-TO-END ENCRYPTED
                                </div>
                            </div>
                        </div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '8px',
                            marginBottom: '2.5rem',
                            background: 'var(--bg-secondary)',
                            padding: '6px',
                            borderRadius: '16px'
                        }}>
                            <button
                                onClick={() => setActiveTab('deposit')}
                                style={{
                                    borderRadius: '12px',
                                    border: 'none',
                                    fontWeight: 800,
                                    fontSize: '0.8rem',
                                    padding: '12px',
                                    cursor: 'pointer',
                                    background: activeTab === 'deposit' ? 'var(--bg-primary)' : 'transparent',
                                    color: activeTab === 'deposit' ? 'var(--text-primary)' : 'var(--text-muted)',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                DEPOSIT
                            </button>
                            <button
                                onClick={() => setActiveTab('withdraw')}
                                style={{
                                    borderRadius: '12px',
                                    border: 'none',
                                    fontWeight: 800,
                                    fontSize: '0.8rem',
                                    padding: '12px',
                                    cursor: 'pointer',
                                    background: activeTab === 'withdraw' ? 'var(--bg-primary)' : 'transparent',
                                    color: activeTab === 'withdraw' ? 'var(--text-primary)' : 'var(--text-muted)',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                WITHDRAW
                            </button>
                        </div>

                        <form onSubmit={handleTransaction}>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>AMOUNT (USD)</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    style={{ height: '64px', borderRadius: '16px', fontSize: '1.25rem', fontWeight: 700, marginTop: '0.5rem' }}
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    required
                                />
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>CARDHOLDER</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    style={{ height: '56px', borderRadius: '16px', fontWeight: 600, marginTop: '0.5rem' }}
                                    placeholder="LEGAL NAME"
                                    value={cardName}
                                    onChange={(e) => setCardName(e.target.value)}
                                    required
                                />
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>CARD NUMBER</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="text"
                                        className="form-control"
                                        style={{ height: '56px', borderRadius: '16px', fontWeight: 600, marginTop: '0.5rem' }}
                                        placeholder="0000 0000 0000 0000"
                                        value={cardNumber}
                                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                                        maxLength="19"
                                        required
                                    />
                                    <CreditCard size={20} style={{ position: 'absolute', right: '16px', top: '24px', opacity: 0.3 }} />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>EXPIRY</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        style={{ height: '56px', borderRadius: '16px', fontWeight: 600, marginTop: '0.5rem' }}
                                        placeholder="MM/YY"
                                        value={expiry}
                                        onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                                        maxLength="5"
                                        required
                                    />
                                </div>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>CVC</label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        style={{ height: '56px', borderRadius: '16px', fontWeight: 600, marginTop: '0.5rem' }}
                                        placeholder="***"
                                        value={cvc}
                                        onChange={(e) => setCvc(e.target.value.replace(/[^0-9]/g, ''))}
                                        maxLength="3"
                                        required
                                    />
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                style={{
                                    width: '100%',
                                    marginTop: '1rem',
                                    height: '64px',
                                    borderRadius: '20px',
                                    fontSize: '1rem',
                                    fontWeight: 900,
                                    border: 'none',
                                    cursor: 'pointer',
                                    background: activeTab === 'deposit' ? 'var(--accent-primary)' : 'var(--danger-bg)',
                                    color: activeTab === 'deposit' ? '#000' : 'var(--danger-color)',
                                    boxShadow: activeTab === 'deposit' ? '0 10px 20px rgba(240, 185, 11, 0.2)' : '0 10px 20px rgba(246, 70, 93, 0.1)'
                                }}
                                disabled={loading}
                            >
                                {loading ? 'PROCESSING...' : `CONFIRM ${activeTab.toUpperCase()}`}
                            </motion.button>
                        </form>
                    </div>
                </motion.div>

                {/* History Card */}
                <motion.div variants={itemVariants} style={{ gridColumn: 'span 7' }}>
                    <div className="card" style={{ padding: '0' }}>
                        <div style={{ padding: '2.5rem', borderBottom: '1px solid var(--border-color)' }}>
                            <div style={{ fontWeight: 800, fontSize: '1.25rem' }}>SETTLEMENT HISTORY</div>
                        </div>

                        {transactions.length > 0 ? (
                            <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th style={{ paddingLeft: '1.5rem' }}>NODE TYPE</th>
                                            <th className="mobile-hide">TIMESTAMP</th>
                                            <th className="mobile-hide">IDENTIFIER</th>
                                            <th style={{ textAlign: 'right' }}>VALUATION</th>
                                            <th style={{ textAlign: 'right', paddingRight: '1.5rem' }}>STATUS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transactions.map((tx) => (
                                            <tr key={tx._id}>
                                                <td style={{ padding: '1rem 0.5rem', paddingLeft: '1.5rem' }}>
                                                    <span style={{
                                                        padding: '0.4rem 0.8rem',
                                                        borderRadius: '8px',
                                                        fontWeight: 800,
                                                        fontSize: '0.65rem',
                                                        textTransform: 'uppercase',
                                                        backgroundColor: tx.type === 'deposit' ? 'rgba(2, 192, 118, 0.1)' : 'rgba(246, 70, 93, 0.1)',
                                                        color: tx.type === 'deposit' ? '#02c076' : '#f6465d'
                                                    }}>
                                                        {tx.type}
                                                    </span>
                                                </td>
                                                <td className="mobile-hide" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                                                    {tx.formattedTimestamp}
                                                </td>
                                                <td className="mobile-hide" style={{ fontSize: '0.8rem', fontWeight: 600 }}>•••• {tx.cardNumber ? tx.cardNumber.slice(-4) : 'NULL'}</td>
                                                <td style={{ textAlign: 'right', fontWeight: 800, fontSize: '0.9rem', padding: '1rem 0.5rem' }}>
                                                    {tx.type === 'deposit' ? '+' : '-'}${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </td>
                                                <td style={{ textAlign: 'right', paddingRight: '1.5rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', color: 'var(--success-color)', fontSize: '0.75rem', fontWeight: 700 }}>
                                                        <CheckCircle className="mobile-hide" size={14} /> {tx.status.toUpperCase()}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div style={{ padding: '6rem', textAlign: 'center' }}>
                                <Clock size={48} style={{ opacity: 0.1, marginBottom: '1.5rem' }} />
                                <div style={{ fontWeight: 700, color: 'var(--text-muted)' }}>ZERO SETTLEMENTS FOUND</div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default WalletPage;
