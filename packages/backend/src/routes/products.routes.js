const { Router } = require("express");
const { listCategories, listProducts, getProductById } = require("../controllers/products.controller");

const router = Router();

router.get("/categories", listCategories);
router.get("/", listProducts);
router.get("/:id", getProductById);

module.exports = router;
