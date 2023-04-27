import * as dgram from "node:dgram";
import * as fs from "node:fs/promises";
import { URL } from "node:url";

import LightStatus from "./LightStatus.js";
import Logger from "./Logger.js";

class Discovery {
  private static _ip = "239.255.255.250";
  private static _port = 1982;
  private static _cacheFilePath = new URL(
    "../discovery-cache.json",
    import.meta.url
  );
  private static _lightStatus = new Map<number, LightStatus>();
  private static _socket = dgram.createSocket("udp4");
  private static _onDiscovery?: (light: LightStatus) => void;
  private static _interval?: NodeJS.Timer;

  static start() {
    Discovery._loadCache().catch((reason) => Logger.debug("-", reason));
    Discovery._socket.on("listening", Discovery._onListening);
    Discovery._socket.on("message", Discovery._onMessage);
    Discovery._socket.on("error", Discovery._onError);
    Discovery._socket.on("close", Discovery._onClose);
    Discovery._socket.bind(Discovery._port, "0.0.0.0");
    Logger.info("Discovery", `started`);
  }

  static onDiscovery(callback: (light: LightStatus) => void) {
    Discovery._onDiscovery = callback;
  }

  static getLightStatus(id: number): LightStatus | undefined;
  static getLightStatus(): LightStatus[];
  static getLightStatus(id?: number) {
    if (typeof id === "number") return Discovery._lightStatus.get(id);
    return [...Discovery._lightStatus.values()];
  }

  private static async _cache() {
    const lightStatus = Discovery.getLightStatus();
    const json = JSON.stringify(lightStatus, null, 2);
    await fs.writeFile(Discovery._cacheFilePath, json, "utf8");
    Logger.debug("Discovery", "cache was successfully updated");
  }

  private static async _loadCache() {
    try {
      const json = await fs.readFile(Discovery._cacheFilePath, "utf8");
      const lightStatus = JSON.parse(json) as LightStatus[];
      for (const status of lightStatus) {
        Discovery._lightStatus.set(status.id, status);
        Discovery._onDiscovery?.(status);
      }
      Logger.info(
        "Discovery",
        `loaded ${lightStatus.length} item(s) from the cache`
      );
    } catch {
      Logger.warn("Discovery", "no cache file was found");
    }
  }

  private static _discover(this: void) {
    const M_SEARCH = [
      "M-SEARCH * HTTP/1.1",
      `HOST: ${Discovery._ip}:${Discovery._port}`,
      'MAN: "ssdp:discover"',
      "ST: wifi_bulb",
      "",
    ].join("\r\n");
    const M_SEARCH_BUFFER = Buffer.from(M_SEARCH, "ascii");
    Discovery._socket.send(
      M_SEARCH_BUFFER,
      0,
      M_SEARCH_BUFFER.length,
      Discovery._port,
      Discovery._ip
    );
  }

  private static _onListening(this: void) {
    Discovery._socket.addMembership(Discovery._ip);
    Discovery._interval = setInterval(Discovery._discover, 15e3);
    Logger.info("Discovery", "listening");
  }

  private static _onMessage(this: void, message: Buffer) {
    const text = message.toString();
    if (text.startsWith("HTTP/1.1 200 OK")) {
      const lightStatus = LightStatus.parse(text);
      const exists = Discovery._lightStatus.has(lightStatus.id);
      Discovery._lightStatus.set(lightStatus.id, lightStatus);
      if (exists) {
        Logger.debug("Discovery", "updated a light status");
      } else {
        Discovery._onDiscovery?.(lightStatus);
        Logger.info("Discovery", "discovered a new light");
      }
      Discovery._cache().catch((reason) => Logger.debug("-", reason));
    }
  }

  private static _onClose(this: void) {
    clearInterval(Discovery._interval);
    Logger.info("Discovery", "closed");
  }

  private static _onError(this: void, error: Error) {
    Logger.error("Discovery", "errored out");
    Logger.debug("-", error);
  }
}

export default Discovery;
