const userModel = require('../models/user.model');
const jwt = require('jsonwebtoken');
const BlacklistModel = require('../models/blacklist.model');

async function authMiddleware(req, res, next) {
    // CHANGED: Added safe optional chaining (req.cookies?.token) and improved the bearer token extraction logic to prevent crashes if the header format is unexpected
    const authHeader = req.headers.authorization;
    const token = req.cookies?.token || (authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(" ")[1] : authHeader);

    if (!token) {
        return res.status(401).json({ message: "Unauthorized access" });
    } 
    //  Correct
const isBlacklisted = await BlacklistModel.findOne({ token });
    if (isBlacklisted) {
        return res.status(401).json({ message: "Unauthorized access, token is blacklisted" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // CHANGED: Added fallback checking for decoded._id alongside decoded.userId to match whatever payload format your JWT generation script uses
        const user = await userModel.findById(decoded.userId || decoded._id);

        // CHANGED: Added an explicit database check to ensure the user actually still exists in MongoDB even if their token is valid
        if (!user) {
            return res.status(401).json({ message: "Unauthorized access, user not found" });
        }

        req.user = user;
        return next();
    } catch (err) {
        return res.status(401).json({ message: "Unauthorized access, token is invalid" });
    }
}

async function authSystemUserMiddleware(req, res, next) {
    // CHANGED: Replicated the robust token extraction logic here to gracefully capture tokens from either cookies or auth headers without crashing
    const authHeader = req.headers.authorization;
    const token = req.cookies?.token || (authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(" ")[1] : authHeader);

    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);  
        
        // CHANGED: Added fallback lookup handling (decoded._id) to securely match user records against your token keys
        const user = await userModel.findById(decoded.userId || decoded._id).select("+systemUser");
        
        if (!user || !user.systemUser) {
            return res.status(403).json({ message: "Access denied. System user privileges required." });
        }
        
        req.user = user;
        return next();
    } catch (err) {
        return res.status(401).json({ message: "Unauthorized access, token is invalid" });
    }
}

module.exports = {
    authMiddleware,
    authSystemUserMiddleware
};