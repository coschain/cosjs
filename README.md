# cosjs

A js sdk to interact with coschain for human beings.

## install

```shell
npm i @coschain/cosjs --save
```

## Usage

### Example: transfer

```js
const Cos = require('@coschain/cosjs').default;

let cos = new Cos("test", "https://testnode.contentos.io");

cos.wallet.addAccount("alice", "herPrivKey");


(async() => {
    let result = await cos.wallet.transfer("alice", "bob", "1.000000", "memo");
    console.log(result);
})();
```

### Example: contract call

I have deployed a simple hello contract on testnode. The contract [source](https://github.com/coschain/wasm-compiler/blob/master/contracts/hello/hello.cpp)


```js
const Cos = require('@coschain/cosjs').default;

let cos = new Cos("test", "https://testnode.contentos.io");

cos.wallet.addAccount("alice", "herPrivKey");


(async() => {
  let result = await cos.wallet.contractCall("alice", "initminer", "hello", "greet", "[]", "0.000000");
  console.log(result.invoice);
})();
```

#### tips

1. When trying to call a method of contract, the contract's creator should be known.
2. The parameter *args* is a stringify json. Just like `"[\"COC\", \"COC\", 10000000, 3]"`.
3. Deploying or calling a contract is a stamina-bound operation. You can stake some cos to acquire more stamina before calling a contract.

**For stake cos**

```js
(async() => {
  await cos.wallet.cosToStake("initminer", "1.000000", "initminer");
})();
```

### Example: query table

```js
const Cos = require('@coschain/cosjs').default;

let cos = new Cos("test", "https://testnode.contentos.io");

(async () => {
  let result = await cos.wallet.queryTable("liuxingfeiyu", "kryptontest", "arenas", "creator", '', 30, false);
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
* queryTable(owner: string, contract: string, table: string, field: string, begin: string, limit: number, reverse: boolean)
