const express = require("express");
const {
  getBots,
  createBot,
  deleteBot,
  updateBot,
} = require("../controllers/bot.controller");

const route = express.Router();

route.get("/", getBots);
route.post("/", createBot);
route.delete("/:botId", deleteBot);
route.put("/", updateBot);

module.exports = route;
