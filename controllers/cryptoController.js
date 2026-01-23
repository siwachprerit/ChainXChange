const User = require('../models/User');
const Portfolio = require('../models/Portfolio');
const Transaction = require('../models/Transaction');
const LimitOrder = require('../models/LimitOrder');
const PortfolioHistory = require('../models/PortfolioHistory');
const { fetchCoinGeckoDataWithCache } = require('../utils/geckoApi');
const redisClient = require('../utils/redisClient'); // Import the shared client

// Cache for portfolio data. TTL of 120 seconds (2 minutes)
const PORTFOLIO_CACHE_TTL = 120; // 2 minutes in seconds

/**
 * Helper function to get base price for common cryptocurrencies
 */
function getBasePriceForCoin(coinId) {
    const basePrices = {
        'bitcoin': 65000,
        'ethereum': 3500,
        'binancecoin': 600,
        'ripple': 0.6,
        'cardano': 0.5,
        'solana': 150,
        'dogecoin': 0.1,
        'matic-network': 1.2,
        'avalanche-2': 35,
        'chainlink': 12,
        'litecoin': 85,
        'bitcoin-cash': 140,
        'stellar': 0.12,
        'vechain': 0.03,
        'filecoin': 6,
        'tron': 0.08,
        'ethereum-classic': 22,
        'monero': 160,
        'algorand': 0.2,
        'cosmos': 8
    };

    return basePrices[coinId] || 100; // Default to $100 if coin not found
}

/**
 * Generate mock chart data for fallback
 */
function generateMockChartData(basePrice, days) {
    const dayCount = parseInt(days);
    let dataPoints = 24; // Default hourly for 1 day
    let interval = 60 * 60 * 1000; // 1 hour

    if (dayCount <= 1) {
        dataPoints = 24; // Hourly
        interval = 60 * 60 * 1000;
    } else if (dayCount <= 7) {
        dataPoints = dayCount * 4; // 6-hour intervals
        interval = 6 * 60 * 60 * 1000;
    } else if (dayCount <= 30) {
        dataPoints = dayCount; // Daily
        interval = 24 * 60 * 60 * 1000;
    } else {
        dataPoints = Math.min(dayCount, 365); // Daily up to a year
        interval = 24 * 60 * 60 * 1000;
    }

    const prices = [];
    const now = Date.now();
    let currentPrice = basePrice;

    for (let i = 0; i < dataPoints; i++) {
        const timestamp = now - (dataPoints - 1 - i) * interval;

        // Add some realistic price movement (±5% maximum change per interval)
        const changePercent = (Math.random() - 0.5) * 0.1; // ±5%
        currentPrice *= (1 + changePercent);

        // Ensure price doesn't go below 10% of base price
        currentPrice = Math.max(currentPrice, basePrice * 0.1);

        prices.push([timestamp, parseFloat(currentPrice.toFixed(8))]);
    }

    return { prices };
}

/**
 * Cryptocurrency Controller
 * Handles crypto trading, portfolio management, and market data
 */
class CryptoController {
    /**
     * Display cryptocurrency markets
     */
    static async showMarkets(req, res) {
        try {
            console.log('Fetching market data...'); // Debug log
            const coins = await Promise.race([
                fetchCoinGeckoDataWithCache(
                    'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&locale=en',
                    null,
                    'crypto-markets',
                    5 * 60 * 1000
                ),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Request timeout')), 30000)
                )
            ]);

            // If no coins received, use fallback data
            if (!coins || coins.length === 0) {
                console.error('No coins received from CoinGecko, using fallback data');
                // Fallback data for testing
                const fallbackCoins = [
                    { id: "bitcoin", symbol: "btc", name: "Bitcoin", current_price: 45000 },
                    { id: "ethereum", symbol: "eth", name: "Ethereum", current_price: 3000 }
                ];

                return res.json({
                    success: true,
                    coins: fallbackCoins,
                    message: 'Using fallback data'
                });
            }

            res.json({ success: true, coins });
        } catch (error) {
            console.error('Markets error:', error);
            const fallbackCoins = [
                { id: "bitcoin", symbol: "btc", name: "Bitcoin", current_price: 45000 },
                { id: "ethereum", symbol: "eth", name: "Ethereum", current_price: 3000 }
            ];

            res.status(500).json({
                success: false,
                coins: fallbackCoins,
                message: 'Unable to load market data',
                error: process.env.NODE_ENV === 'development' ? error.message : null
            });
        }
    }

    /**
     * Handle cryptocurrency purchase
     */
    static async buyCrypto(req, res) {
        try {
            const { coinId, quantity, price } = req.body;
            const userId = req.cookies.user;

            if (!coinId || !quantity || !price) {
                throw new Error('Missing required fields');
            }

            const quantityNum = parseFloat(quantity);
            const priceNum = parseFloat(price);
            const totalCost = quantityNum * priceNum;

            if (isNaN(quantityNum) || quantityNum <= 0 || isNaN(priceNum) || priceNum <= 0) {
                throw new Error('Invalid quantity or price values');
            }

            // Start fetching user and coin data in parallel
            const userPromise = User.findById(userId).lean();
            const coinDataPromise = fetchCoinGeckoDataWithCache(
                `https://api.coingecko.com/api/v3/coins/${coinId}`,
                null,
                `coin-info-${coinId}`,
                60 * 60 * 1000 // 1 hour cache
            );

            const [user, coinInfo] = await Promise.all([userPromise, coinDataPromise]);

            if (!user) {
                throw new Error('User not found');
            }

            if (user.wallet < totalCost) {
                throw new Error('Insufficient funds');
            }

            const coinData = {
                name: coinInfo.name || coinId.charAt(0).toUpperCase() + coinId.slice(1),
                symbol: coinInfo.symbol?.toUpperCase() || coinId.toUpperCase().substring(0, 4),
                image: coinInfo.image?.large || coinInfo.image?.small || '/images/default-coin.svg'
            };

            // Find existing portfolio to calculate new average price
            const existingPortfolio = await Portfolio.findOne({ userId, coinId }).lean();

            let newAverageBuyPrice;
            if (existingPortfolio) {
                const newTotalQuantity = existingPortfolio.quantity + quantityNum;
                newAverageBuyPrice = ((existingPortfolio.quantity * existingPortfolio.averageBuyPrice) + totalCost) / newTotalQuantity;
            } else {
                newAverageBuyPrice = priceNum;
            }

            // Perform all database writes and cache invalidation concurrently
            await Promise.all([
                User.findByIdAndUpdate(userId, { $inc: { wallet: -totalCost } }),
                Portfolio.findOneAndUpdate(
                    { userId, coinId },
                    {
                        $set: {
                            averageBuyPrice: newAverageBuyPrice,
                            crypto: coinData.name,
                            image: coinData.image,
                            symbol: coinData.symbol
                        },
                        $inc: { quantity: quantityNum }
                    },
                    { upsert: true, new: true }
                ),
                Transaction.create({
                    userId,
                    type: 'buy',
                    coinId,
                    quantity: quantityNum,
                    price: priceNum,
                    totalCost,
                    timestamp: new Date()
                }),
                redisClient.del(`portfolio:${userId}`)
            ]);

            // Achievement logic (Background)
            (async () => {
                const updatedUser = await User.findById(userId);
                const achievements = updatedUser.achievements || [];
                const newAchievements = [];

                // Achievement: First Trade
                if (!achievements.some(a => a.name === 'First Steps')) {
                    newAchievements.push({
                        name: 'First Steps',
                        description: 'Completed your first trade on ChainXChange.',
                        icon: '🎯'
                    });
                }

                // Achievement: High Roller (Buy > $10,000)
                if (totalCost > 10000 && !achievements.some(a => a.name === 'Whale')) {
                    newAchievements.push({
                        name: 'Whale',
                        description: 'Executed a trade worth over $10,000.',
                        icon: '🐋'
                    });
                }

                if (newAchievements.length > 0) {
                    await User.findByIdAndUpdate(userId, {
                        $push: { achievements: { $each: newAchievements } }
                    });
                }
            })().catch(err => console.error('Achievement logic error:', err));

            res.status(201).json({ success: true, message: 'Purchase successful' });
        } catch (error) {
            console.error('Buy error:', error);
            res.status(400).json({ success: false, message: error.message });
        }
    }

    /**
     * Handle cryptocurrency sale
     */
    static async sellCrypto(req, res) {
        try {
            const { coinId, quantity, price } = req.body;
            const userId = req.cookies.user;

            // Validate input
            if (!coinId || !quantity || !price) {
                throw new Error('Missing required fields');
            }

            const quantityNum = parseFloat(quantity);
            const priceNum = parseFloat(price);
            const totalEarnings = quantityNum * priceNum;

            if (isNaN(quantityNum) || quantityNum <= 0 || isNaN(priceNum) || priceNum <= 0) {
                throw new Error('Invalid quantity or price values');
            }

            // Find existing portfolio
            const existingPortfolio = await Portfolio.findOne({ userId, coinId });
            if (!existingPortfolio || existingPortfolio.quantity < quantityNum) {
                throw new Error('Insufficient cryptocurrency holdings');
            }

            // Update user wallet
            await User.findByIdAndUpdate(
                userId,
                { $inc: { wallet: totalEarnings } }
            );

            // Update or remove portfolio entry
            const remainingQuantity = existingPortfolio.quantity - quantityNum;
            if (remainingQuantity <= 0) {
                await Portfolio.deleteOne({ userId, coinId });
            } else {
                await Portfolio.findOneAndUpdate(
                    { userId, coinId },
                    { $inc: { quantity: -quantityNum } }
                );
            }

            // Create transaction record
            await Transaction.create({
                userId,
                type: 'sell',
                coinId,
                quantity: quantityNum,
                price: priceNum,
                totalCost: totalEarnings,
                timestamp: new Date()
            });

            // --- REMOVED ARTIFICIAL DELAY ---
            // await new Promise(resolve => setTimeout(resolve, 500));

            // --- CACHE INVALIDATION ---
            // Clear the cached portfolio data for this user
            try {
                await redisClient.del(`portfolio:${userId}`);
            } catch (cacheError) {
                console.error(`Redis DEL error for key portfolio:${userId}:`, cacheError.message);
            }
            // --- END CACHE INVALIDATION ---

            return res.json({ success: true, message: `Successfully sold ${quantityNum} ${coinId}` });
        } catch (error) {
            console.error('Sell error:', error);
            return res.status(400).json({ success: false, message: error.message });
        }
    }

    /**
     * Display user portfolio
     */
    static async showPortfolio(req, res) {
        try {
            const userId = req.cookies.user;

            // --- PORTFOLIO CACHE CHECK ---
            const cacheKey = `portfolio:${userId}`;

            try {
                const cachedDataString = await redisClient.get(cacheKey);
                if (cachedDataString) {
                    // console.log(`[Cache HIT] Using cached portfolio for ${userId}`);
                    const cachedData = JSON.parse(cachedDataString);

                    // We need to re-fetch the user object for the layout, 
                    // but the portfolio data is cached.
                    const user = await User.findById(userId).lean();

                    return res.json({
                        success: true,
                        holdings: cachedData.holdings,
                        portfolioValue: cachedData.portfolioValue,
                        totalProfitLoss: cachedData.totalProfitLoss,
                        totalProfitLossPercentage: cachedData.totalProfitLossPercentage
                    });
                }
            } catch (cacheError) {
                console.error(`Redis GET error for key ${cacheKey}:`, cacheError.message);
                // Don't throw, just proceed to fetch
            }
            // --- END CACHE CHECK ---

            // console.log(`[Cache MISS] Fetching portfolio for ${userId}`);
            const user = await User.findById(userId);
            const portfolio = await Portfolio.find({ userId });

            if (!user) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }

            // Get current market data for portfolio coins
            let portfolioWithCurrentPrices = [];
            let totalPortfolioValue = 0;
            let totalInvested = 0;
            let totalProfitLoss = 0;
            let totalProfitLossPercentage = 0;

            if (portfolio.length > 0) {
                try {
                    const coinIds = portfolio.map(p => p.coinId).join(',');

                    // Fetch both price and coin data
                    const [marketData, coinsData] = await Promise.all([
                        fetchCoinGeckoDataWithCache(
                            `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=usd&include_24hr_change=true`,
                            null,
                            `portfolio-prices-${coinIds}`,
                            2 * 60 * 1000 // 2 minutes cache
                        ),
                        fetchCoinGeckoDataWithCache(
                            `https://api.coingecko.com/api/v3/coins/markets?ids=${coinIds}&vs_currency=usd&order=market_cap_desc&per_page=250&page=1`,
                            null,
                            `portfolio-coins-${coinIds}`,
                            10 * 60 * 1000 // 10 minutes cache
                        )
                    ]);

                    portfolioWithCurrentPrices = await Promise.all(portfolio.map(async (holding) => {
                        // Use market price if available, otherwise fallback to average buy price
                        const currentPrice = marketData[holding.coinId]?.usd || holding.averageBuyPrice;
                        const currentValue = holding.quantity * currentPrice;
                        const totalInvested = holding.quantity * holding.averageBuyPrice;
                        const profitLoss = currentValue - totalInvested;
                        const profitLossPercentage = totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0;

                        // Get coin image and symbol from market data
                        const coinMarketData = coinsData?.find(coin => coin.id === holding.coinId);
                        let image = holding.image;
                        let symbol = holding.symbol;
                        let crypto = holding.crypto;

                        // Update missing data from market API
                        if (!image || !symbol) {
                            if (coinMarketData) {
                                image = coinMarketData.image;
                                symbol = coinMarketData.symbol?.toUpperCase();
                                crypto = coinMarketData.name;

                                // --- PERFORMANCE FIX ---
                                // Update the DB in the background, don't await it.
                                // This stops the page load from being blocked by N+1 updates.
                                if (!holding.image || !holding.symbol) {
                                    Portfolio.findOneAndUpdate(
                                        { _id: holding._id },
                                        {
                                            $set: {
                                                image: image,
                                                symbol: symbol,
                                                crypto: crypto
                                            }
                                        }
                                    ).catch(updateError => {
                                        // Log the error but don't block the request
                                        console.error('Error updating portfolio image in background:', updateError);
                                    });
                                }
                                // --- END PERFORMANCE FIX ---
                            } else {
                                // Fallback values
                                image = image || '/images/default-coin.svg';
                                symbol = symbol || holding.coinId.toUpperCase();
                                crypto = crypto || holding.coinId.charAt(0).toUpperCase() + holding.coinId.slice(1);
                            }
                        }

                        return {
                            ...holding.toObject(),
                            currentPrice,
                            currentValue,
                            totalInvested,
                            profitLoss,
                            profitLossPercentage,
                            change24h: marketData[holding.coinId]?.usd_24h_change || 0,
                            image: image,
                            symbol: symbol,
                            crypto: crypto
                        };
                    }));

                    totalPortfolioValue = portfolioWithCurrentPrices.reduce(
                        (sum, holding) => sum + holding.currentValue, 0
                    );
                    totalInvested = portfolioWithCurrentPrices.reduce(
                        (sum, holding) => sum + holding.totalInvested, 0
                    );
                    totalProfitLoss = totalPortfolioValue - totalInvested;
                    totalProfitLossPercentage = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;
                } catch (err) {
                    console.error('Portfolio CoinGecko error:', err);
                    // fallback: show holdings without updated price info but with existing image data
                    portfolioWithCurrentPrices = portfolio.map(holding => ({
                        ...holding.toObject(),
                        currentPrice: holding.averageBuyPrice,
                        currentValue: holding.quantity * holding.averageBuyPrice,
                        totalInvested: holding.quantity * holding.averageBuyPrice,
                        profitLoss: 0,
                        profitLossPercentage: 0,
                        change24h: 0,
                        image: holding.image || '/images/default-coin.svg',
                        symbol: holding.symbol || holding.coinId.toUpperCase(),
                        crypto: holding.crypto || holding.coinId.charAt(0).toUpperCase() + holding.coinId.slice(1)
                    }));
                }
            }

            // --- STORE DATA IN CACHE ---
            const dataToCache = {
                // user: user.toObject(), // No need to cache user, we fetch it fresh
                holdings: portfolioWithCurrentPrices,
                portfolioValue: totalPortfolioValue,
                totalProfitLoss,
                totalProfitLossPercentage
            };

            try {
                await redisClient.setEx(cacheKey, PORTFOLIO_CACHE_TTL, JSON.stringify(dataToCache));
            } catch (cacheError) {
                console.error(`Redis SETEX error for key ${cacheKey}:`, cacheError.message);
            }
            // --- END STORE DATA ---

            res.json({
                success: true,
                user,
                holdings: portfolioWithCurrentPrices,
                portfolioValue: totalPortfolioValue,
                totalProfitLoss,
                totalProfitLossPercentage
            });
        } catch (error) {
            console.error('Portfolio error:', error);
            res.status(500).json({
                success: false,
                message: 'Error loading portfolio',
                error: process.env.NODE_ENV === 'development' ? error.message : null
            });
        }
    }

    /**
     * Display user's transaction history
     */
    static async showHistory(req, res) {
        try {
            const userId = req.cookies.user;
            const user = await User.findById(userId).lean();

            if (!user) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }

            // --- New Sorting/Filtering Logic ---
            const { type, sortBy, order } = req.query;

            // 1. Create Filter Query
            const findQuery = { userId };
            if (type && (type === 'buy' || type === 'sell')) {
                findQuery.type = type;
            }

            // 2. Create Sort Query
            const sortQuery = {};
            const sortOrderVal = order === 'asc' ? 1 : -1; // Default to descending
            const sortByVal = sortBy || 'timestamp'; // Default to timestamp

            // Whitelist sortable fields
            if (['timestamp', 'type', 'price', 'quantity', 'totalCost'].includes(sortByVal)) {
                sortQuery[sortByVal] = sortOrderVal;
            } else {
                sortQuery['timestamp'] = -1; // Default fallback
            }
            // --- End New Logic ---

            // Fetch transactions for the user, applying filters and sorting
            const transactions = await Transaction.find(findQuery)
                .sort(sortQuery)
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

            res.json({
                success: true,
                transactions: formattedTransactions,
                currentOptions: {
                    type: type || 'all',
                    sortBy: sortByVal,
                    order: order || 'desc'
                }
            });
        } catch (error) {
            console.error('History error:', error);
            res.status(500).json({
                success: false,
                message: 'Error loading transaction history',
                error: process.env.NODE_ENV === 'development' ? error.message : null
            });
        }
    }

    /**
     * Get chart data for cryptocurrency
     */
    static async getChartData(req, res) {
        try {
            const { coinId } = req.params;
            const timeframe = (req.query.timeframe || req.query.days || '24h').toLowerCase();

            const timeframeMap = {
                '1h': { days: '1', interval: 'minute' },
                '24h': { days: '1' },
                '7d': { days: '7' },
                '1m': { days: '30' },
                '3m': { days: '90' },
                '1y': { days: '365' },
                'all': { days: 'max' }
            };

            const selected = timeframeMap[timeframe] || { days: req.query.days || '7' };
            const queryParams = [`vs_currency=usd`, `days=${selected.days}`];
            if (selected.interval) {
                queryParams.push(`interval=${selected.interval}`);
            }

            // Set a shorter timeout for chart requests
            const chartDataPromise = fetchCoinGeckoDataWithCache(
                `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?${queryParams.join('&')}`,
                null,
                `chart-${coinId}-${timeframe}`,
                5 * 60 * 1000 // 5 minutes cache
            );

            // Add timeout to prevent hanging
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Chart request timeout')), 30000) // 30 second timeout
            );

            const chartData = await Promise.race([chartDataPromise, timeoutPromise]);

            // Validate data structure
            if (!chartData || !chartData.prices || !Array.isArray(chartData.prices)) {
                throw new Error('Invalid chart data structure');
            }

            res.json(chartData);
        } catch (error) {
            console.error('Chart data error:', error);

            // Generate realistic fallback data based on coinId and timeframe
            // Generate realistic fallback data based on coinId and timeframe
            const basePrice = getBasePriceForCoin(req.params.coinId);

            // Re-calculate selected days for fallback context
            const timeframe = (req.query.timeframe || req.query.days || '24h').toLowerCase();
            const timeframeMap = {
                '1h': { days: '1' },
                '24h': { days: '1' },
                '7d': { days: '7' },
                '1m': { days: '30' },
                '3m': { days: '90' },
                '1y': { days: '365' },
                'all': { days: 'max' }
            };
            const selected = timeframeMap[timeframe] || { days: req.query.days || '7' };
            const mockRange = selected.days;

            const mockData = generateMockChartData(basePrice, mockRange);

            res.json(mockData);
        }
    }

    /**
     * Display detailed cryptocurrency page
     */
    static async showCryptoDetail(req, res) {
        try {
            const { coinId } = req.params;

            const userId = req.cookies.user;

            // Fetch comprehensive coin data and user's holdings (DECOUPLED chart data for speed)
            const [coinData, userHolding] = await Promise.all([
                fetchCoinGeckoDataWithCache(
                    `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&community_data=false&developer_data=false`,
                    null,
                    `coin-detail-${coinId}`,
                    5 * 60 * 1000 // 5 minutes cache
                ),
                userId ? Portfolio.findOne({ userId, coinId }).lean() : Promise.resolve(null)
            ]);

            if (!coinData) {
                throw new Error('Coin not found');
            }

            // Fetch news (using a placeholder for now, you can integrate a news API later)
            const newsData = [];

            res.json({
                success: true,
                coin: {
                    id: coinData.id,
                    name: coinData.name,
                    symbol: coinData.symbol?.toUpperCase(),
                    image: coinData.image?.large,
                    current_price: coinData.market_data?.current_price?.usd,
                    price_change_24h: coinData.market_data?.price_change_24h,
                    price_change_percentage_24h: coinData.market_data?.price_change_percentage_24h,
                    market_cap: coinData.market_data?.market_cap?.usd,
                    market_cap_rank: coinData.market_cap_rank,
                    total_volume: coinData.market_data?.total_volume?.usd,
                    high_24h: coinData.market_data?.high_24h?.usd,
                    low_24h: coinData.market_data?.low_24h?.usd,
                    ath: coinData.market_data?.ath?.usd,
                    ath_date: coinData.market_data?.ath_date?.usd,
                    atl: coinData.market_data?.atl?.usd,
                    atl_date: coinData.market_data?.atl_date?.usd,
                    circulating_supply: coinData.market_data?.circulating_supply,
                    total_supply: coinData.market_data?.total_supply,
                    max_supply: coinData.market_data?.max_supply,
                    description: coinData.description?.en,
                    genesis_date: coinData.genesis_date
                },
                userHolding,
                news: newsData
            });
        } catch (error) {
            console.error('Crypto detail error:', error);
            const { coinId } = req.params;
            const basePrice = getBasePriceForCoin(coinId);

            res.json({
                success: true,
                coin: {
                    id: coinId,
                    name: coinId.charAt(0).toUpperCase() + coinId.slice(1),
                    symbol: coinId.toUpperCase().substring(0, 4),
                    image: '/images/default-coin.svg',
                    current_price: basePrice,
                    price_change_24h: basePrice * 0.025,
                    price_change_percentage_24h: 2.5,
                    market_cap: basePrice * 1000000,
                    market_cap_rank: 1,
                    total_volume: basePrice * 50000,
                    high_24h: basePrice * 1.05,
                    low_24h: basePrice * 0.95,
                    ath: basePrice * 1.2,
                    ath_date: new Date().toISOString(),
                    atl: basePrice * 0.8,
                    atl_date: new Date().toISOString(),
                    circulating_supply: 1000000,
                    total_supply: 1000000,
                    max_supply: 1000000,
                    description: 'No description available.',
                    genesis_date: null
                },
                chartData: generateMockChartData(basePrice, '1'),
                news: []
            });
        }
    }
    /**
     * Get trader leaderboard
     */
    static async getLeaderboard(req, res) {
        try {
            // Get all users
            const users = await User.find({}).lean();

            // Get all portfolios
            const allPortfolios = await Portfolio.find({}).lean();

            // Get current prices for common coins to value portfolios
            const coinIds = [...new Set(allPortfolios.map(p => p.coinId))].join(',');
            let marketData = {};

            if (coinIds) {
                try {
                    const fetchedPrices = await fetchCoinGeckoDataWithCache(
                        `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=usd`,
                        null,
                        `lb-prices-${coinIds.substring(0, 50)}`, // Truncate key for safety
                        5 * 60 * 1000
                    );
                    if (fetchedPrices) {
                        marketData = fetchedPrices;
                    }
                } catch (err) {
                    console.error('Error fetching leaderboard prices:', err);
                    // Continue without latest prices
                }
            }

            // Calculate total value for each user
            const leaderboard = users.map(user => {
                const userPortfolio = allPortfolios.filter(p => p.userId.toString() === user._id.toString());
                const holdingsValue = userPortfolio.reduce((sum, p) => {
                    // Safety check for marketData
                    const price = (marketData && marketData[p.coinId]?.usd) || p.averageBuyPrice || 0;
                    return sum + (p.quantity * price);
                }, 0);

                return {
                    username: user.username,
                    totalValue: (user.wallet || 0) + holdingsValue,
                    achievementsCount: (user.achievements || []).length
                };
            });

            // Sort by total value descending
            leaderboard.sort((a, b) => b.totalValue - a.totalValue);

            res.json({
                success: true,
                leaderboard: leaderboard.slice(0, 50) // Return top 50 instead of 10
            });
        } catch (error) {
            console.error('Leaderboard error:', error);
            res.status(500).json({ success: false, message: 'Error fetching leaderboard' });
        }
    }

    /**
     * Get sentiment data for a specific coin
     */
    static async getSentiment(req, res) {
        try {
            const { coinId } = req.params;
            const fearGreed = Math.floor(Math.random() * 40) + 30; // 30-70 range

            res.json({
                success: true,
                fearGreed,
                label: fearGreed > 70 ? 'Extreme Greed' : fearGreed > 55 ? 'Greed' : fearGreed > 45 ? 'Neutral' : fearGreed > 25 ? 'Fear' : 'Extreme Fear',
                buzz: Math.floor(Math.random() * 100),
                whaleActivity: fearGreed > 50 ? 'Accumulating' : 'Distributing'
            });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error fetching sentiment' });
        }
    }

    /**
     * Get simulated whale alerts
     */
    static async getWhaleAlerts(req, res) {
        try {
            const whales = [
                { id: 1, type: 'large_move', coin: 'BTC', amount: '1,200', from: 'Unknown Wallet', to: 'Binance', time: '2m ago' },
                { id: 2, type: 'large_move', coin: 'ETH', amount: '15,000', from: 'Coinbase', to: 'Unknown Wallet', time: '15m ago' },
                { id: 3, type: 'large_move', coin: 'SOL', amount: '85,000', from: 'Unknown Wallet', to: 'Kraken', time: '1h ago' },
                { id: 4, type: 'large_buy', coin: 'PEPE', amount: '2Trillion', from: 'Exchange', to: 'Unknown Wallet', time: '3h ago' }
            ];
            res.json({ success: true, alerts: whales });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error fetching whale alerts' });
        }
    }

    /**
     * Place a limit order
     */
    static async placeLimitOrder(req, res) {
        try {
            const { coinId, type, quantity, limitPrice } = req.body;
            const userId = req.cookies.user; // Using cookie user ID as fallback if not in req.user

            const order = new LimitOrder({
                userId,
                coinId,
                type,
                quantity,
                limitPrice,
                status: 'pending'
            });

            await order.save();
            res.json({ success: true, message: 'Limit order placed successfully', order });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error placing limit order' });
        }
    }

    /**
     * Get portfolio history for equity curve
     */
    static async getPortfolioHistory(req, res) {
        try {
            const userId = req.cookies.user;

            let history = await PortfolioHistory.find({ userId }).sort({ timestamp: 1 }).lean();

            if (history.length < 2) {
                const user = await User.findById(userId);
                const baseValue = user ? user.wallet : 10000;
                const now = Date.now();
                history = Array.from({ length: 15 }, (_, i) => ({
                    totalNetWorth: baseValue * (0.8 + (i * 0.05) + (Math.random() * 0.1)),
                    timestamp: new Date(now - (15 - i) * 24 * 60 * 60 * 1000)
                }));
            }

            res.json({ success: true, history });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error fetching portfolio history' });
        }
    }
}

module.exports = CryptoController;