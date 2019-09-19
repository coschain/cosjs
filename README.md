# cosjs

A js sdk to interact with coschain for human beings.

## install

```shell
npm i @coschain/cosjs --save
```

## Usage

```js
const Cos = require('cosjs').default;
const cos = new Cos("main", "https://testnode.contento.io");
cos.wallet.addAccount("alice", "herPrivKey");

(async() => {
  let result = await cos.wallet.transfer("alice", "bob", "10.000000", "memo");
  console.log(result)
})();
```

## About

it is a wrapper for `cos-grpc-js`.

## Wallet Apis

* addAccount(name: string, privateKey: string)
* accountInfo(name: string)
* bpInfo(bp: string)
* blockProducerList(start: raw_type.vest, limit: number, lastBlockProducer: grpc.BlockProducerResponse)
* createAccount(creator: string, newAccount: string, pubkey: string)
* transfer(sender: string, receiver: string, amount: string, memo: string)
* cosToVest(account: string, amount: string)
* vestToCos(account: string, amount: string)
* cosToStake(account: string, amount: string, toAccount: string)
* stakeToCos(account: string, amount: string, toAccount: string)
* post(sender: string, title: string, content: string, tagsStr: string)
* contractCall(caller, owner, contract, method, args, payment)
* voteToBlockProducer(voterValue: string, bpValue: string, cancel: boolean)

