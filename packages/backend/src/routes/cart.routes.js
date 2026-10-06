const { Router } = require("express");
const { requireAuth } = require("../middleware/auth");
const { getCart, addItem, updateItem, removeItem } = require("../controllers/cart.controller");

const router = Router();

router.use(requireAuth);

router.get("/", getCart);
router.post("/items", addItem);                    // body: { variantId, quantity }
router.patch("/items/:variantId", updateItem);      // body: { quantity }
router.delete("/items/:variantId", removeItem);

module.exports = router;
