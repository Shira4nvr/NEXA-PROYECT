const { Router } = require("express");
const { listCities } = require("../controllers/locations.controller");

const router = Router();
router.get("/cities", listCities);

module.exports = router;
