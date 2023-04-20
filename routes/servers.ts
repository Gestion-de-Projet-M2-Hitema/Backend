import express, { Router } from "express";

// Import controllers
import { create, update, remove, list, getAll } from "../controllers/servers";

// Import middlewares
import { authGuard } from "../middlewares/auth.middleware";

const router: Router = express.Router();

router.post("/create", [authGuard], create);
router.post("/update/:id", [authGuard], update);
router.post("/remove/:id", [authGuard], remove);

router.get("/list", [authGuard], list);
router.get("/getAll", [authGuard], getAll);

export = router;
