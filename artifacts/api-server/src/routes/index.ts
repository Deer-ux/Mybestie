import { Router, type IRouter } from "express";
import healthRouter from "./health";
import bridgeguideRouter from "./bridgeguide";
import authRouter from "./auth";
import matchRouter from "./match";
import chatRouter from "./chat";
import usersRouter from "./users";
import inboxRouter from "./inbox";

const router: IRouter = Router();

router.use(healthRouter);
router.use(bridgeguideRouter);
router.use(authRouter);
router.use(matchRouter);
router.use(chatRouter);
router.use(usersRouter);
router.use(inboxRouter);

export default router;
