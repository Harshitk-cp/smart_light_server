import { Router } from "express";

import Discovery from "../../Discovery.js";
import Lights from "../../Lights.js";
import Logger from "../../Logger.js";

const v1Router = Router();

v1Router.get("/discovery", (_, res) => {
  const lights = Discovery.getLightStatus();
  res.json(lights);
});

v1Router.post("/command", (req, res) => {
  try {
    const body = req.body as Record<string, unknown>;
    if (typeof body.id !== "number") throw Error();
    if (typeof body.method !== "string") throw Error();
    if (!Array.isArray(body.params)) throw Error();

    const paramCheck = (param: unknown): param is number | string => {
      const type = typeof param;
      return ["number", "string"].includes(type);
    };
    if (!body.params.every(paramCheck)) throw Error();

    const light = Lights.getLight(body.id);
    if (light) {
      if (body.bypass) {
        const result = light.send(body.method, body.params, true);
        if (result) res.json({ status: "success" });
        else
          res.json({ status: "error", error: "bypass_channel_not_available" });
      } else {
        const callback = (result: TCommandResult) => {
          if (result.error) res.json({ status: "error", error: result.error });
          else res.json({ status: "success" });
        };
        const result = light.send(body.method, body.params, false, callback);
        if (!result) res.json({ status: "error", error: "light_is_offline" });
      }
    } else {
      res.json({ status: "error", error: "light_not_found" });
    }
  } catch (error) {
    res.status(400).json({ status: "error", error: "bad_request_body" });
    Logger.error(
      "-",
      error instanceof Error ? `${error.name}: ${error.message}` : error
    );
  }
});

export default v1Router;
