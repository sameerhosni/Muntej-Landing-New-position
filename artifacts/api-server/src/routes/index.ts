import { Router, type IRouter } from "express";
import healthRouter from "./health";
import marketingRouter from "./marketing";

const router: IRouter = Router();

router.use(healthRouter);
router.use(marketingRouter);

export default router;
