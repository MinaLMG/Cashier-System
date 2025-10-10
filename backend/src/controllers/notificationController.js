const Notification = require("../models/Notification");
const Product = require("../models/Product");
const PurchaseItem = require("../models/PurchaseItem");
const GotMinimum = require("../models/GotMinimum");
const Expires = require("../models/Expires");
const HasVolume = require("../models/HasVolume");

exports.getAllNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find().sort({
            created_at: -1,
        }); // Sort by creation date descending

        res.status(200).json(notifications);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch notifications." });
    }
};

exports.refreshMinimumNotifications = async (req, res) => {
    try {
        // Get all products with min_stock set
        const products = await Product.find({
            min_stock: { $exists: true, $gt: 0 },
        });

        let notificationsCreated = 0;

        for (const product of products) {
            // Check if product already has low_stock_created set to true
            if (product.low_stock_created === true) {
                continue; // Skip if low stock notification was already created
            }

            // Calculate total remaining quantity for this product
            const purchaseItems = await PurchaseItem.find({
                product: product._id,
                remaining: { $gt: 0 },
            }).populate("volume");

            let totalRemaining = 0;
            for (const item of purchaseItems) {
                const hasVolume = await HasVolume.findOne({
                    product: product._id,
                    volume: item.volume._id,
                });
                if (hasVolume) {
                    totalRemaining += item.remaining * hasVolume.value;
                }
            }

            // Check if current quantity is below minimum
            if (totalRemaining < product.min_stock) {
                // Create notification
                const notification = new Notification({
                    type: "low_stock",
                    date_created: new Date(),
                    seen: false,
                    message: `المنتج "${product.name}" وصل للحد الأدنى. الكمية الحالية: ${totalRemaining}, الحد الأدنى: ${product.min_stock}`,
                });
                await notification.save();

                // Create GotMinimum record
                const gotMinimum = new GotMinimum({
                    notification: notification._id,
                    product: product._id,
                });
                await gotMinimum.save();

                // Set low_stock_created to true to prevent duplicate notifications
                await Product.findByIdAndUpdate(product._id, {
                    low_stock_created: true,
                });

                notificationsCreated++;
            }
        }

        res.status(200).json({
            message: `تم إنشاء ${notificationsCreated} إشعار جديد للحد الأدنى`,
            notificationsCreated,
        });
    } catch (err) {
        console.error("refreshMinimumNotifications error:", err);
        res.status(500).json({ error: "فشل في تحديث إشعارات الحد الأدنى" });
    }
};

exports.refreshExpiryNotifications = async (req, res) => {
    try {
        // Get all purchase items with expiry date and remaining quantity
        const purchaseItems = await PurchaseItem.find({
            expiry: { $exists: true, $ne: null },
            remaining: { $gt: 0 },
        }).populate("product volume");

        let notificationsCreated = 0;
        const currentDate = new Date();
        const oneMonthFromNow = new Date();
        oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);

        for (const item of purchaseItems) {
            console.log("item", item);
            // Check if item already has an expiry notification
            const existingNotification = await Expires.findOne({
                purchase_item: item._id,
            });

            if (existingNotification) {
                console.log("already exists");
                continue; // Skip if notification already exists for this purchase item
            }

            // Check if expiry date is within one month
            if (item.expiry <= oneMonthFromNow && item.expiry >= currentDate) {
                // Create notification
                const notification = new Notification({
                    type: "expiry_warning",
                    date_created: new Date(),
                    seen: false,
                    message: `المنتج "${
                        item.product.name
                    }" سينتهي صلاحيته في ${item.expiry.toLocaleDateString(
                        "en-GB"
                    )}. الكمية المتبقية: ${item.remaining}`,
                });
                await notification.save();

                // Create Expires record
                const expires = new Expires({
                    notification: notification._id,
                    purchase_item: item._id,
                });
                await expires.save();

                notificationsCreated++;
            }
        }

        res.status(200).json({
            message: `تم إنشاء ${notificationsCreated} إشعار جديد لانتهاء الصلاحية`,
            notificationsCreated,
        });
    } catch (err) {
        console.error("refreshExpiryNotifications error:", err);
        res.status(500).json({ error: "فشل في تحديث إشعارات انتهاء الصلاحية" });
    }
};

exports.createNotification = async (req, res) => {
    const { type, date, seen, product } = req.body;
    if (!type || !date || !product) {
        return res
            .status(400)
            .json({ error: "Type, date and product are required." });
    }

    try {
        const notification = new Notification({ type, date, seen, product });
        await notification.save();
        res.status(201).json(notification);
    } catch (err) {
        res.status(500).json({ error: "Failed to create notification." });
    }
};

exports.updateNotification = async (req, res) => {
    try {
        const notification = await Notification.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true,
            }
        );
        if (!notification)
            return res.status(404).json({ error: "Notification not found." });
        res.status(200).json(notification);
    } catch (err) {
        res.status(500).json({ error: "Failed to update notification." });
    }
};

// COMMENTED OUT - Delete notification functionality
// exports.deleteNotification = async (req, res) => {
//     try {
//         const notification = await Notification.findByIdAndDelete(
//             req.params.id
//         );
//         if (!notification)
//             return res.status(404).json({ error: "Notification not found." });
//         res.status(200).json({ message: "Notification deleted." });
//     } catch (err) {
//         res.status(500).json({ error: "Failed to delete notification." });
//     }
// };
