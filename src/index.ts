import express from "express";
import cors from "cors";

import { getLocalIPv4Address } from "./utilities.js";
import Discovery from "./Discovery.js";
import Logger from "./Logger.js";
import { LOG_LEVEL } from "./enums.js";
import Lights from "./Lights.js";
import apiRouter from "./controllers/api.js";

Logger.setLevel(LOG_LEVEL.DEBUG);

const ip = getLocalIPv4Address();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const app = express();

app.use(express.json());
app.use(cors());
app.use("/api", apiRouter);
app.listen(port, ip, () => {
  Logger.info("API", `endpoint: http://${ip}:${port}`);
});

Discovery.onDiscovery(Lights.onDiscovery);
Discovery.init();
