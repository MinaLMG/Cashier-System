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
        let maxWalkin = 0; // Was maxCustomer
        let maxPharmacy = 0;
        let maxGuidal = 0;

        for (const item of items) {
            const volumeValue = volumeMap.get(item.volume.toString());
            if (!volumeValue || volumeValue <= 0) continue;

            // Calculate unit prices
            const u_walkin = item.v_walkin_price / volumeValue; // Was customer/cust price
            const u_pharmacy = item.v_pharmacy_price / volumeValue;
            const u_guidal =
                item.v_guidal_price !== undefined &&
                item.v_guidal_price !== null
                    ? item.v_guidal_price / volumeValue
                    : 0;

            if (u_walkin > maxWalkin) maxWalkin = u_walkin; // Was maxCustomer
            if (u_pharmacy > maxPharmacy) maxPharmacy = u_pharmacy;
            if (u_guidal > maxGuidal) maxGuidal = u_guidal;
        }

        // 4. Update product with unit prices
        await Product.findByIdAndUpdate(productId, {
            u_walkin_price: maxWalkin, // Was customer/cust price
            u_pharmacy_price: maxPharmacy,
            u_guidal_price: maxGuidal,
        });

        return {
            u_walkin_price: maxWalkin,
            u_pharmacy_price: maxPharmacy,
            u_guidal_price: maxGuidal,
        }; // Was customer/cust price
    } catch (err) {
        console.error(
            `❌ Failed to update prices for product ${productId}:`,
            err
        );
    }
};

module.exports = updateProductPrices;
