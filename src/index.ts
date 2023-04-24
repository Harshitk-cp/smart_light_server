import * as dgram from "dgram";
import * as net from "net";
import * as express from "express";
import * as os from "os";

const IP = "239.255.255.250";
const PORT = 1982;
const M_SEARCH = [
  "M-SEARCH * HTTP/1.1",
  `HOST: ${IP}:${PORT}`,
  'MAN: "ssdp:discover"',
  "ST: wifi_bulb",
].join("\r\n");
const M_SEARCH_BUFFER = Buffer.from(M_SEARCH);
const LIGHTS = new Map();

const SOCKET = dgram.createSocket("udp4");

SOCKET.on("message", (buffer: Buffer, _remote: dgram.RemoteInfo) => {
  const msg = buffer.toString();
  if (msg.startsWith("HTTP/1.1 200 OK")) {
    const lines = msg.split("\r\n");
    lines.shift();
    const light = Object.fromEntries(
      lines
        .map((line: string) => {
          const parts = line.split(": ");
          const key: string = parts[0]!;
          const value: string = parts[1]!;
          return [key, value];
        })
        .filter(([, value]: string[]) => value !== undefined)
        .map(([key, value]: string[]) => {
          if (/^\d+$/.test(value)) return [key, parseInt(value, 10)];
          if (key === "support") return [key, value.split(" ")];
          return [key, value];
        })
    );

    if (!LIGHTS.has(light.id)) {
      setupLight(light);
    }
    LIGHTS.set(light.id, light);
  }
});

SOCKET.on("listening", () => {
  SOCKET.addMembership(IP);
  SOCKET.send(M_SEARCH_BUFFER, 0, M_SEARCH_BUFFER.length, PORT, IP);
});

SOCKET.on("error", (error) => {
  console.log(error);
});

SOCKET.bind(PORT, "0.0.0.0");

let flag = 0;
let sp = (_method: string, _params: unknown[]) => {};

const setupLight = (light: any) => {
  const client = new net.Socket();
  const address = light.Location.substring(11);
  const ip = address.split(":")[0];
  const port = parseInt(address.split(":")[1], 10);
  let timer: number | undefined = undefined;
  console.log({ address, ip, port, light });
  const sendPacket = (method: string, params: unknown[]) => {
    const id = Math.floor(Math.random() * 1e8);
    const packet = { id, method, params };
    const json = JSON.stringify(packet) + "\r\n";
    client.write(json);
  };
  sp = sendPacket;
  client.connect(port, ip, () => {
    console.log("Connected");
    sendPacket("get_prop", ["power", "not_exist", "bright"]);
    sp("set_bright", [1, "sudden", 100]);
    // timer = setInterval(() => {
    //   const randomByte = () => Math.floor(Math.random() * 256);
    //   const rgb = [randomByte(), randomByte(), randomByte()];
    //   const color = (rgb[0] << 16) | (rgb[1] << 8) | rgb[2];
    //   sendPacket("set_rgb", [color, "sudden", 100]);
    //   flag = !flag;
    //   sendPacket("set_bright", [flag ? 1 : 100, "sudden", 100]);
    // }, 1000);
  });
  client.on("data", (data) => {
    console.log("Received: " + data);
    // client.destroy();
  });
  client.on("close", () => {
    console.log("Connection closed");
    clearInterval(timer);
  });
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

app.get("/switch", (_req, res) => {
  flag = (flag + 1) % 3;
  sp("set_rgb", [0xff << (flag * 8), "sudden", 100]);
  res.send(JSON.stringify({ status: ["RED", "GREEN", "BLUE"][2 - flag] }));
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Listening on port ${port}`);
});

console.log(`Endpoint: http://${externalIp}:${port}`);
