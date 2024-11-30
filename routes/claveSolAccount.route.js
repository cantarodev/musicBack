const express = require("express");
const {
  getClaveSolAccounts,
  createClaveSolAccount,
  validateClaveSolAccount,
  deleteClaveSolAccount,
  deleteAllAccounts,
  updateClaveSolAccount,
} = require("../controllers/claveSolAccount.controller");

const route = express.Router();

route.get("/:user_id", getClaveSolAccounts);
route.post("/", createClaveSolAccount);
route.post("/validate", validateClaveSolAccount);
route.delete("/:account_id", deleteClaveSolAccount);
route.delete("/deleteAll/:accountIds", deleteAllAccounts);
route.put("/", updateClaveSolAccount);

module.exports = route;
