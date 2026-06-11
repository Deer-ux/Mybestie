import { Router, type IRouter } from "express";
import healthRouter from "./health";
import bridgeguideRouter from "./bridgeguide";
import authRouter from "./auth";
import matchRouter from "./match";
import chatRouter from "./chat";

const router: IRouter = Router();

router.use(healthRouter);
router.use(bridgeguideRouter);
router.use(authRouter);
router.use(matchRouter);
router.use(chatRouter);

export default router;
