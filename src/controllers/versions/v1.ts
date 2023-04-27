import { Router } from "express";

import Discovery from "../../Discovery.js";
import Lights from "../../Lights.js";

const v1Router = Router();

v1Router.get("/lights", (_, res) => {
  const lights = Discovery.getLightStatus();
  res.json(lights);
});

v1Router.post("/command", (req, res) => {
  try {
    const body = req.body as Record<string, unknown>;
    if (typeof body.id !== "number") throw Error();
    if (typeof body.method !== "string") throw Error();
    if (typeof body.bypass !== "boolean") throw Error();
    if (!Array.isArray(body.params)) throw Error();

    const paramCheck = (param: unknown): param is number | string => {
      const type = typeof param;
      return ["number", "string"].includes(type);
    };
    if (!body.params.every(paramCheck)) throw Error();

    const light = Lights.getLight(body.id);
    if (light) {
      if (light.isConnected) {
        if (body.bypass) {
          light.send(body.method, body.params, true);
          res.json(["ok", "bypass"]);
        } else {
          light.send(body.method, body.params, false, ({ result }) => {
            res.json(result);
          });
        }
      } else {
        res.json({ status: "failed", message: "light_is_offline" });
      }
    } else {
      res.json({ status: "failed", message: "light_not_found" });
    }
  } catch (error) {
    res.status(400).json({ error: "bad_request_body" });
    console.log(error);
  }
});

export default v1Router;
