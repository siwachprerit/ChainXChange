import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchUser = async () => {
        try {
            const { data } = await axios.get('/api/auth/profile');
            if (data.success) {
                setUser(data.user);
            }
        } catch (err) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();
    }, []);

    const login = async (username, password) => {
        const { data } = await axios.post('/api/auth/login', { username, password });
        if (data.success) {
            setUser(data.user);
        }
        return data;
    };

    const logout = async () => {
        await axios.get('/api/auth/logout');
        setUser(null);
    };

    const signup = async (username, email, password) => {
        const { data } = await axios.post('/api/auth/signup', { username, email, password });
        if (data.success) {
            setUser(data.user);
        }
        return data;
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, signup, refreshUser: fetchUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
