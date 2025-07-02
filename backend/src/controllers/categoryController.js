const Category = require("../models/Category");

exports.getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find();
        res.status(200).json(categories);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch categories." });
    }
};

exports.createCategory = async (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Name is required." });

    try {
        const existing = await Category.findOne({ name });
        if (existing)
            return res.status(409).json({ error: "Category already exists." });

        const category = new Category({ name });
        await category.save();
        res.status(201).json(category);
    } catch (err) {
        res.status(500).json({ error: "Failed to create category." });
    }
};

exports.deleteCategory = async (req, res) => {
    try {
        const category = await Category.findByIdAndDelete(req.params.id);
        if (!category)
            return res.status(404).json({ error: "Category not found." });
        res.status(200).json({ message: "Category deleted." });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete category." });
    }
};

exports.updateCategory = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ error: "Name is required." });

        const category = await Category.findByIdAndUpdate(
            req.params.id,
            { name },
            { new: true, runValidators: true }
        );

        if (!category)
            return res.status(404).json({ error: "Category not found." });
        res.status(200).json(category);
    } catch (err) {
        res.status(500).json({ error: "Failed to update category." });
    }
};
