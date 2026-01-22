import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Wallet, ArrowLeft, CreditCard, Shield, PlusCircle, MinusCircle, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import toast from 'react-hot-toast';

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
    const [activeTab, setActiveTab] = useState('deposit'); // 'deposit' or 'withdraw'

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
                await refreshUser(); // Update user balance in context

                // Refresh transaction list
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

    // Card Input Formatters
    const formatCardNumber = (value) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        const matches = v.match(/\d{4,16}/g);
        const match = matches && matches[0] || '';
        const parts = [];
        for (let i = 0, len = match.length; i < len; i += 4) {
            parts.push(match.substring(i, i + 4));
        }
        if (parts.length) {
            return parts.join(' ');
        } else {
            return value;
        }
    };

    const formatExpiry = (value) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        if (v.length >= 2) {
            return v.substring(0, 2) + '/' + v.substring(2, 4);
        }
        return v;
    };

    return (
        <div className="container">
            <div className="page-header">
                <Link to="/profile" className="btn btn-secondary btn-sm" style={{ marginBottom: '1rem', display: 'inline-flex', alignItems: 'center' }}>
                    <ArrowLeft size={16} style={{ marginRight: '6px' }} /> Back to Profile
                </Link>
                <h1 className="page-title">Wallet Management</h1>
                <p className="page-subtitle">Securely deposit and withdraw funds</p>
            </div>

            <div className="wallet-grid" style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1.5fr',
                gap: '2rem'
            }}>

                {/* Transaction Form Card */}
                <div>
                    <div className="card" style={{ padding: '2.5rem 2rem' }}>
                        <div className="balance-display" style={{
                            background: 'var(--gradient-primary)',
                            padding: '2rem',
                            borderRadius: '16px',
                            color: '#000',
                            marginBottom: '2rem',
                            boxShadow: '0 10px 25px -5px rgba(240, 185, 11, 0.3)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            <div style={{ position: 'relative', zIndex: 1 }}>
                                <div style={{ fontSize: '0.9rem', opacity: 0.8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Available Balance</div>
                                <div style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0.5rem 0' }}>
                                    ${user?.wallet ? user.wallet.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}
                                </div>
                                <div style={{ fontSize: '0.85rem', opacity: 0.7, display: 'flex', alignItems: 'center', fontWeight: 600 }}>
                                    <Shield size={14} style={{ marginRight: '6px' }} /> 256-bit SSL Secure
                                </div>
                            </div>
                            <div style={{
                                position: 'absolute',
                                right: '-20px',
                                bottom: '-20px',
                                opacity: 0.1,
                                transform: 'rotate(-15deg)'
                            }}>
                                <Wallet size={120} />
                            </div>
                        </div>

                        <div className="tabs" style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '8px',
                            marginBottom: '2.5rem',
                            background: 'var(--bg-tertiary)',
                            padding: '6px',
                            borderRadius: '14px'
                        }}>
                            <button
                                className="btn"
                                onClick={() => setActiveTab('deposit')}
                                style={{
                                    borderRadius: '10px',
                                    justifyContent: 'center',
                                    background: activeTab === 'deposit' ? 'var(--bg-primary)' : 'transparent',
                                    color: activeTab === 'deposit' ? 'var(--text-primary)' : 'var(--text-secondary)',
                                    boxShadow: activeTab === 'deposit' ? 'var(--shadow-sm)' : 'none',
                                    height: '44px'
                                }}
                            >
                                <PlusCircle size={18} style={{ marginRight: '8px' }} /> Deposit
                            </button>
                            <button
                                className="btn"
                                onClick={() => setActiveTab('withdraw')}
                                style={{
                                    borderRadius: '10px',
                                    justifyContent: 'center',
                                    background: activeTab === 'withdraw' ? 'var(--bg-primary)' : 'transparent',
                                    color: activeTab === 'withdraw' ? 'var(--text-primary)' : 'var(--text-secondary)',
                                    boxShadow: activeTab === 'withdraw' ? 'var(--shadow-sm)' : 'none',
                                    height: '44px'
                                }}
                            >
                                <MinusCircle size={18} style={{ marginRight: '8px' }} /> Withdraw
                            </button>
                        </div>

                        {message && (
                            <div className="alert alert-success" style={{ marginBottom: '1rem', padding: '0.75rem' }}>
                                <CheckCircle size={16} style={{ marginRight: '6px' }} /> {message}
                            </div>
                        )}
                        {error && (
                            <div className="alert alert-error" style={{ marginBottom: '1rem', padding: '0.75rem' }}>
                                <AlertCircle size={16} style={{ marginRight: '6px' }} /> {error}
                            </div>
                        )}

                        <form onSubmit={handleTransaction}>
                            <div className="form-group">
                                <label className="form-label">Amount (USD)</label>
                                <div style={{ position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-secondary)' }}>$</span>
                                    <input
                                        type="number"
                                        className="form-control"
                                        style={{ paddingLeft: '24px' }}
                                        placeholder="0.00"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        required
                                        min="1"
                                        step="0.01"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Card Holder Name</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="John Doe"
                                    value={cardName}
                                    onChange={(e) => setCardName(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Card Number</label>
                                <div style={{ position: 'relative' }}>
                                    <CreditCard size={16} style={{ position: 'absolute', right: '12px', top: '12px', color: 'var(--text-secondary)' }} />
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="0000 0000 0000 0000"
                                        value={cardNumber}
                                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                                        maxLength="19"
                                        required
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Expiry</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="MM/YY"
                                        value={expiry}
                                        onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                                        maxLength="5"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">CVC</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="123"
                                        value={cvc}
                                        onChange={(e) => setCvc(e.target.value.replace(/[^0-9]/g, ''))}
                                        maxLength="3"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className={`btn btn-lg ${activeTab === 'deposit' ? 'btn-primary' : 'btn-danger'}`}
                                style={{
                                    width: '100%',
                                    marginTop: '2rem',
                                    height: '56px',
                                    borderRadius: '14px',
                                    fontSize: '1.1rem',
                                    boxShadow: activeTab === 'deposit' ? '0 10px 20px -10px var(--accent-primary)' : '0 10px 20px -10px var(--danger-color)'
                                }}
                                disabled={loading}
                            >
                                {loading ? 'Processing...' : (activeTab === 'deposit' ? 'Add Funds' : 'Withdraw Funds')}
                            </button>
                        </form>
                    </div>
                </div>

                {/* History Card */}
                <div>
                    <div className="card">
                        <div className="card-header">
                            <div className="card-title">Transaction History</div>
                        </div>

                        {transactions.length > 0 ? (
                            <div className="table-container">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Type</th>
                                            <th>Date</th>
                                            <th>Card</th>
                                            <th style={{ textAlign: 'right' }}>Amount</th>
                                            <th style={{ textAlign: 'right' }}>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transactions.map((tx) => (
                                            <tr key={tx._id}>
                                                <td>
                                                    <span className={`badge ${tx.type === 'deposit' ? 'badge-success' : 'badge-danger'}`}
                                                        style={{
                                                            padding: '0.25rem 0.6rem',
                                                            borderRadius: '12px',
                                                            fontSize: '0.75rem',
                                                            textTransform: 'uppercase',
                                                            backgroundColor: tx.type === 'deposit' ? 'rgba(0, 128, 0, 0.15)' : 'rgba(255, 0, 0, 0.15)',
                                                            color: tx.type === 'deposit' ? 'var(--success-color)' : 'var(--danger-color)'
                                                        }}>
                                                        {tx.type}
                                                    </span>
                                                </td>
                                                <td style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                                    {tx.formattedTimestamp}
                                                </td>
                                                <td style={{ fontSize: '0.9rem' }}>{tx.cardNumber}</td>
                                                <td style={{ textAlign: 'right', fontWeight: 'bold', color: tx.type === 'deposit' ? 'var(--success-color)' : 'var(--text-primary)' }}>
                                                    {tx.type === 'deposit' ? '+' : '-'}${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <span style={{ color: 'var(--success-color)', fontSize: '0.85rem' }}>
                                                        {tx.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="empty-state" style={{ padding: '3rem' }}>
                                <Clock size={32} style={{ opacity: 0.5, marginBottom: '1rem' }} />
                                <div className="empty-state-text">No transactions yet</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WalletPage;
