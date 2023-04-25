import * as net from "net";

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
  private _ip: string;
  private _port: number;
  private _options: TClientOptions;
  private _lastPacketId: number;
  private _callbacks: Map<number, TCommandCallback>;

  constructor(ip: string, port: number, options: TClientOptions = {}) {
    this._socket = new net.Socket();
    this._ip = ip;
    this._port = port;
    this._options = options;
    this._lastPacketId = 0;
    this._callbacks = new Map();
  }

  connect() {
    if (this._options.onClose) {
      this._socket.on("close", this._options.onClose);
    }

    if (this._options.onError) {
      this._socket.on("error", this._options.onError);
    }

    this._socket.on("data", this._onData.bind(this));
    this._socket.connect(this._port, this._ip, this._options.onConnect);
  }

  private _onData(data: Buffer) {
    const packet = data.toString();
    const response = JSON.parse(packet) as TCommandResult;
    const callback = this._callbacks.get(response.id);
    if (callback) {
      callback(response);
      this._callbacks.delete(response.id);
    }
  }

  send(
    method: string,
    params: (string | number)[],
    callback?: TCommandCallback
  ) {
    const id = this._lastPacketId++;
    const packet = JSON.stringify({ id, method, params }) + "\r\n";
    this._socket.write(packet);
    if (callback !== undefined) this._callbacks.set(id, callback);
  }
}

export default Client;
