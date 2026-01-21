import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Link as LogoIcon, ChartPie, User as UserIcon, LogOut, UserPlus, LogIn, Sun, Moon, Wallet, History, Bell, Check, Trash2, LayoutGrid } from 'lucide-react';

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
            <nav>
                <div className="navbar-container">
                    <div className="navbar-brand">
                        <Link to="/" className="logo" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ background: 'var(--gradient-primary)', borderRadius: '8px', padding: '6px', display: 'flex' }}>
                                <LogoIcon size={20} style={{ color: 'black' }} />
                            </div>
                            <span style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>ChainXChange</span>
                        </Link>
                    </div>
                    <ul className="nav-menu">
                        <li className="nav-item">
                            <Link to="/" className="nav-link">
                                <LayoutGrid size={18} style={{ marginRight: '6px' }} /> Markets
                            </Link>
                        </li>
                        {user ? (
                            <>
                                <li className="nav-item">
                                    <Link to="/portfolio" className="nav-link">
                                        <ChartPie size={18} style={{ marginRight: '4px' }} /> Portfolio
                                    </Link>
                                </li>
                                <li className="nav-item">
                                    <Link to="/wallet" className="nav-link">
                                        <Wallet size={18} style={{ marginRight: '4px' }} /> Wallet
                                    </Link>
                                </li>
                                <li className="nav-item">
                                    <Link to="/history" className="nav-link">
                                        <History size={18} style={{ marginRight: '4px' }} /> History
                                    </Link>
                                </li>
                                <li className="nav-item">
                                    <Link to="/profile" className="nav-link">
                                        <UserIcon size={18} style={{ marginRight: '4px' }} /> Profile
                                    </Link>
                                </li>
                                <li className="nav-item">
                                    <button onClick={handleLogout} className="nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }}>
                                        <LogOut size={18} style={{ marginRight: '4px' }} /> Logout
                                    </button>
                                </li>
                            </>
                        ) : (
                            <>
                                <li className="nav-item">
                                    <Link to="/signup" className="nav-link">
                                        <UserPlus size={18} style={{ marginRight: '4px' }} /> Register
                                    </Link>
                                </li>
                                <li className="nav-item">
                                    <Link to="/login" className="nav-link">
                                        <LogIn size={18} style={{ marginRight: '4px' }} /> Login
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

                                {showNotifications && (
                                    <div className="notification-dropdown">
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
                                    </div>
                                )}
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
