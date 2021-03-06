// @flow

import Cos from './cos'
import {crypto, transaction, grpc, raw_type, operation, grpc_service} from 'cos-grpc-js'

import * as util from './util'
import * as constant from './constant'

const bigInt = require('big-integer');

const ApiService = grpc_service.ApiService;

class Wallet {

  accounts: {[string]: crypto.PrivKey};
  cos: Cos;

  constructor(cos: Cos) {
    this.accounts = new Map();
    this.cos = cos
  }

  generateKeysWithMonemonic(): [string, string, string] {
    let mnemonic = crypto.generateMnemonic();
    let [pubkey, privkey] = this.generateKeysFromMnemonic(mnemonic);
    return [pubkey, privkey, mnemonic]
  }

  generateKeysFromMnemonic(words: string): [string, string] {
    const result = crypto.generateKeyPairsFromMnemonic(words);
    if (!result) {
      throw new Error("Parse mnemonic failed");
    }
    return [result.publicKey, result.privateKey];
  }

  addAccount(name: string, privateKey: string) {
    const priv = crypto.privKeyFromWIF(privateKey);
    if (priv === null) {
      throw new Error("Parse private key failed from wif");
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
          const {status, statusMessage, headers, message, trailers} = res;
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
    const privKey = this.accounts[account];
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

  async accountInfo(name: string, raw: ?boolean) {
    raw = raw || false;
    let getAccountByNameRequest = new grpc.GetAccountByNameRequest();
    let accountName = new raw_type.account_name();
    accountName.setValue(name);
    getAccountByNameRequest.setAccountName(accountName);
    return new Promise(resolve =>
      this.cos.grpc.unary(ApiService.GetAccountByName, {
        request: getAccountByNameRequest,
        host: this.cos.provider,
        onEnd: res => {
          const { status, statusMessage, headers, message, trailers } = res;
          if (status === this.cos.grpc.Code.OK && message) {
            if (raw) {
              resolve(message)
            } else {
              let object = message.toObject();
              object.info.publicKey = message.getInfo().getPublicKey().toWIF();
              resolve(object);
            }
          } else {
            resolve({msg: statusMessage});
          }
        }
      })
    )
  }

  async bpInfo(bp: string, raw: ?boolean) {
    raw = raw || false;
    let getBpByNameRequest = new grpc.GetBlockProducerByNameRequest();
    let accountName = new raw_type.account_name();
    accountName.setValue(bp);
    getBpByNameRequest.setBpName(accountName);
    return new Promise(resolve =>
      this.cos.grpc.unary(ApiService.GetBlockProducerByName, {
        request: getBpByNameRequest,
        host: this.cos.provider,
        onEnd: res => {
          const { status, statusMessage, headers, message, trailers } = res;
          if (status === this.cos.grpc.Code.OK && message) {
            if (raw) {
              resolve(message);
            } else {
              resolve(message.toObject());
            }
          } else {
            resolve({msg: statusMessage});
          }
        }
      })
    )
  }

  async transactionInfo(trx_id: string, raw: ?boolean) {
    raw = raw || false;
    let getTrxInfoByIdRequest = new grpc.GetTrxInfoByIdRequest();
    let trxId = new raw_type.sha256();
    trxId.setHexHash(trx_id);
    getTrxInfoByIdRequest.setTrxId(trxId);
    return new Promise(resolve =>
      this.cos.grpc.unary(ApiService.GetTrxInfoById, {
        request: getTrxInfoByIdRequest,
        host: this.cos.provider,
        onEnd: res => {
          const {status, statusMessage, headers, message, trailers} = res;
          if (status === this.cos.grpc.Code.OK && message) {
            if (raw) {
              resolve(message);
            } else {
              resolve(message.toObject());
            }
          } else {
            resolve({msg: statusMessage});
          }
        }
      })
    )
  }

  async chainInfo(raw: ?boolean) {
    raw = raw || false;
    const nonParamsRequest = new grpc.NonParamsRequest();
    return new Promise(resolve =>
      this.cos.grpc.unary(ApiService.GetChainState, {
        request: nonParamsRequest,
        host: this.cos.provider,
        onEnd: res => {
          const {status, statusMessage, headers, message, trailers} = res;
          if (status === this.cos.grpc.Code.OK && message) {
            if (raw) {
              resolve(message)
            } else {
              const chainState = message.toObject();
              resolve(chainState);
            }
          } else {
            resolve({msg: statusMessage});
          }
        }
      })
    );
  }

  async blockProducerList(start: raw_type.vest, limit: number, lastBlockProducer: grpc.BlockProducerResponse, raw: ?boolean) {
    raw = raw || false;
    const blockProducerRequest = new grpc.GetBlockProducerListByVoteCountRequest;
    blockProducerRequest.setLimit(limit);
    blockProducerRequest.setStart(start);
    blockProducerRequest.setLastBlockProducer(lastBlockProducer);
    return new Promise(resolve =>
      this.cos.grpc.unary(ApiService.GetBlockProducerListByVoteCount, {
        request: blockProducerRequest,
        host: this.cos.provider,
        onEnd: res => {
          const { status, statusMessage, headers, message, trailers } = res;
          if (status === this.cos.grpc.Code.OK && message) {
            if (raw) {
              resolve(message)
            } else {
              resolve(message.toObject())
            }
          } else {
            resolve({msg: statusMessage});
          }
        }
      })
    )
  }

  async createAccount(creator: string, newAccount: string, pubkey: string) {
    const pub = crypto.pubKeyFromWIF(pubkey);
    if (pub == null) {
      throw new Error("Parse public key failed from wif\"");
    }
    const pubkeyType = new raw_type.public_key_type();
    pubkeyType.setData(pub.data);
    const acop = new operation.account_create_operation();
    const c = new raw_type.coin();
    c.setValue(constant.MinCreateAccountFee);
    acop.setFee(c);
    const creatorType = new raw_type.account_name();
    creatorType.setValue(creator);
    acop.setCreator(creatorType);
    const an = new raw_type.account_name();
    an.setValue(newAccount);
    acop.setNewAccountName(an);
    acop.setPubKey(pubkeyType);
    const signTx = await this.signOps(creator, [acop]);
    return this.broadcast(signTx);
  }

  async transfer(sender: string, receiver: string, amount: string, memo: string) {
    let value = util.parseIntoNumber(amount);
    const top = new operation.transfer_operation();
    const fromAccount = new raw_type.account_name();
    fromAccount.setValue(sender);
    top.setFrom(fromAccount);
    const toAccount = new raw_type.account_name();
    toAccount.setValue(receiver);
    top.setTo(toAccount);
    const sendAmount = new raw_type.coin();
    sendAmount.setValue(value.toString());
    top.setAmount(sendAmount);
    top.setMemo(memo);

    const signTx = await this.signOps(sender, [top]);
    return this.broadcast(signTx);
  }

  async accountUpdate(owner: string, newPubKey: string) {
    const aop = new operation.account_update_operation()
    const accountType = new raw_type.account_name()
    accountType.setValue(owner)
    const pubkey = new raw_type.public_key_type()
    const pub = crypto.pubKeyFromWIF(newPubKey)
    pubkey.setData(pub.data)
    aop.setOwner(accountType)
    aop.setPubKey(pubkey)
    const signTx = await this.signOps(owner, [aop])
    return this.broadcast(signTx)
  }

  async cosToVest(account: string, amount: string) {
    let value = util.parseIntoNumber(amount);
    const top = new operation.transfer_to_vest_operation();
    const fromAccount = new raw_type.account_name();
    fromAccount.setValue(account);
    top.setFrom(fromAccount);
    const toAccount = new raw_type.account_name();
    toAccount.setValue(account);
    top.setTo(toAccount);
    const sendAmount = new raw_type.coin();
    sendAmount.setValue(value.toString());
    top.setAmount(sendAmount);

    const signTx = await this.signOps(account, [top]);
    return this.broadcast(signTx)
  }

  async vestToCos(account: string, amount: string) {
    let value = util.parseIntoNumber(amount);
    if (value.leq(bigInt(constant.MinVestToConvert))) {
      throw new Error('convert must greater than 1 COS')
    }
    const cop = new operation.convert_vest_operation();
    const fromAccount = new raw_type.account_name();
    fromAccount.setValue(account);
    cop.setFrom(fromAccount);
    const sendAmount = new raw_type.vest();
    sendAmount.setValue(value.toString());
    cop.setAmount(sendAmount);

    const signTx = await this.signOps(account, [cop]);
    return this.broadcast(signTx);
  }

  async cosToStake(account: string, amount: string, toAccount: string) {
    let value = util.parseIntoNumber(amount);
    const sop = new operation.stake_operation();
    const stakeFromAccount = new raw_type.account_name();
    stakeFromAccount.setValue(account);
    sop.setFrom(stakeFromAccount);
    const stakeToAccount = new raw_type.account_name();
    stakeToAccount.setValue(toAccount);
    sop.setTo(stakeToAccount);
    const sendAmount = new raw_type.coin();
    sendAmount.setValue(value.toString());
    sop.setAmount(sendAmount);

    const signTx = await this.signOps(account, [sop]);
    return this.broadcast(signTx);
  }

  async stakeToCos(account: string, amount: string, toAccount: string) {
    let value = util.parseIntoNumber(amount);

    const sop = new operation.un_stake_operation();
    const stakeFromAccount = new raw_type.account_name();
    stakeFromAccount.setValue(account);
    sop.setCreditor(stakeFromAccount);
    const stakeToAccount = new raw_type.account_name();
    stakeToAccount.setValue(toAccount);
    sop.setDebtor(stakeToAccount);
    const sendAmount = new raw_type.coin();
    sendAmount.setValue(value.toString());
    sop.setAmount(sendAmount);

    const signTx = await this.signOps(account, [sop]);
    return this.broadcast(signTx);
  }

  async post(sender: string, title: string, content: string, tagsStr: string) {
    const pop = new operation.post_operation();
    const senderAccount = new raw_type.account_name();
    senderAccount.setValue(sender)
    pop.setUuid(util.generateUUID(sender + content));
    pop.setOwner(senderAccount);
    pop.setTitle(title);
    pop.setContent(content);
    let beneficiary = new raw_type.beneficiary_route_type();
    const dappAccount = new raw_type.account_name();
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
    const signTx = await this.signOps(sender, [pop]);
    return this.broadcast(signTx)
  }

  async reply(sender: string, parent_uuid: string, content: string) {
    const rop = new operation.reply_operation();
    const senderAccount = new raw_type.account_name();
    senderAccount.setValue(sender);
    rop.setUuid(util.generateUUID(sender + content));
    rop.setOwner(senderAccount);
    rop.setContent(content);
    rop.setParentUuid(parent_uuid);
    let beneficiary = new raw_type.beneficiary_route_type();
    const dappAccount = new raw_type.account_name();
    dappAccount.setValue(constant.DefaultBeneficiary);
    beneficiary.setName(dappAccount);
    beneficiary.setWeight(constant.Percent);
    rop.addBeneficiaries(beneficiary);
    const signTx = await this.signOps(sender, [rop]);
    return this.broadcast(signTx)
  }

  async vote(voter: string, idx: string) {
    const vop = new operation.vote_operation();
    const voterAccount = new raw_type.account_name();
    voterAccount.setValue(voter);
    vop.setVoter(voterAccount);
    vop.setIdx(idx);
    const signTx = await this.signOps(voter, [vop]);
    return this.broadcast(signTx)
  }

  async contractCall(caller, owner, contract, method, args, payment) {
    const callOp = new operation.contract_apply_operation();
    const callerAccount = new raw_type.account_name();
    const ownerAccount = new raw_type.account_name();

    callerAccount.setValue(caller);
    ownerAccount.setValue(owner);
    callOp.setCaller(callerAccount);
    callOp.setOwner(ownerAccount);
    callOp.setContract(contract);
    callOp.setMethod(method);
    callOp.setParams(args);
    let value = util.parseIntoNumber(payment);
    const paymentCoin = new raw_type.coin();
    paymentCoin.setValue(value.toString());
    callOp.setAmount(paymentCoin);

    const signTx = await this.signOps(caller, [callOp]);
    return this.broadcast(signTx)
  }

  async voteToBlockProducer(voterValue: string, bpValue: string, cancel: boolean) {
    let bpVoteOp = new operation.bp_vote_operation();
    let bp = new raw_type.account_name();
    bp.setValue(bpValue);
    let voter = new raw_type.account_name();
    voter.setValue(voterValue);
    bpVoteOp.setVoter(voter);
    bpVoteOp.setBlockProducer(bp);
    bpVoteOp.setCancel(cancel);

    const signTx = await this.signOps(voterValue, [bpVoteOp]);
    return this.broadcast(signTx)
  }

  // this.$route.params.owner, this.$route.params.cName, tName, field, lowerBound, limit, this.isReverse)
  async queryTable(owner: string, contract: string, table: string, field: string, begin: string, limit: number, reverse: boolean) {
    let getTableContentRequest = new grpc.GetTableContentRequest();
    getTableContentRequest.setOwner(owner);
    getTableContentRequest.setContract(contract);
    getTableContentRequest.setTable(table);
    getTableContentRequest.setField(field);
    getTableContentRequest.setBegin(begin);
    getTableContentRequest.setCount(limit);
    getTableContentRequest.setReverse(reverse);
    return new Promise(resolve =>
      this.cos.grpc.unary(ApiService.QueryTableContent, {
        request: getTableContentRequest,
        host: this.cos.provider,
        onEnd: res => {
          const {status, statusMessage, headers, message, trailers} = res;
          if (status === this.cos.grpc.Code.OK && message) {
            let object = message.toObject();
            resolve(object);
          } else {
            resolve({msg: statusMessage});
          }
        }
      })
    )
  }

  async delegateVest(sender: string, receiver: string, amount: string, expiration: number) {
    let value = util.parseIntoNumber(amount);
    const op = new operation.delegate_vest_operation();
    const fromAccount = new raw_type.account_name();
    fromAccount.setValue(sender);
    op.setFrom(fromAccount);
    const toAccount = new raw_type.account_name();
    toAccount.setValue(receiver);
    op.setTo(toAccount);
    const delegateAmount = new raw_type.vest();
    delegateAmount.setValue(value.toString());
    op.setAmount(delegateAmount);
    op.setExpiration(expiration);

    const signTx = await this.signOps(sender, [op]);
    return this.broadcast(signTx);
  }

  async unDelegateVest(sender: string, orderId: number) {
    const op = new operation.un_delegate_vest_operation();
    const accountName = new raw_type.account_name();
    accountName.setValue(sender);
    op.setAccount(accountName);
    op.setOrderId(orderId);
    const signTx = await this.signOps(sender, [op]);
    return this.broadcast(signTx);
  }

  async vestDelegationOrderList(account: string, limit: number, is_lender: boolean) {
    const accountName = new raw_type.account_name();
    accountName.setValue(account);
    let req = new grpc.GetVestDelegationOrderListRequest();
    req.setAccount(accountName);
    req.setIsFrom(is_lender);
    req.setLimit(limit);
    req.setLastOrderId(0);
    return new Promise(resolve =>
        this.cos.grpc.unary(ApiService.GetVestDelegationOrderList, {
          request: req,
          host: this.cos.provider,
          onEnd: res => {
            const {status, statusMessage, headers, message, trailers} = res;
            if (status === this.cos.grpc.Code.OK && message) {
              let object = message.toObject();
              resolve(object);
            } else {
              resolve({msg: statusMessage});
            }
          }
        })
    )
  }
}

export default Wallet;
