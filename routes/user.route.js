const express = require("express");
const {
  authenticateToken,
  roleMiddleware,
} = require("../middlewares/auth.middleware");
const {
  getUsers,
  getUser,
  downloadUsers,
  changeStatus,
  verifyUser,
  verifyLink,
  requestResetPassword,
  resetPassword,
  createUser,
  updateUser,
  deleteUser,
  deleteAllUsers,
  infoUser,
} = require("../controllers/user.controller");
const { validatePassword } = require("../middlewares/validate.middleware");
const apiLimiter = require("../middlewares/rateLimiter.middleware");

const route = express.Router();

route.get("/", getUsers);
route.get("/me", authenticateToken, getUser);
route.get(
  "/changeStatus/:email/:status",
  roleMiddleware("admin"),
  changeStatus
);
route.get("/verifyLink/:userId/:resetString", verifyLink);
route.get("/verify/:userId/:uniqueString", verifyUser);
route.post("/requestPasswordReset", requestResetPassword);
route.post("/resetPassword", resetPassword);
route.post("/info", apiLimiter, infoUser);
route.post("/", validatePassword, createUser);
route.put("/", authenticateToken, updateUser);
route.delete("/:email", authenticateToken, roleMiddleware("admin"), deleteUser);
route.delete(
  "/deleteAll/:userIds",
  authenticateToken,
  roleMiddleware("admin"),
  deleteAllUsers
);

module.exports = route;
