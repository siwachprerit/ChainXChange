import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { TrendingUp, TrendingDown, DollarSign, Wallet, PieChart, ShoppingCart, ArrowLeft, Bell, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Chart as ChartJS, ArcElement, Tooltip as ChartTooltip, Legend as ChartLegend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { motion, AnimatePresence } from 'framer-motion';

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
                    Portfolio <br />
                    <span className="text-gradient" style={{ animation: 'shine 3s linear infinite', display: 'inline-block' }}>Intelligence</span>
                </h1>
                <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                    Real-time valuation and performance analytics for your digital assets.
                </p>
            </motion.div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(12, 1fr)',
                gap: '1.5rem',
                marginBottom: '4rem'
            }}>
                {/* Total Value Bento */}
                <motion.div
                    variants={itemVariants}
                    className="card"
                    style={{
                        gridColumn: 'span 5',
                        padding: '3rem 2.5rem',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-primary)' }}></div>
                        <div style={{ fontWeight: 800, fontSize: '0.75rem', letterSpacing: '0.1em', opacity: 0.6 }}>NET WORTH</div>
                    </div>
                    <div style={{ fontSize: '4rem', fontWeight: 900, letterSpacing: '-0.05em', lineHeight: 1 }}>
                        ${formatPrice(data.portfolioValue)}
                    </div>
                    <div className={`stat-change ${data.totalProfitLoss >= 0 ? 'positive' : 'negative'}`} style={{
                        marginTop: '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '1.25rem',
                        fontWeight: 800
                    }}>
                        {data.totalProfitLoss >= 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                        {data.totalProfitLoss >= 0 ? '+' : ''}{formatPrice(data.totalProfitLossPercentage)}%
                    </div>
                </motion.div>

                {/* Profit Bento */}
                <motion.div
                    variants={itemVariants}
                    className="card"
                    style={{
                        gridColumn: 'span 4',
                        padding: '2rem',
                        background: data.totalProfitLoss >= 0 ? 'rgba(2, 192, 118, 0.05)' : 'rgba(246, 70, 93, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.03)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        textAlign: 'center'
                    }}
                >
                    <div style={{ fontWeight: 800, fontSize: '0.75rem', letterSpacing: '0.1em', opacity: 0.6, marginBottom: '0.5rem' }}>TOTAL EARNINGS</div>
                    <div style={{
                        fontSize: '2.5rem',
                        fontWeight: 900,
                        color: data.totalProfitLoss >= 0 ? 'var(--success-color)' : 'var(--danger-color)'
                    }}>
                        {data.totalProfitLoss >= 0 ? '+' : '-'}${formatPrice(Math.abs(data.totalProfitLoss))}
                    </div>
                </motion.div>

                {/* Active Assets Bento */}
                <motion.div
                    variants={itemVariants}
                    className="card"
                    style={{
                        gridColumn: 'span 3',
                        padding: '2rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        textAlign: 'center'
                    }}
                >
                    <div style={{ fontWeight: 800, fontSize: '0.75rem', letterSpacing: '0.1em', opacity: 0.6, marginBottom: '0.5rem' }}>DIVERSIFICATION</div>
                    <div style={{ fontSize: '3rem', fontWeight: 900 }}>{data.holdings.length}</div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.5 }}>ACTIVE ASSETS</div>
                </motion.div>
            </div>

            <div className="portfolio-content-grid" style={{
                display: 'grid',
                gridTemplateColumns: data.holdings.length > 0 ? '1fr 300px' : '1fr',
                gap: '2rem',
                marginBottom: '2rem'
            }}>
                <motion.div className="card" style={{ padding: '1.5rem 0' }} variants={itemVariants}>
                    <div className="card-header" style={{ border: 'none', padding: '0 2rem 1.5rem' }}>
                        <div className="card-title">Your Holdings</div>
                        <div className="card-subtitle">Current positions in your portfolio</div>
                    </div>

                    <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th style={{ paddingLeft: '1rem' }}>Asset</th>
                                    <th className="mobile-hide numeric-cell">Quantity</th>
                                    <th className="mobile-hide numeric-cell">Avg. Price</th>
                                    <th className="mobile-hide numeric-cell">Current</th>
                                    <th className="numeric-cell">Value</th>
                                    <th className="mobile-hide" style={{ textAlign: 'center' }}>P&L</th>
                                    <th style={{ paddingRight: '1rem', textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <AnimatePresence mode="popLayout">
                                    {data.holdings.map((holding) => {
                                        const totalValue = holding.quantity * holding.currentPrice;
                                        const pnlPercent = holding.averageBuyPrice > 0
                                            ? ((holding.currentPrice - holding.averageBuyPrice) / holding.averageBuyPrice) * 100
                                            : 0;

                                        return (
                                            <motion.tr
                                                key={holding.coinId}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                            >
                                                <td style={{ padding: '0.75rem 0.5rem', paddingLeft: '1rem' }}>
                                                    <Link to={`/crypto/${holding.coinId}`} className="crypto-name" style={{ textDecoration: 'none', color: 'inherit' }}>
                                                        <img src={holding.image} alt={holding.crypto} className="crypto-icon" style={{ width: '32px', height: '32px' }} />
                                                        <div>
                                                            <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{holding.crypto}</div>
                                                            <div className="crypto-symbol mobile-hide" style={{ fontWeight: 500, opacity: 0.8, fontSize: '0.7rem' }}>{holding.symbol?.toUpperCase()}</div>
                                                        </div>
                                                    </Link>
                                                </td>
                                                <td className="mobile-hide numeric-cell" style={{ fontWeight: 600 }}>{holding.quantity < 1 ? holding.quantity.toFixed(4) : holding.quantity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                <td className="mobile-hide numeric-cell" style={{ fontWeight: 500 }}>${formatPrice(holding.averageBuyPrice)}</td>
                                                <td className="mobile-hide numeric-cell" style={{ fontWeight: 700 }}>${formatPrice(holding.currentPrice)}</td>
                                                <td className="numeric-cell" style={{ fontWeight: 700, fontSize: '0.85rem' }}>${formatPrice(totalValue)}</td>
                                                <td className={`mobile-hide change-cell ${pnlPercent >= 0 ? 'change-positive' : 'change-negative'}`} style={{ fontWeight: 700 }}>
                                                    {pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
                                                </td>
                                                <td style={{ padding: '1rem 0.5rem', paddingRight: '1rem', textAlign: 'right' }}>
                                                    <form onSubmit={(e) => handleSell(e, holding.coinId, holding.currentPrice, holding.quantity)} className="action-form" style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                        <input
                                                            type="number"
                                                            name="quantity"
                                                            min="0.000001"
                                                            max={holding.quantity}
                                                            step="any"
                                                            required
                                                            placeholder="Qty"
                                                            className="form-control"
                                                            style={{ width: '60px', height: '32px', padding: '0 8px', borderRadius: '6px', fontSize: '0.75rem' }}
                                                        />
                                                        <button type="submit" className="btn btn-danger btn-sm" style={{ borderRadius: '6px' }}>Sell</button>
                                                    </form>
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                </motion.div>

                {data.holdings.length > 0 && (
                    <motion.div className="card" style={{ padding: '1.5rem', minWidth: 0, overflow: 'hidden' }} variants={itemVariants}>
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
                    </motion.div>
                )}
            </div>

            <motion.div style={{ marginTop: '2rem', textAlign: 'center' }} variants={itemVariants}>
                <Link to="/" className="btn btn-secondary" style={{ borderRadius: '12px', padding: '0.75rem 1.5rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <ArrowLeft size={16} /> Back to Markets
                </Link>
            </motion.div>
        </motion.div>
    );
};

export default Portfolio;
