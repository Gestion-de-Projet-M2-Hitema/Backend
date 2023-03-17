import express, { Router } from "express";
import multer from "multer";

// Import controller
import { register, login, update, upload } from "../controllers/users";

const m = multer();
const router: Router = express.Router();

router.post("/upload", m.single('avatar'), upload);
router.post("/update", update);
router.post("/register", register);
router.post("/login", login);

export = router;
