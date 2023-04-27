import * as net from "node:net";

import Bypass from "./Bypass.js";

class Light {
  private _socket: net.Socket;
  private _bypass: Bypass | null;
  private _ip: string;
  private _port: number;
  private _options: TLightOptions;
  private _lastPacketId: number;
  private _callbacks: Map<number, TCommandCallback>;
  private _isConnected = false;

  constructor(ip: string, port: number, options: TLightOptions = {}) {
    this._socket = new net.Socket();
    this._bypass = null;
    this._ip = ip;
    this._port = port;
    this._options = options;
    this._lastPacketId = 0;
    this._callbacks = new Map();
  }

  connect() {
    this._socket.on("connect", this._onConnect.bind(this));
    this._socket.on("close", this._onClose.bind(this));
    this._socket.on("error", this._onError.bind(this));
    this._socket.on("data", this._onData.bind(this));
    this._socket.connect(this._port, this._ip);
  }

  private _createBypass() {
    this._bypass = new Bypass({
      onListening: () => {
        this.send(
          "set_music",
          [1, this._bypass!.ip, this._bypass!.port],
          false
        );
      },
      onClose: () => {
        setTimeout(() => this._createBypass(), 1e3);
      },
    });
    this._bypass.start();
  }

  private _onConnect() {
    this._isConnected = true;
    this._createBypass();
    this._options.onConnect?.();
  }

  private _onData(data: Buffer) {
    const packets = data.toString().trim().split("\r\n");
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
    this._bypass?.close();
    this._options.onClose?.();
  }

  private _onError() {
    this._options.onError?.();
  }

  send(method: string, params: (string | number)[], bypass: true): boolean;
  send(
    method: string,
    params: (string | number)[],
    bypass: false,
    callback?: TCommandCallback
  ): boolean;
  send(
    method: string,
    params: (string | number)[],
    bypass = true,
    callback?: TCommandCallback
  ) {
    const id = this._lastPacketId++;
    const packet = JSON.stringify({ id, method, params }) + "\r\n";
    if (bypass) {
      if (this._bypass?.isConnected) {
        this._bypass!.send(packet);
        return true;
      } else {
        return false;
      }
    } else {
      if (this._isConnected) {
        this._socket.write(packet);
        if (callback !== undefined) this._callbacks.set(id, callback);
        return true;
      } else {
        return false;
      }
    }
  }
}

export default Light;
