const mongoose = require('mongoose');

const limitOrderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    coinId: { type: String, required: true },
    type: { type: String, enum: ['buy', 'sell'], required: true },
    quantity: { type: Number, required: true },
    limitPrice: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'executed', 'cancelled'], default: 'pending' },
    timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('LimitOrder', limitOrderSchema);
