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
import Skeleton from '../components/Skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import Counter from '../components/Counter';
import AdvancedChart from '../components/AdvancedChart';
import confetti from 'canvas-confetti';

const CryptoDetail = () => {
    const { coinId } = useParams();
    const { user, refreshUser } = useAuth();
    const navigate = useNavigate();

    const [coin, setCoin] = useState(null);
    const [chartData, setChartData] = useState(null);
    const [volumeData, setVolumeData] = useState(null);
    const [tradeMarkers, setTradeMarkers] = useState([]);
    const [timeframe, setTimeframe] = useState('24h');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Trading state
    const [activeTab, setActiveTab] = useState('buy');
    const [quantity, setQuantity] = useState('');
    const [estimatedTotal, setEstimatedTotal] = useState(0);
    const [isWatchlisted, setIsWatchlisted] = useState(false);
    const [sentiment, setSentiment] = useState(null);
    const [whales, setWhales] = useState([]);
    const [orderType, setOrderType] = useState('market'); // market or limit
    const [limitPrice, setLimitPrice] = useState('');
    const [comparisonCoin, setComparisonCoin] = useState(null);
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
    const fetchExtraData = async () => {
        try {
            const [sentRes, whaleRes] = await Promise.all([
                axios.get(`/api/crypto/sentiment/${coinId}`),
                axios.get('/api/crypto/whales')
            ]);

            if (sentRes.data.success) setSentiment(sentRes.data);
            if (whaleRes.data.success) setWhales(whaleRes.data.alerts);
        } catch (err) {
            console.error("Using fallback for extra data");
            // Fallback Sentiment
            setSentiment({
                fearGreed: Math.floor(Math.random() * 40) + 40,
                label: 'Neutral',
                whaleActivity: 'Accumulating'
            });
            // Fallback Whales
            setWhales([
                { id: 1, coin: coinId?.toUpperCase(), amount: 'High Value', from: 'Unknown', to: 'Exchange', time: '5m ago' },
                { id: 2, coin: 'USDT', amount: '1,000,000', from: 'Treasury', to: 'Binance', time: '12m ago' },
                { id: 3, coin: coinId?.toUpperCase(), amount: 'Large Move', from: 'Wallet', to: 'Wallet', time: '1h ago' }
            ]);
        }
    };

    const fetchChartData = async (tf) => {
        setTimeframe(tf);
        try {
            const res = await axios.get(`/api/crypto/chart-data/${coinId}?timeframe=${tf}`);
            if (res.data) {
                if (res.data.prices) {
                    setChartData(res.data.prices.map(p => ({ x: p[0], y: p[1] })));
                }
                if (res.data.total_volumes) {
                    setVolumeData(res.data.total_volumes.map(v => ({ x: v[0], y: v[1] })));
                }
            }
        } catch (err) {
            console.error("Error fetching chart data", err);
        }
    };

    const fetchTradeMarkers = async () => {
        if (!user) return;
        try {
            const res = await axios.get('/api/auth/profile');
            if (res.data.success && res.data.transactions) {
                const coinHistory = res.data.transactions
                    .filter(tx => tx.coinId === coinId)
                    .map(tx => ({
                        time: Math.floor(new Date(tx.timestamp).getTime() / 1000),
                        type: tx.type,
                        amount: tx.quantity
                    }));
                setTradeMarkers(coinHistory);
            }
        } catch (err) {
            console.error("Error fetching markers", err);
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

                if (chartRes.data) {
                    if (chartRes.data.prices) {
                        setChartData(chartRes.data.prices.map(p => ({ x: p[0], y: p[1] })));
                    }
                    if (chartRes.data.total_volumes) {
                        setVolumeData(chartRes.data.total_volumes.map(v => ({ x: v[0], y: v[1] })));
                    }
                }

                await Promise.all([
                    fetchTradeMarkers(),
                    fetchExtraData()
                ]);
            } catch (err) {
                setError('Error loading coin details');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [coinId, user?.username]);

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
            const endpoint = orderType === 'market'
                ? (activeTab === 'buy' ? '/api/crypto/buy' : '/api/crypto/sell')
                : '/api/crypto/limit-order';

            const payload = {
                coinId,
                quantity: parseFloat(quantity),
                price: orderType === 'market' ? coin.current_price : parseFloat(limitPrice),
                limitPrice: parseFloat(limitPrice),
                type: activeTab
            };

            const res = await axios.post(endpoint, payload);

            if (res.data.success) {
                const actionText = activeTab === 'buy' ? 'Bought' : 'Sold';
                toast.success(`${activeTab === 'buy' ? 'Buy' : 'Sell'} order successful!`);

                // Trigger celebratory confetti
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: [activeTab === 'buy' ? '#02c076' : '#f6465d', '#f0b90b', '#ffffff']
                });

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
                                        <div style={{ fontSize: '2.25rem', fontWeight: 800 }}>
                                            <Counter value={coin?.current_price} prefix="$" decimals={coin?.current_price < 1 ? 6 : 2} />
                                        </div>
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

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                            <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-tertiary)', padding: '4px', borderRadius: '10px', width: 'fit-content' }}>
                                {['1h', '24h', '7d', '1m', '1y'].map(tf => (
                                    <button
                                        key={tf}
                                        className={`btn btn-sm ${timeframe === tf ? 'btn-primary' : ''}`}
                                        style={{
                                            borderRadius: '8px', minWidth: '50px',
                                            background: timeframe === tf ? 'var(--accent-primary)' : 'transparent',
                                            color: timeframe === tf ? 'black' : 'var(--text-secondary)', border: 'none'
                                        }}
                                        onClick={() => fetchChartData(tf)}
                                        disabled={showSkeleton}
                                    >
                                        {tf.toUpperCase()}
                                    </button>
                                ))}
                            </div>

                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)' }}>COMPARE:</span>
                                <select
                                    onChange={(e) => setComparisonCoin(e.target.value)}
                                    style={{
                                        background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)',
                                        color: 'white', padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', outline: 'none'
                                    }}
                                >
                                    <option value="">None</option>
                                    <option value="bitcoin">Bitcoin</option>
                                    <option value="ethereum">Ethereum</option>
                                    <option value="solana">Solana</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ height: '500px', width: '100%' }} className="chart-container-wrapper">
                            {showSkeleton ? (
                                <Skeleton width="100%" height="100%" />
                            ) : (
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={`${timeframe}-${comparisonCoin}`}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        style={{ height: '100%' }}
                                    >
                                        {chartData ? (
                                            <AdvancedChart
                                                key={`${coinId}-${timeframe}-${comparisonCoin}`}
                                                data={chartData}
                                                volumeData={volumeData}
                                                markers={tradeMarkers}
                                                comparisonCoinId={comparisonCoin}
                                                colors={{
                                                    lineColor: coin?.price_change_percentage_24h >= 0 ? '#02c076' : '#f6465d',
                                                    areaTopColor: coin?.price_change_percentage_24h >= 0 ? 'rgba(2, 192, 118, 0.2)' : 'rgba(246, 70, 93, 0.2)',
                                                    areaBottomColor: 'rgba(0, 0, 0, 0)',
                                                    textColor: 'var(--text-secondary)'
                                                }}
                                            />
                                        ) : (
                                            <div className="loading">Loading Chart Data...</div>
                                        )}
                                    </motion.div>
                                </AnimatePresence>
                            )}
                        </div>
                    </motion.div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 280px', gap: '1.5rem', marginTop: '1.5rem' }}>
                        <motion.div variants={itemVariants}>
                            <div className="card" style={{ padding: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                                    <div style={{ padding: '8px', background: 'rgba(243, 186, 47, 0.1)', borderRadius: '8px', color: '#f3ba2f' }}>
                                        <Activity size={20} />
                                    </div>
                                    <h3 style={{ margin: 0, fontWeight: 800 }}>Market Sentiment</h3>
                                </div>
                                <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                                    <div style={{ flex: 1, minWidth: '150px' }}>
                                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px' }}>FEAR & GREED</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                            <div style={{ fontSize: '2.5rem', fontWeight: 900 }}>{sentiment?.fearGreed || '--'}</div>
                                            <div style={{
                                                padding: '4px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800,
                                                background: sentiment?.fearGreed > 50 ? 'rgba(2,192,118,0.1)' : 'rgba(246,70,93,0.1)',
                                                color: sentiment?.fearGreed > 50 ? '#02c076' : '#f6465d'
                                            }}>{sentiment?.label?.toUpperCase()}</div>
                                        </div>
                                    </div>
                                    <div style={{ flex: 1, minWidth: '150px' }}>
                                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px' }}>WHALE POSITIONING</div>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{sentiment?.whaleActivity || '--'}</div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div variants={itemVariants}>
                            <div className="card" style={{ padding: '1.5rem', height: '100%' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                                    <div style={{ padding: '8px', background: 'rgba(243, 186, 47, 0.1)', borderRadius: '8px', color: '#f3ba2f' }}>
                                        <Clock size={20} />
                                    </div>
                                    <h3 style={{ margin: 0, fontWeight: 800 }}>Whale Tracker</h3>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {whales.map(whale => (
                                        <div key={whale.id} style={{ fontSize: '0.8rem', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                                                <span style={{ fontWeight: 800, color: 'var(--accent-primary)' }}>{whale.coin} ALERT</span>
                                                <span style={{ color: 'var(--text-muted)' }}>{whale.time}</span>
                                            </div>
                                            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem' }}>
                                                {whale.amount} {whale.coin} moved from {whale.from} to {whale.to}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Sidebar Trading Panel */}
                <motion.div style={{ position: 'sticky', top: '100px' }} variants={itemVariants}>
                    <div className="card" style={{
                        padding: '2rem',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '24px',
                        boxShadow: 'var(--shadow-lg)'
                    }}>
                        {/* Buy/Sell Toggles */}
                        <div style={{
                            display: 'flex',
                            background: 'var(--bg-tertiary)',
                            padding: '4px',
                            borderRadius: '12px',
                            marginBottom: '2rem',
                            border: '1px solid var(--border-color)'
                        }}>
                            <button
                                className="btn"
                                style={{
                                    flex: 1,
                                    borderRadius: '10px',
                                    background: activeTab === 'buy' ? 'var(--success-color)' : 'transparent',
                                    color: activeTab === 'buy' ? 'white' : 'var(--text-secondary)',
                                    height: '40px',
                                    fontSize: '0.9rem',
                                    fontWeight: 800,
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                                }}
                                onClick={() => setActiveTab('buy')}
                                disabled={showSkeleton}
                            >
                                BUY
                            </button>
                            <button
                                className="btn"
                                style={{
                                    flex: 1,
                                    borderRadius: '10px',
                                    background: activeTab === 'sell' ? 'var(--danger-color)' : 'transparent',
                                    color: activeTab === 'sell' ? 'white' : 'var(--text-secondary)',
                                    height: '40px',
                                    fontSize: '0.9rem',
                                    fontWeight: 800,
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                                }}
                                onClick={() => setActiveTab('sell')}
                                disabled={showSkeleton}
                            >
                                SELL
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
                                {/* Order Type Toggles */}
                                <div style={{ display: 'flex', gap: '10px', marginBottom: '0.5rem' }}>
                                    {['market', 'limit'].map(type => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => setOrderType(type)}
                                            style={{
                                                flex: 1,
                                                padding: '8px',
                                                borderRadius: '8px',
                                                border: '1px solid',
                                                borderColor: orderType === type ? 'var(--accent-primary)' : 'var(--border-color)',
                                                cursor: 'pointer',
                                                fontSize: '0.75rem',
                                                fontWeight: 800,
                                                background: orderType === type ? 'rgba(240, 185, 11, 0.1)' : 'transparent',
                                                color: orderType === type ? 'var(--accent-primary)' : 'var(--text-muted)',
                                                textTransform: 'uppercase',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            {type} Order
                                        </button>
                                    ))}
                                </div>

                                {/* Available Balance */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Available Balance</span>
                                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                                        ${user.wallet ? formatPrice(user.wallet) : '0.00'}
                                    </span>
                                </div>

                                {/* Limit Price Input */}
                                {orderType === 'limit' && (
                                    <div className="form-group" style={{ margin: 0 }}>
                                        <div style={{ position: 'relative' }}>
                                            <input
                                                type="number"
                                                className="form-control"
                                                style={{
                                                    height: '56px',
                                                    fontSize: '1rem',
                                                    fontWeight: 600,
                                                    borderRadius: '14px',
                                                    background: 'var(--bg-tertiary)',
                                                    border: '1px solid var(--border-color)',
                                                    paddingLeft: '1.25rem'
                                                }}
                                                placeholder="Target Price"
                                                value={limitPrice}
                                                onChange={(e) => setLimitPrice(e.target.value)}
                                                required
                                            />
                                            <span style={{ position: 'absolute', right: '1.25rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.8rem' }}>USD</span>
                                        </div>
                                    </div>
                                )}

                                {/* Quantity Input */}
                                <div className="form-group" style={{ margin: 0 }}>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type="number"
                                            className="form-control"
                                            style={{
                                                height: '64px',
                                                paddingRight: '4rem',
                                                paddingLeft: '1.25rem',
                                                fontSize: '1.5rem',
                                                fontWeight: 800,
                                                borderRadius: '16px',
                                                background: 'var(--bg-tertiary)',
                                                border: '1px solid var(--border-color)',
                                                color: 'var(--text-primary)'
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
                                            fontSize: '1rem'
                                        }}>
                                            {coin?.symbol?.toUpperCase()}
                                        </span>
                                    </div>
                                </div>

                                {/* Summary Box */}
                                <div style={{
                                    padding: '1.25rem',
                                    borderRadius: '16px',
                                    // background: 'var(--bg-tertiary)', 
                                    border: '1px solid var(--border-color)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.75rem'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>
                                        <span>Reference Price</span>
                                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>${formatPrice(orderType === 'limit' && limitPrice ? limitPrice : coin?.current_price)}</span>
                                    </div>
                                    <div style={{ width: '100%', height: '1px', background: 'var(--border-color)' }}></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Total Value</span>
                                        <span style={{ fontSize: '1.4rem', fontWeight: 800, color: activeTab === 'buy' ? 'var(--success-color)' : 'var(--danger-color)' }}>
                                            ${estimatedTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    className={`btn btn-lg`}
                                    style={{
                                        width: '100%',
                                        height: '56px',
                                        borderRadius: '14px',
                                        fontSize: '1.1rem',
                                        fontWeight: 800,
                                        background: activeTab === 'buy' ? 'var(--success-color)' : 'var(--danger-color)',
                                        color: '#ffffff',
                                        boxShadow: activeTab === 'buy' ? '0 8px 20px rgba(2, 192, 118, 0.3)' : '0 8px 20px rgba(246, 70, 93, 0.3)',
                                        border: 'none',
                                        marginTop: '0.5rem'
                                    }}
                                >
                                    {activeTab === 'buy' ? 'Buy' : 'Sell'} {coin?.symbol?.toUpperCase()}
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
            </div >
        </motion.div >
    );
};

export default CryptoDetail;
