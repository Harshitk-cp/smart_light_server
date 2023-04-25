import * as express from "express";
import * as os from "os";
import Client from "./Client";
import Light from "./Light";
import Discovery from "./Discovery";

Discovery.onDiscovery((light: Light) => setupLight(light));
Discovery.start();

let flag = 0;
let client = new Client("", 0);

const setupLight = (light: Light) => {
  const { ip, port } = light;

  client = new Client(ip, port, {
    onConnect() {
      console.log("A light connected");
      client.send("get_prop", ["power", "not_exist", "bright"]);
      client.send("set_bright", [1, "sudden", 100]);
    },
    onClose() {
      console.log("A light disconnected");
    },
    onError() {
      console.log("A light errored out");
    },
  });

  client.connect();
};

const externalIp = (() => {
  const interfaces = Object.values(os.networkInterfaces()).flat();
  const addresses = interfaces
    .filter((i): i is os.NetworkInterfaceInfo => i !== undefined)
    .map((i) => i.address);
  return addresses.find((a) => a.startsWith("192.168."));
})();
const app = express();
const port = 3000;

app.get("/lights", (_req, res) => {
  const lights = Discovery.getLights();
  res.send(JSON.stringify(lights));
});

app.get("/switch", (_req, res) => {
  flag = (flag + 1) % 3;
  client.send("set_rgb", [0xff << (flag * 8), "sudden", 100]);
  res.send(JSON.stringify({ status: ["RED", "GREEN", "BLUE"][2 - flag] }));
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Listening on port ${port}`);
});

console.log(`Endpoint: http://${externalIp}:${port}`);
