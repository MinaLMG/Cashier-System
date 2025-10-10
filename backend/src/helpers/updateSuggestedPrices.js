const Product = require("../models/Product");
const PurchaseItem = require("../models/PurchaseItem");

/**
 * Update suggested unit prices for a product based on exponential moving average
 * @param {string} productId - Product ID
 * @param {number} gamma - Smoothing factor for exponential moving average (default: 0.9)
 */
const updateSuggestedPrices = async (productId, gamma = 0.9) => {
    try {
        // Get the current product with existing suggested prices
        const currentProduct = await Product.findById(productId).select(
            "u_suggested_buy_price u_suggested_pharmacy_price u_suggested_walkin_price"
        );
        // Find the most recent purchase item for this product
        const latestPurchase = await PurchaseItem.findOne({
            product: productId,
        })
            .sort({ created_at: -1 })
            .select("v_buy_price v_pharmacy_price v_walkin_price volume")
            .populate("volume", "value");
        if (!latestPurchase) {
            // No purchase data available
            return null;
        }

        // Convert volume prices to unit prices
        const volumeValue = latestPurchase.volume?.value || 1;
        const newUnitBuyPrice = latestPurchase.v_buy_price / volumeValue;
        const newUnitPharmacyPrice =
            latestPurchase.v_pharmacy_price / volumeValue;
        const newUnitWalkinPrice = latestPurchase.v_walkin_price / volumeValue;

        // Calculate exponential moving average
        // Formula: (gamma * old + new) / (1 + gamma)
        // If old is null, set suggested as the new price
        const calculateEMA = (oldValue, newValue) => {
            if (oldValue === null || oldValue === undefined) {
                return newValue;
            }
            return (gamma * oldValue + newValue) / (1 + gamma);
        };

        const newSuggestedBuyPrice = calculateEMA(
            currentProduct.u_suggested_buy_price,
            newUnitBuyPrice
        );
        const newSuggestedPharmacyPrice = calculateEMA(
            currentProduct.u_suggested_pharmacy_price,
            newUnitPharmacyPrice
        );
        const newSuggestedWalkinPrice = calculateEMA(
            currentProduct.u_suggested_walkin_price,
            newUnitWalkinPrice
        );

        // Update the Product document with suggested unit prices
        const updatedProduct = await Product.findByIdAndUpdate(
            productId,
            {
                u_suggested_buy_price: Number(newSuggestedBuyPrice.toFixed(2)),
                u_suggested_pharmacy_price: Number(
                    newSuggestedPharmacyPrice.toFixed(2)
                ),
                u_suggested_walkin_price: Number(
                    newSuggestedWalkinPrice.toFixed(2)
                ),
                suggestions_updated_at: new Date(),
            },
            { new: true }
        );

        return {
            u_suggested_buy_price: Number(newSuggestedBuyPrice.toFixed(2)),
            u_suggested_pharmacy_price: Number(
                newSuggestedPharmacyPrice.toFixed(2)
            ),
            u_suggested_walkin_price: Number(
                newSuggestedWalkinPrice.toFixed(2)
            ),
            gamma: gamma,
            updated_at: new Date(),
        };
    } catch (error) {
        console.error("Error updating suggested prices:", error);
        throw error;
    }
};

/**
 * Update suggested prices for all products in a purchase invoice
 * @param {Array} purchaseItems - Array of purchase items from the invoice
 * @param {number} gamma - Smoothing factor for exponential moving average (default: 0.9)
 */
const updateSuggestedPricesForInvoice = async (purchaseItems, gamma = 0.9) => {
    try {
        // Get unique product IDs from the invoice
        const uniqueProductIds = [
            ...new Set(purchaseItems.map((item) => item.product.toString())),
        ];
        const updatePromises = uniqueProductIds.map(async (productId) => {
            return await updateSuggestedPrices(productId, gamma);
        });
        const results = await Promise.all(updatePromises);
        return results.filter((result) => result !== null);
    } catch (error) {
        console.error("Error updating suggested prices for invoice:", error);
        throw error;
    }
};

module.exports = {
    updateSuggestedPrices,
    updateSuggestedPricesForInvoice,
};
