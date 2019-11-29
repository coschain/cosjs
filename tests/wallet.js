// import {parseIntoNumber} from "../src/util";
const util = require("../lib/util");

const Cos = require("../lib/index");

let cos = new Cos("test", "https://testnode.contentos.io");


(async () => {
  let result = await cos.wallet.transactionInfo("88c7a9dd3320203e944c97a14cfe1e7839db60a74074bc4202c1e6e352f58f0f");
  console.log(result.info.trxWrap.sigTrx.trx);
})();
