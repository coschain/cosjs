"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _wallet = _interopRequireDefault(require("./wallet"));

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {default: obj};
}

const sdk = require("cos-grpc-js");

const grpc = require("@improbable-eng/grpc-web").grpc;

class Cos {
  constructor(chain, provider) {
    const chainId = new sdk.raw_type.chain_id();

    switch (chain) {
      case 'development':
        chainId.setChainEnv('main');
        break;

      case 'testing':
        chainId.setChainEnv('test');
        break;

      case 'production':
        chainId.setChainEnv('test');
        break;

      default:
        chainId.setChainEnv('main');
    }

    this.chainId = chainId;
    this.provider = provider;

    if (typeof window === 'undefined') {
      const NodeHttpTransport = require("@improbable-eng/grpc-web-node-http-transport").NodeHttpTransport;

      grpc.setDefaultTransport(NodeHttpTransport());
    }

    this.grpc = grpc;
    this.wallet = new _wallet.default(this);
  }

}

var _default = Cos;
exports.default = _default;
