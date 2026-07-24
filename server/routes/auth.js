// ROUTE layer — auth endpoints only.
// No middleware needed here; AuthController does its own input checks.

//  POST /api/auth/register  → AuthController.register
//  POST /api/auth/login     → AuthController.login


import { Router } from "express";
import * as AuthController from "../controllers/AuthController.js";

const router = Router();

router.post("/register", AuthController.register);
router.post("/login",    AuthController.login);

export default router;