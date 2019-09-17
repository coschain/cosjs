// @flow

import Cos from './cos'
import {crypto, transaction, grpc, raw_type, operation, grpc_service} from 'cos-grpc-js'

import * as util from './util'

const ApiService = grpc_service.ApiService;

class Wallet {
  accounts: {[string]: crypto.PrivKey};
  cos: Cos;
  constructor(cos: Cos) {
    this.accounts = new Map();
    this.cos = cos
  }

  addAccount(name: string, privateKey: string) {
    const priv = crypto.privKeyFromWIF(privateKey);
    if (priv === null) {
      throw new Error("Parse private key from wif");
    }
    this.accounts[name] = priv;
  }

  async broadcast(signTx: transaction.signed_transaction) {
    let trxId = signTx.id().getHexHash();
    const broadcastTrxRequest = new grpc.BroadcastTrxRequest();
    broadcastTrxRequest.setTransaction(signTx);
    return new Promise(resolve =>
      this.cos.grpc.unary(ApiService.BroadcastTrx, {
        request: broadcastTrxRequest,
        host: this.cos.provider,
        onEnd: res => {
          const { status, statusMessage, headers, message, trailers } = res
          if (status === this.cos.grpc.Code.OK && message) {
            let obj = message.toObject();
            obj.invoice.trxId = trxId;
            resolve(obj)
          } else {
            resolve({msg: statusMessage})
          }
        }
      })
    )
  }

  async signOps(account: string, ops: operation[]) {
    const privKey = this.accounts.get(account);
    if (!privKey) {
      throw new Error("Unknown account " + account);
    }
    const tx = new transaction.transaction();
    const nonParamsRequest = new grpc.NonParamsRequest();
    return new Promise(resolve =>
      this.cos.grpc.unary(ApiService.GetChainState, {
        request: nonParamsRequest,
        host: this.cos.provider,
        onEnd: res => {
          const { status, statusMessage, headers, message, trailers } = res;
          if (status === this.cos.grpc.Code.OK && message) {
            const chainState = message.toObject();
            tx.setRefBlockNum(chainState.state.dgpo.headBlockNumber & 0x7ff);
            let buffer = Buffer.from(chainState.state.dgpo.headBlockId.hash.toString(), 'base64');
            tx.setRefBlockPrefix(util.bytes2BigEndUint32(buffer.slice(8, 12)));
            const expiration = new raw_type.time_point_sec();
            expiration.setUtcSeconds(chainState.state.dgpo.time.utcSeconds + 30);
            tx.setExpiration(expiration);
            for (let op of ops) {
              tx.addOperation(op)
            }
            const signTx = new transaction.signed_transaction();
            signTx.setTrx(tx);
            const signature = new raw_type.signature_type();
            let s = signTx.sign(privKey, this.cos.chainId);
            signature.setSig(s);
            signTx.setSignature(signature);
            resolve(signTx);
          } else {
            resolve({msg: statusMessage});
          }
        }
      })
    )
  }

  async accountInfo (name: string) {
    let getAccountByNameRequest = new grpc.GetAccountByNameRequest();
    let accountName = new raw_type.account_name();
    accountName.setValue(name);
    getAccountByNameRequest.setAccountName(accountName);
    return new Promise(resolve =>
      this.cos.grpc.unary(ApiService.GetAccountByName, {
        request: getAccountByNameRequest,
        host: this.cos.provider,
        onEnd: res => {
          const { status, statusMessage, headers, message, trailers } = res
          if (status === this.cos.grpc.Code.OK && message) {
            let object = message.toObject()
            object.info.publicKey = message.getInfo().getPublicKey().toWIF()
            resolve(object)
          } else {
            resolve({})
          }
        }
      })
    )
  }

}

module.exports = Wallet;
