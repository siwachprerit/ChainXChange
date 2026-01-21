import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowLeft, Clock, ShoppingCart, TrendingUp, TrendingDown, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import Skeleton from '../components/Skeleton';

const TransactionHistory = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const response = await axios.get('/api/crypto/history');
                if (response.data.success) {
                    setHistory(response.data.transactions);
                } else {
                    setError(response.data.message || 'Failed to load history');
                }
            } catch (err) {
                setError('Error loading transaction history');
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    const formatPrice = (price) => {
        if (price == null) return 'N/A';
        return price < 1 ? price.toFixed(6) : price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const filteredHistory = history.filter(item =>
        item.coinName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="container">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                    <h1 className="page-title">Transaction History</h1>
                    <p className="page-subtitle">Every trade you've ever made on ChainXchange</p>
                </div>
                <div className="search-bar-container" style={{ position: 'relative', width: '300px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Search assets..."
                        className="form-control"
                        style={{ paddingLeft: '38px', borderRadius: '10px' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="card">
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Date & Time</th>
                                <th>Asset</th>
                                <th>Type</th>
                                <th className="numeric-cell">Quantity</th>
                                <th className="numeric-cell">Price</th>
                                <th className="numeric-cell">Total Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array(10).fill(0).map((_, i) => (
                                    <tr key={i}>
                                        <td><Skeleton width="150px" /></td>
                                        <td><Skeleton width="100px" /></td>
                                        <td><Skeleton width="50px" /></td>
                                        <td><Skeleton width="80px" className="numeric-cell" /></td>
                                        <td><Skeleton width="80px" className="numeric-cell" /></td>
                                        <td><Skeleton width="100px" className="numeric-cell" /></td>
                                    </tr>
                                ))
                            ) : error ? (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--danger-color)' }}>{error}</td></tr>
                            ) : filteredHistory.length === 0 ? (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No transactions found.</td></tr>
                            ) : (
                                filteredHistory.map((item, index) => (
                                    <tr key={index}>
                                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                            {item.formattedTimestamp.split(' ')[0]} <br />
                                            <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>{item.formattedTimestamp.split(' ').slice(1).join(' ')}</span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ fontWeight: 600 }}>{item.coinName}</div>
                                            </div>
                                        </td>
                                        <td>
                                            <span style={{
                                                padding: '4px 8px',
                                                borderRadius: '6px',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                background: item.type === 'buy' ? 'rgba(2, 192, 118, 0.1)' : 'rgba(246, 70, 93, 0.1)',
                                                color: item.type === 'buy' ? 'var(--success-color)' : 'var(--danger-color)',
                                                textTransform: 'uppercase'
                                            }}>
                                                {item.type}
                                            </span>
                                        </td>
                                        <td className="numeric-cell">{formatPrice(item.quantity)}</td>
                                        <td className="numeric-cell">${formatPrice(item.price)}</td>
                                        <td className="numeric-cell" style={{ fontWeight: 600 }}>
                                            ${formatPrice(item.quantity * item.price)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                <Link to="/portfolio" className="btn btn-secondary">
                    <ArrowLeft size={16} style={{ marginRight: '6px' }} /> Back to Portfolio
                </Link>
            </div>
        </div>
    );
};

export default TransactionHistory;
