const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const protect = require("../middleware/auth");

// Protected Routes
router.use(protect);

router.get("/", userController.getAllUsers);
router.post("/", userController.createUser);
router.put("/active-template", userController.updateActiveTemplate);
router.delete("/:id", userController.deleteUser);
router.put("/:id", userController.updateUser);

module.exports = router;
