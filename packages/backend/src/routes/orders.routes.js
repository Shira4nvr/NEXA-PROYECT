const { Router } = require("express");
const { requireAuth, requireRole } = require("../middleware/auth");
const { createOrder, listCustomerOrders } = require("../controllers/orders.controller");

const router = Router();

router.use(requireAuth, requireRole("CUSTOMER"));
router.get("/", listCustomerOrders);
router.post("/", createOrder);

module.exports = router;
