import * as net from "net";
import Bypass from "./Bypass";

type TClientOptions = {
  onConnect?: () => void;
  onClose?: () => void;
  onError?: () => void;
};

type TCommandResult = {
  id: number;
  result: string[];
};

type TCommandCallback = (result: TCommandResult) => void;

class Client {
  private _socket: net.Socket;
  private _bypass: Bypass;
  private _ip: string;
  private _port: number;
  private _options: TClientOptions;
  private _lastPacketId: number;
  private _callbacks: Map<number, TCommandCallback>;
  private _isConnected = false;

  constructor(ip: string, port: number, options: TClientOptions = {}) {
    this._socket = new net.Socket();
    this._bypass = new Bypass();
    this._ip = ip;
    this._port = port;
    this._options = options;
    this._lastPacketId = 0;
    this._callbacks = new Map();
  }

  connect() {
    this._socket.on("close", this._onClose.bind(this));
    this._socket.on("error", this._onError.bind(this));
    this._socket.on("data", this._onData.bind(this));
    this._socket.connect(this._port, this._ip, this._onConnect.bind(this));
    this._bypass.start();
  }

  private _onConnect() {
    this._isConnected = true;
    this.send(
      "set_music",
      [1, this._bypass.ip, this._bypass.port],
      false,
      () => {
        // setInterval(() => {
        //   const random_byte = () => Math.floor(Math.random() * 256);
        //   const random_color =
        //     (random_byte() << 16) | (random_byte() << 8) | random_byte();
        //   this.send("set_rgb", [random_color, "sudden", 0]);
        // }, 100);
      }
    );
    this._options.onConnect?.();
  }

  private _onData(data: Buffer) {
    const packets = data
      .toString()
      .split("\r\n")
      .filter((packet) => packet.length > 0);
    for (const packet of packets) {
      const response = JSON.parse(packet) as TCommandResult;
      const callback = this._callbacks.get(response.id);
      if (callback) {
        callback(response);
        this._callbacks.delete(response.id);
      }
    }
  }

  private _onClose() {
    this._isConnected = false;
    this._options.onClose?.();
  }

  private _onError() {
    this._options.onError?.();
  }

  send(
    method: string,
    params: (string | number)[],
    bypass = true,
    callback?: TCommandCallback
  ) {
    const id = this._lastPacketId++;
    const packet = JSON.stringify({ id, method, params }) + "\r\n";
    if (bypass) {
      this._bypass.send(packet);
    } else {
      this._socket.write(packet);
      if (callback !== undefined) this._callbacks.set(id, callback);
    }
  }

  get isConnected() {
    return this._isConnected;
  }
}

export default Client;
