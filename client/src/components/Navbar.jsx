import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Link as LogoIcon, ChartPie, User as UserIcon, LogOut, UserPlus, LogIn, Sun, Moon, Wallet, History, Bell, Check, Trash2, LayoutGrid, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
    const { user, logout } = useAuth();
    const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = useNotifications();
    const navigate = useNavigate();
    const [showNotifications, setShowNotifications] = React.useState(false);
    const notificationRef = React.useRef(null);

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    // Close notifications when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Initialize theme from localStorage
    React.useEffect(() => {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.body.setAttribute('data-theme', savedTheme);
    }, []);

    const toggleTheme = () => {
        const currentTheme = document.body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    };

    return (
        <header>
            <nav style={{ background: 'var(--glass-bg)', borderBottom: '1px solid var(--border-color)', backdropFilter: 'blur(20px)' }}>
                <div className="navbar-container">
                    <div className="navbar-brand">
                        <Link to="/" className="logo" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                                background: 'var(--gradient-primary)',
                                width: '40px',
                                height: '40px',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 8px 16px rgba(240, 185, 11, 0.2)'
                            }}>
                                <LogoIcon size={24} style={{ color: 'black' }} />
                            </div>
                            <span style={{
                                fontSize: '1.5rem',
                                fontWeight: 900,
                                letterSpacing: '-0.05em',
                                color: 'var(--text-primary)',
                                fontFamily: "'Titillium Web', sans-serif"
                            }}>
                                CHAINXCHANGE
                            </span>
                        </Link>
                    </div>

                    <ul className="nav-menu">
                        <li className="nav-item">
                            <Link to="/" className="nav-link" style={{ fontWeight: 700, fontSize: '0.9rem', letterSpacing: '0.05em' }}>
                                MARKETS
                            </Link>
                        </li>
                        {/* <li className="nav-item">
                            <Link to="/about" className="nav-link" style={{ fontWeight: 700, fontSize: '0.9rem', letterSpacing: '0.05em' }}>
                                ABOUT
                            </Link>
                        </li> */}
                        {user ? (
                            <>
                                <li className="nav-item">
                                    <Link to="/portfolio" className="nav-link" style={{ fontWeight: 700, fontSize: '0.9rem' }}>PORTFOLIO</Link>
                                </li>
                                <li className="nav-item">
                                    <Link to="/wallet" className="nav-link" style={{ fontWeight: 700, fontSize: '0.9rem' }}>WALLET</Link>
                                </li>
                                <li className="nav-item">
                                    <Link to="/profile" className="nav-link" style={{ fontWeight: 700, fontSize: '0.9rem' }}>PROFILE</Link>
                                </li>
                                <li className="nav-item">
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleLogout}
                                        className="btn btn-secondary"
                                        style={{
                                            borderRadius: '100px',
                                            padding: '0.5rem 1.25rem',
                                            fontWeight: 800,
                                            fontSize: '0.8rem',
                                            background: 'var(--danger-bg)',
                                            color: 'var(--danger-color)',
                                            border: '1px solid rgba(246, 70, 93, 0.2)'
                                        }}
                                    >
                                        LOGOUT
                                    </motion.button>
                                </li>
                            </>
                        ) : (
                            <>
                                <li className="nav-item">
                                    <Link to="/signup" className="nav-link" style={{ fontWeight: 700, fontSize: '0.9rem' }}>REGISTER</Link>
                                </li>
                                <li className="nav-item">
                                    <Link to="/login" className="btn btn-primary" style={{ borderRadius: '100px', padding: '0.6rem 1.5rem', fontWeight: 800, fontSize: '0.8rem' }}>
                                        LOGIN
                                    </Link>
                                </li>
                            </>
                        )}
                        {user && (
                            <li className="nav-item" style={{ position: 'relative' }} ref={notificationRef}>
                                <button
                                    className="theme-toggle"
                                    onClick={() => setShowNotifications(!showNotifications)}
                                    aria-label="Notifications"
                                >
                                    <Bell size={20} className="theme-icon" />
                                    {unreadCount > 0 && <span className="notification-dot"></span>}
                                </button>

                                <AnimatePresence>
                                    {showNotifications && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="notification-dropdown"
                                        >
                                            <div className="notification-header">
                                                <h3>Notifications</h3>
                                                <div className="notification-actions">
                                                    <button onClick={markAllAsRead} title="Mark all as read">
                                                        <Check size={16} />
                                                    </button>
                                                    <button onClick={clearNotifications} title="Clear all">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="notification-list">
                                                {notifications.length === 0 ? (
                                                    <div className="notification-empty">No notifications</div>
                                                ) : (
                                                    notifications.map(n => (
                                                        <div
                                                            key={n.id}
                                                            className={`notification-item ${!n.read ? 'unread' : ''}`}
                                                            onClick={() => markAsRead(n.id)}
                                                        >
                                                            <div className="notification-msg">{n.message}</div>
                                                            <div className="notification-time">
                                                                {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </li>
                        )}
                        <li className="nav-item">
                            <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
                                <Sun className="theme-icon" size={20} />
                            </button>
                        </li>
                    </ul>
                </div>
            </nav>
        </header>
    );
};

export default Navbar;
