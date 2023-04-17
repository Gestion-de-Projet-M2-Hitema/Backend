import express, { Router } from "express";

const router: Router = express.Router();

// Import routes
const users = require("./users");
const servers = require("./servers");

// Define the routes
router.use("/users", users);
router.use("/servers", servers);

export = router;
