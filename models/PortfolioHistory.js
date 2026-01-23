const mongoose = require('mongoose');

const portfolioHistorySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    totalNetWorth: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now }
});

// Index for efficient time-series querying
portfolioHistorySchema.index({ userId: 1, timestamp: -1 });

module.exports = mongoose.model('PortfolioHistory', portfolioHistorySchema);
