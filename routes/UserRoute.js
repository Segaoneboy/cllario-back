import express from "express";
import {UserController} from "../controllers/UserController.js";
import {authMiddleware} from "../middlewares/authMiddleware.js"
const router = express.Router();

router.get("/userinfo", authMiddleware, UserController);

export default router;