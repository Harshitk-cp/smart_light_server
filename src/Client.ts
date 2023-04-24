import * as net from "net";

class Client {
  private _socket: net.Socket;
  private _ip: string;
  private _port: number;

  constructor(ip: string, port: number) {
    this._socket = new net.Socket();
    this._ip = ip;
    this._port = port;
  }
}

export default Client;
