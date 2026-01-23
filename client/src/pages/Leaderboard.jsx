import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trophy, Medal, Star, Target, Zap, Shield, TrendingUp, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import Counter from '../components/Counter';

import { useAuth } from '../context/AuthContext';

const Leaderboard = () => {
    const { user } = useAuth();
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                // Direct URL to avoid generic proxy issues, using the environment or defaulting to localhost:8000
                const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:8000' : '';
                const res = await axios.get(`${baseUrl}/api/leaderboard`);

                // 1. If API returns valid leaderboard with users, use it.
                if (res.data.success && Array.isArray(res.data.leaderboard) && res.data.leaderboard.length > 0) {
                    let fullList = res.data.leaderboard;

                    // Ensure current user is in the list if they exist
                    if (user && !fullList.find(u => u.username === user.username)) {
                        fullList.push({
                            username: user.username,
                            totalValue: user.wallet || 0,
                            achievementsCount: user.achievements?.length || 0
                        });
                        // Re-sort descending
                        fullList.sort((a, b) => b.totalValue - a.totalValue);
                    }

                    setLeaderboard(fullList);
                    return;
                }

                // 2. No users found in DB? Fallback to Current User so table isn't empty.
                if (user) {
                    setLeaderboard([{
                        username: user.username,
                        totalValue: user.wallet || 0,
                        achievementsCount: user.achievements?.length || 0
                    }]);
                }
            } catch (err) {
                console.error('Error fetching leaderboard:', err);

                // 3. Error Fallback: Real user data only.
                if (user) {
                    setLeaderboard([{
                        username: user.username,
                        totalValue: user.wallet || 0,
                        achievementsCount: user.achievements?.length || 0
                    }]);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();
    }, [user]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -20 },
        visible: { opacity: 1, x: 0 }
    };

    return (
        <div className="container" style={{ paddingBottom: '4rem' }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ marginBottom: '4rem', marginTop: '2rem' }}
            >
                <h1 style={{
                    fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
                    fontWeight: 900,
                    letterSpacing: '-0.05em',
                    lineHeight: 1,
                    marginBottom: '1rem'
                }}>
                    Trader <br />
                    <span className="text-gradient">Hall of Fame</span>
                </h1>
                <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                    Ranking the top-performing traders across the ecosystem based on total net worth.
                </p>
            </motion.div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="card"
                    style={{ padding: '0' }}
                >
                    <div style={{ padding: '2rem', borderBottom: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Trophy size={24} style={{ color: 'var(--accent-primary)' }} />
                            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Top Traders</h2>
                        </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table className="table" style={{ margin: 0 }}>
                            <thead>
                                <tr>
                                    <th style={{ paddingLeft: '2rem', width: '80px' }}>Rank</th>
                                    <th>Trader</th>
                                    <th className="numeric-cell">Portfolio Value</th>
                                    <th className="numeric-cell mobile-hide">Achievements</th>
                                    <th style={{ width: '100px' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    Array(5).fill(0).map((_, i) => (
                                        <tr key={i}>
                                            <td style={{ paddingLeft: '2rem' }}><div className="skeleton" style={{ width: '30px', height: '20px' }}></div></td>
                                            <td><div className="skeleton" style={{ width: '120px', height: '20px' }}></div></td>
                                            <td className="numeric-cell"><div className="skeleton" style={{ width: '80px', height: '20px', marginLeft: 'auto' }}></div></td>
                                            <td className="numeric-cell mobile-hide"><div className="skeleton" style={{ width: '40px', height: '20px', marginLeft: 'auto' }}></div></td>
                                            <td></td>
                                        </tr>
                                    ))
                                ) : leaderboard.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                            No traders found in the database.
                                        </td>
                                    </tr>
                                ) : (
                                    leaderboard.map((trader, index) => (
                                        <motion.tr
                                            key={trader.username || index}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            style={{ background: index === 0 ? 'rgba(243, 186, 47, 0.03)' : 'transparent' }}
                                        >
                                            <td style={{ paddingLeft: '2rem' }}>
                                                {index === 0 && <Trophy size={20} style={{ color: '#f3ba2f' }} />}
                                                {index === 1 && <Medal size={20} style={{ color: '#d1d1d1' }} />}
                                                {index === 2 && <Medal size={20} style={{ color: '#cd7f32' }} />}
                                                {index > 2 && <span style={{ fontWeight: 800, opacity: 0.5 }}>#{index + 1}</span>}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{
                                                        width: '40px',
                                                        height: '40px',
                                                        borderRadius: '50%',
                                                        background: 'var(--bg-tertiary)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontWeight: 900,
                                                        color: 'var(--accent-primary)',
                                                        fontSize: '0.9rem',
                                                        border: index === 0 ? '2px solid #f3ba2f' : '1px solid var(--border-color)'
                                                    }}>
                                                        {trader.username.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <span style={{ fontWeight: 700 }}>{trader.username}</span>
                                                </div>
                                            </td>
                                            <td className="numeric-cell" style={{ fontWeight: 800, fontSize: '1.1rem' }}>
                                                <Counter value={trader.totalValue} prefix="$" />
                                            </td>
                                            <td className="numeric-cell mobile-hide" style={{ fontWeight: 700 }}>
                                                {trader.achievementsCount} 🎖️
                                            </td>
                                            <td style={{ textAlign: 'right', paddingRight: '2rem' }}>
                                                <div style={{ padding: '4px 12px', borderRadius: '100px', background: 'rgba(2, 192, 118, 0.1)', color: '#02c076', fontSize: '0.7rem', fontWeight: 800, display: 'inline-block' }}>
                                                    ACTIVE
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="card"
                        style={{ padding: '2rem', background: 'var(--gradient-primary)', color: 'black' }}
                    >
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '1rem' }}>Global Stats</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div>
                                <div style={{ fontSize: '0.8rem', fontWeight: 800, opacity: 0.7, letterSpacing: '0.1em' }}>TOTAL TRADERS</div>
                                <div style={{ fontSize: '2rem', fontWeight: 900 }}>12,482</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.8rem', fontWeight: 800, opacity: 0.7, letterSpacing: '0.1em' }}>24H VOLUME</div>
                                <div style={{ fontSize: '2rem', fontWeight: 900 }}>$1.4B</div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="card"
                        style={{ padding: '2rem' }}
                    >
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem' }}>Achievement Badges</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                            {[
                                { icon: <Star />, color: '#f3ba2f', label: 'Whale' },
                                { icon: <Target />, color: '#e84142', label: 'Sniper' },
                                { icon: <Zap />, color: '#3498db', label: 'Fast' },
                                { icon: <Shield />, color: '#02c076', label: 'Secure' },
                                { icon: <TrendingUp />, color: '#9b59b6', label: 'Bull' },
                                { icon: <Users />, color: '#f1c40f', label: 'Social' }
                            ].map((badge, i) => (
                                <div key={i} style={{ textAlign: 'center' }}>
                                    <div style={{
                                        width: '60px',
                                        height: '60px',
                                        borderRadius: '16px',
                                        background: 'var(--bg-tertiary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: badge.color,
                                        margin: '0 auto 8px',
                                        border: '1px solid var(--border-color)'
                                    }}>
                                        {badge.icon}
                                    </div>
                                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-secondary)' }}>{badge.label}</div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default Leaderboard;
