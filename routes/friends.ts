import express, { Router } from "express";

// Import controllers
import {
  invite,
  accept,
  decline,
  list,
  listRequests,
} from "../controllers/friends";

// Import middlewares
import { authGuard } from "../middlewares/auth.middleware";

const router: Router = express.Router();

router.post("/invite", [authGuard], invite);
router.post("/accept/:id", [authGuard], accept);
router.post("/decline/:id", [authGuard], decline);

router.get("/list", [authGuard], list);
router.get("/list-request", [authGuard], listRequests);

export = router;
