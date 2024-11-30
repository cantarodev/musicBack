const express = require("express");
const {
  getReportObservationsDownload,
  getReportObservations,
  getReportMissings,
} = require("../controllers/report.controller");

const route = express.Router();

route.post("/observations/download", getReportObservationsDownload);

route.post("/observations/show", getReportObservations);

route.get(
  "/missings/:user_id/:period/:queryType/:docType/:currency/:account",
  getReportMissings
);

module.exports = route;
