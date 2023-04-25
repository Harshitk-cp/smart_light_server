import { COLOR_MODE } from "./enums";

class Light {
  public readonly status_refresh_interval: number;
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

  private constructor(info: Record<string, string>) {
    const cacheControl = info["Cache-Control"];
    const maxAge = cacheControl.substring(8);
    const location = info.Location;
    const locationParts = location.substring(11).split(":");

    this.status_refresh_interval = parseInt(maxAge, 10);
    this.ip = locationParts[0];
    this.port = parseInt(locationParts[1], 10);
    this.id = parseInt(info.id, 16);
    this.model = info.model;
    this.fw_ver = parseInt(info.fw_ver, 10);
    this.support = info.support.split(" ");
    this.power = info.power === "on";
    this.bright = parseInt(info.bright, 10);
    this.color_mode = parseInt(info.color_mode, 10);
    this.ct = parseInt(info.ct, 10);
    this.rgb = parseInt(info.rgb, 10);
    this.hue = parseInt(info.hue, 10);
    this.sat = parseInt(info.sat, 10);
    this.name = info.name;
  }

  static fromText(text: string) {
    const lines = text.split("\r\n");
    lines.shift();

    const entries = lines
      .map((line: string) => {
        const parts = line.split(": ");
        const key = parts[0];
        const value = parts[1];
        return [key, value] as [string | undefined, string | undefined];
      })
      .filter((entry): entry is [string, string] => {
        return typeof entry[0] === "string" && typeof entry[1] === "string";
      });

    const info = Object.fromEntries(entries);
    return new Light(info);
  }
}

export default Light;
