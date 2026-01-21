import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Link as HomeIcon, ChartPie, User as UserIcon, LogOut, UserPlus, LogIn, Sun, Moon } from 'lucide-react';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

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
                        <Link to="/" className="logo">
                            <HomeIcon size={24} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                            ChainXchange
                        </Link>
                    </div>
                    <ul className="nav-menu">
                        <li className="nav-item">
                            <Link to="/" className="nav-link">
                                <HomeIcon size={18} style={{ marginRight: '4px' }} /> Markets
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
