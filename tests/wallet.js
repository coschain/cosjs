// import Cos from '../src/cos'
const Cos = require("../lib/index").default

let cos = new Cos("test", "https://testnode.contentos.io");

cos.wallet.addAccount("initminer", "4DjYx2KAGh1NP3dai7MZTLUBMMhMBPmwouKE8jhVSESywccpVZ");


(async () => {
  let result = await cos.wallet.queryTable("liuxingfeiyu", "kryptontest", "arenas", "creator", '', 30, false);
  console.log(result);
})();
