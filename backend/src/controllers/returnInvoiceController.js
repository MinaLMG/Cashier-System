const ReturnInvoice = require("../models/ReturnInvoice");
const ReturnItem = require("../models/ReturnItem");
const SalesItem = require("../models/SalesItem");
const SalesInvoice = require("../models/SalesInvoice");
const PurchaseItem = require("../models/PurchaseItem");
const HasVolume = require("../models/HasVolume");
const Product = require("../models/Product");

const updateProductPrices = require("../helpers/productPricing");
const updateProductRemaining = require("../helpers/updateProductRemaining");

// Helper function to generate serial number
const generateReturnInvoiceSerial = async (date) => {
    const dateObj = new Date(date);
    const dateStr = dateObj.toISOString().split("T")[0].replace(/-/g, "");
    const timeStr = dateObj
        .toTimeString()
        .split(" ")[0]
        .replace(/:/g, "")
        .substring(0, 4);

    // Base serial format: RTN-YYYYMMDD-HHMM-
    const baseSerial = `RTN-${dateStr}-${timeStr}-`;

    // Find the highest existing serial with this prefix
    const latestInvoice = await ReturnInvoice.findOne(
        { serial: new RegExp(`^${baseSerial}`) },
        { serial: 1 },
        { sort: { serial: -1 } }
    );

    let counter = 1;
    if (latestInvoice && latestInvoice.serial) {
        const parts = latestInvoice.serial.split("-");
        if (parts.length === 4) {
            counter = parseInt(parts[3], 10) + 1 || 1;
        }
    }

    return `${baseSerial}${counter}`;
};

// Get all return invoices
exports.getAllReturnInvoices = async (req, res) => {
    try {
        const invoices = await ReturnInvoice.find()
            .populate("sales_invoice")
            .populate("customer")
            .populate("user")
            .sort({ createdAt: -1 });
        res.status(200).json(invoices);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch return invoices." });
    }
};

// Get all return invoices with items (Full)
exports.getAllReturnInvoicesFull = async (req, res) => {
    try {
        const invoices = await ReturnInvoice.find()
            .populate("sales_invoice")
            .populate("customer")
            .populate("user")
            .sort({ date: -1 });

        const invoicesWithItems = await Promise.all(
            invoices.map(async (invoice) => {
                const items = await ReturnItem.find({
                    return_invoice: invoice._id,
                })
                    .populate("product")
                    .populate("volume");
                return {
                    ...invoice.toObject(),
                    items,
                };
            })
        );

        res.status(200).json({ items: invoicesWithItems });
    } catch (err) {
        console.error("Error fetching full return invoices:", err);
        res.status(500).json({ error: "Failed to fetch return invoices." });
    }
};

// Get all return invoices with financial data for reports
exports.getAllReturnInvoicesForReports = async (req, res) => {
    try {
        const invoices = await ReturnInvoice.find()
            .populate("sales_invoice")
            .populate("customer")
            .populate("user")
            .sort({ createdAt: -1 });

        // Calculate financial data for each return invoice
        const invoicesWithFinancialData = await Promise.all(
            invoices.map(async (invoice) => {
                // Calculate financial data for reports
                // Total Return Amount = Revenue Reduction (Negative Sales)
                // Total Loss = Profit Reduction (Negative Profit)
                // Cost Reversal = Revenue Reduction - Profit Reduction

                /*
                    Example: Sold for 100, Cost 80, Profit 20.
                    Return: Refund 100.
                    Revenue: -100.
                    Cost of Goods Sold (Reversed): -80.
                    Profit: -20.
                */

                return {
                    _id: invoice._id,
                    date: invoice.date,
                    customer: invoice.customer,
                    user: invoice.user,
                    serial: invoice.serial,
                    reason: invoice.reason,
                    notes: invoice.notes,
                    total_return_amount: invoice.total_return_amount,
                    total_revenue_loss: invoice.total_loss,
                    // Add fields to match sales invoice structure for reports
                    type: "return",
                    total_selling_price: -invoice.total_return_amount, // Negative Revenue
                    offer: 0, 
                    final_amount: -invoice.total_return_amount, // Net Revenue (Negative)
                    total_purchase_cost: -(invoice.total_return_amount + invoice.total_loss), // Cost Reversal (approx)
                    profit: invoice.total_loss, // Negative Profit
                };
            })
        );

        res.status(200).json({ items: invoicesWithFinancialData });
    } catch (err) {
        console.error("Error fetching return invoices for reports:", err);
        res.status(500).json({
            error: "Failed to fetch return invoices for reports.",
        });
    }
};

// Get return invoice by ID
exports.getReturnInvoiceById = async (req, res) => {
    try {
        const invoice = await ReturnInvoice.findById(req.params.id)
            .populate("sales_invoice")
            .populate("customer")
            .populate("user");

        if (!invoice) {
            return res.status(404).json({ error: "Return invoice not found." });
        }

        const items = await ReturnItem.find({ return_invoice: req.params.id })
            .populate("sales_item")
            .populate("product")
            .populate("volume");

        res.status(200).json({ invoice, items });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch return invoice." });
    }
};

// Get returns by sales invoice ID
exports.getReturnsBySalesInvoiceId = async (req, res) => {
    try {
        const { id } = req.params;
        const returnItems = await ReturnItem.find()
            .populate({
                path: "return_invoice",
                match: { sales_invoice: id },
            })
            .populate("product")
            .populate("volume");

        // Filter out items where return_invoice didn't match (populated as null)
        const validReturns = returnItems.filter(
            (item) => item.return_invoice != null
        );

        res.status(200).json(validReturns);
    } catch (err) {
        console.error("Error fetching returns for sales invoice:", err);
        res.status(500).json({ error: "Failed to fetch return items." });
    }
};

// Create return invoice for a sales item
// Create return invoice directly from invoice row data (for invoice-based sales)
exports.createReturnInvoiceFromInvoice = async (req, res) => {
    try {
        const {
            sales_item_id,
            quantity,
            return_volume_id,
            reason = "customer_request",
            notes,
            date, // Allow date to be provided
        } = req.body;
        console.log(req.body);
        // Validate date if provided
        const invoiceDate = date ? new Date(date) : new Date();
        console.log(invoiceDate);
        const today = new Date();

        if (invoiceDate > today) {
            return res.status(400).json({
                error: "تاريخ الفاتورة لا يمكن أن يكون في المستقبل",
            });
        }

        const invoice_id = (await SalesItem.findById(sales_item_id))
            .sales_invoice;
        if (!invoice_id || !return_volume_id || !quantity || !sales_item_id) {
            return res.status(400).json({
                error: "Invoice ID, return volume ID, sales item ID, and quantity are required.",
            });
        }

        // Get the invoice
        const invoice = await SalesInvoice.findById(invoice_id);
        if (!invoice) {
            return res.status(404).json({ error: "Invoice not found." });
        }

        // Always get sales items from the SalesItem table (source of truth)
        const salesItem = await SalesItem.findOne({
            sales_invoice: invoice._id,
            _id: sales_item_id,
        }).populate("product volume sales_invoice");
        if (!salesItem) {
            return res.status(404).json({
                error: "No sales items found for this sales item ID.",
            });
        }
        // Calculate total returnable quantity from to_return field
        const totalReturnableQuantity = salesItem.to_return;
        const returnHasVolume = await HasVolume.findOne({
            product: salesItem.product._id,
            volume: return_volume_id,
        });
        const originalVolume = await HasVolume.findOne({
            product: salesItem.product._id,
            volume: salesItem.volume,
        });
        if (!returnHasVolume) {
            return res.status(400).json({
                error: "Return volume not found for this product.",
            });
        }
        // Check if returnable quantity is greater than requested return quantity
        const requestReturnBaseQuantity = quantity * returnHasVolume.value;

        if (requestReturnBaseQuantity > totalReturnableQuantity) {
            return res.status(400).json({
                error: `Return quantity exceeds remaining returnable quantity. You have ${totalReturnableQuantity} base units available for return but trying to return ${quantity} ${
                    returnHasVolume.volume.name || "units"
                } (${requestReturnBaseQuantity} base units).`,
            });
        }

        // Start returning logic - Return to purchase item sources (LIFO - Last In First Out)
        const processingReturnBaseQuantity = quantity * returnHasVolume.value;
        let remainingToReturn = processingReturnBaseQuantity;

        // Find purchase items sorted by date (most recent first - LIFO)
        // the sales item contains the resources it has taken its items from
        // we need to get those purchase items, sort the form the most recent, fill each one with quantity taken from him or the remaining tor return
        const sources = salesItem.sources;
        await Promise.all(
            sources.map(async (source) => {
                source.purchase_item = await PurchaseItem.findById(
                    source.purchase_item
                ).populate("purchase_invoice");
            })
        );
        // sort the sources by the purchase invoice date (most recent first) and the createdAt date
        sources.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        sources.sort(
            (a, b) =>
                new Date(b.purchase_item.purchase_invoice.date) -
                new Date(a.purchase_item.purchase_invoice.date)
        );

        const returnSources = [];
        for (const source of sources) {
            const canReturn = Math.min(source.quantity, remainingToReturn);
            if (canReturn > 0) {
                source.quantity -= canReturn;
                returnSources.push({
                    purchase_item: source.purchase_item._id,
                    quantity: canReturn,
                });
                remainingToReturn -= canReturn;
            }
        }
        if (remainingToReturn > 0) {
            return res.status(400).json({
                error: `Insufficient sold quantities available for return. Only ${
                    processingReturnBaseQuantity - remainingToReturn
                } base units available for return.`,
            });
        }
        // throw new Error("test");
        // Update purchase item quantities (restore stock and reduce sold quantities)
        for (const update of returnSources) {
            await PurchaseItem.findByIdAndUpdate(update.purchase_item, {
                $inc: {
                    remaining: update.quantity,
                },
            });
        }

        // Calculate total loss before creating return invoice
        let totalLoss = 0;
        await Promise.all(
            returnSources.map(async (source) => {
                source.purchase_item = await PurchaseItem.findById(
                    source.purchase_item
                );
                source.volume = await HasVolume.findOne({
                    product: salesItem.product._id,
                    volume: source.purchase_item.volume,
                });
                // Calculate revenue loss for this source
                const purchasePrice =
                    (source.quantity * source.purchase_item.v_buy_price) /
                    source.volume.value;
                const sellingPrice =
                    (source.quantity * salesItem.v_price) /
                    originalVolume.value;
                const revenueLoss = purchasePrice - sellingPrice;
                totalLoss += revenueLoss;
            })
        );

        // Create return invoice with total_loss
        const returnInvoice = new ReturnInvoice({
            date: invoiceDate,
            sales_invoice: invoice._id,
            customer: invoice.customer,
            user: req.user?._id || null,
            reason,
            notes,

            total_return_amount:
                quantity *
                returnHasVolume.value *
                (salesItem.v_price / originalVolume.value),
            total_loss: totalLoss,
            serial: await generateReturnInvoiceSerial(new Date()),
        });

        await returnInvoice.save();

        // Create return item with sources and revenue loss
        const returnItem = new ReturnItem({
            date: invoiceDate,
            return_invoice: returnInvoice._id,
            sales_item: salesItem._id, // Link if single sales item
            product: salesItem.product._id,
            volume: return_volume_id,
            quantity,
            v_price:
                (salesItem.v_price / originalVolume.value) *
                returnHasVolume.value,
            returned_to_sources: returnSources.map((source) => ({
                purchase_item: source.purchase_item._id,
                quantity: source.quantity,
                purchase_price:
                    (source.quantity * source.purchase_item.v_buy_price) /
                    source.volume.value,
                selling_price:
                    (source.quantity * salesItem.v_price) /
                    originalVolume.value,
                revenue_loss:
                    (source.quantity * source.purchase_item.v_buy_price) /
                        source.volume.value -
                    (source.quantity * salesItem.v_price) /
                        originalVolume.value,
            })),
        });
        returnItem.total_revenue_loss = returnItem.returned_to_sources.reduce(
            (sum, source) => sum + source.revenue_loss,
            0
        );
        await returnItem.save();

        // Update sales item to_return field and sources (reduce by return quantity)
        const returnedBaseQuantity = quantity * returnHasVolume.value;
        salesItem.to_return -= returnedBaseQuantity;
        // The sources array was already updated in the loop above
        const updatedSalesItem = await salesItem.save();

        // Update product quantities and prices
        await updateProductPrices(salesItem.product._id);
        await updateProductRemaining(salesItem.product._id);

        res.status(201).json({
            message: "تم إنشاء فاتورة الإرجاع بنجاح",
            invoice: returnInvoice,
            item: returnItem,
        });
    } catch (err) {
        if (err.name === "ValidationError") {
            return res.status(400).json({
                error: err.message || "خطأ في التحقق من صحة البيانات",
            });
        }
        console.error("Error creating invoice-based return:", err);
        res.status(500).json({
            error: "حدث خطأ أثناء إنشاء فاتورة الإرجاع",
        });
    }
};

exports.createReturnInvoice = async (req, res) => {
    try {
        const {
            sales_item_id,
            volume_id,
            quantity,
            reason = "customer_request",
            notes,
            date, // Allow date to be provided
        } = req.body;

        // Validate date if provided
        const invoiceDate = date ? new Date(date) : new Date();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        invoiceDate.setHours(0, 0, 0, 0);

        if (invoiceDate > today) {
            return res.status(400).json({
                error: "تاريخ الفاتورة لا يمكن أن يكون في المستقبل",
            });
        }

        if (!sales_item_id || !volume_id || !quantity) {
            return res.status(400).json({
                error: "Sales item ID, volume ID, and quantity are required.",
            });
        }

        // Get the sales item
        const salesItem = await SalesItem.findById(sales_item_id)
            .populate("sales_invoice")
            .populate("product");

        if (!salesItem) {
            return res.status(404).json({ error: "Sales item not found." });
        }

        // Get volume conversion
        const hasVolume = await HasVolume.findOne({
            product: salesItem.product._id,
            volume: volume_id,
        });

        if (!hasVolume) {
            return res.status(400).json({
                error: "Volume not found for this product.",
            });
        }

        // Validate quantity
        if (quantity <= 0) {
            return res.status(400).json({
                error: "Return quantity must be greater than zero.",
            });
        }

        // Check if the volume can be returned (must be smaller or equal to sold volume)
        const salesHasVolume = await HasVolume.findOne({
            product: salesItem.product._id,
            volume: salesItem.volume,
        });

        if (!salesHasVolume) {
            return res.status(400).json({
                error: "Could not find sales item volume.",
            });
        }

        // Check if requested volume is smaller than or equal to sold volume
        if (hasVolume.value > salesHasVolume.value) {
            return res.status(400).json({
                error: "Cannot return larger volumes than what was sold.",
            });
        }

        // Calculate base quantity being returned
        const baseQuantityReturn = quantity * hasVolume.value;

        // Check if we have enough quantity to return from to_return field
        if (baseQuantityReturn > (salesItem.to_return || 0)) {
            return res.status(400).json({
                error: `Return quantity exceeds remaining returnable quantity. You have ${
                    salesItem.to_return || 0
                } base units available for return but trying to return ${quantity} units (${baseQuantityReturn} base units).`,
            });
        }

        // Find sources in reverse order (most recent to oldest) for returns
        const purchaseItems = await PurchaseItem.find({
            _id: { $in: salesItem.sources.map((s) => s.purchase_item) },
        }).populate("purchase_invoice");

        // Sort by purchase date (most recent first for return)
        purchaseItems.sort(
            (a, b) =>
                new Date(b.purchase_invoice.date) -
                new Date(a.purchase_invoice.date)
        );

        let remainingToReturn = baseQuantityReturn;
        const returnSources = [];
        const purchaseItemUpdates = [];

        // Return from most recent sources first
        for (const purchaseItem of purchaseItems) {
            if (remainingToReturn <= 0) break;

            // Find how much we took from this source in the original sale
            const originalSource = salesItem.sources.find(
                (s) =>
                    s.purchase_item.toString() === purchaseItem._id.toString()
            );

            if (!originalSource) continue;

            // Amount we can return (limited by how much we took + current remaining)
            const canReturn = Math.min(
                originalSource.quantity,
                remainingToReturn,
                purchaseItem.remaining
            );

            if (canReturn > 0) {
                originalSource.quantity -= canReturn;
                returnSources.push({
                    purchase_item: purchaseItem._id,
                    quantity: canReturn,
                });

                purchaseItemUpdates.push({
                    purchase_item: purchaseItem._id,
                    quantity_to_add: canReturn,
                });

                remainingToReturn -= canReturn;
            }
        }

        if (remainingToReturn > 0) {
            return res.status(400).json({
                error: "Insufficient stock available for return.",
            });
        }

        // Calculate total loss for this return
        let totalLoss = 0;
        for (const update of purchaseItemUpdates) {
            const purchaseItem = await PurchaseItem.findById(
                update.purchase_item
            );
            const hasVolume = await HasVolume.findOne({
                product: salesItem.product._id,
                volume: purchaseItem.volume,
            });

            if (hasVolume) {
                const purchasePrice =
                    (update.quantity_to_add * purchaseItem.v_buy_price) /
                    hasVolume.value;
                const sellingPrice =
                    (update.quantity_to_add * salesItem.v_price) /
                    hasVolume.value;
                const revenueLoss = purchasePrice - sellingPrice;
                totalLoss += revenueLoss;
            }
        }

        // Create return invoice with total_loss
        const returnInvoice = new ReturnInvoice({
            date: invoiceDate,
            sales_invoice: salesItem.sales_invoice,
            customer: salesItem.sales_invoice.customer,
            user: req.user?._id || null,
            reason,
            notes,
            total_return_amount: quantity * salesItem.v_price,
            total_loss: totalLoss,
            serial: await generateReturnInvoiceSerial(new Date()),
        });

        await returnInvoice.save();

        // Create return item
        const returnItem = new ReturnItem({
            return_invoice: returnInvoice._id,
            sales_item: salesItem._id,
            product: salesItem.product._id,
            volume: volume_id,
            quantity,
            v_price: salesItem.v_price,
            sources: returnSources,
        });

        await returnItem.save();

        // Update purchase item quantities (add back the returned quantities)
        for (const update of purchaseItemUpdates) {
            await PurchaseItem.findByIdAndUpdate(update.purchase_item, {
                $inc: { remaining: update.quantity_to_add },
            });
        }

        // Update sales item to_return field and sources (reduce by return quantity)
        const returnedBaseQuantity = quantity * hasVolume.value;
        salesItem.to_return -= returnedBaseQuantity;
        // The sources array was already updated in the loop above
        await salesItem.save();

        // Update product quantities and prices
        await updateProductPrices(salesItem.product._id);
        await updateProductRemaining(salesItem.product._id);

        // Populate the response
        const populatedInvoice = await ReturnInvoice.findById(returnInvoice._id)
            .populate("sales_invoice")
            .populate("customer");

        const populatedItem = await ReturnItem.findById(returnItem._id)
            .populate("sales_item")
            .populate("product")
            .populate("volume");

        res.status(201).json({
            message: "تم إنشاء فاتورة الإرجاع بنجاح",
            invoice: populatedInvoice,
            item: populatedItem,
        });
    } catch (err) {
        if (err.name === "ValidationError") {
            return res.status(400).json({
                error: err.message || "خطأ في التحقق من صحة البيانات",
            });
        }
        console.error("Error creating return invoice:", err);
        res.status(500).json({
            error: "حدث خطأ أثناء إنشاء فاتورة الإرجاع",
        });
    }
};

const { deleteReturnInvoiceInternal, updateAffectedProducts } = require("../helpers/invoiceCleanupHelper");

// Delete return invoice
exports.deleteReturnInvoice = async (req, res) => {
    try {
        const affectedProducts = await deleteReturnInvoiceInternal(req.params.id);
        
        if (affectedProducts.size === 0) {
            const invoice = await ReturnInvoice.findById(req.params.id);
            if (!invoice) return res.status(404).json({ error: "Return invoice not found." });
        }

        await updateAffectedProducts(affectedProducts);

        res.status(200).json({
            success: true,
            message: "تم حذف فاتورة الإرجاع بنجاح",
        });
    } catch (err) {
        console.error("Error deleting return invoice:", err);
        res.status(500).json({
            error: "حدث خطأ أثناء حذف فاتورة الإرجاع",
        });
    }
};
