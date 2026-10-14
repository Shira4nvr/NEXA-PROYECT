const { Router } = require("express");
const { requireAuth } = require("../middleware/auth");
const addresses = require("../controllers/addresses.controller");

const router = Router();
router.use(requireAuth);
router.get("/", addresses.listAddresses);
router.post("/", addresses.createAddress);
router.patch("/:addressId", addresses.updateAddress);
router.delete("/:addressId", addresses.deleteAddress);

module.exports = router;
