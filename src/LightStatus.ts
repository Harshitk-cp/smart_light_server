import { COLOR_MODE } from "./enums";

class LightStatus {
  public readonly refresh_interval: number;
  public readonly ip: string;
  public readonly port: number;
  public readonly id: number;
  public readonly model: string;
  public readonly fw_ver: number;
  public readonly support: string[];
  public readonly power: boolean;
  public readonly bright: number;
  public readonly color_mode: COLOR_MODE;
  public readonly ct: number;
  public readonly rgb: number;
  public readonly hue: number;
  public readonly sat: number;
  public readonly name: string;

  private constructor(status: Record<string, string>) {
    const cacheControl = status["Cache-Control"];
    const maxAge = cacheControl.substring(8);
    const location = status.Location;
    const locationParts = location.substring(11).split(":");

    this.refresh_interval = parseInt(maxAge, 10);
    this.ip = locationParts[0];
    this.port = parseInt(locationParts[1], 10);
    this.id = parseInt(status.id, 16);
    this.model = status.model;
    this.fw_ver = parseInt(status.fw_ver, 10);
    this.support = status.support.split(" ");
    this.power = status.power === "on";
    this.bright = parseInt(status.bright, 10);
    this.color_mode = parseInt(status.color_mode, 10);
    this.ct = parseInt(status.ct, 10);
    this.rgb = parseInt(status.rgb, 10);
    this.hue = parseInt(status.hue, 10);
    this.sat = parseInt(status.sat, 10);
    this.name = status.name;
  }

  static parse(text: string) {
    const lines = text.trim().split("\r\n").slice(1);
    const entries = lines.map((line: string) => {
      const parts = line.split(": ");
      const key = parts[0];
      const value = parts[1];
      return [key, value] as [string, string];
    });
    const status = Object.fromEntries(entries);
    return new LightStatus(status);
  }
}

export default LightStatus;
