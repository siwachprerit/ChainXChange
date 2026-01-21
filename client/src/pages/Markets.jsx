import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';

const Markets = () => {
    const [coins, setCoins] = useState([]);
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
        fetchMarkets();
        const interval = setInterval(fetchMarkets, 30000);
        return () => clearInterval(interval);
    }, []);

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

    if (loading && coins.length === 0) return <div className="loading"><div className="spinner"></div>Loading Markets...</div>;

    return (
        <div className="container">
            <div className="page-header">
                <h1 className="page-title">Cryptocurrency Markets</h1>
                <p className="page-subtitle">Track, analyze and trade over 100+ cryptocurrencies with real-time data.</p>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <div className="table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Name</th>
                            <th className="numeric-cell">Price</th>
                            <th style={{ textAlign: 'center' }}>24h Change</th>
                            <th className="numeric-cell">Market Cap</th>
                            <th className="numeric-cell">Volume</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(coins || []).map((coin, index) => (
                            <tr key={coin.id}>
                                <td>{index + 1}</td>
                                <td>
                                    <Link to={`/crypto/${coin.id}`} className="crypto-name" style={{ textDecoration: 'none', color: 'inherit' }}>
                                        <img src={coin.image} alt={coin.name} className="crypto-icon" />
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{coin.name}</div>
                                            <div className="crypto-symbol">{coin.symbol?.toUpperCase()}</div>
                                        </div>
                                    </Link>
                                </td>
                                <td className="price-cell">${formatPrice(coin.current_price)}</td>
                                <td className={`change-cell ${coin.price_change_percentage_24h >= 0 ? 'change-positive' : 'change-negative'}`}>
                                    {coin.price_change_percentage_24h?.toFixed(2)}%
                                </td>
                                <td className="numeric-cell">${formatNumber(coin.market_cap)}</td>
                                <td className="numeric-cell">${formatNumber(coin.total_volume)}</td>
                                <td>
                                    <Link to={`/crypto/${coin.id}`} className="btn btn-primary btn-sm">
                                        Trade
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Markets;
