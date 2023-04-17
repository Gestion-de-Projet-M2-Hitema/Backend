import express, { Router } from "express";
import multer from "multer";

// Import controllers
import {
  register,
  login,
  logout,
  update,
  upload,
  updatePassword,
  list,
  get
} from "../controllers/users";

// Import middlewares
import { authGuard } from "../middlewares/auth.middleware";

const m = multer();
const router: Router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/logout", [authGuard], logout);

router.get("/get/:id", [authGuard], get);

router.post("/updatePassword", [authGuard], updatePassword);
router.post("/upload", [authGuard, m.single("avatar")], upload);
router.post("/update", [authGuard], update);

router.get("/list", [authGuard], list);

export = router;
