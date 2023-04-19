import express, { Router } from "express";

// Import controllers
import { invite } from "../controllers/friends";

// Import middlewares
import { authGuard } from "../middlewares/auth.middleware";

const router: Router = express.Router();

router.post("/invite", [authGuard], invite);

export = router;
