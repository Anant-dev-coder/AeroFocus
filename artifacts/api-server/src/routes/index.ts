import { Router, type IRouter } from "express";
import authRouter from "./auth";
import aeroRouter from "./aero";
import healthRouter from "./health";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(aeroRouter);

export default router;
