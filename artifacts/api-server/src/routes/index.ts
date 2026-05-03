import { Router, type IRouter } from "express";
import healthRouter from "./health";
import bridgeguideRouter from "./bridgeguide";
import authRouter from "./auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(bridgeguideRouter);
router.use(authRouter);

export default router;
