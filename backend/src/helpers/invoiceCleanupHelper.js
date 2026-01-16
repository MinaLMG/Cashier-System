const SalesInvoice = require("../models/SalesInvoice");
const SalesItem = require("../models/SalesItem");
const ReturnInvoice = require("../models/ReturnInvoice");
const ReturnItem = require("../models/ReturnItem");
const PurchaseItem = require("../models/PurchaseItem");
const updateProductRemaining = require("../helpers/updateProductRemaining");
const updateProductPrices = require("../helpers/productPricing");

/**
 * Internal function to delete a Return Invoice and its items, 
 * reversing the stock restoration it performed and restoring the Sales Item state.
 * @param {string} returnInvoiceId - ID of the return invoice to delete
 */
const deleteReturnInvoiceInternal = async (returnInvoiceId) => {
    const returnItems = await ReturnItem.find({ return_invoice: returnInvoiceId });
    const affectedProducts = new Set();

    for (const item of returnItems) {
        affectedProducts.add(item.product.toString());

        // We must restore the SalesItem to its "pre-return" state
        const salesItem = await SalesItem.findById(item.sales_item);
        if (!salesItem) continue;

        // Use returned_to_sources (primary) or legacy sources field
        const returnSources = (item.returned_to_sources && item.returned_to_sources.length > 0) 
            ? item.returned_to_sources 
            : (item.sources || []);

        let totalBaseQuantityRestored = 0;

        for (const source of returnSources) {
            if (!source.purchase_item) continue;

            const quantityInBase = Number(source.quantity || 0);
            totalBaseQuantityRestored += quantityInBase;

            // 1. Reverse stock restoration: Returns added back to PI.remaining, so we must SUBTRACT it back.
            await PurchaseItem.findByIdAndUpdate(
                source.purchase_item,
                { $inc: { remaining: -quantityInBase } }
            );

            // 2. Restore SalesItem's source quantity: Returns subtracted from SalesItem sources, so we must ADD it back.
            // Find the matching source in the SalesItem
            const salesSource = salesItem.sources.find(s => 
                s.purchase_item.toString() === source.purchase_item.toString()
            );

            if (salesSource) {
                salesSource.quantity += quantityInBase;
            } else {
                // If the source was somehow removed entirely (shouldn't happen with current logic), re-add it
                salesItem.sources.push({
                    purchase_item: source.purchase_item,
                    quantity: quantityInBase
                });
            }
        }

        // 3. Save the restored SalesItem
        await salesItem.save();
    }

    await ReturnItem.deleteMany({ return_invoice: returnInvoiceId });
    await ReturnInvoice.findByIdAndDelete(returnInvoiceId);

    return affectedProducts;
};

/**
 * Internal function to delete a Sales Invoice and its items,
 * cascading to related Return Invoices and restoring stock.
 */
const deleteSalesInvoiceInternal = async (salesInvoiceId) => {
    const invoice = await SalesInvoice.findById(salesInvoiceId);
    if (!invoice) return new Set();

    const affectedProducts = new Set();

    // 1. Cascade to Return Invoices
    // deleteReturnInvoiceInternal now restores SalesItems to pre-return state independently.
    const returnInvoices = await ReturnInvoice.find({ sales_invoice: salesInvoiceId });
    for (const rtnInv of returnInvoices) {
        const productsFromReturn = await deleteReturnInvoiceInternal(rtnInv._id);
        productsFromReturn.forEach(p => affectedProducts.add(p));
    }

    // 2. Process Sales Items and Restore Stock
    const salesItems = await SalesItem.find({ sales_invoice: salesInvoiceId });
    for (const item of salesItems) {
        affectedProducts.add(item.product.toString());

        if (item.sources && item.sources.length > 0) {
            for (const source of item.sources) {
                if (source.purchase_item) {
                    await PurchaseItem.findByIdAndUpdate(
                        source.purchase_item,
                        { $inc: { remaining: source.quantity } }
                    );
                }
            }
        }
    }

    // 3. Delete Items and Invoice
    await SalesItem.deleteMany({ sales_invoice: salesInvoiceId });
    await SalesInvoice.findByIdAndDelete(salesInvoiceId);

    return affectedProducts;
};

/**
 * Updates product prices and remaining quantities for a set of product IDs.
 */
const updateAffectedProducts = async (affectedProductsSet) => {
    for (const productId of affectedProductsSet) {
        await updateProductPrices(productId);
        await updateProductRemaining(productId);
    }
};

module.exports = {
    deleteReturnInvoiceInternal,
    deleteSalesInvoiceInternal,
    updateAffectedProducts
};
