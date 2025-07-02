const Product = require("../models/Product");

exports.getAllProducts = async (req, res) => {
    try {
        const products = await Product.find().populate(
            "category default_volume"
        );
        res.status(200).json(products);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch products." });
    }
};

exports.createProduct = async (req, res) => {
    const { name, min_stock, category, default_volume } = req.body;
    if (!name || !category)
        return res
            .status(400)
            .json({ error: "Name and category are required." });

    try {
        const existing = await Product.findOne({ name });
        if (existing)
            return res.status(409).json({ error: "Product already exists." });

        const product = new Product({
            name,
            min_stock,
            category,
            default_volume,
        });
        await product.save();
        res.status(201).json(product);
    } catch (err) {
        res.status(500).json({ error: "Failed to create product." });
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true,
            }
        );
        if (!product)
            return res.status(404).json({ error: "Product not found." });

        res.status(200).json(product);
    } catch (err) {
        res.status(500).json({ error: "Failed to update product." });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product)
            return res.status(404).json({ error: "Product not found." });

        res.status(200).json({ message: "Product deleted." });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete product." });
    }
};
