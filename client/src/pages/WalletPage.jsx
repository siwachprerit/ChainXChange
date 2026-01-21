import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Wallet, ArrowLeft, CreditCard, Shield, PlusCircle, MinusCircle, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const WalletPage = () => {
    const { user, refreshUser } = useAuth();
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

            <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr 1.5fr', gap: '2rem' }}>

                {/* Transaction Form Card */}
                <div>
                    <div className="card">
                        <div className="balance-display" style={{
                            background: 'linear-gradient(135deg, var(--primary-color), var(--primary-dark))',
                            padding: '1.5rem',
                            borderRadius: '12px',
                            color: 'white',
                            marginBottom: '1.5rem'
                        }}>
                            <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.5rem' }}>Available Balance</div>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                                ${user?.wallet ? user.wallet.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}
                            </div>
                            <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '0.5rem', display: 'flex', alignItems: 'center' }}>
                                <Shield size={12} style={{ marginRight: '4px' }} /> Secure & Encrypted
                            </div>
                        </div>

                        <div className="tabs" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1.5rem', background: 'var(--bg-tertiary)', padding: '4px', borderRadius: '8px' }}>
                            <button
                                className={`btn ${activeTab === 'deposit' ? 'btn-primary' : 'btn-ghost'}`}
                                onClick={() => setActiveTab('deposit')}
                                style={{ borderRadius: '6px', justifyContent: 'center' }}
                            >
                                <PlusCircle size={16} style={{ marginRight: '6px' }} /> Deposit
                            </button>
                            <button
                                className={`btn ${activeTab === 'withdraw' ? 'btn-danger' : 'btn-ghost'}`}
                                onClick={() => setActiveTab('withdraw')}
                                style={{ borderRadius: '6px', justifyContent: 'center' }}
                            >
                                <MinusCircle size={16} style={{ marginRight: '6px' }} /> Withdraw
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
                                className={`btn ${activeTab === 'deposit' ? 'btn-primary' : 'btn-danger'}`}
                                style={{ width: '100%', marginTop: '1rem' }}
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
