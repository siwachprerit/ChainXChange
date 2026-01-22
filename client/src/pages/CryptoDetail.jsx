import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
    ArrowLeft, TrendingUp, TrendingDown, DollarSign,
    Activity, Clock, AlertCircle, ShoppingCart, Star
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';
import Skeleton from '../components/Skeleton';
import { motion, AnimatePresence } from 'framer-motion';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const CryptoDetail = () => {
    const { coinId } = useParams();
    const { user, refreshUser } = useAuth();
    const navigate = useNavigate();

    const [coin, setCoin] = useState(null);
    const [chartData, setChartData] = useState(null);
    const [timeframe, setTimeframe] = useState('24h');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Trading state
    const [activeTab, setActiveTab] = useState('buy');
    const [quantity, setQuantity] = useState('');
    const [estimatedTotal, setEstimatedTotal] = useState(0);
    const [isWatchlisted, setIsWatchlisted] = useState(false);
    const [theme, setTheme] = useState(document.body.getAttribute('data-theme') || 'light');
    const { addNotification } = useNotifications();

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

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [detailRes, chartRes] = await Promise.all([
                    axios.get(`/api/crypto/detail/${coinId}`),
                    axios.get(`/api/crypto/chart-data/${coinId}?timeframe=24h`)
                ]);

                if (detailRes.data.success) {
                    setCoin(detailRes.data.coin);
                } else {
                    setError(detailRes.data.message || 'Failed to fetch coin details');
                }

                let rawChartData = chartRes.data;
                if (rawChartData) {
                    if (!Array.isArray(rawChartData) && rawChartData.prices) {
                        rawChartData = rawChartData.prices;
                    }
                    if (Array.isArray(rawChartData)) {
                        setChartData(rawChartData.map(p => ({ x: p[0], y: p[1] })));
                    }
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

    useEffect(() => {
        if (coin) {
            document.title = `${coin.name} (${coin.symbol.toUpperCase()})`;
            const watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
            setIsWatchlisted(watchlist.includes(coinId));
        }
    }, [coin, coinId]);

    const toggleWatchlist = () => {
        const watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
        let newWatchlist;
        if (watchlist.includes(coinId)) {
            newWatchlist = watchlist.filter(id => id !== coinId);
            setIsWatchlisted(false);
        } else {
            newWatchlist = [...watchlist, coinId];
            setIsWatchlisted(true);
        }
        localStorage.setItem('watchlist', JSON.stringify(newWatchlist));
    };

    const handleQuantityChange = (e) => {
        const val = e.target.value;
        setQuantity(val);
        if (coin) {
            setEstimatedTotal(val * coin.current_price);
        }
    };

    const formatPrice = (price) => {
        if (!price) return '0.00';
        return price < 1 ? price.toFixed(6) : price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const formatNumber = (num) => {
        if (!num) return '0';
        if (num >= 1000000000000) return (num / 1000000000000).toFixed(2) + 'T';
        if (num >= 1000000000) return (num / 1000000000).toFixed(2) + 'B';
        if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
        return num.toLocaleString();
    };

    const handleTrade = async (e) => {
        e.preventDefault();
        if (!user) {
            navigate('/login');
            return;
        }

        try {
            const endpoint = activeTab === 'buy' ? '/api/crypto/buy' : '/api/crypto/sell';
            const payload = {
                coinId,
                quantity: parseFloat(quantity),
                price: coin.current_price
            };

            const res = await axios.post(endpoint, payload);

            if (res.data.success) {
                const actionText = activeTab === 'buy' ? 'Bought' : 'Sold';
                toast.success(`${activeTab === 'buy' ? 'Buy' : 'Sell'} order successful!`);
                addNotification(`${actionText} ${quantity} ${coin.symbol.toUpperCase()} at $${formatPrice(coin.current_price)}`, 'success');
                setQuantity('');
                setEstimatedTotal(0);
                refreshUser && refreshUser();
            } else {
                toast.error(res.data.message);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Transaction failed');
        }
    };

    const showSkeleton = loading || !coin;

    if (error) return (
        <div className="container" style={{ marginTop: '2rem' }}>
            <Link to="/" className="btn btn-secondary btn-sm" style={{ marginBottom: '1rem' }}>
                <ArrowLeft size={16} style={{ marginRight: '8px' }} /> Markets
            </Link>
            <div className="alert alert-error">{error}</div>
        </div>
    );

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
                grid: { color: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' },
                ticks: { color: theme === 'dark' ? '#b7bdc6' : '#4a5568' }
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
                borderColor: coin?.price_change_percentage_24h >= 0 ? '#02c076' : '#f6465d',
                backgroundColor: coin?.price_change_percentage_24h >= 0 ? 'rgba(2, 192, 118, 0.1)' : 'rgba(246, 70, 93, 0.1)',
                borderWidth: 2,
                tension: 0.1
            },
        ],
    };

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
            style={{ paddingBottom: '4rem' }}
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            <motion.div style={{ marginBottom: '2rem' }} variants={itemVariants}>
                <Link to="/" className="btn btn-secondary btn-sm" style={{ paddingLeft: '0.75rem' }}>
                    <ArrowLeft size={16} style={{ marginRight: '6px' }} /> Markets
                </Link>
            </motion.div>

            <div className="crypto-detail-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr) 350px',
                gap: '1.5rem',
                alignItems: 'start'
            }}>
                {/* Main Content Area */}
                <div style={{ minWidth: 0 }}>
                    <motion.div className="card" style={{ padding: '1.5rem' }} variants={itemVariants}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', gap: '1rem', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                {showSkeleton ? (
                                    <Skeleton width="48px" height="48px" borderRadius="50%" />
                                ) : (
                                    <img src={coin?.image} alt={coin?.name} style={{ width: 48, height: 48 }} />
                                )}
                                <div>
                                    {showSkeleton ? (
                                        <>
                                            <Skeleton width="150px" height="30px" />
                                            <Skeleton width="100px" height="15px" style={{ marginTop: '5px' }} />
                                        </>
                                    ) : (
                                        <>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', margin: 0 }}>{coin?.name}</h1>
                                                <button
                                                    onClick={toggleWatchlist}
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: isWatchlisted ? '#f3ba2f' : 'var(--text-muted)' }}
                                                >
                                                    <Star size={24} fill={isWatchlisted ? '#f3ba2f' : 'none'} />
                                                </button>
                                            </div>
                                            <div style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{coin?.symbol?.toUpperCase()} • Rank #{coin?.market_cap_rank}</div>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                {showSkeleton ? (
                                    <>
                                        <Skeleton width="120px" height="40px" />
                                        <Skeleton width="60px" height="20px" style={{ marginTop: '5px', marginLeft: 'auto' }} />
                                    </>
                                ) : (
                                    <>
                                        <div style={{ fontSize: '2.25rem', fontWeight: 800 }}>${formatPrice(coin?.current_price)}</div>
                                        <div style={{
                                            color: coin?.price_change_percentage_24h >= 0 ? 'var(--success-color)' : 'var(--danger-color)',
                                            fontWeight: 700,
                                            fontSize: '1.1rem'
                                        }}>
                                            {coin?.price_change_percentage_24h >= 0 ? <TrendingUp size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /> : <TrendingDown size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />}
                                            {coin?.price_change_percentage_24h?.toFixed(2)}%
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Chart Controls */}
                        <div style={{ display: 'flex', gap: '6px', marginBottom: '2rem', background: 'var(--bg-tertiary)', padding: '4px', borderRadius: '10px', width: 'fit-content', flexWrap: 'wrap' }}>
                            {['1h', '24h', '7d', '1m', '1y'].map(tf => (
                                <button
                                    key={tf}
                                    className={`btn btn-sm ${timeframe === tf ? 'btn-primary' : ''}`}
                                    style={{
                                        borderRadius: '8px',
                                        minWidth: '50px',
                                        background: timeframe === tf ? 'var(--accent-primary)' : 'transparent',
                                        color: timeframe === tf ? 'black' : 'var(--text-secondary)',
                                        border: 'none'
                                    }}
                                    onClick={() => fetchChartData(tf)}
                                    disabled={showSkeleton}
                                >
                                    {tf.toUpperCase()}
                                </button>
                            ))}
                        </div>

                        <div style={{ height: '400px', width: '100%' }} className="chart-container-wrapper">
                            {showSkeleton ? (
                                <Skeleton width="100%" height="100%" />
                            ) : (
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={timeframe}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.2 }}
                                        style={{ height: '100%' }}
                                    >
                                        {chartData ? <Line options={chartOptions} data={chartJsData} /> : <div className="loading">Loading Chart Data...</div>}
                                    </motion.div>
                                </AnimatePresence>
                            )}
                        </div>
                    </motion.div>

                    <motion.div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginTop: '2rem' }} variants={itemVariants}>
                        {[
                            { label: 'Market Cap', value: coin ? `$${formatNumber(coin.market_cap)}` : null, icon: <Activity size={18} /> },
                            { label: '24h Volume', value: coin ? `$${formatNumber(coin.total_volume)}` : null, icon: <Clock size={18} /> },
                            { label: 'High 24h', value: coin ? `$${formatPrice(coin.high_24h)}` : null, icon: <TrendingUp size={18} /> },
                            { label: 'Low 24h', value: coin ? `$${formatPrice(coin.low_24h)}` : null, icon: <TrendingDown size={18} /> }
                        ].map((stat, i) => (
                            <div className="card" key={i} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>
                                    {stat.icon} {stat.label}
                                </div>
                                {showSkeleton ? (
                                    <Skeleton width="120px" height="28px" />
                                ) : (
                                    <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)' }}>{stat.value}</div>
                                )}
                            </div>
                        ))}
                    </motion.div>
                </div>

                {/* Sidebar Trading Panel */}
                <motion.div style={{ position: 'sticky', top: '100px' }} variants={itemVariants}>
                    <div className="card" style={{ padding: '2.5rem 2rem' }}>
                        <div style={{
                            display: 'flex',
                            background: 'var(--bg-tertiary)',
                            padding: '6px',
                            borderRadius: '14px',
                            marginBottom: '2.5rem'
                        }}>
                            <button
                                className="btn"
                                style={{
                                    flex: 1,
                                    borderRadius: '10px',
                                    background: activeTab === 'buy' ? 'var(--success-color)' : 'transparent',
                                    color: activeTab === 'buy' ? 'white' : 'var(--text-secondary)',
                                    height: '44px'
                                }}
                                onClick={() => setActiveTab('buy')}
                                disabled={showSkeleton}
                            >
                                Buy
                            </button>
                            <button
                                className="btn"
                                style={{
                                    flex: 1,
                                    borderRadius: '10px',
                                    background: activeTab === 'sell' ? 'var(--danger-color)' : 'transparent',
                                    color: activeTab === 'sell' ? 'white' : 'var(--text-secondary)',
                                    height: '44px'
                                }}
                                onClick={() => setActiveTab('sell')}
                                disabled={showSkeleton}
                            >
                                Sell
                            </button>
                        </div>

                        {showSkeleton ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <Skeleton height="85px" borderRadius="14px" />
                                <Skeleton height="85px" borderRadius="14px" />
                                <Skeleton height="60px" borderRadius="14px" />
                            </div>
                        ) : user ? (
                            <form onSubmit={handleTrade} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div className="form-group" style={{ margin: 0 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                        <label className="form-label" style={{ margin: 0, fontWeight: 600 }}>Available</label>
                                        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
                                            ${user.wallet ? formatPrice(user.wallet) : '0.00'}
                                        </span>
                                    </div>
                                    <div className="form-control" style={{
                                        background: 'var(--bg-tertiary)',
                                        border: '1px solid var(--border-color)',
                                        height: '60px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '0 1.25rem',
                                        fontSize: '1.2rem',
                                        fontWeight: 700,
                                        borderRadius: '12px'
                                    }}>
                                        USD
                                    </div>
                                </div>

                                <div className="form-group" style={{ margin: 0 }}>
                                    <label className="form-label" style={{ fontWeight: 600 }}>Amount to {activeTab}</label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type="number"
                                            className="form-control"
                                            style={{
                                                height: '60px',
                                                paddingRight: '5rem',
                                                fontSize: '1.25rem',
                                                fontWeight: 700,
                                                borderRadius: '12px'
                                            }}
                                            placeholder="0.00"
                                            value={quantity}
                                            onChange={handleQuantityChange}
                                            required
                                            min="0.000001"
                                            step="any"
                                        />
                                        <span style={{
                                            position: 'absolute',
                                            right: '1.25rem',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            fontWeight: 800,
                                            color: 'var(--text-muted)',
                                            fontSize: '0.9rem'
                                        }}>
                                            {coin?.symbol?.toUpperCase()}
                                        </span>
                                    </div>
                                </div>

                                <div style={{
                                    padding: '1.5rem',
                                    background: 'var(--bg-tertiary)',
                                    borderRadius: '14px',
                                    border: '1px dashed var(--border-color)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.5rem'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>
                                        <span>Current Price</span>
                                        <span>${formatPrice(coin?.current_price)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.2rem', marginTop: '0.25rem' }}>
                                        <span>Total</span>
                                        <span style={{ color: activeTab === 'buy' ? 'var(--success-color)' : 'var(--danger-color)' }}>
                                            ${estimatedTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    className={`btn btn-lg ${activeTab === 'buy' ? 'btn-success' : 'btn-danger'}`}
                                    style={{
                                        width: '100%',
                                        height: '60px',
                                        fontSize: '1.15rem',
                                        fontWeight: 700,
                                        borderRadius: '14px',
                                        boxShadow: activeTab === 'buy' ? '0 10px 20px -10px var(--success-color)' : '0 10px 20px -10px var(--danger-color)'
                                    }}
                                >
                                    {activeTab === 'buy' ? `Buy ${coin?.symbol?.toUpperCase()}` : `Sell ${coin?.symbol?.toUpperCase()}`}
                                </motion.button>
                            </form>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                                <div style={{
                                    width: '72px',
                                    height: '72px',
                                    background: 'var(--bg-tertiary)',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 1.5rem'
                                }}>
                                    <ShoppingCart size={32} color="var(--accent-primary)" />
                                </div>
                                <h3 style={{ marginBottom: '0.75rem', fontWeight: 700 }}>Start Trading</h3>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.95rem', lineHeight: 1.6 }}>
                                    Join ChainXChange today to trade {coin?.name} and manage your digital assets.
                                </p>
                                <Link to="/login" className="btn btn-primary btn-lg" style={{ width: '100%', height: '56px', borderRadius: '14px' }}>
                                    Sign in to Buy
                                </Link>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default CryptoDetail;
