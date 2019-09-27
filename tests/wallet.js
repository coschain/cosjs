const Cos = require("../lib/index")

let cos = new Cos("", "");


(async () => {
  let result = await cos.wallet.accountInfo("initminer");
  console.log(result);
})();
