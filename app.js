const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const session = require('express-session');
const http = require('http');
const compression = require('compression');
const MongoStore = require('connect-mongo');
const cors = require('cors');

const authRoutes = require('./routes/auth.js');
const cryptoRoutes = require('./routes/crypto.js');
const paymentRoutes = require('./routes/payment.js');
const User = require('./models/User.js');
const { isAuthenticated } = require('./middleware/auth');
const HomeController = require('./controllers/homeController');
const CryptoController = require('./controllers/cryptoController');

dotenv.config();

const app = express();

// Middleware Setup
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET || 'your-secret-key'));
app.use(compression());

// Serve React static files from the 'client/dist' directory in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'client/dist')));
} else {
    // In development, we don't serve static files from here usually, 
    // but just in case public folder has assets
    app.use(express.static(path.join(__dirname, 'public')));
}

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/crypto-trading', {
    retryWrites: true,
    w: 'majority'
})
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

// Session Configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/crypto-trading',
        ttl: 24 * 60 * 60
    }),
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// User Authentication Middleware
app.use(async (req, res, next) => {
    if (req.cookies.user) {
        try {
            const user = await User.findById(req.cookies.user).lean();
            res.locals.user = user;
        } catch (error) {
            console.error('Error fetching user:', error);
            res.locals.user = null;
            res.clearCookie('user');
        }
    } else {
        res.locals.user = null;
    }
    next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/crypto', cryptoRoutes);
app.use('/api/payment', paymentRoutes);

// Main Application API Routes (for legacy compatibility or specific JSON endpoints)
app.get('/api', HomeController.showHome);
app.get('/api/portfolio', isAuthenticated, CryptoController.showPortfolio);
app.get('/api/profile', isAuthenticated, require('./controllers/authController').showProfile);

// Handle React routing, return all requests to React app in production
if (process.env.NODE_ENV === 'production') {
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'client/dist/index.html'));
    });
}

// Error Handling
app.use((req, res, next) => {
    // If not found and not an API route, send index.html (for client-side routing) 
    // BUT only in production. In dev, we just send 404 for API.
    if (process.env.NODE_ENV === 'production' && !req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, 'client/dist/index.html'));
    } else {
        res.status(404).json({
            success: false,
            message: 'API Endpoint Not Found'
        });
    }
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : null
    });
});

const PORT = process.env.PORT || 8000;
// Note: server.listen is used instead of app.listen because we might re-add Socket.io later
const server = http.createServer(app);

// Only listen if run directly (not imported as a module for Vercel)
if (require.main === module) {
    server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

module.exports = app;
