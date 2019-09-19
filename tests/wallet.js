import Cos from '../src/cos'

let cos = new Cos();

cos.wallet.addAccount("initminer", "4DjYx2KAGh1NP3dai7MZTLUBMMhMBPmwouKE8jhVSESywccpVZ");


(async () => {
  let result = await cos.wallet.contractCall("alice", "initminer", "helloworld", "greeting", [], "0.000000");
  console.log(result);
})();
