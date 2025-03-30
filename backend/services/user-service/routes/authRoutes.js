import express from "express";
import { registerUser, loginUser } from "../controllers/authController";
import authMiddleware from "../middleware/authMiddleware";
const router = express.Router();
router.post("/register", registerUser);
router.post("/login", loginUser);
// router.get("/user", authMiddleware, getUser);s
export default router;
