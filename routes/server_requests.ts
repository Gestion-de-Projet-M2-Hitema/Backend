import express, { Router } from "express";

// Import controllers
import { create, accept, decline, list } from "../controllers/server_requests";

// Import middlewares
import { authGuard } from "../middlewares/auth.middleware";

const router: Router = express.Router();

router.post("/create", [authGuard], create);
router.post("/accept/:id", [authGuard], accept);
router.post("/decline/:id", [authGuard], decline);

router.get("/list/:id", [authGuard], list);

export = router;
