const express = require("express");
const multer = require("multer");
const {
  getFiles,
  getTotals,
  createFile,
  deleteFile,
  downloadFile,
  searchConstancePLE,
} = require("../controllers/fileManager.controller");

const route = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

route.get("/search/:user_id/:file_id/:comprobante", searchConstancePLE);
route.get("/totals/:user_id/:rucAccount/:option", getTotals);
route.get("/:user_id/:rucAccount/:option/:year/:type", getFiles);
route.get("/download/:option/:user_id/:file_id", downloadFile);
route.post("/upload", upload.array("files", 10), createFile);
route.delete("/:option/:user_id/:file_id", deleteFile);

module.exports = route;
