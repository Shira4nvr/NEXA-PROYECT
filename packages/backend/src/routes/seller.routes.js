const { Router } = require("express");
const { requireAuth, requireRole } = require("../middleware/auth");
const { imageUpload } = require("../middleware/imageUpload");
const seller = require("../controllers/seller.controller");

const router = Router();
router.use(requireAuth, requireRole("SELLER"));

router.get("/profile", seller.getProfile);
router.get("/products", seller.listProducts);
router.post("/products", imageUpload.single("image"), seller.createProduct);
router.patch("/products/:productId", imageUpload.single("image"), seller.updateProduct);
router.delete("/products/:productId", seller.archiveProduct);

module.exports = router;