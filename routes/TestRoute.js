import express from "express";
import {testAnalysis} from "../controllers/TestController.js";
import {authMiddleware} from "../middlewares/authMiddleware.js"
const router = express.Router();

router.post("/analysis", authMiddleware, testAnalysis);

export default router;