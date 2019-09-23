const Cos = require("../lib/index")

let cos = new Cos("test", "https://testnode.contentos.io");


(async () => {
  let result = await cos.wallet.accountInfo("initminer");
  console.log(result);
})();
