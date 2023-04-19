import express, { Router } from "express";

const router: Router = express.Router();

// Import routes
const users = require("./users");
const servers = require("./servers");
const server_requests = require("./server_requests");
const channels = require("./channels");

// Define the routes
router.use("/users", users);
router.use("/servers", servers);
router.use("/server_requests", server_requests);
router.use("/channels", channels);

export = router;
