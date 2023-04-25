import * as express from "express";
import Client from "./Client";
import Light from "./Light";
import Discovery from "./Discovery";
import { getExternalIP } from "./utilities";

const LIGHT_CLIENTS = new Map<number, Client>();

const onDiscovery = (light: Light) => {
  const { ip, port, id } = light;
  const fid = light.id.toString(16).padStart(10, "0");

  const client = new Client(ip, port, {
    onConnect() {
      console.log(`[Client:${fid}] > connected`);
    },
    onClose() {
      const reconnect = () => {
        const light = Discovery.getLight(id);
        if (light) onDiscovery(light);
      };
      setTimeout(reconnect, 5e3);
      console.log(`[Client:${id}] > disconnected`);
    },
    onError() {
      console.log(`[Client:${id}] > errored out`);
    },
  });

  LIGHT_CLIENTS.set(id, client);
  client.connect();
};

Discovery.onDiscovery(onDiscovery);
Discovery.start();

const ip = getExternalIP() || "0.0.0.0";
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const app = express();

app.use(express.json());

app.get("/lights", (_, res) => {
  const lights = Discovery.getLights();
  res.json(lights);
});

app.post("/command", (req, res) => {
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

    const client = LIGHT_CLIENTS.get(body.id);
    if (client) {
      if (client.isConnected) {
        if (body.bypass) {
          client.send(body.method, body.params, true);
          res.json(["ok", "bypass"]);
        } else {
          client.send(body.method, body.params, false, ({ result }) => {
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

app.listen(port, ip, () => {
  console.log(`[API] > endpoint: http://${ip}:${port}`);
});
