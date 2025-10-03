const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// @route   POST /api/auth/signup
// @desc    Register new user
// @access  Public
router.post("/signup", async (req, res) => {
    try {
        const { name, password, role } = req.body;
        console.log(name, password, role);
        // Validate input
        if (!name || !password) {
            return res.status(400).json({
                success: false,
                message: "الاسم وكلمة المرور مطلوبان.",
            });
        }
        if (!role) {
            return res.status(400).json({
                success: false,
                message: "الدور مطلوب.",
            });
        }
        if (role !== "seller" && role !== "manager" && role !== "admin") {
            return res.status(400).json({
                success: false,
                message: "الدور غير صحيح.",
            });
        }
        // Check if user already exists
        const existingUser = await User.findOne({ name: name });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "اسم المستخدم موجود بالفعل. يرجى اختيار اسم آخر.",
            });
        }
        // Password validation
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل.",
            });
        }
        console.log(password);
        // Create new user
        const newUser = new User({
            name: name,
            hashed_password: password, // Will be hashed by pre-save middleware
            role: role || "seller", // Default to seller role
            isActive: true,
        });
        console.log(newUser);
        await newUser.save();

        // Create JWT payload for immediate login after signup
        const payload = {
            userId: newUser._id,
            username: newUser.name,
            role: newUser.role,
        };

        // Sign token
        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET || "your-secret-key",
            { expiresIn: "24h" }
        );

        res.status(201).json({
            success: true,
            message: "تم إنشاء الحساب بنجاح.",
            accessToken: token,
            user: {
                id: newUser._id,
                username: newUser.name,
                role: newUser.role,
                name: newUser.name,
            },
        });
    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({
            success: false,
            message: "خطأ في إنشاء الحساب. يرجى المحاولة مرة أخرى.",
        });
    }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        // Validate input
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: "اسم المستخدم وكلمة المرور مطلوبان.",
            });
        }
        // Find user by username
        const user = await User.findOne({ name: username });
        console.log(user);
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "اسم المستخدم أو كلمة المرور غير صحيحة.",
            });
        }
        console.log(password, user.hashed_password);
        // Check password
        const isMatch = await bcrypt.compare(password, user.hashed_password);
        console.log(isMatch);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "اسم المستخدم أو كلمة المرور غير صحيحة.",
            });
        }

        // Create JWT payload
        const payload = {
            userId: user._id,
            username: user.name,
            role: user.role,
        };

        // Sign token
        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET || "your-secret-key",
            { expiresIn: "24h" }
        );
        console.log(token);
        // Return user data (without password) and token
        res.json({
            success: true,
            message: "تم تسجيل الدخول بنجاح.",
            accessToken: token,
            user: {
                id: user._id,
                username: user.username,
                role: user.role,
                name: user.name || user.username,
            },
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            success: false,
            message: "خطأ في الخادم.",
        });
    }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get("/me", authMiddleware, async (req, res) => {
    try {
        res.json({
            success: true,
            user: {
                id: req.user._id,
                username: req.user.username,
                role: req.user.role,
                name: req.user.name || req.user.username,
            },
        });
    } catch (error) {
        console.error("Get user error:", error);
        res.status(500).json({
            success: false,
            message: "خطأ في الخادم.",
        });
    }
});

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post("/logout", authMiddleware, async (req, res) => {
    try {
        // Since we're using JWT, logout is handled client-side
        // This endpoint is mainly for consistency and future enhancements
        res.json({
            success: true,
            message: "تم تسجيل الخروج بنجاح.",
        });
    } catch (error) {
        console.error("Logout error:", error);
        res.status(500).json({
            success: false,
            message: "خطأ في الخادم.",
        });
    }
});

module.exports = router;
