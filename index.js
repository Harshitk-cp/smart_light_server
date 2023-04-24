const dgram = require("dgram");
const net = require("net");

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

SOCKET.on("message", (msg, remote) => {
  msg = msg.toString();
  if (msg.startsWith("HTTP/1.1 200 OK")) {
    const lines = msg.split("\r\n");
    lines.shift();
    const light = Object.fromEntries(
      lines
        .map((line) => {
          const parts = line.split(": ");
          const key = parts[0];
          const value = parts[1];
          return [key, value];
        })
        .filter(([key, value]) => value !== undefined)
        .map(([key, value]) => {
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

let flag = false;
let sp = () => {};

const setupLight = (light) => {
  const client = new net.Socket();
  const address = light.Location.substring(11);
  const ip = address.split(":")[0];
  const port = parseInt(address.split(":")[1], 10);
  let timer = null;
  console.log({ address, ip, port, light });
  const sendPacket = (method, params) => {
    const id = Math.floor(Math.random() * 1e8);
    const packet = { id, method, params };
    const json = JSON.stringify(packet) + "\r\n";
    client.write(json);
  };
  sp = sendPacket;
  client.connect(port, ip, () => {
    console.log("Connected");
    sendPacket("get_prop", ["power", "not_exist", "bright"]);
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

const express = require("express");
var os = require("os");
const externalIp = (() => {
  const interfaces = Object.values(os.networkInterfaces()).flat();
  const interface = interfaces.find(({ address }) =>
    address.startsWith("192.168.")
  );
  return interface.address;
})();
const app = express();
const port = 3000;

app.get("/switch", (req, res) => {
  flag = !flag;
  sp("set_bright", [flag ? 100 : 1, "sudden", 100]);
  res.send(JSON.stringify({ status: flag ? "ON" : "OFF" }));
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Listening on port ${port}`);
});

console.log(`Endpoint: http://${externalIp}:${port}`);
