const express = require("express");
const routeUser = require("./user.route");
const routeClaveSolAccount = require("./claveSolAccount.route");
const routeBot = require("./bot.route");
const routeFileManager = require("./fileManager.route");
const reportManager = require("./report.route");
const businessInfo = require("./businessInfo.route");
const auth = require("./auth.route");

const app = express();

app.use("/auth", auth);
app.use("/user", routeUser);
app.use("/claveSolAccount", routeClaveSolAccount);
app.use("/bot", routeBot);
app.use("/file", routeFileManager);
app.use("/report", reportManager);
app.use("/business-info", businessInfo);

module.exports = app;
