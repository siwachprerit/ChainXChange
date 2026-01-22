import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { TrendingUp, TrendingDown, DollarSign, Wallet, PieChart, ShoppingCart, ArrowLeft, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Chart as ChartJS, ArcElement, Tooltip as ChartTooltip, Legend as ChartLegend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, ChartTooltip, ChartLegend);

const Portfolio = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [theme, setTheme] = useState(document.body.getAttribute('data-theme') || 'light');
    const { user } = useAuth();
    const { addNotification } = useNotifications();

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
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'data-theme') {
                    setTheme(document.body.getAttribute('data-theme'));
                }
            });
        });

        observer.observe(document.body, { attributes: true });
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (user) {
            fetchPortfolio();
        }
    }, [user]);

    const handleSell = async (e, coinId, currentPrice, maxQuantity) => {
        e.preventDefault();
        const quantity = e.target.quantity.value;

        try {
            const response = await axios.post('/api/crypto/sell', {
                coinId,
                price: currentPrice,
                quantity: parseFloat(quantity)
            });

            if (response.data.success) {
                toast.success(`Successfully sold ${quantity} units!`);
                addNotification(`Sold ${quantity} units of ${coinId} at $${currentPrice}`, 'success');
                fetchPortfolio(); // Refresh data
                e.target.reset();
            } else {
                toast.error(response.data.message);
            }
        } catch (err) {
            toast.error('Error processing sale');
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

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2.5rem'
            }}>
                <div className="card" style={{ padding: '1.75rem', borderLeft: '4px solid var(--accent-primary)' }}>
                    <div className="stat-label" style={{ fontWeight: 600 }}>Total Portfolio Value</div>
                    <div className="stat-value" style={{ fontSize: '1.75rem', marginTop: '0.5rem' }}>${formatPrice(data.portfolioValue)}</div>
                    <div className={`stat-change ${data.totalProfitLoss >= 0 ? 'positive' : 'negative'}`} style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '0.5rem' }}>
                        {data.totalProfitLoss >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                        {data.totalProfitLoss >= 0 ? '+' : ''}{formatPrice(data.totalProfitLossPercentage)}%
                    </div>
                </div>

                <div className="card" style={{ padding: '1.75rem', borderLeft: '4px solid var(--success-color)' }}>
                    <div className="stat-label" style={{ fontWeight: 600 }}>Total Net Profit</div>
                    <div className={`stat-value ${data.totalProfitLoss >= 0 ? 'text-success' : 'text-danger'}`} style={{ fontSize: '1.75rem', marginTop: '0.5rem', color: data.totalProfitLoss >= 0 ? 'var(--success-color)' : 'var(--danger-color)' }}>
                        {data.totalProfitLoss >= 0 ? '+' : '-'}${formatPrice(Math.abs(data.totalProfitLoss))}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Lifetime earnings</div>
                </div>

                <div className="card" style={{ padding: '1.75rem', borderLeft: '4px solid #627eea' }}>
                    <div className="stat-label" style={{ fontWeight: 600 }}>Active Assets</div>
                    <div className="stat-value" style={{ fontSize: '1.75rem', marginTop: '0.5rem' }}>{data.holdings.length}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Diversified across coins</div>
                </div>
            </div>

            <div className="portfolio-content-grid" style={{
                display: 'grid',
                gridTemplateColumns: data.holdings.length > 0 ? '1fr 300px' : '1fr',
                gap: '2rem',
                marginBottom: '2rem'
            }}>
                <div className="card" style={{ padding: '1.5rem 0' }}>
                    <div className="card-header" style={{ border: 'none', padding: '0 2rem 1.5rem' }}>
                        <div className="card-title">Your Holdings</div>
                        <div className="card-subtitle">Current positions in your portfolio</div>
                    </div>

                    <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th style={{ paddingLeft: '2rem' }}>Asset</th>
                                    <th className="numeric-cell">Quantity</th>
                                    <th className="numeric-cell">Avg. Price</th>
                                    <th className="numeric-cell">Current</th>
                                    <th className="numeric-cell">Value</th>
                                    <th style={{ textAlign: 'center' }}>P&L</th>
                                    <th style={{ paddingRight: '2rem' }}>Actions</th>
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
                                            <td style={{ padding: '1.25rem 1.5rem', paddingLeft: '2rem' }}>
                                                <Link to={`/crypto/${holding.coinId}`} className="crypto-name" style={{ textDecoration: 'none', color: 'inherit' }}>
                                                    <img src={holding.image} alt={holding.crypto} className="crypto-icon" style={{ width: '40px', height: '40px' }} />
                                                    <div>
                                                        <div style={{ fontWeight: 700, fontSize: '1rem' }}>{holding.crypto}</div>
                                                        <div className="crypto-symbol" style={{ fontWeight: 500, opacity: 0.8 }}>{holding.symbol?.toUpperCase()}</div>
                                                    </div>
                                                </Link>
                                            </td>
                                            <td className="numeric-cell" style={{ fontWeight: 600 }}>{holding.quantity < 1 ? holding.quantity.toFixed(6) : holding.quantity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            <td className="numeric-cell" style={{ fontWeight: 500 }}>${formatPrice(holding.averageBuyPrice)}</td>
                                            <td className="numeric-cell" style={{ fontWeight: 700 }}>${formatPrice(holding.currentPrice)}</td>
                                            <td className="numeric-cell" style={{ fontWeight: 700 }}>${formatPrice(totalValue)}</td>
                                            <td className={`change-cell ${pnlPercent >= 0 ? 'change-positive' : 'change-negative'}`} style={{ fontWeight: 700 }}>
                                                {pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
                                            </td>
                                            <td style={{ paddingRight: '2rem' }}>
                                                <form onSubmit={(e) => handleSell(e, holding.coinId, holding.currentPrice, holding.quantity)} className="action-form" style={{ display: 'flex', gap: '8px' }}>
                                                    <input
                                                        type="number"
                                                        name="quantity"
                                                        min="0.000001"
                                                        max={holding.quantity}
                                                        step="any"
                                                        required
                                                        placeholder="0.00"
                                                        className="form-control"
                                                        style={{ width: '80px', height: '32px', padding: '0 8px', borderRadius: '6px', fontSize: '0.875rem' }}
                                                    />
                                                    <button type="submit" className="btn btn-danger btn-sm" style={{ borderRadius: '6px' }}>Sell</button>
                                                </form>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {data.holdings.length > 0 && (
                    <div className="card" style={{ padding: '1.5rem', minWidth: 0, overflow: 'hidden' }}>
                        <div className="card-header" style={{ border: 'none', padding: '0 0 1rem' }}>
                            <div className="card-title" style={{ fontSize: '1.15rem' }}>Asset Allocation</div>
                        </div>
                        <div style={{ height: '320px', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
                            <Doughnut
                                data={{
                                    labels: data.holdings.map(h => h.crypto),
                                    datasets: [{
                                        data: data.holdings.map(h => h.quantity * h.currentPrice),
                                        backgroundColor: [
                                            '#f7931a', '#627eea', '#00ffad', '#f3ba2f', '#26a17b',
                                            '#e84142', '#345d9d', '#9b59b6', '#3498db', '#e67e22'
                                        ],
                                        borderWidth: 0,
                                        cutout: '82%'
                                    }]
                                }}
                                options={{
                                    plugins: {
                                        legend: {
                                            display: true,
                                            position: 'bottom',
                                            labels: {
                                                color: theme === 'dark' ? '#eaecef' : '#4a5568',
                                                usePointStyle: true,
                                                padding: 20,
                                                font: { size: 14, weight: 700 }
                                            }
                                        }
                                    },
                                    maintainAspectRatio: false,
                                    responsive: true
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>

            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                <Link to="/" className="btn btn-secondary" style={{ borderRadius: '12px', padding: '0.75rem 1.5rem' }}>
                    <ArrowLeft size={16} style={{ marginRight: '6px' }} /> Markets
                </Link>
            </div>
        </div>
    );
};

export default Portfolio;
