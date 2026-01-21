import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { ShoppingCart, Search, Star, Filter } from 'lucide-react';
import Skeleton from '../components/Skeleton';

const Markets = () => {
    const [coins, setCoins] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [watchlist, setWatchlist] = useState([]);
    const [showWatchlistOnly, setShowWatchlistOnly] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchMarkets = async () => {
        try {
            const { data } = await axios.get('/api/crypto');
            if (data.success) {
                setCoins(data.coins);
            }
        } catch (err) {
            setError('Failed to fetch market data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const savedWatchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
        setWatchlist(savedWatchlist);

        fetchMarkets();
        const interval = setInterval(fetchMarkets, 10000); // 10 seconds for more live feel
        return () => clearInterval(interval);
    }, []);

    const toggleWatchlist = (e, coinId) => {
        e.preventDefault();
        e.stopPropagation();
        let newWatchlist;
        if (watchlist.includes(coinId)) {
            newWatchlist = watchlist.filter(id => id !== coinId);
        } else {
            newWatchlist = [...watchlist, coinId];
        }
        setWatchlist(newWatchlist);
        localStorage.setItem('watchlist', JSON.stringify(newWatchlist));
    };

    const formatPrice = (price) => {
        if (price == null) return 'N/A';
        return price < 1 ? price.toFixed(6) : price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const formatNumber = (num) => {
        if (!num) return '0';
        if (num >= 1000000000) return (num / 1000000000).toFixed(2) + 'B';
        if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(2) + 'K';
        return num.toString();
    };

    const isLoading = loading && coins.length === 0;

    const filteredCoins = (coins || []).filter(coin => {
        const name = coin.name || '';
        const symbol = coin.symbol || '';
        const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            symbol.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesWatchlist = showWatchlistOnly ? (watchlist || []).includes(coin.id) : true;
        return matchesSearch && matchesWatchlist;
    });

    return (
        <div className="container">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                    <h1 className="page-title">Cryptocurrency Markets</h1>
                    <p className="page-subtitle">Track, analyze and trade over 100+ cryptocurrencies with real-time data.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        className={`btn btn-sm ${showWatchlistOnly ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setShowWatchlistOnly(!showWatchlistOnly)}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                        <Star size={16} fill={showWatchlistOnly ? 'currentColor' : 'none'} /> Watchlist
                    </button>
                </div>
            </div>

            <div className="search-bar-container" style={{ margin: '2rem 0', position: 'relative', maxWidth: '600px' }}>
                <Search size={22} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                    type="text"
                    placeholder="Search over 100+ assets..."
                    className="form-control"
                    style={{
                        paddingLeft: '3.5rem',
                        height: '56px',
                        borderRadius: '16px',
                        fontSize: '1rem',
                        boxShadow: 'var(--shadow-sm)',
                        border: '1px solid var(--border-color)'
                    }}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <div className="table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th style={{ width: '40px' }}></th>
                            <th>Name</th>
                            <th className="numeric-cell">Price</th>
                            <th style={{ textAlign: 'center' }}>24h Change</th>
                            <th className="numeric-cell">Market Cap</th>
                            <th className="numeric-cell">Volume</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            // Render Skeletons
                            Array(10).fill(0).map((_, i) => (
                                <tr key={`skeleton-${i}`}>
                                    <td><Skeleton width="20px" /></td>
                                    <td><Skeleton width="20px" /></td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Skeleton width="32px" height="32px" borderRadius="50%" />
                                            <div>
                                                <Skeleton width="80px" />
                                                <Skeleton width="40px" height="12px" />
                                            </div>
                                        </div>
                                    </td>
                                    <td><Skeleton width="60px" className="numeric-cell" /></td>
                                    <td><Skeleton width="50px" style={{ margin: '0 auto' }} /></td>
                                    <td><Skeleton width="100px" className="numeric-cell" /></td>
                                    <td><Skeleton width="100px" className="numeric-cell" /></td>
                                    <td><Skeleton width="60px" height="30px" borderRadius="8px" /></td>
                                </tr>
                            ))
                        ) : (
                            (filteredCoins || []).map((coin, index) => (
                                <tr key={coin.id}>
                                    <td>{index + 1}</td>
                                    <td>
                                        <button
                                            onClick={(e) => toggleWatchlist(e, coin.id)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: watchlist.includes(coin.id) ? '#f3ba2f' : 'var(--text-muted)' }}
                                        >
                                            <Star size={18} fill={watchlist.includes(coin.id) ? '#f3ba2f' : 'none'} />
                                        </button>
                                    </td>
                                    <td style={{ padding: '1.25rem 1.5rem' }}>
                                        <Link to={`/crypto/${coin.id}`} className="crypto-name" style={{ textDecoration: 'none', color: 'inherit' }}>
                                            <img src={coin.image} alt={coin.name} className="crypto-icon" style={{ width: '40px', height: '40px' }} />
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: '1rem' }}>{coin.name}</div>
                                                <div className="crypto-symbol" style={{ fontWeight: 500, opacity: 0.8 }}>{coin.symbol?.toUpperCase()}</div>
                                            </div>
                                        </Link>
                                    </td>
                                    <td className="price-cell" style={{ fontWeight: 700, fontSize: '1rem' }}>${formatPrice(coin.current_price)}</td>
                                    <td className={`change-cell ${coin.price_change_percentage_24h >= 0 ? 'change-positive' : 'change-negative'}`} style={{ fontWeight: 700 }}>
                                        {coin.price_change_percentage_24h >= 0 ? '+' : ''}{coin.price_change_percentage_24h?.toFixed(2)}%
                                    </td>
                                    <td className="numeric-cell" style={{ fontWeight: 500 }}>${formatNumber(coin.market_cap)}</td>
                                    <td className="numeric-cell" style={{ fontWeight: 500 }}>${formatNumber(coin.total_volume)}</td>
                                    <td style={{ textAlign: 'right' }}>
                                        <Link to={`/crypto/${coin.id}`} className="btn btn-primary btn-sm" style={{ borderRadius: '10px', padding: '0.6rem 1.25rem' }}>
                                            Trade
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                {!isLoading && filteredCoins.length === 0 && coins.length > 0 && (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                        <Search size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                        <p>No coins found matching "{searchTerm}"</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Markets;
