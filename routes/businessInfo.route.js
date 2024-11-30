const express = require("express");
const { getPeriodsByRuc } = require("../controllers/businessInfo.controller");
const router = express.Router();

router.get("/:tipo/:ruc", getPeriodsByRuc);

module.exports = router;
