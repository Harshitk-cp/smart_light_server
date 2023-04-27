import { Router } from "express";

import v1Router from "./versions/v1.js";

const apiRouter = Router();

apiRouter.use("/v1", v1Router);

export default apiRouter;
