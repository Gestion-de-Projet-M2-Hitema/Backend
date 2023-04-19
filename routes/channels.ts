import express, { Router } from "express";

// Import controllers
import { createChannel, updateChannel, deleteChannel } from "../controllers/channels";

// Import middlewares
import { authGuard } from "../middlewares/auth.middleware";

const router: Router = express.Router();

router.post("/create", [authGuard], createChannel);
router.post("/update/:id", [authGuard], updateChannel);
router.post("/delete/:id", [authGuard], deleteChannel);

export = router;
