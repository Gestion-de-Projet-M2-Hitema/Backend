import express, { Router } from "express";

// Import controller
import { register, login, update } from "../controllers/users";

const router: Router = express.Router();

router.post("/update", update);
router.post("/register", register);
router.post("/login", login);

export = router;
