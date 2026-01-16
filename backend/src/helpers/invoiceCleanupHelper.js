const SalesInvoice = require("../models/SalesInvoice");
const SalesItem = require("../models/SalesItem");
const ReturnInvoice = require("../models/ReturnInvoice");
const ReturnItem = require("../models/ReturnItem");
const PurchaseItem = require("../models/PurchaseItem");
const updateProductRemaining = require("../helpers/updateProductRemaining");
const updateProductPrices = require("../helpers/productPricing");

/**
 * Internal function to delete a Return Invoice and its items, 
 * reversing the stock restoration it performed.
 */
const deleteReturnInvoiceInternal = async (returnInvoiceId) => {
    const returnItems = await ReturnItem.find({ return_invoice: returnInvoiceId });
    const affectedProducts = new Set();

    for (const item of returnItems) {
        affectedProducts.add(item.product.toString());

        // Reverse stock restoration: if the return added back to stock, we must remove it
        if (item.returned_to_sources && item.returned_to_sources.length > 0) {
            for (const source of item.returned_to_sources) {
                if (source.purchase_item) {
                    await PurchaseItem.findByIdAndUpdate(
                        source.purchase_item,
                        { $inc: { remaining: -source.quantity } }
                    );
                }
            }
        }
        // Case for older items where sources might be in a different field or handled differently
        else if (item.sources && item.sources.length > 0) {
             for (const source of item.sources) {
                if (source.purchase_item) {
                    await PurchaseItem.findByIdAndUpdate(
                        source.purchase_item,
                        { $inc: { remaining: -source.quantity } }
                    );
                }
            }
        }
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
