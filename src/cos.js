// @flow

const sdk = require("cos-grpc-js");
const grpc = require("@improbable-eng/grpc-web").grpc;

import Wallet from './wallet'

class Cos {
  chainId: sdk.raw_type.chain_id;
  provider: string;
  grpc: grpc;
  wallet: Wallet;
  constructor(chain:string, provider:string){
    const chainId = new sdk.raw_type.chain_id();
    chainId.setChainEnv(chain);
    this.chainId = chainId;
    this.provider = provider;
    if (typeof window === 'undefined') {
      const NodeHttpTransport = require("@improbable-eng/grpc-web-node-http-transport")
        .NodeHttpTransport;
      grpc.setDefaultTransport(NodeHttpTransport());
    }
    this.grpc = grpc;
    this.wallet = new Wallet(this);
  }
}

export default Cos;
