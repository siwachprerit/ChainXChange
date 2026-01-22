import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { ShoppingCart, Search, Star, Filter, TrendingUp, ChevronRight, Plus, Edit2, Trash2, MoreVertical, Check } from 'lucide-react';
import Skeleton from '../components/Skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const Markets = () => {
    const [coins, setCoins] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [watchlists, setWatchlists] = useState([]);
    const [activeWatchlistId, setActiveWatchlistId] = useState(null);
    const [showWatchlistOnly, setShowWatchlistOnly] = useState(false);
    const [isEditingWatchlist, setIsEditingWatchlist] = useState(false);
    const [newWatchlistName, setNewWatchlistName] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Custom UI States for Watchlist Actions
    const [modalType, setModalType] = useState(null); // 'create', 'rename', 'delete'
    const [watchlistActionId, setWatchlistActionId] = useState(null);
    const [tempName, setTempName] = useState('');

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
        // Migration and load logic
        const savedWatchlists = JSON.parse(localStorage.getItem('multi_watchlists'));
        const legacyWatchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');

        if (savedWatchlists && savedWatchlists.length > 0) {
            setWatchlists(savedWatchlists);
            setActiveWatchlistId(savedWatchlists[0].id);
        } else {
            const initialWatchlist = [
                { id: 'default', name: 'Main List', coins: legacyWatchlist }
            ];
            setWatchlists(initialWatchlist);
            setActiveWatchlistId('default');
            localStorage.setItem('multi_watchlists', JSON.stringify(initialWatchlist));
        }

        fetchMarkets();
        const interval = setInterval(fetchMarkets, 10000);
        return () => clearInterval(interval);
    }, []);

    const saveWatchlists = (updated) => {
        setWatchlists(updated);
        localStorage.setItem('multi_watchlists', JSON.stringify(updated));
    };

    const createWatchlist = () => {
        if (!tempName.trim()) return;
        const newList = {
            id: Date.now().toString(),
            name: tempName,
            coins: []
        };
        const updated = [...watchlists, newList];
        saveWatchlists(updated);
        setActiveWatchlistId(newList.id);
        setModalType(null);
        setTempName('');
        toast.success(`Watchlist "${newList.name}" created!`);
    };

    const confirmDeleteWatchlist = () => {
        if (watchlists.length <= 1) {
            toast.error('You must have at least one watchlist.');
            setModalType(null);
            return;
        }
        const updated = watchlists.filter(w => w.id !== watchlistActionId);
        saveWatchlists(updated);
        if (activeWatchlistId === watchlistActionId) setActiveWatchlistId(updated[0].id);
        setModalType(null);
        setWatchlistActionId(null);
    };

    const confirmRenameWatchlist = () => {
        if (!tempName.trim()) return;
        const updated = watchlists.map(w => w.id === watchlistActionId ? { ...w, name: tempName } : w);
        saveWatchlists(updated);
        setModalType(null);
        setTempName('');
        setWatchlistActionId(null);
        toast.success('Watchlist renamed successfully');
    };

    const toggleWatchlist = (e, coinId) => {
        e.preventDefault();
        e.stopPropagation();

        const updated = watchlists.map(w => {
            if (w.id === activeWatchlistId) {
                const alreadyHas = w.coins.includes(coinId);
                return {
                    ...w,
                    coins: alreadyHas ? w.coins.filter(id => id !== coinId) : [...w.coins, coinId]
                };
            }
            return w;
        });
        saveWatchlists(updated);
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

    const activeWatchlist = watchlists.find(w => w.id === activeWatchlistId) || { coins: [] };

    const filteredCoins = (coins || []).filter(coin => {
        const name = coin.name || '';
        const symbol = coin.symbol || '';
        const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            symbol.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesWatchlist = showWatchlistOnly ? activeWatchlist.coins.includes(coin.id) : true;
        return matchesSearch && matchesWatchlist;
    });

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05
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
            {/* Bento Style Header */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(12, 1fr)',
                gap: '1.5rem',
                marginBottom: '4rem',
                marginTop: '1rem'
            }}>
                <motion.div
                    className="card"
                    variants={itemVariants}
                    style={{
                        gridColumn: 'span 8',
                        padding: '3rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)'
                    }}
                >
                    <h1 style={{
                        fontSize: 'clamp(2.5rem, 6vw, 4rem)',
                        fontWeight: 900,
                        letterSpacing: '-0.05em',
                        lineHeight: 1,
                        marginBottom: '1.5rem'
                    }}>
                        Global <br />
                        <span className="text-gradient" style={{ animation: 'shine 3s linear infinite', display: 'inline-block' }}>Realtime Markets</span>
                    </h1>
                    <p style={{ maxWidth: '450px', color: 'var(--text-secondary)', fontSize: '1.1rem', fontWeight: 500 }}>
                        Access high-liquidity digital assets with institution-grade precision. Track, analyze, and execute with zero friction.
                    </p>
                </motion.div>

                <motion.div
                    className="card"
                    variants={itemVariants}
                    style={{
                        gridColumn: 'span 4',
                        background: 'var(--gradient-primary)',
                        color: '#000',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        padding: '2rem',
                        position: 'relative',
                        overflow: 'visible'
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontWeight: 800, fontSize: '0.7rem', letterSpacing: '0.1em' }}>{activeWatchlist?.name?.toUpperCase() || 'WATCHLIST'}</div>
                        <Star size={20} fill="#000" />
                    </div>
                    <div style={{ fontSize: '3rem', fontWeight: 900, margin: '1rem 0' }}>{activeWatchlist.coins.length}</div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={() => setShowWatchlistOnly(!showWatchlistOnly)}
                            className="btn"
                            style={{
                                background: '#000',
                                color: '#fff',
                                flex: 1,
                                borderRadius: '12px',
                                fontWeight: 700,
                                fontSize: '0.8rem',
                                padding: '0.75rem'
                            }}
                        >
                            {showWatchlistOnly ? 'HIDE LIST' : 'VIEW LIST'}
                        </button>
                        <button
                            onClick={() => setModalType('create')}
                            className="btn"
                            style={{
                                background: 'rgba(0,0,0,0.1)',
                                color: '#000',
                                border: '1px solid #000',
                                borderRadius: '12px',
                                padding: '0.75rem'
                            }}
                        >
                            <Plus size={18} />
                        </button>
                    </div>
                </motion.div>
            </div>

            {/* Watchlist Management Hub */}
            <motion.div
                variants={itemVariants}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '2rem',
                    overflowX: 'auto',
                    paddingBottom: '0.5rem'
                }}
            >
                {watchlists.map(list => (
                    <div
                        key={list.id}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            background: activeWatchlistId === list.id ? 'var(--accent-primary)' : 'rgba(255,255,255,0.03)',
                            color: activeWatchlistId === list.id ? '#000' : 'var(--text-secondary)',
                            padding: '6px 12px',
                            borderRadius: '100px',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            border: '1px solid var(--border-color)',
                            transition: 'all 0.3s ease'
                        }}
                        onClick={() => setActiveWatchlistId(list.id)}
                    >
                        <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{list.name}</span>
                        {activeWatchlistId === list.id && (
                            <div style={{ display: 'flex', marginLeft: '10px', gap: '4px', borderLeft: '1px solid rgba(0,0,0,0.1)', paddingLeft: '8px' }}>
                                <Edit2 size={12} onClick={(e) => { e.stopPropagation(); setModalType('rename'); setWatchlistActionId(list.id); setTempName(list.name); }} />
                                <Trash2 size={12} onClick={(e) => { e.stopPropagation(); setModalType('delete'); setWatchlistActionId(list.id); }} />
                            </div>
                        )}
                    </div>
                ))}
            </motion.div>

            <motion.div
                className="search-bar-container"
                style={{ margin: '2rem 0', position: 'relative' }}
                variants={itemVariants}
            >
                <Search size={24} style={{ position: 'absolute', left: '1.5rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-primary)', zIndex: 10 }} />
                <input
                    type="text"
                    placeholder="Search the ecosystem..."
                    className="form-control"
                    style={{
                        paddingLeft: '4rem',
                        height: '72px',
                        borderRadius: '24px',
                        fontSize: '1.25rem',
                        fontWeight: 600,
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-primary)',
                        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </motion.div>

            {error && <motion.div className="alert alert-error" variants={itemVariants}>{error}</motion.div>}

            <motion.div className="table-container" variants={itemVariants}>
                <table className="table">
                    <thead>
                        <tr>
                            <th className="mobile-hide">#</th>
                            <th style={{ width: '40px' }}></th>
                            <th>Name</th>
                            <th className="numeric-cell">Price</th>
                            <th className="mobile-hide" style={{ textAlign: 'center' }}>24h Change</th>
                            <th className="mobile-hide numeric-cell">Market Cap</th>
                            <th className="mobile-hide numeric-cell">Volume</th>
                            <th style={{ textAlign: 'right' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        <AnimatePresence mode="popLayout">
                            {isLoading ? (
                                Array(10).fill(0).map((_, i) => (
                                    <tr key={`skeleton-${i}`}>
                                        <td className="mobile-hide"><Skeleton width="20px" /></td>
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
                                        <td className="mobile-hide"><Skeleton width="50px" style={{ margin: '0 auto' }} /></td>
                                        <td className="mobile-hide"><Skeleton width="100px" className="numeric-cell" /></td>
                                        <td className="mobile-hide"><Skeleton width="100px" className="numeric-cell" /></td>
                                        <td style={{ textAlign: 'right' }}><Skeleton width="60px" height="30px" borderRadius="8px" /></td>
                                    </tr>
                                ))
                            ) : (
                                (filteredCoins || []).map((coin, index) => (
                                    <motion.tr
                                        key={coin.id}
                                        layout
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <td className="mobile-hide">{index + 1}</td>
                                        <td>
                                            <motion.button
                                                whileHover={{ scale: 1.2 }}
                                                whileTap={{ scale: 0.8 }}
                                                onClick={(e) => toggleWatchlist(e, coin.id)}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: activeWatchlist.coins.includes(coin.id) ? '#f3ba2f' : 'var(--text-muted)' }}
                                            >
                                                <Star size={18} fill={activeWatchlist.coins.includes(coin.id) ? '#f3ba2f' : 'none'} />
                                            </motion.button>
                                        </td>
                                        <td style={{ padding: '1rem 0.5rem' }}>
                                            <Link to={`/crypto/${coin.id}`} className="crypto-name" style={{ textDecoration: 'none', color: 'inherit' }}>
                                                <img src={coin.image} alt={coin.name} className="crypto-icon" style={{ width: '32px', height: '32px' }} />
                                                <div style={{ minWidth: 0, flex: 1 }}>
                                                    <div style={{ fontWeight: 700, fontSize: '0.9rem', lineHeight: 1.2, wordBreak: 'break-word', whiteSpace: 'normal' }}>{coin.name}</div>
                                                    <div className="crypto-symbol" style={{ fontWeight: 500, opacity: 0.8, fontSize: '0.75rem' }}>{coin.symbol?.toUpperCase()}</div>
                                                </div>
                                            </Link>
                                        </td>
                                        <td className="price-cell" style={{ fontWeight: 700, fontSize: '0.9rem' }}>${formatPrice(coin.current_price)}</td>
                                        <td className={`mobile-hide change-cell ${coin.price_change_percentage_24h >= 0 ? 'change-positive' : 'change-negative'}`} style={{ fontWeight: 700 }}>
                                            {coin.price_change_percentage_24h >= 0 ? '+' : ''}{coin.price_change_percentage_24h?.toFixed(2)}%
                                        </td>
                                        <td className="mobile-hide numeric-cell" style={{ fontWeight: 500 }}>${formatNumber(coin.market_cap)}</td>
                                        <td className="mobile-hide numeric-cell" style={{ fontWeight: 500 }}>${formatNumber(coin.total_volume)}</td>
                                        <td style={{ textAlign: 'right' }}>
                                            <Link to={`/crypto/${coin.id}`} className="btn btn-primary btn-sm" style={{ borderRadius: '10px', padding: '0.5rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                Trade <ChevronRight size={14} />
                                            </Link>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </AnimatePresence>
                    </tbody>
                </table>
                {!isLoading && filteredCoins.length === 0 && coins.length > 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                        <Search size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                        <p>No coins found matching "{searchTerm}"</p>
                    </motion.div>
                )}
            </motion.div>
            {/* Custom Action Modals */}
            <AnimatePresence>
                {modalType && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(0,0,0,0.8)',
                            backdropFilter: 'blur(10px)',
                            zIndex: 2000,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '2rem'
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            style={{
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '24px',
                                padding: '2.5rem',
                                maxWidth: '450px',
                                width: '100%',
                                boxShadow: '0 24px 48px rgba(0,0,0,0.4)'
                            }}
                        >
                            {modalType === 'delete' ? (
                                <>
                                    <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '1rem', color: 'var(--danger-color)' }}>Delete Watchlist?</h2>
                                    <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.5 }}>
                                        This action cannot be undone. All assets in this watchlist will be removed from this custom view.
                                    </p>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <button
                                            onClick={() => setModalType(null)}
                                            className="btn btn-secondary"
                                            style={{ flex: 1, height: '54px', borderRadius: '12px', fontWeight: 700 }}
                                        >
                                            CANCEL
                                        </button>
                                        <button
                                            onClick={confirmDeleteWatchlist}
                                            className="btn btn-danger"
                                            style={{ flex: 1, height: '54px', borderRadius: '12px', fontWeight: 700, background: 'var(--danger-bg)', color: 'var(--danger-color)' }}
                                        >
                                            DELETE
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '1.5rem' }}>
                                        {modalType === 'create' ? 'Create New Watchlist' : 'Rename Watchlist'}
                                    </h2>
                                    <div style={{ marginBottom: '2rem' }}>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.1em', display: 'block', marginBottom: '0.75rem' }}>WATCHLIST NAME</label>
                                        <input
                                            type="text"
                                            value={tempName}
                                            onChange={(e) => setTempName(e.target.value)}
                                            placeholder="Enter name..."
                                            autoFocus
                                            className="form-control"
                                            style={{
                                                height: '60px',
                                                borderRadius: '16px',
                                                fontSize: '1.1rem',
                                                fontWeight: 600,
                                                background: 'rgba(255,255,255,0.03)',
                                                border: '1px solid var(--border-color)',
                                                padding: '0 1.5rem'
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    modalType === 'create' ? createWatchlist() : confirmRenameWatchlist();
                                                }
                                            }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <button
                                            onClick={() => { setModalType(null); setTempName(''); }}
                                            className="btn btn-secondary"
                                            style={{ flex: 1, height: '54px', borderRadius: '12px', fontWeight: 700 }}
                                        >
                                            CANCEL
                                        </button>
                                        <button
                                            onClick={modalType === 'create' ? createWatchlist : confirmRenameWatchlist}
                                            className="btn btn-primary"
                                            style={{ flex: 1, height: '54px', borderRadius: '12px', fontWeight: 700 }}
                                        >
                                            {modalType === 'create' ? 'CREATE' : 'SAVE'}
                                        </button>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default Markets;
