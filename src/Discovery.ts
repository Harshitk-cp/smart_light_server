import * as dgram from "dgram";
import Light from "./Light";

class Discovery {
  private static _ip = "239.255.255.250";
  private static _port = 1982;
  private static _lights = new Map<number, Light>();
  private static _socket = dgram.createSocket("udp4");
  private static _onDiscovery?: (light: Light) => void;
  private static _interval?: NodeJS.Timer;

  static start() {
    Discovery._socket.on("listening", Discovery._onListening);
    Discovery._socket.on("message", Discovery._onMessage);
    Discovery._socket.on("error", Discovery._onError);
    Discovery._socket.on("close", Discovery._onClose);
    Discovery._socket.bind(Discovery._port, "0.0.0.0");
  }

  static onDiscovery(callback: (light: Light) => void) {
    Discovery._onDiscovery = callback;
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
    Discovery._discover();
    setInterval(Discovery._discover, 15e3);
    console.log("[Discovery] > listening");
  }

  private static _onMessage(this: void, message: Buffer) {
    const text = message.toString();
    if (text.startsWith("HTTP/1.1 200 OK")) {
      const light = Light.fromText(text);
      if (Discovery._lights.has(light.id)) {
        console.log("[Discovery] > updated a light");
      } else {
        Discovery._onDiscovery?.(light);
        console.log("[Discovery] > discovered a light");
      }
      Discovery._lights.set(light.id, light);
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
