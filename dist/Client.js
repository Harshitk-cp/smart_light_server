"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const net = require("net");
class Client {
    constructor(ip, port) {
        this._socket = new net.Socket();
        this._ip = ip;
        this._port = port;
    }
}
exports.default = Client;
