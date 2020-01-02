const Cos = require("../lib/index");

let cos = new Cos("test", "https://testnode.contentos.io");
cos.wallet.addAccount("initminer", "4DjYx2KAGh1NP3dai7MZTLUBMMhMBPmwouKE8jhVSESywccpVZ");
cos.wallet.addAccount("plantagenet3", "4dCxMgJtqfuC4BsDseNZhuMBATwxijLqrhn4Gc51GyfoBRgCva");

(async () => {
  let result = await cos.wallet.post("plantagenet3", "AB problem", "The quick brown fox jumps over the lazy dog", "test");
  console.log(result);
  result = await cos.wallet.reply("initminer", "1577952973216665995", "good point");
  console.log(result);
  result = await cos.wallet.vote("initminer", "1577952973216665995");
  console.log(result)
})();
