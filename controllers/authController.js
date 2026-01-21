const bcrypt = require('bcrypt');
const User = require('../models/User');
const Transaction = require('../models/Transaction'); // Import Transaction model

/**
 * Authentication Controller
 * Handles user registration, login, logout, and profile management
 */
class AuthController {
    /**
     * Display signup page
     */
    static showSignup(req, res) {
        res.json({ success: true, message: 'Ready for signup' });
    }

    /**
     * Handle user registration
     */
    static async signup(req, res) {
        const { username, email, password } = req.body;

        try {
            // Validate input
            if (!username || !email || !password) {
                return res.status(400).json({
                    success: false,
                    error: 'All fields are required.'
                });
            }

            // Check if user already exists
            const existingUser = await User.findOne({
                $or: [{ username }, { email }]
            });

            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    error: 'Username or email already exists.'
                });
            }

            // Hash password and create user
            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = new User({
                username,
                email,
                password: hashedPassword,
                wallet: 0 // Starting wallet amount
            });

            const savedUser = await newUser.save();

            // Set authentication cookie
            res.cookie('user', savedUser._id, {
                httpOnly: true,
                maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
            });

            res.status(201).json({ success: true, user: { id: savedUser._id, username: savedUser.username, email: savedUser.email } });
        } catch (error) {
            console.error('Signup error:', error);
            res.status(500).json({ success: false, error: 'An error occurred during signup.' });
        }
    }

    /**
     * Display login page
     */
    static showLogin(req, res) {
        res.json({ success: true, message: 'Ready for login' });
    }

    /**
     * Handle user login
     */
    static async login(req, res) {
        const { username, password } = req.body;

        try {
            // Validate input
            if (!username || !password) {
                return res.status(400).json({
                    success: false,
                    error: 'Username and password are required.'
                });
            }

            // Find user and verify password
            const user = await User.findOne({ username });
            if (!user || !(await bcrypt.compare(password, user.password))) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid username or password.'
                });
            }

            // Set authentication cookie
            res.cookie('user', user._id, {
                httpOnly: true,
                maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
            });

            res.json({ success: true, user: { id: user._id, username: user.username, email: user.email } });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ success: false, error: 'Login Error: ' + error.message });
        }
    }

    /**
     * Handle user logout
     */
    static logout(req, res) {
        res.clearCookie('user');
        res.json({ success: true, message: 'Logged out successfully' });
    }

    /**
     * Display user profile
     */
    static async showProfile(req, res) {
        try {
            const userId = req.cookies.user;
            const user = await User.findById(userId).lean();

            if (!user) {
                return res.redirect('/auth/login');
            }

            // --- Start: Added Logic from cryptoController.showHistory ---

            // Fetch all transactions for the user, sorted newest first
            const transactions = await Transaction.find({ userId })
                .sort({ timestamp: -1 })
                .limit(10) // Limit to the 10 most recent for the profile page
                .lean();

            // Format transactions for easier display in the view
            const formattedTransactions = transactions.map(tx => {
                const date = new Date(tx.timestamp);
                // Format as DD/MM/YYYY
                const formattedDate = date.toLocaleDateString('en-GB');
                // Format as 02:45 PM
                const formattedTime = date.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                });

                return {
                    ...tx,
                    coinName: tx.coinId.charAt(0).toUpperCase() + tx.coinId.slice(1),
                    totalValue: tx.totalCost || tx.sellValue || (tx.quantity * tx.price),
                    isBuy: tx.type === 'buy',
                    // Add the pre-formatted timestamp string
                    formattedTimestamp: `${formattedDate} ${formattedTime}`
                };
            });

            // --- End: Added Logic ---

            res.json({
                success: true,
                user: user,
                transactions: formattedTransactions
            });
        } catch (error) {
            console.error('Profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Error loading profile',
                error: process.env.NODE_ENV === 'development' ? error.message : null
            });
        }
    }
}

module.exports = AuthController;