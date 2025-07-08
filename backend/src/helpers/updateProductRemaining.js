const PurchaseItem = require("../models/PurchaseItem");
const HasVolume = require("../models/HasVolume");
const Product = require("../models/Product");

const updateProductRemaining = async (productId) => {
    const items = await PurchaseItem.find({
        product: productId,
    });
    console.log(items);
    const totalRemaining = items.reduce((sum, item) => {
        return sum + Number(item.remaining || 0);
    }, 0);
    console.log(totalRemaining);

    await Product.findByIdAndUpdate(productId, {
        total_remaining: totalRemaining,
    });
};

module.exports = updateProductRemaining;
