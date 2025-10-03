const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.header("Authorization");

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: "لا يوجد رمز وصول. الوصول مرفوض.",
            });
        }

        // Check if token starts with 'Bearer '
        if (!authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "تنسيق رمز الوصول غير صحيح.",
            });
        }

        // Extract token
        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "لا يوجد رمز وصول. الوصول مرفوض.",
            });
        }

        // Verify token
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || "your-secret-key"
        );

        // Get user from database
        const user = await User.findById(decoded.userId).select("-password");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "المستخدم غير موجود.",
            });
        }

        // Add user to request object
        req.user = user;
        next();
    } catch (error) {
        console.error("Auth middleware error:", error);

        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({
                success: false,
                message: "رمز الوصول غير صحيح.",
            });
        }

        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                message: "انتهت صلاحية رمز الوصول.",
            });
        }

        return res.status(500).json({
            success: false,
            message: "خطأ في الخادم.",
        });
    }
};

module.exports = authMiddleware;
