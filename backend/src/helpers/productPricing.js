const PurchaseItem = require("../models/PurchaseItem");
const HasVolume = require("../models/HasVolume");
const Product = require("../models/Product");

const updateProductPrices = async (productId) => {
    try {
        // 1. Get all items with remaining stock
        const items = await PurchaseItem.find({
            product: productId,
            remaining: { $gt: 0 },
        });

        // 2. Load all relevant volumes (for conversion values)
        const volumeIds = [...new Set(items.map((i) => i.volume.toString()))];
        const volumeMap = new Map();

        const hasVolumes = await HasVolume.find({
            product: productId,
            volume: { $in: volumeIds },
        });

        hasVolumes.forEach((hv) => {
            volumeMap.set(hv.volume.toString(), hv.value);
        });

        // 3. Normalize prices and find max of each type
        let maxWalkin = 0;
        let maxPharmacy = 0;

        for (const item of items) {
            const volumeValue = volumeMap.get(item.volume.toString());
            if (!volumeValue || volumeValue <= 0) continue;

            const walkinBase = item.walkin_price / volumeValue;
            const pharmacyBase = item.pharmacy_price / volumeValue;

            if (walkinBase > maxWalkin) maxWalkin = walkinBase;
            if (pharmacyBase > maxPharmacy) maxPharmacy = pharmacyBase;
        }

        // 4. Update product
        await Product.findByIdAndUpdate(productId, {
            walkin_price: maxWalkin,
            pharmacy_price: maxPharmacy,
        });

        return { walkin_price: maxWalkin, pharmacy_price: maxPharmacy };
    } catch (err) {
        console.error(
            `❌ Failed to update prices for product ${productId}:`,
            err
        );
    }
};

module.exports = updateProductPrices;
