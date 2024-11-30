const express = require("express");
const {
  getReportObservationsDownload,
  getDownloadObservationsExcel,
  getDownloadMissingsExcel,
  getReportObservations,
  getReportMissings,
  getReportDetractions,
  getReporteCreditDebitNotes,
  getReportCorrelativity,
  getReportFactoring,
} = require("../controllers/report.controller");

const route = express.Router();

route.post("/observations/download", getReportObservationsDownload);

route.post("/observations/download-excel", getDownloadObservationsExcel);

route.post("/missings/download-excel", getDownloadMissingsExcel);

route.post("/observations/show", getReportObservations);

route.post("/observations/detractions", getReportDetractions);

route.post("/observations/notes", getReporteCreditDebitNotes);

route.post("/observations/correlativity", getReportCorrelativity);

route.post("/observations/factoring", getReportFactoring);

route.get(
  "/missings/:user_id/:period/:queryType/:docType/:currency/:account",
  getReportMissings
);

module.exports = route;
