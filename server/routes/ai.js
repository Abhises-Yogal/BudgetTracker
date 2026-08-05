// POST /api/ai/analyse  →  requireAuth → AiController.analyse

import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { analyse }     from "../controllers/AiController.js";

const router = Router();

router.post("/analyse", requireAuth, analyse);

export default router;
