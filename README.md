# cosjs

A js sdk to interact with coschain for human beings.

## install

```shell
npm i @coschain/cosjs --save
```

## Usage

```js
const Cos = require('@coschain/cosjs').default;

let cos = new Cos("test", "https://testnode.contentos.io");

cos.wallet.addAccount("initminer", "4DjYx2KAGh1NP3dai7MZTLUBMMhMBPmwouKE8jhVSESywccpVZ");


(async() => {
    let result = await cos.wallet.transfer("initminer", "contentos", "1.000000", "memo");
    console.log(result);
})();
```

## About

It is a wrapper for `cos-grpc-js`.
The module is designed for Node.js and browser.

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
* contractCall(caller: string, owner: string, contract: string, method: string, args: string, payment: string)
* voteToBlockProducer(voterValue: string, bpValue: string, cancel: boolean)

