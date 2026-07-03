const mongoose = require('mongoose');

const blacklistSchema = new mongoose.Schema({
    token: {
        type: String,
        required: [true, "Token is required to be blacklisted"],
        unique: [true, "Token already blacklisted"]
    }, // <-- Fixed: Closed the token object properly
    blacklistedAt: {
        type: Date,
        default: Date.now
    }
}, // <-- Fixed: Closed the fields object before options
{
    timestamps: true
});

blacklistSchema.index({blacklistedAt: 1}, {expireAfterSeconds: 60*24*3600});

const TokenBlacklist = mongoose.model('TokenBlacklist', blacklistSchema);

module.exports = TokenBlacklist;