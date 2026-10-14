const { Router } = require("express");
const { requireAuth, requireRole } = require("../middleware/auth");
const admin = require("../controllers/admin.controller");

const router = Router();
router.use(requireAuth, requireRole("ADMIN"));

router.get("/analytics", admin.getAnalytics);
router.get("/orders", admin.listOrders);
router.get("/users", admin.listUsers);
router.patch("/users/:userId/status", admin.setUserStatus);
router.patch("/sellers/:sellerId/status", admin.setSellerStatus);

module.exports = router;