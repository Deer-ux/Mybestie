import { Router, type IRouter } from "express";
import healthRouter from "./health";
import bridgeguideRouter from "./bridgeguide";

const router: IRouter = Router();

router.use(healthRouter);
router.use(bridgeguideRouter);

export default router;
