const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");

// Used routes
router.get("/", productController.getAllProducts);
router.post("/full", productController.createFullProduct);
router.put("/full/:id", productController.updateFullProduct);
router.get("/full", productController.getAllFullProducts);
router.get("/full/:id", productController.getFullProductById);
router.get("/:id/check-usage", productController.checkProductUsageInPurchases);
router.get(
    "/:id/check-conversions-modifiable",
    productController.checkProductConversionsModifiable
);

// UNUSED ENDPOINTS - COMMENTED OUT
// router.post("/", productController.createProduct);
// router.put("/:id", productController.updateProduct);
// router.delete("/:id", productController.deleteProduct);

module.exports = router;
