import * as net from "net";
import { getExternalIP } from "./utilities";

class Bypass {
  private static _ip = getExternalIP() || "0.0.0.0";
  private static _port = 54000;

  private _server: net.Server;
  private _port: number;
  private _sockets: Set<net.Socket>;

  constructor() {
    this._server = new net.Server();
    this._port = Bypass._port++;
    this._sockets = new Set();
  }

  get port() {
    return this._port;
  }

  get ip() {
    return Bypass._ip;
  }

  start() {
    this._server.on("connection", this._onConnection.bind(this));
    this._server.on("listening", this._onListening.bind(this));
    this._server.on("drop", this._onDrop.bind(this));
    this._server.on("close", this._onClose.bind(this));
    this._server.on("error", this._onError.bind(this));
    this._server.listen(this._port, Bypass._ip);
  }

  send(packet: string) {
    for (const socket of this._sockets) {
      socket.write(packet);
    }
  }

  private _onListening() {
    console.log("[Bypass] > listening...");
  }

  private _onConnection(socket: net.Socket) {
    socket.on("data", this._onSocketData.bind(this));
    socket.on("close", () => this._onSocketClose(socket));
    socket.on("error", this._onSocketError.bind(this));
    this._sockets.add(socket);
    console.log("[Bypass-socket] > connection");
  }

  private _onDrop(data?: net.DropArgument | undefined) {
    console.log(data);
    console.log("[Bypass] > dropped");
  }

  private _onClose() {
    console.log("[Bypass] > closed");
  }

  private _onError(error: Error) {
    console.log(error);
    console.log("[Bypass] > errored out");
  }

  private _onSocketData(data: Buffer) {
    console.log(data.toString());
    console.log("[Bypass-socket] > data recieved");
  }

  private _onSocketClose(socket: net.Socket) {
    this._sockets.delete(socket);
    console.log("[Bypass-socket] > closed");
  }

  private _onSocketError(error: Error) {
    console.log(error);
    console.log("[Bypass-socket] > errored out");
  }
}

export default Bypass;
