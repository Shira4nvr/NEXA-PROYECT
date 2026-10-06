const { Router } = require("express");
const { requireAuth } = require("../middleware/auth");
const { createOrder } = require("../controllers/orders.controller");

const router = Router();

router.use(requireAuth);
router.post("/", createOrder);

module.exports = router;
