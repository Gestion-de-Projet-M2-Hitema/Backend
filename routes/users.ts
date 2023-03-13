import express, { Router } from "express";

const router: Router = express.Router();

// Import controller
const userController = require("../controllers").users;

router.post("/register", userController.register);

export = router;
