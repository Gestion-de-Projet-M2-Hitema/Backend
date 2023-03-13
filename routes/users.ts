import express, { Router } from "express";

// Import controller
import { register, login } from "../controllers/users";

const router: Router = express.Router();

router.post("/register", register);
router.post("/login", login);

export = router;
