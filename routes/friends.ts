import express, { Router } from "express";

// Import controllers
import { invite, accept, decline } from "../controllers/friends";

// Import middlewares
import { authGuard } from "../middlewares/auth.middleware";

const router: Router = express.Router();

router.post("/invite", [authGuard], invite);
router.post("/accept/:id", [authGuard], accept);
router.post("/decline/:id", [authGuard], decline);

export = router;
