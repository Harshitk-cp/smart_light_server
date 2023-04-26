import * as dgram from "dgram";
import * as path from "path";
import * as fs from "fs/promises";
import LightStatus from "./LightStatus";

class Discovery {
  private static _ip = "239.255.255.250";
  private static _port = 1982;
  private static _cacheFilePath = path.join(
    __dirname,
    "..",
    "discovery-cache.json"
  );
  private static _devices = new Map<number, TDevice>();
  private static _lights = new Map<number, LightStatus>();
  private static _socket = dgram.createSocket("udp4");
  private static _onDiscovery?: (light: LightStatus) => void;
  private static _interval?: NodeJS.Timer;

  static start() {
    Discovery._socket.on("listening", Discovery._onListening);
    Discovery._socket.on("message", Discovery._onMessage);
    Discovery._socket.on("error", Discovery._onError);
    Discovery._socket.on("close", Discovery._onClose);
    Discovery._socket.bind(Discovery._port, "0.0.0.0");
  }

  static async _cache() {
    const lights = Discovery.getLights();
    const json = JSON.stringify(lights);
    await fs.writeFile(Discovery._cacheFilePath, json, "utf8");
  }

  static async _loadCache() {
    const json = await fs.readFile(Discovery._cacheFilePath, "utf8");
    const lights = JSON.parse(json) as LightStatus[];
    for (const light of lights) {
      Discovery._lights.set(light.id, light);
      Discovery._onDiscovery?.(light);
    }
    console.log(`[Discovery] > loaded ${lights.length} light(s) from cache`);
  }

  static onDiscovery(callback: (light: LightStatus) => void) {
    Discovery._onDiscovery = callback;
  }

  static getLight(id: number) {
    return Discovery._lights.get(id);
  }

  static getLights() {
    return [...Discovery._lights.values()];
  }

  private static _discover(this: void) {
    const M_SEARCH = [
      "M-SEARCH * HTTP/1.1",
      `HOST: ${Discovery._ip}:${Discovery._port}`,
      'MAN: "ssdp:discover"',
      "ST: wifi_bulb",
      "",
    ].join("\r\n");
    const M_SEARCH_BUFFER = Buffer.from(M_SEARCH);
    Discovery._socket.send(
      M_SEARCH_BUFFER,
      0,
      M_SEARCH_BUFFER.length,
      Discovery._port,
      Discovery._ip
    );
    console.log("[Discovery] > discovering...");
  }

  private static _onListening(this: void) {
    Discovery._socket.addMembership(Discovery._ip);
    // Discovery._loadCache().catch(console.error);
    setInterval(Discovery._discover, 5e3);
    console.log("[Discovery] > listening");
  }

  private static _onMessage(this: void, message: Buffer) {
    const text = message.toString();
    if (text.startsWith("HTTP/1.1 200 OK")) {
      const light = LightStatus.parse(text);
      if (Discovery._lights.has(light.id)) {
        console.log("[Discovery] > updated a light");
      } else {
        Discovery._onDiscovery?.(light);
        console.log("[Discovery] > discovered a light");
      }
      Discovery._lights.set(light.id, light);
      Discovery._cache().catch(console.error);
    }
  }

  private static _onClose(this: void) {
    clearInterval(Discovery._interval);
    console.log("[Discovery] > closed");
  }

  private static _onError(this: void, error: Error) {
    console.log("[Discovery] > error");
    console.log(error);
  }
}

export default Discovery;
