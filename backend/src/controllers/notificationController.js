const Notification = require("../models/Notification");

exports.getAllNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find().populate("product");
        res.status(200).json(notifications);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch notifications." });
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

exports.deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findByIdAndDelete(
            req.params.id
        );
        if (!notification)
            return res.status(404).json({ error: "Notification not found." });
        res.status(200).json({ message: "Notification deleted." });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete notification." });
    }
};
