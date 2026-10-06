const { Router } = require("express");
const { register, login, getCurrentUser } = require("../controllers/auth.controller");
const { requireAuth } = require("../middleware/auth");

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", requireAuth, getCurrentUser);

module.exports = router;
