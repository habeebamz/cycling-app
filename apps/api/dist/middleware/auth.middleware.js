"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateOptional = exports.authenticate = void 0;
const auth_1 = require("../utils/auth");
const prisma_1 = __importDefault(require("../prisma"));
const authenticate = async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ message: 'Authentication required' });
    }
    try {
        const decoded = (0, auth_1.verifyToken)(token);
        // Verify user status in DB to ensure not suspended
        const user = await prisma_1.default.user.findUnique({
            where: { id: decoded.userId },
            select: { status: true, id: true, role: true } // Fetch minimal fields
        });
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }
        if (user.status === 'SUSPENDED') {
            return res.status(403).json({ message: 'Access Denied: Account Suspended' });
        }
        req.user = { userId: user.id, role: user.role };
        next();
    }
    catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};
exports.authenticate = authenticate;
const authenticateOptional = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (token) {
        try {
            const decoded = (0, auth_1.verifyToken)(token);
            req.user = decoded;
        }
        catch (error) {
            // Ignore invalid token for optional auth, treat as guest
        }
    }
    next();
};
exports.authenticateOptional = authenticateOptional;
