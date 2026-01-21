import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { PieChart, ArrowLeft, ShoppingCart, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Portfolio = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useAuth();

    const fetchPortfolio = async () => {
        try {
            const response = await axios.get('/api/portfolio');
            if (response.data.success) {
                setData(response.data);
            } else {
                setError(response.data.message || 'Failed to load portfolio');
            }
        } catch (err) {
            setError('Error loading portfolio data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchPortfolio();
        }
    }, [user]);

    const [message, setMessage] = useState(null);

    const handleSell = async (e, coinId, currentPrice, maxQuantity) => {
        e.preventDefault();
        setMessage(null);
        const quantity = e.target.quantity.value;

        try {
            const response = await axios.post('/api/crypto/sell', {
                coinId,
                price: currentPrice,
                quantity: parseFloat(quantity)
            });

            if (response.data.success) {
                setMessage({ type: 'success', text: `Successfully sold ${quantity} units!` });
                fetchPortfolio(); // Refresh data
                e.target.reset();
                setTimeout(() => setMessage(null), 3000);
            } else {
                setMessage({ type: 'error', text: response.data.message });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Error processing sale' });
        }
    };

    const formatPrice = (price) => {
        if (price == null) return 'N/A';
        return price < 1 ? price.toFixed(6) : price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    if (loading) return <div className="loading"><div className="spinner"></div>Loading Portfolio...</div>;
    if (error) return <div className="alert alert-error">{error}</div>;

    if (!data || !data.holdings || data.holdings.length === 0) {
        return (
            <div className="container">
                <div className="page-header">
                    <h1 className="page-title">Your Portfolio</h1>
                    <p className="page-subtitle">Track your cryptocurrency investments</p>
                </div>
                <div className="empty-state">
                    <div className="empty-state-icon">
                        <PieChart size={48} />
                    </div>
                    <div className="empty-state-title">Your Portfolio is Empty</div>
                    <div className="empty-state-text">
                        Start trading to build your cryptocurrency portfolio and track your investments.
                    </div>
                    <Link to="/" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                        <ShoppingCart size={18} style={{ marginRight: '8px' }} /> Start Trading
                    </Link>
                </div>
                <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                    <Link to="/" className="btn btn-secondary">
                        <ArrowLeft size={16} style={{ marginRight: '6px' }} /> Back to Markets
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="page-header">
                <h1 className="page-title">Your Portfolio</h1>
                <p className="page-subtitle">Track your cryptocurrency investments</p>
            </div>

            {message && (
                <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: '1rem', padding: '0.75rem', borderRadius: '8px' }}>
                    {message.type === 'success' ? '✓' : '⚠'} {message.text}
                </div>
            )}

            <div className="portfolio-summary" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2rem'
            }}>
                <div className="stat-card">
                    <div className="stat-label">Total Portfolio Value</div>
                    <div className="stat-value">${formatPrice(data.portfolioValue)}</div>
                    <div className={`stat-change ${data.totalProfitLoss >= 0 ? 'positive' : 'negative'}`}>
                        {data.totalProfitLoss >= 0 ? <TrendingUp size={16} style={{ marginRight: 4 }} /> : <TrendingDown size={16} style={{ marginRight: 4 }} />}
                        {data.totalProfitLoss >= 0 ? '+' : ''}{formatPrice(data.totalProfitLossPercentage)}%
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-label">Total Profit/Loss</div>
                    <div className={`stat-value ${data.totalProfitLoss >= 0 ? 'text-success' : 'text-danger'}`} style={{ color: data.totalProfitLoss >= 0 ? 'var(--success-color)' : 'var(--danger-color)' }}>
                        {data.totalProfitLoss >= 0 ? '+' : ''}${formatPrice(data.totalProfitLoss)}
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-label">Total Coins</div>
                    <div className="stat-value">{data.holdings.length}</div>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <div className="card-title">Your Holdings</div>
                    <div className="card-subtitle">Current positions in your portfolio</div>
                </div>

                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Asset</th>
                                <th className="numeric-cell">Quantity</th>
                                <th className="numeric-cell">Avg. Buy Price</th>
                                <th className="numeric-cell">Current Price</th>
                                <th className="numeric-cell">Total Value</th>
                                <th style={{ textAlign: 'center' }}>P&L</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.holdings.map((holding) => {
                                const totalValue = holding.quantity * holding.currentPrice;
                                const pnlPercent = holding.averageBuyPrice > 0
                                    ? ((holding.currentPrice - holding.averageBuyPrice) / holding.averageBuyPrice) * 100
                                    : 0;

                                return (
                                    <tr key={holding.coinId}>
                                        <td>
                                            <Link to={`/crypto/${holding.coinId}`} className="crypto-name" style={{ textDecoration: 'none', color: 'inherit' }}>
                                                <img src={holding.image} alt={holding.crypto} className="crypto-icon" />
                                                <div>
                                                    <div style={{ fontWeight: 600 }}>{holding.crypto}</div>
                                                    <div className="crypto-symbol">{holding.symbol?.toUpperCase()}</div>
                                                </div>
                                            </Link>
                                        </td>
                                        <td className="numeric-cell">{formatPrice(holding.quantity)}</td>
                                        <td className="numeric-cell">${formatPrice(holding.averageBuyPrice)}</td>
                                        <td className="numeric-cell">${formatPrice(holding.currentPrice)}</td>
                                        <td className="numeric-cell">${formatPrice(totalValue)}</td>
                                        <td className={`change-cell ${pnlPercent >= 0 ? 'change-positive' : 'change-negative'}`}>
                                            {pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
                                        </td>
                                        <td>
                                            <form onSubmit={(e) => handleSell(e, holding.coinId, holding.currentPrice, holding.quantity)} className="action-form">
                                                <input
                                                    type="number"
                                                    name="quantity"
                                                    min="0.000001"
                                                    max={holding.quantity}
                                                    step="0.000001"
                                                    required
                                                    placeholder="0.00"
                                                    className="quantity-input"
                                                    style={{ width: '80px', marginRight: '0.5rem' }}
                                                />
                                                <button type="submit" className="btn btn-danger btn-sm">
                                                    Sell
                                                </button>
                                            </form>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                <Link to="/" className="btn btn-secondary">
                    <ArrowLeft size={16} style={{ marginRight: '6px' }} /> Back to Markets
                </Link>
            </div>
        </div>
    );
};

export default Portfolio;
