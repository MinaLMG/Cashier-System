const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");

router.get("/", productController.getAllProducts);
router.post("/", productController.createProduct);
router.put("/:id", productController.updateProduct);
router.delete("/:id", productController.deleteProduct);
router.post("/full", productController.createFullProduct);
router.put("/full/:id", productController.updateFullProduct);
router.get("/full", productController.getAllFullProducts);
router.get("/full/:id", productController.getFullProductById);

module.exports = router;
