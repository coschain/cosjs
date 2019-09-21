"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _cos = _interopRequireDefault(require("./cos"));

var _cosGrpcJs = require("cos-grpc-js");

var util = _interopRequireWildcard(require("./util"));

var constant = _interopRequireWildcard(require("./constant"));

function _getRequireWildcardCache() {
  if (typeof WeakMap !== "function") return null;
  var cache = new WeakMap();
  _getRequireWildcardCache = function () {
    return cache;
  };
  return cache;
}

function _interopRequireWildcard(obj) {
  if (obj && obj.__esModule) {
    return obj;
  }
  var cache = _getRequireWildcardCache();
  if (cache && cache.has(obj)) {
    return cache.get(obj);
  }
  var newObj = {};
  if (obj != null) {
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for (var key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
        if (desc && (desc.get || desc.set)) {
          Object.defineProperty(newObj, key, desc);
        } else {
          newObj[key] = obj[key];
        }
      }
    }
  }
  newObj.default = obj;
  if (cache) {
    cache.set(obj, newObj);
  }
  return newObj;
}

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {default: obj};
}

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
  try {
    var info = gen[key](arg);
    var value = info.value;
  } catch (error) {
    reject(error);
    return;
  }
  if (info.done) {
    resolve(value);
  } else {
    Promise.resolve(value).then(_next, _throw);
  }
}

function _asyncToGenerator(fn) {
  return function () {
    var self = this, args = arguments;
    return new Promise(function (resolve, reject) {
      var gen = fn.apply(self, args);

      function _next(value) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
      }

      function _throw(err) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
      }

      _next(undefined);
    });
  };
}

const bigInt = require('big-integer');

const ApiService = _cosGrpcJs.grpc_service.ApiService;

class Wallet {
  constructor(cos) {
    this.accounts = new Map();
    this.cos = cos;
  }

  addAccount(name, privateKey) {
    const priv = _cosGrpcJs.crypto.privKeyFromWIF(privateKey);

    if (priv === null) {
      throw new Error("Parse private key failed from wif");
    }

    this.accounts[name] = priv;
  }

  broadcast(signTx) {
    var _this = this;

    return _asyncToGenerator(function* () {
      let trxId = signTx.id().getHexHash();
      const broadcastTrxRequest = new _cosGrpcJs.grpc.BroadcastTrxRequest();
      broadcastTrxRequest.setTransaction(signTx);
      return new Promise(resolve => _this.cos.grpc.unary(ApiService.BroadcastTrx, {
        request: broadcastTrxRequest,
        host: _this.cos.provider,
        onEnd: res => {
          const {
            status,
            statusMessage,
            headers,
            message,
            trailers
          } = res;

          if (status === _this.cos.grpc.Code.OK && message) {
            let obj = message.toObject();
            obj.invoice.trxId = trxId;
            resolve(obj);
          } else {
            resolve({
              msg: statusMessage
            });
          }
        }
      }));
    })();
  }

  signOps(account, ops) {
    var _this2 = this;

    return _asyncToGenerator(function* () {
      const privKey = _this2.accounts[account];

      if (!privKey) {
        throw new Error("Unknown account " + account);
      }

      const tx = new _cosGrpcJs.transaction.transaction();
      const nonParamsRequest = new _cosGrpcJs.grpc.NonParamsRequest();
      return new Promise(resolve => _this2.cos.grpc.unary(ApiService.GetChainState, {
        request: nonParamsRequest,
        host: _this2.cos.provider,
        onEnd: res => {
          const {
            status,
            statusMessage,
            headers,
            message,
            trailers
          } = res;

          if (status === _this2.cos.grpc.Code.OK && message) {
            const chainState = message.toObject();
            tx.setRefBlockNum(chainState.state.dgpo.headBlockNumber & 0x7ff);
            let buffer = Buffer.from(chainState.state.dgpo.headBlockId.hash.toString(), 'base64');
            tx.setRefBlockPrefix(util.bytes2BigEndUint32(buffer.slice(8, 12)));
            const expiration = new _cosGrpcJs.raw_type.time_point_sec();
            expiration.setUtcSeconds(chainState.state.dgpo.time.utcSeconds + 30);
            tx.setExpiration(expiration);

            for (let op of ops) {
              tx.addOperation(op);
            }

            const signTx = new _cosGrpcJs.transaction.signed_transaction();
            signTx.setTrx(tx);
            const signature = new _cosGrpcJs.raw_type.signature_type();
            let s = signTx.sign(privKey, _this2.cos.chainId);
            signature.setSig(s);
            signTx.setSignature(signature);
            resolve(signTx);
          } else {
            resolve({
              msg: statusMessage
            });
          }
        }
      }));
    })();
  }

  accountInfo(name) {
    var _this3 = this;

    return _asyncToGenerator(function* () {
      let getAccountByNameRequest = new _cosGrpcJs.grpc.GetAccountByNameRequest();
      let accountName = new _cosGrpcJs.raw_type.account_name();
      accountName.setValue(name);
      getAccountByNameRequest.setAccountName(accountName);
      return new Promise(resolve => _this3.cos.grpc.unary(ApiService.GetAccountByName, {
        request: getAccountByNameRequest,
        host: _this3.cos.provider,
        onEnd: res => {
          const {
            status,
            statusMessage,
            headers,
            message,
            trailers
          } = res;

          if (status === _this3.cos.grpc.Code.OK && message) {
            let object = message.toObject();
            object.info.publicKey = message.getInfo().getPublicKey().toWIF();
            resolve(object);
          } else {
            resolve({
              msg: statusMessage
            });
          }
        }
      }));
    })();
  }

  bpInfo(bp) {
    var _this4 = this;

    return _asyncToGenerator(function* () {
      let getBpByNameRequest = new _cosGrpcJs.grpc.GetBlockProducerByNameRequest();
      let accountName = new _cosGrpcJs.raw_type.account_name();
      accountName.setValue(bp);
      getBpByNameRequest.setBpName(accountName);
      return new Promise(resolve => _this4.cos.grpc.unary(ApiService.GetBlockProducerByName, {
        request: getBpByNameRequest,
        host: _this4.cos.provider,
        onEnd: res => {
          const {
            status,
            statusMessage,
            headers,
            message,
            trailers
          } = res;

          if (status === _this4.cos.grpc.Code.OK && message) {
            resolve(message);
          } else {
            resolve({
              msg: statusMessage
            });
          }
        }
      }));
    })();
  }

  blockProducerList(start, limit, lastBlockProducer) {
    var _this5 = this;

    return _asyncToGenerator(function* () {
      const blockProducerRequest = new _cosGrpcJs.grpc.GetBlockProducerListByVoteCountRequest();
      blockProducerRequest.setLimit(limit);
      blockProducerRequest.setStart(start);
      blockProducerRequest.setLastBlockProducer(lastBlockProducer);
      return new Promise(resolve => _this5.cos.grpc.unary(ApiService.GetBlockProducerListByVoteCount, {
        request: blockProducerRequest,
        host: _this5.cos.provider,
        onEnd: res => {
          const {
            status,
            statusMessage,
            headers,
            message,
            trailers
          } = res;

          if (status === _this5.cos.grpc.Code.OK && message) {
            resolve(message);
          } else {
            resolve({
              msg: statusMessage
            });
          }
        }
      }));
    })();
  }

  createAccount(creator, newAccount, pubkey) {
    var _this6 = this;

    return _asyncToGenerator(function* () {
      const pub = _cosGrpcJs.crypto.pubKeyFromWIF(pubkey);

      if (pub == null) {
        throw new Error("Parse public key failed from wif\"");
      }

      const pubkeyType = new _cosGrpcJs.raw_type.public_key_type();
      pubkeyType.setData(pub.data);
      const acop = new _cosGrpcJs.operation.account_create_operation();
      const c = new _cosGrpcJs.raw_type.coin();
      c.setValue(constant.MinCreateAccountFee);
      acop.setFee(c);
      const creatorType = new _cosGrpcJs.raw_type.account_name();
      creatorType.setValue(creator);
      acop.setCreator(creatorType);
      const an = new _cosGrpcJs.raw_type.account_name();
      an.setValue(newAccount);
      acop.setNewAccountName(an);
      acop.setPubKey(pubkeyType);
      const signTx = yield _this6.signOps(creator, [acop]);
      return _this6.broadcast(signTx);
    })();
  }

  transfer(sender, receiver, amount, memo) {
    var _this7 = this;

    return _asyncToGenerator(function* () {
      let value = util.parseIntoNumber(amount);
      const top = new _cosGrpcJs.operation.transfer_operation();
      const fromAccount = new _cosGrpcJs.raw_type.account_name();
      fromAccount.setValue(sender);
      top.setFrom(fromAccount);
      const toAccount = new _cosGrpcJs.raw_type.account_name();
      toAccount.setValue(receiver);
      top.setTo(toAccount);
      const sendAmount = new _cosGrpcJs.raw_type.coin();
      sendAmount.setValue(value.toString());
      top.setAmount(sendAmount);
      top.setMemo(memo);
      const signTx = yield _this7.signOps(sender, [top]);
      return _this7.broadcast(signTx);
    })();
  }

  cosToVest(account, amount) {
    var _this8 = this;

    return _asyncToGenerator(function* () {
      let value = util.parseIntoNumber(amount);
      const top = new _cosGrpcJs.operation.transfer_to_vest_operation();
      const fromAccount = new _cosGrpcJs.raw_type.account_name();
      fromAccount.setValue(account);
      top.setFrom(fromAccount);
      const toAccount = new _cosGrpcJs.raw_type.account_name();
      toAccount.setValue(account);
      top.setTo(toAccount);
      const sendAmount = new _cosGrpcJs.raw_type.coin();
      sendAmount.setValue(value.toString());
      top.setAmount(sendAmount);
      const signTx = yield _this8.signOps(account, [top]);
      return _this8.broadcast(signTx);
    })();
  }

  vestToCos(account, amount) {
    var _this9 = this;

    return _asyncToGenerator(function* () {
      let value = util.parseIntoNumber(amount);

      if (value.leq(bigInt(constant.MinVestToConvert))) {
        alert('convert must greater than 1 COS');
        return;
      }

      const cop = new _cosGrpcJs.operation.convert_vest_operation();
      const fromAccount = new _cosGrpcJs.raw_type.account_name();
      fromAccount.setValue(account);
      cop.setFrom(fromAccount);
      const sendAmount = new _cosGrpcJs.raw_type.vest();
      sendAmount.setValue(value.toString());
      cop.setAmount(sendAmount);
      const signTx = yield _this9.signOps(account, [cop]);
      return _this9.broadcast(signTx);
    })();
  }

  cosToStake(account, amount, toAccount) {
    var _this10 = this;

    return _asyncToGenerator(function* () {
      let value = util.parseIntoNumber(amount);
      const sop = new _cosGrpcJs.operation.stake_operation();
      const stakeFromAccount = new _cosGrpcJs.raw_type.account_name();
      stakeFromAccount.setValue(account);
      sop.setFrom(stakeFromAccount);
      const stakeToAccount = new _cosGrpcJs.raw_type.account_name();
      stakeToAccount.setValue(toAccount);
      sop.setTo(stakeToAccount);
      const sendAmount = new _cosGrpcJs.raw_type.coin();
      sendAmount.setValue(value.toString());
      sop.setAmount(sendAmount);
      const signTx = yield _this10.signOps(account, [sop]);
      return _this10.broadcast(signTx);
    })();
  }

  stakeToCos(account, amount, toAccount) {
    var _this11 = this;

    return _asyncToGenerator(function* () {
      let value = util.parseIntoNumber(amount);
      const sop = new _cosGrpcJs.operation.un_stake_operation();
      const stakeFromAccount = new _cosGrpcJs.raw_type.account_name();
      stakeFromAccount.setValue(account);
      sop.setCreditor(stakeFromAccount);
      const stakeToAccount = new _cosGrpcJs.raw_type.account_name();
      stakeToAccount.setValue(toAccount);
      sop.setDebtor(stakeToAccount);
      const sendAmount = new _cosGrpcJs.raw_type.coin();
      sendAmount.setValue(value.toString());
      sop.setAmount(sendAmount);
      const signTx = yield _this11.signOps(account, [sop]);
      return _this11.broadcast(signTx);
    })();
  }

  post(sender, title, content, tagsStr) {
    var _this12 = this;

    return _asyncToGenerator(function* () {
      const pop = new _cosGrpcJs.operation.post_operation();
      const senderAccount = new _cosGrpcJs.raw_type.account_name();
      senderAccount.setValue(sender);
      pop.setUuid(util.generateUUID(sender + content));
      pop.setOwner(senderAccount);
      pop.setTitle(title);
      pop.setContent(content);
      let beneficiary = new _cosGrpcJs.raw_type.beneficiary_route_type();
      const dappAccount = new _cosGrpcJs.raw_type.account_name();
      dappAccount.setValue(constant.DefaultBeneficiary);
      beneficiary.setName(dappAccount);
      beneficiary.setWeight(constant.Percent);
      pop.addBeneficiaries(beneficiary);
      let tags = [];

      if (tagsStr.length > 0) {
        for (let s of tagsStr.split(',')) {
          tags.push(s.trim());
        }
      }

      pop.setTagsList(tags);
      const signTx = yield _this12.signOps(sender, [pop]);
      return _this12.broadcast(signTx);
    })();
  }

  contractCall(caller, owner, contract, method, args, payment) {
    var _this13 = this;

    return _asyncToGenerator(function* () {
      const callOp = new _cosGrpcJs.operation.contract_apply_operation();
      const callerAccount = new _cosGrpcJs.raw_type.account_name();
      const ownerAccount = new _cosGrpcJs.raw_type.account_name();
      callerAccount.setValue(caller);
      ownerAccount.setValue(owner);
      callOp.setCaller(callerAccount);
      callOp.setOwner(ownerAccount);
      callOp.setContract(contract);
      callOp.setMethod(method);
      callOp.setParams(args);
      let value = util.parseIntoNumber(payment);
      const paymentCoin = new _cosGrpcJs.raw_type.coin();
      paymentCoin.setValue(value.toString());
      callOp.setAmount(paymentCoin);
      const signTx = yield _this13.signOps(caller, [callOp]);
      return _this13.broadcast(signTx);
    })();
  }

  voteToBlockProducer(voterValue, bpValue, cancel) {
    var _this14 = this;

    return _asyncToGenerator(function* () {
      let bpVoteOp = new _cosGrpcJs.operation.bp_vote_operation();
      let bp = new _cosGrpcJs.raw_type.account_name();
      bp.setValue(bpValue);
      let voter = new _cosGrpcJs.raw_type.account_name();
      voter.setValue(voterValue);
      bpVoteOp.setVoter(voter);
      bpVoteOp.setBlockProducer(bp);
      bpVoteOp.setCancel(cancel);
      const signTx = yield _this14.signOps(voterValue, [bpVoteOp]);
      return _this14.broadcast(signTx);
    })();
  } // this.$route.params.owner, this.$route.params.cName, tName, field, lowerBound, limit, this.isReverse)


  queryTable(owner, contract, table, field, begin, limit, reverse) {
    var _this15 = this;

    return _asyncToGenerator(function* () {
      let getTableContentRequest = new _cosGrpcJs.grpc.GetTableContentRequest();
      getTableContentRequest.setOwner(owner);
      getTableContentRequest.setContract(contract);
      getTableContentRequest.setTable(table);
      getTableContentRequest.setField(field);
      getTableContentRequest.setBegin(begin);
      getTableContentRequest.setCount(limit);
      getTableContentRequest.setReverse(reverse);
      return new Promise(resolve => _this15.cos.grpc.unary(ApiService.QueryTableContent, {
        request: getTableContentRequest,
        host: _this15.cos.provider,
        onEnd: res => {
          const {
            status,
            statusMessage,
            headers,
            message,
            trailers
          } = res;

          if (status === _this15.cos.grpc.Code.OK && message) {
            let object = message.toObject();
            resolve(object);
          } else {
            resolve({
              msg: statusMessage
            });
          }
        }
      }));
    })();
  }

}

var _default = Wallet;
exports.default = _default;
