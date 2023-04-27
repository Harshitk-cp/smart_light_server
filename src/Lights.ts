import Discovery from "./Discovery.js";
import Light from "./Light.js";
import LightStatus from "./LightStatus.js";
import Logger from "./Logger.js";

class Lights {
  private static _lights = new Map<number, Light>();

  static onDiscovery(this: void, lightStatus: LightStatus) {
    const { ip, port, id } = lightStatus;
    const light = new Light(ip, port, {
      onConnect() {
        Logger.info(Lights._label(id), "connected");
      },
      onClose() {
        setTimeout(() => Lights._reconnect(id), 5e3);
        Logger.info(Lights._label(id), "disconnected");
      },
      onError() {
        Logger.info(Lights._label(id), "errored out");
      },
    });

    Lights._lights.set(id, light);
    light.connect();
  }

  private static _label(this: void, id: number) {
    const formattedId = id.toString(16).padStart(10, "0");
    return `Light:${formattedId}`;
  }

  private static _reconnect(this: void, id: number) {
    const lightStatus = Discovery.getLightStatus(id);
    if (lightStatus) {
      Lights.onDiscovery(lightStatus);
      Logger.info(Lights._label(id), "reconnecting");
    }
  }

  static getLight(id: number) {
    return Lights._lights.get(id);
  }
}

export default Lights;
