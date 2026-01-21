import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    ArrowLeft, TrendingUp, TrendingDown, DollarSign,
    Activity, Clock, AlertCircle, ShoppingCart
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const CryptoDetail = () => {
    const { coinId } = useParams();
    const { user, refreshUser } = useAuth(); // Assuming refreshUser updates wallet balance
    const navigate = useNavigate();

    const [coin, setCoin] = useState(null);
    const [chartData, setChartData] = useState(null);
    const [timeframe, setTimeframe] = useState('24h');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Trading state
    const [activeTab, setActiveTab] = useState('buy'); // 'buy' or 'sell'
    const [orderType, setOrderType] = useState('market'); // 'market' or 'limit'
    const [quantity, setQuantity] = useState('');
    const [estimatedTotal, setEstimatedTotal] = useState(0);
    const [tradingError, setTradingError] = useState(''); // Keep for legacy
    const [tradingMessage, setTradingMessage] = useState(null); // New message object {type, text}
    const [activeOrderAction, setActiveOrderAction] = useState('buy');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // In a real app these might be separate calls to avoid blocking UI
                // But for now we fetch detail + chart together or sequentially
                const detailRes = await axios.get(`/api/crypto/detail/${coinId}`);

                if (detailRes.data.success) {
                    setCoin(detailRes.data.coin);
                    // Decoupled chart fetch: Trigger it now
                    fetchChartData('24h');
                } else {
                    setError(detailRes.data.message || 'Failed to fetch coin details');
                }
            } catch (err) {
                setError('Error loading coin details');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [coinId]);

    // Update document title when coin data is loaded
    useEffect(() => {
        if (coin) {
            document.title = `${coin.name} (${coin.symbol.toUpperCase()}) | ChainXchange`;
        }
    }, [coin]);

    // Handle Chart Timeframe Change
    const fetchChartData = async (tf) => {
        setTimeframe(tf);
        try {
            const res = await axios.get(`/api/crypto/chart-data/${coinId}?timeframe=${tf}`);

            let rawChartData = res.data;
            if (rawChartData) {
                if (!Array.isArray(rawChartData) && rawChartData.prices) {
                    rawChartData = rawChartData.prices;
                }

                if (Array.isArray(rawChartData)) {
                    setChartData(rawChartData.map(p => ({ x: p[0], y: p[1] })));
                }
            }
        } catch (err) {
            console.error("Error fetching chart data", err);
        }
    };

    const handleQuantityChange = (e) => {
        const val = e.target.value;
        setQuantity(val);
        if (coin) {
            setEstimatedTotal(val * coin.current_price);
        }
    };

    const handleTrade = async (e) => {
        e.preventDefault();
        setTradingError('');

        if (!user) {
            navigate('/login');
            return;
        }

        try {
            const endpoint = activeTab === 'buy' ? '/api/crypto/buy' : '/api/crypto/sell';
            const payload = {
                coinId,
                quantity: parseFloat(quantity),
                price: coin.current_price // For market orders
            };

            const res = await axios.post(endpoint, payload);

            if (res.data.success) {
                // alert(`${activeTab === 'buy' ? 'Buy' : 'Sell'} order successful!`);
                setTradingMessage({ type: 'success', text: `${activeTab === 'buy' ? 'Buy' : 'Sell'} order successful!` });
                setQuantity('');
                setEstimatedTotal(0);
                refreshUser && refreshUser(); // Update balance
                // Optionally refresh coin user holdings if that endpoint existed
                setTimeout(() => setTradingMessage(null), 3000);
            } else {
                setTradingMessage({ type: 'error', text: res.data.message });
            }
        } catch (err) {
            setTradingMessage({ type: 'error', text: err.response?.data?.message || 'Transaction failed' });
        }
    };

    if (loading) return <div className="loading"><div className="spinner"></div>Loading {coinId}...</div>;
    if (error) return <div className="alert alert-error">{error}</div>;
    if (!coin) return null;

    // Chart.js options
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                mode: 'index',
                intersect: false,
            },
        },
        scales: {
            x: { display: false },
            y: {
                display: true,
                grid: { color: 'rgba(255, 255, 255, 0.05)' }
            }
        },
        elements: {
            point: { radius: 0 }
        }
    };

    const chartJsData = {
        labels: chartData ? chartData.map(d => new Date(d.x).toLocaleTimeString()) : [],
        datasets: [
            {
                fill: true,
                label: 'Price (USD)',
                data: chartData ? chartData.map(d => d.y) : [],
                borderColor: coin.price_change_percentage_24h >= 0 ? '#02c076' : '#f6465d',
                backgroundColor: coin.price_change_percentage_24h >= 0 ? 'rgba(2, 192, 118, 0.1)' : 'rgba(246, 70, 93, 0.1)',
                borderWidth: 2,
                tension: 0.1
            },
        ],
    };

    const formatPrice = (price) => {
        if (!price) return '0.00';
        return price < 1 ? price.toFixed(6) : price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    return (
        <div className="container crypto-detail-container">
            <div className="back-nav" style={{ marginBottom: '1rem' }}>
                <Link to="/" className="btn btn-secondary btn-sm">
                    <ArrowLeft size={16} /> Back
                </Link>
            </div>

            <div className="detail-grid">
                {/* Main Chart Section */}
                <div className="detail-main">
                    <div className="card chart-section-full">
                        <div className="coin-info-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <img src={coin.image} alt={coin.name} style={{ width: 48, height: 48 }} />
                                <div>
                                    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>{coin.name}</h1>
                                    <div style={{ color: 'var(--text-secondary)' }}>{coin.symbol.toUpperCase()} • Rank #{coin.market_cap_rank}</div>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>${formatPrice(coin.current_price)}</div>
                                <div style={{
                                    color: coin.price_change_percentage_24h >= 0 ? 'var(--success-color)' : 'var(--danger-color)',
                                    fontWeight: 'bold'
                                }}>
                                    {coin.price_change_percentage_24h >= 0 ? <TrendingUp size={16} style={{ display: 'inline' }} /> : <TrendingDown size={16} style={{ display: 'inline' }} />}
                                    {coin.price_change_percentage_24h?.toFixed(2)}%
                                </div>
                            </div>
                        </div>

                        {/* Chart Controls */}
                        <div className="chart-timeframes-bottom compact" style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
                            {['1h', '24h', '7d', '1m', '1y'].map(tf => (
                                <button
                                    key={tf}
                                    className={`btn btn-sm ${timeframe === tf ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => fetchChartData(tf)}
                                >
                                    {tf.toUpperCase()}
                                </button>
                            ))}
                        </div>

                        <div style={{ height: '400px', width: '100%' }}>
                            {chartData ? <Line options={chartOptions} data={chartJsData} /> : <div className="loading">Loading Chart...</div>}
                        </div>
                    </div>

                    {/* Performance Stats */}
                    <div className="performance-main-container card" style={{ marginTop: '1.5rem' }}>
                        <h3 className="card-title" style={{ marginBottom: '1rem' }}>Market Stats</h3>
                        <div className="performance-metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                            <div className="performance-metric">
                                <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Market Cap</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>${parseInt(coin.market_cap).toLocaleString()}</div>
                            </div>
                            <div className="performance-metric">
                                <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>24h Volume</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>${parseInt(coin.total_volume).toLocaleString()}</div>
                            </div>
                            <div className="performance-metric">
                                <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>High 24h</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>${formatPrice(coin.high_24h)}</div>
                            </div>
                            <div className="performance-metric">
                                <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Low 24h</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>${formatPrice(coin.low_24h)}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Trading Panel */}
                <div className="detail-sidebar">
                    <div className="card trading-panel">
                        <div className="trading-tabs" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', marginBottom: '1.5rem', background: 'var(--bg-tertiary)', padding: '4px', borderRadius: '8px' }}>
                            <button
                                className={`btn ${activeTab === 'buy' ? 'btn-success' : 'btn-ghost'}`}
                                style={{ borderRadius: '6px' }}
                                onClick={() => setActiveTab('buy')}
                            >
                                Buy
                            </button>
                            <button
                                className={`btn ${activeTab === 'sell' ? 'btn-danger' : 'btn-ghost'}`}
                                style={{ borderRadius: '6px' }}
                                onClick={() => setActiveTab('sell')}
                            >
                                Sell
                            </button>
                        </div>

                        {tradingMessage && (
                            <div className={`alert ${tradingMessage.type === 'success' ? 'alert-success' : 'alert-error'}`} style={{ padding: '0.75rem', marginBottom: '1rem', fontSize: '0.9rem' }}>
                                {tradingMessage.type === 'success' ? '✓' : '⚠'} {tradingMessage.text}
                            </div>
                        )}

                        {user ? (
                            <form onSubmit={handleTrade}>
                                <div className="form-group">
                                    <label className="form-label">Available Balance</label>
                                    <div className="form-control" style={{ background: 'var(--bg-hover)', border: 'none' }}>
                                        ${user.wallet ? formatPrice(user.wallet) : '0.00'}
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Quantity ({coin.symbol.toUpperCase()})</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        placeholder="0.00"
                                        value={quantity}
                                        onChange={handleQuantityChange}
                                        required
                                        min="0.000001"
                                        step="any"
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Estimated Total (USD)</label>
                                    <div className="form-control" style={{ background: 'var(--bg-hover)', border: 'none', color: activeTab === 'buy' ? 'var(--text-primary)' : 'var(--text-primary)' }}>
                                        ${estimatedTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                    </div>
                                </div>

                                {tradingError && <div className="alert alert-error" style={{ padding: '0.5rem', marginBottom: '1rem' }}>{tradingError}</div>}

                                <button
                                    type="submit"
                                    className={`btn ${activeTab === 'buy' ? 'btn-success' : 'btn-danger'}`}
                                    style={{ width: '100%', padding: '1rem', fontSize: '1rem' }}
                                >
                                    {activeTab === 'buy' ? `Buy ${coin.symbol.toUpperCase()}` : `Sell ${coin.symbol.toUpperCase()}`}
                                </button>
                            </form>
                        ) : (
                            <div className="login-prompt" style={{ textAlign: 'center', padding: '2rem 0' }}>
                                <p style={{ marginBottom: '1rem' }}>Login to trade {coin.name}</p>
                                <Link to="/login" className="btn btn-primary" style={{ width: '100%' }}>Login</Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CryptoDetail;
