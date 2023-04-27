import * as net from "node:net";

import { getExternalIP } from "./utilities.js";
import Logger from "./Logger.js";

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
    Logger.info("Bypass", "listening");
  }

  private _onConnection(socket: net.Socket) {
    socket.on("data", this._onSocketData.bind(this));
    socket.on("close", () => this._onSocketClose(socket));
    socket.on("error", this._onSocketError.bind(this));
    this._sockets.add(socket);
    Logger.info("Bypass", "a socket connected");
  }

  private _onDrop(data?: net.DropArgument | undefined) {
    Logger.debug("Bypass", data);
    Logger.info("Bypass", "dropped");
  }

  private _onClose() {
    Logger.info("Bypass", "closed");
  }

  private _onError(error: Error) {
    Logger.error("Bypass", "errored out", error);
  }

  private _onSocketData(data: Buffer) {
    Logger.debug("Bypass", data.toString());
    Logger.info("Bypass", "data recieved from a connected socket");
  }

  private _onSocketClose(socket: net.Socket) {
    this._sockets.delete(socket);
    Logger.info("Bypass", "a socket disconnected");
  }

  private _onSocketError(error: Error) {
    Logger.error("Bypass", "a socket errored out", error);
  }
}

export default Bypass;
